import * as anchor from "@anchor-lang/core";
import { Program } from "@anchor-lang/core";
import * as fs from "fs";
import {
  createMint,
  getAccount,
  getAssociatedTokenAddressSync,
  TokenAccountNotFoundError,
} from "@solana/spl-token";
import { CookieCrush } from "../target/types/cookie_crush";
import { CrumbJar } from "../target/types/crumb_jar";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Must match the programs' own constants. */
const MIN_ELAPSED_SECONDS = 3;
const BOOST_COST_CRUMBS = 250;
const CRUMB_RATE_PER_SECOND = 20;

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
  const crumbJar = anchor.workspace.crumbJar as Program<CrumbJar>;
  const provider = anchor.getProvider() as anchor.AnchorProvider;
  const connection = provider.connection;
  const player = provider.wallet.publicKey;

  const LEVEL = 1;
  const session = sessionPda(program.programId, player, LEVEL);
  const levelScore = scorePda(program.programId, player, LEVEL);

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

  const jarPda = (owner: anchor.web3.PublicKey) =>
    anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("cookie_jar"), owner.toBuffer()],
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

  /**
   * The program measures session length against the on-chain clock, which
   * advances with slots and can lag wall-clock time on a freshly started
   * validator. Sleeping a fixed number of milliseconds therefore races the
   * check; this waits until the chain itself agrees the session is old
   * enough.
   */
  const waitForSessionAge = async (seconds: number) => {
    const { startedAt } = await program.account.session.fetch(session);
    const readyAt = startedAt.toNumber() + seconds;

    for (;;) {
      const slot = await connection.getSlot("confirmed");
      const now = await connection.getBlockTime(slot);
      if (now !== null && now >= readyAt) return;
      await sleep(400);
    }
  };

  /** Free play needs none of the $CRUMB accounts, so they go in as null. */
  const noBoostAccounts = {
    jar: null,
    crumbMint: null,
    jarCrumbs: null,
    crumbJarProgram: null,
    tokenProgram: null,
  };

  // Test files share one validator and cookie_crush may run before
  // crumb_jar's suite creates the mint, so this has to work either way.
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

  it("Rejects a score submitted before the minimum session length", async () => {
    await program.methods
      .startLevel(LEVEL, false)
      .accountsPartial({ player, session, ...noBoostAccounts })
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
    await waitForSessionAge(MIN_ELAPSED_SECONDS);
    await program.methods
      .submitScore(LEVEL, 10)
      .accountsPartial({ player, session, levelScore })
      .rpc();
  });

  it("Rejects a score too high for how long the session ran", async () => {
    await program.methods
      .startLevel(LEVEL, false)
      .accountsPartial({ player, session, ...noBoostAccounts })
      .rpc();

    await waitForSessionAge(MIN_ELAPSED_SECONDS);

    try {
      // At 3s elapsed the ceiling is 3*80 + 200 = 440, and it only grows by
      // 80 a second, so this stays far out of reach however long the wait ran.
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
      .startLevel(LEVEL, false)
      .accountsPartial({ player, session, ...noBoostAccounts })
      .rpc();
    await waitForSessionAge(MIN_ELAPSED_SECONDS);
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
      .startLevel(LEVEL, false)
      .accountsPartial({ player, session, ...noBoostAccounts })
      .rpc();
    await waitForSessionAge(MIN_ELAPSED_SECONDS);
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

    if (await connection.getAccountInfo(session)) {
      throw new Error("Session account should be closed after submit_score");
    }
  });

  describe("paying $CRUMB for a longer round", () => {
    const BOOST_LEVEL = 2;

    /** A player with a migrated jar holding at least `minCrumbs`. */
    const fundedPlayer = async (minCrumbs: number) => {
      const owner = anchor.web3.Keypair.generate();
      const jar = jarPda(owner.publicKey);

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

      if (minCrumbs > 0) {
        await sleep(
          Math.ceil(minCrumbs / CRUMB_RATE_PER_SECOND) * 1000 + 1000
        );
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
      }

      return {
        owner,
        jar,
        jarCrumbs: getAssociatedTokenAddressSync(crumbMint, jar, true),
      };
    };

    const boostAccounts = (jar: anchor.web3.PublicKey, jarCrumbs: anchor.web3.PublicKey) => ({
      jar,
      crumbMint,
      jarCrumbs,
      crumbJarProgram: crumbJar.programId,
      tokenProgram: new anchor.web3.PublicKey(
        "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
      ),
    });

    it("Burns exactly the boost cost and records the session as boosted", async () => {
      const { owner, jar, jarCrumbs } = await fundedPlayer(BOOST_COST_CRUMBS);
      const boostSession = sessionPda(
        program.programId,
        owner.publicKey,
        BOOST_LEVEL
      );

      const before = await balanceOf(jarCrumbs);
      if (before < BigInt(BOOST_COST_CRUMBS)) {
        throw new Error(
          `Test setup: expected at least ${BOOST_COST_CRUMBS} crumbs, got ${before}`
        );
      }

      await program.methods
        .startLevel(BOOST_LEVEL, true)
        .accountsPartial({
          player: owner.publicKey,
          session: boostSession,
          ...boostAccounts(jar, jarCrumbs),
        })
        .signers([owner])
        .rpc();

      const after = await balanceOf(jarCrumbs);
      const spent = before - after;
      if (spent !== BigInt(BOOST_COST_CRUMBS)) {
        throw new Error(
          `Expected exactly ${BOOST_COST_CRUMBS} crumbs spent, got ${spent}`
        );
      }

      const account = await program.account.session.fetch(boostSession);
      if (!account.boosted) {
        throw new Error("Session should be marked boosted");
      }
      console.log(`Boost burned ${spent} crumbs, ${after} left in the jar`);
    });

    it("Rejects a boost the player can't afford, leaving no session behind", async () => {
      // Claimed something, but nowhere near the boost cost.
      const { owner, jar, jarCrumbs } = await fundedPlayer(40);
      const boostSession = sessionPda(
        program.programId,
        owner.publicKey,
        BOOST_LEVEL
      );

      const before = await balanceOf(jarCrumbs);
      if (before >= BigInt(BOOST_COST_CRUMBS)) {
        throw new Error(
          `Test setup: expected fewer than ${BOOST_COST_CRUMBS} crumbs, got ${before}`
        );
      }

      try {
        await program.methods
          .startLevel(BOOST_LEVEL, true)
          .accountsPartial({
            player: owner.publicKey,
            session: boostSession,
            ...boostAccounts(jar, jarCrumbs),
          })
          .signers([owner])
          .rpc();
        throw new Error("Expected an unaffordable boost to be rejected");
      } catch (err) {
        if (!String(err).includes("InsufficientCrumbs")) throw err;
      }

      if ((await balanceOf(jarCrumbs)) !== before) {
        throw new Error("A rejected boost should not have taken any crumbs");
      }

      // The whole instruction rolls back together, so no half-started
      // session should be sitting there blocking a retry.
      if (await connection.getAccountInfo(boostSession)) {
        throw new Error(
          "A rejected boost should not leave a session account behind"
        );
      }
    });

    it("Rejects a boost from a jar that has never claimed", async () => {
      // No claim means no token account exists yet, so this fails on the
      // account constraint rather than the balance check. Different error,
      // same guarantee: no boosted session without paying for it.
      const { owner, jar, jarCrumbs } = await fundedPlayer(0);
      const boostSession = sessionPda(
        program.programId,
        owner.publicKey,
        BOOST_LEVEL
      );

      try {
        await program.methods
          .startLevel(BOOST_LEVEL, true)
          .accountsPartial({
            player: owner.publicKey,
            session: boostSession,
            ...boostAccounts(jar, jarCrumbs),
          })
          .signers([owner])
          .rpc();
        throw new Error("Expected a boost with no token account to be rejected");
      } catch (err) {
        if (!String(err).includes("AccountNotInitialized")) throw err;
      }

      if (await connection.getAccountInfo(boostSession)) {
        throw new Error(
          "A rejected boost should not leave a session account behind"
        );
      }
    });

    it("Rejects a boost that doesn't supply the $CRUMB accounts", async () => {
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

      const boostSession = sessionPda(
        program.programId,
        owner.publicKey,
        BOOST_LEVEL
      );

      try {
        await program.methods
          .startLevel(BOOST_LEVEL, true)
          .accountsPartial({
            player: owner.publicKey,
            session: boostSession,
            ...noBoostAccounts,
          })
          .signers([owner])
          .rpc();
        throw new Error("Expected a boost with no jar accounts to be rejected");
      } catch (err) {
        if (!String(err).includes("BoostAccountsMissing")) throw err;
      }
    });

    it("Still lets a player without a Cookie Jar start a free round", async () => {
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

      const freeSession = sessionPda(
        program.programId,
        owner.publicKey,
        BOOST_LEVEL
      );

      await program.methods
        .startLevel(BOOST_LEVEL, false)
        .accountsPartial({
          player: owner.publicKey,
          session: freeSession,
          ...noBoostAccounts,
        })
        .signers([owner])
        .rpc();

      const account = await program.account.session.fetch(freeSession);
      if (account.boosted) {
        throw new Error("A free round should not be marked boosted");
      }
    });
  });
});
