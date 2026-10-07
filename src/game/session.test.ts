import { describe, expect, it } from 'vitest'
import { initialSession, reduce, type Session } from './session'
import { BOARD_H, PIECE_I, PIECE_O, withCell, type Board } from './tetris'

const playing = (): Session => reduce(initialSession(0), { type: 'start', seed: 1 })

const withBoard = (s: Session, board: Board): Session => ({ ...s, game: { ...s.game, board } })

describe('session', () => {
  it('starts on the title screen with the stored best', () => {
    const s = initialSession(500)
    expect(s.mode).toBe('title')
    expect(s.best).toBe(500)
  })

  it('start begins a fresh game', () => {
    const s = playing()
    expect(s.mode).toBe('playing')
    expect(s.game.score).toBe(0)
  })

  it('ignores moves outside of play', () => {
    const title = initialSession(0)
    expect(reduce(title, { type: 'shift', dx: 1 })).toBe(title)
    const paused = reduce(playing(), { type: 'togglePause' })
    expect(paused.mode).toBe('paused')
    expect(reduce(paused, { type: 'tick' })).toBe(paused)
    expect(reduce(paused, { type: 'hardDrop' })).toBe(paused)
  })

  it('togglePause resumes, pause only pauses', () => {
    const s = playing()
    const paused = reduce(s, { type: 'pause' })
    expect(paused.mode).toBe('paused')
    expect(reduce(paused, { type: 'pause' }).mode).toBe('paused')
    expect(reduce(paused, { type: 'togglePause' }).mode).toBe('playing')
    expect(reduce(initialSession(0), { type: 'togglePause' }).mode).toBe('title')
  })

  it('applies moves while playing', () => {
    const s = playing()
    const moved = reduce(s, { type: 'shift', dx: -1 })
    expect(moved.game.piece.x).toBe(s.game.piece.x - 1)
    expect(reduce(s, { type: 'tick' }).game.piece.y).toBe(s.game.piece.y + 1)
    expect(reduce(s, { type: 'softDrop' }).game.score).toBe(1)
    expect(reduce(s, { type: 'rotate', dir: 1 }).game.piece.rot).toBe(1)
  })

  it('counts line clears so the UI can flash', () => {
    const s = playing()
    const board = Array.from({ length: 10 }, (_, c) => c)
      .filter((c) => c < 3 || c > 6)
      .reduce((b, c) => withCell(b, BOARD_H - 1, c, 1), s.game.board)
    const ready = withBoard(
      { ...s, game: { ...s.game, piece: { type: PIECE_I, rot: 0, x: 3, y: 0 } } },
      board,
    )
    const after = reduce(ready, { type: 'hardDrop' })
    expect(after.clears).toBe(s.clears + 1)
    expect(reduce(after, { type: 'tick' }).clears).toBe(after.clears)
  })

  it('ends the game and records a new best', () => {
    const s = playing()
    const stack = Array.from({ length: BOARD_H }, (_, r) => r).reduce(
      (b, r) => withCell(b, r, 4, 1),
      s.game.board,
    )
    const doomed = withBoard(
      {
        ...s,
        best: 10,
        game: { ...s.game, score: 99, piece: { type: PIECE_O, rot: 0, x: 3, y: -2 } },
      },
      stack,
    )
    const over = reduce(doomed, { type: 'tick' })
    expect(over.mode).toBe('over')
    expect(over.best).toBe(99)
    expect(over.newBest).toBe(true)
  })

  it('keeps the old best when the score is lower', () => {
    const s = playing()
    const stack = Array.from({ length: BOARD_H }, (_, r) => r).reduce(
      (b, r) => withCell(b, r, 4, 1),
      s.game.board,
    )
    const doomed = withBoard(
      { ...s, best: 1000, game: { ...s.game, piece: { type: PIECE_O, rot: 0, x: 3, y: -2 } } },
      stack,
    )
    const over = reduce(doomed, { type: 'tick' })
    expect(over.mode).toBe('over')
    expect(over.best).toBe(1000)
    expect(over.newBest).toBe(false)
  })
})
