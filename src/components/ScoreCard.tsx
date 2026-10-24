import { useEffect, useRef, type CSSProperties, type FormEvent } from 'react'
import { groupScoresByRound } from '../lib/game'
import type { ScoreTeam } from '../types'
import { Icon } from './Icon'

type ScoreCardProps = {
  team: ScoreTeam
  round: number
  target: number | null
  inputValue: string
  flash: { amount: number; id: number } | null
  onInputChange: (value: string) => void
  onAdd: (amount: number) => void
}

export function ScoreCard({
  team,
  round,
  target,
  inputValue,
  flash,
  onInputChange,
  onAdd,
}: ScoreCardProps) {
  const historyRef = useRef<HTMLDivElement>(null)
  const amount = Number(inputValue)
  const isValid = Number.isInteger(amount) && amount > 0
  const roundTotal = team.entries
    .filter((entry) => entry.round === round)
    .reduce((sum, entry) => sum + entry.amount, 0)
  const targetReached = target !== null && team.total >= target
  const progress = target ? Math.min(100, (team.total / target) * 100) : 0

  const groups = groupScoresByRound(team.entries)
  if (!groups.some((group) => group.round === round)) {
    groups.push({ round, entries: [] })
  }

  useEffect(() => {
    const element = historyRef.current
    if (element) element.scrollTop = element.scrollHeight
  }, [team.entries.length, round])

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!isValid) return
    onAdd(amount)
  }

  return (
    <article
      className={`score-card ${targetReached ? 'is-winner' : ''}`}
      style={{ '--team': team.color } as CSSProperties}
    >
      <div className="score-card__accent" aria-hidden="true" />

      <header className="score-card__head">
        <span className="dot" style={{ background: team.color }} />
        <h2>{team.name}</h2>
        {targetReached ? (
          <span className="winner-chip">
            <Icon name="trophy" size={13} />
            Meta
          </span>
        ) : null}
      </header>

      <div className="score-card__score">
        <span className="score-card__total" key={team.total}>
          {team.total}
        </span>
        <span className="score-card__unit">pts</span>
        {flash ? (
          <span className="score-float" key={flash.id} aria-hidden="true">
            +{flash.amount}
          </span>
        ) : null}
      </div>

      <div className="score-card__meta">
        <span className="round-add">
          Ronda {round}: <strong>+{roundTotal}</strong>
        </span>
        <span>{target !== null ? `Meta ${target}` : 'Sin límite'}</span>
      </div>

      {target !== null ? (
        <div className="score-progress" aria-hidden="true">
          <span style={{ width: `${progress}%` }} />
        </div>
      ) : null}

      <form className="points-form" onSubmit={submit}>
        <input
          className="input points-input"
          inputMode="numeric"
          pattern="[0-9]*"
          value={inputValue}
          onChange={(event) => onInputChange(event.target.value)}
          placeholder="Puntos"
          aria-label={`Puntos para ${team.name}`}
          maxLength={5}
          autoComplete="off"
        />
        <button type="submit" className="btn btn--team" disabled={!isValid}>
          <Icon name="plus" size={18} />
          Sumar
        </button>
      </form>

      <div className="score-history" ref={historyRef}>
        {groups.map((group, index) => {
          const groupTotal = group.entries.reduce((sum, entry) => sum + entry.amount, 0)
          const isCurrent = group.round === round
          return (
            <div
              className={`history-round ${index > 0 ? 'history-round--divided' : ''}`}
              key={`round-${group.round}`}
            >
              <div className="history-round__head">
                <span>
                  Ronda {group.round}
                  {isCurrent ? <em>en curso</em> : null}
                </span>
                <span>{groupTotal > 0 ? `+${groupTotal}` : '—'}</span>
              </div>
              <div className="history-round__chips">
                {group.entries.length === 0 ? (
                  <span className="history-round__empty">Aún sin puntos</span>
                ) : (
                  group.entries.map((entry) => (
                    <span className="score-chip" key={entry.id}>
                      +{entry.amount}
                    </span>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>

      <span className="sr-only" aria-live="polite">
        {team.name}: {team.total} puntos en total
      </span>
    </article>
  )
}
