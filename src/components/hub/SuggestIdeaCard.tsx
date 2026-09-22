"use client";

import { useRef, useState } from "react";

const SUGGESTIONS_EMAIL = "heistejiri@gmail.com";

/**
 * No backend exists in this project — everything is either static or
 * on-chain — so this hands off to the player's own email client via a
 * mailto: link rather than posting anywhere. Uses a native <dialog> for
 * free focus-trapping/ESC-to-close instead of adding a modal dependency.
 */
export default function SuggestIdeaCard() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [idea, setIdea] = useState("");

  const openModal = () => dialogRef.current?.showModal();
  const closeModal = () => dialogRef.current?.close();

  const handleSend = () => {
    const subject = encodeURIComponent("Crumbs game idea");
    const body = encodeURIComponent(idea);
    window.location.href = `mailto:${SUGGESTIONS_EMAIL}?subject=${subject}&body=${body}`;
    closeModal();
  };

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="group relative flex h-full flex-col gap-3 overflow-hidden rounded-3xl border border-primary/20 bg-surface p-6 text-left shadow-md transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -left-8 -top-8 h-32 w-32 rounded-full bg-primary/15 blur-2xl transition-opacity group-hover:opacity-80"
        />
        <span className="relative text-4xl" aria-hidden>
          ✨
        </span>
        <h3 className="relative font-display text-xl font-semibold tracking-tight">
          Got an idea?
        </h3>
        <p className="relative flex-1 text-sm text-muted">
          Suggest the next game to add to Crumbs.
        </p>
        <span className="relative w-fit rounded-full bg-background px-3 py-1 text-xs font-medium text-primary">
          Send a suggestion
        </span>
      </button>

      <dialog
        ref={dialogRef}
        onClose={() => setIdea("")}
        onClick={(e) => {
          if (e.target === dialogRef.current) closeModal();
        }}
        className="w-full max-w-md rounded-3xl border border-border bg-surface p-6 text-foreground shadow-lg backdrop:bg-black/50"
      >
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
        >
          <div className="flex flex-col gap-1">
            <h3 className="font-display text-lg font-semibold">
              Suggest a game
            </h3>
            <p className="text-sm text-muted">
              This opens your email client addressed to the Crumbs team.
              Nothing is sent from here directly.
            </p>
          </div>

          <textarea
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            rows={5}
            placeholder="A game where..."
            className="w-full rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-primary"
          />

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={closeModal}
              className="h-10 rounded-full px-4 text-sm font-medium text-muted transition-colors hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-10 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
            >
              Open email
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
