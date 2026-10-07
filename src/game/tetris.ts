// Tetris rules with no UI dependencies: board, pieces, rotation with wall
// kicks, gravity, line clears, scoring and the 7-bag randomizer. Pure
// functions over immutable values, ported from the ODROID-SHOW2 firmware.

export const BOARD_W = 10
export const BOARD_H = 20
export const PIECE_COUNT = 7
export const ROTATIONS = 4
export const EMPTY = 0 // cell value; a locked piece stores type + 1

export const PIECE_I = 0
export const PIECE_O = 1
export const PIECE_T = 2
export const PIECE_S = 3
export const PIECE_Z = 4
export const PIECE_J = 5
export const PIECE_L = 6
export type PieceType = 0 | 1 | 2 | 3 | 4 | 5 | 6

export type Board = readonly (readonly number[])[]

// (x, y) is the top-left of the piece's 4x4 box on the board. y may be
// negative while the piece pokes above the top edge.
export type Piece = {
  readonly type: PieceType
  readonly rot: number
  readonly x: number
  readonly y: number
}

// 7-bag randomizer: every type once per bag, in random order.
export type Bag = {
  readonly left: number // bit t set = type t not dealt yet from this bag
  readonly rng: number // xorshift32 state, never 0
}

export type Deal = { readonly bag: Bag; readonly type: PieceType }

export type Game = {
  readonly board: Board
  readonly piece: Piece
  readonly next: PieceType
  readonly bag: Bag
  readonly score: number
  readonly lines: number
  readonly level: number
  readonly over: boolean
  readonly clearedRows: readonly number[] // rows removed by the last step's lock
}

// 4x4 bitmasks, bit (0x8000 >> (row * 4 + col)). Rotation states 0..3
// clockwise, in SRS orientation.
const SHAPES: readonly (readonly number[])[] = [
  [0x0f00, 0x2222, 0x00f0, 0x4444], // I
  [0x6600, 0x6600, 0x6600, 0x6600], // O
  [0x4e00, 0x4640, 0x0e40, 0x4c40], // T
  [0x6c00, 0x4620, 0x06c0, 0x8c40], // S
  [0xc600, 0x2640, 0x0c60, 0x4c80], // Z
  [0x8e00, 0x6440, 0x0e20, 0x44c0], // J
  [0x2e00, 0x4460, 0x0e80, 0xc440], // L
]

// Sideways offsets tried in order when a rotation is blocked.
const KICKS = [0, -1, 1, -2, 2]

const SPAWN_X = 3
const LINES_PER_LEVEL = 10
const ALL_TYPES = 0x7f
const SEED_MIX = 2654435761 // Knuth's multiplicative hash
const SEED_FALLBACK = 0x9e3779b9
const HARD_DROP_POINTS = 2 // per row

// NES frames per row (60 fps) converted to milliseconds.
const GRAVITY_MS = [
  800, 717, 633, 550, 467, 383, 300, 217, 133, 100, 83, 83, 83, 67, 67, 67, 50, 50, 50, 33, 33,
  33, 33, 33, 33, 33, 33, 33, 33, 17,
]

// NES points for 0..4 lines at level 0; multiplied by (level + 1).
const LINE_POINTS = [0, 40, 100, 300, 1200]

const BOX = [0, 1, 2, 3]
const TYPES: readonly PieceType[] = [0, 1, 2, 3, 4, 5, 6]

const inBoard = (row: number, col: number): boolean =>
  row >= 0 && row < BOARD_H && col >= 0 && col < BOARD_W

const covers = (bits: number, r: number, c: number): boolean =>
  (bits & (0x8000 >> (r * 4 + c))) !== 0

// Board coordinates of the piece's four cells.
const pieceCells = (piece: Piece): readonly (readonly [number, number])[] => {
  const bits = shape(piece.type, piece.rot)
  return BOX.flatMap((r) =>
    BOX.filter((c) => covers(bits, r, c)).map((c) => [piece.y + r, piece.x + c] as const),
  )
}

const xorshift32 = (value: number): number => {
  let x = value
  x ^= x << 13
  x ^= x >>> 17
  x ^= x << 5
  return x >>> 0
}

const popcount = (value: number): number => {
  let n = 0
  for (let v = value; v; v &= v - 1) n++
  return n
}

const clearFullRows = (board: Board): { board: Board; rows: readonly number[] } => {
  const rows = board.flatMap((row, r) => (row.every((cell) => cell !== EMPTY) ? [r] : []))
  const kept = board.filter((_, r) => !rows.includes(r))
  const fresh = rows.map(() => Array<number>(BOARD_W).fill(EMPTY))
  return { board: [...fresh, ...kept], rows }
}

const lockAndSpawn = (game: Game, extraPoints = 0): Game => {
  const cells = pieceCells(game.piece)
  const placed = cells.reduce(
    (board, [row, col]) => withCell(board, row, col, game.piece.type + 1),
    game.board,
  )
  const cleared = clearFullRows(placed)
  const lines = game.lines + cleared.rows.length
  const scored: Game = {
    ...game,
    board: cleared.board,
    clearedRows: cleared.rows,
    score: game.score + extraPoints + lineScore(cleared.rows.length, game.level),
    lines,
    level: Math.floor(lines / LINES_PER_LEVEL),
  }

  if (cells.some(([row]) => row < 0)) return { ...scored, over: true }
  const next = deal(game.bag)
  const piece = spawnPiece(game.next)
  return {
    ...scored,
    piece,
    bag: next.bag,
    next: next.type,
    over: collides(scored.board, piece),
  }
}

