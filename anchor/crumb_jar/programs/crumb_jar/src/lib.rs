pub mod constants;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("85eL8gcexHuQmX8BvpMYxVPobmrcFRW62XBGGVuhKaLr");

#[program]
pub mod crumb_jar {
    use super::*;

    pub fn initialize_jar(ctx: Context<InitializeJar>) -> Result<()> {
        crate::instructions::initialize_jar::handle_initialize_jar(ctx)
    }

    pub fn claim_crumbs(ctx: Context<ClaimCrumbs>) -> Result<()> {
        crate::instructions::claim_crumbs::handle_claim_crumbs(ctx)
    }
}
