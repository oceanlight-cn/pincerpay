use anchor_lang::prelude::*;

/// On-chain merchant account. PDA seeds: ["merchant", merchant_id]
#[account]
#[derive(InitSpace)]
pub struct MerchantAccount {
    /// UUID bytes identifying the merchant in the off-chain DB
    pub merchant_id: [u8; 16],
    /// Merchant's wallet (owner authority)
    pub owner: Pubkey,
    /// Merchant's USDC associated token account for receiving payments
    pub usdc_ata: Pubkey,
    /// UTF-8 encoded merchant name (zero-padded)
    pub name: [u8; 32],
    /// Whether this merchant account is active
    pub active: bool,
    /// Running total of USDC settled (base units)
    pub total_settled: u64,
    /// Number of settlements processed
    pub settlement_count: u32,
    /// PDA bump
    pub bump: u8,
}

impl MerchantAccount {
    pub const SEED: &'static [u8] = b"merchant";
}
