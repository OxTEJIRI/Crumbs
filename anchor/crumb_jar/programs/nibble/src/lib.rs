pub mod constants;
pub mod error;
pub mod instructions;
pub mod lamports;
pub mod math;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("96A38RPbCfpcv8o5ZCbTSq8Q1kT6DBujHygJMiWLDbWj");

// Named `nibble_program`, not `nibble`, so it doesn't collide with the
// `instructions::nibble` module glob-exported above — both would otherwise
// try to define `crate::nibble`. Doesn't affect the generated IDL's program
// name, which comes from Cargo.toml.
#[program]
pub mod nibble_program {
    use super::*;

    pub fn bake(ctx: Context<Bake>, bake_amount: u64) -> Result<()> {
        crate::instructions::bake::handle_bake(ctx, bake_amount)
    }

    pub fn nibble(ctx: Context<Nibble>, bid: u64) -> Result<()> {
        crate::instructions::nibble::handle_nibble(ctx, bid)
    }

    pub fn glaze(ctx: Context<Glaze>, max_cost: u64) -> Result<()> {
        crate::instructions::glaze::handle_glaze(ctx, max_cost)
    }

    pub fn pull(ctx: Context<Pull>) -> Result<()> {
        crate::instructions::pull::handle_pull(ctx)
    }

    pub fn crank_heat(ctx: Context<CrankHeat>) -> Result<()> {
        crate::instructions::crank_heat::handle_crank_heat(ctx)
    }
}
