import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { randomInt, TEAM_COLORS } from '../lib/game'
import { Icon } from './Icon'

type WheelProps = {
  players: string[]
  teamName: string
  teamColor: string
  onResult: (player: string) => void
}

const SPIN_MS = 3800
const HOLD_MS = 1150
const CENTER = 200
const RADIUS = 180

function pointOnCircle(radius: number, angle: number): [number, number] {
  const radians = ((angle - 90) * Math.PI) / 180
  return [CENTER + radius * Math.cos(radians), CENTER + radius * Math.sin(radians)]
}

function wedgePath(startAngle: number, endAngle: number): string {
  const [startX, startY] = pointOnCircle(RADIUS, startAngle)
  const [endX, endY] = pointOnCircle(RADIUS, endAngle)
  const largeArc = endAngle - startAngle > 180 ? 1 : 0
  return `M ${CENTER} ${CENTER} L ${startX} ${startY} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${endX} ${endY} Z`
}

function shortName(name: string, maxLength: number): string {
  const clean = name.trim()
  return clean.length > maxLength ? `${clean.slice(0, maxLength - 1).trimEnd()}…` : clean
}

export function Wheel({ players, teamName, teamColor, onResult }: WheelProps) {
  const [rotation, setRotation] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [display, setDisplay] = useState('')

  const spinTimer = useRef<number | null>(null)
  const holdTimer = useRef<number | null>(null)
  const tickerTimer = useRef<number | null>(null)
  const onResultRef = useRef(onResult)

  useEffect(() => {
    onResultRef.current = onResult
  }, [onResult])

  useEffect(() => {
    return () => {
      if (spinTimer.current) window.clearTimeout(spinTimer.current)
      if (holdTimer.current) window.clearTimeout(holdTimer.current)
      if (tickerTimer.current) window.clearTimeout(tickerTimer.current)
    }
  }, [])

  const stopTicker = () => {
    if (tickerTimer.current) {
      window.clearTimeout(tickerTimer.current)
      tickerTimer.current = null
    }
  }

  const spin = () => {
    if (spinning || result || players.length === 0) return

    const pool = [...players]
    const winner = pool[randomInt(pool.length)]
    const count = pool.length
    const segment = 360 / count
    const winnerCenter = pool.indexOf(winner) * segment + segment / 2
    const jitter = (Math.random() - 0.5) * segment * 0.45
    const currentMod = ((rotation % 360) + 360) % 360
    const targetMod = (360 - winnerCenter + jitter + 720) % 360
    const delta = (targetMod - currentMod + 360) % 360
    const turns = 5 + randomInt(2)
    const nextRotation = rotation + turns * 360 + delta

    setSpinning(true)
    setResult(null)
    setDisplay(winner)
    setRotation(nextRotation)

    const tick = () => {
      setDisplay(pool[randomInt(pool.length)])
      tickerTimer.current = window.setTimeout(tick, 55 + Math.random() * 45)
    }
    tickerTimer.current = window.setTimeout(tick, 70)

    spinTimer.current = window.setTimeout(() => {
      stopTicker()
      setDisplay(winner)
      setSpinning(false)
      setResult(winner)

      holdTimer.current = window.setTimeout(() => {
        setResult(null)
        setRotation(0)
        setDisplay('')
        onResultRef.current(winner)
      }, HOLD_MS)
    }, SPIN_MS + 60)
  }

  const count = players.length
  const segment = count > 0 ? 360 / count : 360
  const maxChars = count <= 4 ? 18 : count <= 6 ? 13 : count <= 9 ? 10 : count <= 12 ? 8 : 6
  const fontSize = count <= 4 ? 17 : count <= 6 ? 15 : count <= 9 ? 13 : count <= 12 ? 11 : 9

  const style = {
    '--accent': teamColor,
  } as CSSProperties

  return (
    <div className="wheel" style={style}>
      <div className="wheel__stage">
        <div className="wheel__ring" aria-hidden="true" />
        <div className="wheel__pointer" aria-hidden="true" />
        <svg
          className="wheel__disc"
          viewBox="0 0 400 400"
          role="img"
          aria-label={count > 0 ? `Ruleta con ${count} jugadores` : 'Ruleta vacía'}
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: spinning ? `transform ${SPIN_MS}ms cubic-bezier(.1,.72,.05,1)` : 'none',
          }}
        >
          <circle cx={CENTER} cy={CENTER} r={196} fill="#0a0d15" stroke="rgba(255,255,255,.12)" />
          {count === 1 ? (
            <circle
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              fill={TEAM_COLORS[0]}
              stroke="#0a0d15"
              strokeWidth={2}
            />
          ) : (
            players.map((player, index) => {
              const start = index * segment
              const end = start + segment
              return (
                <path
                  key={player}
                  d={wedgePath(start, end)}
                  fill={TEAM_COLORS[index % TEAM_COLORS.length]}
                  stroke="#0a0d15"
                  strokeWidth={1.5}
                />
              )
            })
          )}
          {players.map((player, index) => {
            const middle = index * segment + segment / 2
            return (
              <text
                key={`label-${player}`}
                x={CENTER}
                y={CENTER - 145}
                transform={`rotate(${middle} ${CENTER} ${CENTER})`}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#0a0d15"
                fontSize={fontSize}
                fontWeight={700}
                letterSpacing="-0.01em"
              >
                {shortName(player, maxChars)}
              </text>
            )
          })}
          {Array.from({ length: 16 }, (_, index) => {
            const [dotX, dotY] = pointOnCircle(194, index * 22.5)
            return <circle key={`dot-${index}`} cx={dotX} cy={dotY} r={1.7} fill="rgba(255,255,255,.4)" />
          })}
        </svg>

        <div
          className={`wheel__hub ${spinning ? 'is-spinning' : ''} ${result ? 'has-result' : ''}`}
        >
          <span className="wheel__hub-kicker">
            {spinning ? 'Eligiendo' : result ? 'Salió' : 'Turno de'}
          </span>
          <strong className="wheel__hub-name">
            {spinning ? display : result ?? teamName}
          </strong>
          <span className="wheel__hub-meta">
            {spinning
              ? 'mezclando nombres'
              : result
                ? 'asignando…'
                : `${count} ${count === 1 ? 'jugador' : 'jugadores'}`}
          </span>
        </div>
      </div>

      <button
        type="button"
        className="btn btn--primary wheel__button"
        onClick={spin}
        disabled={spinning || Boolean(result) || count === 0}
      >
        {spinning ? (
          <>
            <span className="spinner" aria-hidden="true" />
            Girando…
          </>
        ) : result ? (
          <>
            <span className="spinner" aria-hidden="true" />
            Asignando…
          </>
        ) : (
          <>
            <Icon name="shuffle" size={20} />
            Girar la ruleta
          </>
        )}
      </button>
      <span className="sr-only" aria-live="polite">
        {result ? `Salió ${result}` : ''}
      </span>
    </div>
  )
}
