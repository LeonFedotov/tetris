import { useRef } from 'react'
import { CONTROLS, type Control, type Tetris } from '../useTetris'

type PadProps = {
  readonly label: string
  readonly control: Control
  readonly dispatch: Tetris['dispatch']
  readonly children: React.ReactNode
  readonly accent?: boolean
}

// Pointer events cover touch, pen and mouse; capture keeps the hold alive
// when a thumb slides off the button.
const Pad = ({ label, control, dispatch, children, accent }: PadProps): React.JSX.Element => {
  const stop = useRef<(() => void) | null>(null)
  const release = (): void => {
    stop.current?.()
    stop.current = null
  }
  return (
    <button
      type="button"
      aria-label={label}
      className={`flex h-16 items-center justify-center rounded-2xl text-2xl font-bold ring-1 transition-colors select-none touch-none active:scale-95 ${
        accent
          ? 'bg-purple-600/80 ring-purple-400/40 active:bg-purple-500'
          : 'bg-zinc-800 ring-zinc-700 active:bg-zinc-700'
      }`}
      onPointerDown={(e) => {
        e.preventDefault()
        e.currentTarget.setPointerCapture(e.pointerId)
        release()
        stop.current = control.hold(dispatch)
      }}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
      onContextMenu={(e) => e.preventDefault()}
    >
      {children}
    </button>
  )
}

type TouchControlsProps = { readonly dispatch: Tetris['dispatch']; readonly className?: string }

export const TouchControls = ({ dispatch, className = '' }: TouchControlsProps): React.JSX.Element => (
  <div className={`grid w-full max-w-md grid-cols-5 gap-2 ${className}`}>
    <Pad label="Move left" control={CONTROLS.left} dispatch={dispatch}>
      ◀
    </Pad>
    <Pad label="Soft drop" control={CONTROLS.down} dispatch={dispatch}>
      ▼
    </Pad>
    <Pad label="Move right" control={CONTROLS.right} dispatch={dispatch}>
      ▶
    </Pad>
    <Pad label="Hard drop" control={CONTROLS.hardDrop} dispatch={dispatch}>
      ⤓
    </Pad>
    <Pad label="Rotate" control={CONTROLS.rotate} dispatch={dispatch} accent>
      ⟳
    </Pad>
  </div>
)
