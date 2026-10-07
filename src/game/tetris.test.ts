import { describe, expect, it } from 'vitest'
import {
  BOARD_H,
  BOARD_W,
  EMPTY,
  PIECE_COUNT,
  PIECE_I,
  PIECE_O,
  PIECE_T,
  ROTATIONS,
  cellAt,
  collides,
  deal,
  dropDistance,
  fall,
  ghostPiece,
  gravityMs,
  hardDrop,
  lineScore,
  newBag,
  newGame,
  pieceCovers,
  rotate,
  shape,
  shift,
  softDrop,
  spawnPiece,
  withCell,
  type Bag,
  type Board,
  type Game,
  type PieceType,
} from './tetris'

// --- helpers -------------------------------------------------------------------

const popcount = (v: number): number => {
  let n = 0
  for (; v; v &= v - 1) n++
  return n
}

const types = Array.from({ length: PIECE_COUNT }, (_, t) => t as PieceType)
const cols = Array.from({ length: BOARD_W }, (_, c) => c)
const rows = Array.from({ length: BOARD_H }, (_, r) => r)

// Fills `row` with a locked cell everywhere except columns [gapFrom, gapTo].
const fillRow = (board: Board, row: number, gapFrom: number, gapTo: number): Board =>
  cols.reduce((b, c) => (c < gapFrom || c > gapTo ? withCell(b, row, c, 1) : b), board)

const withPiece = (game: Game, type: PieceType, rot: number, x: number, y: number): Game => ({
  ...game,
  piece: { type, rot, x, y },
})

const boardEmpty = (board: Board): boolean =>
  rows.every((r) => cols.every((c) => cellAt(board, r, c) === EMPTY))

const emptyBoard = (): Board => newGame(1).board

// --- shapes and cells ----------------------------------------------------------

describe('shapes and cells', () => {
  it('every shape has four cells', () => {
    for (const t of types)
      for (let r = 0; r < ROTATIONS; r++) expect(popcount(shape(t, r))).toBe(4)
  })

  it('O looks the same in every rotation', () => {
    for (let r = 1; r < ROTATIONS; r++) expect(shape(PIECE_O, r)).toBe(shape(PIECE_O, 0))
  })

  it('withCell returns a new board and leaves the original alone', () => {
    const before = emptyBoard()
    const after = withCell(withCell(before, 5, 2, 3), 5, 3, 7)
    expect(cellAt(after, 5, 2)).toBe(3)
    expect(cellAt(after, 5, 3)).toBe(7)
    expect(cellAt(after, 5, 1)).toBe(EMPTY)
    expect(cellAt(before, 5, 2)).toBe(EMPTY)
    expect(cellAt(withCell(after, 5, 2, EMPTY), 5, 2)).toBe(EMPTY)
  })

  it('cells outside the board read as empty and ignore writes', () => {
    const board = emptyBoard()
    expect(cellAt(board, -1, 0)).toBe(EMPTY)
    expect(withCell(board, 0, BOARD_W, 1)).toEqual(board)
  })
})

// --- spawning and collision ----------------------------------------------------

