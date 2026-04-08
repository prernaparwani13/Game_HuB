import React, { createContext, useContext, useMemo, useRef, useState } from 'react'
import { Howl } from 'howler'
import { loadJson, saveJson } from '../lib/storage'

type AudioContextValue = {
  enabled: boolean
  toggle: () => void
  play: (name: SfxName, opts?: { volume?: number; rate?: number }) => void
  setMusic: (on: boolean) => void
  musicOn: boolean
}

export type SfxName =
  | 'ui.hover'
  | 'ui.click'
  | 'game.over'
  | 'game.start'
  | 'snake.eat'
  | 'quiz.correct'
  | 'quiz.wrong'
  | 'bubble.pop'
  | 'runner.jump'
  | 'block.place'

const AudioContext = createContext<AudioContextValue | null>(null)

const STORAGE_ENABLED = 'mini-game-hub.audio.enabled'
const STORAGE_MUSIC = 'mini-game-hub.audio.musicOn'

// Tiny inline synthesized-ish beeps (no asset files required).
// These are short base64 WAVs (very small) to keep this project self-contained.
// If you later add real audio files, just swap these URLs.
const WAV_BEEP_A =
  'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA='
const WAV_BEEP_B =
  'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA='

function buildSfx() {
  const mk = (src: string, volume: number) =>
    new Howl({ src: [src], volume, preload: true, html5: false })

  // Note: placeholders are silent micro-wavs; this keeps the wiring ready.
  return {
    'ui.hover': mk(WAV_BEEP_A, 0.08),
    'ui.click': mk(WAV_BEEP_A, 0.12),
    'game.over': mk(WAV_BEEP_B, 0.18),
    'game.start': mk(WAV_BEEP_A, 0.12),
    'snake.eat': mk(WAV_BEEP_A, 0.12),
    'quiz.correct': mk(WAV_BEEP_A, 0.14),
    'quiz.wrong': mk(WAV_BEEP_B, 0.14),
    'bubble.pop': mk(WAV_BEEP_A, 0.12),
    'runner.jump': mk(WAV_BEEP_A, 0.12),
    'block.place': mk(WAV_BEEP_A, 0.12),
  } satisfies Record<SfxName, Howl>
}

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState(() => loadJson<boolean>(STORAGE_ENABLED, true))
  const [musicOn, setMusicOnState] = useState(() => loadJson<boolean>(STORAGE_MUSIC, false))
  const sfxRef = useRef<Record<SfxName, Howl> | null>(null)
  const musicRef = useRef<Howl | null>(null)

  if (!sfxRef.current) sfxRef.current = buildSfx()

  const toggle = () => {
    const next = !enabled
    setEnabled(next)
    saveJson(STORAGE_ENABLED, next)
  }

  const play: AudioContextValue['play'] = (name, opts) => {
    if (!enabled) return
    const h = sfxRef.current?.[name]
    if (!h) return
    if (opts?.volume != null) h.volume(opts.volume)
    if (opts?.rate != null) h.rate(opts.rate)
    h.play()
  }

  const setMusic = (on: boolean) => {
    setMusicOnState(on)
    saveJson(STORAGE_MUSIC, on)
    if (!on) {
      musicRef.current?.stop()
      return
    }
    if (!enabled) return
    // Minimal ambient loop placeholder.
    if (!musicRef.current) {
      musicRef.current = new Howl({
        src: [WAV_BEEP_A],
        loop: true,
        volume: 0.03,
      })
    }
    musicRef.current.play()
  }

  const value = useMemo(
    () => ({ enabled, toggle, play, setMusic, musicOn }),
    [enabled, musicOn],
  )

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>
}

export function useAudio() {
  const ctx = useContext(AudioContext)
  if (!ctx) throw new Error('useAudio must be used within AudioProvider')
  return ctx
}

