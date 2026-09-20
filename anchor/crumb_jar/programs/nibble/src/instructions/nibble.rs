use anchor_lang::prelude::*;

use crate::{
    constants::*,
    error::NibbleError,
    lamports::{apply_idle_heat_and_maybe_burn, burn, move_lamports, pot_lamports},
    math,
    state::{Cookie, CookieState},
};

#[derive(Accounts)]
pub struct Nibble<'info> {
    #[account(mut)]
    pub nibbler: Signer<'info>,
    #[account(mut, seeds = [OVEN_SEED], bump = cookie.bump)]
    pub cookie: Account<'info, Cookie>,
    /// CHECK: address-checked against the constant treasury; only ever
    /// credited, never read or deserialized.
    #[account(mut, address = JAR_ADDRESS)]
    pub jar: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handle_nibble(ctx: Context<Nibble>, bid: u64) -> Result<()> {
    let clock = Clock::get()?;
    let jar_info = ctx.accounts.jar.to_account_info();
    let nibbler_info = ctx.accounts.nibbler.to_account_info();
    let nibbler_key = ctx.accounts.nibbler.key();

    // A bite arriving after a long silence cooks the oven first; if that
    // burns it, the Live check right after rejects this bite with a clear
    // error instead of letting it land on an already-dead cookie.
    apply_idle_heat_and_maybe_burn(&mut ctx.accounts.cookie, &jar_info, clock.slot)?;
    require!(
        ctx.accounts.cookie.state == CookieState::Live,
        NibbleError::CookieNotLive
    );
    require!(bid >= MIN_NIBBLE_LAMPORTS, NibbleError::BidTooSmall);

    if nibbler_key == ctx.accounts.cookie.baker {
        let locked =
            clock.slot.saturating_sub(ctx.accounts.cookie.created_slot) < BAKER_LOCK_SLOTS;
        require!(!locked, NibbleError::BakerLocked);
    }

    let hp_before = ctx.accounts.cookie.hp;

    // The bid joins the pot before anything is paid back out of it.
    let cpi_accounts = anchor_lang::system_program::Transfer {
        from: nibbler_info.clone(),
        to: ctx.accounts.cookie.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(
        anchor_lang::system_program::ID,
        cpi_accounts,
    );
    anchor_lang::system_program::transfer(cpi_ctx, bid)?;

    let cookie_info = ctx.accounts.cookie.to_account_info();
    let pot_after_bid = pot_lamports(&cookie_info)?;

    let damage = math::damage_bps(bid, hp_before);
    let payout = math::payout_lamports(pot_after_bid, damage, hp_before);
    move_lamports(&cookie_info, &nibbler_info, payout)?;

    let cookie = &mut ctx.accounts.cookie;
    cookie.hp = hp_before.saturating_sub(damage);
    cookie.heat = cookie
        .heat
        .saturating_add(math::heat_delta(damage))
        .min(MAX_HEAT);
    cookie.nibble_count = cookie.nibble_count.saturating_add(1);
    cookie.last_nibbler = nibbler_key;
    cookie.last_action_slot = clock.slot;

    if cookie.hp == 0 {
        let cookie_info = cookie.to_account_info();
        let remaining_pot = pot_lamports(&cookie_info)?;
        let (jar_cut, winner_payout) = math::split_jar_share(remaining_pot, JAR_SHARE_BPS);
        move_lamports(&cookie_info, &jar_info, jar_cut)?;
        move_lamports(&cookie_info, &nibbler_info, winner_payout)?;
        cookie.state = CookieState::Eaten;
        msg!(
            "Cookie eaten by {} — won {} lamports",
            nibbler_key,
            winner_payout
        );
    } else if cookie.heat >= MAX_HEAT {
        burn(cookie, &jar_info)?;
        msg!("Cookie burned — heat maxed out on that bite");
    } else {
        msg!(
            "Nibbled for {} damage, {} lamports crumbs, hp now {}, heat now {}",
            damage,
            payout,
            cookie.hp,
            cookie.heat
        );
    }

    Ok(())
}
