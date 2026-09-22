pub mod constants;
pub mod error;
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

    pub fn migrate_to_token(ctx: Context<MigrateToToken>) -> Result<()> {
        crate::instructions::migrate_to_token::handle_migrate_to_token(ctx)
    }

    pub fn claim_crumbs(ctx: Context<ClaimCrumbs>) -> Result<()> {
        crate::instructions::claim_crumbs::handle_claim_crumbs(ctx)
    }

    /// Callable by the other games over CPI, so a game can take payment in
    /// the same transaction as the action it's charging for.
    pub fn spend_crumbs(ctx: Context<SpendCrumbs>, amount: u64) -> Result<()> {
        crate::instructions::spend_crumbs::handle_spend_crumbs(ctx, amount)
    }

    /// Callable over CPI by a game that puts crumbs at risk rather than
    /// spending them outright; that game settles the escrow itself.
    pub fn escrow_crumbs(ctx: Context<EscrowCrumbs>, amount: u64) -> Result<()> {
        crate::instructions::escrow_crumbs::handle_escrow_crumbs(ctx, amount)
    }

    pub fn commit_raid(ctx: Context<CommitRaid>, commitment: [u8; 32]) -> Result<()> {
        crate::instructions::commit_raid::handle_commit_raid(ctx, commitment)
    }

    pub fn reveal_raid(ctx: Context<RevealRaid>, secret: [u8; 32]) -> Result<()> {
        crate::instructions::reveal_raid::handle_reveal_raid(ctx, secret)
    }
}
