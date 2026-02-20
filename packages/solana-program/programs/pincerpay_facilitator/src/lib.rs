use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod state;

use instructions::*;

// Placeholder program ID — replace after `anchor deploy`
declare_id!("E53zfNo9DYxAUCu37bA2NakJMMbzPFszjgB5kPaTMvF3");

#[program]
pub mod pincerpay_facilitator {
    use super::*;

    /// Initialize program config. Can only be called once.
    pub fn initialize(ctx: Context<Initialize>, fee_bps: u16) -> Result<()> {
        instructions::initialize::handler(ctx, fee_bps)
    }

    /// Register a merchant with an on-chain account.
    pub fn register_merchant(
        ctx: Context<RegisterMerchant>,
        merchant_id: [u8; 16],
        name: [u8; 32],
    ) -> Result<()> {
        instructions::register_merchant::handler(ctx, merchant_id, name)
    }

    /// Deregister (deactivate) a merchant account.
    pub fn deregister_merchant(ctx: Context<DeregisterMerchant>) -> Result<()> {
        instructions::deregister_merchant::handler(ctx)
    }

    /// Settle a payment: CPI TransferChecked from agent → merchant.
    /// Both agent and facilitator authority must sign.
    pub fn settle_payment(
        ctx: Context<SettlePayment>,
        amount: u64,
        decimals: u8,
    ) -> Result<()> {
        instructions::settle_payment::handler(ctx, amount, decimals)
    }

    /// Record an off-chain x402 settlement on-chain for audit.
    /// Authority-only — no token transfer (already happened via x402).
    pub fn record_x402_settlement(
        ctx: Context<RecordX402Settlement>,
        amount: u64,
        x402_tx_hash: [u8; 64],
    ) -> Result<()> {
        instructions::record_x402_settlement::handler(ctx, amount, x402_tx_hash)
    }
}
