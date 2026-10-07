import { Board } from './components/Board'
import { NextPiece } from './components/NextPiece'
import { Stat } from './components/Stat'
import { Title } from './components/Title'
import { TouchControls } from './components/TouchControls'
import { useTetris } from './useTetris'

const BUTTON =
  'rounded-lg px-4 py-1.5 md:px-5 md:py-2.5 text-sm font-bold tracking-wide uppercase ring-1 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-400'
const PRIMARY = `${BUTTON} bg-purple-600 ring-purple-400/50 hover:bg-purple-500`
const SECONDARY = `${BUTTON} bg-zinc-800 ring-zinc-700 hover:bg-zinc-700`

const KEY_HINTS: readonly (readonly [string, string])[] = [
  ['← →', 'move'],
  ['↑ / Z', 'rotate'],
  ['↓', 'soft drop'],
  ['Space', 'hard drop'],
  ['P', 'pause'],
]

export const App = (): React.JSX.Element => {
  const { session, dispatch, start, togglePause } = useTetris()
  const { mode, game, best, newBest, clears } = session
  const inGame = mode === 'playing' || mode === 'paused'

  return (
    <div className="flex h-dvh flex-col items-center overflow-hidden bg-zinc-950 px-4 pt-[max(env(safe-area-inset-top),0.5rem)] pb-[max(env(safe-area-inset-bottom),1rem)] text-zinc-100">
      <header className="flex w-full max-w-2xl items-center justify-between py-2">
        <Title />
        {inGame && (
          <button type="button" className={SECONDARY} onClick={togglePause}>
            {mode === 'paused' ? 'Resume' : 'Pause'}
          </button>
        )}
      </header>

      {/* Touch screens and narrow windows: stats in a bar above the board. */}
      <div className="mb-3 grid w-full max-w-md grid-cols-5 gap-1.5 pointer-fine:md:hidden">
        <Stat label="Score">{game.score}</Stat>
        <Stat label="Lines">{game.lines}</Stat>
        <Stat label="Level">{game.level}</Stat>
        <Stat label="Best">{best}</Stat>
        <Stat label="Next">
          <NextPiece type={game.next} />
        </Stat>
      </div>

      <main className="flex min-h-0 w-full flex-1 items-start justify-center gap-6 pointer-fine:md:items-center">
        <aside className="hidden w-32 flex-col gap-3 pointer-fine:md:flex">
          <Stat label="Score">{game.score}</Stat>
          <Stat label="Lines">{game.lines}</Stat>
          <Stat label="Level">{game.level}</Stat>
        </aside>

        <Board game={game} showPiece={mode !== 'title'} clears={clears}>
          {mode !== 'playing' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-md bg-zinc-950/80 p-4 text-center backdrop-blur-sm">
              {mode === 'title' && (
                <>
                  <p className="text-lg font-bold">Ready?</p>
                  <button type="button" className={PRIMARY} onClick={start} autoFocus>
                    Play
                  </button>
                </>
              )}
              {mode === 'paused' && (
                <>
                  <p className="text-lg font-bold">Paused</p>
                  <button type="button" className={PRIMARY} onClick={togglePause} autoFocus>
                    Resume
                  </button>
                  <button type="button" className={SECONDARY} onClick={start}>
                    Restart
                  </button>
                </>
              )}
              {mode === 'over' && (
                <>
                  <p className="text-xl font-black text-red-500">Game over</p>
                  <p className="font-mono text-2xl tabular-nums">{game.score}</p>
                  {newBest && <p className="text-sm font-bold text-yellow-300">New best!</p>}
                  <button type="button" className={PRIMARY} onClick={start} autoFocus>
                    Play again
                  </button>
                </>
              )}
            </div>
          )}
        </Board>

        <aside className="hidden w-32 flex-col gap-3 pointer-fine:md:flex">
          <Stat label="Next">
            <NextPiece type={game.next} />
          </Stat>
          <Stat label="Best">{best}</Stat>
        </aside>
      </main>

      <TouchControls dispatch={dispatch} className="mt-3 pointer-fine:md:hidden" />

      <footer className="mt-3 hidden flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-zinc-500 pointer-fine:md:flex">
        {KEY_HINTS.map(([keys, action]) => (
          <span key={action}>
            <kbd className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-zinc-300">{keys}</kbd> {action}
          </span>
        ))}
      </footer>
    </div>
  )
}