describe('spawning and collision', () => {
  it('a new game starts empty with a spawned piece', () => {
    const g = newGame(42)
    expect(boardEmpty(g.board)).toBe(true)
    expect(g.score).toBe(0)
    expect(g.lines).toBe(0)
    expect(g.level).toBe(0)
    expect(g.over).toBe(false)
    expect(g.clearedRows).toEqual([])
    expect(g.piece.x).toBe(3)
    expect(g.piece.rot).toBe(0)
    expect(g.piece.type).toBeLessThan(PIECE_COUNT)
    expect(g.next).toBeLessThan(PIECE_COUNT)
    expect(collides(g.board, g.piece)).toBe(false)
  })

  it('every piece spawns touching the top row', () => {
    for (const t of types) {
      const p = spawnPiece(t)
      expect(cols.some((c) => pieceCovers(p, 0, c))).toBe(true)
      expect(cols.some((c) => pieceCovers(p, -1, c))).toBe(false)
    }
  })

  it('walls and floor are solid', () => {
    const b = emptyBoard()
    // T, rotation 0: box columns 0..2, rows 0..1
    expect(collides(b, { type: PIECE_T, rot: 0, x: -1, y: 5 })).toBe(true)
    expect(collides(b, { type: PIECE_T, rot: 0, x: 0, y: 5 })).toBe(false)
    expect(collides(b, { type: PIECE_T, rot: 0, x: 7, y: 5 })).toBe(false)
    expect(collides(b, { type: PIECE_T, rot: 0, x: 8, y: 5 })).toBe(true)
    expect(collides(b, { type: PIECE_T, rot: 0, x: 3, y: 18 })).toBe(false)
    expect(collides(b, { type: PIECE_T, rot: 0, x: 3, y: 19 })).toBe(true)
  })

  it('rows above the top are open', () => {
    expect(collides(emptyBoard(), { type: PIECE_I, rot: 0, x: 3, y: -2 })).toBe(false)
  })

  it('locked cells block pieces', () => {
    const b = withCell(emptyBoard(), 10, 4, 1)
    expect(collides(b, { type: PIECE_T, rot: 0, x: 3, y: 9 })).toBe(true)
    expect(collides(b, { type: PIECE_T, rot: 0, x: 3, y: 7 })).toBe(false)
  })
})

// --- randomizer ----------------------------------------------------------------

describe('7-bag randomizer', () => {
  it('deals each type once per seven', () => {
    let bag: Bag = newBag(1234)
    for (let round = 0; round < 3; round++) {
      const seen = new Set<number>()
      for (let i = 0; i < PIECE_COUNT; i++) {
        const d = deal(bag)
        bag = d.bag
        expect(seen.has(d.type)).toBe(false)
        seen.add(d.type)
      }
      expect(seen.size).toBe(PIECE_COUNT)
    }
  })

  it('is deterministic per seed and varies between seeds', () => {
    let a = newBag(7)
    let b = newBag(7)
    let c = newBag(8)
    let differs = false
    for (let i = 0; i < 14; i++) {
      const da = deal(a)
      const db = deal(b)
      const dc = deal(c)
      expect(da.type).toBe(db.type)
      differs ||= da.type !== dc.type
      a = da.bag
      b = db.bag
      c = dc.bag
    }
    expect(differs).toBe(true)
  })

  it('a zero seed still produces a working bag', () => {
    const bag = newBag(0)
    expect(bag.rng).not.toBe(0)
    expect(deal(bag).type).toBeLessThan(PIECE_COUNT)
  })
})

// --- movement ------------------------------------------------------------------

