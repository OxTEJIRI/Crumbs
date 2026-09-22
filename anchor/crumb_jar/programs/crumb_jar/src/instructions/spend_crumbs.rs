use anchor_lang::prelude::*;
use anchor_spl::token::{self, Burn, Mint, Token, TokenAccount};

use crate::{constants::*, error::CrumbJarError, state::CookieJar};

/// Spending is burning. Crumbs have exactly one source (a jar's accrual), so
/// giving the other games a sink rather than a treasury keeps the supply
/// honest: nothing can re-enter circulation except by being earned again.
#[derive(Accounts)]
pub struct SpendCrumbs<'info> {
    pub owner: Signer<'info>,
    #[account(
        seeds = [JAR_SEED, owner.key().as_ref()],
        bump = jar.bump
    )]
    pub jar: Account<'info, CookieJar>,
    /// Mutable because burning lowers the mint's own supply figure.
    #[account(mut, address = CRUMB_MINT)]
    pub crumb_mint: Account<'info, Mint>,
    #[account(
        mut,
        associated_token::mint = crumb_mint,
        associated_token::authority = jar,
    )]
    pub jar_crumbs: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

pub fn handle_spend_crumbs(ctx: Context<SpendCrumbs>, amount: u64) -> Result<()> {
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

        let cpi_accounts = Burn {
            mint: ctx.accounts.crumb_mint.to_account_info(),
            from: ctx.accounts.jar_crumbs.to_account_info(),
            authority: ctx.accounts.jar.to_account_info(),
        };
        let cpi_ctx =
            CpiContext::new_with_signer(anchor_spl::token::ID, cpi_accounts, signer_seeds);
        token::burn(cpi_ctx, amount)?;
    }

    msg!("Spent {} crumbs", amount);
    Ok(())
}
