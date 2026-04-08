import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import { GameLayout } from '../components/GameLayout'
import { useAudio } from '../providers/AudioProvider'
import { useProfile } from '../providers/ProfileProvider'

type Difficulty = 1 | 2 | 3 | 4 | 5

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pickOp(diff: Difficulty) {
  const ops = diff <= 2 ? ['+', '-'] : diff <= 4 ? ['+', '-', '×'] : ['+', '-', '×', '÷']
  return ops[randInt(0, ops.length - 1)] as '+' | '-' | '×' | '÷'
}

function makeQuestion(diff: Difficulty) {
  const op = pickOp(diff)
  const a = randInt(2, 6 + diff * 6)
  const b = randInt(2, 6 + diff * 6)
  if (op === '+') return { text: `${a} + ${b}`, answer: a + b }
  if (op === '-') return { text: `${a} - ${b}`, answer: a - b }
  if (op === '×') return { text: `${a} × ${b}`, answer: a * b }
  // division: keep integer answers
  const ans = randInt(2, 3 + diff * 3)
  const left = ans * b
  return { text: `${left} ÷ ${b}`, answer: ans }
}

export function MathQuizPage() {
  const { addScore, getHighScore, profile } = useProfile()
  const { play } = useAudio()
  const hi = getHighScore('math-quiz')

  const [paused, setPaused] = useState(false)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [mult, setMult] = useState(1)
  const [timeLeft, setTimeLeft] = useState(45)
  const [diff, setDiff] = useState<Difficulty>(1)
  const [q, setQ] = useState(() => makeQuestion(1))
  const [input, setInput] = useState('')
  const [flash, setFlash] = useState<'ok' | 'bad' | null>(null)
  const endedRef = useRef(false)

  const subtitle = useMemo(
    () => 'Answer fast, keep a streak, and watch your multiplier climb.',
    [],
  )

  const restart = () => {
    endedRef.current = false
    setPaused(false)
    setScore(0)
    setStreak(0)
    setMult(1)
    setTimeLeft(45)
    setDiff(1)
    setQ(makeQuestion(1))
    setInput('')
    setFlash(null)
    play('game.start')
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') submit()
      if (e.key === 'Escape') setPaused((p) => !p)
      if (e.key === 'r' || e.key === 'R') restart()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, q, paused, streak, mult, diff, score, timeLeft])

  useEffect(() => {
    if (paused) return
    if (timeLeft <= 0) return
    const id = window.setInterval(() => setTimeLeft((t) => t - 1), 1000)
    return () => window.clearInterval(id)
  }, [paused, timeLeft])

  useEffect(() => {
    if (timeLeft > 0 || endedRef.current) return
    endedRef.current = true
    play('game.over')
    addScore({ gameId: 'math-quiz', name: profile.name, score })
  }, [addScore, play, profile.name, score, timeLeft])

  const bumpDifficulty = (nextStreak: number) => {
    const next = Math.min(5, 1 + Math.floor(nextStreak / 5)) as Difficulty
    setDiff(next)
  }

  const submit = () => {
    if (paused || timeLeft <= 0) return
    const n = Number(input.trim())
    if (!Number.isFinite(n)) return

    if (n === q.answer) {
      play('quiz.correct')
      const nextStreak = streak + 1
      const nextMult = Math.min(8, 1 + Math.floor(nextStreak / 3))
      const gained = 10 * nextMult + diff * 2
      setScore((s) => s + gained)
      setStreak(nextStreak)
      setMult(nextMult)
      bumpDifficulty(nextStreak)
      setFlash('ok')
      setTimeout(() => setFlash(null), 220)
    } else {
      play('quiz.wrong')
      setStreak(0)
      setMult(1)
      setFlash('bad')
      setTimeout(() => setFlash(null), 240)
    }
    const nextDiff = Math.min(5, 1 + Math.floor((n === q.answer ? streak + 1 : 0) / 5)) as Difficulty
    setQ(makeQuestion(nextDiff))
    setInput('')
  }

  return (
    <GameLayout
      title="Math Quiz: Streak Storm"
      subtitle={subtitle}
      score={score}
      highScore={hi}
      paused={paused}
      onTogglePause={() => setPaused((p) => !p)}
      onRestart={restart}
      right={
        <>
          <div className="hud__item">
            <span className="hud__label">Time</span>
            <span className="hud__value">{Math.max(0, timeLeft)}s</span>
          </div>
          <div className="hud__item">
            <span className="hud__label">Streak</span>
            <span className="hud__value">×{mult}</span>
          </div>
          <div className="hud__item">
            <span className="hud__label">Diff</span>
            <span className="hud__value">{diff}</span>
          </div>
        </>
      }
    >
      <div className="quiz">
        <div className="quiz__row">
          <div className="quiz__meta">
            <span className="pill pill--subtle">Enter = Submit</span>
            <span className="pill pill--subtle">Esc = Pause</span>
            <span className="pill pill--subtle">R = Restart</span>
          </div>
        </div>

        <div className="quiz__center">
          <AnimatePresence>
            {timeLeft <= 0 ? (
              <motion.div
                key="end"
                className="quiz__end"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <h3 className="quiz__endTitle">Time!</h3>
                <p className="quiz__endSub">Final score: {score.toLocaleString()}</p>
                <div className="quiz__endActions">
                  <button className="btn" onClick={restart}>
                    Play again
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="play"
                className="quiz__card"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="quiz__q">{q.text}</div>
                <motion.div
                  className="quiz__inputWrap"
                  animate={
                    flash === 'ok'
                      ? { boxShadow: '0 0 0 2px rgba(34,197,94,0.75), 0 18px 40px rgba(0,0,0,0.35)' }
                      : flash === 'bad'
                        ? { boxShadow: '0 0 0 2px rgba(251,113,133,0.78), 0 18px 40px rgba(0,0,0,0.35)' }
                        : { boxShadow: '0 0 0 1px rgba(255,255,255,0.10), 0 18px 40px rgba(0,0,0,0.35)' }
                  }
                  transition={{ duration: 0.16 }}
                >
                  <input
                    className="quiz__input"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') submit()
                    }}
                    inputMode="numeric"
                    placeholder="Type answer…"
                    aria-label="Answer"
                    disabled={paused}
                    autoFocus
                  />
                  <button className="btn" onClick={submit} disabled={paused}>
                    Submit
                  </button>
                </motion.div>
                <div className="quiz__hint">
                  Correct answers boost streak. Wrong answers reset multiplier.
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </GameLayout>
  )
}

