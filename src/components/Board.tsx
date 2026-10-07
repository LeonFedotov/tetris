import { BLOCK, CELL_COLORS } from '../colors'
import { BOARD_H, BOARD_W, EMPTY, cellAt, ghostPiece, pieceCovers, type Game } from '../game/tetris'

type View = { readonly value: number; readonly ghost: boolean }

const ROWS = Array.from({ length: BOARD_H }, (_, r) => r)
const COLS = Array.from({ length: BOARD_W }, (_, c) => c)

// Live piece over locked cells over the ghost.
const cellViews = (game: Game, showPiece: boolean): readonly View[] => {
  const ghost = ghostPiece(game)
  return ROWS.flatMap((r) =>
    COLS.map((c) => {
      if (showPiece && pieceCovers(game.piece, r, c)) return { value: game.piece.type + 1, ghost: false }
      const locked = cellAt(game.board, r, c)
      if (locked !== EMPTY) return { value: locked, ghost: false }
      return { value: EMPTY, ghost: showPiece && pieceCovers(ghost, r, c) }
    }),
  )
}

type BoardProps = {
  readonly game: Game
  readonly showPiece: boolean
  readonly clears: number
  readonly children?: React.ReactNode
}

export const Board = ({ game, showPiece, clears, children }: BoardProps): React.JSX.Element => (
  <div
    className="relative shrink-0 rounded-md bg-zinc-800 p-px ring-1 ring-zinc-700"
    style={{ width: 'calc(var(--cell) * 10 + 11px)', height: 'calc(var(--cell) * 20 + 21px)' }}
  >
    <div className="grid h-full w-full grid-cols-10 grid-rows-20 gap-px" role="img" aria-label="Board">
      {cellViews(game, showPiece).map(({ value, ghost }, i) => (
        <div
          key={i}
          className={
            ghost
              ? 'rounded-[2px] bg-zinc-900 ring-1 ring-white/30 ring-inset'
              : `${CELL_COLORS[value]} ${value === EMPTY ? '' : BLOCK}`
          }
        />
      ))}
    </div>
    {clears > 0 && (
      <div key={clears} className="pointer-events-none absolute inset-0 animate-flash rounded-md bg-white opacity-0" />
    )}
    {children}
  </div>
)
