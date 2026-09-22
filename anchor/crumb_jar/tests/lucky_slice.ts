import * as anchor from "@anchor-lang/core";
import { Program } from "@anchor-lang/core";
import * as fs from "fs";
import {
  createMint,
  getAccount,
  getAssociatedTokenAddressSync,
  getMint,
  TokenAccountNotFoundError,
} from "@solana/spl-token";
import { LuckySliceProgram } from "../target/types/lucky_slice_program";
import { CrumbJar } from "../target/types/crumb_jar";

const BPS_DENOMINATOR = 10_000;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Must match the programs' own constants. */
const WAGER_STAKE_CRUMBS = 150;
const WAGER_ACCURACY_BPS = 8_500;
const CRUMB_RATE_PER_SECOND = 20;

const TOKEN_PROGRAM = new anchor.web3.PublicKey(
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
);

/** A free round needs none of the $CRUMB accounts, so they go in as null. */
const noWagerAccounts = {
  jar: null,
  crumbMint: null,
  jarCrumbs: null,
  wagerEscrow: null,
  crumbJarProgram: null,
  tokenProgram: null,
  associatedTokenProgram: null,
};

const noSettleAccounts = {
  crumbMint: null,
  jarCrumbs: null,
  wagerEscrow: null,
  tokenProgram: null,
};

