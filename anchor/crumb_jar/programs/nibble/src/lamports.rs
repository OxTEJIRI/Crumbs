use anchor_lang::prelude::*;

use crate::state::Cookie;

/// Moves lamports directly between accounts rather than through a CPI
/// transfer. Only valid when `from` is owned by the currently executing
/// program (true for the Cookie PDA) — the runtime lets a program freely
/// debit/credit lamports on accounts it owns.
pub fn move_lamports<'info>(
    from: &AccountInfo<'info>,
    to: &AccountInfo<'info>,
    amount: u64,
) -> Result<()> {
    **from.try_borrow_mut_lamports()? -= amount;
    **to.try_borrow_mut_lamports()? += amount;
    Ok(())
}

/// The pot is the Cookie PDA's own balance above its rent-exempt minimum —
/// not a separate tracked field, so it can never drift from what the account
/// actually holds.
pub fn pot_lamports(cookie_info: &AccountInfo) -> Result<u64> {
    let rent = Rent::get()?;
    let minimum = rent.minimum_balance(cookie_info.data_len());
    Ok(cookie_info.lamports().saturating_sub(minimum))
}

/// Sends the entire pot to the jar and marks the cookie burned. Shared by
/// the idle-heat check (a nibble/glaze/crank arriving after enough silence)
/// and any path that pushes heat to MAX_HEAT directly.
pub fn burn<'info>(cookie: &mut Account<'info, Cookie>, jar: &AccountInfo<'info>) -> Result<()> {
    let cookie_info = cookie.to_account_info();
    let pot = pot_lamports(&cookie_info)?;
    move_lamports(&cookie_info, jar, pot)?;
    cookie.state = crate::state::CookieState::Burned;
    Ok(())
}

/// Applies heat for every full IDLE_SLOTS window since the last action, and
/// burns if that pushes heat to the cap. Called first thing by nibble, glaze,
/// and crank_heat — if it burns, the Live check each of them runs
/// immediately after this naturally rejects the action with a clear error,
/// rather than needing special-case handling in every caller.
pub fn apply_idle_heat_and_maybe_burn<'info>(
    cookie: &mut Account<'info, Cookie>,
    jar: &AccountInfo<'info>,
    current_slot: u64,
) -> Result<()> {
    use crate::constants::*;
    use crate::state::CookieState;

    if cookie.state != CookieState::Live {
        return Ok(());
    }

    let idle_slots = current_slot.saturating_sub(cookie.last_action_slot);
    if idle_slots < IDLE_SLOTS {
        return Ok(());
    }

    let ticks = idle_slots / IDLE_SLOTS;
    let heat_gain = IDLE_HEAT.saturating_mul(ticks as u32);
    cookie.heat = cookie.heat.saturating_add(heat_gain).min(MAX_HEAT);
    cookie.last_action_slot = current_slot;

    if cookie.heat >= MAX_HEAT {
        burn(cookie, jar)?;
    }

    Ok(())
}
