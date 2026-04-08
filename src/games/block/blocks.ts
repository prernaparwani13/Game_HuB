export type Cell = { x: number; y: number }

export type BlockShape = {
  id: string
  cells: Cell[]
  color: string
}

const COLORS = ['#60a5fa', '#34d399', '#f472b6', '#facc15', '#a78bfa', '#fb7185']

function c(hex: string) {
  return hex
}

export function makeShapes(level: number): BlockShape[] {
  const palette = [...COLORS]
  const pickColor = () => palette[Math.floor(Math.random() * palette.length)]

  const easy: Cell[][] = [
    [{ x: 0, y: 0 }],
    [{ x: 0, y: 0 }, { x: 1, y: 0 }],
    [{ x: 0, y: 0 }, { x: 0, y: 1 }],
    [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
    ],
    [
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: 2 },
    ],
    [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
    ],
  ]
  const mid: Cell[][] = [
    [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 0, y: 1 },
    ],
    [
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: 2 },
      { x: 1, y: 2 },
    ],
    [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ],
    [
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
    ],
  ]
  const hard: Cell[][] = [
    [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
    ],
    [
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 1, y: 2 },
    ],
    [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 3, y: 0 },
    ],
    [
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: 2 },
      { x: 0, y: 3 },
    ],
  ]

  const pool = level <= 2 ? easy : level <= 5 ? easy.concat(mid) : easy.concat(mid).concat(hard)
  const count = 3
  return Array.from({ length: count }).map((_, i) => {
    const cells = pool[Math.floor(Math.random() * pool.length)]
    return { id: `shape-${Date.now()}-${i}`, cells, color: c(pickColor()) }
  })
}

