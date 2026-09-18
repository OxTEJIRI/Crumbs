import * as anchor from "@anchor-lang/core";
import { Program } from "@anchor-lang/core";
import { CrumbJar } from "../target/types/crumb_jar";

describe("crumb_jar", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.crumbJar as Program<CrumbJar>;
  const provider = anchor.getProvider() as anchor.AnchorProvider;

  const owner = provider.wallet.publicKey;
  const [jar] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("cookie_jar"), owner.toBuffer()],
    program.programId
  );

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
});
