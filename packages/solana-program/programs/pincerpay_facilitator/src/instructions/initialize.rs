use anchor_lang::prelude::*;
use crate::errors::PincerPayError;
use crate::state::ProgramConfig;

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + ProgramConfig::INIT_SPACE,
        seeds = [ProgramConfig::SEED],
        bump,
    )]
    pub config: Account<'info, ProgramConfig>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<Initialize>, fee_bps: u16) -> Result<()> {
    require!(fee_bps <= 10_000, PincerPayError::InvalidFeeBps);

    let config = &mut ctx.accounts.config;
    config.authority = ctx.accounts.authority.key();
    config.fee_bps = fee_bps;
    config.nonce = 0;
    config.bump = ctx.bumps.config;

    msg!("PincerPay facilitator initialized. Authority: {}, Fee: {} bps",
        config.authority, fee_bps);

    Ok(())
}
