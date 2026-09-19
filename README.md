# 🍪 Crumbs

**Bake. Hoard. Raid. Survive the Jar Wars.**

Crumbs is an on-chain idle-strategy game on Cookie Chain. Every player owns a **Cookie Jar** — an on-chain account that passively generates `$CRUMB` over time. Claim your crumbs, raid other players' jars to steal theirs, and climb the leaderboard. Every meaningful action is a real transaction; nothing is mocked.

See [GAME_DESIGN.md](GAME_DESIGN.md) for the full design and [CLAUDE.md](CLAUDE.md) for the build order this repo follows.

## Status

All five steps of the build order are implemented and covered by tests against a local validator:

- [x] Wallet connect (Nightly) + jar minting
- [x] Passive crumb accrual + claim transaction
- [x] Raid mechanic (commit-reveal)
- [x] Leaderboard
- [x] Transaction status UI (toasts) + error handling

**Not yet done:** the program has not been deployed to Cookie Chain, so nothing here has been exercised through an actual wallet in a browser yet. Everything below is proven on-chain-correct by the Anchor test suite, not battle-tested end-to-end.

## Stack

- **Frontend:** Next.js, TypeScript, Tailwind CSS
- **Wallet:** `@solana/wallet-adapter-react`, Nightly support
- **On-chain:** Anchor program (`crumb_jar`), Rust
- **RPC:** Cookie Chain — `https://rpc.cookiescan.io`

## Project layout

```
src/                      Next.js frontend
  app/                     pages, layout, global styles
  components/
    jar/                   jar dashboard, raid panel, leaderboard
    tx/                     toast layer for transaction status
    wallet/                 wallet connect button, provider
  hooks/                   useCookieJar, useRaid, useLeaderboard, ...
  lib/solana/              program client, IDL, config, raid helpers

anchor/crumb_jar/         on-chain program (separate workspace — own
                            package.json/node_modules, not the frontend's)
  programs/crumb_jar/src/
    lib.rs                  instruction entrypoints
    state.rs                 CookieJar, Raid account layouts
    instructions/            initialize_jar, claim_crumbs, commit_raid, reveal_raid
    constants.rs, error.rs
  tests/crumb_jar.ts         integration tests (mint, accrual, raid, leaderboard)
```

## How it works

**Jar:** minting creates a PDA seeded on your wallet (`["cookie_jar", owner]`) holding crumb balance, production rate, last-claimed timestamp, and defense level.

**Accrual:** crumbs accrue as `elapsed_time × production_rate`, computed on-chain at claim time — no backend or cron needed.

**Raids:** two-transaction commit-reveal. The attacker commits `sha256(secret || attacker)` and stakes crumbs up front. On reveal, the outcome is drawn from `hash(secret, slot_hash_minted_after_commit)` — a slot hash that didn't exist at commit time, so the result is unknowable to the attacker until it's too late to back out of. The stake being taken at commit (not reveal) means walking away costs exactly what losing costs, so there's no reason to abandon an unfavorable raid. A reveal must wait until the chain is two slots past the commit slot, since the SlotHashes sysvar only gains an entry for a slot once that slot is over.

**Leaderboard:** ranks jars by settled wealth (banked + accrued-since-claim), read via `getProgramAccounts` rather than the Cookie DAS API. Cookie Chain does run a real DAS indexer at `api.cookiescan.io` (separate from the RPC at `rpc.cookiescan.io`), but DAS indexes Metaplex digital assets, and jars are plain Anchor program accounts, not Metaplex assets — confirmed by querying it directly (`getAssetsByOwner` for the program returns zero results). DAS becomes the right source once Jar/Recipe NFTs exist.

## Running the frontend

```bash
npm install
npm run dev
```

## Running the on-chain program

The Anchor workspace lives in `anchor/crumb_jar` and has its own dependencies:

```bash
cd anchor/crumb_jar
npm install
anchor test --validator legacy
```

`--validator legacy` uses `solana-test-validator` instead of Anchor's default `surfpool`. Requires the standard Solana/Anchor toolchain (Rust, `solana-cli`, `anchor-cli`) — see [Anchor's install docs](https://www.anchor-lang.com/docs/installation) if you don't have it set up.
