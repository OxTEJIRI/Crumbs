use anchor_lang::prelude::*;

use crate::{constants::*, state::CookieJar};

#[derive(Accounts)]
pub struct InitializeJar<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(
        init,
        payer = owner,
        space = 8 + CookieJar::INIT_SPACE,
        seeds = [JAR_SEED, owner.key().as_ref()],
        bump
    )]
    pub jar: Account<'info, CookieJar>,
    pub system_program: Program<'info, System>,
}

pub fn handle_initialize_jar(ctx: Context<InitializeJar>) -> Result<()> {
    let jar = &mut ctx.accounts.jar;
    jar.owner = ctx.accounts.owner.key();
    jar.crumb_balance = 0;
    jar.production_rate = BASE_PRODUCTION_RATE;
    jar.last_claimed_ts = Clock::get()?.unix_timestamp;
    // Backdated so a fresh jar can raid immediately rather than waiting out a
    // cooldown it never triggered.
    jar.last_raid_ts = jar.last_claimed_ts.saturating_sub(RAID_COOLDOWN_SECONDS);
    jar.defense_level = 0;
    jar.bump = ctx.bumps.jar;
    // Nothing to migrate for a jar that starts empty.
    jar.migrated = true;

    msg!("Cookie Jar minted for {}", jar.owner);
    Ok(())
}
