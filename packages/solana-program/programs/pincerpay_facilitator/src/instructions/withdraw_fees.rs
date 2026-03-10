use anchor_lang::prelude::*;
use anchor_spl::token_interface::{self, Mint, TokenAccount, TokenInterface, TransferChecked};
use crate::errors::PincerPayError;
use crate::state::ProgramConfig;

#[derive(Accounts)]
pub struct WithdrawFees<'info> {
    #[account(
        seeds = [ProgramConfig::SEED],
        bump = config.bump,
        has_one = authority,
    )]
    pub config: Account<'info, ProgramConfig>,

    /// Fee vault authority PDA — signs the CPI transfer out of the fee vault
    /// CHECK: Verified via PDA seeds constraint. Used as signer for the CPI transfer.
    #[account(
        seeds = [ProgramConfig::FEE_VAULT_SEED],
        bump,
    )]
    pub fee_vault_authority: UncheckedAccount<'info>,

    /// Fee vault's USDC token account (source)
    #[account(
        mut,
        token::mint = usdc_mint,
        token::authority = fee_vault_authority,
    )]
    pub fee_vault_usdc_account: InterfaceAccount<'info, TokenAccount>,

    /// Destination USDC token account (receives withdrawn fees)
    #[account(
        mut,
        token::mint = usdc_mint,
    )]
    pub destination_usdc_account: InterfaceAccount<'info, TokenAccount>,

    pub usdc_mint: InterfaceAccount<'info, Mint>,

    /// Facilitator authority — must sign to authorize the withdrawal
    pub authority: Signer<'info>,

    pub token_program: Interface<'info, TokenInterface>,
}

pub fn handler(ctx: Context<WithdrawFees>, amount: u64) -> Result<()> {
    require!(amount > 0, PincerPayError::ZeroAmount);

    let vault_balance = ctx.accounts.fee_vault_usdc_account.amount;
    require!(
        vault_balance >= amount,
        PincerPayError::InsufficientFeeVaultBalance
    );

    // PDA-signed CPI: TransferChecked from fee vault → destination
    let bump = ctx.bumps.fee_vault_authority;
    let signer_seeds: &[&[&[u8]]] = &[&[ProgramConfig::FEE_VAULT_SEED, &[bump]]];

    let cpi_accounts = TransferChecked {
        from: ctx.accounts.fee_vault_usdc_account.to_account_info(),
        mint: ctx.accounts.usdc_mint.to_account_info(),
        to: ctx.accounts.destination_usdc_account.to_account_info(),
        authority: ctx.accounts.fee_vault_authority.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);

    let decimals = ctx.accounts.usdc_mint.decimals;
    token_interface::transfer_checked(cpi_ctx, amount, decimals)?;

    msg!("Withdrew {} from fee vault to {}", amount, ctx.accounts.destination_usdc_account.key());

    Ok(())
}
