import * as anchor from "@anchor-lang/core";
import { Program } from "@anchor-lang/core";
import { CrumbJar } from "../target/types/crumb_jar";

describe("crumb_jar", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.crumbJar as Program<CrumbJar>;
  const provider = anchor.getProvider() as anchor.AnchorProvider;

  it("Mints a cookie jar for the connected wallet", async () => {
    const owner = provider.wallet.publicKey;
    const [jar] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("cookie_jar"), owner.toBuffer()],
      program.programId
    );

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
});
