import Image from "next/image";
import Header from "@/components/layout/Header";
import GameCard from "@/components/hub/GameCard";
import SuggestIdeaCard from "@/components/hub/SuggestIdeaCard";
import ContributeCard from "@/components/hub/ContributeCard";
import JarIcon from "@/components/jar/JarIcon";
import CrumbMascot from "@/components/lucky-slice/CrumbMascot";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <Header />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-6 py-16">
        <div className="flex flex-col items-center gap-4 pt-6 text-center sm:pt-10">
          <div className="relative">
            <div
              aria-hidden
              className="animate-glow-pulse absolute inset-0 -z-10 rounded-full bg-primary/30 blur-3xl"
            />
            <Image
              src="/logo.jpg"
              alt="Crumbs"
              width={96}
              height={96}
              className="rounded-full ring-2 ring-primary/40"
              priority
            />
          </div>
          <h1 className="font-display text-6xl font-bold uppercase tracking-tight text-foreground sm:text-7xl">
            Crumbs.
            <br />
            <span className="text-primary">Bake. Raid. Win.</span>
          </h1>
          <p className="max-w-lg font-mono text-sm text-muted sm:text-base">
            A growing collection of on-chain games on Cookie Chain. Connect a
            wallet and pick one to play. Every game action is a real
            transaction.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <GameCard
            icon={<JarIcon className="h-10 w-10" />}
            title="Jar Wars"
            description="Bake, hoard, and raid Cookie Jars. Mint a jar, earn $CRUMB over time, and steal from rivals in a commit-reveal raid."
            href="/games/jar-wars"
          />
          <GameCard
            emoji="🍬"
            title="Cookie Crush"
            description="Match 3 or more treats before the clock runs out. Start a level and submit your score on-chain, then climb the leaderboard."
            href="/games/cookie-crush"
          />
          <GameCard
            emoji="🍪"
            title="Nibble"
            description="One cookie, one pot, everyone bites. Bake it, or pay to take a bite. The bite that finishes it takes what's left."
            href="/games/nibble"
          />
          <GameCard
            icon={<CrumbMascot mood="happy" className="h-10 w-10" />}
            title="Lucky Slice"
            description="A random target, a swinging knife, one perfectly-timed tap. Cut as close to the target as you can. Free to play, no stakes."
            href="/games/lucky-slice"
          />
          <SuggestIdeaCard />
          <ContributeCard />
        </div>
      </main>
    </div>
  );
}
