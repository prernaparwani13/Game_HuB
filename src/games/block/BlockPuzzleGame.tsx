import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { makeShapes, type BlockShape, type Cell } from './blocks'
import { useAudio } from '../../providers/AudioProvider'

const N = 10

type GridCell = { filled: boolean; color: string; pop?: number }

function emptyGrid(): GridCell[][] {
  return Array.from({ length: N }, () =>
    Array.from({ length: N }, () => ({ filled: false, color: 'transparent' })),
  )
}

function canPlace(grid: GridCell[][], shape: BlockShape, at: Cell) {
  return shape.cells.every((c) => {
    const x = at.x + c.x
    const y = at.y + c.y
    if (x < 0 || x >= N || y < 0 || y >= N) return false
    return !grid[y][x].filled
  })
}

function place(grid: GridCell[][], shape: BlockShape, at: Cell) {
  const next = grid.map((row) => row.map((c) => ({ ...c })))
  shape.cells.forEach((c) => {
    const x = at.x + c.x
    const y = at.y + c.y
    next[y][x] = { filled: true, color: shape.color }
  })
  return next
}

function getFullLines(grid: GridCell[][]) {
  const fullRows: number[] = []
  const fullCols: number[] = []
  for (let y = 0; y < N; y++) {
    if (grid[y].every((c) => c.filled)) fullRows.push(y)
  }
  for (let x = 0; x < N; x++) {
    let ok = true
    for (let y = 0; y < N; y++) if (!grid[y][x].filled) ok = false
    if (ok) fullCols.push(x)
  }
  return { fullRows, fullCols }
}

function clearLines(grid: GridCell[][], fullRows: number[], fullCols: number[]) {
  const next = grid.map((row) => row.map((c) => ({ ...c })))
  for (const y of fullRows) for (let x = 0; x < N; x++) next[y][x] = { filled: false, color: 'transparent', pop: 1 }
  for (const x of fullCols) for (let y = 0; y < N; y++) next[y][x] = { filled: false, color: 'transparent', pop: 1 }
  return next
}

