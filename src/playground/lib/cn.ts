export type ClassValue = string | number | false | null | undefined | ClassValue[]

/** Plain join, not tailwind-merge — identical to the desktop's helper. */
export function cn(...values: ClassValue[]): string {
  const out: string[] = []
  for (const v of values) {
    if (!v) continue
    if (Array.isArray(v)) {
      const nested = cn(...v)
      if (nested) out.push(nested)
    } else {
      out.push(String(v))
    }
  }
  return out.join(' ')
}
