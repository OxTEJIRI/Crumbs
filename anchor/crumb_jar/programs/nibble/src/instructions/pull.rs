use anchor_lang::prelude::*;

use crate::{
    constants::*,
    error::NibbleError,
    lamports::{apply_idle_heat_and_maybe_burn, move_lamports, pot_lamports},
    math,
    state::{Cookie, CookieState},
};

#[derive(Accounts)]
pub struct Pull<'info> {
    #[account(mut)]
    pub baker: Signer<'info>,
    #[account(mut, seeds = [OVEN_SEED], bump = cookie.bump)]
    pub cookie: Account<'info, Cookie>,
    /// CHECK: address-checked treasury; receives the protocol cut, or the
    /// whole pot if this call's idle check finds it already overdue to burn.
    #[account(mut, address = JAR_ADDRESS)]
    pub jar: UncheckedAccount<'info>,
}

pub fn handle_pull(ctx: Context<Pull>) -> Result<()> {
    let clock = Clock::get()?;
    let jar_info = ctx.accounts.jar.to_account_info();

    // A baker can't dodge an overdue burn by pulling first -- the idle check
    // always runs before anything else looks at the cookie's state. If it
    // burns, that has to actually be allowed to land (returning Ok) rather
    // than rejected with an error afterward: a require! failing here would
    // roll back the burn along with everything else in this transaction,
    // since Solana instructions are atomic.
    if apply_idle_heat_and_maybe_burn(&mut ctx.accounts.cookie, &jar_info, clock.slot)? {
        msg!("Cookie burned from neglect before this pull could land");
        return Ok(());
    }
    require!(
        ctx.accounts.cookie.state == CookieState::Live,
        NibbleError::CookieNotLive
    );
    require!(
        ctx.accounts.cookie.baker == ctx.accounts.baker.key(),
        NibbleError::NotTheBaker
    );

    let cookie_info = ctx.accounts.cookie.to_account_info();
    let baker_info = ctx.accounts.baker.to_account_info();

    let pot = pot_lamports(&cookie_info)?;
    let (jar_cut, baker_payout) = math::split_jar_share(pot, JAR_SHARE_BPS);
    move_lamports(&cookie_info, &jar_info, jar_cut)?;
    move_lamports(&cookie_info, &baker_info, baker_payout)?;

    ctx.accounts.cookie.state = CookieState::Pulled;
    msg!(
        "Pulled: baker received {} lamports, jar received {}",
        baker_payout,
        jar_cut
    );
    Ok(())
}
