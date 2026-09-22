use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, Token, TokenAccount, Transfer},
};

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
    #[account(address = CRUMB_MINT)]
    pub crumb_mint: Account<'info, Mint>,
    #[account(
        mut,
        associated_token::mint = crumb_mint,
        associated_token::authority = attacker_jar,
    )]
    pub attacker_crumbs: Account<'info, TokenAccount>,
    /// The stake has to live somewhere real while the raid is pending, not
    /// just be subtracted from a number -- this is that somewhere.
    /// Authority is the raid PDA itself, so only this program can move it,
    /// and only once the raid resolves.
    #[account(
        init,
        payer = attacker,
        associated_token::mint = crumb_mint,
        associated_token::authority = raid,
    )]
    pub raid_escrow: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn handle_commit_raid(ctx: Context<CommitRaid>, commitment: [u8; 32]) -> Result<()> {
    let clock = Clock::get()?;

    require!(
        ctx.accounts.attacker_jar.migrated,
        CrumbJarError::NotMigrated
    );
    require_keys_neq!(
        ctx.accounts.attacker_jar.key(),
        ctx.accounts.target_jar.key(),
        CrumbJarError::SelfRaid
    );
    require!(
        clock
            .unix_timestamp
            .saturating_sub(ctx.accounts.attacker_jar.last_raid_ts)
            >= RAID_COOLDOWN_SECONDS,
        CrumbJarError::RaidOnCooldown
    );
    require!(
        ctx.accounts.attacker_crumbs.amount >= RAID_STAKE,
        CrumbJarError::InsufficientCrumbs
    );

    ctx.accounts.attacker_jar.last_raid_ts = clock.unix_timestamp;

    let cpi_accounts = Transfer {
        from: ctx.accounts.attacker_crumbs.to_account_info(),
        to: ctx.accounts.raid_escrow.to_account_info(),
        authority: ctx.accounts.attacker_jar.to_account_info(),
    };
    let owner_key = ctx.accounts.attacker.key();
    let bump = ctx.accounts.attacker_jar.bump;
    let seeds: &[&[u8]] = &[JAR_SEED, owner_key.as_ref(), &[bump]];
    let signer_seeds: &[&[&[u8]]] = &[seeds];
    let cpi_ctx = CpiContext::new_with_signer(
        anchor_spl::token::ID,
        cpi_accounts,
        signer_seeds,
    );
    token::transfer(cpi_ctx, RAID_STAKE)?;

    let raid = &mut ctx.accounts.raid;
    raid.attacker = ctx.accounts.attacker.key();
    raid.target = ctx.accounts.target_jar.key();
    raid.commitment = commitment;
    raid.commit_slot = clock.slot;
    raid.staked = RAID_STAKE;
    raid.bump = ctx.bumps.raid;

    msg!("Raid committed against {}", raid.target);
    Ok(())
}
