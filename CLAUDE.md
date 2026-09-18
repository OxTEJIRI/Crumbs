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