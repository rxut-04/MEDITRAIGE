"use client"

import { useEffect, useRef } from "react"
import { cn } from "../../lib/utils"

export type ForestAsciiParams = {
  renderMode: string
  bgMode: "blur" | "solid" | "photo" | "none" | string
  bgBlur: number
  bgOpacity: number
  cellSize: number
  coverage: number
  invert: boolean
  styleBlend: GlobalCompositeOperation | string
  charSet: string
  customChars: string
  brightness: number
  contrast: number
  edgeEmphasis: number
  density: number
  toneCurve: { x: number; y: number }[]
  tint: string
  tintOpacity: number
  overlayBlend: GlobalCompositeOperation | string
  saturation: number
  grayscale: number
  blurType: string
  blurAmount: number
  blurAngle: number
  directionalBothSides: boolean
  tiltFocus: number
  tiltPosition: number
  tiltFeather: number
  lensFocus: number
  blurCenterX: number
  blurCenterY: number
  progressivePosition: number
  progressiveReverse: boolean
  pfx: Record<string, { enabled: boolean; intensity: number }>
  animated: boolean
  animStyle: string
  animSpeed: { enabled: boolean; intensity: number }
  animIntensity: { enabled: boolean; intensity: number }
  lights: {
    enabled: boolean
    points: Array<{ x: number; y: number; radius: number; intensity: number }>
  }
  mask: {
    enabled: boolean
    invert: boolean
    dataUrl: string | null
  }
}

/** Forest recipe defaults from 21st.dev ASCII editor. */
export const FOREST_PARAMS: ForestAsciiParams = {
  renderMode: "characters",
  bgMode: "blur",
  bgBlur: 2,
  bgOpacity: 90,
  cellSize: 10,
  coverage: 100,
  invert: false,
  styleBlend: "source-over",
  charSet: "standard",
  customChars: "",
  brightness: 0,
  contrast: 128,
  edgeEmphasis: 0,
  density: 0,
  toneCurve: [
    { x: 0, y: 0 },
    { x: 1, y: 1 },
  ],
  tint: "#3ca6ff",
  tintOpacity: 0,
  overlayBlend: "multiply",
  saturation: 0,
  grayscale: 100,
  blurType: "tilt",
  blurAmount: 30,
  blurAngle: 0,
  directionalBothSides: false,
  tiltFocus: 35,
  tiltPosition: 50,
  tiltFeather: 15,
  lensFocus: 40,
  blurCenterX: 50,
  blurCenterY: 50,
  progressivePosition: 55,
  progressiveReverse: false,
  pfx: {
    vignette: { enabled: false, intensity: 58 },
    scanLines: { enabled: false, intensity: 40 },
    chromatic: { enabled: true, intensity: 20 },
    bloom: { enabled: false, intensity: 25 },
    filmGrain: { enabled: false, intensity: 32 },
    glitch: { enabled: false, intensity: 20 },
    pixelate: { enabled: false, intensity: 15 },
    halftone: { enabled: true, intensity: 20 },
    filmDust: { enabled: true, intensity: 20 },
  },
  animated: true,
  animStyle: "shimmer",
  animSpeed: { enabled: true, intensity: 100 },
  animIntensity: { enabled: true, intensity: 60 },
  lights: { enabled: false, points: [] },
  mask: { enabled: false, invert: false, dataUrl: null },
}

const CHARSETS: Record<string, string> = {
  standard: " .'`^\",:;Il!i~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$",
  blocks: " ░▒▓█",
  binary: " 01",
  hex: " 0123456789ABCDEF",
  braille: " ⠁⠂⠃⠄⠅⠆⠇⠈⠉⠊⠋⠌⠍⠎⠏⠐⠑⠒⠓⠔⠕⠖⠗⠘⠙⠚⠛⠜⠝⠞⠟",
  matrix: " ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789",
}

const DEFAULT_SRC =
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=1600&auto=format&fit=crop"

/** Cap internal render width so full-screen heroes stay smooth. */
const MAX_RENDER_WIDTH = 960
const TARGET_FPS = 24

type Props = {
  className?: string
  src?: string
  params?: Partial<ForestAsciiParams>
}

