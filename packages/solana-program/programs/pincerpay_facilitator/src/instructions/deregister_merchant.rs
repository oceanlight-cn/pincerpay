use anchor_lang::prelude::*;
use crate::errors::PincerPayError;
use crate::state::{ProgramConfig, MerchantAccount};

#[derive(Accounts)]
pub struct DeregisterMerchant<'info> {
    #[account(
        seeds = [ProgramConfig::SEED],
        bump = config.bump,
        has_one = authority,
    )]
    pub config: Account<'info, ProgramConfig>,

    #[account(
        mut,
        seeds = [MerchantAccount::SEED, &merchant_account.merchant_id],
        bump = merchant_account.bump,
    )]
    pub merchant_account: Account<'info, MerchantAccount>,

    pub authority: Signer<'info>,
}

pub fn handler(ctx: Context<DeregisterMerchant>) -> Result<()> {
    let merchant = &mut ctx.accounts.merchant_account;
    require!(merchant.active, PincerPayError::MerchantNotActive);

    merchant.active = false;

    msg!("Merchant deregistered: {}", merchant.owner);

    Ok(())
}
