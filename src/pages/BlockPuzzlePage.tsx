import { useMemo, useState } from 'react'
import { GameLayout } from '../components/GameLayout'
import { BlockPuzzleGame } from '../games/block/BlockPuzzleGame'
import { useProfile } from '../providers/ProfileProvider'

export function BlockPuzzlePage() {
  const { addScore, getHighScore, profile } = useProfile()
  const hi = getHighScore('block-puzzle')
  const [score, setScore] = useState(0)
  const [paused, setPaused] = useState(false)
  const [level, setLevel] = useState(1)
  const [seed, setSeed] = useState(1)

  const subtitle = useMemo(
    () => 'Drag shapes, clear full lines, and climb levels as blocks get spicier.',
    [],
  )

  return (
    <GameLayout
      title="Block Puzzle: Level Grid"
      subtitle={subtitle}
      score={score}
      highScore={hi}
      paused={paused}
      onTogglePause={() => setPaused((p) => !p)}
      onRestart={() => {
        setScore(0)
        setPaused(false)
        setLevel(1)
        setSeed((s) => s + 1)
      }}
      right={
        <div className="hud__item">
          <span className="hud__label">Level</span>
          <span className="hud__value">{level}</span>
        </div>
      }
    >
      <BlockPuzzleGame
        key={seed}
        paused={paused}
        onScore={setScore}
        onLevel={setLevel}
        onGameOver={(final) => addScore({ gameId: 'block-puzzle', name: profile.name, score: final })}
      />
    </GameLayout>
  )
}

