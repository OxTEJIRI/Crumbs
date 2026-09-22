# Crumbs — Cookie Chain Hackathon cApp

Crumbs is a hub for on-chain games on Cookie Chain, submitted to Cookie Chain's
"Build a cApp" hackathon. Wallet connection, the toast/transaction-status
system, and the header are shared across all games. Each game gets its own
route under `src/app/games/<slug>/` and, since games don't share on-chain
state, its own Anchor program — either a new `programs/<slug>/` inside the
existing `anchor/crumb_jar/` workspace (reuses the proven WSL/toolchain
setup; the workspace's own name is now historical, not descriptive) or a
separate `anchor/<slug>/` workspace if there's a reason to isolate it.

## Games

### Jar Wars (`/games/jar-wars`, `anchor/crumb_jar/`)
See GAME_DESIGN.md for the full game design.

Stack: @solana/web3.js, @solana/wallet-adapter-react (Nightly required),
Anchor. $CRUMB token is currently a plain u64 on the jar account, not yet
minted as SPL Token-2022 — see GAME_DESIGN.md's stack section for the
originally-planned token/NFT layer, which remains a stretch goal.

Build order (complete):
1. Wallet connect + jar minting
2. Passive crumb accrual + claim transaction
3. Raid mechanic (commit-reveal)
4. Leaderboard
5. Transaction status UI + error handling

### Cookie Crush (`/games/cookie-crush`, `anchor/crumb_jar/programs/cookie_crush/`)
Match-3 puzzle game. The board itself (`src/lib/cookieCrush/board.ts`) is
entirely client-side — matching, cascades, gravity, refill — since nobody
signs a wallet popup per tile swap. The chain only sees `start_level` and
`submit_score`. `submit_score` rejects scores above a loose plausibility
ceiling (`elapsed_seconds × 80 + 200`); this is explicitly not real
anti-cheat, since nothing on-chain can verify a score came from actual play
when gameplay state never leaves the browser. A real fix (committing to and
verifying the move sequence) is out of scope for now.

Status: on-chain program complete and tested against a local validator.
Not yet deployed to Cookie Chain or played through a real wallet.

### Nibble (`/games/nibble`, `anchor/crumb_jar/programs/nibble/`)
Single shared cookie, PvP, played with real COOK rather than an in-game
token. One baker funds the pot; anyone pays to bite; the bite that takes
the last of the cookie wins what's left. Heat rises with every bite and
with neglect — max heat burns the cookie and the whole pot goes to the
jar. Only the baker can glaze (cool it) or pull out early.

The whole game is one singleton PDA (`[b"oven"]`), recycled per batch.
The pot is the account's own lamport balance above rent, never a tracked
field, so it can't drift from reality. Every instruction calls
`apply_idle_heat_and_maybe_burn` first, so an overdue burn always lands
before anything else, including a baker trying to pull out from under it.
That function returns whether it burned, and nibble/glaze/pull all return
`Ok(())` immediately when it did, rather than falling through to their own
`require!(state == Live)`. A `require!` failing after the burn would roll
the whole transaction back, including the burn itself, since Solana
instructions are atomic; a real bug shipped this way once (fixed in
commit history), where every bite on an overdue cookie failed with
`CookieNotLive` and left it permanently stuck, since nothing could ever
process the burn that would have freed it.

Economy math lives in `math.rs` as pure integer functions (u128
intermediates, no floats) and is mirrored in `src/lib/solana/nibble.ts`
so the UI can preview a bite before signing. The frontend reads every
constant from the IDL rather than hardcoding, so it can't drift from what
the chain enforces.

`JAR_ADDRESS` is Cookie Chain's real community treasury
(`568tU9FM…wrxe`): off-curve, system-owned, already well above the
rent-exempt minimum, and only ever credited — never a signer.

Status: deployed to Cookie Chain at
`96A38RPbCfpcv8o5ZCbTSq8Q1kT6DBujHygJMiWLDbWj`. 9 math unit tests + 14
integration tests passing against a local validator (including a fresh
chain where the treasury account does not exist yet, and a dedicated
regression test for the atomic-rollback burn bug below). Bake, bite, and
the neglect-burn path (via both `crank_heat` and a bite landing on an
overdue cookie) are confirmed live with real COOK and a real Nightly
wallet. **Glaze and pull are still only integration-test-covered**, not
yet exercised through the UI with a real wallet.

A real bug shipped and was fixed here: `nibble`, `glaze`, and `pull` all
called `apply_idle_heat_and_maybe_burn` and then `require!(state ==
Live)`. If the idle check burned the cookie, that `require!` correctly
rejected the stale action, but Solana instructions are atomic, so failing
it also rolled back the burn itself; nothing was ever recorded on-chain.
Every bite on an overdue cookie failed with `CookieNotLive` and left it
permanently stuck, since no bite/glaze/pull could ever process the burn
that would have freed it (only `crank_heat`, which doesn't have this
pattern, could). Fixed by having the burn-check helper report whether it
burned, so the three callers return `Ok(())` immediately when it did
instead of falling through to a check that would undo it. Upgraded live
on Cookie Chain (same program ID) for 0.00242768 COOK.

### Lucky Slice (`/games/lucky-slice`, `anchor/crumb_jar/programs/lucky_slice/`)
Free, no-stakes timing game. A cookie hangs on a track, a knife sweeps up
and down it, and tapping at the right moment is the whole skill. Two
on-chain checkpoints per round, mirroring Cookie Crush's session pattern:

- `start_round` rolls the **target** on-chain (SlotHashes sysvar mixed with
  the player's key and their running attempt count, so rounds in the same
  slot never hash alike) and opens a `Round` PDA. The target comes from the
  chain specifically so a player can't keep re-rolling for an easy one
  without paying for a transaction each time.
- `submit_cut(actual_bps)` closes the round and scores it:
  `accuracy = 10_000 - |target - actual|`, keeping the running best.

The knife's motion and the tap that stops it are pure client-side gameplay
(`src/lib/luckySlice/knife.ts`, a constant-speed triangle wave so every
point on the cookie is equally reachable — a sine's slow turnarounds would
bias the ends). The chain can't watch an animation, so like Cookie Crush
this is a loose plausibility floor, not real anti-cheat: `MIN_ROUND_SLOTS`
only rejects a submit landing in the same slot the round started.

Leaderboard ranks by best accuracy, read via `getProgramAccounts` like the
other leaderboards.

Deployed to Cookie Chain at
`A666hnXcDdB9y8Vz2anJTLQg8R7tivBLEXTC4PBQaFoV` (upgraded in place from an
earlier single-instruction chance-based version). 5 integration tests
passing against a local validator. **Not yet played through a real
wallet** — the frontend is unverified in a browser.

### Future games
None yet beyond these four. Add a game by suggesting it; each new game
follows the same shared-infra, own-program pattern.

## Platform-wide rules
- Cookie Chain RPC: https://rpc.cookiescan.io — **mainnet only, no faucet/testnet/devnet.** Every transaction costs real $COOK.
- Every core game action must be a real on-chain transaction — no mocked/fake calls
- Nightly wallet must work
- Always show clear pending/confirmed/failed transaction states
- Handle errors gracefully (insufficient funds, rejected signature, cooldowns, etc.)

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
