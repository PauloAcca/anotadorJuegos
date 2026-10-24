import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { deflateSync } from 'node:zlib'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = resolve(root, 'public/icons')
mkdirSync(outDir, { recursive: true })

const PALETTE = [
  [200, 255, 77],
  [110, 231, 255],
  [196, 181, 253],
  [255, 171, 143],
  [255, 224, 138],
]

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))
const mix = (a, b, t) => a + (b - a) * t

function roundedRectDistance(x, y, halfW, halfH, radius) {
  const qx = Math.abs(x) - (halfW - radius)
  const qy = Math.abs(y) - (halfH - radius)
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - radius
}

function inRoundedRect(x, y, halfW, halfH, radius) {
  return roundedRectDistance(x, y, halfW, halfH, radius) <= 0
}

// Puntos decorativos deterministas alrededor del dado.
const SPARKS = Array.from({ length: 26 }, (_, index) => {
  const angle = index * 2.399963
  const distance = 0.27 + ((index * 37) % 100) / 100 * 0.2
  return {
    x: 0.5 + Math.cos(angle) * distance,
    y: 0.5 + Math.sin(angle) * distance * 0.92,
    radius: 0.004 + ((index * 13) % 7) * 0.0011,
    color: PALETTE[index % PALETTE.length],
    alpha: 0.22 + ((index * 7) % 5) * 0.055,
  }
})

function sample(x, y, maskable) {
  // Fondo con gradiente y brillo central.
  const diagonal = clamp((x + y) / 2, 0, 1)
  let r = mix(23, 7, diagonal)
  let g = mix(28, 9, diagonal)
  let b = mix(48, 17, diagonal)

  const glowDistance = Math.hypot(x - 0.5, y - 0.44)
  const glow = Math.max(0, 1 - glowDistance / 0.62) ** 2
  r += glow * 26
  g += glow * 42
  b += glow * 12

  // Viñeta.
  const vignette = Math.max(0, Math.hypot(x - 0.5, y - 0.5) - 0.42)
  r -= vignette * 22
  g -= vignette * 22
  b -= vignette * 22

  for (const spark of SPARKS) {
    const sparkX = maskable ? 0.5 + (spark.x - 0.5) * 0.9 : spark.x
    const sparkY = maskable ? 0.5 + (spark.y - 0.5) * 0.9 : spark.y
    if (Math.hypot(x - sparkX, y - sparkY) < spark.radius) {
      r = mix(r, spark.color[0], spark.alpha)
      g = mix(g, spark.color[1], spark.alpha)
      b = mix(b, spark.color[2], spark.alpha)
    }
  }

  // Dado rotado -10 grados.
  const centerX = 0.5
  const centerY = 0.5
  const half = maskable ? 0.158 : 0.207
  const radius = half * 0.27
  const angle = (10 * Math.PI) / 180
  const dx = x - centerX
  const dy = y - centerY
  const localX = dx * Math.cos(angle) - dy * Math.sin(angle)
  const localY = dx * Math.sin(angle) + dy * Math.cos(angle)

  // Sombra del dado.
  const shadowLocalY = localY - 0.017
  if (inRoundedRect(localX, shadowLocalY, half, half, radius)) {
    r = mix(r, 0, 0.36)
    g = mix(g, 0, 0.36)
    b = mix(b, 0, 0.36)
  }

  if (inRoundedRect(localX, localY, half, half, radius)) {
    const dieShade = clamp((localX + localY + half * 2) / (half * 4), 0, 1)
    let dieR = mix(229, 168, dieShade)
    let dieG = mix(255, 230, dieShade)
    let dieB = mix(142, 47, dieShade)

    // Borde interior suave.
    const edge = roundedRectDistance(localX, localY, half, half, radius)
    if (edge > -0.006) {
      dieR *= 0.92
      dieG *= 0.94
      dieB *= 0.86
    }

    const pipRadius = half * 0.145
    const pipOffset = half * 0.42
    const pips = [
      [-pipOffset, -pipOffset],
      [pipOffset, -pipOffset],
      [0, 0],
      [-pipOffset, pipOffset],
      [pipOffset, pipOffset],
    ]
    let isPip = false
    for (const [pipX, pipY] of pips) {
      if (Math.hypot(localX - pipX, localY - pipY) < pipRadius) {
        isPip = true
        break
      }
    }

    if (isPip) {
      dieR = 10
      dieG = 13
      dieB = 21
    }

    r = dieR
    g = dieG
    b = dieB
  }

  return [clamp(r, 0, 255), clamp(g, 0, 255), clamp(b, 0, 255), 255]
}

function render(targetSize, maskable) {
  const supersample = 4
  const size = targetSize * supersample
  const buffer = Buffer.alloc(targetSize * targetSize * 4)

  for (let py = 0; py < targetSize; py += 1) {
    for (let px = 0; px < targetSize; px += 1) {
      let r = 0
      let g = 0
      let b = 0
      let a = 0
      for (let sy = 0; sy < supersample; sy += 1) {
        for (let sx = 0; sx < supersample; sx += 1) {
          const x = (px * supersample + sx + 0.5) / size
          const y = (py * supersample + sy + 0.5) / size
          const [sr, sg, sb, sa] = sample(x, y, maskable)
          r += sr
          g += sg
          b += sb
          a += sa
        }
      }
      const samples = supersample * supersample
      const offset = (py * targetSize + px) * 4
      buffer[offset] = Math.round(r / samples)
      buffer[offset + 1] = Math.round(g / samples)
      buffer[offset + 2] = Math.round(b / samples)
      buffer[offset + 3] = Math.round(a / samples)
    }
  }

  return buffer
}

const crcTable = new Uint32Array(256)
for (let n = 0; n < 256; n += 1) {
  let c = n
  for (let k = 0; k < 8; k += 1) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  }
  crcTable[n] = c >>> 0
}

function crc32(buffer) {
  let c = 0xffffffff
  for (let i = 0; i < buffer.length; i += 1) {
    c = crcTable[(c ^ buffer[i]) & 0xff] ^ (c >>> 8)
  }
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type, 'ascii')
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length, 0)
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0)
  return Buffer.concat([length, typeBuffer, data, crc])
}

function encodePng(size, rgba) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  const rowLength = size * 4
  const raw = Buffer.alloc((rowLength + 1) * size)
  for (let y = 0; y < size; y += 1) {
    raw[y * (rowLength + 1)] = 0
    rgba.copy(raw, y * (rowLength + 1) + 1, y * rowLength, (y + 1) * rowLength)
  }

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

function writeIcon(fileName, size, maskable = false) {
  const rgba = render(size, maskable)
  writeFileSync(resolve(outDir, fileName), encodePng(size, rgba))
  console.log(`✓ ${fileName} (${size}x${size})`)
}

writeIcon('icon-192.png', 192)
writeIcon('icon-512.png', 512)
writeIcon('icon-maskable-512.png', 512, true)
writeIcon('apple-touch-icon.png', 180)

console.log('Iconos generados en public/icons')
