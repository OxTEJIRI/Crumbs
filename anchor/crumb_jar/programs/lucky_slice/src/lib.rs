pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("A666hnXcDdB9y8Vz2anJTLQg8R7tivBLEXTC4PBQaFoV");

// Named `lucky_slice_program`, not `lucky_slice`, to avoid colliding with
// `instructions::slice` glob-exported above — same reason nibble's program
// module isn't named `nibble`.
#[program]
pub mod lucky_slice_program {
    use super::*;

    pub fn slice(ctx: Context<Slice>) -> Result<()> {
        crate::instructions::slice::handle_slice(ctx)
    }
}
