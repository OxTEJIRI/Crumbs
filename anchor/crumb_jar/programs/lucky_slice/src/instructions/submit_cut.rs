use anchor_lang::prelude::*;

use crate::{constants::*, error::LuckySliceError, state::{Round, SliceStats}};

#[derive(Accounts)]
pub struct SubmitCut<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
    #[account(
        mut,
        close = player,
        seeds = [ROUND_SEED, player.key().as_ref()],
        bump = round.bump
    )]
    pub round: Account<'info, Round>,
    #[account(
        mut,
        seeds = [STATS_SEED, player.key().as_ref()],
        bump = stats.bump
    )]
    pub stats: Account<'info, SliceStats>,
}

pub fn handle_submit_cut(ctx: Context<SubmitCut>, actual_bps: u32) -> Result<()> {
    require!(actual_bps <= BPS_DENOMINATOR, LuckySliceError::CutOutOfRange);

    let clock = Clock::get()?;
    let round = &ctx.accounts.round;
    let elapsed = clock.slot.saturating_sub(round.start_slot);
    require!(elapsed >= MIN_ROUND_SLOTS, LuckySliceError::SubmittedTooSoon);

    // Both operands are within 0..=BPS_DENOMINATOR, so the gap can never
    // exceed BPS_DENOMINATOR — accuracy is always a valid basis-point value.
    let gap = (round.target_bps as i64 - actual_bps as i64).unsigned_abs() as u32;
    let accuracy_bps = BPS_DENOMINATOR - gap;

    let stats = &mut ctx.accounts.stats;
    stats.attempts = stats.attempts.saturating_add(1);
    stats.last_slot = clock.slot;
    if accuracy_bps > stats.best_accuracy_bps {
        stats.best_accuracy_bps = accuracy_bps;
    }

    msg!(
        "Cut {}bps against target {}bps: {}bps accuracy (best so far {}bps)",
        actual_bps,
        round.target_bps,
        accuracy_bps,
        stats.best_accuracy_bps
    );
    Ok(())
}
