import { useEffect, useRef } from 'react'
import { useAudio } from '../../providers/AudioProvider'

type RunnerState = {
  t: number
  speed: number
  score: number
  player: { x: number; y: number; vy: number; w: number; h: number; onGround: boolean }
  obstacles: { x: number; w: number; h: number }[]
  particles: { x: number; y: number; vx: number; vy: number; life: number }[]
  dead: boolean
}

export function EndlessRunnerGame({
  paused,
  started,
  onScore,
  onGameOver,
}: {
  paused: boolean
  started: boolean
  onScore: (score: number) => void
  onGameOver: (finalScore: number) => void
}) {
  const { play } = useAudio()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const lastRef = useRef<number>(0)
  const stateRef = useRef<RunnerState | null>(null)
  const pausedRef = useRef<boolean>(paused)
  const startedRef = useRef<boolean>(started)
  const onScoreRef = useRef(onScore)
  const onGameOverRef = useRef(onGameOver)
  const resetRef = useRef<null | (() => void)>(null)

  const W = 900
  const H = 360
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1

  useEffect(() => {
    pausedRef.current = paused
  }, [paused])

  useEffect(() => {
    startedRef.current = started
    if (!started) onScoreRef.current(0)
  }, [started])

  useEffect(() => {
    onScoreRef.current = onScore
  }, [onScore])

  useEffect(() => {
    onGameOverRef.current = onGameOver
  }, [onGameOver])

  const jump = () => {
    const st = stateRef.current
    if (!startedRef.current) return
    if (!st || st.dead) return
    if (!st.player.onGround) return
    st.player.vy = -520
    st.player.onGround = false
    play('runner.jump')
    for (let i = 0; i < 12; i++) {
      st.particles.push({
        x: st.player.x + st.player.w * 0.3,
        y: st.player.y + st.player.h,
        vx: (Math.random() - 0.5) * 120,
        vy: -Math.random() * 140,
        life: 0.35 + Math.random() * 0.25,
      })
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    canvas.width = Math.floor(W * dpr)
    canvas.height = Math.floor(H * dpr)
    canvas.style.width = `${W}px`
    canvas.style.height = `${H}px`
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const groundY = H - 64
    const resetState = () => {
      lastRef.current = 0
      stateRef.current = {
        t: 0,
        speed: 360,
        score: 0,
        player: { x: 120, y: groundY - 46, vy: 0, w: 36, h: 46, onGround: true },
        obstacles: [],
        particles: [],
        dead: false,
      }
      onScoreRef.current(0)
    }

    resetRef.current = resetState
    resetState()

    const spawnObstacle = () => {
      const st = stateRef.current!
      const h = 20 + Math.random() * 48
      const w = 18 + Math.random() * 26
      st.obstacles.push({ x: W + 30, w, h })
    }

    let nextSpawn = 0.8

    const loop = (now: number) => {
      if (!lastRef.current) lastRef.current = now
      const dt = Math.min(0.05, (now - lastRef.current) / 1000)
      lastRef.current = now

      const st = stateRef.current!
      st.t += dt

      if (startedRef.current && !pausedRef.current && !st.dead) {
        // speed ramp
        st.speed += dt * 18

        // score based on distance
        st.score += dt * (st.speed * 0.12)
        onScoreRef.current(Math.floor(st.score))

        // player physics
        st.player.vy += 1300 * dt
        st.player.y += st.player.vy * dt
        if (st.player.y >= groundY - st.player.h) {
          st.player.y = groundY - st.player.h
          st.player.vy = 0
          st.player.onGround = true
        }

        // obstacle spawning
        nextSpawn -= dt
        if (nextSpawn <= 0) {
          spawnObstacle()
          const density = Math.max(0.45, 1.05 - st.speed / 900)
          nextSpawn = density + Math.random() * density
        }

        // move obstacles
        st.obstacles.forEach((o) => (o.x -= st.speed * dt))
        st.obstacles = st.obstacles.filter((o) => o.x + o.w > -40)

        // particles
        st.particles.forEach((p) => {
          p.vy += 900 * dt
          p.x += p.vx * dt
          p.y += p.vy * dt
          p.life -= dt
        })
        st.particles = st.particles.filter((p) => p.life > 0)

        // collisions (AABB)
        const px = st.player.x
        const py = st.player.y
        const pw = st.player.w
        const ph = st.player.h
        for (const o of st.obstacles) {
          const ox = o.x
          const oy = groundY - o.h
          if (px < ox + o.w && px + pw > ox && py < oy + o.h && py + ph > oy) {
            st.dead = true
            play('game.over')
            onGameOverRef.current(Math.floor(st.score))
            break
          }
        }
      }

      // draw
      ctx.clearRect(0, 0, W, H)

      // parallax background
      const grad = ctx.createLinearGradient(0, 0, W, H)
      grad.addColorStop(0, 'rgba(56,189,248,0.22)')
      grad.addColorStop(0.5, 'rgba(52,211,153,0.14)')
      grad.addColorStop(1, 'rgba(244,114,182,0.10)')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, W, H)

      const st2 = stateRef.current!
      const scroll = st2.t * st2.speed
      const drawLayer = (y: number, amp: number, freq: number, alpha: number, color: string, speedMul: number) => {
        ctx.beginPath()
        ctx.moveTo(0, H)
        for (let x = 0; x <= W; x += 12) {
          const nx = (x + scroll * speedMul) * freq
          const yy = y + Math.sin(nx) * amp
          ctx.lineTo(x, yy)
        }
        ctx.lineTo(W, H)
        ctx.closePath()
        ctx.fillStyle = color
        ctx.globalAlpha = alpha
        ctx.fill()
        ctx.globalAlpha = 1
      }
      drawLayer(H - 200, 18, 0.012, 0.5, '#60a5fa', 0.05)
      drawLayer(H - 160, 22, 0.014, 0.45, '#34d399', 0.08)
      drawLayer(H - 120, 28, 0.018, 0.4, '#a78bfa', 0.12)

      // ground
      ctx.fillStyle = 'rgba(255,255,255,0.08)'
      ctx.fillRect(0, groundY, W, H - groundY)
      ctx.strokeStyle = 'rgba(255,255,255,0.10)'
      ctx.beginPath()
      ctx.moveTo(0, groundY + 0.5)
      ctx.lineTo(W, groundY + 0.5)
      ctx.stroke()

      // obstacles
      for (const o of st2.obstacles) {
        const oy = groundY - o.h
        const g = ctx.createLinearGradient(o.x, oy, o.x + o.w, oy + o.h)
        g.addColorStop(0, 'rgba(251,113,133,0.9)')
        g.addColorStop(1, 'rgba(250,204,21,0.85)')
        ctx.fillStyle = g
        ctx.fillRect(o.x, oy, o.w, o.h)
      }

      // player
      const pg = ctx.createLinearGradient(
        st2.player.x,
        st2.player.y,
        st2.player.x + st2.player.w,
        st2.player.y + st2.player.h,
      )
      pg.addColorStop(0, 'rgba(255,255,255,0.85)')
      pg.addColorStop(1, 'rgba(56,189,248,0.9)')
      ctx.fillStyle = pg
      ctx.fillRect(st2.player.x, st2.player.y, st2.player.w, st2.player.h)

      // particles
      for (const p of st2.particles) {
        ctx.globalAlpha = Math.max(0, Math.min(1, p.life / 0.6))
        ctx.fillStyle = 'rgba(255,255,255,0.85)'
        ctx.fillRect(p.x, p.y, 3, 3)
      }
      ctx.globalAlpha = 1

      if (pausedRef.current && !st2.dead) {
        ctx.fillStyle = 'rgba(0,0,0,0.35)'
        ctx.fillRect(0, 0, W, H)
        ctx.fillStyle = 'rgba(255,255,255,0.92)'
        ctx.font = '700 26px system-ui'
        ctx.textAlign = 'center'
        ctx.fillText('PAUSED', W / 2, H / 2)
      }
      if (st2.dead) {
        ctx.fillStyle = 'rgba(0,0,0,0.45)'
        ctx.fillRect(0, 0, W, H)
        ctx.fillStyle = 'rgba(255,255,255,0.92)'
        ctx.font = '700 26px system-ui'
        ctx.textAlign = 'center'
        ctx.fillText('GAME OVER', W / 2, H / 2 - 6)
        ctx.font = '500 14px system-ui'
        ctx.fillText('Space / Click to jump — R to restart', W / 2, H / 2 + 20)
      }
      if (!startedRef.current) {
        ctx.fillStyle = 'rgba(0,0,0,0.35)'
        ctx.fillRect(0, 0, W, H)
        ctx.fillStyle = 'rgba(255,255,255,0.92)'
        ctx.font = '700 26px system-ui'
        ctx.textAlign = 'center'
        ctx.fillText('READY?', W / 2, H / 2 - 6)
        ctx.font = '500 14px system-ui'
        ctx.fillText('Press Start to begin', W / 2, H / 2 + 20)
      }

      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
        const st = stateRef.current
        if (st?.dead) {
          e.preventDefault()
          resetState()
        }
        return
      }

      if (e.key === ' ' || e.key === 'ArrowUp') {
        e.preventDefault()
        if (!startedRef.current) return
        const st = stateRef.current
        if (st?.dead) resetState()
        else jump()
      }
    }
    window.addEventListener('keydown', onKeyDown, { passive: false })
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      window.removeEventListener('keydown', onKeyDown as any)
      resetRef.current = null
    }
  }, [dpr, play])

  return (
    <div className="game-wrap">
      <div className="runner-help">
        <span className="kbd">Space / ↑</span>
        <span className="dot" />
        <span className="mini">Click to jump</span>
      </div>
      <canvas
        ref={canvasRef}
        className="canvas canvas--wide"
        width={W}
        height={H}
        onMouseDown={() => {
          if (!startedRef.current) return
          const st = stateRef.current
          if (st?.dead) resetRef.current?.()
          else jump()
        }}
      />
    </div>
  )
}

