import { useMemo, useState } from 'react'
import { GameLayout } from '../components/GameLayout'
import { SnakeGame } from '../games/snake/SnakeGame'
import { useProfile } from '../providers/ProfileProvider'

export function SnakePage() {
  const { addScore, getHighScore, profile } = useProfile()
  const hi = getHighScore('snake')
  const [score, setScore] = useState(0)
  const [paused, setPaused] = useState(false)
  const [seed, setSeed] = useState(1)

  const subtitle = useMemo(
    () => 'Eat to grow, chain power-ups, and survive the speed ramp.',
    [],
  )

  return (
    <GameLayout
      title="Snake: Neon Rush"
      subtitle={subtitle}
      score={score}
      highScore={hi}
      paused={paused}
      onTogglePause={() => setPaused((p) => !p)}
      onRestart={() => {
        setScore(0)
        setPaused(false)
        setSeed((s) => s + 1)
      }}
    >
      <SnakeGame
        key={seed}
        paused={paused}
        onScore={setScore}
        onGameOver={(final) => {
          addScore({ gameId: 'snake', name: profile.name, score: final })
        }}
      />
    </GameLayout>
  )
}

