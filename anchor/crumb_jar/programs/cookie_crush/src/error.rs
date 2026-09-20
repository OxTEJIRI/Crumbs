use anchor_lang::prelude::*;

#[error_code]
pub enum CookieCrushError {
    #[msg("Play a little longer before submitting a score")]
    SubmittedTooSoon,
    #[msg("That score isn't plausible for how long the session ran")]
    ScoreImplausible,
}
