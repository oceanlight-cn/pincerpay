use anchor_lang::prelude::*;
use crate::state::{ProgramConfig, MerchantAccount};

#[derive(Accounts)]
#[instruction(merchant_id: [u8; 16])]
pub struct RegisterMerchant<'info> {
    #[account(
        seeds = [ProgramConfig::SEED],
        bump = config.bump,
        has_one = authority,
    )]
    pub config: Account<'info, ProgramConfig>,

    #[account(
        init,
        payer = authority,
        space = 8 + MerchantAccount::INIT_SPACE,
        seeds = [MerchantAccount::SEED, &merchant_id],
        bump,
    )]
    pub merchant_account: Account<'info, MerchantAccount>,

    /// Merchant's wallet address (receives ownership of the account)
    /// CHECK: Validated by the authority. Can be any valid pubkey.
    pub merchant_owner: UncheckedAccount<'info>,

    /// Merchant's USDC associated token account
    /// CHECK: Validated by the authority. Must be a valid ATA owned by merchant_owner.
    pub merchant_usdc_ata: UncheckedAccount<'info>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<RegisterMerchant>,
    merchant_id: [u8; 16],
    name: [u8; 32],
) -> Result<()> {
    let merchant = &mut ctx.accounts.merchant_account;
    merchant.merchant_id = merchant_id;
    merchant.owner = ctx.accounts.merchant_owner.key();
    merchant.usdc_ata = ctx.accounts.merchant_usdc_ata.key();
    merchant.name = name;
    merchant.active = true;
    merchant.total_settled = 0;
    merchant.settlement_count = 0;
    merchant.bump = ctx.bumps.merchant_account;

    msg!("Merchant registered: {}", ctx.accounts.merchant_owner.key());

    Ok(())
}
