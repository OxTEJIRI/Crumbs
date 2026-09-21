use anchor_lang::prelude::*;

#[error_code]
pub enum LuckySliceError {
    #[msg("The SlotHashes sysvar has no entries yet.")]
    SlotHashUnavailable,
    #[msg("Cut size must be between 0 and 10000 basis points.")]
    CutOutOfRange,
    #[msg("Submitted too soon after starting the round.")]
    SubmittedTooSoon,
}
