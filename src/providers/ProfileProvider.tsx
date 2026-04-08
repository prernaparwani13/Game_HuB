import React, { createContext, useContext, useMemo, useState } from 'react'
import { loadJson, saveJson } from '../lib/storage'

export type GameId = 'snake' | 'block-puzzle' | 'endless-runner' | 'math-quiz' | 'bubble-shooter'

export type ScoreEntry = {
  gameId: GameId
  name: string
  score: number
  createdAt: number
}

export type Profile = {
  name: string
  totalScore: number
}

type ProfileContextValue = {
  profile: Profile
  setName: (name: string) => void
  addScore: (entry: Omit<ScoreEntry, 'createdAt'>) => void
  getHighScore: (gameId: GameId) => number
  getLeaderboard: (gameId?: GameId) => ScoreEntry[]
  clearScores: () => void
}

const ProfileContext = createContext<ProfileContextValue | null>(null)

const STORAGE_PROFILE = 'mini-game-hub.profile'
const STORAGE_SCORES = 'mini-game-hub.scores'

const DEFAULT_PROFILE: Profile = { name: 'Player', totalScore: 0 }

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile>(() =>
    loadJson<Profile>(STORAGE_PROFILE, DEFAULT_PROFILE),
  )
  const [scores, setScores] = useState<ScoreEntry[]>(() =>
    loadJson<ScoreEntry[]>(STORAGE_SCORES, []),
  )

  const persistProfile = (p: Profile) => {
    setProfile(p)
    saveJson(STORAGE_PROFILE, p)
  }

  const persistScores = (s: ScoreEntry[]) => {
    setScores(s)
    saveJson(STORAGE_SCORES, s as any)
  }

  const setName = (name: string) => {
    persistProfile({ ...profile, name: name.trim() || 'Player' })
  }

  const addScore: ProfileContextValue['addScore'] = (entry) => {
    const createdAt = Date.now()
    const full: ScoreEntry = { ...entry, createdAt }
    const nextScores = [full, ...scores].slice(0, 250)
    persistScores(nextScores)
    persistProfile({ ...profile, totalScore: profile.totalScore + Math.max(0, entry.score) })
  }

  const getHighScore = (gameId: GameId) =>
    scores.filter((s) => s.gameId === gameId).reduce((m, s) => Math.max(m, s.score), 0)

  const getLeaderboard = (gameId?: GameId) => {
    const filtered = gameId ? scores.filter((s) => s.gameId === gameId) : scores
    return [...filtered].sort((a, b) => b.score - a.score).slice(0, 20)
  }

  const clearScores = () => {
    persistScores([])
    persistProfile({ ...profile, totalScore: 0 })
  }

  const value = useMemo(
    () => ({ profile, setName, addScore, getHighScore, getLeaderboard, clearScores }),
    [profile, scores],
  )

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}

export function useProfile() {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider')
  return ctx
}

