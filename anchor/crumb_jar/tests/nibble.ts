import * as anchor from "@anchor-lang/core";
import { Program } from "@anchor-lang/core";
import { NibbleProgram } from "../target/types/nibble_program";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const LAMPORTS_PER_COOK = anchor.web3.LAMPORTS_PER_SOL;
const cook = (amount: number) => Math.round(amount * LAMPORTS_PER_COOK);

const MAX_HP = 10_000;
const MAX_HEAT = 10_000;
const DAMAGE_MIN_BPS = 300;
const DAMAGE_MAX_BPS = 3_000;
const DAMAGE_K = 5_000;
const PAYOUT_SHARE_BPS = 6_000;
const HEAT_BASE = 100;
const HEAT_SCALE = 2_000;
const JAR_SHARE_BPS = 200;
const GLAZE_BASE_COST_LAMPORTS = 5_000_000;
const GLAZE_HEAT_DIVISOR = 20;
const IDLE_HEAT = 2_500;

/**
 * Heat can also rise from idleness between our own test steps — the validator
 * advances ~2.5 slots/sec against a 15-slot idle window, so a slow RPC round
 * trip is enough to add a tick. HP and payouts are unaffected by idling, so
 * those stay exact; heat is only ever checked as "the expected value, plus
 * zero or more whole idle ticks".
 */
function assertHeatAllowingIdleTicks(actual: number, expected: number, label: string) {
  if (actual === expected) return;
  const surplus = actual - expected;
  if (surplus > 0 && surplus % IDLE_HEAT === 0) return;
  if (actual === MAX_HEAT && expected <= MAX_HEAT) return;
  throw new Error(
    `${label}: expected heat ${expected} (plus optional whole ${IDLE_HEAT} idle ticks), got ${actual}`
  );
}

/** Mirrors math.rs exactly, so the test predicts what the program should do. */
function predictDamage(bid: number, hp: number): number {
  if (hp === 0 || bid === 0) return 0;
  const range = DAMAGE_MAX_BPS - DAMAGE_MIN_BPS;
  const denom = bid + DAMAGE_K * hp;
  const damage = DAMAGE_MIN_BPS + Math.floor((range * bid) / denom);
  return Math.min(damage, hp);
}

function predictPayout(potAfterBid: number, damage: number, hpBefore: number): number {
  if (hpBefore === 0 || damage === 0) return 0;
  const crumbs = Math.floor((potAfterBid * damage * PAYOUT_SHARE_BPS) / (hpBefore * 10_000));
  return Math.min(crumbs, potAfterBid);
}

function predictHeatDelta(damage: number): number {
  return HEAT_BASE + Math.floor((HEAT_SCALE * damage) / MAX_HP);
}

function predictGlazeCost(heat: number): number {
  return GLAZE_BASE_COST_LAMPORTS + Math.floor((heat * heat) / GLAZE_HEAT_DIVISOR);
}

