import { useEffect, useMemo, useRef, useState } from 'react'
import type { Vec, SnakePowerUp, SnakePowerUpType } from './types'
import { useAudio } from '../../providers/AudioProvider'

const GRID_W = 26
const GRID_H = 18

const COLORS = {
  bg: 'rgba(255,255,255,0.02)',
  grid: 'rgba(255,255,255,0.06)',
  snake: '#22c55e',
  head: '#a7f3d0',
  food: '#fb7185',
  speed: '#60a5fa',
  slow: '#facc15',
  ghost: '#a78bfa',
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n))
}

function eq(a: Vec, b: Vec) {
  return a.x === b.x && a.y === b.y
}

function randInt(n: number) {
  return Math.floor(Math.random() * n)
}

function opposite(a: Vec, b: Vec) {
  return a.x === -b.x && a.y === -b.y
}

function pickPower(): SnakePowerUpType {
  const r = Math.random()
  if (r < 0.42) return 'speed'
  if (r < 0.74) return 'slow'
  return 'ghost'
}

function powerColor(t: SnakePowerUpType) {
  if (t === 'speed') return COLORS.speed
  if (t === 'slow') return COLORS.slow
  return COLORS.ghost
}

function spawnEmpty(occupied: Vec[], w: number, h: number): Vec {
  // Try a few random samples first, then fallback scan.
  for (let i = 0; i < 40; i++) {
    const p = { x: randInt(w), y: randInt(h) }
    if (!occupied.some((o) => eq(o, p))) return p
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = { x, y }
      if (!occupied.some((o) => eq(o, p))) return p
    }
  }
  return { x: 0, y: 0 }
}

type ActiveFx = {
  type: SnakePowerUpType
  until: number
}

type SnakeState = {
  snake: Vec[]
  dir: Vec
  nextDir: Vec
  food: Vec
  power: SnakePowerUp | null
  fx: ActiveFx | null
  baseStepMs: number
  lastPowerSpawn: number
}

function makeInitialState(): SnakeState {
  const start: Vec = { x: Math.floor(GRID_W / 2), y: Math.floor(GRID_H / 2) }
  const snake = [start, { x: start.x - 1, y: start.y }, { x: start.x - 2, y: start.y }]
  return {
    snake,
    dir: { x: 1, y: 0 },
    nextDir: { x: 1, y: 0 },
    food: spawnEmpty(snake, GRID_W, GRID_H),
    power: null,
    fx: null,
    baseStepMs: 140,
    lastPowerSpawn: performance.now(),
  }
}

