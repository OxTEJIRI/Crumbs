# Crumbs — Cookie Chain Hackathon cApp

Crumbs is a hub for on-chain games on Cookie Chain, submitted to Cookie Chain's
"Build a cApp" hackathon. Wallet connection, the toast/transaction-status
system, and the header are shared across all games. Each game gets its own
route under `src/app/games/<slug>/` and, since games don't share on-chain
state, its own Anchor program under `anchor/<slug>/`.

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

### Future games
None yet — the hub at `/` has placeholder cards. Add a game by suggesting it;
each new game follows the same shared-infra, own-program pattern as Jar Wars.

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
