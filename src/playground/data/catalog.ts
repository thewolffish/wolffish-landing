import type { CatalogModelEntry, ThinkingMode } from './types'

/**
 * The org's model catalog — the frontier DeepSeek line on DeepInfra, the same
 * two ids the API seeds for Wolffish Inc (apps/api/src/lib/models.ts).
 *
 * V4.1 Flash replaced V4 Flash-0731 on 2026-09-11: DeepSeek's new Flash, and
 * the first one that sees. It carries no dated id upstream. It also retired
 * Flash-Vision-Exp — the experimental stopgap that gave a named pilot group
 * image input — because the baseline Flash now does that for every account,
 * so the catalog is back to a two-model baseline and no one needs a vision
 * grant. Prices are microUSD per 1M tokens.
 */
export const CATALOG: CatalogModelEntry[] = [
  {
    id: 'deepseek-ai/DeepSeek-V4.1-Flash',
    name: 'DeepSeek V4.1 Flash',
    reasoning: true,
    vision: true,
    contextWindow: 1_048_576,
    inPerMtokMicroUsd: 200_000,
    outPerMtokMicroUsd: 600_000,
    cachedInPerMtokMicroUsd: 6_000,
    default: true
  },
  {
    id: 'deepseek-ai/DeepSeek-V4-Pro-0813',
    name: 'DeepSeek V4 Pro',
    reasoning: true,
    vision: false,
    contextWindow: 1_048_576,
    inPerMtokMicroUsd: 1_300_000,
    outPerMtokMicroUsd: 2_600_000,
    cachedInPerMtokMicroUsd: 100_000,
    default: false
  }
]

export const FLASH = CATALOG[0].id
export const PRO = CATALOG[1].id

export const PROVIDER = 'cloud'

/** Token count where auto-compaction triggers — the desktop's 60% of the window. */
export function compactionAtFor(model: string | null): number {
  const entry = CATALOG.find((m) => m.id === model)
  return Math.round((entry?.contextWindow ?? 131_072) * 0.6)
}

export function contextWindowFor(model: string | null): number {
  return CATALOG.find((m) => m.id === model)?.contextWindow ?? 131_072
}

export function modelMeta(id: string | null): CatalogModelEntry {
  return CATALOG.find((m) => m.id === id) ?? CATALOG[0]
}

export function shortModelName(model: string | null): string {
  if (!model) return ''
  const slash = model.lastIndexOf('/')
  return slash === -1 ? model : model.slice(slash + 1)
}

/** USD cost of a call, from the catalog's per-Mtok prices. */
export function costUsd(model: string | null, tokensIn: number, tokensOut: number, cached = 0): number {
  const meta = modelMeta(model)
  const c = Math.min(Math.max(0, cached), Math.max(0, tokensIn))
  const fresh = Math.max(0, tokensIn) - c
  const micro =
    (fresh * meta.inPerMtokMicroUsd +
      c * meta.cachedInPerMtokMicroUsd +
      tokensOut * meta.outPerMtokMicroUsd) /
    1_000_000
  return micro / 1_000_000
}

/** The ordered reasoning modes the org router honours (reasoning.ts). */
export function reasoningModesFor(model: string | null): ThinkingMode[] {
  if (!model) return []
  if (model.toLowerCase().includes('deepseek-v4')) return ['off', 'high', 'max']
  return []
}

export function normalizeReasoningMode(
  persisted: string | undefined,
  modes: ThinkingMode[]
): ThinkingMode {
  if (modes.length === 0) return 'off'
  if (persisted && (modes as string[]).includes(persisted)) return persisted as ThinkingMode
  return modes.includes('high') ? 'high' : modes[0]
}
