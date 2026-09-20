"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  BOARD_SIZE,
  areAdjacent,
  clearMatches,
  collapse,
  createBoard,
  findMatches,
  scoreForMatch,
  swapTiles,
  type Board as BoardState,
} from "@/lib/cookieCrush/board";
import TileIcon from "./TileIcon";

const SWAP_MS = 180;
const POP_MS = 220;
const DROP_MS = 260;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface BoardProps {
  onScore: (points: number) => void;
  disabled?: boolean;
}

export default function Board({ onScore, disabled }: BoardProps) {
  const [board, setBoard] = useState<BoardState>(() => createBoard());
  const [selected, setSelected] = useState<number | null>(null);
  const [popping, setPopping] = useState<Set<number>>(new Set());
  const [spawning, setSpawning] = useState<Set<number>>(new Set());
  const [shaking, setShaking] = useState<Set<number>>(new Set());
  const [locked, setLocked] = useState(false);

  // Guards the animation sequence's awaited steps against updating state
  // after the board unmounts (e.g. the round timer ends mid-cascade).
  const aliveRef = useRef(true);
  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  const resolveCascades = useCallback(
    async (startingBoard: BoardState) => {
      let current = startingBoard;
      let cascadeLevel = 0;

      while (true) {
        const matched = findMatches(current);
        if (matched.size === 0) break;
        if (!aliveRef.current) return;

        onScore(scoreForMatch(matched.size, cascadeLevel));

        setPopping(matched);
        await sleep(POP_MS);
        if (!aliveRef.current) return;

        const cleared = clearMatches(current, matched);
        const { board: collapsed, spawnedIds } = collapse(cleared);
        current = collapsed;

        setPopping(new Set());
        setSpawning(spawnedIds);
        setBoard(current);
        await sleep(DROP_MS);
        if (!aliveRef.current) return;

        setSpawning(new Set());
        cascadeLevel++;
      }
    },
    [onScore]
  );

  const handleTileClick = useCallback(
    async (i: number) => {
      if (disabled || locked) return;

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

      const a = selected;
      const b = i;
      setSelected(null);
      setLocked(true);

      const swapped = swapTiles(board, a, b);
      setBoard(swapped);
      await sleep(SWAP_MS);
      if (!aliveRef.current) return;

      if (findMatches(swapped).size === 0) {
        setShaking(new Set([a, b]));
        await sleep(SWAP_MS);
        if (!aliveRef.current) return;
        setBoard(board);
        await sleep(SWAP_MS);
        if (!aliveRef.current) return;
        setShaking(new Set());
      } else {
        await resolveCascades(swapped);
      }

      if (aliveRef.current) setLocked(false);
    },
    [board, selected, disabled, locked, resolveCascades]
  );

  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-border bg-background p-2 sm:p-3">
      {board.map((tile, i) => {
        const row = Math.floor(i / BOARD_SIZE);
        const col = i % BOARD_SIZE;
        const isSelected = selected === i;
        const isPopping = popping.has(tile.id);
        const isSpawning = spawning.has(tile.id);
        const isShaking = shaking.has(i);

        return (
          <div
            key={tile.id}
            className="absolute p-0.5 sm:p-1"
            style={{
              width: `${100 / BOARD_SIZE}%`,
              height: `${100 / BOARD_SIZE}%`,
              transform: `translate(${col * 100}%, ${row * 100}%)`,
              transition: "transform 180ms ease-out",
            }}
          >
            <button
              onClick={() => handleTileClick(i)}
              disabled={disabled || locked}
              aria-label={`Tile ${i}`}
              className={`flex h-full w-full items-center justify-center rounded-xl p-1 transition-colors sm:p-1.5 ${
                isSelected
                  ? "bg-primary/20 ring-2 ring-primary"
                  : "bg-surface hover:bg-primary/10"
              } disabled:cursor-not-allowed`}
            >
              <span
                className={`block h-full w-full ${
                  isPopping
                    ? "animate-[tile-pop_220ms_ease-in_forwards]"
                    : isSpawning
                      ? "animate-[tile-spawn_260ms_ease-out]"
                      : isShaking
                        ? "animate-[shake_180ms_ease-in-out]"
                        : ""
                }`}
              >
                <TileIcon type={tile.type} />
              </span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
