use anchor_lang::prelude::*;

#[error_code]
pub enum CrumbJarError {
    #[msg("You cannot raid your own jar")]
    SelfRaid,
    #[msg("Your raid is still on cooldown")]
    RaidOnCooldown,
    #[msg("Not enough crumbs to stake this raid")]
    InsufficientCrumbs,
    #[msg("This target does not match the jar you committed to raid")]
    WrongTarget,
    #[msg("The revealed secret does not match your commitment")]
    InvalidReveal,
    #[msg("Reveal must land in a later slot than the commit")]
    RevealTooSoon,
    #[msg("The slot hashes sysvar could not be read")]
    SlotHashUnavailable,
}
