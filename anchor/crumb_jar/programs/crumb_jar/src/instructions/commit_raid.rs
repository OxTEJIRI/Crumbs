use anchor_lang::prelude::*;

use crate::{constants::*, error::CrumbJarError, state::{CookieJar, Raid}};

#[derive(Accounts)]
pub struct CommitRaid<'info> {
    #[account(mut)]
    pub attacker: Signer<'info>,
    #[account(
        mut,
        seeds = [JAR_SEED, attacker.key().as_ref()],
        bump = attacker_jar.bump
    )]
    pub attacker_jar: Account<'info, CookieJar>,
    /// Loaded so a raid cannot be committed against a jar that does not exist.
    #[account(
        seeds = [JAR_SEED, target_jar.owner.as_ref()],
        bump = target_jar.bump
    )]
    pub target_jar: Account<'info, CookieJar>,
    #[account(
        init,
        payer = attacker,
        space = 8 + Raid::INIT_SPACE,
        seeds = [RAID_SEED, attacker.key().as_ref()],
        bump
    )]
    pub raid: Account<'info, Raid>,
    pub system_program: Program<'info, System>,
}

pub fn handle_commit_raid(ctx: Context<CommitRaid>, commitment: [u8; 32]) -> Result<()> {
    let clock = Clock::get()?;
    let attacker_jar = &mut ctx.accounts.attacker_jar;
    let target_jar = &ctx.accounts.target_jar;

    require_keys_neq!(
        attacker_jar.key(),
        target_jar.key(),
        CrumbJarError::SelfRaid
    );
    require!(
        clock.unix_timestamp.saturating_sub(attacker_jar.last_raid_ts)
            >= RAID_COOLDOWN_SECONDS,
        CrumbJarError::RaidOnCooldown
    );

    // Settle first so crumbs earned since the last claim can fund the stake.
    attacker_jar.settle(clock.unix_timestamp);
    require!(
        attacker_jar.crumb_balance >= RAID_STAKE,
        CrumbJarError::InsufficientCrumbs
    );
    attacker_jar.crumb_balance -= RAID_STAKE;
    attacker_jar.last_raid_ts = clock.unix_timestamp;

    let raid = &mut ctx.accounts.raid;
    raid.attacker = ctx.accounts.attacker.key();
    raid.target = target_jar.key();
    raid.commitment = commitment;
    raid.commit_slot = clock.slot;
    raid.staked = RAID_STAKE;
    raid.bump = ctx.bumps.raid;

    msg!("Raid committed against {}", raid.target);
    Ok(())
}
