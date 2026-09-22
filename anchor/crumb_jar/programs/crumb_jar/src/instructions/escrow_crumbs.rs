use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

use crate::{constants::*, error::CrumbJarError, state::CookieJar};

/// Moves crumbs out of a jar and into a game's escrow, for games that put
/// crumbs at risk rather than simply burning them.
///
/// The destination's authority has to **sign**, which is the whole safety
/// argument: a player can't route their own crumbs into an account they
/// control directly, only into one held by a program that signed for it.
/// Settling the escrow afterwards is that program's job, not this one's.
///
/// This is deliberately narrower than it looks. Crumbs sitting in a game's
/// escrow are unraidable, so in principle a player could deploy their own
/// program and park crumbs there to dodge raids. That hiding place is also
/// unspendable and invisible to the leaderboard, which is the entire point of
/// Jar Wars, so the dodge costs more than it saves.
#[derive(Accounts)]
pub struct EscrowCrumbs<'info> {
    pub owner: Signer<'info>,
    #[account(
        seeds = [JAR_SEED, owner.key().as_ref()],
        bump = jar.bump
    )]
    pub jar: Account<'info, CookieJar>,
    #[account(address = CRUMB_MINT)]
    pub crumb_mint: Account<'info, Mint>,
    #[account(
        mut,
        associated_token::mint = crumb_mint,
        associated_token::authority = jar,
    )]
    pub jar_crumbs: Account<'info, TokenAccount>,
    #[account(
        mut,
        token::mint = crumb_mint,
        token::authority = escrow_authority,
    )]
    pub escrow: Account<'info, TokenAccount>,
    pub escrow_authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

pub fn handle_escrow_crumbs(ctx: Context<EscrowCrumbs>, amount: u64) -> Result<()> {
    require!(ctx.accounts.jar.migrated, CrumbJarError::NotMigrated);
    require!(
        ctx.accounts.jar_crumbs.amount >= amount,
        CrumbJarError::InsufficientCrumbs
    );

    if amount > 0 {
        let owner_key = ctx.accounts.owner.key();
        let bump = ctx.accounts.jar.bump;
        let seeds: &[&[u8]] = &[JAR_SEED, owner_key.as_ref(), &[bump]];
        let signer_seeds: &[&[&[u8]]] = &[seeds];

        let cpi_accounts = Transfer {
            from: ctx.accounts.jar_crumbs.to_account_info(),
            to: ctx.accounts.escrow.to_account_info(),
            authority: ctx.accounts.jar.to_account_info(),
        };
        let cpi_ctx =
            CpiContext::new_with_signer(anchor_spl::token::ID, cpi_accounts, signer_seeds);
        token::transfer(cpi_ctx, amount)?;
    }

    msg!("Escrowed {} crumbs", amount);
    Ok(())
}
