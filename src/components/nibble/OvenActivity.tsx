"use client";

import { useEffect, useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { getOvenPda } from "@/lib/solana/nibble";
import { COOKIESCAN_TX_URL } from "@/lib/solana/config";

interface Entry {
  signature: string;
  action: string;
  detail: string | null;
  failed: boolean;
  at: number | null;
}

/**
 * Reads what happened from the oven's own transaction logs. The program emits
 * a `msg!` per outcome, so the feed reflects what the chain actually did
 * rather than anything the client guessed at.
 */
function summarise(logs: string[] | null | undefined): Pick<Entry, "action" | "detail"> {
  const joined = (logs ?? []).join("\n");

  const eaten = joined.match(/Cookie eaten by (\w+) — won (\d+) lamports/);
  if (eaten) {
    return { action: "Eaten", detail: `${eaten[1].slice(0, 4)}… took the pot` };
  }
  if (/Cookie burned/.test(joined)) {
    return { action: "Burned", detail: "the jar took everything" };
  }
  const pulled = joined.match(/Pulled: baker received (\d+)/);
  if (pulled) {
    return { action: "Pulled", detail: "baker got out in time" };
  }
  const nibbled = joined.match(/Nibbled for (\d+) damage/);
  if (nibbled) {
    return {
      action: "Bite",
      detail: `${(Number(nibbled[1]) / 100).toFixed(1)}% damage`,
    };
  }
  const glazed = joined.match(/Glazed for (\d+) lamports/);
  if (glazed) {
    return { action: "Glaze", detail: "baker cooled it down" };
  }
  if (/Instruction: Bake/.test(joined)) {
    return { action: "Baked", detail: "a new batch started" };
  }
  if (/Instruction: CrankHeat/.test(joined)) {
    return { action: "Stoked", detail: "idle heat applied" };
  }
  return { action: "Activity", detail: null };
}

export default function OvenActivity({ batchId }: { batchId: number }) {
  const { connection } = useConnection();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const oven = getOvenPda();

    const load = async () => {
      try {
        const signatures = await connection.getSignaturesForAddress(oven, {
          limit: 12,
        });

        const detailed = await Promise.all(
          signatures.map(async (entry) => {
            const tx = await connection.getTransaction(entry.signature, {
              commitment: "confirmed",
              maxSupportedTransactionVersion: 0,
            });
            const { action, detail } = summarise(tx?.meta?.logMessages);
            return {
              signature: entry.signature,
              action,
              detail,
              failed: entry.err !== null,
              at: entry.blockTime ?? null,
            };
          })
        );

        if (!cancelled) {
          setEntries(detailed);
          setFailed(false);
        }
      } catch {
        if (!cancelled) setFailed(true);
      }
    };

    load();
    // batchId changing means a new cookie went in, which is exactly when the
    // feed is most worth re-reading.
    return () => {
      cancelled = true;
    };
  }, [connection, batchId]);

  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-border bg-surface p-6 shadow-sm">
      <h2 className="font-display text-lg font-semibold">Recent activity</h2>

      {failed ? (
        <p className="text-sm text-muted">Couldn&apos;t load recent activity.</p>
      ) : entries.length === 0 ? (
        <p className="text-sm text-muted">Nothing has happened yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {entries.map((entry) => (
            <li key={entry.signature}>
              <a
                href={`${COOKIESCAN_TX_URL}/${entry.signature}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-baseline justify-between gap-3 rounded-xl px-3 py-2 text-sm transition-colors hover:bg-background"
              >
                <span
                  className={`font-medium ${entry.failed ? "text-muted line-through" : ""}`}
                >
                  {entry.action}
                </span>
                <span className="truncate text-right text-xs text-muted">
                  {entry.detail ?? entry.signature.slice(0, 8)}
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
