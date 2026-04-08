import { motion } from 'framer-motion'
import { useProfile } from '../providers/ProfileProvider'
import { useAudio } from '../providers/AudioProvider'

export function ProfileChip() {
  const { profile, setName } = useProfile()
  const { play } = useAudio()

  return (
    <motion.label
      className="profile"
      whileHover={{ y: -1 }}
      onMouseEnter={() => play('ui.hover')}
    >
      <span className="profile__badge" aria-hidden="true">
        {profile.name.slice(0, 1).toUpperCase()}
      </span>
      <input
        className="profile__name"
        value={profile.name}
        onChange={(e) => setName(e.target.value)}
        aria-label="Profile name"
        spellCheck={false}
      />
      <span className="profile__score" title="Total score">
        {profile.totalScore.toLocaleString()}
      </span>
    </motion.label>
  )
}

