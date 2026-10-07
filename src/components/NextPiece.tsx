import { BLOCK, CELL_COLORS } from '../colors'
import { pieceCovers, spawnPiece, type PieceType } from '../game/tetris'

const BOX = [0, 1, 2, 3]

// The piece in its spawn rotation, cropped to the rows and columns it uses.
export const NextPiece = ({ type }: { readonly type: PieceType }): React.JSX.Element => {
  const piece = { ...spawnPiece(type), x: 0, y: 0 }
  const rows = BOX.filter((r) => BOX.some((c) => pieceCovers(piece, r, c)))
  const cols = BOX.filter((c) => BOX.some((r) => pieceCovers(piece, r, c)))
  return (
    <div className="flex h-5 pointer-fine:md:h-[calc(var(--cell)*1.6)] items-center justify-center" aria-label="Next piece">
      <div
        className="grid gap-px"
        style={{
          gridTemplateColumns: `repeat(${cols.length}, var(--preview-cell))`,
          gridAutoRows: 'var(--preview-cell)',
        }}
      >
        {rows.flatMap((r) =>
          cols.map((c) => (
            <div
              key={`${r}-${c}`}
              className={pieceCovers(piece, r, c) ? `${CELL_COLORS[type + 1]} ${BLOCK}` : ''}
            />
          )),
        )}
      </div>
    </div>
  )
}
