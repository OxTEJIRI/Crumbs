use anchor_lang::prelude::*;

use crate::{constants::*, state::CookieJar};

#[derive(Accounts)]
pub struct ClaimCrumbs<'info> {
    pub owner: Signer<'info>,
    #[account(
        mut,
        seeds = [JAR_SEED, owner.key().as_ref()],
        bump = jar.bump
    )]
    pub jar: Account<'info, CookieJar>,
}

pub fn handle_claim_crumbs(ctx: Context<ClaimCrumbs>) -> Result<()> {
    let jar = &mut ctx.accounts.jar;
    let accrued = jar.settle(Clock::get()?.unix_timestamp);

    msg!("Claimed {} crumbs", accrued);
    Ok(())
}
