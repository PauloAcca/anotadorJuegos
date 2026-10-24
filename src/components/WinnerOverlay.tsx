import { useEffect, useRef, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import type { ScoreTeam } from '../types'
import { Confetti } from './Confetti'
import { Icon } from './Icon'

type WinnerOverlayProps = {
  team: ScoreTeam
  maxScore: number
  onClose: () => void
  onNewGame: () => void
}

export function WinnerOverlay({ team, maxScore, onClose, onNewGame }: WinnerOverlayProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)
    dialogRef.current?.focus()

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  return createPortal(
    <div className="winner-overlay">
      <Confetti trigger={1} />
      <div className="winner-overlay__rays" aria-hidden="true" />
      <div
        className="winner-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="winner-title"
        tabIndex={-1}
        ref={dialogRef}
        style={{ '--team': team.color } as CSSProperties}
      >
        <span className="winner-card__trophy">
          <Icon name="trophy" size={52} />
        </span>
        <p className="eyebrow">
          <Icon name="sparkles" size={16} />
          ¡Tenemos ganador!
        </p>
        <h2 id="winner-title">{team.name}</h2>
        <p className="winner-card__total">
          {team.total}
          <span>puntos</span>
        </p>
        <p className="winner-card__copy">
          Llegó a la meta de {maxScore} puntos. ¡La mesa es suya!
        </p>
        <div className="winner-card__actions">
          <button type="button" className="btn btn--primary btn--xl" onClick={onClose}>
            Seguir jugando
          </button>
          <button type="button" className="btn btn--ghost" onClick={onNewGame}>
            Nueva partida
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
