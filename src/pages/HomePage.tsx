import { motion } from 'framer-motion'
import { GameCard, type GameCardConfig } from '../components/GameCard'
import snakeImg from '../assets/card-snake.svg'
import blocksImg from '../assets/card-blocks.svg'
import runnerImg from '../assets/card-runner.svg'
import quizImg from '../assets/card-quiz.svg'
import bubblesImg from '../assets/card-bubbles.svg'

const games: GameCardConfig[] = [
  {
    id: 'snake',
    title: 'Snake: Neon Rush',
    description: 'Classic snake with chaotic power-ups and escalating speed.',
    to: '/games/snake',
    accent: 'linear-gradient(135deg, #22c55e, #60a5fa, #a78bfa)',
    tags: ['Keyboard', 'Power-ups', 'Combo'],
    previewVariant: 'snake',
    imageSrc: snakeImg,
  },
  {
    id: 'block-puzzle',
    title: 'Block Puzzle: Level Grid',
    description: 'Drag, drop, and clear lines with juicy animations.',
    to: '/games/block-puzzle',
    accent: 'linear-gradient(135deg, #f97316, #ec4899, #8b5cf6)',
    tags: ['Drag+Drop', 'Levels', 'Clears'],
    previewVariant: 'blocks',
    imageSrc: blocksImg,
  },
  {
    id: 'endless-runner',
    title: 'Endless Runner: Sky Dash',
    description: 'Jump, dodge, and survive the speed ramp with parallax.',
    to: '/games/endless-runner',
    accent: 'linear-gradient(135deg, #38bdf8, #34d399, #f472b6)',
    tags: ['Jump', 'Parallax', 'Speed+'],
    previewVariant: 'runner',
    imageSrc: runnerImg,
  },
  {
    id: 'math-quiz',
    title: 'Math Quiz: Streak Storm',
    description: 'Real-time scoring with streak multipliers and a timer.',
    to: '/games/math-quiz',
    accent: 'linear-gradient(135deg, #facc15, #fb7185, #60a5fa)',
    tags: ['Timer', 'Streaks', 'Difficulty+'],
    previewVariant: 'quiz',
    imageSrc: quizImg,
  },
  {
    id: 'bubble-shooter',
    title: 'Bubble Shooter: Prism Pop',
    description: 'Aim, bounce, match 3, and explode into particles.',
    to: '/games/bubble-shooter',
    accent: 'linear-gradient(135deg, #a78bfa, #22d3ee, #f97316)',
    tags: ['Aim', 'Match-3', 'Bounces'],
    previewVariant: 'bubbles',
    imageSrc: bubblesImg,
  },
]

export function HomePage() {
  return (
    <div className="container">
      <motion.section
        className="hero"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="hero__glass">
          <h1 className="hero__title">FunBurst</h1>
        </div>
      </motion.section>

      <section className="grid">
        {games.map((g, idx) => (
          <motion.div
            key={g.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.06, duration: 0.45 }}
          >
            <GameCard game={g} />
          </motion.div>
        ))}
      </section>
    </div>
  )
}

