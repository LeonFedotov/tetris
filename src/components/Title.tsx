// "TETRIS" in six piece colours: Z, L, O, S, I, T.
const LETTERS = [
  ['T', 'text-red-500'],
  ['E', 'text-orange-400'],
  ['T', 'text-yellow-300'],
  ['R', 'text-green-500'],
  ['I', 'text-cyan-400'],
  ['S', 'text-purple-500'],
] as const

export const Title = (): React.JSX.Element => (
  <h1 className="font-mono text-2xl font-black tracking-[0.2em] md:text-3xl">
    {LETTERS.map(([letter, color], i) => (
      <span key={i} className={color}>
        {letter}
      </span>
    ))}
  </h1>
)
