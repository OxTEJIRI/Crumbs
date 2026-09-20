import * as anchor from "@anchor-lang/core";
import { Program } from "@anchor-lang/core";
import { CookieCrush } from "../target/types/cookie_crush";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const sessionPda = (
  programId: anchor.web3.PublicKey,
  player: anchor.web3.PublicKey,
  levelId: number
) =>
  anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("session"), player.toBuffer(), Buffer.from([levelId])],
    programId
  )[0];

const scorePda = (
  programId: anchor.web3.PublicKey,
  player: anchor.web3.PublicKey,
  levelId: number
) =>
  anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("score"), player.toBuffer(), Buffer.from([levelId])],
    programId
  )[0];

describe("cookie_crush", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.cookieCrush as Program<CookieCrush>;
  const provider = anchor.getProvider() as anchor.AnchorProvider;
  const player = provider.wallet.publicKey;

  const LEVEL = 1;
  const session = sessionPda(program.programId, player, LEVEL);
  const levelScore = scorePda(program.programId, player, LEVEL);

  it("Rejects a score submitted before the minimum session length", async () => {
    await program.methods
      .startLevel(LEVEL)
      .accountsPartial({ player, session })
      .rpc();

    try {
      await program.methods
        .submitScore(LEVEL, 10)
        .accountsPartial({ player, session, levelScore })
        .rpc();
      throw new Error("Expected an immediate submission to be rejected");
    } catch (err) {
      if (!String(err).includes("SubmittedTooSoon")) throw err;
    }

    // Clean up so the next test starts from a closed session.
    await sleep(3500);
    await program.methods
      .submitScore(LEVEL, 10)
      .accountsPartial({ player, session, levelScore })
      .rpc();
  });

  it("Rejects a score too high for how long the session ran", async () => {
    await program.methods
      .startLevel(LEVEL)
      .accountsPartial({ player, session })
      .rpc();

    await sleep(3500);

    try {
      // At ~3.5s elapsed, the ceiling is roughly 3*80 + 200 = 440.
      await program.methods
        .submitScore(LEVEL, 100_000)
        .accountsPartial({ player, session, levelScore })
        .rpc();
      throw new Error("Expected an implausible score to be rejected");
    } catch (err) {
      if (!String(err).includes("ScoreImplausible")) throw err;
    }

    // Clean up with a plausible score.
    await program.methods
      .submitScore(LEVEL, 50)
      .accountsPartial({ player, session, levelScore })
      .rpc();
  });

  it("Records a plausible score and tracks the running best", async () => {
    await program.methods
      .startLevel(LEVEL)
      .accountsPartial({ player, session })
      .rpc();
    await sleep(3500);
    await program.methods
      .submitScore(LEVEL, 120)
      .accountsPartial({ player, session, levelScore })
      .rpc();

    const afterFirst = await program.account.levelScore.fetch(levelScore);
    if (afterFirst.bestScore !== 120) {
      throw new Error(`Expected best score 120, got ${afterFirst.bestScore}`);
    }

    // A lower score in a second attempt should not overwrite the best.
    await program.methods
      .startLevel(LEVEL)
      .accountsPartial({ player, session })
      .rpc();
    await sleep(3500);
    await program.methods
      .submitScore(LEVEL, 80)
      .accountsPartial({ player, session, levelScore })
      .rpc();

    const afterSecond = await program.account.levelScore.fetch(levelScore);
    if (afterSecond.bestScore !== 120) {
      throw new Error(
        `A lower score should not replace the best; got ${afterSecond.bestScore}`
      );
    }
    if (afterSecond.attempts !== 4) {
      throw new Error(`Expected 4 total attempts, got ${afterSecond.attempts}`);
    }

    if (await provider.connection.getAccountInfo(session)) {
      throw new Error("Session account should be closed after submit_score");
    }
  });
});
