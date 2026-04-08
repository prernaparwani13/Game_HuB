import { motion } from 'framer-motion'
import { NavLink, Link, useLocation } from 'react-router-dom'
import { ThemeToggle } from './ThemeToggle'
import { SoundToggle } from './SoundToggle'
import { ProfileChip } from './ProfileChip'
import { useAudio } from '../providers/AudioProvider'

const navItems = [
  { to: '/', label: 'Hub' },
  { to: '/leaderboard', label: 'Leaderboard' },
] as const

export function Navbar() {
  const { play } = useAudio()
  const loc = useLocation()

  return (
    <header className="nav">
      <div className="nav__inner">
        <Link
          to="/"
          className="brand"
          onMouseEnter={() => play('ui.hover')}
          onClick={() => play('ui.click')}
        >
          <span className="brand__mark" aria-hidden="true">
            FB
          </span>
          <span className="brand__text">FunBurst</span>
        </Link>

        <nav className="nav__links" aria-label="Primary">
          {navItems.map((i) => (
            <NavLink
              key={i.to}
              to={i.to}
              className={({ isActive }) =>
                'nav__link ' + (isActive ? 'nav__link--active' : '')
              }
              onMouseEnter={() => play('ui.hover')}
              onClick={() => play('ui.click')}
            >
              {i.label}
            </NavLink>
          ))}
          <motion.div
            className="nav__pulse"
            key={loc.pathname}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
          />
        </nav>

        <div className="nav__right">
          <ProfileChip />
          <SoundToggle />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}