export function SnakeGame({
  onScore,
  paused,
  onGameOver,
}: {
  onScore: (score: number) => void
  paused: boolean
  onGameOver: (finalScore: number) => void
}) {
  const { play } = useAudio()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const lastRef = useRef<number>(0)
  const accRef = useRef<number>(0)

  const [score, setScore] = useState(0)
  const [dead, setDead] = useState(false)
  const [started, setStarted] = useState(false)

  const cell = 22
  const canvasW = GRID_W * cell
  const canvasH = GRID_H * cell

  const stateRef = useRef<SnakeState>(makeInitialState())

  const computed = useMemo(() => ({ cell, canvasW, canvasH }), [cell, canvasW, canvasH])

  const restart = () => {
    stateRef.current = makeInitialState()
    setDead(false)
    setScore(0)
    setStarted(false)
    onScore(0)
    lastRef.current = 0
    accRef.current = 0
  }

  useEffect(() => {
    restart()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const start = () => {
    if (dead) return
    setStarted(true)
    lastRef.current = 0
    accRef.current = 0
    play('game.start')
  }

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') stateRef.current.nextDir = { x: 0, y: -1 }
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') stateRef.current.nextDir = { x: 0, y: 1 }
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') stateRef.current.nextDir = { x: -1, y: 0 }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') stateRef.current.nextDir = { x: 1, y: 0 }
      if (e.key === 'r' || e.key === 'R') restart()
      if ((e.key === 'Enter' || e.key === ' ') && !started) {
        e.preventDefault()
        start()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, started])

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return

    const stepOnce = (now: number) => {
      const st = stateRef.current
      if (dead) return
      if (paused) return
      if (!started) return

      // Apply dir with no instant reverse.
      if (!opposite(st.dir, st.nextDir)) st.dir = st.nextDir

      const head = st.snake[0]
      let nx = head.x + st.dir.x
      let ny = head.y + st.dir.y

      const fxActive = st.fx && st.fx.until > now ? st.fx.type : null
      if (st.fx && st.fx.until <= now) st.fx = null

      const ghost = fxActive === 'ghost'

      if (ghost) {
        nx = (nx + GRID_W) % GRID_W
        ny = (ny + GRID_H) % GRID_H
      }

      // Wall collision (unless ghost wraps)
      if (!ghost && (nx < 0 || nx >= GRID_W || ny < 0 || ny >= GRID_H)) {
        setDead(true)
        play('game.over')
        onGameOver(score)
        return
      }

      const nextHead = { x: nx, y: ny }

      // Self collision (unless ghost mode)
      if (!ghost && st.snake.some((p) => eq(p, nextHead))) {
        setDead(true)
        play('game.over')
        onGameOver(score)
        return
      }

      st.snake.unshift(nextHead)

      const ateFood = eq(nextHead, st.food)
      const atePower = st.power && eq(nextHead, st.power.pos)

      if (ateFood) {
        play('snake.eat')
        const gained = 10 + Math.floor(st.snake.length / 3)
        const next = score + gained
        setScore(next)
        onScore(next)

        // Difficulty: speed up gradually.
        st.baseStepMs = clamp(st.baseStepMs - 1.5, 70, 140)
        st.food = spawnEmpty(st.snake, GRID_W, GRID_H)
      } else {
        st.snake.pop()
      }

      if (atePower && st.power) {
        st.fx = { type: st.power.type, until: now + 7000 }
        st.power = null
        const bonus = 25
        const next = score + bonus
        setScore(next)
        onScore(next)
      }

      // Spawn a power-up sometimes.
      const since = now - st.lastPowerSpawn
      if (!st.power && since > 6000 && Math.random() < 0.35) {
        const pos = spawnEmpty(st.snake.concat([st.food]), GRID_W, GRID_H)
        st.power = { type: pickPower(), pos, expiresAt: now + 8000 }
        st.lastPowerSpawn = now
      }
      if (st.power && st.power.expiresAt < now) st.power = null
    }

    const draw = (now: number) => {
      const st = stateRef.current
      const dpr = window.devicePixelRatio || 1
      const w = computed.canvasW
      const h = computed.canvasH
      const c = computed.cell

      const canvas = canvasRef.current!
      if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
        canvas.width = Math.floor(w * dpr)
        canvas.height = Math.floor(h * dpr)
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      }

      ctx.clearRect(0, 0, w, h)
      ctx.fillStyle = COLORS.bg
      ctx.fillRect(0, 0, w, h)

      // Grid
      ctx.strokeStyle = COLORS.grid
      ctx.lineWidth = 1
      for (let x = 0; x <= GRID_W; x++) {
        ctx.beginPath()
        ctx.moveTo(x * c + 0.5, 0)
        ctx.lineTo(x * c + 0.5, h)
        ctx.stroke()
      }
      for (let y = 0; y <= GRID_H; y++) {
        ctx.beginPath()
        ctx.moveTo(0, y * c + 0.5)
        ctx.lineTo(w, y * c + 0.5)
        ctx.stroke()
      }

      // Food
      ctx.fillStyle = COLORS.food
      ctx.beginPath()
      ctx.arc((st.food.x + 0.5) * c, (st.food.y + 0.5) * c, c * 0.28, 0, Math.PI * 2)
      ctx.fill()

      // Power-up
      if (st.power) {
        ctx.fillStyle = powerColor(st.power.type)
        ctx.fillRect(st.power.pos.x * c + c * 0.18, st.power.pos.y * c + c * 0.18, c * 0.64, c * 0.64)
      }

      // Snake
      for (let i = st.snake.length - 1; i >= 0; i--) {
        const p = st.snake[i]
        const isHead = i === 0
        ctx.fillStyle = isHead ? COLORS.head : COLORS.snake
        const pad = isHead ? 0.12 : 0.18
        ctx.fillRect(p.x * c + c * pad, p.y * c + c * pad, c * (1 - pad * 2), c * (1 - pad * 2))
      }

      // FX indicator
      if (st.fx && st.fx.until > now) {
        const t = st.fx.type
        ctx.fillStyle = powerColor(t)
        ctx.globalAlpha = 0.18
        ctx.fillRect(0, 0, w, h)
        ctx.globalAlpha = 1
      }

      if (dead) {
        ctx.fillStyle = 'rgba(0,0,0,0.45)'
        ctx.fillRect(0, 0, w, h)
        ctx.fillStyle = 'rgba(255,255,255,0.92)'
        ctx.font = '700 28px system-ui'
        ctx.textAlign = 'center'
        ctx.fillText('GAME OVER', w / 2, h / 2 - 8)
        ctx.font = '500 14px system-ui'
        ctx.fillText('Press R to restart', w / 2, h / 2 + 18)
      }

      if (!dead && !started) {
        ctx.fillStyle = 'rgba(0,0,0,0.35)'
        ctx.fillRect(0, 0, w, h)
        ctx.fillStyle = 'rgba(255,255,255,0.92)'
        ctx.font = '800 26px system-ui'
        ctx.textAlign = 'center'
        ctx.fillText('READY?', w / 2, h / 2 - 14)
        ctx.font = '500 14px system-ui'
        ctx.fillText('Click Start (or press Enter / Space)', w / 2, h / 2 + 16)
      }
    }

    const loop = (now: number) => {
      if (!lastRef.current) lastRef.current = now
      const dt = now - lastRef.current
      lastRef.current = now
      accRef.current += dt

      const st = stateRef.current
      const fxActive = st.fx && st.fx.until > now ? st.fx.type : null
      const speedMul = fxActive === 'speed' ? 0.6 : fxActive === 'slow' ? 1.5 : 1
      const stepMs = st.baseStepMs * speedMul

      if (!paused && !dead && started) {
        while (accRef.current >= stepMs) {
          accRef.current -= stepMs
          stepOnce(now)
          if (dead) break
        }
      }

      draw(now)
      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [computed.canvasH, computed.canvasW, computed.cell, dead, onGameOver, onScore, paused, play, score, started])

  return (
    <div className="game-wrap">
      <div className="snake-help">
        <span className="kbd">Arrows / WASD</span>
        <span className="dot" />
        <span className="mini">Power-ups: Speed / Slow / Ghost</span>
        <span className="dot" />
        <span className="mini">R = Restart</span>
      </div>
      {!started && !dead && (
        <div className="overlay-card">
          <h3 className="overlay-title">Snake is ready</h3>
          <p className="overlay-sub">Click start to begin. You can set direction before starting.</p>
          <button className="btn" onClick={start}>
            Start
          </button>
        </div>
      )}
      <canvas ref={canvasRef} className="canvas canvas--snake" width={canvasW} height={canvasH} />
    </div>
  )
}

