import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from 'react'
import { computeTeamSizes, initials, randomInt, shuffle, TEAM_COLORS, uid } from '../lib/game'
import type { DraftTeam } from '../types'
import { Confetti } from './Confetti'
import { Icon } from './Icon'
import { Wheel } from './Wheel'

type TeamBuilderProps = {
  onHome: () => void
}

type Phase = 'setup' | 'draft' | 'done'

const MAX_PLAYERS = 24
const MAX_TEAMS = 8

function createTeams(teamCount: number, playerCount: number): DraftTeam[] {
  return computeTeamSizes(playerCount, teamCount).map((target, index) => ({
    id: uid(),
    name: `Equipo ${index + 1}`,
    color: TEAM_COLORS[index % TEAM_COLORS.length],
    target,
    players: [],
  }))
}

export function TeamBuilder({ onHome }: TeamBuilderProps) {
  const [phase, setPhase] = useState<Phase>('setup')
  const [players, setPlayers] = useState<string[]>([])
  const [newPlayer, setNewPlayer] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [teamCount, setTeamCount] = useState(2)
  const [teams, setTeams] = useState<DraftTeam[]>([])
  const [remaining, setRemaining] = useState<string[]>([])
  const [currentTeam, setCurrentTeam] = useState(0)
  const [starter, setStarter] = useState<string | null>(null)
  const [starterDisplay, setStarterDisplay] = useState('')
  const [rollingStarter, setRollingStarter] = useState(false)
  const [confettiTrigger, setConfettiTrigger] = useState(0)

  const inputRef = useRef<HTMLInputElement>(null)
  const starterTimer = useRef<number | null>(null)

  useEffect(() => {
    const max = Math.min(MAX_TEAMS, Math.max(2, players.length))
    setTeamCount((current) => Math.min(current, max))
  }, [players.length])

  useEffect(() => {
    return () => {
      if (starterTimer.current) window.clearTimeout(starterTimer.current)
    }
  }, [])

  const maxTeamCount = Math.min(MAX_TEAMS, players.length)
  const canStart =
    players.length >= 2 && players.length >= teamCount && teamCount >= 2 && players.length <= MAX_PLAYERS
  const sizes = canStart ? computeTeamSizes(players.length, teamCount) : []
  const assigned = teams.reduce((sum, team) => sum + team.players.length, 0)

  const addPlayer = (event: FormEvent) => {
    event.preventDefault()
    const name = newPlayer.trim().replace(/\s+/g, ' ')
    if (!name) return
    if (players.length >= MAX_PLAYERS) {
      setError(`Puedes agregar hasta ${MAX_PLAYERS} jugadores.`)
      return
    }
    if (players.some((player) => player.toLowerCase() === name.toLowerCase())) {
      setError('Ese nombre ya está en la lista.')
      return
    }
    setPlayers((current) => [...current, name])
    setNewPlayer('')
    setError(null)
    inputRef.current?.focus()
  }

  const removePlayer = (index: number) => {
    setPlayers((current) => current.filter((_, playerIndex) => playerIndex !== index))
    setError(null)
  }

  const clearStarterTimer = () => {
    if (starterTimer.current) {
      window.clearTimeout(starterTimer.current)
      starterTimer.current = null
    }
  }

  const startDraft = () => {
    if (!canStart) return
    clearStarterTimer()
    setTeams(createTeams(teamCount, players.length))
    setRemaining(shuffle(players))
    setCurrentTeam(0)
    setStarter(null)
    setStarterDisplay('')
    setRollingStarter(false)
    setPhase('draft')
  }

  const handleWheelResult = (player: string) => {
    const team = teams[currentTeam]
    if (!team) return

    const nextTeams = teams.map((item, index) =>
      index === currentTeam ? { ...item, players: [...item.players, player] } : item,
    )
    const nextRemaining = remaining.filter((name) => name !== player)
    const filled = team.players.length + 1
    const nextIndex = currentTeam + 1

    if (filled >= team.target) {
      if (nextIndex >= teams.length) {
        setTeams(nextTeams)
        setRemaining(nextRemaining)
        setPhase('done')
        return
      }

      if (nextIndex === teams.length - 1) {
        nextTeams[nextIndex] = {
          ...nextTeams[nextIndex],
          players: [...nextRemaining],
        }
        setTeams(nextTeams)
        setRemaining([])
        setCurrentTeam(nextIndex)
        setStarter(null)
        setStarterDisplay('')
        setPhase('done')
        setConfettiTrigger((value) => value + 1)
        return
      }

      setTeams(nextTeams)
      setRemaining(nextRemaining)
      setCurrentTeam(nextIndex)
      return
    }

    setTeams(nextTeams)
    setRemaining(nextRemaining)
  }

  const startStarterRaffle = () => {
    if (rollingStarter) return
    const allPlayers = teams.flatMap((team) => team.players)
    if (allPlayers.length === 0) return

    clearStarterTimer()
    const winner = allPlayers[randomInt(allPlayers.length)]
    const startedAt = performance.now()
    let index = randomInt(allPlayers.length)

    setRollingStarter(true)
    setStarter(null)

    const tick = () => {
      index = (index + 1) % allPlayers.length
      setStarterDisplay(allPlayers[index])
      const elapsed = performance.now() - startedAt

      if (elapsed >= 2600) {
        setStarterDisplay(winner)
        setStarter(winner)
        setRollingStarter(false)
        setConfettiTrigger((value) => value + 1)
        return
      }

      const delay = 55 + Math.pow(elapsed / 2600, 3) * 260
      starterTimer.current = window.setTimeout(tick, delay)
    }

    tick()
  }

  const restartDraft = () => {
    clearStarterTimer()
    setTeams(createTeams(teamCount, players.length))
    setRemaining(shuffle(players))
    setCurrentTeam(0)
    setStarter(null)
    setStarterDisplay('')
    setRollingStarter(false)
    setConfettiTrigger(0)
    setPhase('draft')
  }

  const goSetup = () => {
    clearStarterTimer()
    setRollingStarter(false)
    setStarter(null)
    setStarterDisplay('')
    setPhase('setup')
  }

  const handleBack = () => {
    if (phase === 'setup') onHome()
    else goSetup()
  }

  const currentTeamData = teams[currentTeam]

  return (
    <main className="screen team-screen">
      <header className="topbar">
        <button
          type="button"
          className="icon-btn"
          onClick={handleBack}
          aria-label={phase === 'setup' ? 'Volver al inicio' : 'Volver a la configuración'}
        >
          <Icon name="arrow-left" size={20} />
        </button>
        <div className="topbar__titles">
          <span className="topbar__eyebrow">Mesa</span>
          <h1>{phase === 'setup' ? 'Equipos' : phase === 'draft' ? 'Sorteo' : 'Equipos listos'}</h1>
        </div>
        <span className="topbar__aside">
          {phase === 'setup'
            ? `${players.length}/${MAX_PLAYERS}`
            : phase === 'draft'
              ? `${assigned}/${players.length}`
              : `${teams.length} equipos`}
        </span>
      </header>

      {phase === 'setup' ? (
        <section className="team-setup">
          <div className="screen-intro">
            <p className="eyebrow">
              <span className="eyebrow__line" />
              Sorteo de equipos
            </p>
            <h2>Arma la mesa.</h2>
            <p>
              Agrega a los jugadores, elige cuántos equipos quieres y deja que la ruleta haga el
              resto.
            </p>
          </div>

          <div className="setup-grid">
            <section className="panel players-panel">
              <div className="panel__head">
                <div>
                  <p className="eyebrow">Paso 1</p>
                  <h3>Jugadores</h3>
                </div>
                <span className="counter">
                  {players.length}
                  <span>/{MAX_PLAYERS}</span>
                </span>
              </div>

              <form className="add-player" onSubmit={addPlayer}>
                <input
                  ref={inputRef}
                  className="input"
                  value={newPlayer}
                  onChange={(event) => {
                    setNewPlayer(event.target.value)
                    if (error) setError(null)
                  }}
                  maxLength={22}
                  placeholder="Nombre del jugador"
                  aria-label="Nombre del jugador"
                  autoComplete="off"
                  enterKeyHint="done"
                />
                <button
                  type="submit"
                  className="btn btn--primary"
                  disabled={!newPlayer.trim() || players.length >= MAX_PLAYERS}
                >
                  <Icon name="plus" size={18} />
                  Agregar
                </button>
              </form>

              {error ? (
                <p className="form-error" role="alert">
                  {error}
                </p>
              ) : null}

              <div className="player-list">
                {players.length === 0 ? (
                  <div className="empty-state">
                    <span className="empty-state__icon">
                      <Icon name="users" size={26} />
                    </span>
                    <p>Agrega al menos 2 jugadores para empezar el sorteo.</p>
                  </div>
                ) : (
                  players.map((player, index) => (
                    <div className="player-row" key={player}>
                      <span
                        className="avatar"
                        style={{
                          background: TEAM_COLORS[index % TEAM_COLORS.length],
                        }}
                      >
                        {initials(player)}
                      </span>
                      <span className="player-row__name">{player}</span>
                      <button
                        type="button"
                        className="icon-btn icon-btn--sm"
                        onClick={() => removePlayer(index)}
                        aria-label={`Quitar a ${player}`}
                      >
                        <Icon name="trash" size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="panel config-panel">
              <div className="panel__head">
                <div>
                  <p className="eyebrow">Paso 2</p>
                  <h3>¿Cuántos equipos?</h3>
                </div>
              </div>

              <div className="team-stepper">
                <button
                  type="button"
                  className="stepper-btn"
                  onClick={() => setTeamCount((current) => Math.max(2, current - 1))}
                  disabled={teamCount <= 2}
                  aria-label="Quitar un equipo"
                >
                  <Icon name="minus" size={22} />
                </button>
                <div className="team-stepper__value">
                  <strong>{teamCount}</strong>
                  <span>{teamCount === 1 ? 'equipo' : 'equipos'}</span>
                </div>
                <button
                  type="button"
                  className="stepper-btn"
                  onClick={() => setTeamCount((current) => Math.min(maxTeamCount, current + 1))}
                  disabled={teamCount >= maxTeamCount}
                  aria-label="Agregar un equipo"
                >
                  <Icon name="plus" size={22} />
                </button>
              </div>

              <div className="distribution">
                <p className="distribution__label">Reparto estimado</p>
                {canStart ? (
                  sizes.map((size, index) => (
                    <div className="distribution__row" key={`size-${index}`}>
                      <span
                        className="dot"
                        style={{ background: TEAM_COLORS[index % TEAM_COLORS.length] }}
                      />
                      <span>Equipo {index + 1}</span>
                      <span className="distribution__size">
                        {size} {size === 1 ? 'jugador' : 'jugadores'}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="hint">
                    {players.length < 2
                      ? 'Necesitas al menos 2 jugadores.'
                      : `Necesitas al menos ${teamCount} jugadores para formar ${teamCount} equipos.`}
                  </p>
                )}
              </div>

              <p className="hint hint--accent">
                <Icon name="sparkles" size={17} />
                La ruleta llena los primeros equipos. El último se completa automáticamente con los
                jugadores que sobren.
              </p>

              <button
                type="button"
                className="btn btn--primary btn--xl"
                onClick={startDraft}
                disabled={!canStart}
              >
                <Icon name="shuffle" size={20} />
                Comenzar sorteo
              </button>
            </section>
          </div>
        </section>
      ) : null}

      {phase === 'draft' && currentTeamData ? (
        <section className="draft">
          <div className="draft__intro">
            <p className="eyebrow">
              Paso {currentTeam + 1} de {teams.length}
            </p>
            <h2>
              Gira para el{' '}
              <span style={{ color: currentTeamData.color }}>{currentTeamData.name}</span>
            </h2>
            <p>El nombre que salga se suma a este equipo. Sigue hasta completarlo.</p>
          </div>

          <div className="draft__grid">
            <section className="panel wheel-panel">
              <div className="turn-chip" style={{ '--team': currentTeamData.color } as CSSProperties}>
                <span className="dot" style={{ background: currentTeamData.color }} />
                <span>{currentTeamData.name}</span>
                <span className="turn-chip__count">
                  {currentTeamData.players.length}/{currentTeamData.target}
                </span>
              </div>
              <Wheel
                players={remaining}
                teamName={currentTeamData.name}
                teamColor={currentTeamData.color}
                onResult={handleWheelResult}
              />
              <p className="wheel-note">El último equipo se completa solo, sin girar la ruleta.</p>
            </section>

            <aside className="draft__side">
              <section className="panel current-team-panel">
                <div className="panel__head">
                  <div>
                    <p className="eyebrow">Ya están en el equipo</p>
                    <h3>{currentTeamData.name}</h3>
                  </div>
                  <span className="counter">
                    {currentTeamData.players.length}
                    <span>/{currentTeamData.target}</span>
                  </span>
                </div>
                <div className="progress">
                  <span
                    style={{
                      width: `${Math.min(
                        100,
                        (currentTeamData.players.length / currentTeamData.target) * 100,
                      )}%`,
                      background: currentTeamData.color,
                    }}
                  />
                </div>
                <div className="roster-chips">
                  {currentTeamData.players.length === 0 ? (
                    <p className="hint">Todavía no hay jugadores en este equipo.</p>
                  ) : (
                    currentTeamData.players.map((player) => (
                      <span className="roster-chip" key={player}>
                        <span className="avatar avatar--xs">{initials(player)}</span>
                        {player}
                      </span>
                    ))
                  )}
                </div>
              </section>

              <section className="panel progress-panel">
                <div className="panel__head">
                  <div>
                    <p className="eyebrow">Reparto</p>
                    <h3>
                      {assigned} de {players.length} jugadores
                    </h3>
                  </div>
                </div>
                <div className="team-progress-list">
                  {teams.map((team, index) => {
                    const isComplete = team.players.length >= team.target
                    const isCurrent = index === currentTeam
                    const isAutomatic = index === teams.length - 1
                    return (
                      <div
                        className={`team-progress ${isCurrent ? 'is-current' : ''} ${
                          isComplete ? 'is-complete' : ''
                        }`}
                        key={team.id}
                      >
                        <span className="dot" style={{ background: team.color }} />
                        <span className="team-progress__name">{team.name}</span>
                        {isAutomatic && !isComplete ? (
                          <span className="mini-tag">automático</span>
                        ) : (
                          <span className="team-progress__count">
                            {team.players.length}/{team.target}
                          </span>
                        )}
                        {isComplete ? <Icon name="check" size={15} /> : null}
                      </div>
                    )
                  })}
                </div>
              </section>
            </aside>
          </div>
        </section>
      ) : null}

      {phase === 'done' ? (
        <section className="result">
          <Confetti trigger={confettiTrigger} />
          <div className="result__head">
            <p className="eyebrow">
              <Icon name="sparkles" size={16} />
              Sorteo completo
            </p>
            <h2>¡Equipos listos!</h2>
            <p>
              El último equipo se completó con los jugadores que sobraron. Ahora elige quién da el
              primer turno.
            </p>
          </div>

          <div className="result-grid">
            {teams.map((team, index) => (
              <article
                className="result-team"
                key={team.id}
                style={{ '--team': team.color } as CSSProperties}
              >
                <header className="result-team__head">
                  <span className="result-team__index">{String(index + 1).padStart(2, '0')}</span>
                  <h3>{team.name}</h3>
                  <span className="result-team__count">
                    {team.players.length} {team.players.length === 1 ? 'jugador' : 'jugadores'}
                  </span>
                </header>
                <ul className="result-team__players">
                  {team.players.map((player) => (
                    <li key={player}>
                      <span className="avatar avatar--sm">{initials(player)}</span>
                      <span>{player}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>

          <section className={`starter-panel ${starter ? 'has-starter' : ''}`}>
            <div className="starter-panel__copy">
              <p className="eyebrow">
                <Icon name="crown" size={16} />
                Sale primero
              </p>
              <h3 className={rollingStarter ? 'is-rolling' : ''}>
                {rollingStarter ? starterDisplay : (starter ?? '¿Quién empieza?')}
              </h3>
              <p>
                {rollingStarter
                  ? 'Mezclando todos los nombres…'
                  : starter
                    ? 'Que la suerte esté de su lado.'
                    : 'Un sorteo rápido entre todos los jugadores de la mesa.'}
              </p>
            </div>
            <button
              type="button"
              className="btn btn--primary"
              onClick={startStarterRaffle}
              disabled={rollingStarter}
            >
              {rollingStarter ? (
                <>
                  <span className="spinner" aria-hidden="true" />
                  Sorteando…
                </>
              ) : (
                <>
                  <Icon name="dice" size={20} />
                  {starter ? 'Sortear de nuevo' : 'Sortear jugador'}
                </>
              )}
            </button>
            <span className="sr-only" aria-live="polite">
              {!rollingStarter && starter ? `Empieza ${starter}` : ''}
            </span>
          </section>

          <div className="result__actions">
            <button type="button" className="btn btn--outline" onClick={restartDraft}>
              <Icon name="refresh" size={18} />
              Volver a sortear
            </button>
            <button type="button" className="btn btn--ghost" onClick={goSetup}>
              Cambiar jugadores
            </button>
          </div>
        </section>
      ) : null}
    </main>
  )
}
