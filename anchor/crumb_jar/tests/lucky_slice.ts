import * as anchor from "@anchor-lang/core";
import { Program } from "@anchor-lang/core";
import { LuckySliceProgram } from "../target/types/lucky_slice_program";

const BPS_DENOMINATOR = 10_000;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
        .accountsPartial({ player })
        .rpc();
      throw new Error("Expected submit_cut to be rejected with no round open");
    } catch (err) {
      if (!String(err).includes("AccountNotInitialized")) throw err;
    }
  });

  it("Starts a round with a target in range, then rejects starting a second one", async () => {
    const tx = await program.methods
      .startRound()
      .accountsPartial({ player })
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
      await program.methods.startRound().accountsPartial({ player }).rpc();
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
        .accountsPartial({ player })
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
      .accountsPartial({ player })
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
      .startRound()
      .accountsPartial({ player })
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
      .accountsPartial({ player })
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
});
