use anchor_lang::prelude::*;

use crate::{constants::*, error::CookieCrushError, state::{LevelScore, Session}};

#[derive(Accounts)]
#[instruction(level_id: u8)]
pub struct SubmitScore<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
    #[account(
        mut,
        close = player,
        seeds = [SESSION_SEED, player.key().as_ref(), &[level_id]],
        bump = session.bump
    )]
    pub session: Account<'info, Session>,
    #[account(
        init_if_needed,
        payer = player,
        space = 8 + LevelScore::INIT_SPACE,
        seeds = [SCORE_SEED, player.key().as_ref(), &[level_id]],
        bump
    )]
    pub level_score: Account<'info, LevelScore>,
    pub system_program: Program<'info, System>,
}

pub fn handle_submit_score(ctx: Context<SubmitScore>, level_id: u8, score: u32) -> Result<()> {
    let session = &ctx.accounts.session;
    let now = Clock::get()?.unix_timestamp;
    let elapsed = now.saturating_sub(session.started_at).max(0);

    require!(
        elapsed >= MIN_ELAPSED_SECONDS,
        CookieCrushError::SubmittedTooSoon
    );

    // Loose plausibility check, not real anti-cheat — see constants.rs.
    let ceiling = (elapsed as u64)
        .saturating_mul(MAX_SCORE_PER_SECOND)
        .saturating_add(SCORE_BURST_ALLOWANCE);
    require!(
        (score as u64) <= ceiling,
        CookieCrushError::ScoreImplausible
    );

    let level_score = &mut ctx.accounts.level_score;
    if level_score.attempts == 0 {
        level_score.player = ctx.accounts.player.key();
        level_score.level_id = level_id;
        level_score.bump = ctx.bumps.level_score;
    }
    level_score.attempts = level_score.attempts.saturating_add(1);
    if score > level_score.best_score {
        level_score.best_score = score;
    }

    msg!(
        "Submitted score {} for level {} (best {})",
        score,
        level_id,
        level_score.best_score
    );
    Ok(())
}
