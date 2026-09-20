use anchor_lang::prelude::*;

use crate::{constants::*, state::Session};

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
}

pub fn handle_start_level(ctx: Context<StartLevel>, level_id: u8) -> Result<()> {
    let session = &mut ctx.accounts.session;
    session.player = ctx.accounts.player.key();
    session.level_id = level_id;
    session.started_at = Clock::get()?.unix_timestamp;
    session.bump = ctx.bumps.session;

    msg!("Started level {} for {}", level_id, session.player);
    Ok(())
}
