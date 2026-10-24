import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { TEAM_COLORS, uid } from '../lib/game'
import { clearScoreGame, loadScoreGame, saveScoreGame } from '../lib/storage'
import type { ScoreGame, ScoreTeam } from '../types'
import { Icon } from './Icon'
import { Modal } from './Modal'
import { ScoreCard } from './ScoreCard'
import { ScoreSetup } from './ScoreSetup'
import { WinnerOverlay } from './WinnerOverlay'

type ScorekeeperProps = {
  onHome: () => void
}

type FlashState = {
  teamId: string
  amount: number
  id: number
}

export function Scorekeeper({ onHome }: ScorekeeperProps) {
  const [initialGame] = useState<ScoreGame | null>(() => loadScoreGame())
  const [game, setGame] = useState<ScoreGame | null>(initialGame)
  const [setupMode, setSetupMode] = useState(initialGame === null)
  const [setupNames, setSetupNames] = useState<string[]>(() =>
    initialGame ? initialGame.teams.map((team) => team.name) : ['Equipo 1', 'Equipo 2'],
  )
  const [setupMax, setSetupMax] = useState<string>(() =>
    initialGame?.maxScore ? String(initialGame.maxScore) : '',
  )
  const [inputs, setInputs] = useState<Record<string, string>>({})
  const [flash, setFlash] = useState<FlashState | null>(null)
  const [modal, setModal] = useState<'settings' | 'reset' | null>(null)
  const [settingsMax, setSettingsMax] = useState('')
  const [settingsError, setSettingsError] = useState<string | null>(null)
  const [celebrationTeamId, setCelebrationTeamId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const toastTimer = useRef<number | null>(null)
  const flashTimer = useRef<number | null>(null)
  const flashId = useRef(0)

  useEffect(() => {
    if (game) saveScoreGame(game)
    else clearScoreGame()
  }, [game])

  useEffect(() => {
    return () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current)
      if (flashTimer.current) window.clearTimeout(flashTimer.current)
    }
  }, [])

  const showToast = (message: string) => {
    setToast(message)
    if (toastTimer.current) window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 2800)
  }

  const startGame = (names: string[], maxScore: number | null) => {
    const teams: ScoreTeam[] = names.map((name, index) => ({
      id: uid(),
      name,
      color: TEAM_COLORS[index % TEAM_COLORS.length],
      total: 0,
      entries: [],
    }))
    setGame({
      teams,
      round: 1,
      maxScore,
      celebratedTeamIds: [],
      startedAt: Date.now(),
    })
    setSetupMode(false)
    setInputs({})
    setFlash(null)
    setCelebrationTeamId(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const updateInput = (teamId: string, rawValue: string) => {
    const sanitized = rawValue.replace(/\D/g, '').slice(0, 5)
    setInputs((current) => ({ ...current, [teamId]: sanitized }))
  }

  const addPoints = (teamId: string, amount: number) => {
    if (!game || amount <= 0) return
    const target = game.teams.find((team) => team.id === teamId)
    if (!target) return

    const newTotal = target.total + amount
    const teams = game.teams.map((team) =>
      team.id === teamId
        ? {
            ...team,
            total: newTotal,
            entries: [...team.entries, { id: uid(), amount, round: game.round }],
          }
        : team,
    )
    const reached =
      game.maxScore !== null &&
      newTotal >= game.maxScore &&
      !game.celebratedTeamIds.includes(teamId)

    setGame({
      ...game,
      teams,
      celebratedTeamIds: reached
        ? [...game.celebratedTeamIds, teamId]
        : game.celebratedTeamIds,
    })
    setInputs((current) => ({ ...current, [teamId]: '' }))
    flashId.current += 1
    setFlash({ teamId, amount, id: flashId.current })
    if (flashTimer.current) window.clearTimeout(flashTimer.current)
    flashTimer.current = window.setTimeout(() => setFlash(null), 1100)

    if (reached) setCelebrationTeamId(teamId)
  }

  const closeRound = () => {
    if (!game) return
    const hasPoints = game.teams.some((team) =>
      team.entries.some((entry) => entry.round === game.round),
    )
    if (!hasPoints) {
      showToast('Agrega al menos un punto antes de cerrar la ronda.')
      return
    }
    const closedRound = game.round
    setGame({ ...game, round: closedRound + 1 })
    setInputs({})
    showToast(`Ronda ${closedRound} cerrada. Empieza la ronda ${closedRound + 1}.`)
  }

  const openSettings = () => {
    if (!game) return
    setSettingsMax(game.maxScore ? String(game.maxScore) : '')
    setSettingsError(null)
    setModal('settings')
  }

  const saveSettings = () => {
    if (!game) return
    const raw = settingsMax.trim()
    if (raw && Number(raw) <= 0) {
      setSettingsError('Ingresa un número mayor a 0.')
      return
    }
    const maxScore = raw ? Number(raw) : null
    const changed = maxScore !== game.maxScore
    let celebratedTeamIds = changed ? [] : [...game.celebratedTeamIds]
    let reached: ScoreTeam | undefined

    if (changed && maxScore !== null) {
      reached = [...game.teams].sort((a, b) => b.total - a.total).find((team) => team.total >= maxScore)
      if (reached) celebratedTeamIds = [...celebratedTeamIds, reached.id]
    }

    setGame({ ...game, maxScore, celebratedTeamIds })
    setModal(null)
    if (reached) setCelebrationTeamId(reached.id)
    showToast(maxScore ? `Meta de ${maxScore} puntos` : 'Partida sin límite de puntos')
  }

  const resetGame = () => {
    if (game) {
      setSetupNames(game.teams.map((team) => team.name))
      setSetupMax(game.maxScore ? String(game.maxScore) : '')
    }
    setGame(null)
    setSetupMode(true)
    setModal(null)
    setCelebrationTeamId(null)
    setInputs({})
    setFlash(null)
    setToast(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (setupMode || !game) {
    return (
      <>
        <ScoreSetup
          initialNames={setupNames}
          initialMaxScore={setupMax ? Number(setupMax) : null}
          onStart={startGame}
          onHome={onHome}
        />
        {toast ? (
          <div className="toast" role="status">
            {toast}
          </div>
        ) : null}
      </>
    )
  }

  const maxScore = game.maxScore
  const winner =
    maxScore !== null
      ? [...game.teams]
          .filter((team) => team.total >= maxScore)
          .sort((a, b) => b.total - a.total)[0] ?? null
      : null
  const celebrationTeam =
    celebrationTeamId && maxScore !== null
      ? game.teams.find((team) => team.id === celebrationTeamId)
      : undefined

  return (
    <main className="screen score-screen">
      <header className="topbar">
        <button type="button" className="icon-btn" onClick={onHome} aria-label="Volver al inicio">
          <Icon name="arrow-left" size={20} />
        </button>
        <div className="topbar__titles">
          <span className="topbar__eyebrow">Mesa</span>
          <h1>Anotador</h1>
        </div>
        <div className="topbar__actions">
          <span className="round-pill">
            <span className="status-dot status-dot--live" />
            Ronda {game.round}
          </span>
          <button
            type="button"
            className="icon-btn"
            onClick={openSettings}
            aria-label="Ajustes de la partida"
          >
            <Icon name="settings" size={20} />
          </button>
        </div>
      </header>

      <section className="scoreboard">
        <div className="score-toolbar">
          <div className="score-toolbar__info">
            <span className="target-chip">
              <Icon name="target" size={16} />
              {maxScore !== null ? `Meta ${maxScore} pts` : 'Sin límite'}
            </span>
            <span className="target-chip">
              <Icon name="users" size={16} />
              {game.teams.length} equipos
            </span>
          </div>
          <button type="button" className="btn btn--outline close-round-btn" onClick={closeRound}>
            <Icon name="flag" size={18} />
            Cerrar ronda
          </button>
        </div>

        {winner && !celebrationTeam ? (
          <div className="winner-banner" style={{ '--team': winner.color } as CSSProperties}>
            <span className="winner-banner__icon">
              <Icon name="trophy" size={22} />
            </span>
            <div className="winner-banner__text">
              <strong>{winner.name} llegó a la meta</strong>
              <span>{winner.total} puntos · ¡Tenemos ganador!</span>
            </div>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => setCelebrationTeamId(winner.id)}
            >
              Ver festejo
            </button>
          </div>
        ) : null}

        <div className="score-grid">
          {game.teams.map((team) => (
            <ScoreCard
              key={team.id}
              team={team}
              round={game.round}
              target={maxScore}
              inputValue={inputs[team.id] ?? ''}
              flash={flash?.teamId === team.id ? flash : null}
              onInputChange={(value) => updateInput(team.id, value)}
              onAdd={(amount) => addPoints(team.id, amount)}
            />
          ))}
        </div>

        <p className="score-footnote">
          <Icon name="sparkles" size={15} />
          Cerrar ronda no reinicia los puntos: solo agrega un separador en el historial. Los totales
          siguen sumando.
        </p>
      </section>

      {modal === 'settings' ? (
        <Modal title="Ajustes de la partida" onClose={() => setModal(null)}>
          <form
            className="settings-form"
            onSubmit={(event) => {
              event.preventDefault()
              saveSettings()
            }}
          >
            <label className="field">
              <span className="field__label">Puntaje para ganar</span>
              <div className="target-input">
                <Icon name="target" size={20} />
                <input
                  className="input"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={settingsMax}
                  onChange={(event) => {
                    setSettingsMax(event.target.value.replace(/\D/g, '').slice(0, 6))
                    setSettingsError(null)
                  }}
                  placeholder="Sin límite"
                  aria-label="Puntaje para ganar"
                  autoFocus
                />
                <span className="target-input__suffix">pts</span>
              </div>
            </label>
            <p className="hint">
              Deja el campo vacío para jugar sin límite. Si cambias la meta, se vuelve a evaluar qué
              equipo ganó.
            </p>
            {settingsError ? (
              <p className="form-error" role="alert">
                {settingsError}
              </p>
            ) : null}
            <button type="submit" className="btn btn--primary">
              Guardar cambios
            </button>
          </form>

          <div className="modal__divider" />

          <div className="modal__danger-row">
            <div>
              <strong>Nueva partida</strong>
              <p>Borra los puntos y el historial actual.</p>
            </div>
            <button type="button" className="btn btn--danger" onClick={() => setModal('reset')}>
              Nueva partida
            </button>
          </div>
        </Modal>
      ) : null}

      {modal === 'reset' ? (
        <Modal title="¿Empezar una nueva partida?" onClose={() => setModal(null)}>
          <p className="modal__text">
            Se van a borrar los puntos y el historial de esta partida. Los nombres de los equipos se
            mantienen para configurarlos de nuevo.
          </p>
          <div className="modal__actions">
            <button type="button" className="btn btn--ghost" onClick={() => setModal(null)}>
              Cancelar
            </button>
            <button type="button" className="btn btn--danger" onClick={resetGame}>
              Sí, nueva partida
            </button>
          </div>
        </Modal>
      ) : null}

      {celebrationTeam ? (
        <WinnerOverlay
          team={celebrationTeam}
          maxScore={maxScore ?? 0}
          onClose={() => setCelebrationTeamId(null)}
          onNewGame={() => {
            setCelebrationTeamId(null)
            setModal('reset')
          }}
        />
      ) : null}

      {toast ? (
        <div className="toast" role="status">
          {toast}
        </div>
      ) : null}
    </main>
  )
}
