use anchor_lang::prelude::*;

/// Global program configuration. PDA seeds: ["config"]
#[account]
#[derive(InitSpace)]
pub struct ProgramConfig {
    /// Authority that can register merchants and record x402 settlements
    pub authority: Pubkey,
    /// Fee basis points (0-10000) charged on direct settlements
    pub fee_bps: u16,
    /// Monotonically increasing settlement counter (used as PDA seed for SettlementRecord)
    pub nonce: u64,
    /// PDA bump
    pub bump: u8,
}

impl ProgramConfig {
    pub const SEED: &'static [u8] = b"config";
}