export function BlockPuzzleGame({
  paused,
  onScore,
  onLevel,
  onGameOver,
}: {
  paused: boolean
  onScore: (score: number) => void
  onLevel: (level: number) => void
  onGameOver: (finalScore: number) => void
}) {
  const { play } = useAudio()
  const [grid, setGrid] = useState(() => emptyGrid())
  const [level, setLevel] = useState(1)
  const [score, setScore] = useState(0)
  const [tray, setTray] = useState<BlockShape[]>(() => makeShapes(1))
  const [dragId, setDragId] = useState<string | null>(null)
  const [hoverCell, setHoverCell] = useState<Cell | null>(null)
  const [dead, setDead] = useState(false)
  const boardRef = useRef<HTMLDivElement | null>(null)

  const bumpScore = (delta: number) => {
    setScore((s) => {
      const next = s + delta
      onScore(next)
      return next
    })
  }

  const restart = () => {
    setGrid(emptyGrid())
    setLevel(1)
    onLevel(1)
    setScore(0)
    onScore(0)
    setTray(makeShapes(1))
    setDragId(null)
    setHoverCell(null)
    setDead(false)
    play('game.start')
  }

  useEffect(() => {
    restart()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') restart()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, dead, score, level, grid, tray])

  const getCellFromPointer = (clientX: number, clientY: number): Cell | null => {
    const el = boardRef.current
    if (!el) return null
    const r = el.getBoundingClientRect()
    const x = clientX - r.left
    const y = clientY - r.top
    if (x < 0 || y < 0 || x > r.width || y > r.height) return null
    const cx = Math.floor((x / r.width) * N)
    const cy = Math.floor((y / r.height) * N)
    return { x: cx, y: cy }
  }

  const shape = tray.find((s) => s.id === dragId) ?? null
  const validHover = shape && hoverCell ? canPlace(grid, shape, hoverCell) : false

  const tryFinishTurn = (nextGrid: GridCell[][]) => {
    const { fullRows, fullCols } = getFullLines(nextGrid)
    if (fullRows.length || fullCols.length) {
      play('block.place')
      const cleared = fullRows.length * N + fullCols.length * N
      bumpScore(40 + cleared)
      const clearedGrid = clearLines(nextGrid, fullRows, fullCols)
      setGrid(clearedGrid)
      // Level up every ~260 points
      const nextLevel = 1 + Math.floor((score + 40 + cleared) / 260)
      if (nextLevel !== level) {
        setLevel(nextLevel)
        onLevel(nextLevel)
      }
      // Remove pop flags shortly after (CSS anim)
      window.setTimeout(() => {
        setGrid((g) => g.map((row) => row.map((c) => ({ filled: c.filled, color: c.color }))))
      }, 260)
    } else {
      setGrid(nextGrid)
    }
  }

  useEffect(() => {
    if (!shape) return
    const onMove = (e: PointerEvent) => {
      if (paused || dead) return
      setHoverCell(getCellFromPointer(e.clientX, e.clientY))
    }
    const onUp = (e: PointerEvent) => {
      if (paused || dead) return
      const cell = getCellFromPointer(e.clientX, e.clientY)
      if (cell && shape && canPlace(grid, shape, cell)) {
        play('block.place')
        const nextGrid = place(grid, shape, cell)
        bumpScore(shape.cells.length * 6 + level * 2)
        setTray((t) => t.filter((s) => s.id !== shape.id))
        setDragId(null)
        setHoverCell(null)
        tryFinishTurn(nextGrid)
      } else {
        setDragId(null)
        setHoverCell(null)
      }
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragId, paused, dead, grid, shape, level, score])

  useEffect(() => {
    // Refill tray if empty
    if (tray.length === 0) setTray(makeShapes(level))
  }, [tray.length, level])

  useEffect(() => {
    // Game over detection: if no shape fits anywhere.
    if (paused) return
    if (dead) return
    if (tray.length === 0) return
    const anyFits = tray.some((s) => {
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (canPlace(grid, s, { x, y })) return true
      return false
    })
    if (!anyFits) {
      setDead(true)
      play('game.over')
      onGameOver(score)
    }
  }, [dead, grid, onGameOver, paused, play, score, tray])

  return (
    <div className="block">
      <div className="block__top">
        <span className="pill pill--subtle">Drag blocks onto the grid</span>
        <span className="pill pill--subtle">Clear rows / columns</span>
        <span className="pill pill--subtle">R = Restart</span>
      </div>

      <div className="block__boardWrap">
        <div ref={boardRef} className="block__board" aria-label="Block puzzle board">
          {grid.map((row, y) =>
            row.map((c, x) => {
              const isHover =
                hoverCell &&
                shape &&
                shape.cells.some((sc) => sc.x + hoverCell.x === x && sc.y + hoverCell.y === y)
              const hoverOk = isHover && validHover
              const hoverBad = isHover && !validHover && dragId
              return (
                <div
                  key={`${x}-${y}`}
                  className={
                    'block__cell ' +
                    (c.filled ? 'block__cell--filled ' : '') +
                    (c.pop ? 'block__cell--pop ' : '') +
                    (hoverOk ? 'block__cell--hoverOk ' : '') +
                    (hoverBad ? 'block__cell--hoverBad ' : '')
                  }
                  style={{ ['--cell' as any]: c.color }}
                />
              )
            }),
          )}
          {dead && (
            <div className="block__overlay">
              <div className="block__overlayCard">
                <h3>Game over</h3>
                <p>No remaining block can fit.</p>
                <button className="btn" onClick={restart}>
                  Restart
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="block__tray" aria-label="Blocks tray">
        {tray.length === 0 ? (
          <div className="block__trayEmpty">Generating blocks…</div>
        ) : (
          tray.map((s) => (
            <motion.button
              key={s.id}
              type="button"
              className={'block__shape ' + (dragId === s.id ? 'block__shape--drag' : '')}
              style={{ ['--shape' as any]: s.color }}
              onPointerDown={(e) => {
                if (paused || dead) return
                ;(e.currentTarget as HTMLButtonElement).setPointerCapture(e.pointerId)
                setDragId(s.id)
                play('ui.click')
              }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              aria-label="Drag block"
            >
              <div
                className="block__shapeGrid"
                style={{
                  gridTemplateColumns: `repeat(${Math.max(...s.cells.map((c) => c.x)) + 1}, 14px)`,
                  gridTemplateRows: `repeat(${Math.max(...s.cells.map((c) => c.y)) + 1}, 14px)`,
                }}
              >
                {s.cells.map((c, idx) => (
                  <div key={idx} className="block__shapeCell" style={{ gridColumn: c.x + 1, gridRow: c.y + 1 }} />
                ))}
              </div>
            </motion.button>
          ))
        )}
      </div>
    </div>
  )
}

