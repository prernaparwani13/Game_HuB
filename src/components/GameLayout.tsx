import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAudio } from '../providers/AudioProvider'

export function GameLayout({
  title,
  subtitle,
  score,
  highScore,
  paused,
  onTogglePause,
  onRestart,
  started,
  onStart,
  children,
  right,
}: {
  title: string
  subtitle: string
  score: number
  highScore: number
  paused: boolean
  onTogglePause: () => void
  onRestart: () => void
  started?: boolean
  onStart?: () => void
  children: React.ReactNode
  right?: React.ReactNode
}) {
  const { play } = useAudio()
  const showStart = typeof onStart === 'function' && started === false
  return (
    <div className="container">
      <div className="game-head">
        <div className="game-head__left">
          <div className="game-head__title-row">
            <h2 className="game-title">{title}</h2>
            <span className="pill pill--subtle">HI {highScore.toLocaleString()}</span>
          </div>
          <p className="game-subtitle">{subtitle}</p>
          <div className="game-actions">
            <Link className="btn btn--ghost" to="/" onMouseEnter={() => play('ui.hover')}>
              Back to hub
            </Link>
            {showStart ? (
              <motion.button
                type="button"
                className="btn"
                onClick={() => {
                  play('ui.click')
                  onStart()
                }}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
              >
                Start
              </motion.button>
            ) : (
              <motion.button
                type="button"
                className="btn"
                onClick={() => {
                  play('ui.click')
                  onTogglePause()
                }}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
              >
                {paused ? 'Resume' : 'Pause'}
              </motion.button>
            )}
            <motion.button
              type="button"
              className="btn btn--danger"
              onClick={() => {
                play('ui.click')
                onRestart()
              }}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
            >
              Restart
            </motion.button>
          </div>
        </div>

        <div className="game-head__right">
          <div className="hud">
            <div className="hud__item">
              <span className="hud__label">Score</span>
              <span className="hud__value">{score.toLocaleString()}</span>
            </div>
            {right}
          </div>
        </div>
      </div>

      <div className="panel">{children}</div>
    </div>
  )
}