// One row down, scoring `points` if it moved; locks when it can't.
const descend = (game: Game, points: number): Game => {
  if (game.over) return { ...game, clearedRows: [] }
  const moved = { ...game.piece, y: game.piece.y + 1 }
  if (collides(game.board, moved)) return lockAndSpawn(game)
  return { ...game, piece: moved, score: game.score + points, clearedRows: [] }
}

export const shape = (type: number, rot: number): number =>
  SHAPES[type % PIECE_COUNT]?.[rot % ROTATIONS] ?? 0

export const pieceCovers = (piece: Piece, row: number, col: number): boolean => {
  const r = row - piece.y
  const c = col - piece.x
  if (r < 0 || r > 3 || c < 0 || c > 3) return false
  return covers(shape(piece.type, piece.rot), r, c)
}

export const emptyBoard = (): Board =>
  Array.from({ length: BOARD_H }, () => Array<number>(BOARD_W).fill(EMPTY))

export const cellAt = (board: Board, row: number, col: number): number =>
  inBoard(row, col) ? (board[row]?.[col] ?? EMPTY) : EMPTY

export const withCell = (board: Board, row: number, col: number, value: number): Board =>
  inBoard(row, col)
    ? board.map((cells, r) => (r === row ? cells.map((v, c) => (c === col ? value : v)) : cells))
    : board

// Walls and floor are solid; rows above the top are open.
export const collides = (board: Board, piece: Piece): boolean =>
  pieceCells(piece).some(
    ([row, col]) =>
      col < 0 || col >= BOARD_W || row >= BOARD_H || (row >= 0 && cellAt(board, row, col) !== EMPTY),
  )

// The I's flat state sits in box row 1; lift it so it appears in row 0.
export const spawnPiece = (type: PieceType): Piece => ({
  type,
  rot: 0,
  x: SPAWN_X,
  y: type === PIECE_I ? -1 : 0,
})

export const newBag = (seed: number): Bag => {
  const mixed = Math.imul(seed, SEED_MIX) >>> 0
  return { left: ALL_TYPES, rng: mixed || SEED_FALLBACK }
}

export const deal = (bag: Bag): Deal => {
  const left = bag.left || ALL_TYPES
  const rng = xorshift32(bag.rng)
  const available = TYPES.filter((t) => left & (1 << t))
  const type = available[rng % popcount(left)] ?? PIECE_I
  return { bag: { left: left & ~(1 << type), rng }, type }
}

export const newGame = (seed: number): Game => {
  const first = deal(newBag(seed))
  const second = deal(first.bag)
  return {
    board: emptyBoard(),
    piece: spawnPiece(first.type),
    next: second.type,
    bag: second.bag,
    score: 0,
    lines: 0,
    level: 0,
    over: false,
    clearedRows: [],
  }
}

// Blocked moves leave the piece where it is.
export const shift = (game: Game, dx: number): Game => {
  if (game.over) return { ...game, clearedRows: [] }
  const moved = { ...game.piece, x: game.piece.x + dx }
  return { ...game, piece: collides(game.board, moved) ? game.piece : moved, clearedRows: [] }
}

// Clockwise for 1, counter-clockwise for -1, kicking up to 2 columns sideways.
export const rotate = (game: Game, dir: 1 | -1 = 1): Game => {
  if (game.over) return { ...game, clearedRows: [] }
  const turned = { ...game.piece, rot: (game.piece.rot + dir + ROTATIONS) % ROTATIONS }
  const kicked = KICKS.map((dx) => ({ ...turned, x: turned.x + dx })).find(
    (p) => !collides(game.board, p),
  )
  return { ...game, piece: kicked ?? game.piece, clearedRows: [] }
}

// Gravity: down one row, or lock and spawn.
export const fall = (game: Game): Game => descend(game, 0)

// fall(), plus 1 point when the piece moves.
export const softDrop = (game: Game): Game => descend(game, 1)

// Rows the piece can still fall.
export const dropDistance = (game: Game): number => {
  let rows = 0
  while (rows < BOARD_H + 4 && !collides(game.board, { ...game.piece, y: game.piece.y + rows + 1 }))
    rows++
  return rows
}

// Where the piece would land.
export const ghostPiece = (game: Game): Piece => ({
  ...game.piece,
  y: game.piece.y + dropDistance(game),
})

// Straight to the ghost and lock, 2 points per row.
export const hardDrop = (game: Game): Game => {
  if (game.over) return { ...game, clearedRows: [] }
  const rows = dropDistance(game)
  return lockAndSpawn({ ...game, piece: ghostPiece(game) }, rows * HARD_DROP_POINTS)
}

export const lineScore = (lines: number, level: number): number =>
  (LINE_POINTS[Math.min(lines, LINE_POINTS.length - 1)] ?? 0) * (level + 1)

export const gravityMs = (level: number): number =>
  GRAVITY_MS[Math.min(level, GRAVITY_MS.length - 1)] ?? 0
