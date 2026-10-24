import { useEffect, useRef } from 'react'

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  rotation: number
  rotationSpeed: number
  shape: 'rect' | 'circle'
  drag: number
}

const COLORS = ['#c8ff4d', '#6ee7ff', '#c4b5fd', '#ffab8f', '#ffe08a', '#86efac', '#f9a8d4']

type ConfettiProps = {
  /** Cada cambio con valor mayor a cero lanza una nueva explosión. */
  trigger: number
}

export function Confetti({ trigger }: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!trigger) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    if (!context) return

    const width = window.innerWidth
    const height = window.innerHeight
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = Math.floor(width * dpr)
    canvas.height = Math.floor(height * dpr)
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    context.setTransform(dpr, 0, 0, dpr, 0, 0)
    context.clearRect(0, 0, width, height)

    const particles: Particle[] = []
    const makeParticle = (x: number, y: number, vx: number, vy: number): Particle => ({
      x,
      y,
      vx,
      vy,
      size: 5 + Math.random() * 9,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 12,
      shape: Math.random() > 0.35 ? 'rect' : 'circle',
      drag: 0.55 + Math.random() * 0.35,
    })

    for (let i = 0; i < 90; i += 1) {
      const fromLeft = i % 2 === 0
      particles.push(
        makeParticle(
          fromLeft ? -10 : width + 10,
          height * (0.72 + Math.random() * 0.2),
          (fromLeft ? 1 : -1) * (280 + Math.random() * 620),
          -(620 + Math.random() * 620),
        ),
      )
    }

    for (let i = 0; i < 80; i += 1) {
      particles.push(
        makeParticle(
          Math.random() * width,
          -20 - Math.random() * height * 0.25,
          (Math.random() - 0.5) * 180,
          80 + Math.random() * 220,
        ),
      )
    }

    let animationFrame = 0
    let previous = performance.now()

    const draw = (now: number) => {
      const delta = Math.min((now - previous) / 1000, 0.035)
      previous = now
      context.clearRect(0, 0, width, height)

      for (const particle of particles) {
        particle.vy += 920 * delta
        particle.vx -= particle.vx * particle.drag * delta
        particle.x += particle.vx * delta
        particle.y += particle.vy * delta
        particle.rotation += particle.rotationSpeed * delta

        context.save()
        context.translate(particle.x, particle.y)
        context.rotate(particle.rotation)
        context.fillStyle = particle.color
        if (particle.shape === 'rect') {
          context.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size * 0.6)
        } else {
          context.beginPath()
          context.arc(0, 0, particle.size / 2.6, 0, Math.PI * 2)
          context.fill()
        }
        context.restore()
      }

      const stillVisible = particles.some(
        (particle) => particle.y < height + 60 && particle.x > -80 && particle.x < width + 80,
      )

      if (stillVisible) {
        animationFrame = window.requestAnimationFrame(draw)
      } else {
        context.clearRect(0, 0, width, height)
      }
    }

    animationFrame = window.requestAnimationFrame(draw)
    return () => window.cancelAnimationFrame(animationFrame)
  }, [trigger])

  return <canvas ref={canvasRef} className="confetti-canvas" aria-hidden="true" />
}
