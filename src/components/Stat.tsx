type StatProps = { readonly label: string; readonly children: React.ReactNode }

export const Stat = ({ label, children }: StatProps): React.JSX.Element => (
  <div className="rounded-md bg-zinc-900 min-w-0 px-2 py-1 ring-1 ring-zinc-800 pointer-fine:md:px-3 pointer-fine:md:py-2">
    <div className="text-[0.55rem] font-semibold tracking-widest text-zinc-500 uppercase pointer-fine:md:text-xs">
      {label}
    </div>
    <div className="truncate font-mono text-sm text-zinc-100 tabular-nums pointer-fine:md:text-2xl">{children}</div>
  </div>
)
