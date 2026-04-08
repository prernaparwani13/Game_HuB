import { useEffect, useMemo, useRef } from 'react'
import { useAudio } from '../../providers/AudioProvider'

type Bubble = { row: number; col: number; color: string; id: string }
type Shot = { x: number; y: number; vx: number; vy: number; color: string; active: boolean }
type Particle = { x: number; y: number; vx: number; vy: number; life: number; color: string }

const COLORS = ['#60a5fa', '#34d399', '#f472b6', '#facc15', '#a78bfa', '#fb7185']

function randColor() {
  return COLORS[Math.floor(Math.random() * COLORS.length)]
}

function dist2(ax: number, ay: number, bx: number, by: number) {
  const dx = ax - bx
  const dy = ay - by
  return dx * dx + dy * dy
}

export function BubbleShooterGame({
  paused,
  onScore,
  onGameOver,
}: {
  paused: boolean
  onScore: (score: number) => void
  onGameOver: (finalScore: number) => void
}) {
  const { play } = useAudio()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const lastRef = useRef<number>(0)

  const W = 900
  const H = 520
  const R = 16
  const rowH = Math.sqrt(3) * R
  const topMargin = 26
  const leftMargin = 40

  const stateRef = useRef<{
    bubbles: Bubble[]
    shot: Shot
    nextColor: string
    score: number
    aim: { x: number; y: number }
    particles: Particle[]
    dead: boolean
  } | null>(null)

  const dpr = useMemo(() => (typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1), [])

  const bubbleXY = (row: number, col: number) => {
    const offset = row % 2 === 1 ? R : 0
    const x = leftMargin + offset + col * (R * 2)
    const y = topMargin + row * rowH
    return { x, y }
  }

  const nearestGrid = (x: number, y: number) => {
    const row = Math.max(0, Math.round((y - topMargin) / rowH))
    const offset = row % 2 === 1 ? R : 0
    const col = Math.max(0, Math.round((x - leftMargin - offset) / (R * 2)))
    return { row, col }
  }

  const neighbors = (row: number, col: number) => {
    const odd = row % 2 === 1
    const n = odd
      ? [
          [row, col - 1],
          [row, col + 1],
          [row - 1, col],
          [row - 1, col + 1],
          [row + 1, col],
          [row + 1, col + 1],
        ]
      : [
          [row, col - 1],
          [row, col + 1],
          [row - 1, col - 1],
          [row - 1, col],
          [row + 1, col - 1],
          [row + 1, col],
        ]
    return n
  }

  const restart = () => {
    const bubbles: Bubble[] = []
    const rows = 8
    const cols = 12
    for (let r = 0; r < rows; r++) {
      const cMax = cols - (r % 2)
      for (let c = 0; c < cMax; c++) {
        if (Math.random() < 0.92) {
          bubbles.push({ row: r, col: c, color: randColor(), id: `b-${r}-${c}-${Math.random()}` })
        }
      }
    }
    stateRef.current = {
      bubbles,
      shot: { x: W / 2, y: H - 62, vx: 0, vy: 0, color: randColor(), active: false },
      nextColor: randColor(),
      score: 0,
      aim: { x: W / 2, y: H - 200 },
      particles: [],
      dead: false,
    }
    onScore(0)
    play('game.start')
  }

  const shoot = () => {
    const st = stateRef.current
    if (!st || st.dead) return
    if (paused) return
    if (st.shot.active) return
    const sx = W / 2
    const sy = H - 62
    const ax = st.aim.x
    const ay = st.aim.y
    let dx = ax - sx
    let dy = ay - sy
    const len = Math.hypot(dx, dy) || 1
    dx /= len
    dy /= len
    // prevent shooting downward
    dy = Math.min(dy, -0.15)
    const speed = 640
    st.shot = { x: sx, y: sy, vx: dx * speed, vy: dy * speed, color: st.shot.color, active: true }
    play('ui.click')
  }

  const getBubbleAt = (row: number, col: number) => stateRef.current!.bubbles.find((b) => b.row === row && b.col === col)

  const removeByIds = (ids: Set<string>) => {
    const st = stateRef.current!
    st.bubbles = st.bubbles.filter((b) => !ids.has(b.id))
  }

  const popParticles = (x: number, y: number, color: string, count: number) => {
    const st = stateRef.current!
    for (let i = 0; i < count; i++) {
      st.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 320,
        vy: (Math.random() - 0.6) * 320,
        life: 0.5 + Math.random() * 0.4,
        color,
      })
    }
  }

  const resolveMatches = (from: Bubble) => {
    const st = stateRef.current!
    const target = from.color
    const stack: Bubble[] = [from]
    const seen = new Set<string>()
    while (stack.length) {
      const cur = stack.pop()!
      if (seen.has(cur.id)) continue
      seen.add(cur.id)
      for (const [nr, nc] of neighbors(cur.row, cur.col)) {
        const nb = getBubbleAt(nr, nc)
        if (nb && nb.color === target && !seen.has(nb.id)) stack.push(nb)
      }
    }

    if (seen.size >= 3) {
      play('bubble.pop')
      // score and remove
      st.score += 20 * seen.size
      onScore(st.score)
      for (const id of seen) {
        const b = st.bubbles.find((x) => x.id === id)
        if (!b) continue
        const p = bubbleXY(b.row, b.col)
        popParticles(p.x, p.y, b.color, 10)
      }
      removeByIds(seen)
    }
  }

  useEffect(() => {
    restart()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    canvas.width = Math.floor(W * dpr)
    canvas.height = Math.floor(H * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const onMove = (e: PointerEvent) => {
      const st = stateRef.current
      if (!st) return
      const r = canvas.getBoundingClientRect()
      const cssW = Math.max(1, r.width)
      const cssH = Math.max(1, r.height)
      const cssX = e.clientX - r.left
      const cssY = e.clientY - r.top
      // Map pointer position (CSS pixels) into the game's logical coordinate space.
      st.aim.x = (cssX * W) / cssW
      st.aim.y = (cssY * H) / cssH
    }
    canvas.addEventListener('pointermove', onMove)

    const loop = (now: number) => {
      if (!lastRef.current) lastRef.current = now
      const dt = Math.min(0.05, (now - lastRef.current) / 1000)
      lastRef.current = now
      const st = stateRef.current!

      if (!paused && !st.dead) {
        // particles
        st.particles.forEach((p) => {
          p.vy += 900 * dt
          p.x += p.vx * dt
          p.y += p.vy * dt
          p.life -= dt
        })
        st.particles = st.particles.filter((p) => p.life > 0)

        // shot motion + collisions
        if (st.shot.active) {
          st.shot.x += st.shot.vx * dt
          st.shot.y += st.shot.vy * dt

          // bounce walls
          if (st.shot.x < leftMargin + R) {
            st.shot.x = leftMargin + R
            st.shot.vx *= -1
          }
          if (st.shot.x > W - leftMargin - R) {
            st.shot.x = W - leftMargin - R
            st.shot.vx *= -1
          }

          // hit top
          if (st.shot.y < topMargin + R) {
            const g = nearestGrid(st.shot.x, st.shot.y)
            const placed: Bubble = {
              row: g.row,
              col: g.col,
              color: st.shot.color,
              id: `p-${Date.now()}-${Math.random()}`,
            }
            st.bubbles.push(placed)
            st.shot = { x: W / 2, y: H - 62, vx: 0, vy: 0, color: st.nextColor, active: false }
            st.nextColor = randColor()
            resolveMatches(placed)
          } else {
            // collide with existing bubbles
            const rad2 = (R * 1.94) * (R * 1.94)
            for (const b of st.bubbles) {
              const p = bubbleXY(b.row, b.col)
              if (dist2(st.shot.x, st.shot.y, p.x, p.y) < rad2) {
                const g = nearestGrid(st.shot.x, st.shot.y)
                // if occupied, nudge by searching neighbors near current
                let row = g.row
                let col = g.col
                if (getBubbleAt(row, col)) {
                  const opts = neighbors(b.row, b.col)
                  let best: { row: number; col: number; d: number } | null = null
                  for (const [rr, cc] of opts) {
                    if (rr < 0 || cc < 0) continue
                    if (getBubbleAt(rr, cc)) continue
                    const q = bubbleXY(rr, cc)
                    const d = dist2(st.shot.x, st.shot.y, q.x, q.y)
                    if (!best || d < best.d) best = { row: rr, col: cc, d }
                  }
                  if (best) {
                    row = best.row
                    col = best.col
                  }
                }
                const placed: Bubble = {
                  row,
                  col,
                  color: st.shot.color,
                  id: `p-${Date.now()}-${Math.random()}`,
                }
                st.bubbles.push(placed)
                st.shot = { x: W / 2, y: H - 62, vx: 0, vy: 0, color: st.nextColor, active: false }
                st.nextColor = randColor()
                resolveMatches(placed)
                break
              }
            }
          }
        }

        // lose condition: bubbles too low
        const maxRow = st.bubbles.reduce((m, b) => Math.max(m, b.row), 0)
        const lowY = bubbleXY(maxRow, 0).y + R
        if (lowY > H - 120) {
          st.dead = true
          play('game.over')
          onGameOver(st.score)
        }
      }

      // draw
      ctx.clearRect(0, 0, W, H)
      const bg = ctx.createLinearGradient(0, 0, W, H)
      bg.addColorStop(0, 'rgba(167,139,250,0.16)')
      bg.addColorStop(0.4, 'rgba(34,211,238,0.10)')
      bg.addColorStop(1, 'rgba(249,115,22,0.10)')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, W, H)

      // aim line
      const sx = W / 2
      const sy = H - 62
      const ax = st.aim.x
      const ay = st.aim.y
      const dx = ax - sx
      const dy = ay - sy
      const len = Math.hypot(dx, dy) || 1
      const nx = dx / len
      const ny = Math.min(dy / len, -0.15)
      ctx.strokeStyle = 'rgba(255,255,255,0.18)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(sx, sy)
      ctx.lineTo(sx + nx * 280, sy + ny * 280)
      ctx.stroke()

      // bubbles
      for (const b of st.bubbles) {
        const p = bubbleXY(b.row, b.col)
        const g = ctx.createRadialGradient(p.x - 5, p.y - 7, 2, p.x, p.y, R + 3)
        g.addColorStop(0, 'rgba(255,255,255,0.85)')
        g.addColorStop(0.12, b.color)
        g.addColorStop(1, 'rgba(0,0,0,0.25)')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(p.x, p.y, R, 0, Math.PI * 2)
        ctx.fill()
      }

      // shot
      const drawBall = (x: number, y: number, color: string) => {
        const g = ctx.createRadialGradient(x - 5, y - 7, 2, x, y, R + 3)
        g.addColorStop(0, 'rgba(255,255,255,0.9)')
        g.addColorStop(0.12, color)
        g.addColorStop(1, 'rgba(0,0,0,0.25)')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(x, y, R, 0, Math.PI * 2)
        ctx.fill()
      }
      if (st.shot.active) drawBall(st.shot.x, st.shot.y, st.shot.color)
      drawBall(W / 2, H - 62, st.shot.color)
      drawBall(W / 2 + 46, H - 62, st.nextColor)

      // particles
      for (const p of st.particles) {
        ctx.globalAlpha = Math.max(0, Math.min(1, p.life / 0.9))
        ctx.fillStyle = p.color
        ctx.fillRect(p.x, p.y, 3, 3)
      }
      ctx.globalAlpha = 1

      // HUD hints
      ctx.fillStyle = 'rgba(255,255,255,0.75)'
      ctx.font = '500 12px system-ui'
      ctx.textAlign = 'left'
      ctx.fillText('Click / Space to shoot — Move mouse to aim', 18, H - 16)

      if (paused && !st.dead) {
        ctx.fillStyle = 'rgba(0,0,0,0.35)'
        ctx.fillRect(0, 0, W, H)
        ctx.fillStyle = 'rgba(255,255,255,0.92)'
        ctx.font = '700 26px system-ui'
        ctx.textAlign = 'center'
        ctx.fillText('PAUSED', W / 2, H / 2)
      }
      if (st.dead) {
        ctx.fillStyle = 'rgba(0,0,0,0.45)'
        ctx.fillRect(0, 0, W, H)
        ctx.fillStyle = 'rgba(255,255,255,0.92)'
        ctx.font = '700 26px system-ui'
        ctx.textAlign = 'center'
        ctx.fillText('GAME OVER', W / 2, H / 2 - 8)
        ctx.font = '500 14px system-ui'
        ctx.fillText('Press R to restart', W / 2, H / 2 + 18)
      }

      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        shoot()
      }
      if (e.key === 'r' || e.key === 'R') restart()
    }
    window.addEventListener('keydown', onKeyDown, { passive: false })

    return () => {
      canvas.removeEventListener('pointermove', onMove)
      window.removeEventListener('keydown', onKeyDown as any)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, onGameOver, onScore, play])

  return (
    <div className="game-wrap">
      <div className="bubble-help">
        <span className="kbd">Mouse</span>
        <span className="dot" />
        <span className="mini">Aim</span>
        <span className="dot" />
        <span className="kbd">Space / Click</span>
        <span className="dot" />
        <span className="mini">Shoot</span>
      </div>
      <canvas ref={canvasRef} className="canvas canvas--tall" width={W} height={H} onMouseDown={shoot} />
    </div>
  )
}

