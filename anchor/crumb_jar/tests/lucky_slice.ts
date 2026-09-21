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

  const [stats] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("slice"), player.toBuffer()],
    program.programId
  );

  it("Creates stats on the first slice, with a cut in range", async () => {
    await program.methods.slice().accountsPartial({ player }).rpc();

    const account = await program.account.sliceStats.fetch(stats);
    if (account.player.toString() !== player.toString()) {
      throw new Error("player not recorded correctly");
    }
    if (account.attempts.toNumber() !== 1) {
      throw new Error(`Expected attempts 1, got ${account.attempts.toNumber()}`);
    }
    if (account.bestCutBps < 0 || account.bestCutBps > BPS_DENOMINATOR) {
      throw new Error(`best_cut_bps ${account.bestCutBps} out of range`);
    }

    console.log(`First slice: ${(account.bestCutBps / 100).toFixed(2)}%`);
  });

  it("Tracks the best cut across repeated slices and always increments attempts", async () => {
    const before = await program.account.sliceStats.fetch(stats);

    const rolls: number[] = [];
    for (let i = 0; i < 8; i++) {
      await program.methods.slice().accountsPartial({ player }).rpc();
      const account = await program.account.sliceStats.fetch(stats);
      rolls.push(account.bestCutBps);
    }

    const after = await program.account.sliceStats.fetch(stats);
    if (after.attempts.toNumber() !== before.attempts.toNumber() + 8) {
      throw new Error(
        `Expected attempts to grow by 8, went from ${before.attempts.toNumber()} to ${after.attempts.toNumber()}`
      );
    }

    // best_cut_bps must be monotonically non-decreasing across the run.
    let max = before.bestCutBps;
    for (const roll of rolls) {
      if (roll < max) {
        throw new Error(`best_cut_bps decreased: was ${max}, saw ${roll}`);
      }
      max = roll;
    }
    if (after.bestCutBps !== max) {
      throw new Error(
        `Expected final best_cut_bps ${max}, got ${after.bestCutBps}`
      );
    }

    console.log(
      `After 9 total slices: best ${(after.bestCutBps / 100).toFixed(2)}%, attempts ${after.attempts.toNumber()}`
    );
  });

  it("Produces a varied spread of outcomes rather than a constant value", async () => {
    // The account only exposes a running max, so read the actual per-call
    // roll from the program's own log line instead — a real check on the
    // randomness source, not just that attempts incremented.
    const rolls: number[] = [];
    for (let i = 0; i < 15; i++) {
      const tx = await program.methods.slice().accountsPartial({ player }).rpc();

      let match: RegExpMatchArray | null = null;
      for (let attempt = 0; attempt < 20 && !match; attempt++) {
        const detail = await provider.connection.getTransaction(tx, {
          commitment: "confirmed",
          maxSupportedTransactionVersion: 0,
        });
        if (detail?.meta) {
          match = detail.meta.logMessages?.join("\n").match(/Sliced for (\d+)bps/) ?? null;
          if (!match) break; // transaction found but log format changed
        } else {
          await sleep(300); // not indexed yet
        }
      }
      if (!match) throw new Error(`Could not find a roll in the logs for ${tx}`);
      rolls.push(Number(match[1]));
    }

    const distinct = new Set(rolls).size;
    if (distinct < 5) {
      throw new Error(
        `Expected meaningfully varied rolls across 15 slices, saw only ${distinct} distinct values: ${rolls.join(", ")}`
      );
    }
    for (const roll of rolls) {
      if (roll < 0 || roll > BPS_DENOMINATOR) {
        throw new Error(`Roll ${roll} out of the 0..=10000 range`);
      }
    }

    console.log(`Rolls: ${rolls.join(", ")}`);
  });
});
