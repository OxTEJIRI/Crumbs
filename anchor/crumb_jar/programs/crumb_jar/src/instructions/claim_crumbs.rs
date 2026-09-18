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
    let now = Clock::get()?.unix_timestamp;

    // A validator's clock can drift backwards across slots, so treat any
    // negative interval as zero rather than underflowing.
    let elapsed = now.saturating_sub(jar.last_claimed_ts).max(0) as u64;
    let accrued = elapsed.saturating_mul(jar.production_rate);

    jar.crumb_balance = jar.crumb_balance.saturating_add(accrued);
    jar.last_claimed_ts = now;

    msg!("Claimed {} crumbs over {}s", accrued, elapsed);
    Ok(())
}