describe("nibble", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.nibbleProgram as Program<NibbleProgram>;
  const provider = anchor.getProvider() as anchor.AnchorProvider;
  const baker = provider.wallet.publicKey;

  const [cookie] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("oven")],
    program.programId
  );

  // Placeholder jar from constants.rs — TODO(before mainnet deploy): swap
  // for the real Cookie Chain treasury once confirmed.
  const jar = new anchor.web3.PublicKey(
    "7261MGftUdiVdfb4dJpPkL2bize2aRcw3ehpSm9No4Uj"
  );

  const nibbler = anchor.web3.Keypair.generate();

  const balanceOf = (pubkey: anchor.web3.PublicKey) =>
    provider.connection.getBalance(pubkey);

  interface TxLedger {
    /** Lamports each account gained (negative for a loss) within the tx. */
    delta: (account: anchor.web3.PublicKey) => number;
    /** What the fee payer was actually charged. */
    fee: number;
  }

  /**
   * Every account's balance movement inside one transaction, read from its
   * recorded pre/post balances. Two `getBalance` calls around the send would
   * instead fold in anything else that touched the account between the reads.
   *
   * The fee is derived from conservation rather than taken from `meta.fee`:
   * lamports can only leave a transaction as fees, so the net movement across
   * every account is exactly what was charged. `meta.fee` reports only the
   * 5000-lamport signature base here and omits the compute-driven remainder,
   * which is small but varies from run to run.
   */
  const ledgerFor = async (signature: string): Promise<TxLedger> => {
    for (let attempt = 0; attempt < 20; attempt++) {
      const detail = await provider.connection.getTransaction(signature, {
        commitment: "confirmed",
        maxSupportedTransactionVersion: 0,
      });
      if (!detail?.meta) {
        await sleep(300);
        continue;
      }

      const { preBalances, postBalances } = detail.meta;
      const keys = detail.transaction.message
        .getAccountKeys()
        .staticAccountKeys.map((key) => key.toString());
      const deltas = new Map<string, number>();
      let net = 0;
      keys.forEach((key, index) => {
        const delta = postBalances[index] - preBalances[index];
        deltas.set(key, delta);
        net += delta;
      });

      return {
        delta: (account) => {
          const value = deltas.get(account.toString());
          if (value === undefined) {
            throw new Error(`${account.toString()} is not in ${signature}`);
          }
          return value;
        },
        fee: -net,
      };
    }
    throw new Error(`Could not read balances for ${signature}`);
  };

  const rentForCookie = async () => {
    const info = await provider.connection.getAccountInfo(cookie);
    if (!info) throw new Error("Cookie account does not exist yet");
    return provider.connection.getMinimumBalanceForRentExemption(info.data.length);
  };

  const potOf = async () => (await balanceOf(cookie)) - (await rentForCookie());

  before(async () => {
    const airdrop = await provider.connection.requestAirdrop(
      nibbler.publicKey,
      cook(10)
    );
    const blockhash = await provider.connection.getLatestBlockhash();
    await provider.connection.confirmTransaction(
      { signature: airdrop, ...blockhash },
      "confirmed"
    );
  });

  // Each `it` closes out its cookie (pull or let it get eaten) so the next
  // one starts from a known Empty-equivalent state, matching how the
  // singleton actually gets reused in real play.
  const endCurrentBatch = async () => {
    const account = await program.account.cookie.fetchNullable(cookie);
    if (!account || !("live" in account.state)) return;
    await program.methods
      .pull()
      .accountsPartial({ baker, cookie, jar })
      .rpc();
  };

  it("Rejects a bake below the minimum", async () => {
    try {
      await program.methods
        .bake(new anchor.BN(1))
        .accountsPartial({ baker, cookie })
        .rpc();
      throw new Error("Expected a tiny bake to be rejected");
    } catch (err) {
      if (!String(err).includes("BakeTooSmall")) throw err;
    }
  });

  it("Bakes a fresh cookie with the correct starting state and pot", async () => {
    const bakeAmount = cook(0.1);
    const bakerBalanceBefore = await balanceOf(baker);

    await program.methods
      .bake(new anchor.BN(bakeAmount))
      .accountsPartial({ baker, cookie })
      .rpc();

    const account = await program.account.cookie.fetch(cookie);
    if (!("live" in account.state)) throw new Error("Expected state Live");
    if (account.hp !== MAX_HP) throw new Error(`Expected hp ${MAX_HP}, got ${account.hp}`);
    if (account.heat !== 0) throw new Error(`Expected heat 0, got ${account.heat}`);
    if (account.baker.toString() !== baker.toString()) {
      throw new Error("Baker not recorded correctly");
    }

    const cookieBalance = await balanceOf(cookie);
    const rent = await provider.connection.getMinimumBalanceForRentExemption(
      (await provider.connection.getAccountInfo(cookie))!.data.length
    );
    const pot = cookieBalance - rent;
    if (pot !== bakeAmount) {
      throw new Error(`Expected pot ${bakeAmount}, got ${pot}`);
    }

    const bakerBalanceAfter = await balanceOf(baker);
    // Spent at least bakeAmount (plus a small tx fee, plus rent if this is
    // the very first bake ever — already-existing account on later runs
    // means no rent this time).
    if (bakerBalanceAfter > bakerBalanceBefore - bakeAmount) {
      throw new Error("Baker's balance didn't decrease by at least the bake amount");
    }
  });

  it("Rejects baking again while already live", async () => {
    try {
      await program.methods
        .bake(new anchor.BN(cook(0.1)))
        .accountsPartial({ baker, cookie })
        .rpc();
      throw new Error("Expected a second bake to be rejected");
    } catch (err) {
      if (!String(err).includes("CookieAlreadyLive")) throw err;
    }
  });

  it("Rejects the baker nibbling their own cookie inside the lock window", async () => {
    try {
      await program.methods
        .nibble(new anchor.BN(cook(0.01)))
        .accountsPartial({ nibbler: baker, cookie, jar })
        .rpc();
      throw new Error("Expected the baker to be locked out");
    } catch (err) {
      if (!String(err).includes("BakerLocked")) throw err;
    }
  });

  it("Rejects a bid below the minimum", async () => {
    try {
      await program.methods
        .nibble(new anchor.BN(1))
        .accountsPartial({ nibbler: nibbler.publicKey, cookie, jar })
        .signers([nibbler])
        .rpc();
      throw new Error("Expected a tiny bid to be rejected");
    } catch (err) {
      if (!String(err).includes("BidTooSmall")) throw err;
    }
  });

  it("Nibbles for damage and a payout matching the documented formulas", async () => {
    const before = await program.account.cookie.fetch(cookie);
    const potBefore = await balanceOf(cookie);

    const bid = cook(0.05);
    const tx = await program.methods
      .nibble(new anchor.BN(bid))
      .accountsPartial({ nibbler: nibbler.publicKey, cookie, jar })
      .signers([nibbler])
      .rpc();

    const after = await program.account.cookie.fetch(cookie);
    const rent = await rentForCookie();
    const potAfterBid = potBefore - rent + bid;

    const expectedDamage = predictDamage(bid, before.hp);
    const expectedPayout = predictPayout(potAfterBid, expectedDamage, before.hp);
    const expectedHeatDelta = predictHeatDelta(expectedDamage);

    if (after.hp !== before.hp - expectedDamage) {
      throw new Error(
        `Expected hp ${before.hp - expectedDamage}, got ${after.hp} (predicted damage ${expectedDamage})`
      );
    }
    assertHeatAllowingIdleTicks(
      after.heat,
      Math.min(MAX_HEAT, before.heat + expectedHeatDelta),
      "nibble"
    );
    if (after.nibbleCount !== before.nibbleCount + 1) {
      throw new Error("nibble_count did not increment");
    }
    if (after.lastNibbler.toString() !== nibbler.publicKey.toString()) {
      throw new Error("last_nibbler not recorded correctly");
    }

    // The provider wallet is the fee payer even though the nibbler co-signs,
    // so the nibbler's balance moves by exactly -bid +payout, with no fee.
    const actualPayout = (await ledgerFor(tx)).delta(nibbler.publicKey) + bid;
    if (actualPayout !== expectedPayout) {
      throw new Error(
        `Expected nibbler to net ${expectedPayout} lamports of payout, actual accounting gives ${actualPayout}`
      );
    }

    console.log(
      `Nibble: bid=${bid} damage=${expectedDamage}bps payout=${expectedPayout} heat=${after.heat}`
    );
  });

  it("Rejects glaze when the cost would exceed max_cost", async () => {
    try {
      await program.methods
        .glaze(new anchor.BN(0))
        .accountsPartial({ baker, cookie, jar })
        .rpc();
      throw new Error("Expected glaze to be rejected");
    } catch (err) {
      if (!String(err).includes("GlazeCostExceeded")) throw err;
    }
  });

  it("Glazes: reduces heat, restores hp, costs the documented formula", async () => {
    const before = await program.account.cookie.fetch(cookie);
    const potBefore = await potOf();

    await program.methods
      .glaze(new anchor.BN(cook(1))) // generous ceiling
      .accountsPartial({ baker, cookie, jar })
      .rpc();

    const after = await program.account.cookie.fetch(cookie);
    const expectedHp = Math.min(MAX_HP, before.hp + 500);

    if (after.heat >= before.heat) {
      throw new Error(
        `Expected glazing to lower heat from ${before.heat}, got ${after.heat}`
      );
    }
    if (after.hp !== expectedHp) {
      throw new Error(`Expected hp ${expectedHp}, got ${after.hp}`);
    }

    // The glaze payment goes straight into the pot, so the pot's growth is
    // the cost exactly — no transaction fee mixed in, unlike the baker's own
    // balance.
    const potAfter = await potOf();
    const charged = potAfter - potBefore;
    const expectedCost = predictGlazeCost(before.heat);
    if (charged !== expectedCost) {
      throw new Error(
        `Expected glaze to add exactly ${expectedCost} lamports to the pot, added ${charged}`
      );
    }

    console.log(
      `Glaze cost ${charged} lamports, heat ${before.heat} -> ${after.heat}, hp now ${after.hp}`
    );
  });

  it("Rejects a non-baker pulling", async () => {
    try {
      await program.methods
        .pull()
        .accountsPartial({ baker: nibbler.publicKey, cookie, jar })
        .signers([nibbler])
        .rpc();
      throw new Error("Expected a non-baker pull to be rejected");
    } catch (err) {
      if (!String(err).includes("NotTheBaker")) throw err;
    }
  });

  it("Pulls: baker and jar split the pot correctly, state becomes Pulled", async () => {
    const rent = await rentForCookie();

    const tx = await program.methods
      .pull()
      .accountsPartial({ baker, cookie, jar })
      .rpc();

    const ledger = await ledgerFor(tx);
    const jarGained = ledger.delta(jar);
    const bakerGained = ledger.delta(baker) + ledger.fee;

    // The pot is what the cookie actually paid out in this very transaction,
    // rather than a balance read beforehand — the transaction is the ground
    // truth for what the split was applied to.
    const paidOut = -ledger.delta(cookie);
    const expectedJarCut = Math.floor((paidOut * JAR_SHARE_BPS) / 10_000);
    const expectedBakerPayout = paidOut - expectedJarCut;

    const after = await program.account.cookie.fetch(cookie);
    if (!("pulled" in after.state)) throw new Error("Expected state Pulled");

    const cookieBalanceAfter = await balanceOf(cookie);
    if (cookieBalanceAfter !== rent) {
      throw new Error(
        `Expected the cookie account to be drained to rent (${rent}), it holds ${cookieBalanceAfter}`
      );
    }
    if (jarGained !== expectedJarCut) {
      throw new Error(`Expected jar to receive ${expectedJarCut}, got ${jarGained}`);
    }
    if (bakerGained !== expectedBakerPayout) {
      throw new Error(
        `Expected baker to net ${expectedBakerPayout}, got ${bakerGained}`
      );
    }
    if (jarGained + bakerGained !== paidOut) {
      throw new Error(
        `Jar (${jarGained}) and baker (${bakerGained}) should account for everything the cookie paid out (${paidOut})`
      );
    }

    console.log(
      `Pulled: pot ${paidOut} split into baker ${bakerGained} + jar ${jarGained}`
    );
  });

  it("Bakes again after a Pulled ending, resetting state and incrementing batch_id", async () => {
    const before = await program.account.cookie.fetch(cookie);

    await program.methods
      .bake(new anchor.BN(cook(0.1)))
      .accountsPartial({ baker, cookie })
      .rpc();

    const after = await program.account.cookie.fetch(cookie);
    if (!("live" in after.state)) throw new Error("Expected state Live");
    if (after.hp !== MAX_HP || after.heat !== 0) {
      throw new Error("Fresh bake should reset hp/heat");
    }
    if (!after.batchId.eq(before.batchId.add(new anchor.BN(1)))) {
      throw new Error("batch_id should increment on every bake");
    }

    await endCurrentBatch();
  });

  it("Rejects cranking before the cookie has been idle long enough", async () => {
    await program.methods
      .bake(new anchor.BN(cook(0.1)))
      .accountsPartial({ baker, cookie })
      .rpc();

    try {
      await program.methods
        .crankHeat()
        .accountsPartial({ cranker: baker, cookie, jar })
        .rpc();
      throw new Error("Expected crank_heat to be rejected as not idle");
    } catch (err) {
      if (!String(err).includes("NotIdleYet")) throw err;
    }

    await endCurrentBatch();
  });

  it("Burns a cookie left idle long enough, sending the whole pot to the jar", async () => {
    const bakeAmount = cook(0.1);
    await program.methods
      .bake(new anchor.BN(bakeAmount))
      .accountsPartial({ baker, cookie })
      .rpc();

    const jarBalanceBefore = await balanceOf(jar);

    // Heat climbs IDLE_HEAT per idle window, so a cookie starting at 0 needs
    // MAX_HEAT / IDLE_HEAT windows before it burns. Rather than guessing the
    // validator's slot rate, crank repeatedly until it does.
    let after = await program.account.cookie.fetch(cookie);
    for (let attempt = 0; attempt < 12 && "live" in after.state; attempt++) {
      await sleep(8_000);
      try {
        await program.methods
          .crankHeat()
          .accountsPartial({ cranker: baker, cookie, jar })
          .rpc();
      } catch (err) {
        // Slot rate slower than expected this round; wait and try again.
        if (!String(err).includes("NotIdleYet")) throw err;
      }
      after = await program.account.cookie.fetch(cookie);
    }

    if (!("burned" in after.state)) {
      throw new Error(
        `Expected state Burned after a long enough idle window, got ${JSON.stringify(after.state)} (heat=${after.heat})`
      );
    }

    const jarBalanceAfter = await balanceOf(jar);
    const rent = await provider.connection.getMinimumBalanceForRentExemption(
      (await provider.connection.getAccountInfo(cookie))!.data.length
    );
    const cookieBalanceAfter = await balanceOf(cookie);

    if (cookieBalanceAfter !== rent) {
      throw new Error(
        `Expected the cookie account to hold only rent after burning, has ${cookieBalanceAfter} vs rent ${rent}`
      );
    }
    if (jarBalanceAfter - jarBalanceBefore !== bakeAmount) {
      throw new Error(
        `Expected the jar to receive the full ${bakeAmount} lamport pot, got ${jarBalanceAfter - jarBalanceBefore}`
      );
    }

    console.log(`Burned from neglect — jar received the full pot: ${bakeAmount} lamports`);
  });
});
