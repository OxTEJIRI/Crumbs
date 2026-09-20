use anchor_lang::prelude::*;

#[error_code]
pub enum NibbleError {
    #[msg("A cookie is already live — bake again once it's eaten, burned, or pulled")]
    CookieAlreadyLive,
    #[msg("There's no live cookie to act on right now")]
    CookieNotLive,
    #[msg("Bake amount is below the minimum")]
    BakeTooSmall,
    #[msg("Bid is below the minimum nibble")]
    BidTooSmall,
    #[msg("The baker can't nibble their own cookie yet")]
    BakerLocked,
    #[msg("Only the baker can do that")]
    NotTheBaker,
    #[msg("The cookie hasn't been idle long enough to crank")]
    NotIdleYet,
    #[msg("Glaze would cost more than your specified maximum")]
    GlazeCostExceeded,
}
