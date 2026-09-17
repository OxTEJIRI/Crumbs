import WalletConnectButton from "@/components/wallet/WalletConnectButton";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-center gap-8 py-32 px-16">
        <h1 className="text-4xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Crumbs
        </h1>
        <p className="max-w-md text-center text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          An on-chain idle-strategy game on Cookie Chain. Connect your wallet
          to get started.
        </p>
        <WalletConnectButton />
      </main>
    </div>
  );
}
