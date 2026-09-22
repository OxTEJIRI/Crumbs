use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use crumb_jar::{cpi::accounts::SpendCrumbs, program::CrumbJar, state::CookieJar};

use crate::{constants::*, error::CookieCrushError, state::Session};

#[derive(Accounts)]
#[instruction(level_id: u8)]
pub struct StartLevel<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
    #[account(
        init,
        payer = player,
        space = 8 + Session::INIT_SPACE,
        seeds = [SESSION_SEED, player.key().as_ref(), &[level_id]],
        bump
    )]
    pub session: Account<'info, Session>,
    pub system_program: Program<'info, System>,

    // Everything below is only needed to pay for a longer round. They're
    // optional so that playing for free never requires owning a Cookie Jar,
    // which is a whole other game.
    pub jar: Option<Account<'info, CookieJar>>,
    #[account(mut)]
    pub crumb_mint: Option<Account<'info, Mint>>,
    #[account(mut)]
    pub jar_crumbs: Option<Account<'info, TokenAccount>>,
    pub crumb_jar_program: Option<Program<'info, CrumbJar>>,
    pub token_program: Option<Program<'info, Token>>,
}

pub fn handle_start_level(ctx: Context<StartLevel>, level_id: u8, boost: bool) -> Result<()> {
    if boost {
        // crumb_jar does the real checking: that this jar belongs to the
        // signer, that it has migrated, and that it holds enough. All that's
        // needed here is to hand it the accounts and let it refuse.
        let (jar, crumb_mint, jar_crumbs, crumb_jar_program, token_program) = match (
            &ctx.accounts.jar,
            &ctx.accounts.crumb_mint,
            &ctx.accounts.jar_crumbs,
            &ctx.accounts.crumb_jar_program,
            &ctx.accounts.token_program,
        ) {
            (Some(a), Some(b), Some(c), Some(d), Some(e)) => (a, b, c, d, e),
            _ => return err!(CookieCrushError::BoostAccountsMissing),
        };

        let cpi_accounts = SpendCrumbs {
            owner: ctx.accounts.player.to_account_info(),
            jar: jar.to_account_info(),
            crumb_mint: crumb_mint.to_account_info(),
            jar_crumbs: jar_crumbs.to_account_info(),
            token_program: token_program.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(crumb_jar_program.key(), cpi_accounts);
        crumb_jar::cpi::spend_crumbs(cpi_ctx, BOOST_COST_CRUMBS)?;
    }

    let session = &mut ctx.accounts.session;
    session.player = ctx.accounts.player.key();
    session.level_id = level_id;
    session.started_at = Clock::get()?.unix_timestamp;
    session.bump = ctx.bumps.session;
    session.boosted = boost;

    msg!(
        "Started level {} for {}{}",
        level_id,
        session.player,
        if boost { " (boosted)" } else { "" }
    );
    Ok(())
}
