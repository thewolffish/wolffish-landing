function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : ''
  return (first + last).toUpperCase() || '?'
}

export function Avatar({
  name,
  size = 40,
  src
}: {
  name: string
  size?: number
  src?: string | null
}): React.JSX.Element {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- a data URL avatar, not a site asset
      <img
        src={src}
        alt=""
        aria-hidden
        draggable={false}
        style={{ width: size, height: size }}
        className="shrink-0 rounded-full object-cover select-none"
      />
    )
  }
  return (
    <span
      aria-hidden
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
      className="bg-primary/15 text-primary flex shrink-0 items-center justify-center rounded-full font-semibold select-none"
    >
      {initialsOf(name)}
    </span>
  )
}
