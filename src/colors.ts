// Tailwind classes indexed by cell value: empty, then piece type + 1.
export const CELL_COLORS: readonly string[] = [
  'bg-zinc-900',
  'bg-cyan-400', // I
  'bg-yellow-300', // O
  'bg-purple-500', // T
  'bg-green-500', // S
  'bg-red-500', // Z
  'bg-blue-500', // J
  'bg-orange-400', // L
]

export const BLOCK =
  'rounded-[2px] shadow-[inset_-0.15em_-0.15em_0_rgb(0_0_0/0.3),inset_0.15em_0.15em_0_rgb(255_255_255/0.3)]'
