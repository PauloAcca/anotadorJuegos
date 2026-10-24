import type { ScoreEntry, ScoreGame, ScoreTeam } from '../types'

const STORAGE_KEY = 'mesa.score.v1'

function normalizeEntry(value: unknown): ScoreEntry | null {
  if (!value || typeof value !== 'object') return null
  const entry = value as Record<string, unknown>
  const amount = Number(entry.amount)
  const round = Number(entry.round)
  if (!Number.isFinite(amount) || amount <= 0) return null
  if (!Number.isFinite(round) || round < 1) return null
  return {
    id: typeof entry.id === 'string' ? entry.id : `${round}-${amount}-${Math.random()}`,
    amount: Math.floor(amount),
    round: Math.floor(round),
  }
}

function normalizeTeam(value: unknown, index: number): ScoreTeam | null {
  if (!value || typeof value !== 'object') return null
  const team = value as Record<string, unknown>
  if (typeof team.name !== 'string' || !team.name.trim()) return null

  const entries = Array.isArray(team.entries)
    ? team.entries.map(normalizeEntry).filter((entry): entry is ScoreEntry => entry !== null)
    : []
  const total = entries.reduce((sum, entry) => sum + entry.amount, 0)

  return {
    id: typeof team.id === 'string' ? team.id : `team-${index}-${Math.random()}`,
    name: team.name.slice(0, 30),
    color: typeof team.color === 'string' ? team.color : '#c8ff4d',
    total,
    entries,
  }
}

export function loadScoreGame(): ScoreGame | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as unknown
    if (!data || typeof data !== 'object') return null

    const record = data as Record<string, unknown>
    if (!Array.isArray(record.teams)) return null

    const teams = record.teams
      .map(normalizeTeam)
      .filter((team): team is ScoreTeam => team !== null)

    if (teams.length < 2) return null

    const rawMax = Number(record.maxScore)
    const maxScore = Number.isFinite(rawMax) && rawMax > 0 ? Math.floor(rawMax) : null
    const roundValue = Number(record.round)
    const round = Number.isFinite(roundValue) && roundValue > 0 ? Math.floor(roundValue) : 1
    const celebratedTeamIds = Array.isArray(record.celebratedTeamIds)
      ? record.celebratedTeamIds.filter((id): id is string => typeof id === 'string')
      : []
    const startedAt = Number(record.startedAt)

    return {
      teams,
      round,
      maxScore,
      celebratedTeamIds,
      startedAt: Number.isFinite(startedAt) ? startedAt : Date.now(),
    }
  } catch {
    return null
  }
}

export function saveScoreGame(game: ScoreGame): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(game))
  } catch {
    // El almacenamiento puede estar lleno o deshabilitado: la app sigue funcionando en memoria.
  }
}

export function clearScoreGame(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Sin acción.
  }
}
