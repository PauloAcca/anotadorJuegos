export type DraftTeam = {
  id: string
  name: string
  color: string
  target: number
  players: string[]
}

export type ScoreEntry = {
  id: string
  amount: number
  round: number
}

export type ScoreTeam = {
  id: string
  name: string
  color: string
  total: number
  entries: ScoreEntry[]
}

export type ScoreGame = {
  teams: ScoreTeam[]
  round: number
  maxScore: number | null
  celebratedTeamIds: string[]
  startedAt: number
}

export type Route = 'home' | 'equipos' | 'anotador'
