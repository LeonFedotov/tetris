// What the screen is doing around a game: title, playing, paused or over,
// plus the best score. A pure reducer so React can drive it with useReducer.

import { fall, hardDrop, newGame, rotate, shift, softDrop, type Game } from './tetris'

export type Mode = 'title' | 'playing' | 'paused' | 'over'

export type Session = {
  readonly mode: Mode
  readonly game: Game
  readonly best: number
  readonly newBest: boolean
  readonly clears: number // bumps on every line clear, to key the flash
}

export type Action =
  | { readonly type: 'start'; readonly seed: number }
  | { readonly type: 'shift'; readonly dx: number }
  | { readonly type: 'rotate'; readonly dir: 1 | -1 }
  | { readonly type: 'softDrop' }
  | { readonly type: 'hardDrop' }
  | { readonly type: 'tick' }
  | { readonly type: 'pause' }
  | { readonly type: 'togglePause' }

export const initialSession = (best: number): Session => ({
  mode: 'title',
  game: newGame(0),
  best,
  newBest: false,
  clears: 0,
})

const step = (game: Game, action: Action): Game => {
  switch (action.type) {
    case 'shift':
      return shift(game, action.dx)
    case 'rotate':
      return rotate(game, action.dir)
    case 'softDrop':
      return softDrop(game)
    case 'hardDrop':
      return hardDrop(game)
    default:
      return fall(game)
  }
}

const advance = (session: Session, game: Game): Session => {
  const clears = session.clears + (game.clearedRows.length > 0 ? 1 : 0)
  if (!game.over) return { ...session, game, clears }
  const newBest = game.score > session.best
  return {
    ...session,
    game,
    clears,
    mode: 'over',
    newBest,
    best: newBest ? game.score : session.best,
  }
}

export const reduce = (session: Session, action: Action): Session => {
  switch (action.type) {
    case 'start':
      return { ...session, mode: 'playing', game: newGame(action.seed), newBest: false }
    case 'pause':
      return session.mode === 'playing' ? { ...session, mode: 'paused' } : session
    case 'togglePause':
      if (session.mode === 'playing') return { ...session, mode: 'paused' }
      if (session.mode === 'paused') return { ...session, mode: 'playing' }
      return session
    default:
      return session.mode === 'playing' ? advance(session, step(session.game, action)) : session
  }
}
