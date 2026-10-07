import { useCallback, useEffect, useReducer, useRef, type ActionDispatch } from 'react'
import { DROP_MS, REPEAT_DELAY_MS, REPEAT_MS, holdRepeat } from './holdRepeat'
import { initialSession, reduce, type Action, type Mode, type Session } from './game/session'
import { gravityMs } from './game/tetris'

const BEST_KEY = 'tetris.best'

// Storage can be missing or throw (private mode, blocked site data).
const loadBest = (): number => {
  try {
    return Number(localStorage.getItem(BEST_KEY)) || 0
  } catch {
    return 0
  }
}

const saveBest = (best: number): void => {
  try {
    localStorage.setItem(BEST_KEY, String(best))
  } catch {
    // best score just won't survive a reload
  }
}

const randomSeed = (): number => crypto.getRandomValues(new Uint32Array(1))[0] ?? Date.now()

type Dispatch = ActionDispatch<[Action]>

// A press that repeats while held, and one that fires once.
export type Control = { readonly hold: (dispatch: Dispatch) => () => void }

const repeating = (action: Action, delayMs: number, everyMs: number): Control => ({
  hold: (dispatch) => holdRepeat(() => dispatch(action), delayMs, everyMs),
})

const once = (action: Action): Control => ({
  hold: (dispatch) => {
    dispatch(action)
    return () => {}
  },
})

export const CONTROLS = {
  left: repeating({ type: 'shift', dx: -1 }, REPEAT_DELAY_MS, REPEAT_MS),
  right: repeating({ type: 'shift', dx: 1 }, REPEAT_DELAY_MS, REPEAT_MS),
  down: repeating({ type: 'softDrop' }, DROP_MS, DROP_MS),
  rotate: once({ type: 'rotate', dir: 1 }),
  rotateBack: once({ type: 'rotate', dir: -1 }),
  hardDrop: once({ type: 'hardDrop' }),
} as const satisfies Record<string, Control>

const KEYS: Readonly<Record<string, Control>> = {
  ArrowLeft: CONTROLS.left,
  KeyA: CONTROLS.left,
  ArrowRight: CONTROLS.right,
  KeyD: CONTROLS.right,
  ArrowDown: CONTROLS.down,
  KeyS: CONTROLS.down,
  ArrowUp: CONTROLS.rotate,
  KeyW: CONTROLS.rotate,
  KeyX: CONTROLS.rotate,
  KeyZ: CONTROLS.rotateBack,
  Space: CONTROLS.hardDrop,
}

export type Tetris = {
  readonly session: Session
  readonly dispatch: Dispatch
  readonly start: () => void
  readonly togglePause: () => void
}

export const useTetris = (): Tetris => {
  const [session, dispatch] = useReducer(reduce, undefined, () => initialSession(loadBest()))
  const { mode } = session
  const { level } = session.game
  const modeRef = useRef<Mode>(mode)

  const start = useCallback(() => dispatch({ type: 'start', seed: randomSeed() }), [])
  const togglePause = useCallback(() => dispatch({ type: 'togglePause' }), [])

  useEffect(() => {
    modeRef.current = mode
  }, [mode])

  // Gravity.
  useEffect(() => {
    if (mode !== 'playing') return
    const id = setInterval(() => dispatch({ type: 'tick' }), gravityMs(level))
    return () => clearInterval(id)
  }, [mode, level])

  useEffect(() => saveBest(session.best), [session.best])

  // Pause when the tab or app goes to the background.
  useEffect(() => {
    const pause = (): void => dispatch({ type: 'pause' })
    const onVisibility = (): void => {
      if (document.hidden) pause()
    }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('blur', pause)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('blur', pause)
    }
  }, [])

  // Keyboard. Browser key repeat is ignored; held keys use our own timing.
  useEffect(() => {
    const held = new Map<string, () => void>()
    const release = (code: string): void => {
      held.get(code)?.()
      held.delete(code)
    }
    const releaseAll = (): void => [...held.keys()].forEach(release)

    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const current = modeRef.current
      if (e.code === 'Enter') {
        e.preventDefault()
        if (current === 'paused') togglePause()
        else if (current !== 'playing' && !e.repeat) start()
        return
      }
      if (e.code === 'KeyP' || e.code === 'Escape') {
        e.preventDefault()
        if (!e.repeat) togglePause()
        return
      }
      const control = KEYS[e.code]
      if (!control) return
      e.preventDefault()
      if (e.repeat || held.has(e.code) || current !== 'playing') return
      held.set(e.code, control.hold(dispatch))
    }
    const onKeyUp = (e: KeyboardEvent): void => release(e.code)

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', releaseAll)
    return () => {
      releaseAll()
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', releaseAll)
    }
  }, [start, togglePause])

  return { session, dispatch, start, togglePause }
}