describe('movement', () => {
  it('shift moves until the wall', () => {
    let g = withPiece(newGame(1), PIECE_T, 0, 3, 5)
    g = shift(g, -1)
    expect(g.piece.x).toBe(2)
    for (let i = 0; i < 5; i++) g = shift(g, -1)
    expect(g.piece.x).toBe(0)
    expect(shift(g, 1).piece.x).toBe(1)
  })

  it('rotate turns clockwise', () => {
    let g = rotate(withPiece(newGame(1), PIECE_T, 0, 3, 5))
    expect(g.piece.rot).toBe(1)
    // T, rotation 1: stem up, arm pointing right
    expect(pieceCovers(g.piece, 5, 4)).toBe(true)
    expect(pieceCovers(g.piece, 6, 4)).toBe(true)
    expect(pieceCovers(g.piece, 6, 5)).toBe(true)
    expect(pieceCovers(g.piece, 7, 4)).toBe(true)
    for (let i = 0; i < 3; i++) g = rotate(g)
    expect(g.piece.rot).toBe(0)
  })

  it('rotate with -1 turns counter-clockwise', () => {
    const g = rotate(withPiece(newGame(1), PIECE_T, 0, 3, 5), -1)
    expect(g.piece.rot).toBe(3)
    expect(rotate(g, 1).piece.rot).toBe(0)
  })

  it('rotate kicks away from the wall', () => {
    // Vertical I hugging the left wall (box column 2 = board column 0).
    const start = withPiece(newGame(1), PIECE_I, 1, -2, 5)
    expect(collides(start.board, start.piece)).toBe(false)
    const g = rotate(start)
    expect(g.piece.rot).toBe(2)
    expect(g.piece.x).toBe(0)
    expect(collides(g.board, g.piece)).toBe(false)
  })

  it('a blocked rotation leaves the piece alone', () => {
    // A one-column well: nothing but a vertical I fits.
    const walled = rows.reduce((b, r) => fillRow(b, r, 0, 0), emptyBoard())
    const g = withPiece({ ...newGame(1), board: walled }, PIECE_I, 1, -2, 10)
    const after = rotate(g)
    expect(after.piece.rot).toBe(1)
    expect(after.piece.x).toBe(-2)
  })
})

// --- gravity, locking and clears -------------------------------------------------

