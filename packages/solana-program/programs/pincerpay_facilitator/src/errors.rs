use anchor_lang::prelude::*;

#[error_code]
pub enum PincerPayError {
    #[msg("Fee basis points must be <= 10000")]
    InvalidFeeBps,

    #[msg("Merchant account is not active")]
    MerchantNotActive,

    #[msg("Merchant account is already active")]
    MerchantAlreadyActive,

    #[msg("Settlement amount must be greater than zero")]
    ZeroAmount,

    #[msg("Arithmetic overflow")]
    Overflow,

    #[msg("Invalid x402 transaction hash")]
    InvalidX402TxHash,
}
