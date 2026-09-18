"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { TxStatus } from "@/hooks/useTransactionStatus";
import { COOKIESCAN_TX_URL } from "@/lib/solana/config";

export interface TransactionToast {
  id: number;
  label: string;
  status: TxStatus;
  signature?: string;
  error?: string;
}

export type ToastPatch = Partial<Omit<TransactionToast, "id" | "label">>;

interface ToastApi {
  push: (label: string) => number;
  update: (id: number, patch: ToastPatch) => void;
  dismiss: (id: number) => void;
}

/**
 * No-ops until a provider is mounted, so a transaction still completes even if
 * the toast layer is missing — it just goes unannounced.
 */
const ToastContext = createContext<ToastApi>({
  push: () => 0,
  update: () => {},
  dismiss: () => {},
});

export const useTransactionToasts = () => useContext(ToastContext);

const STATUS_LABELS: Record<TxStatus, string> = {
  idle: "",
  pending: "Waiting for your signature…",
  confirming: "Confirming on Cookie Chain…",
  confirmed: "Confirmed",
  failed: "Failed",
};

const DISMISS_AFTER_MS = 6000;

export function TransactionToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<TransactionToast[]>([]);
  const nextId = useRef(1);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));

    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const push = useCallback((label: string) => {
    const id = nextId.current++;
    setToasts((current) => [...current, { id, label, status: "pending" }]);
    return id;
  }, []);

  const update = useCallback(
    (id: number, patch: ToastPatch) => {
      setToasts((current) =>
        current.map((toast) =>
          toast.id === id ? { ...toast, ...patch } : toast
        )
      );

      // A success speaks for itself and can retire; a failure stays until the
      // player has actually read why.
      if (patch.status === "confirmed") {
        timers.current.set(
          id,
          setTimeout(() => dismiss(id), DISMISS_AFTER_MS)
        );
      }
    },
    [dismiss]
  );

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach(clearTimeout);
      pending.clear();
    };
  }, []);

  const api = useMemo(() => ({ push, update, dismiss }), [push, update, dismiss]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 p-4 sm:items-end"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex w-full max-w-sm flex-col gap-1 rounded-xl border p-4 shadow-lg backdrop-blur ${
              toast.status === "failed"
                ? "border-red-500/30 bg-red-50/95 dark:bg-red-950/90"
                : "border-black/[.08] bg-white/95 dark:border-white/[.145] dark:bg-zinc-900/95"
            }`}
          >
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm font-medium">{toast.label}</span>
              <button
                onClick={() => dismiss(toast.id)}
                aria-label="Dismiss"
                className="shrink-0 text-zinc-500 transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                ✕
              </button>
            </div>

            <span
              className={
                toast.status === "failed"
                  ? "text-sm text-red-700 dark:text-red-300"
                  : "text-sm text-zinc-600 dark:text-zinc-400"
              }
            >
              {toast.error ?? STATUS_LABELS[toast.status]}
            </span>

            {toast.signature && (
              <a
                href={`${COOKIESCAN_TX_URL}/${toast.signature}`}
                target="_blank"
                rel="noopener noreferrer"
                className="self-start text-xs underline underline-offset-4"
              >
                View on CookieScan
              </a>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
