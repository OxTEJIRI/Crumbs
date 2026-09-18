# 🍪 Crumbs — Game Design Document

**Tagline:** *Bake. Hoard. Raid. Survive the Jar Wars.*

## The Concept

Crumbs is an on-chain idle-strategy game where every player owns a **Cookie Jar** — an on-chain account that passively generates `$CRUMB` tokens over time. Players grow their jar, defend it, and raid other players' jars to steal their crumbs. Every meaningful action — claiming crumbs, raiding, upgrading, staking — is a real transaction on Cookie Chain.

It's part idle game, part PvP, part light DeFi. Easy to understand in 30 seconds, deep enough to keep players coming back to defend their stash.

---

## Core Loop

1. **Connect wallet** (Nightly) → mint a Cookie Jar (on-chain NFT representing your base)
2. **Jar passively accrues** `$CRUMB` over real time
3. **Claim crumbs** on-chain whenever you want (transaction #1)
4. **Spend crumbs** to upgrade your jar's production rate, or buy defenses
5. **Raid other jars** — commit-reveal randomness determines success; winner steals a % of the target's crumbs (transaction #2)
6. **Climb the leaderboard**, defend your stash, repeat

This loop is simple enough to demo in under 2 minutes for judges, but has enough layers (defense, staking, raiding) to feel like a real game.

---

## Feature Breakdown

### 1. Wallet & Identity
- Nightly wallet connection (required by hackathon rules)
- Display connected wallet address + jar status in the header
- Auto-detect if a player already has a jar; if not, prompt to mint one

### 2. Cookie Jar (on-chain account + NFT)
- Minting a jar = one on-chain transaction, creates a PDA (program-derived account) storing jar state: crumb balance, production rate, last-claimed timestamp, defense level
- Jar is represented visually as an NFT (Metaplex) that levels up in appearance as the player upgrades

### 3. Passive Crumb Accrual
- Crumbs accrue based on elapsed time × production rate (calculated on-chain at claim time, no backend needed)
- Frontend shows a live-ticking counter (off-chain estimate) so it *feels* alive between transactions
- Claiming is a manual transaction — gives players a natural, frequent reason to interact on-chain

### 4. Raiding (PvP)
- Players choose a target jar and initiate a raid
- Outcome determined via **commit-reveal randomness** on-chain (fair, tamper-resistant, fully verifiable)
- Successful raid steals a percentage of the target's unclaimed crumbs
- Raid has a cooldown per player to prevent spam/bot abuse
- Losing a raid costs the attacker a small crumb penalty — adds real stakes

### 5. Defense & Upgrades
- Spend crumbs to upgrade production rate ("bigger oven") or defense rating ("thicker jar lid")
- Higher defense reduces raid success rate against you
- Creates a meaningful spend sink so crumbs don't just pile up unused

### 6. Ovens (Staking)
- Players can stake crumbs into an "Oven" for a locked period in exchange for a boosted future yield
- Staked crumbs are raid-immune, but locked and illiquid — a risk/reward choice
- This is the DeFi layer that ties into Cookie Chain's broader ecosystem

### 7. Recipe NFTs (optional power-ups)
- Special Metaplex NFTs that grant temporary boosts: +production, +defense, raid immunity, bonus steal %
- Tradeable — players can buy/sell Recipe NFTs via **Cookieswap** integration
- Gives the game a light marketplace/economy layer

### 8. Leaderboard & Analytics Dashboard
- Real-time leaderboard: richest jars, most successful raiders, most-raided targets
- Powered by **Cookie DAS API** / **cookie-mcp** pulling live on-chain data
- Adds the "analytics dashboard" element the hackathon explicitly calls out

### 9. Transaction Feedback & UX
- Toast notifications for every transaction: pending → confirming → confirmed/failed
- Clear error handling (insufficient funds, raid on cooldown, wallet rejected, etc.)
- Direct links to view any transaction on **CookieScan**

---

## How This Maps to Hackathon Requirements

| Requirement | How Crumbs delivers it |
|---|---|
| Wallet connection (Nightly required) | Core entry point to the game |
| On-chain functionality | Jar state, crumb balances, raids all live on-chain |
| Execute transactions + real-time feedback | Claim, raid, upgrade, stake — all transactions with toast/status UI |
| View app-specific data/activity | Jar dashboard, personal transaction history |
| Analytics/dashboards | Leaderboard powered by Cookie DAS API |
| Liquidity/swaps/trading (optional) | Recipe NFT trading via Cookieswap |
| Clear transaction status | Pending/confirmed/failed states everywhere |
| Error handling | Cooldowns, insufficient balance, rejected signatures all handled gracefully |

---

## Technical Architecture

**On-chain (Anchor programs on Cookie Chain, SVM):**
- `crumb_jar` — jar creation, state, crumb accrual/claim logic
- `raid` — commit-reveal raid logic, cooldowns, steal calculation
- `oven_staking` — stake/unstake, locked yield boost
- `$CRUMB` token — SPL Token-2022
- Jar & Recipe NFTs — Metaplex standard

**Frontend:**
- Next.js + TypeScript + Tailwind
- `@solana/wallet-adapter-react` with Nightly support
- RPC: `https://rpc.cookiescan.io`
- Cookie DAS API for leaderboard/analytics data
- Cookieswap embed or link-out for Recipe NFT trading

---

## MVP Scope (build this first)

To keep this realistic for a hackathon timeline, build in this order:

1. Wallet connect + jar minting
2. Passive accrual + claim transaction
3. Raid mechanic (even a simplified version without full commit-reveal at first, upgrading to it once core loop works)
4. Basic leaderboard
5. Transaction status UI + error handling

**Stretch goals** (add if time allows): Oven staking, Recipe NFTs + Cookieswap trading, jar visual upgrades, raid history feed.

---

## Why This Wins

- **Instantly understandable** — judges get it in one sentence: "steal crumbs from other players' cookie jars"
- **Genuinely on-chain** — not a skin on a database; every core action is a real transaction
- **Hits every optional integration** — Cookieswap, Cookie DAS API, and cookie-mcp all have a natural home in the design, not bolted on
- **Scales with time available** — MVP is achievable in a few days, stretch goals give room to impress if you have more time
- **Fun to demo live** — raiding another wallet on stage is a great hackathon pitch moment