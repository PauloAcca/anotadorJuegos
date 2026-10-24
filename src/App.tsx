import { useEffect, useState } from 'react'
import { Home } from './components/Home'
import { Scorekeeper } from './components/Scorekeeper'
import { TeamBuilder } from './components/TeamBuilder'
import type { Route } from './types'

function getRoute(): Route {
  const hash = window.location.hash.replace(/^#\/?/, '').replace(/\/+$/, '')
  if (hash === 'equipos' || hash === 'anotador') return hash
  return 'home'
}

const titles: Record<Route, string> = {
  home: 'Mesa — Puntajes y equipos',
  equipos: 'Equipos — Mesa',
  anotador: 'Anotador — Mesa',
}

export default function App() {
  const [route, setRoute] = useState<Route>(getRoute)

  useEffect(() => {
    const handleHashChange = () => setRoute(getRoute())
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  useEffect(() => {
    document.title = titles[route]
    window.scrollTo(0, 0)
  }, [route])

  const navigate = (nextRoute: Route) => {
    window.location.hash = nextRoute === 'home' ? '/' : `/${nextRoute}`
  }

  return (
    <div className="app">
      <div className="app__backdrop" aria-hidden="true" />
      {route === 'home' ? <Home onNavigate={navigate} /> : null}
      {route === 'equipos' ? <TeamBuilder onHome={() => navigate('home')} /> : null}
      {route === 'anotador' ? <Scorekeeper onHome={() => navigate('home')} /> : null}
    </div>
  )
}
