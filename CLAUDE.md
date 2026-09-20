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
before anything else — including a baker trying to pull out from under it.

Economy math lives in `math.rs` as pure integer functions (u128
intermediates, no floats) and is mirrored in `src/lib/solana/nibble.ts`
so the UI can preview a bite before signing. The frontend reads every
constant from the IDL rather than hardcoding, so it can't drift from what
the chain enforces.

`JAR_ADDRESS` is Cookie Chain's real community treasury
(`568tU9FM…wrxe`): off-curve, system-owned, already well above the
rent-exempt minimum, and only ever credited — never a signer.

Status: program complete, 9 math unit tests + 13 integration tests passing
against a local validator (including a fresh chain where the treasury
account does not exist yet). **Not yet deployed to Cookie Chain, and never
played through a real wallet** — the connected-wallet UI is unverified.

### Future games
None yet beyond these three. Add a game by suggesting it; each new game
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
