import { motion } from 'framer-motion'
import { useTheme } from '../providers/ThemeProvider'
import { useAudio } from '../providers/AudioProvider'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const { play } = useAudio()

  return (
    <motion.button
      type="button"
      className="icon-btn"
      aria-label="Toggle theme"
      onMouseEnter={() => play('ui.hover')}
      onClick={() => {
        play('ui.click')
        toggleTheme()
      }}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.98 }}
    >
      <span className="icon-btn__icon" aria-hidden="true">
        {theme === 'dark' ? 'DARK' : 'LIGHT'}
      </span>
    </motion.button>
  )
}

