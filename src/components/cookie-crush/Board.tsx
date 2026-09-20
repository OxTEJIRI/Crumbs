"use client";

import { useCallback, useState } from "react";
import {
  BOARD_SIZE,
  TILE_EMOJI,
  areAdjacent,
  createBoard,
  resolveMatches,
  swapTiles,
  wouldMatch,
  type Board as BoardState,
} from "@/lib/cookieCrush/board";

interface BoardProps {
  onScore: (points: number) => void;
  disabled?: boolean;
}

export default function Board({ onScore, disabled }: BoardProps) {
  const [board, setBoard] = useState<BoardState>(() => createBoard());
  const [selected, setSelected] = useState<number | null>(null);
  const [invalidPair, setInvalidPair] = useState<[number, number] | null>(null);

  const handleTileClick = useCallback(
    (i: number) => {
      if (disabled) return;

      if (selected === null) {
        setSelected(i);
        return;
      }

      if (selected === i) {
        setSelected(null);
        return;
      }

      if (!areAdjacent(selected, i)) {
        setSelected(i);
        return;
      }

      if (!wouldMatch(board, selected, i)) {
        // Flash the rejected swap, then revert — no state change, no score.
        setInvalidPair([selected, i]);
        setSelected(null);
        setTimeout(() => setInvalidPair(null), 300);
        return;
      }

      const swapped = swapTiles(board, selected, i);
      const { board: settled, points } = resolveMatches(swapped);
      setBoard(settled);
      setSelected(null);
      if (points > 0) onScore(points);
    },
    [board, selected, disabled, onScore]
  );

  return (
    <div
      className="grid gap-1 rounded-2xl border border-border bg-background p-2 sm:gap-1.5 sm:p-3"
      style={{ gridTemplateColumns: `repeat(${BOARD_SIZE}, minmax(0, 1fr))` }}
    >
      {board.map((tile, i) => {
        const isSelected = selected === i;
        const isInvalid = invalidPair?.includes(i) ?? false;

        return (
          <button
            key={i}
            onClick={() => handleTileClick(i)}
            disabled={disabled}
            aria-label={`Tile ${i}`}
            className={`flex aspect-square items-center justify-center rounded-xl text-xl transition-all sm:text-2xl ${
              isSelected
                ? "scale-95 bg-primary/20 ring-2 ring-primary"
                : "bg-surface hover:bg-primary/10"
            } ${isInvalid ? "animate-[shake_0.3s_ease-in-out]" : ""} disabled:cursor-not-allowed`}
          >
            {TILE_EMOJI[tile]}
          </button>
        );
      })}
    </div>
  );
}
