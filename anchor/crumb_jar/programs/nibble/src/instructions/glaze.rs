use anchor_lang::prelude::*;

use crate::{
    constants::*,
    error::NibbleError,
    lamports::apply_idle_heat_and_maybe_burn,
    math,
    state::{Cookie, CookieState},
};

#[derive(Accounts)]
pub struct Glaze<'info> {
    #[account(mut)]
    pub baker: Signer<'info>,
    #[account(mut, seeds = [OVEN_SEED], bump = cookie.bump)]
    pub cookie: Account<'info, Cookie>,
    /// CHECK: address-checked treasury; only ever credited if this call's
    /// idle check turns up a burn.
    #[account(mut, address = JAR_ADDRESS)]
    pub jar: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

/// `max_cost` guards the baker against a race: heat only ever rises between
/// when they simulate this transaction and when it lands (someone else's
/// nibble could land first), so the cost they actually pay could be higher
/// than what they saw. This caps it.
pub fn handle_glaze(ctx: Context<Glaze>, max_cost: u64) -> Result<()> {
    let clock = Clock::get()?;
    let jar_info = ctx.accounts.jar.to_account_info();

    apply_idle_heat_and_maybe_burn(&mut ctx.accounts.cookie, &jar_info, clock.slot)?;
    require!(
        ctx.accounts.cookie.state == CookieState::Live,
        NibbleError::CookieNotLive
    );
    require!(
        ctx.accounts.cookie.baker == ctx.accounts.baker.key(),
        NibbleError::NotTheBaker
    );

    let cost = math::glaze_cost_lamports(ctx.accounts.cookie.heat);
    require!(cost <= max_cost, NibbleError::GlazeCostExceeded);

    // Payment joins the pot — the baker is reinvesting to keep the batch
    // alive, raising the eventual prize rather than paying a pure fee.
    let cpi_accounts = anchor_lang::system_program::Transfer {
        from: ctx.accounts.baker.to_account_info(),
        to: ctx.accounts.cookie.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(
        anchor_lang::system_program::ID,
        cpi_accounts,
    );
    anchor_lang::system_program::transfer(cpi_ctx, cost)?;

    let cookie = &mut ctx.accounts.cookie;
    cookie.heat = cookie.heat.saturating_sub(GLAZE_HEAT_REDUCTION);
    cookie.hp = cookie.hp.saturating_add(GLAZE_HP_RESTORE).min(MAX_HP);
    cookie.last_action_slot = clock.slot;

    msg!(
        "Glazed for {} lamports: heat now {}, hp now {}",
        cost,
        cookie.heat,
        cookie.hp
    );
    Ok(())
}