describe('gravity, locking and clears', () => {
  it('fall moves down one row', () => {
    const g = fall(withPiece(newGame(1), PIECE_T, 0, 3, 5))
    expect(g.piece.y).toBe(6)
    expect(boardEmpty(g.board)).toBe(true)
  })

  it('fall on the floor locks and spawns the next piece', () => {
    const start = withPiece(newGame(1), PIECE_T, 0, 3, 18)
    const g = fall(start)
    expect(cellAt(g.board, 18, 4)).toBe(PIECE_T + 1)
    expect(cellAt(g.board, 19, 3)).toBe(PIECE_T + 1)
    expect(cellAt(g.board, 19, 4)).toBe(PIECE_T + 1)
    expect(cellAt(g.board, 19, 5)).toBe(PIECE_T + 1)
    expect(g.piece.type).toBe(start.next)
    expect(g.piece.y).toBe(spawnPiece(start.next).y)
    expect(g.clearedRows).toEqual([])
    expect(g.over).toBe(false)
  })

  it('a single line clear scores and shifts rows down', () => {
    const board = withCell(fillRow(emptyBoard(), 19, 3, 6), 18, 0, 5)
    const g = fall(withPiece({ ...newGame(1), board }, PIECE_I, 0, 3, 18))
    expect(g.clearedRows).toEqual([19])
    expect(g.lines).toBe(1)
    expect(g.score).toBe(40)
    expect(cellAt(g.board, 19, 0)).toBe(5)
    for (let c = 1; c < BOARD_W; c++) expect(cellAt(g.board, 19, c)).toBe(EMPTY)
    expect(cellAt(g.board, 18, 0)).toBe(EMPTY)
  })

  it('a four line clear scores 1200 at level zero', () => {
    const board = [16, 17, 18, 19].reduce((b, r) => fillRow(b, r, 9, 9), emptyBoard())
    const g = fall(withPiece({ ...newGame(1), board }, PIECE_I, 1, 7, 16))
    expect([...g.clearedRows].sort()).toEqual([16, 17, 18, 19])
    expect(g.lines).toBe(4)
    expect(g.score).toBe(1200)
    expect(boardEmpty(g.board)).toBe(true)
  })

  it('clearedRows resets on the next step', () => {
    const board = fillRow(emptyBoard(), 19, 3, 6)
    const g = fall(withPiece({ ...newGame(1), board }, PIECE_I, 0, 3, 18))
    expect(g.clearedRows).not.toEqual([])
    expect(shift(g, 1).clearedRows).toEqual([])
  })

  it('line scores follow the classic table', () => {
    expect(lineScore(0, 5)).toBe(0)
    expect(lineScore(1, 0)).toBe(40)
    expect(lineScore(2, 0)).toBe(100)
    expect(lineScore(3, 0)).toBe(300)
    expect(lineScore(4, 0)).toBe(1200)
    expect(lineScore(1, 9)).toBe(400)
  })

  it('the level rises every ten lines', () => {
    const board = fillRow(emptyBoard(), 19, 3, 6)
    const g = fall(withPiece({ ...newGame(1), board, lines: 9 }, PIECE_I, 0, 3, 18))
    expect(g.lines).toBe(10)
    expect(g.level).toBe(1)
  })

  it('gravity speeds up then bottoms out', () => {
    expect(gravityMs(0)).toBe(800)
    for (let level = 1; level < 40; level++)
      expect(gravityMs(level)).toBeLessThanOrEqual(gravityMs(level - 1))
    expect(gravityMs(9)).toBeLessThan(gravityMs(0))
    expect(gravityMs(255)).toBe(gravityMs(29))
    expect(gravityMs(255)).toBeGreaterThan(0)
  })

  it('soft drop scores a point per row', () => {
    let g = softDrop(withPiece(newGame(1), PIECE_T, 0, 3, 5))
    expect(g.piece.y).toBe(6)
    expect(g.score).toBe(1)
    g = softDrop(withPiece(g, PIECE_T, 0, 3, 18)) // on the floor: locks, no point
    expect(g.score).toBe(1)
    expect(cellAt(g.board, 19, 3)).toBe(PIECE_T + 1)
  })

  it('hard drop locks at the ghost and scores two points per row', () => {
    const start = withPiece(newGame(1), PIECE_T, 0, 3, 0)
    const g = hardDrop(start)
    expect(g.score).toBe(2 * 18)
    expect(cellAt(g.board, 18, 4)).toBe(PIECE_T + 1)
    expect(cellAt(g.board, 19, 3)).toBe(PIECE_T + 1)
    expect(g.piece.type).toBe(start.next)
  })

  it('hard drop reports cleared rows', () => {
    const board = fillRow(emptyBoard(), 19, 3, 6)
    const g = hardDrop(withPiece({ ...newGame(1), board }, PIECE_I, 0, 3, 5))
    expect(g.clearedRows).toEqual([19])
    expect(g.score).toBe(2 * 13 + 40)
  })

  it('drop distance measures the ghost', () => {
    expect(dropDistance(withPiece(newGame(1), PIECE_T, 0, 3, 0))).toBe(18)
    expect(dropDistance(withPiece(newGame(1), PIECE_I, 0, 3, -1))).toBe(19)
    const board = withCell(emptyBoard(), 12, 4, 1) // T's bottom row stops on 11, top at 10
    const g = withPiece({ ...newGame(1), board }, PIECE_T, 0, 3, 0)
    expect(dropDistance(g)).toBe(10)
    expect(ghostPiece(g)).toEqual({ ...g.piece, y: 10 })
  })
})

// --- game over -------------------------------------------------------------------

describe('game over', () => {
  it('ends when the next piece cannot spawn', () => {
    const board = [3, 4, 5].reduce((b, c) => withCell(b, 0, c, 1), emptyBoard())
    const g = fall(withPiece({ ...newGame(1), board }, PIECE_O, 0, 0, 18))
    expect(g.over).toBe(true)
  })

  it('ends when a piece locks above the top', () => {
    const board = rows.reduce((b, r) => withCell(b, r, 4, 1), emptyBoard())
    const g = fall(withPiece({ ...newGame(1), board }, PIECE_O, 0, 3, -2))
    expect(g.over).toBe(true)
  })

  it('a finished game ignores input', () => {
    const g = { ...newGame(1), over: true }
    const after = hardDrop(softDrop(fall(rotate(shift(g, 1)))))
    expect(after.piece).toEqual(g.piece)
    expect(after.score).toBe(g.score)
  })
})
