use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum CookieState {
    Empty,
    Live,
    Eaten,
    Burned,
    Pulled,
}

/// A singleton, recycled across every batch — the whole game is this one
/// account. `bake` resets it; `nibble`/`glaze`/`pull`/`crank_heat` mutate it
/// while it's Live.
#[account]
#[derive(InitSpace)]
pub struct Cookie {
    pub baker: Pubkey,
    pub batch_id: u64,
    pub hp: u32,
    pub heat: u32,
    pub created_slot: u64,
    pub last_action_slot: u64,
    pub nibble_count: u32,
    pub last_nibbler: Pubkey,
    pub state: CookieState,
    pub bump: u8,
}
