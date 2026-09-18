# Crumbs — Cookie Chain Hackathon Game

See docs/GAME_DESIGN.md for the full game design.

## Stack
- Next.js 14+, TypeScript, Tailwind CSS
- @solana/web3.js, @solana/wallet-adapter-react (Nightly wallet support required)
- Anchor framework for on-chain programs
- Cookie Chain RPC: https://rpc.cookiescan.io
- $CRUMB token: SPL Token-2022
- Jar/Recipe NFTs: Metaplex

## Current build order
1. Wallet connect + jar minting
2. Passive crumb accrual + claim transaction
3. Raid mechanic (commit-reveal)
4. Leaderboard (Cookie DAS API)
5. Transaction status UI + error handling

## Rules
- Every core game action must be a real on-chain transaction — no mocked/fake calls
- Nightly wallet must work
- Always show clear pending/confirmed/failed transaction states
- Handle errors gracefully (insufficient funds, rejected signature, cooldowns, etc.)

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
