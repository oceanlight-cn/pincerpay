use anchor_lang::prelude::*;
use crate::errors::PincerPayError;
use crate::state::{ProgramConfig, MerchantAccount, SettlementRecord, TX_TYPE_X402_RECORDED};

#[derive(Accounts)]
pub struct RecordX402Settlement<'info> {
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

    /// Agent wallet address (not a signer — this is a recording of a past settlement)
    /// CHECK: This is the agent's address from the off-chain x402 settlement. No signing required.
    pub agent: UncheckedAccount<'info>,

    /// Facilitator authority — must sign to authorize the recording
    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<RecordX402Settlement>,
    amount: u64,
    x402_tx_hash: [u8; 64],
) -> Result<()> {
    require!(amount > 0, PincerPayError::ZeroAmount);

    // Verify tx hash is not all zeros (must be a real x402 settlement hash)
    let all_zero = x402_tx_hash.iter().all(|&b| b == 0);
    require!(!all_zero, PincerPayError::InvalidX402TxHash);

    // Update merchant stats (recording only — no token transfer)
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
    settlement.slot = clock.slot;
    settlement.tx_type = TX_TYPE_X402_RECORDED;
    settlement.x402_tx_hash = x402_tx_hash;
    settlement.timestamp = clock.unix_timestamp;
    settlement.bump = ctx.bumps.settlement_record;

    // Increment nonce
    config.nonce = config
        .nonce
        .checked_add(1)
        .ok_or(PincerPayError::Overflow)?;

    msg!(
        "x402 settlement recorded: agent={}, merchant={}, amount={}, nonce={}",
        ctx.accounts.agent.key(),
        merchant.owner,
        amount,
        settlement.nonce,
    );

    Ok(())
}
