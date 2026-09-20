import * as anchor from "@anchor-lang/core";
import { Program } from "@anchor-lang/core";
import { createHash, randomBytes } from "crypto";
import { CrumbJar } from "../target/types/crumb_jar";

const RAID_STAKE = 100;
const RAID_STEAL_PERCENT = 20;

const jarPda = (programId: anchor.web3.PublicKey, key: anchor.web3.PublicKey) =>
  anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("cookie_jar"), key.toBuffer()],
    programId
  )[0];

const commitmentFor = (secret: Buffer, attacker: anchor.web3.PublicKey) =>
  createHash("sha256")
    .update(Buffer.concat([secret, attacker.toBuffer()]))
    .digest();

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * The SlotHashes sysvar only gains an entry for slot N once N is over, so a
 * reveal needs the chain to be two slots past the commit before a hash newer
 * than the commit slot is readable.
 */
const waitForSlotPast = async (
  connection: anchor.web3.Connection,
  slot: number
) => {
  while ((await connection.getSlot("confirmed")) <= slot + 1) {
    await sleep(400);
  }
};

describe("crumb_jar", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.crumbJar as Program<CrumbJar>;
  const provider = anchor.getProvider() as anchor.AnchorProvider;

  const owner = provider.wallet.publicKey;
  const jar = jarPda(program.programId, owner);

  it("Mints a cookie jar for the connected wallet", async () => {
    const tx = await program.methods
      .initializeJar()
      .accountsPartial({ owner, jar })
      .rpc();
    console.log("Initialize jar transaction signature", tx);

    const jarAccount = await program.account.cookieJar.fetch(jar);
    if (!jarAccount.owner.equals(owner)) {
      throw new Error("Jar owner mismatch");
    }
    if (jarAccount.crumbBalance.toNumber() !== 0) {
      throw new Error("New jar should start with a zero crumb balance");
    }
  });

  it("Accrues crumbs over elapsed time and claims them", async () => {
    const before = await program.account.cookieJar.fetch(jar);

    // Let wall-clock time pass so the on-chain clock reports a non-zero interval.
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const tx = await program.methods
      .claimCrumbs()
      .accountsPartial({ owner, jar })
      .rpc();
    console.log("Claim crumbs transaction signature", tx);

    const after = await program.account.cookieJar.fetch(jar);

    const gained = after.crumbBalance.sub(before.crumbBalance).toNumber();
    const elapsed = after.lastClaimedTs.sub(before.lastClaimedTs).toNumber();
    const rate = after.productionRate.toNumber();

    if (elapsed <= 0) {
      throw new Error(`Expected time to advance, got ${elapsed}s`);
    }
    if (gained !== elapsed * rate) {
      throw new Error(
        `Expected ${elapsed * rate} crumbs for ${elapsed}s at rate ${rate}, got ${gained}`
      );
    }
    console.log(`Accrued ${gained} crumbs over ${elapsed}s`);
  });

  it("Resets the accrual window so an immediate re-claim yields nothing", async () => {
    const before = await program.account.cookieJar.fetch(jar);

    await program.methods.claimCrumbs().accountsPartial({ owner, jar }).rpc();

    const after = await program.account.cookieJar.fetch(jar);
    const elapsed = after.lastClaimedTs.sub(before.lastClaimedTs).toNumber();
    const gained = after.crumbBalance.sub(before.crumbBalance).toNumber();

    if (gained !== elapsed * after.productionRate.toNumber()) {
      throw new Error(
        `Back-to-back claim should only credit the ${elapsed}s since the last one, got ${gained}`
      );
    }
  });

  describe("raiding", () => {
    const victim = anchor.web3.Keypair.generate();
    const victimJar = jarPda(program.programId, victim.publicKey);
    const [raid] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("raid"), owner.toBuffer()],
      program.programId
    );

    before(async () => {
      const airdrop = await provider.connection.requestAirdrop(
        victim.publicKey,
        anchor.web3.LAMPORTS_PER_SOL
      );
      const blockhash = await provider.connection.getLatestBlockhash();
      await provider.connection.confirmTransaction(
        { signature: airdrop, ...blockhash },
        "confirmed"
      );

      await program.methods
        .initializeJar()
        .accountsPartial({ owner: victim.publicKey, jar: victimJar })
        .signers([victim])
        .rpc();

      // Both jars need a stock of crumbs: the attacker to fund the stake, the
      // victim to have something worth stealing.
      await sleep(11000);
      await program.methods.claimCrumbs().accountsPartial({ owner, jar }).rpc();
      await program.methods
        .claimCrumbs()
        .accountsPartial({ owner: victim.publicKey, jar: victimJar })
        .signers([victim])
        .rpc();
    });

    it("Rejects a raid against your own jar", async () => {
      const secret = randomBytes(32);
      try {
        await program.methods
          .commitRaid(Array.from(commitmentFor(secret, owner)))
          .accountsPartial({
            attacker: owner,
            attackerJar: jar,
            targetJar: jar,
            raid,
          })
          .rpc();
        throw new Error("Expected self-raid to be rejected");
      } catch (err) {
        if (!String(err).includes("SelfRaid")) throw err;
      }
    });

    it("Rejects a reveal whose secret does not match the commitment", async () => {
      const secret = randomBytes(32);
      await program.methods
        .commitRaid(Array.from(commitmentFor(secret, owner)))
        .accountsPartial({
          attacker: owner,
          attackerJar: jar,
          targetJar: victimJar,
          raid,
        })
        .rpc();

      try {
        await program.methods
          .revealRaid(Array.from(randomBytes(32)))
          .accountsPartial({
            attacker: owner,
            attackerJar: jar,
            targetJar: victimJar,
            raid,
            slotHashes: anchor.web3.SYSVAR_SLOT_HASHES_PUBKEY,
          })
          .rpc();
        throw new Error("Expected mismatched reveal to be rejected");
      } catch (err) {
        if (!String(err).includes("InvalidReveal")) throw err;
      }

      const { commitSlot } = await program.account.raid.fetch(raid);
      await waitForSlotPast(provider.connection, commitSlot.toNumber());

      const beforeAttacker = await program.account.cookieJar.fetch(jar);
      const beforeVictim = await program.account.cookieJar.fetch(victimJar);

      const tx = await program.methods
        .revealRaid(Array.from(secret))
        .accountsPartial({
          attacker: owner,
          attackerJar: jar,
          targetJar: victimJar,
          raid,
          slotHashes: anchor.web3.SYSVAR_SLOT_HASHES_PUBKEY,
        })
        .rpc();

      // A just-confirmed transaction is not always queryable yet.
      let logs = "";
      for (let attempt = 0; attempt < 10 && !logs; attempt++) {
        const detail = await provider.connection.getTransaction(tx, {
          commitment: "confirmed",
          maxSupportedTransactionVersion: 0,
        });
        logs = detail?.meta?.logMessages?.join("\n") ?? "";
        if (!logs) await sleep(500);
      }
      const succeeded = logs.includes("Raid succeeded");
      if (!succeeded && !logs.includes("Raid failed")) {
        throw new Error(`Could not determine raid outcome from logs:\n${logs}`);
      }

      const afterAttacker = await program.account.cookieJar.fetch(jar);
      const afterVictim = await program.account.cookieJar.fetch(victimJar);

      // The reveal settles both jars first, so compare against what each
      // balance would be after accrual alone.
      const settled = (
        before: { crumbBalance: anchor.BN; lastClaimedTs: anchor.BN; productionRate: anchor.BN },
        after: { lastClaimedTs: anchor.BN }
      ) =>
        before.crumbBalance
          .add(
            after.lastClaimedTs
              .sub(before.lastClaimedTs)
              .mul(before.productionRate)
          )
          .toNumber();

      const victimSettled = settled(beforeVictim, afterVictim);
      const attackerSettled = settled(beforeAttacker, afterAttacker);
      const stolen = succeeded
        ? Math.floor((victimSettled * RAID_STEAL_PERCENT) / 100)
        : 0;

      const expectedVictim = victimSettled - stolen;
      // A win refunds the stake on top of the loot; a loss forfeits it.
      const expectedAttacker = succeeded
        ? attackerSettled + RAID_STAKE + stolen
        : attackerSettled;

      if (afterVictim.crumbBalance.toNumber() !== expectedVictim) {
        throw new Error(
          `Raid ${succeeded ? "succeeded" : "failed"}: expected victim to hold ${expectedVictim}, got ${afterVictim.crumbBalance.toNumber()}`
        );
      }
      if (afterAttacker.crumbBalance.toNumber() !== expectedAttacker) {
        throw new Error(
          `Raid ${succeeded ? "succeeded" : "failed"}: expected attacker to hold ${expectedAttacker}, got ${afterAttacker.crumbBalance.toNumber()}`
        );
      }
      if (await provider.connection.getAccountInfo(raid)) {
        throw new Error("Raid account should be closed after reveal");
      }

      console.log(
        `Raid ${succeeded ? "succeeded" : "failed"}, ${stolen} crumbs stolen`
      );
    });

    it("Lists every jar so the leaderboard can rank them", async () => {
      const all = await program.account.cookieJar.all();

      const owners = all.map((entry) => entry.account.owner.toString());
      for (const expected of [owner, victim.publicKey]) {
        if (!owners.includes(expected.toString())) {
          throw new Error(`Expected ${expected} among ${owners.join(", ")}`);
        }
      }

      // The leaderboard ranks on settled wealth, not the stored balance, so a
      // player who merely claimed recently does not outrank a richer one.
      const now = Math.floor(Date.now() / 1000);
      const ranked = all
        .map((entry) => ({
          owner: entry.account.owner.toString(),
          crumbs:
            entry.account.crumbBalance.toNumber() +
            Math.max(0, now - entry.account.lastClaimedTs.toNumber()) *
              entry.account.productionRate.toNumber(),
        }))
        .sort((a, b) => b.crumbs - a.crumbs);

      for (let i = 1; i < ranked.length; i++) {
        if (ranked[i - 1].crumbs < ranked[i].crumbs) {
          throw new Error("Leaderboard is not sorted by settled crumbs");
        }
      }
      console.log(
        `Leaderboard: ${ranked.map((r) => `${r.owner.slice(0, 4)}…=${r.crumbs}`).join(", ")}`
      );
    });

    it("Enforces the raid cooldown", async () => {
      try {
        await program.methods
          .commitRaid(Array.from(commitmentFor(randomBytes(32), owner)))
          .accountsPartial({
            attacker: owner,
            attackerJar: jar,
            targetJar: victimJar,
            raid,
          })
          .rpc();
        throw new Error("Expected a second raid to hit the cooldown");
      } catch (err) {
        if (!String(err).includes("RaidOnCooldown")) throw err;
      }
    });
  });
});
