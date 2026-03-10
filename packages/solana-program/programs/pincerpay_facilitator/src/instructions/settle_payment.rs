use anchor_lang::prelude::*;
use anchor_spl::token_interface::{self, Mint, TokenAccount, TokenInterface, TransferChecked};
use crate::errors::PincerPayError;
use crate::state::{ProgramConfig, MerchantAccount, SettlementRecord, TX_TYPE_DIRECT};

#[derive(Accounts)]
pub struct SettlePayment<'info> {
    #[account(
        mut,
        seeds = [ProgramConfig::SEED],
        bump = config.bump,
        has_one = authority,
    )]
    pub config: Account<'info, ProgramConfig>,

    #[account(
        mut,
        seeds = [MerchantAccount::SEED, &merchant_account.merchant_id],
        bump = merchant_account.bump,
        constraint = merchant_account.active @ PincerPayError::MerchantNotActive,
    )]
    pub merchant_account: Account<'info, MerchantAccount>,

    #[account(
        init,
        payer = authority,
        space = 8 + SettlementRecord::INIT_SPACE,
        seeds = [SettlementRecord::SEED, &config.nonce.to_le_bytes()],
        bump,
    )]
    pub settlement_record: Account<'info, SettlementRecord>,

    /// Agent's USDC token account (source)
    #[account(
        mut,
        token::mint = usdc_mint,
        token::authority = agent,
    )]
    pub agent_usdc_account: InterfaceAccount<'info, TokenAccount>,

    /// Merchant's USDC token account (destination)
    #[account(
        mut,
        token::mint = usdc_mint,
        constraint = merchant_usdc_account.key() == merchant_account.usdc_ata,
    )]
    pub merchant_usdc_account: InterfaceAccount<'info, TokenAccount>,

    /// Fee vault authority PDA — owns the fee vault token account
    /// CHECK: Verified via PDA seeds constraint. Not a signer — just validates fee_vault_usdc_account ownership.
    #[account(
        seeds = [ProgramConfig::FEE_VAULT_SEED],
        bump,
    )]
    pub fee_vault_authority: UncheckedAccount<'info>,

    /// Fee vault's USDC token account (receives fee portion)
    #[account(
        mut,
        token::mint = usdc_mint,
        token::authority = fee_vault_authority,
    )]
    pub fee_vault_usdc_account: InterfaceAccount<'info, TokenAccount>,

    /// USDC mint
    pub usdc_mint: InterfaceAccount<'info, Mint>,

    /// Agent wallet — must sign to authorize the transfer
    pub agent: Signer<'info>,

    /// Facilitator authority — must sign to authorize the settlement
    #[account(mut)]
    pub authority: Signer<'info>,

    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<SettlePayment>, amount: u64, decimals: u8) -> Result<()> {
    require!(amount > 0, PincerPayError::ZeroAmount);

    let fee_bps = ctx.accounts.config.fee_bps as u128;
    let fee_amount = (amount as u128)
        .checked_mul(fee_bps)
        .ok_or(PincerPayError::Overflow)?
        .checked_div(10_000)
        .ok_or(PincerPayError::Overflow)? as u64;
    let merchant_amount = amount
        .checked_sub(fee_amount)
        .ok_or(PincerPayError::Overflow)?;

    // CPI: TransferChecked from agent → merchant (net of fee)
    if merchant_amount > 0 {
        let cpi_accounts = TransferChecked {
            from: ctx.accounts.agent_usdc_account.to_account_info(),
            mint: ctx.accounts.usdc_mint.to_account_info(),
            to: ctx.accounts.merchant_usdc_account.to_account_info(),
            authority: ctx.accounts.agent.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token_interface::transfer_checked(cpi_ctx, merchant_amount, decimals)?;
    }

    // CPI: TransferChecked from agent → fee vault (fee portion)
    if fee_amount > 0 {
        let cpi_accounts = TransferChecked {
            from: ctx.accounts.agent_usdc_account.to_account_info(),
            mint: ctx.accounts.usdc_mint.to_account_info(),
            to: ctx.accounts.fee_vault_usdc_account.to_account_info(),
            authority: ctx.accounts.agent.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token_interface::transfer_checked(cpi_ctx, fee_amount, decimals)?;
    }

    // Update merchant stats (total_settled tracks the full amount including fee)
    let merchant = &mut ctx.accounts.merchant_account;
    merchant.total_settled = merchant
        .total_settled
        .checked_add(amount)
        .ok_or(PincerPayError::Overflow)?;
    merchant.settlement_count = merchant
        .settlement_count
        .checked_add(1)
        .ok_or(PincerPayError::Overflow)?;

    // Create settlement record
    let clock = Clock::get()?;
    let config = &mut ctx.accounts.config;
    let settlement = &mut ctx.accounts.settlement_record;
    settlement.nonce = config.nonce;
    settlement.agent = ctx.accounts.agent.key();
    settlement.merchant = merchant.owner;
    settlement.merchant_account = merchant.key();
    settlement.amount = amount;
    settlement.fee_amount = fee_amount;
    settlement.slot = clock.slot;
    settlement.tx_type = TX_TYPE_DIRECT;
    settlement.x402_tx_hash = [0u8; 64];
    settlement.timestamp = clock.unix_timestamp;
    settlement.bump = ctx.bumps.settlement_record;

    // Increment nonce
    config.nonce = config
        .nonce
        .checked_add(1)
        .ok_or(PincerPayError::Overflow)?;

    msg!(
        "Payment settled: {} → {} for {} tokens (fee: {}, nonce: {})",
        ctx.accounts.agent.key(),
        merchant.owner,
        merchant_amount,
        fee_amount,
        settlement.nonce,
    );

    Ok(())
}