type Cell = {
  x: number
  y: number
  cx: number
  cy: number
  r: number
  g: number
  b: number
  luma: number
  dens: number
  ch: string
  fontPx: number
}

function clamp(n: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, n))
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function applyToneCurve(luma: number, curve: { x: number; y: number }[]) {
  if (!curve?.length) return luma
  const pts = [...curve].sort((a, b) => a.x - b.x)
  if (luma <= pts[0].x) return pts[0].y
  if (luma >= pts[pts.length - 1].x) return pts[pts.length - 1].y
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i]
    const b = pts[i + 1]
    if (luma >= a.x && luma <= b.x) {
      const t = (luma - a.x) / Math.max(1e-6, b.x - a.x)
      return lerp(a.y, b.y, t)
    }
  }
  return luma
}

function parseHex(hex: string) {
  const h = hex.replace("#", "")
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h
  const n = parseInt(full.slice(0, 6), 16)
  return {
    r: (n >> 16) & 255,
    g: (n >> 8) & 255,
    b: n & 255,
  }
}

function hash2(x: number, y: number) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return s - Math.floor(s)
}

export function ForestAscii({
  className,
  src = DEFAULT_SRC,
  params: paramOverrides,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const params: ForestAsciiParams = { ...FOREST_PARAMS, ...paramOverrides }
    if (paramOverrides?.pfx) {
      params.pfx = { ...FOREST_PARAMS.pfx, ...paramOverrides.pfx }
    }

    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const ctx = canvas.getContext("2d", { alpha: false })
    if (!ctx) return

    // Working buffers at capped internal resolution
    const photo = document.createElement("canvas")
    const photoCtx = photo.getContext("2d", { willReadFrequently: true })!
    const bg = document.createElement("canvas")
    const bgCtx = bg.getContext("2d")!
    const glyphs = document.createElement("canvas")
    const glyphsCtx = glyphs.getContext("2d")!

    const img = new Image()
    img.crossOrigin = "anonymous"

    let ready = false
    let running = true
    let inView = true
    let raf = 0
    let lastFrame = 0
    let cssW = 0
    let cssH = 0
    let rw = 0
    let rh = 0
    let dpr = 1
    let scale = 1
    let cells: Cell[] = []
    let dustSeed = 0

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches

    const charset =
      params.customChars?.trim() ||
      CHARSETS[params.charSet] ||
      CHARSETS.standard

    // Prefer fewer, larger cells for full-bleed heroes
    const cell = Math.max(8, params.cellSize | 0)

    function sizeBuffers() {
      const rect = container!.getBoundingClientRect()
      cssW = Math.max(1, Math.floor(rect.width))
      cssH = Math.max(1, Math.floor(rect.height))
      dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      scale = Math.min(1, MAX_RENDER_WIDTH / cssW)
      rw = Math.max(1, Math.floor(cssW * scale))
      rh = Math.max(1, Math.floor(cssH * scale))

      canvas!.width = Math.floor(cssW * dpr)
      canvas!.height = Math.floor(cssH * dpr)
      canvas!.style.width = `${cssW}px`
      canvas!.style.height = `${cssH}px`
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)

      photo.width = rw
      photo.height = rh
      bg.width = rw
      bg.height = rh
      glyphs.width = rw
      glyphs.height = rh
    }

    function drawPhoto() {
      if (!img.naturalWidth || !rw || !rh) return
      const ir = img.naturalWidth / img.naturalHeight
      const cr = rw / rh
      let dw = rw
      let dh = rh
      let dx = 0
      let dy = 0
      if (ir > cr) {
        dh = rh
        dw = rh * ir
        dx = (rw - dw) / 2
      } else {
        dw = rw
        dh = rw / ir
        dy = (rh - dh) / 2
      }
      photoCtx.clearRect(0, 0, rw, rh)
      photoCtx.drawImage(img, dx, dy, dw, dh)
    }

    function sampleAt(data: ImageData, x: number, y: number, step: number) {
      const x0 = Math.max(0, x)
      const y0 = Math.max(0, y)
      const x1 = Math.min(data.width, x + step)
      const y1 = Math.min(data.height, y + step)
      let r = 0
      let g = 0
      let b = 0
      let n = 0
      // Stride harder for speed — cell average, not every pixel
      const stride = Math.max(2, Math.floor(step / 3))
      for (let py = y0; py < y1; py += stride) {
        for (let px = x0; px < x1; px += stride) {
          const i = (py * data.width + px) * 4
          r += data.data[i]
          g += data.data[i + 1]
          b += data.data[i + 2]
          n++
        }
      }
      if (!n) return { r: 0, g: 0, b: 0, luma: 0 }
      r /= n
      g /= n
      b /= n
      let luma = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
      if (params.invert) luma = 1 - luma
      luma = applyToneCurve(luma, params.toneCurve)

      const bright = params.brightness / 100
      const contrast = params.contrast / 128
      luma = clamp((luma - 0.5) * contrast + 0.5 + bright)

      const grayAmt = params.grayscale / 100
      const satAmt = params.saturation / 100
      const gray = luma * 255
      let rr = lerp(r, gray, grayAmt)
      let gg = lerp(g, gray, grayAmt)
      let bb = lerp(b, gray, grayAmt)
      const avg = (rr + gg + bb) / 3
      rr = lerp(avg, rr, 1 + satAmt)
      gg = lerp(avg, gg, 1 + satAmt)
      bb = lerp(avg, bb, 1 + satAmt)

      if (params.tintOpacity > 0) {
        const tint = parseHex(params.tint)
        const to = params.tintOpacity / 100
        rr = lerp(rr, tint.r, to)
        gg = lerp(gg, tint.g, to)
        bb = lerp(bb, tint.b, to)
      }

      return {
        r: clamp(rr, 0, 255),
        g: clamp(gg, 0, 255),
        b: clamp(bb, 0, 255),
        luma,
      }
    }

    function rebuildCells() {
      cells = []
      if (!rw || !rh) return
      const data = photoCtx.getImageData(0, 0, rw, rh)
      const coverage = params.coverage / 100
      const mode = params.renderMode

      for (let y = 0; y < rh; y += cell) {
        for (let x = 0; x < rw; x += cell) {
          if (coverage < 1 && hash2(x, y) > coverage) continue
          let sample = sampleAt(data, x, y, cell)
          if (params.edgeEmphasis > 0) {
            const right = sampleAt(data, x + cell, y, cell)
            const down = sampleAt(data, x, y + cell, cell)
            const edge =
              Math.abs(sample.luma - right.luma) +
              Math.abs(sample.luma - down.luma)
            sample = {
              ...sample,
              luma: clamp(sample.luma + edge * (params.edgeEmphasis / 100)),
            }
          }
          const dens = clamp(sample.luma + params.density / 100)
          let ch = ""
          if (mode === "characters" || mode === "hexdump" || mode === "braille" || mode === "matrix") {
            const set =
              mode === "hexdump"
                ? CHARSETS.hex
                : mode === "braille"
                  ? CHARSETS.braille
                  : mode === "matrix"
                    ? CHARSETS.matrix
                    : charset
            const idx = Math.floor(dens * (set.length - 1))
            ch = set[Math.max(0, Math.min(set.length - 1, idx))]
            if (ch === " ") continue
          }
          cells.push({
            x,
            y,
            cx: x + cell / 2,
            cy: y + cell / 2,
            r: sample.r | 0,
            g: sample.g | 0,
            b: sample.b | 0,
            luma: sample.luma,
            dens,
            ch,
            fontPx: Math.max(8, cell * (0.85 + dens * 0.35)),
          })
        }
      }
    }

    function bakeBackground() {
      bgCtx.clearRect(0, 0, rw, rh)
      const op = params.bgOpacity / 100
      if (params.bgMode === "none") {
        bgCtx.fillStyle = "#0a0a0a"
        bgCtx.fillRect(0, 0, rw, rh)
        return
      }
      if (params.bgMode === "solid") {
        bgCtx.fillStyle = "#0f1410"
        bgCtx.globalAlpha = op
        bgCtx.fillRect(0, 0, rw, rh)
        bgCtx.globalAlpha = 1
        return
      }
      bgCtx.save()
      if (params.bgMode === "blur" && params.bgBlur > 0) {
        bgCtx.filter = `blur(${Math.max(0, params.bgBlur)}px)`
      }
      bgCtx.globalAlpha = op
      bgCtx.drawImage(photo, 0, 0)
      bgCtx.restore()
      bgCtx.globalAlpha = 1
      bgCtx.fillStyle = "rgba(8,12,10,0.12)"
      bgCtx.fillRect(0, 0, rw, rh)

      // Bake vignette into background once
      if (params.pfx.vignette?.enabled) {
        const intensity = params.pfx.vignette.intensity / 100
        const g = bgCtx.createRadialGradient(
          rw / 2,
          rh / 2,
          Math.min(rw, rh) * 0.25,
          rw / 2,
          rh / 2,
          Math.max(rw, rh) * 0.75
        )
        g.addColorStop(0, "rgba(0,0,0,0)")
        g.addColorStop(1, `rgba(0,0,0,${0.75 * intensity})`)
        bgCtx.fillStyle = g
        bgCtx.fillRect(0, 0, rw, rh)
      }
    }

    function animFactors(cx: number, cy: number, t: number, luma: number) {
      if (!params.animated || reduced) return { alpha: 1, shift: 0, size: 1 }
      const speed =
        (params.animSpeed.enabled ? params.animSpeed.intensity : 0) / 100
      const intensity =
        (params.animIntensity.enabled ? params.animIntensity.intensity : 0) /
        100
      const nx = cx / Math.max(1, rw)
      const ny = cy / Math.max(1, rh)
      const phase = t * speed * 2.2

      switch (params.animStyle) {
        case "pulse": {
          const p = 0.5 + 0.5 * Math.sin(phase * Math.PI * 2)
          return {
            alpha: lerp(1 - intensity * 0.4, 1, p),
            shift: 0,
            size: lerp(1 - intensity * 0.15, 1 + intensity * 0.1, p),
          }
        }
        case "wave": {
          const wv = Math.sin((nx + ny) * 8 + phase * 6)
          return { alpha: 1, shift: wv * intensity * 4, size: 1 }
        }
        case "ripple": {
          const d = Math.hypot(nx - 0.5, ny - 0.5)
          const wv = Math.sin(d * 18 - phase * 8)
          return {
            alpha: 1,
            shift: wv * intensity * 3,
            size: 1 + wv * intensity * 0.08,
          }
        }
        case "flicker": {
          const f = hash2(Math.floor(cx / 8), Math.floor(t * 12 * speed))
          return { alpha: lerp(1 - intensity * 0.55, 1, f), shift: 0, size: 1 }
        }
        case "shimmer":
        default: {
          const s =
            0.5 +
            0.5 *
              Math.sin(nx * 14 + phase * 5) *
              Math.cos(ny * 10 - phase * 3.5)
          const boost = lerp(1 - intensity * 0.35, 1 + intensity * 0.45, s)
          return {
            alpha: clamp(0.55 + luma * 0.45 * boost),
            shift: (s - 0.5) * intensity * 2,
            size: lerp(0.92, 1.08, s * intensity + (1 - intensity) * 0.5),
          }
        }
      }
    }

    function drawGlyphs(t: number) {
      glyphsCtx.clearRect(0, 0, rw, rh)
      glyphsCtx.textAlign = "center"
      glyphsCtx.textBaseline = "middle"
      glyphsCtx.globalCompositeOperation =
        (params.styleBlend as GlobalCompositeOperation) || "source-over"

      const mode = params.renderMode
      const len = cells.length

      // Characters path (Forest) — hot path optimized
      if (mode === "characters" || mode === "hexdump" || mode === "braille") {
        glyphsCtx.font = `${cell}px "JetBrains Mono", ui-monospace, monospace`
        for (let i = 0; i < len; i++) {
          const c = cells[i]
          const anim = animFactors(c.cx, c.cy, t, c.luma)
          if (anim.size !== 1) {
            glyphsCtx.font = `${(c.fontPx * anim.size) | 0}px "JetBrains Mono", ui-monospace, monospace`
          }
          glyphsCtx.fillStyle = `rgba(${c.r},${c.g},${c.b},${anim.alpha})`
          glyphsCtx.fillText(c.ch, c.cx + anim.shift, c.cy + 0.5)
        }
        return
      }

      for (let i = 0; i < len; i++) {
        const c = cells[i]
        const anim = animFactors(c.cx, c.cy, t, c.luma)
        const color = `rgba(${c.r},${c.g},${c.b},${anim.alpha})`
        glyphsCtx.fillStyle = color
        glyphsCtx.strokeStyle = color
        const cx = c.cx + anim.shift
        const cy = c.cy
        const s = cell * anim.size

        switch (mode) {
          case "dither":
          case "dots":
          case "bubbles": {
            glyphsCtx.beginPath()
            glyphsCtx.arc(cx, cy, Math.max(0.4, (s * c.dens) / 2.4), 0, Math.PI * 2)
            glyphsCtx.fill()
            break
          }
          case "mosaic":
          case "pixel":
          case "lego":
          case "voxel": {
            glyphsCtx.globalAlpha = c.dens
            glyphsCtx.fillRect(c.x + 0.5, c.y + 0.5, cell - 1, cell - 1)
            glyphsCtx.globalAlpha = 1
            break
          }
          case "cross": {
            glyphsCtx.lineWidth = Math.max(0.6, c.dens * 1.8)
            glyphsCtx.beginPath()
            glyphsCtx.moveTo(cx - s * 0.35, cy)
            glyphsCtx.lineTo(cx + s * 0.35, cy)
            glyphsCtx.moveTo(cx, cy - s * 0.35)
            glyphsCtx.lineTo(cx, cy + s * 0.35)
            glyphsCtx.stroke()
            break
          }
          case "diamond":
          case "triangles":
          case "hexagons":
          case "rings": {
            glyphsCtx.beginPath()
            glyphsCtx.arc(cx, cy, Math.max(1, (s * c.dens) / 2.2), 0, Math.PI * 2)
            if (mode === "rings") glyphsCtx.stroke()
            else glyphsCtx.fill()
            break
          }
          case "lines":
          case "diagonal":
          case "hatch": {
            glyphsCtx.lineWidth = Math.max(0.4, c.dens * 1.4)
            glyphsCtx.beginPath()
            glyphsCtx.moveTo(c.x, mode === "lines" ? cy : c.y + cell)
            glyphsCtx.lineTo(c.x + cell, mode === "lines" ? cy : c.y)
            glyphsCtx.stroke()
            break
          }
          case "matrix": {
            glyphsCtx.fillStyle = `rgba(40,${(180 + c.dens * 75) | 0},70,${anim.alpha})`
            glyphsCtx.font = `${Math.max(8, s)}px monospace`
            glyphsCtx.fillText(c.ch || "0", cx, cy)
            break
          }
          case "hearts":
          case "stars": {
            glyphsCtx.font = `${Math.max(8, s * c.dens)}px serif`
            glyphsCtx.fillText(mode === "hearts" ? "♥" : "✦", cx, cy)
            break
          }
          case "halfblocks": {
            glyphsCtx.fillRect(c.x, c.y, cell, cell * c.dens)
            break
          }
          case "disco": {
            const hue = (hash2(cx, cy) * 360 + t * 80) % 360
            glyphsCtx.fillStyle = `hsla(${hue},90%,${40 + c.dens * 40}%,${anim.alpha})`
            glyphsCtx.beginPath()
            glyphsCtx.arc(cx, cy, Math.max(1, (s * c.dens) / 2.2), 0, Math.PI * 2)
            glyphsCtx.fill()
            break
          }
          default: {
            glyphsCtx.fillRect(cx - 1, cy - 1, 2, 2)
          }
        }
      }
    }

    function drawCheapExtras(t: number) {
      const pfx = params.pfx

      // Soft chromatic via offset draws — no getImageData
      if (pfx.chromatic?.enabled) {
        const shift = Math.max(1, Math.round((pfx.chromatic.intensity / 100) * 2))
        glyphsCtx.save()
        glyphsCtx.globalAlpha = 0.18
        glyphsCtx.globalCompositeOperation = "screen"
        glyphsCtx.drawImage(glyphs, shift, 0)
        glyphsCtx.drawImage(glyphs, -shift, 0)
        glyphsCtx.restore()
      }

      // Sparse film dust — few rects, no pixel loops
      if (pfx.filmDust?.enabled) {
        const intensity = pfx.filmDust.intensity / 100
        const count = Math.floor(18 * intensity)
        dustSeed = (dustSeed + 1) % 1000
        glyphsCtx.save()
        for (let i = 0; i < count; i++) {
          const x = hash2(i + dustSeed, Math.floor(t)) * rw
          const y = hash2(Math.floor(t * 0.5), i * 3.1 + dustSeed) * rh
          const s = 0.5 + hash2(i * 2.2, 9) * 1.6
          glyphsCtx.fillStyle = `rgba(255,255,255,${0.07 + intensity * 0.1})`
          glyphsCtx.fillRect(x, y, s, s * 1.4)
        }
        glyphsCtx.restore()
      }

      // Lightweight scanlines
      if (pfx.scanLines?.enabled) {
        const intensity = pfx.scanLines.intensity / 100
        glyphsCtx.fillStyle = `rgba(0,0,0,${0.1 * intensity})`
        for (let y = 0; y < rh; y += 4) {
          glyphsCtx.fillRect(0, y, rw, 1)
        }
      }
    }

    function composite() {
      // Upscale internal buffers to CSS size
      ctx!.imageSmoothingEnabled = true
      ctx!.clearRect(0, 0, cssW, cssH)
      ctx!.drawImage(bg, 0, 0, cssW, cssH)
      ctx!.drawImage(glyphs, 0, 0, cssW, cssH)
    }

    function rebuildAll() {
      sizeBuffers()
      if (!ready) return
      drawPhoto()
      rebuildCells()
      bakeBackground()
    }

    function frame(now: number) {
      if (!running) return
      raf = requestAnimationFrame(frame)

      if (document.hidden || !inView || !ready || !rw || !rh) return

      const minDelta = 1000 / TARGET_FPS
      if (now - lastFrame < minDelta) return
      lastFrame = now

      const t = now / 1000
      drawGlyphs(t)
      drawCheapExtras(t)
      composite()

      if (reduced || !params.animated) {
        // Single paint already done — stop scheduling more work by leaving raf
        // but keep raf alive for resize/visibility; skip draw via reduced flag next time
      }
    }

    let resizeTimer = 0
    const ro = new ResizeObserver(() => {
      window.clearTimeout(resizeTimer)
      resizeTimer = window.setTimeout(() => {
        rebuildAll()
        if (ready && (reduced || !params.animated)) {
          drawGlyphs(0)
          drawCheapExtras(0)
          composite()
        }
      }, 120)
    })
    ro.observe(container)

    const io = new IntersectionObserver(
      (entries) => {
        inView = entries.some((e) => e.isIntersecting)
      },
      { threshold: 0.05 }
    )
    io.observe(container)

    sizeBuffers()

    img.onload = () => {
      ready = true
      rebuildAll()
      cancelAnimationFrame(raf)
      lastFrame = 0
      raf = requestAnimationFrame(frame)
    }
    img.onerror = () => {
      ready = true
      photoCtx.fillStyle = "#1a2e1a"
      photoCtx.fillRect(0, 0, rw || 800, rh || 600)
      for (let i = 0; i < 60; i++) {
        photoCtx.fillStyle = `rgba(${20 + hash2(i, 1) * 40},${60 + hash2(i, 2) * 80},${20 + hash2(i, 3) * 30},0.5)`
        photoCtx.beginPath()
        photoCtx.arc(
          hash2(i, 4) * (rw || 800),
          hash2(i, 5) * (rh || 600),
          20 + hash2(i, 6) * 80,
          0,
          Math.PI * 2
        )
        photoCtx.fill()
      }
      rebuildCells()
      bakeBackground()
      raf = requestAnimationFrame(frame)
    }
    img.src = src

    const onVis = () => {
      if (!document.hidden && running) {
        lastFrame = 0
      }
    }
    document.addEventListener("visibilitychange", onVis)

    return () => {
      running = false
      cancelAnimationFrame(raf)
      window.clearTimeout(resizeTimer)
      ro.disconnect()
      io.disconnect()
      document.removeEventListener("visibilitychange", onVis)
    }
  }, [src, paramOverrides])

  return (
    <div
      ref={containerRef}
      className={cn("relative h-full w-full overflow-hidden", className)}
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  )
}

export default ForestAscii
