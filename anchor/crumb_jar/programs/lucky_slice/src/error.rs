use anchor_lang::prelude::*;

#[error_code]
pub enum LuckySliceError {
    #[msg("The SlotHashes sysvar has no entries yet.")]
    SlotHashUnavailable,
}
