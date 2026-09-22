import * as anchor from "@anchor-lang/core";
import { Program } from "@anchor-lang/core";
import { createHash, randomBytes } from "crypto";
import * as fs from "fs";
import {
  createMint,
  getAccount,
  getAssociatedTokenAddressSync,
  getMint,
  TokenAccountNotFoundError,
} from "@solana/spl-token";
import { CrumbJar } from "../target/types/crumb_jar";

const RAID_STAKE = 100;
const RAID_STEAL_PERCENT = 20;
// Just enough headroom over the stake that timing jitter can't leave an
// attacker short. Kept tight because every extra crumb here is another
// second of waiting for accrual, multiplied by every attacker the raid
// rounds create.
const MIN_STAKE_BUFFER = 60;

const jarPda = (programId: anchor.web3.PublicKey, key: anchor.web3.PublicKey) =>
  anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("cookie_jar"), key.toBuffer()],
    programId
  )[0];

const mintAuthorityPda = (programId: anchor.web3.PublicKey) =>
  anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("crumb_mint_authority")],
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
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.crumbJar as Program<CrumbJar>;
  const provider = anchor.getProvider() as anchor.AnchorProvider;
  const connection = provider.connection;

  const owner = provider.wallet.publicKey;
  const jar = jarPda(program.programId, owner);
  const mintAuthority = mintAuthorityPda(program.programId);

  // The mint address is baked into the deployed program as CRUMB_MINT, so
  // it has to be created at exactly this keypair's address, not a fresh one
  // the test generates for itself.
  const mintKeypair = anchor.web3.Keypair.fromSecretKey(
    Uint8Array.from(
      JSON.parse(
        fs.readFileSync(
          "target/deploy/crumb-mint-keypair.json",
          "utf-8"
        )
      )
    )
  );
  const crumbMint = mintKeypair.publicKey;

  const ataOf = (owningJar: anchor.web3.PublicKey) =>
    getAssociatedTokenAddressSync(crumbMint, owningJar, true);

  const balanceOf = async (ata: anchor.web3.PublicKey): Promise<bigint> => {
    try {
      return (await getAccount(connection, ata)).amount;
    } catch (err) {
      if (err instanceof TokenAccountNotFoundError) return 0n;
      throw err;
    }
  };

  before(async () => {
    // Test files share one validator and cookie_crush's suite may have
    // already created the mint, so this has to work either way.
    if (await connection.getAccountInfo(crumbMint)) return;

    // The mint authority is a PDA the program itself controls (only this
    // program can ever mint), not the test wallet -- so mint creation hands
    // mint authority straight to the PDA, matching exactly what the real
    // mainnet mint creation will do.
    await createMint(
      connection,
      (provider.wallet as anchor.Wallet).payer,
      mintAuthority,
      null,
      0, // decimals: crumbs have always been whole numbers
      mintKeypair
    );
  });

  it("Mints a cookie jar for the connected wallet, already migrated", async () => {
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
      throw new Error("New jar should start with a zero legacy balance");
    }
    if (!jarAccount.migrated) {
      throw new Error(
        "A freshly-minted jar has nothing to migrate and should start already migrated"
      );
    }
  });

  it("Rejects migrating a jar that's already migrated", async () => {
    try {
      await program.methods
        .migrateToToken()
        .accountsPartial({ owner, jar, crumbMint, mintAuthority })
        .rpc();
      throw new Error("Expected migrating an already-migrated jar to be rejected");
    } catch (err) {
      if (!String(err).includes("AlreadyMigrated")) throw err;
    }
  });

  it("Accrues crumbs over elapsed time and mints them as the real token on claim", async () => {
    const before = await program.account.cookieJar.fetch(jar);
    const balanceBefore = await balanceOf(ataOf(jar));

    // Let wall-clock time pass so the on-chain clock reports a non-zero interval.
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const tx = await program.methods
      .claimCrumbs()
      .accountsPartial({ owner, jar, crumbMint, mintAuthority })
      .rpc();
    console.log("Claim crumbs transaction signature", tx);

    const after = await program.account.cookieJar.fetch(jar);
    const balanceAfter = await balanceOf(ataOf(jar));

    const elapsed = after.lastClaimedTs.sub(before.lastClaimedTs).toNumber();
    const rate = after.productionRate.toNumber();
    const gained = Number(balanceAfter - balanceBefore);

    if (elapsed <= 0) {
      throw new Error(`Expected time to advance, got ${elapsed}s`);
    }
    if (gained !== elapsed * rate) {
      throw new Error(
        `Expected ${elapsed * rate} crumbs for ${elapsed}s at rate ${rate}, got ${gained} real tokens minted`
      );
    }
    if (after.crumbBalance.toNumber() !== 0) {
      throw new Error(
        "The legacy balance field should stay at 0 for an already-migrated jar; new accrual mints directly instead"
      );
    }
    console.log(`Accrued and minted ${gained} real $CRUMB over ${elapsed}s`);
  });

  it("Resets the accrual window so an immediate re-claim mints nothing", async () => {
    const balanceBefore = await balanceOf(ataOf(jar));

    await program.methods
      .claimCrumbs()
      .accountsPartial({ owner, jar, crumbMint, mintAuthority })
      .rpc();

    const balanceAfter = await balanceOf(ataOf(jar));
    const gained = Number(balanceAfter - balanceBefore);

    // Not necessarily exactly 0 -- a second or so of wall-clock time may
    // have passed at 20 crumbs/s -- but should be small, not a re-mint of
    // everything already claimed.
    if (gained > 100) {
      throw new Error(
        `Back-to-back claim should only mint what accrued since the last one, got ${gained}`
      );
    }
  });

  describe("raiding", () => {
    const victim = anchor.web3.Keypair.generate();
    const victimJar = jarPda(program.programId, victim.publicKey);

    const fundAttacker = async (): Promise<anchor.web3.Keypair> => {
      const attacker = anchor.web3.Keypair.generate();
      const attackerJar = jarPda(program.programId, attacker.publicKey);

      const airdrop = await connection.requestAirdrop(
        attacker.publicKey,
        anchor.web3.LAMPORTS_PER_SOL
      );
      const blockhash = await connection.getLatestBlockhash();
      await connection.confirmTransaction(
        { signature: airdrop, ...blockhash },
        "confirmed"
      );

      await program.methods
        .initializeJar()
        .accountsPartial({ owner: attacker.publicKey, jar: attackerJar })
        .signers([attacker])
        .rpc();

      // Enough accrual to cover the stake with room to spare.
      await sleep(Math.ceil((RAID_STAKE + MIN_STAKE_BUFFER) / 20) * 1000);
      await program.methods
        .claimCrumbs()
        .accountsPartial({
          owner: attacker.publicKey,
          jar: attackerJar,
          crumbMint,
          mintAuthority,
        })
        .signers([attacker])
        .rpc();

      return attacker;
    };

    before(async () => {
      const airdrop = await connection.requestAirdrop(
        victim.publicKey,
        anchor.web3.LAMPORTS_PER_SOL
      );
      const blockhash = await connection.getLatestBlockhash();
      await connection.confirmTransaction(
        { signature: airdrop, ...blockhash },
        "confirmed"
      );

      await program.methods
        .initializeJar()
        .accountsPartial({ owner: victim.publicKey, jar: victimJar })
        .signers([victim])
        .rpc();

      await sleep(11000);
      await program.methods
        .claimCrumbs()
        .accountsPartial({
          owner: victim.publicKey,
          jar: victimJar,
          crumbMint,
          mintAuthority,
        })
        .signers([victim])
        .rpc();
    });

    it("Rejects a raid against your own jar", async () => {
      const secret = randomBytes(32);
      const [raid] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("raid"), owner.toBuffer()],
        program.programId
      );
      try {
        await program.methods
          .commitRaid(Array.from(commitmentFor(secret, owner)))
          .accountsPartial({
            attacker: owner,
            attackerJar: jar,
            targetJar: jar,
            raid,
            crumbMint,
            attackerCrumbs: ataOf(jar),
            raidEscrow: getAssociatedTokenAddressSync(crumbMint, raid, true),
          })
          .rpc();
        throw new Error("Expected self-raid to be rejected");
      } catch (err) {
        if (!String(err).includes("SelfRaid")) throw err;
      }
    });

    /**
     * Runs one full raid (fresh attacker, so nobody waits out a cooldown)
     * and verifies the token movements match whichever outcome actually
     * landed -- the roll is genuine on-chain randomness, not something a
     * test can force either way, so this checks "the correct math for
     * whatever happened" rather than asserting a specific outcome.
     */
    const runOneRaid = async (): Promise<{
      attacker: anchor.web3.Keypair;
      outcome: "succeeded" | "failed";
    }> => {
      const attacker = await fundAttacker();
      const attackerJar = jarPda(program.programId, attacker.publicKey);
      const [raid] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("raid"), attacker.publicKey.toBuffer()],
        program.programId
      );
      const raidEscrow = getAssociatedTokenAddressSync(crumbMint, raid, true);
      const attackerCrumbs = ataOf(attackerJar);
      const targetCrumbs = ataOf(victimJar);

      const secret = randomBytes(32);
      await program.methods
        .commitRaid(Array.from(commitmentFor(secret, attacker.publicKey)))
        .accountsPartial({
          attacker: attacker.publicKey,
          attackerJar,
          targetJar: victimJar,
          raid,
          crumbMint,
          attackerCrumbs,
          raidEscrow,
        })
        .signers([attacker])
        .rpc();

      const escrowed = await balanceOf(raidEscrow);
      if (escrowed !== BigInt(RAID_STAKE)) {
        throw new Error(
          `Expected exactly ${RAID_STAKE} crumbs escrowed at commit, got ${escrowed}`
        );
      }

      const { commitSlot } = await program.account.raid.fetch(raid);
      await waitForSlotPast(connection, commitSlot.toNumber());

      const attackerBefore = await balanceOf(attackerCrumbs);
      const targetBefore = await balanceOf(targetCrumbs);
      const supplyBefore = (await getMint(connection, crumbMint)).supply;

      const tx = await program.methods
        .revealRaid(Array.from(secret))
        .accountsPartial({
          attacker: attacker.publicKey,
          attackerJar,
          targetJar: victimJar,
          raid,
          crumbMint,
          mintAuthority,
          attackerCrumbs,
          targetCrumbs,
          raidEscrow,
          slotHashes: anchor.web3.SYSVAR_SLOT_HASHES_PUBKEY,
        })
        .signers([attacker])
        .rpc();

      let logs = "";
      for (let attempt = 0; attempt < 10 && !logs; attempt++) {
        const detail = await connection.getTransaction(tx, {
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

      const attackerAfter = await balanceOf(attackerCrumbs);
      const targetAfter = await balanceOf(targetCrumbs);
      const supplyAfter = (await getMint(connection, crumbMint)).supply;
      const escrowAfter = await connection.getAccountInfo(raidEscrow);

      if (escrowAfter !== null) {
        throw new Error(
          "Expected the escrow token account to be closed after reveal"
        );
      }
      if (await connection.getAccountInfo(raid)) {
        throw new Error("Expected the raid account to be closed after reveal");
      }

      if (succeeded) {
        // A win mints the target's pending accrual before taking its cut, so
        // the pre-reveal reading can't predict the amount -- the program logs
        // what it actually took, and both sides get checked against that.
        const looted = BigInt(/looted (\d+) crumbs/.exec(logs)?.[1] ?? "-1");
        if (looted < 0n) {
          throw new Error(`Could not read the looted amount from logs:\n${logs}`);
        }

        const expectedAttacker = attackerBefore + BigInt(RAID_STAKE) + looted;
        if (attackerAfter !== expectedAttacker) {
          throw new Error(
            `Raid succeeded: expected attacker to hold ${expectedAttacker} (${attackerBefore} + ${RAID_STAKE} stake + ${looted} looted), got ${attackerAfter}`
          );
        }

        // Whatever the target had at reveal time, the cut taken must be
        // exactly RAID_STEAL_PERCENT of it, and the rest must remain.
        const targetAtReveal = targetAfter + looted;
        const expectedLoot =
          (targetAtReveal * BigInt(RAID_STEAL_PERCENT)) / 100n;
        if (looted !== expectedLoot) {
          throw new Error(
            `Raid succeeded: target held ${targetAtReveal} at reveal, so the cut should be ${expectedLoot}, got ${looted}`
          );
        }
        if (targetAtReveal < targetBefore) {
          throw new Error(
            `Raid succeeded: target held ${targetBefore} before reveal but only ${targetAtReveal} at reveal -- accrual should only ever add`
          );
        }
        // A win only ever mints (the target's pending accrual) and moves
        // tokens around, so supply must not fall.
        if (supplyAfter < supplyBefore) {
          throw new Error(
            `Raid succeeded: supply should never drop, went ${supplyBefore} -> ${supplyAfter}`
          );
        }
        console.log(`Raid succeeded, ${looted} crumbs stolen`);
      } else {
        // A loss forfeits the stake entirely -- burned, so the target is
        // untouched and the attacker does not get it back.
        if (targetAfter !== targetBefore) {
          throw new Error(
            `Raid failed: target should be untouched, was ${targetBefore} now ${targetAfter}`
          );
        }
        if (attackerAfter !== attackerBefore) {
          throw new Error(
            `Raid failed: attacker's balance shouldn't move (the stake was already escrowed at commit and is now burned), was ${attackerBefore} now ${attackerAfter}`
          );
        }
        // The stake is destroyed rather than moved, so total supply is the
        // only place that proves it actually happened.
        const expectedSupply = supplyBefore - BigInt(RAID_STAKE);
        if (supplyAfter !== expectedSupply) {
          throw new Error(
            `Raid failed: the ${RAID_STAKE} staked crumbs should have been burned, so supply should be ${expectedSupply}, got ${supplyAfter}`
          );
        }
        console.log("Raid failed, staked crumbs burned");
      }

      return { attacker, outcome: succeeded ? "succeeded" : "failed" };
    };

    it("Settles a raid correctly whichever way the roll lands, across several independent attackers", async () => {
      const outcomes = new Set<string>();
      const ROUNDS = 8;
      for (let i = 0; i < ROUNDS; i++) {
        outcomes.add((await runOneRaid()).outcome);
      }
      // Not a hard requirement -- the roll is genuine randomness, and with
      // only a handful of rounds it's plausible (though unlikely) to only
      // see one outcome. Every round above already verified the correct
      // math for whatever it rolled; this is just a note for whether both
      // branches actually got exercised this run.
      console.log(`Observed raid outcomes across ${ROUNDS} rounds: ${[...outcomes].join(", ")}`);
    });

    it("Enforces the raid cooldown once a raid has resolved", async () => {
      // The raid PDA is seeded per-attacker, so a second commit while one is
      // still open fails on the account already existing, never reaching the
      // cooldown check. Resolving the first raid frees that address, which is
      // what makes this actually exercise the cooldown.
      const { attacker } = await runOneRaid();
      const attackerJar = jarPda(program.programId, attacker.publicKey);
      const [raid] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("raid"), attacker.publicKey.toBuffer()],
        program.programId
      );

      try {
        await program.methods
          .commitRaid(
            Array.from(commitmentFor(randomBytes(32), attacker.publicKey))
          )
          .accountsPartial({
            attacker: attacker.publicKey,
            attackerJar,
            targetJar: victimJar,
            raid,
            crumbMint,
            attackerCrumbs: ataOf(attackerJar),
            raidEscrow: getAssociatedTokenAddressSync(crumbMint, raid, true),
          })
          .signers([attacker])
          .rpc();
        throw new Error("Expected a second raid to hit the cooldown");
      } catch (err) {
        if (!String(err).includes("RaidOnCooldown")) throw err;
      }
    });

    it("Lists every jar so the leaderboard can rank them", async () => {
      const all = await program.account.cookieJar.all();

      const owners = all.map((entry) => entry.account.owner.toString());
      for (const expected of [owner, victim.publicKey]) {
        if (!owners.includes(expected.toString())) {
          throw new Error(`Expected ${expected} among ${owners.join(", ")}`);
        }
      }
      console.log(`${all.length} jars on-chain`);
    });
  });
});
