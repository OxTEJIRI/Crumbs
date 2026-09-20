use anchor_lang::prelude::*;

use crate::{
    constants::*,
    error::NibbleError,
    lamports::apply_idle_heat_and_maybe_burn,
    state::{Cookie, CookieState},
};

#[derive(Accounts)]
pub struct CrankHeat<'info> {
    pub cranker: Signer<'info>,
    #[account(mut, seeds = [OVEN_SEED], bump = cookie.bump)]
    pub cookie: Account<'info, Cookie>,
    /// CHECK: address-checked treasury; only ever credited if this crank
    /// pushes heat to the cap.
    #[account(mut, address = JAR_ADDRESS)]
    pub jar: UncheckedAccount<'info>,
}

/// Anyone can call this — it's how a cookie nobody's touching still dies on
/// schedule instead of sitting stale on the homepage forever.
pub fn handle_crank_heat(ctx: Context<CrankHeat>) -> Result<()> {
    require!(
        ctx.accounts.cookie.state == CookieState::Live,
        NibbleError::CookieNotLive
    );

    let clock = Clock::get()?;
    let idle_slots = clock
        .slot
        .saturating_sub(ctx.accounts.cookie.last_action_slot);
    require!(idle_slots >= IDLE_SLOTS, NibbleError::NotIdleYet);

    let jar_info = ctx.accounts.jar.to_account_info();
    apply_idle_heat_and_maybe_burn(&mut ctx.accounts.cookie, &jar_info, clock.slot)?;
    Ok(())
}
