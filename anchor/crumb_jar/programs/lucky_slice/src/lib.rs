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

    pub fn start_round(ctx: Context<StartRound>) -> Result<()> {
        crate::instructions::start_round::handle_start_round(ctx)
    }

    pub fn submit_cut(ctx: Context<SubmitCut>, actual_bps: u32) -> Result<()> {
        crate::instructions::submit_cut::handle_submit_cut(ctx, actual_bps)
    }
}
