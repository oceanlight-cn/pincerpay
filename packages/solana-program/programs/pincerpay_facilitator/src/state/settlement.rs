use anchor_lang::prelude::*;

/// Settlement type discriminator
pub const TX_TYPE_DIRECT: u8 = 0;
pub const TX_TYPE_X402_RECORDED: u8 = 1;

/// On-chain settlement record. PDA seeds: ["settlement", nonce.to_le_bytes()]
#[account]
#[derive(InitSpace)]
pub struct SettlementRecord {
    /// Unique nonce from ProgramConfig counter
    pub nonce: u64,
    /// Agent wallet that initiated the payment
    pub agent: Pubkey,
    /// Merchant wallet that received the payment
    pub merchant: Pubkey,
    /// MerchantAccount PDA
    pub merchant_account: Pubkey,
    /// USDC amount in base units (6 decimals)
    pub amount: u64,
    /// Slot at which this record was created
    pub slot: u64,
    /// 0 = direct on-chain settlement, 1 = x402 off-chain settlement recorded
    pub tx_type: u8,
    /// Off-chain x402 tx hash (zero-filled for direct settlements)
    pub x402_tx_hash: [u8; 64],
    /// Unix timestamp
    pub timestamp: i64,
    /// PDA bump
    pub bump: u8,
}

impl SettlementRecord {
    pub const SEED: &'static [u8] = b"settlement";
}
