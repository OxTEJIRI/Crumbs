pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("2jT3Tqpz2bavkJeDQiQTG8S6i3X1DMLUU6Gazeb9LvLM");

#[program]
pub mod cookie_crush {
    use super::*;

    /// `boost` pays $CRUMB for a longer round; see BOOST_EXTRA_SECONDS.
    pub fn start_level(ctx: Context<StartLevel>, level_id: u8, boost: bool) -> Result<()> {
        crate::instructions::start_level::handle_start_level(ctx, level_id, boost)
    }

    pub fn submit_score(ctx: Context<SubmitScore>, level_id: u8, score: u32) -> Result<()> {
        crate::instructions::submit_score::handle_submit_score(ctx, level_id, score)
    }
}
