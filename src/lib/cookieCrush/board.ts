export const BOARD_SIZE = 8;
export const TILE_TYPES = 6;
export const TILE_EMOJI = ["🍪", "🧁", "🍩", "🍫", "🍬", "🍭"];

/** Row-major flat array; -1 marks a cell mid-clear, never visible to callers. */
export type Board = number[];

const idx = (row: number, col: number) => row * BOARD_SIZE + col;
const randomTile = () => Math.floor(Math.random() * TILE_TYPES);

/** A fresh board with no pre-existing matches, so play starts from a clean state. */
export function createBoard(): Board {
  const board: Board = new Array(BOARD_SIZE * BOARD_SIZE).fill(-1);

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      let tile: number;
      do {
        tile = randomTile();
      } while (
        (col >= 2 &&
          board[idx(row, col - 1)] === tile &&
          board[idx(row, col - 2)] === tile) ||
        (row >= 2 &&
          board[idx(row - 1, col)] === tile &&
          board[idx(row - 2, col)] === tile)
      );
      board[idx(row, col)] = tile;
    }
  }
  return board;
}

function findMatches(board: Board): Set<number> {
  const matched = new Set<number>();

  for (let row = 0; row < BOARD_SIZE; row++) {
    let runStart = 0;
    for (let col = 1; col <= BOARD_SIZE; col++) {
      const sameAsRunStart =
        col < BOARD_SIZE && board[idx(row, col)] === board[idx(row, runStart)];
      if (!sameAsRunStart) {
        if (col - runStart >= 3) {
          for (let c = runStart; c < col; c++) matched.add(idx(row, c));
        }
        runStart = col;
      }
    }
  }

  for (let col = 0; col < BOARD_SIZE; col++) {
    let runStart = 0;
    for (let row = 1; row <= BOARD_SIZE; row++) {
      const sameAsRunStart =
        row < BOARD_SIZE && board[idx(row, col)] === board[idx(runStart, col)];
      if (!sameAsRunStart) {
        if (row - runStart >= 3) {
          for (let r = runStart; r < row; r++) matched.add(idx(r, col));
        }
        runStart = row;
      }
    }
  }

  return matched;
}

/** Drops surviving tiles down each column and refills the gaps at the top. */
function collapse(board: Board): Board {
  const next = [...board];

  for (let col = 0; col < BOARD_SIZE; col++) {
    const surviving: number[] = [];
    for (let row = BOARD_SIZE - 1; row >= 0; row--) {
      const tile = next[idx(row, col)];
      if (tile !== -1) surviving.push(tile);
    }
    for (let row = BOARD_SIZE - 1; row >= 0; row--) {
      const fromBottom = BOARD_SIZE - 1 - row;
      next[idx(row, col)] =
        fromBottom < surviving.length ? surviving[fromBottom] : randomTile();
    }
  }

  return next;
}

export interface ResolveResult {
  board: Board;
  points: number;
  cascades: number;
}

/**
 * Clears matches, drops tiles, refills, and repeats while new matches keep
 * appearing. Later cascade levels score a higher multiplier, since a single
 * swap causing several chained clears takes more skill/luck to set up.
 */
export function resolveMatches(board: Board): ResolveResult {
  let current = [...board];
  let points = 0;
  let cascades = 0;
  let multiplier = 1;

  while (true) {
    const matched = findMatches(current);
    if (matched.size === 0) break;

    points += Math.round(matched.size * 10 * multiplier);
    cascades++;
    multiplier += 0.5;

    for (const i of matched) current[i] = -1;
    current = collapse(current);
  }

  return { board: current, points, cascades };
}

export function swapTiles(board: Board, a: number, b: number): Board {
  const next = [...board];
  [next[a], next[b]] = [next[b], next[a]];
  return next;
}

export function areAdjacent(a: number, b: number): boolean {
  const rowA = Math.floor(a / BOARD_SIZE);
  const colA = a % BOARD_SIZE;
  const rowB = Math.floor(b / BOARD_SIZE);
  const colB = b % BOARD_SIZE;
  return Math.abs(rowA - rowB) + Math.abs(colA - colB) === 1;
}

/** Whether swapping a and b would create at least one match — used to reject dead moves. */
export function wouldMatch(board: Board, a: number, b: number): boolean {
  return findMatches(swapTiles(board, a, b)).size > 0;
}
