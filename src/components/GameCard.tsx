import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import type { GameId } from '../providers/ProfileProvider'
import { useProfile } from '../providers/ProfileProvider'
import { useAudio } from '../providers/AudioProvider'

export type GameCardConfig = {
  id: GameId
  title: string
  description: string
  to: string
  accent: string
  tags: string[]
  previewVariant: 'snake' | 'blocks' | 'runner' | 'quiz' | 'bubbles'
  imageSrc: string
}

export function GameCard({ game }: { game: GameCardConfig }) {
  const { getHighScore } = useProfile()
  const { play } = useAudio()
  const hi = getHighScore(game.id)

  return (
    <motion.div
      className="card"
      style={{ ['--accent' as any]: game.accent }}
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 260, damping: 18 }}
      onMouseEnter={() => play('ui.hover')}
    >
      <Link to={game.to} className="card__link" onClick={() => play('ui.click')}>
        <div className="card__top">
          <div className="card__title-row">
            <h3 className="card__title">{game.title}</h3>
            <span className="pill">HI {hi.toLocaleString()}</span>
          </div>
          <p className="card__desc">{game.description}</p>
        </div>

        <div className="card__media" aria-hidden="true">
          <img className="card__img" src={game.imageSrc} alt="" loading="lazy" decoding="async" />
        </div>

        <div className={clsx('preview', `preview--${game.previewVariant}`)} aria-hidden="true">
          <div className="preview__glow" />
          <div className="preview__content" />
        </div>

        <div className="card__bottom">
          <div className="tags">
            {game.tags.map((t) => (
              <span key={t} className="tag">
                {t}
              </span>
            ))}
          </div>
          <span className="card__cta">Play</span>
        </div>
      </Link>
    </motion.div>
  )
}