describe("lucky_slice", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace
    .luckySliceProgram as Program<LuckySliceProgram>;
  const provider = anchor.getProvider() as anchor.AnchorProvider;
  const player = provider.wallet.publicKey;

  const [round] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("round"), player.toBuffer()],
    program.programId
  );
  const [stats] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("slice"), player.toBuffer()],
    program.programId
  );

  const readTargetFromLogs = async (tx: string): Promise<number> => {
    for (let attempt = 0; attempt < 20; attempt++) {
      const detail = await provider.connection.getTransaction(tx, {
        commitment: "confirmed",
        maxSupportedTransactionVersion: 0,
      });
      const match = detail?.meta?.logMessages
        ?.join("\n")
        .match(/target (\d+)bps/);
      if (match) return Number(match[1]);
      if (detail?.meta) break;
      await sleep(300);
    }
    throw new Error(`Could not find a target in the logs for ${tx}`);
  };

  const readAccuracyFromLogs = async (tx: string): Promise<number> => {
    for (let attempt = 0; attempt < 20; attempt++) {
      const detail = await provider.connection.getTransaction(tx, {
        commitment: "confirmed",
        maxSupportedTransactionVersion: 0,
      });
      const match = detail?.meta?.logMessages
        ?.join("\n")
        .match(/(\d+)bps accuracy/);
      if (match) return Number(match[1]);
      if (detail?.meta) break;
      await sleep(300);
    }
    throw new Error(`Could not find accuracy in the logs for ${tx}`);
  };

  it("Rejects submitting a cut with no round open", async () => {
    try {
      await program.methods
        .submitCut(5000)
        .accountsPartial({ player, ...noSettleAccounts })
        .rpc();
      throw new Error("Expected submit_cut to be rejected with no round open");
    } catch (err) {
      if (!String(err).includes("AccountNotInitialized")) throw err;
    }
  });

  it("Starts a round with a target in range, then rejects starting a second one", async () => {
    const tx = await program.methods
      .startRound(false)
      .accountsPartial({ player, ...noWagerAccounts })
      .rpc();

    const target = await readTargetFromLogs(tx);
    if (target < 0 || target > BPS_DENOMINATOR) {
      throw new Error(`target ${target} out of range`);
    }

    const account = await program.account.round.fetch(round);
    if (account.targetBps !== target) {
      throw new Error(
        `Expected on-chain target_bps ${target}, got ${account.targetBps}`
      );
    }
    if (account.player.toString() !== player.toString()) {
      throw new Error("player not recorded correctly on the round");
    }

    try {
      await program.methods.startRound(false).accountsPartial({ player, ...noWagerAccounts }).rpc();
      throw new Error("Expected a second start_round to be rejected");
    } catch (err) {
      if (!String(err).includes("already in use")) throw err;
    }

    console.log(`Round started, target ${(target / 100).toFixed(2)}%`);
  });

  it("Rejects a cut submitted with an out-of-range value", async () => {
    try {
      await program.methods
        .submitCut(BPS_DENOMINATOR + 1)
        .accountsPartial({ player, ...noSettleAccounts })
        .rpc();
      throw new Error("Expected an out-of-range cut to be rejected");
    } catch (err) {
      if (!String(err).includes("CutOutOfRange")) throw err;
    }
  });

  it("Submits a cut, computes accuracy correctly, and closes the round", async () => {
    const before = await program.account.sliceStats.fetchNullable(stats);
    const roundBefore = await program.account.round.fetch(round);

    while (
      (await provider.connection.getSlot()) <= roundBefore.startSlot.toNumber()
    ) {
      await sleep(200);
    }

    const actualBps = 4321;
    const tx = await program.methods
      .submitCut(actualBps)
      .accountsPartial({ player, ...noSettleAccounts })
      .rpc();

    const expectedAccuracy =
      BPS_DENOMINATOR - Math.abs(roundBefore.targetBps - actualBps);
    const accuracy = await readAccuracyFromLogs(tx);
    if (accuracy !== expectedAccuracy) {
      throw new Error(
        `Expected accuracy ${expectedAccuracy}, got ${accuracy}`
      );
    }

    const after = await program.account.sliceStats.fetch(stats);
    const expectedAttempts = (before?.attempts.toNumber() ?? 0) + 1;
    if (after.attempts.toNumber() !== expectedAttempts) {
      throw new Error(
        `Expected attempts ${expectedAttempts}, got ${after.attempts.toNumber()}`
      );
    }
    if (after.bestAccuracyBps !== Math.max(before?.bestAccuracyBps ?? 0, accuracy)) {
      throw new Error(
        `best_accuracy_bps not updated correctly: got ${after.bestAccuracyBps}`
      );
    }

    const closedRound = await program.account.round.fetchNullable(round);
    if (closedRound !== null) {
      throw new Error("Expected the round account to be closed after submit");
    }

    console.log(
      `Submitted ${actualBps}bps against target ${roundBefore.targetBps}bps: ${accuracy}bps accuracy`
    );
  });

  // MIN_ROUND_SLOTS' same-slot rejection isn't covered by a dedicated test:
  // triggering it would mean bundling start_round and submit_cut into one
  // atomic transaction, which the real client flow never does (two separate
  // sendTransaction calls always land in different slots).

  it("Plays a full second round end to end", async () => {
    const before = await program.account.sliceStats.fetch(stats);

    const startTx = await program.methods
      .startRound(false)
      .accountsPartial({ player, ...noWagerAccounts })
      .rpc();
    const target = await readTargetFromLogs(startTx);

    // A real player always takes at least a moment to aim; on a fast local
    // validator with nothing else happening, back-to-back sends can land in
    // the same slot MIN_ROUND_SLOTS guards against. Compare against the
    // round's actual on-chain start_slot, not a pre-send estimate — the
    // transaction can land later than expected.
    const startedAt = (await program.account.round.fetch(round)).startSlot.toNumber();
    while ((await provider.connection.getSlot()) <= startedAt) {
      await sleep(200);
    }

    const actualBps = Math.min(BPS_DENOMINATOR, target + 500);
    const submitTx = await program.methods
      .submitCut(actualBps)
      .accountsPartial({ player, ...noSettleAccounts })
      .rpc();
    const accuracy = await readAccuracyFromLogs(submitTx);

    const expectedAccuracy = BPS_DENOMINATOR - Math.abs(target - actualBps);
    if (accuracy !== expectedAccuracy) {
      throw new Error(
        `Expected accuracy ${expectedAccuracy}, got ${accuracy}`
      );
    }

    const after = await program.account.sliceStats.fetch(stats);
    if (after.attempts.toNumber() !== before.attempts.toNumber() + 1) {
      throw new Error("attempts did not increment on the second round");
    }

    console.log(`Second round: target ${target}bps, cut ${actualBps}bps, accuracy ${accuracy}bps`);
  });

  describe("staking a round with $CRUMB", () => {
    const crumbJar = anchor.workspace.crumbJar as Program<CrumbJar>;
    const connection = provider.connection;

    const mintKeypair = anchor.web3.Keypair.fromSecretKey(
      Uint8Array.from(
        JSON.parse(
          fs.readFileSync("target/deploy/crumb-mint-keypair.json", "utf-8")
        )
      )
    );
    const crumbMint = mintKeypair.publicKey;
    const mintAuthority = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("crumb_mint_authority")],
      crumbJar.programId
    )[0];

    const balanceOf = async (ata: anchor.web3.PublicKey): Promise<bigint> => {
      try {
        return (await getAccount(connection, ata)).amount;
      } catch (err) {
        if (err instanceof TokenAccountNotFoundError) return 0n;
        throw err;
      }
    };

    // Test files share one validator and any suite may be the one that
    // creates the mint, so this has to work either way.
    before(async () => {
      if (await connection.getAccountInfo(crumbMint)) return;

      await createMint(
        connection,
        (provider.wallet as anchor.Wallet).payer,
        mintAuthority,
        null,
        0,
        mintKeypair
      );
    });

    /** A fresh player with a migrated jar holding at least `minCrumbs`. */
    const stakedPlayer = async (minCrumbs: number) => {
      const owner = anchor.web3.Keypair.generate();
      const jar = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("cookie_jar"), owner.publicKey.toBuffer()],
        crumbJar.programId
      )[0];

      const airdrop = await connection.requestAirdrop(
        owner.publicKey,
        anchor.web3.LAMPORTS_PER_SOL
      );
      const blockhash = await connection.getLatestBlockhash();
      await connection.confirmTransaction(
        { signature: airdrop, ...blockhash },
        "confirmed"
      );

      await crumbJar.methods
        .initializeJar()
        .accountsPartial({ owner: owner.publicKey, jar })
        .signers([owner])
        .rpc();

      await sleep(Math.ceil(minCrumbs / CRUMB_RATE_PER_SECOND) * 1000 + 1000);
      await crumbJar.methods
        .claimCrumbs()
        .accountsPartial({
          owner: owner.publicKey,
          jar,
          crumbMint,
          mintAuthority,
        })
        .signers([owner])
        .rpc();

      const [playerRound] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("round"), owner.publicKey.toBuffer()],
        program.programId
      );

      return {
        owner,
        jar,
        round: playerRound,
        jarCrumbs: getAssociatedTokenAddressSync(crumbMint, jar, true),
        wagerEscrow: getAssociatedTokenAddressSync(crumbMint, playerRound, true),
      };
    };

    /**
     * Plays one staked round, deliberately landing either side of the
     * accuracy bar rather than hoping the roll cooperates. "miss" aims at
     * whichever end of the track is further from the target, which is the
     * only way to guarantee a big gap: a fixed offset clamps at the edges
     * and can accidentally score a near-perfect cut on an extreme target.
     */
    const playStakedRound = async (outcome: "hit" | "miss") => {
      const p = await stakedPlayer(WAGER_STAKE_CRUMBS + 100);
      const accounts = {
        player: p.owner.publicKey,
        jar: p.jar,
        crumbMint,
        jarCrumbs: p.jarCrumbs,
        wagerEscrow: p.wagerEscrow,
        crumbJarProgram: crumbJar.programId,
        tokenProgram: TOKEN_PROGRAM,
      };

      const before = await balanceOf(p.jarCrumbs);
      const supplyBefore = (await getMint(connection, crumbMint)).supply;

      await program.methods
        .startRound(true)
        .accountsPartial({
          ...accounts,
          associatedTokenProgram: new anchor.web3.PublicKey(
            "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
          ),
        })
        .signers([p.owner])
        .rpc();

      const escrowed = await balanceOf(p.wagerEscrow);
      if (escrowed !== BigInt(WAGER_STAKE_CRUMBS)) {
        throw new Error(
          `Expected ${WAGER_STAKE_CRUMBS} crumbs escrowed, got ${escrowed}`
        );
      }
      if ((await balanceOf(p.jarCrumbs)) !== before - BigInt(WAGER_STAKE_CRUMBS)) {
        throw new Error("The stake should have left the jar at round start");
      }

      const round = await program.account.round.fetch(p.round);
      if (!round.wagered) throw new Error("Round should be marked wagered");

      while (
        (await connection.getSlot()) <= round.startSlot.toNumber()
      ) {
        await sleep(200);
      }

      const actualBps =
        outcome === "hit"
          ? round.targetBps
          : round.targetBps < BPS_DENOMINATOR / 2
            ? BPS_DENOMINATOR
            : 0;
      await program.methods
        .submitCut(actualBps)
        .accountsPartial({
          player: p.owner.publicKey,
          crumbMint,
          jarCrumbs: p.jarCrumbs,
          wagerEscrow: p.wagerEscrow,
          tokenProgram: TOKEN_PROGRAM,
        })
        .signers([p.owner])
        .rpc();

      const accuracy = BPS_DENOMINATOR - Math.abs(round.targetBps - actualBps);
      const after = await balanceOf(p.jarCrumbs);
      const supplyAfter = (await getMint(connection, crumbMint)).supply;

      if (await connection.getAccountInfo(p.wagerEscrow)) {
        throw new Error("The escrow should be closed once the round settles");
      }

      return { before, after, accuracy, supplyBefore, supplyAfter };
    };

    it("Returns the stake when the cut clears the accuracy bar", async () => {
      // Dead on the target, so accuracy is a perfect 10_000.
      const { before, after, accuracy, supplyBefore, supplyAfter } =
        await playStakedRound("hit");

      if (accuracy < WAGER_ACCURACY_BPS) {
        throw new Error(`Test setup: expected a winning cut, got ${accuracy}bps`);
      }
      if (after !== before) {
        throw new Error(
          `A winning staked round should leave the balance unchanged: ${before} -> ${after}`
        );
      }
      if (supplyAfter !== supplyBefore) {
        throw new Error(
          `A returned stake should not change supply: ${supplyBefore} -> ${supplyAfter}`
        );
      }
      console.log(`Won a staked round at ${accuracy}bps, stake returned`);
    });

    it("Burns the stake when the cut misses the accuracy bar", async () => {
      // Aimed at the far end of the track, so accuracy lands well under the bar.
      const { before, after, accuracy, supplyBefore, supplyAfter } =
        await playStakedRound("miss");

      if (accuracy >= WAGER_ACCURACY_BPS) {
        throw new Error(`Test setup: expected a losing cut, got ${accuracy}bps`);
      }
      if (after !== before - BigInt(WAGER_STAKE_CRUMBS)) {
        throw new Error(
          `A lost stake should be gone for good: ${before} -> ${after}`
        );
      }
      // Burning is the only thing that moves supply, so this is what proves
      // the stake was destroyed rather than quietly parked somewhere.
      if (supplyAfter !== supplyBefore - BigInt(WAGER_STAKE_CRUMBS)) {
        throw new Error(
          `Expected supply to drop by ${WAGER_STAKE_CRUMBS}: ${supplyBefore} -> ${supplyAfter}`
        );
      }
      console.log(`Lost a staked round at ${accuracy}bps, stake burned`);
    });

    it("Rejects staking a round without the $CRUMB accounts", async () => {
      const owner = anchor.web3.Keypair.generate();
      const airdrop = await connection.requestAirdrop(
        owner.publicKey,
        anchor.web3.LAMPORTS_PER_SOL
      );
      const blockhash = await connection.getLatestBlockhash();
      await connection.confirmTransaction(
        { signature: airdrop, ...blockhash },
        "confirmed"
      );

      try {
        await program.methods
          .startRound(true)
          .accountsPartial({ player: owner.publicKey, ...noWagerAccounts })
          .signers([owner])
          .rpc();
        throw new Error("Expected a stake with no jar accounts to be rejected");
      } catch (err) {
        if (!String(err).includes("WagerAccountsMissing")) throw err;
      }
    });
  });
});
