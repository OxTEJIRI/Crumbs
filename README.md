# 🍪 Crumbs

**Bake. Hoard. Raid. Survive the Jar Wars.**

**Live app:** https://crumbs-liard.vercel.app
**On-chain program:** [`85eL8gcexHuQmX8BvpMYxVPobmrcFRW62XBGGVuhKaLr`](https://cookiescan.io/account/85eL8gcexHuQmX8BvpMYxVPobmrcFRW62XBGGVuhKaLr) on Cookie Chain

Built for Cookie Chain's "Build a cApp" hackathon.

Crumbs is a hub for on-chain games on Cookie Chain — connect a wallet once, then pick a game to play. Every game action is a real transaction; nothing is mocked.

The first game is **Jar Wars** (`/games/jar-wars`): every player owns a **Cookie Jar**, an on-chain account that passively generates `$CRUMB` over time. Claim your crumbs, raid other players' jars to steal theirs, and climb the leaderboard.

See [GAME_DESIGN.md](GAME_DESIGN.md) for Jar Wars' full design and [CLAUDE.md](CLAUDE.md) for the build order this repo follows.

## Status

**Jar Wars** — all five build-order steps are implemented and covered by tests against a local validator:

- [x] Wallet connect (Nightly) + jar minting
- [x] Passive crumb accrual + claim transaction
- [x] Raid mechanic (commit-reveal)
- [x] Leaderboard
- [x] Transaction status UI (toasts) + error handling

Deployed to Cookie Chain at `85eL8gcexHuQmX8BvpMYxVPobmrcFRW62XBGGVuhKaLr`, and the full mint flow has been clicked through end-to-end with a real Nightly wallet in a browser.

**More games** — none yet; the hub has placeholder slots ready for them.

## Nightly setup

Nightly needs Cookie Chain added as a custom network before it'll sign and send correctly — without this, minting fails with an opaque `WalletSendTransactionError: Failed to send transaction` (Nightly is silently trying to broadcast against its default network, where `crumb_jar` doesn't exist). In Nightly's settings, add a custom RPC:

- **RPC URL:** `https://rpc.cookiescan.io`
- **Name:** Cookie Chain (or whatever label it accepts)

Then switch Nightly to that network before connecting.

## Stack

- **Frontend:** Next.js, TypeScript, Tailwind CSS
- **Wallet:** `@solana/wallet-adapter-react`, Nightly support
- **On-chain:** Anchor program (`crumb_jar`), Rust
- **RPC:** Cookie Chain — `https://rpc.cookiescan.io`

## Project layout

```
src/                      Next.js frontend
  app/
    page.tsx                the hub — lists every game
    games/jar-wars/          Jar Wars' page (hero, dashboard, sub-header)
  components/
    hub/                     GameCard, hub-only UI
    jar/                     Jar Wars: jar dashboard, raid panel, leaderboard
    tx/                      toast layer for transaction status (shared)
    wallet/                  wallet connect button, provider (shared)
    layout/                  global Header (shared)
  hooks/                   useCookieJar, useRaid, useLeaderboard, ...
  lib/solana/              program client, IDL, config, raid helpers

anchor/crumb_jar/         Jar Wars' on-chain program (separate workspace —
                            own package.json/node_modules, not the frontend's)
  programs/crumb_jar/src/
    lib.rs                  instruction entrypoints
    state.rs                 CookieJar, Raid account layouts
    instructions/            initialize_jar, claim_crumbs, commit_raid, reveal_raid
    constants.rs, error.rs
  tests/crumb_jar.ts         integration tests (mint, accrual, raid, leaderboard)
```

Wallet connection, the toast system, and the header are shared across all games. A new game gets its own route under `src/app/games/<slug>/` and its own Anchor program under `anchor/<slug>/`, independent of Jar Wars' on-chain state.

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

### Deploying

```bash
anchor build --arch v0
anchor deploy --provider.cluster https://rpc.cookiescan.io --provider.wallet <path-to-upgrade-authority-keypair>
```

**`--arch v0` is required, on both build and deploy.** Anchor defaults to `--arch v3` (the newest SBPF version), but Cookie Chain hasn't activated that feature on-chain yet — a `v3` build deploys with `invalid account data for instruction` / `Detected sbpf_version required by the executable which are not enabled`. This can't be pinned in `Anchor.toml` (an `arch` key there is silently ignored), so it has to be passed on every build and deploy command by hand.

Cookie Chain is **mainnet — there is no faucet, testnet, or devnet**. Every transaction, including a failed deploy attempt, costs real $COOK. Check the actual cost first with `solana rent <bytes> --url https://rpc.cookiescan.io` before deploying.
