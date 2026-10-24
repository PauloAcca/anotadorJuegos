export const TEAM_COLORS = [
  '#c8ff4d',
  '#6ee7ff',
  '#c4b5fd',
  '#ffab8f',
  '#ffe08a',
  '#86efac',
  '#f9a8d4',
  '#93c5fd',
  '#fca5a5',
  '#5eead4',
] as const

export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
}

export function randomInt(maxExclusive: number): number {
  if (maxExclusive <= 1) return 0
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    const values = new Uint32Array(1)
    crypto.getRandomValues(values)
    return values[0] % maxExclusive
  }
  return Math.floor(Math.random() * maxExclusive)
}

export function shuffle<T>(items: readonly T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1)
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

/**
 * Reparte la cantidad de jugadores de la forma más pareja posible.
 * Los sobrantes se acomodan en los últimos equipos, que son los que
 * se completan de manera automática al final del sorteo.
 */
export function computeTeamSizes(playerCount: number, teamCount: number): number[] {
  if (teamCount <= 0) return []
  const base = Math.floor(playerCount / teamCount)
  const remainder = playerCount % teamCount
  return Array.from({ length: teamCount }, (_, index) =>
    base + (index >= teamCount - remainder ? 1 : 0),
  )
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

export function groupScoresByRound<T extends { round: number }>(
  entries: readonly T[],
): { round: number; entries: T[] }[] {
  const groups: { round: number; entries: T[] }[] = []
  for (const entry of entries) {
    const last = groups[groups.length - 1]
    if (last && last.round === entry.round) {
      last.entries.push(entry)
    } else {
      groups.push({ round: entry.round, entries: [entry] })
    }
  }
  return groups
}
