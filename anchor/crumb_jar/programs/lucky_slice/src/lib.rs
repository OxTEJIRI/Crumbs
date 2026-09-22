pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("A666hnXcDdB9y8Vz2anJTLQg8R7tivBLEXTC4PBQaFoV");

#[program]
pub mod lucky_slice_program {
    use super::*;

    /// `wager` escrows $CRUMB against the round; see WAGER_ACCURACY_BPS for
    /// the bar the cut has to clear to get it back.
    pub fn start_round(ctx: Context<StartRound>, wager: bool) -> Result<()> {
        crate::instructions::start_round::handle_start_round(ctx, wager)
    }

    pub fn submit_cut(ctx: Context<SubmitCut>, actual_bps: u32) -> Result<()> {
        crate::instructions::submit_cut::handle_submit_cut(ctx, actual_bps)
    }
}
