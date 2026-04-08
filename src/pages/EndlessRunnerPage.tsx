import { useMemo, useState } from 'react'
import { GameLayout } from '../components/GameLayout'
import { EndlessRunnerGame } from '../games/runner/EndlessRunnerGame'
import { useProfile } from '../providers/ProfileProvider'

export function EndlessRunnerPage() {
  const { addScore, getHighScore, profile } = useProfile()
  const hi = getHighScore('endless-runner')
  const [score, setScore] = useState(0)
  const [paused, setPaused] = useState(false)
  const [started, setStarted] = useState(false)
  const [seed, setSeed] = useState(1)

  const subtitle = useMemo(
    () => 'Jump over neon hazards. Speed ramps forever. How far can you go?',
    [],
  )

  return (
    <GameLayout
      title="Endless Runner: Sky Dash"
      subtitle={subtitle}
      score={score}
      highScore={hi}
      paused={paused}
      onTogglePause={() => setPaused((p) => !p)}
      started={started}
      onStart={() => {
        setStarted(true)
        setPaused(false)
      }}
      onRestart={() => {
        setScore(0)
        setPaused(false)
        setStarted(false)
        setSeed((s) => s + 1)
      }}
    >
      <EndlessRunnerGame
        key={seed}
        paused={paused}
        started={started}
        onScore={setScore}
        onGameOver={(final) => addScore({ gameId: 'endless-runner', name: profile.name, score: final })}
      />
    </GameLayout>
  )
}

