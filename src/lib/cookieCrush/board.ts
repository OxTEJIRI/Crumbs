export const BOARD_SIZE = 8;
export const TILE_TYPES = 6;

/**
 * Tiles carry a stable id so the UI can animate "this tile moved" across
 * renders (React reconciles by key) instead of every move being an
 * instant jump to a new board of anonymous values.
 */
export interface Tile {
  id: number;
  type: number;
}

export type Board = Tile[];

let nextId = 0;
const randomType = () => Math.floor(Math.random() * TILE_TYPES);
const makeTile = (): Tile => ({ id: nextId++, type: randomType() });

const idx = (row: number, col: number) => row * BOARD_SIZE + col;

/** A fresh board with no pre-existing matches, so play starts from a clean state. */
export function createBoard(): Board {
  const board: Board = new Array(BOARD_SIZE * BOARD_SIZE);

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      let tile: Tile;
      do {
        tile = makeTile();
      } while (
        (col >= 2 &&
          board[idx(row, col - 1)].type === tile.type &&
          board[idx(row, col - 2)].type === tile.type) ||
        (row >= 2 &&
          board[idx(row - 1, col)].type === tile.type &&
          board[idx(row - 2, col)].type === tile.type)
      );
      board[idx(row, col)] = tile;
    }
  }
  return board;
}

export function findMatches(board: Board): Set<number> {
  const matched = new Set<number>();

  for (let row = 0; row < BOARD_SIZE; row++) {
    let runStart = 0;
    for (let col = 1; col <= BOARD_SIZE; col++) {
      const sameAsRunStart =
        col < BOARD_SIZE &&
        board[idx(row, col)].type === board[idx(row, runStart)].type;
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
        row < BOARD_SIZE &&
        board[idx(row, col)].type === board[idx(runStart, col)].type;
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

/** Score for one cascade level — later levels are worth more, since a single swap causing several chained clears takes more to set up. */
export function scoreForMatch(matchedCount: number, cascadeLevel: number): number {
  const multiplier = 1 + cascadeLevel * 0.5;
  return Math.round(matchedCount * 10 * multiplier);
}

/** The pop step: marks matched slots empty, keeping everything else in place. */
export function clearMatches(
  board: Board,
  matched: Set<number>
): (Tile | null)[] {
  const next: (Tile | null)[] = [...board];
  for (const i of matched) next[i] = null;
  return next;
}

export interface CollapseResult {
  board: Board;
  spawnedIds: Set<number>;
}

/**
 * The drop step: survivors fall within their column, new tiles fill the
 * gaps at the top. Survivors keep their id (so the UI animates them moving
 * down); spawnedIds tells the UI which tiles are brand new, so it can play
 * a "falling in from above" entrance for those specifically.
 */
export function collapse(board: (Tile | null)[]): CollapseResult {
  const next: Board = new Array(BOARD_SIZE * BOARD_SIZE);
  const spawnedIds = new Set<number>();

  for (let col = 0; col < BOARD_SIZE; col++) {
    const surviving: Tile[] = [];
    for (let row = BOARD_SIZE - 1; row >= 0; row--) {
      const tile = board[idx(row, col)];
      if (tile) surviving.push(tile);
    }
    for (let row = BOARD_SIZE - 1; row >= 0; row--) {
      const fromBottom = BOARD_SIZE - 1 - row;
      if (fromBottom < surviving.length) {
        next[idx(row, col)] = surviving[fromBottom];
      } else {
        const spawned = makeTile();
        spawnedIds.add(spawned.id);
        next[idx(row, col)] = spawned;
      }
    }
  }

  return { board: next, spawnedIds };
}
