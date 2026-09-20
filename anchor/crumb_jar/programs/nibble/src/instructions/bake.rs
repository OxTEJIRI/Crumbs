use anchor_lang::prelude::*;

use crate::{
    constants::*,
    error::NibbleError,
    state::{Cookie, CookieState},
};

#[derive(Accounts)]
pub struct Bake<'info> {
    #[account(mut)]
    pub baker: Signer<'info>,
    #[account(
        init_if_needed,
        payer = baker,
        space = 8 + Cookie::INIT_SPACE,
        seeds = [OVEN_SEED],
        bump
    )]
    pub cookie: Account<'info, Cookie>,
    pub system_program: Program<'info, System>,
}

pub fn handle_bake(ctx: Context<Bake>, bake_amount: u64) -> Result<()> {
    require!(
        bake_amount >= MIN_BAKE_LAMPORTS,
        NibbleError::BakeTooSmall
    );

    let state = ctx.accounts.cookie.state;
    require!(
        matches!(
            state,
            CookieState::Empty
                | CookieState::Eaten
                | CookieState::Burned
                | CookieState::Pulled
        ),
        NibbleError::CookieAlreadyLive
    );

    // Purely game-pot money: init_if_needed already funded rent-exemption
    // from the baker separately, before this transfer runs.
    let cpi_accounts = anchor_lang::system_program::Transfer {
        from: ctx.accounts.baker.to_account_info(),
        to: ctx.accounts.cookie.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(
        anchor_lang::system_program::ID,
        cpi_accounts,
    );
    anchor_lang::system_program::transfer(cpi_ctx, bake_amount)?;

    let clock = Clock::get()?;
    let cookie = &mut ctx.accounts.cookie;
    cookie.baker = ctx.accounts.baker.key();
    cookie.batch_id = cookie.batch_id.saturating_add(1);
    cookie.hp = MAX_HP;
    cookie.heat = 0;
    cookie.created_slot = clock.slot;
    cookie.last_action_slot = clock.slot;
    cookie.nibble_count = 0;
    cookie.last_nibbler = Pubkey::default();
    cookie.state = CookieState::Live;
    cookie.bump = ctx.bumps.cookie;

    msg!(
        "Baked batch {} with a {} lamport pot",
        cookie.batch_id,
        bake_amount
    );
    Ok(())
}
