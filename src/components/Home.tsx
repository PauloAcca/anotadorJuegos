import { useEffect, useState } from 'react'
import { Icon } from './Icon'
import { loadScoreGame } from '../lib/storage'
import type { Route, ScoreGame } from '../types'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

type HomeProps = {
  onNavigate: (route: Route) => void
}

export function Home({ onNavigate }: HomeProps) {
  const [game] = useState<ScoreGame | null>(() => loadScoreGame())
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(
    () => window.matchMedia('(display-mode: standalone)').matches,
  )

  useEffect(() => {
    const handlePrompt = (event: Event) => {
      event.preventDefault()
      setInstallPrompt(event as BeforeInstallPromptEvent)
    }
    const handleInstalled = () => {
      setInstalled(true)
      setInstallPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handlePrompt)
    window.addEventListener('appinstalled', handleInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', handlePrompt)
      window.removeEventListener('appinstalled', handleInstalled)
    }
  }, [])

  const install = async () => {
    if (!installPrompt) return
    await installPrompt.prompt()
    const choice = await installPrompt.userChoice
    if (choice.outcome === 'accepted') setInstallPrompt(null)
  }

  return (
    <main className="screen home">
      <header className="home__top">
        <div className="brand">
          <span className="brand__mark">
            <Icon name="dice" size={26} />
          </span>
          <span className="brand__name">Mesa</span>
        </div>
        <span className="home__tag">
          <span className="status-dot" />
          Juegos de mesa
        </span>
      </header>

      <section className="home__hero">
        <p className="eyebrow">
          <span className="eyebrow__line" />
          Noche de juegos
        </p>
        <h1>
          La mesa
          <br />
          <span>está servida.</span>
        </h1>
        <p className="home__lead">
          Arma equipos al azar y lleva los puntos sin discusiones. Todo desde tu teléfono, incluso
          sin conexión.
        </p>
      </section>

      <div className="home__actions">
        <button
          type="button"
          className="mode-card mode-card--teams"
          onClick={() => onNavigate('equipos')}
        >
          <span className="mode-card__glow" aria-hidden="true" />
          <span className="mode-card__top">
            <span className="mode-card__icon">
              <Icon name="users" size={30} />
            </span>
            <span className="mode-card__arrow">
              <Icon name="arrow-right" size={22} />
            </span>
          </span>
          <span className="mode-card__body">
            <span className="mode-card__kicker">Sorteo</span>
            <span className="mode-card__title">Equipos</span>
            <span className="mode-card__desc">
              Reparte jugadores con la ruleta y elige quién empieza.
            </span>
          </span>
        </button>

        <button
          type="button"
          className="mode-card mode-card--score"
          onClick={() => onNavigate('anotador')}
        >
          <span className="mode-card__glow" aria-hidden="true" />
          <span className="mode-card__top">
            <span className="mode-card__icon">
              <Icon name="score" size={30} />
            </span>
            <span className="mode-card__arrow">
              <Icon name="arrow-right" size={22} />
            </span>
          </span>
          <span className="mode-card__body">
            <span className="mode-card__kicker">
              {game ? (
                <span className="mode-card__badge">
                  <span className="status-dot status-dot--live" />
                  En curso · Ronda {game.round}
                </span>
              ) : (
                'Puntajes'
              )}
            </span>
            <span className="mode-card__title">Anotador</span>
            <span className="mode-card__desc">
              Suma puntos ronda a ronda y corona al ganador.
            </span>
          </span>
        </button>
      </div>

      <footer className="home__footer">
        <span className="offline-note">
          <Icon name="check" size={15} />
          Funciona sin conexión
        </span>
        {!installed && installPrompt ? (
          <button type="button" className="install-btn" onClick={install}>
            <Icon name="download" size={16} />
            Instalar app
          </button>
        ) : (
          <span className="home__hint">Tus datos se guardan en este dispositivo</span>
        )}
      </footer>
    </main>
  )
}
