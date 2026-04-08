import { useMemo, useState } from 'react'
import { GameLayout } from '../components/GameLayout'
import { BubbleShooterGame } from '../games/bubbles/BubbleShooterGame'
import { useProfile } from '../providers/ProfileProvider'

export function BubbleShooterPage() {
  const { addScore, getHighScore, profile } = useProfile()
  const hi = getHighScore('bubble-shooter')
  const [score, setScore] = useState(0)
  const [paused, setPaused] = useState(false)
  const [seed, setSeed] = useState(1)

  const subtitle = useMemo(
    () => 'Aim, bounce, and match 3 to pop bubbles into neon particles.',
    [],
  )

  return (
    <GameLayout
      title="Bubble Shooter: Prism Pop"
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
      <BubbleShooterGame
        key={seed}
        paused={paused}
        onScore={setScore}
        onGameOver={(final) => addScore({ gameId: 'bubble-shooter', name: profile.name, score: final })}
      />
    </GameLayout>
  )
}

