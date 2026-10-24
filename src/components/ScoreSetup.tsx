import { useState } from 'react'
import { TEAM_COLORS } from '../lib/game'
import { Icon } from './Icon'

type ScoreSetupProps = {
  initialNames: string[]
  initialMaxScore: number | null
  onStart: (names: string[], maxScore: number | null) => void
  onHome: () => void
}

const MAX_TEAMS = 8

function nextTeamName(names: string[]): string {
  for (let index = 1; index <= MAX_TEAMS + 1; index += 1) {
    const candidate = `Equipo ${index}`
    if (!names.some((name) => name.trim().toLowerCase() === candidate.toLowerCase())) {
      return candidate
    }
  }
  return `Equipo ${names.length + 1}`
}

export function ScoreSetup({ initialNames, initialMaxScore, onStart, onHome }: ScoreSetupProps) {
  const [names, setNames] = useState<string[]>(() => {
    if (initialNames.length >= 2) return initialNames
    return [...initialNames, 'Equipo 1', 'Equipo 2'].slice(0, 2)
  })
  const [maxScore, setMaxScore] = useState(initialMaxScore ? String(initialMaxScore) : '')
  const [error, setError] = useState<string | null>(null)

  const updateName = (index: number, value: string) => {
    setNames((current) => current.map((name, nameIndex) => (nameIndex === index ? value : name)))
    setError(null)
  }

  const addTeam = () => {
    if (names.length >= MAX_TEAMS) return
    setNames((current) => [...current, nextTeamName(current)])
    setError(null)
  }

  const removeTeam = (index: number) => {
    if (names.length <= 2) return
    setNames((current) => current.filter((_, nameIndex) => nameIndex !== index))
    setError(null)
  }

  const start = () => {
    const cleanNames = names.map((name) => name.trim().replace(/\s+/g, ' '))
    if (cleanNames.some((name) => !name)) {
      setError('Ponle un nombre a todos los equipos.')
      return
    }
    const lowerNames = cleanNames.map((name) => name.toLowerCase())
    if (new Set(lowerNames).size !== lowerNames.length) {
      setError('Los nombres de los equipos no pueden repetirse.')
      return
    }
    if (maxScore.trim() && Number(maxScore) <= 0) {
      setError('El puntaje para ganar debe ser mayor a 0.')
      return
    }
    onStart(cleanNames, maxScore.trim() ? Number(maxScore) : null)
  }

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
        <span className="topbar__aside">Configuración</span>
      </header>

      <section className="score-setup">
        <div className="screen-intro">
          <p className="eyebrow">
            <span className="eyebrow__line" />
            Nuevo anotador
          </p>
          <h2>Prepara la mesa.</h2>
          <p>
            Pon los nombres de los equipos, define la meta si quieres y empieza a sumar. Los puntos
            se guardan solos en este dispositivo.
          </p>
        </div>

        <div className="setup-grid score-setup__grid">
          <section className="panel teams-setup-panel">
            <div className="panel__head">
              <div>
                <p className="eyebrow">Paso 1</p>
                <h3>Equipos</h3>
              </div>
              <span className="counter">
                {names.length}
                <span>/{MAX_TEAMS}</span>
              </span>
            </div>

            <div className="team-name-list">
              {names.map((name, index) => (
                <div className="team-name-row" key={`team-name-${index}`}>
                  <span
                    className="team-swatch"
                    style={{ background: TEAM_COLORS[index % TEAM_COLORS.length] }}
                  />
                  <input
                    className="input"
                    value={name}
                    onChange={(event) => updateName(index, event.target.value)}
                    maxLength={22}
                    placeholder={`Equipo ${index + 1}`}
                    aria-label={`Nombre del equipo ${index + 1}`}
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    className="icon-btn icon-btn--sm"
                    onClick={() => removeTeam(index)}
                    disabled={names.length <= 2}
                    aria-label={`Quitar el equipo ${index + 1}`}
                  >
                    <Icon name="trash" size={16} />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="btn btn--ghost add-team-btn"
              onClick={addTeam}
              disabled={names.length >= MAX_TEAMS}
            >
              <Icon name="plus" size={18} />
              Agregar equipo
            </button>
          </section>

          <section className="panel target-panel">
            <div className="panel__head">
              <div>
                <p className="eyebrow">Paso 2</p>
                <h3>Puntaje para ganar</h3>
              </div>
              <span className="mini-tag">Opcional</span>
            </div>

            <label className="field">
              <span className="field__label">Meta de puntos</span>
              <div className="target-input">
                <Icon name="target" size={20} />
                <input
                  className="input"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={maxScore}
                  onChange={(event) => {
                    setMaxScore(event.target.value.replace(/\D/g, '').slice(0, 6))
                    setError(null)
                  }}
                  placeholder="Sin límite"
                  aria-label="Puntaje para ganar"
                />
                <span className="target-input__suffix">pts</span>
              </div>
            </label>

            <p className="hint">
              Cuando un equipo llegue a esta cifra, aparece el festejo de ganador. Si lo dejas
              vacío, la partida no tiene límite.
            </p>

            <div className="setup-summary">
              <div>
                <strong>{names.length}</strong>
                <span>equipos</span>
              </div>
              <div>
                <strong>{maxScore ? maxScore : '∞'}</strong>
                <span>{maxScore ? 'puntos para ganar' : 'sin límite'}</span>
              </div>
            </div>

            {error ? (
              <p className="form-error" role="alert">
                {error}
              </p>
            ) : null}

            <button type="button" className="btn btn--primary btn--xl" onClick={start}>
              <Icon name="score" size={20} />
              Empezar partida
            </button>
          </section>
        </div>
      </section>
    </main>
  )
}
