import { motion } from 'framer-motion'
import { useAudio } from '../providers/AudioProvider'

export function SoundToggle() {
  const { enabled, toggle, musicOn, setMusic, play } = useAudio()

  return (
    <div className="sound">
      <motion.button
        type="button"
        className="icon-btn"
        aria-label={enabled ? 'Disable sound effects' : 'Enable sound effects'}
        onMouseEnter={() => play('ui.hover')}
        onClick={() => {
          play('ui.click')
          toggle()
        }}
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.98 }}
      >
        <span className="icon-btn__icon" aria-hidden="true">
          {enabled ? 'SFX' : 'SFX×'}
        </span>
      </motion.button>

      <motion.button
        type="button"
        className="icon-btn"
        aria-label={musicOn ? 'Disable music' : 'Enable music'}
        onMouseEnter={() => play('ui.hover')}
        onClick={() => {
          play('ui.click')
          setMusic(!musicOn)
        }}
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.98 }}
      >
        <span className="icon-btn__icon" aria-hidden="true">
          {musicOn ? 'MUSIC' : 'MUSIC×'}
        </span>
      </motion.button>
    </div>
  )
}

