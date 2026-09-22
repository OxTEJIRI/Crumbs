use anchor_lang::prelude::*;
use anchor_spl::token::{self, Burn, CloseAccount, Mint, Token, TokenAccount, Transfer};

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

    // Only needed to settle a staked round.
    /// Mutable because losing the stake burns it, which lowers supply.
    #[account(mut)]
    pub crumb_mint: Option<Account<'info, Mint>>,
    #[account(mut)]
    pub jar_crumbs: Option<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub wager_escrow: Option<Account<'info, TokenAccount>>,
    pub token_program: Option<Program<'info, Token>>,
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

    if round.wagered {
        let (crumb_mint, jar_crumbs, wager_escrow) = match (
            &ctx.accounts.crumb_mint,
            &ctx.accounts.jar_crumbs,
            &ctx.accounts.wager_escrow,
            &ctx.accounts.token_program,
        ) {
            (Some(a), Some(b), Some(c), Some(_)) => (a, b, c),
            _ => return err!(LuckySliceError::WagerAccountsMissing),
        };

        let player_key = ctx.accounts.player.key();
        let round_bump = round.bump;
        let seeds: &[&[u8]] = &[ROUND_SEED, player_key.as_ref(), &[round_bump]];
        let signer_seeds: &[&[&[u8]]] = &[seeds];
        let staked = wager_escrow.amount;

        if accuracy_bps >= WAGER_ACCURACY_BPS {
            let cpi_accounts = Transfer {
                from: wager_escrow.to_account_info(),
                to: jar_crumbs.to_account_info(),
                authority: ctx.accounts.round.to_account_info(),
            };
            let cpi_ctx = CpiContext::new_with_signer(
                anchor_spl::token::ID,
                cpi_accounts,
                signer_seeds,
            );
            token::transfer(cpi_ctx, staked)?;
        } else {
            // Missing the bar destroys the stake rather than paying it to
            // anyone, the same way a lost raid does, so a staked round can
            // only ever shrink the supply.
            let cpi_accounts = Burn {
                mint: crumb_mint.to_account_info(),
                from: wager_escrow.to_account_info(),
                authority: ctx.accounts.round.to_account_info(),
            };
            let cpi_ctx = CpiContext::new_with_signer(
                anchor_spl::token::ID,
                cpi_accounts,
                signer_seeds,
            );
            token::burn(cpi_ctx, staked)?;
        }

        // Empty either way now, so hand its rent back to the player.
        let cpi_accounts = CloseAccount {
            account: wager_escrow.to_account_info(),
            destination: ctx.accounts.player.to_account_info(),
            authority: ctx.accounts.round.to_account_info(),
        };
        let cpi_ctx =
            CpiContext::new_with_signer(anchor_spl::token::ID, cpi_accounts, signer_seeds);
        token::close_account(cpi_ctx)?;

        msg!(
            "Staked round settled: {} crumbs {}",
            staked,
            if accuracy_bps >= WAGER_ACCURACY_BPS {
                "returned"
            } else {
                "burned"
            }
        );
    }

    let target_bps = round.target_bps;
    let stats = &mut ctx.accounts.stats;
    stats.attempts = stats.attempts.saturating_add(1);
    stats.last_slot = clock.slot;
    if accuracy_bps > stats.best_accuracy_bps {
        stats.best_accuracy_bps = accuracy_bps;
    }

    msg!(
        "Cut {}bps against target {}bps: {}bps accuracy (best so far {}bps)",
        actual_bps,
        target_bps,
        accuracy_bps,
        stats.best_accuracy_bps
    );
    Ok(())
}
