use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, MintTo, Token, TokenAccount},
};

use crate::{constants::*, error::CrumbJarError, state::CookieJar};

#[derive(Accounts)]
pub struct MigrateToToken<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(
        mut,
        seeds = [JAR_SEED, owner.key().as_ref()],
        bump = jar.bump
    )]
    pub jar: Account<'info, CookieJar>,
    /// Mutable because minting raises the mint's own supply figure.
    #[account(mut, address = CRUMB_MINT)]
    pub crumb_mint: Account<'info, Mint>,
    /// CHECK: a pure signing authority, no data of its own -- the seeds
    /// constraint is what actually verifies this is the right PDA.
    #[account(seeds = [MINT_AUTHORITY_SEED], bump)]
    pub mint_authority: UncheckedAccount<'info>,
    /// This jar's own crumb-holding token account. Authority is the jar's
    /// own PDA, not the player's wallet, so the program can move tokens out
    /// of it unilaterally during a raid -- matching exactly how raids
    /// already work against the legacy u64 balance today.
    #[account(
        init_if_needed,
        payer = owner,
        associated_token::mint = crumb_mint,
        associated_token::authority = jar,
    )]
    pub jar_crumbs: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

/// One-time, per-jar. Settles any pending accrual into the legacy balance
/// first so nothing earned since the last claim is lost, then mints that
/// exact amount as the real token and zeroes the legacy field. Every
/// instruction that touches a jar's crumbs requires this to have already
/// happened.
pub fn handle_migrate_to_token(ctx: Context<MigrateToToken>) -> Result<()> {
    require!(!ctx.accounts.jar.migrated, CrumbJarError::AlreadyMigrated);

    let now = Clock::get()?.unix_timestamp;
    let amount = {
        let jar = &mut ctx.accounts.jar;
        jar.settle(now);
        let amount = jar.crumb_balance;
        jar.crumb_balance = 0;
        jar.migrated = true;
        amount
    };

    if amount > 0 {
        let bump = ctx.bumps.mint_authority;
        let seeds: &[&[u8]] = &[MINT_AUTHORITY_SEED, &[bump]];
        let signer_seeds: &[&[&[u8]]] = &[seeds];

        let cpi_accounts = MintTo {
            mint: ctx.accounts.crumb_mint.to_account_info(),
            to: ctx.accounts.jar_crumbs.to_account_info(),
            authority: ctx.accounts.mint_authority.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            anchor_spl::token::ID,
            cpi_accounts,
            signer_seeds,
        );
        token::mint_to(cpi_ctx, amount)?;
    }

    msg!("Migrated {} legacy crumbs to the real $CRUMB token", amount);
    Ok(())
}
