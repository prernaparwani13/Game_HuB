import { useMemo, useState } from 'react'
import type { GameId } from '../providers/ProfileProvider'
import { useProfile } from '../providers/ProfileProvider'

const games: { id: GameId; label: string }[] = [
  { id: 'snake', label: 'Snake' },
  { id: 'block-puzzle', label: 'Block Puzzle' },
  { id: 'endless-runner', label: 'Endless Runner' },
  { id: 'math-quiz', label: 'Math Quiz' },
  { id: 'bubble-shooter', label: 'Bubble Shooter' },
]

export function LeaderboardPage() {
  const { getLeaderboard, clearScores } = useProfile()
  const [gameId, setGameId] = useState<GameId>('snake')

  const rows = useMemo(() => getLeaderboard(gameId), [gameId, getLeaderboard])

  return (
    <div className="container">
      <div className="leader">
        <div className="leader__head">
          <div>
            <h2 className="page-title">Leaderboard</h2>
            <p className="page-sub">Local top scores (saved in your browser).</p>
          </div>
          <div className="leader__controls">
            <select
              className="select"
              value={gameId}
              onChange={(e) => setGameId(e.target.value as GameId)}
              aria-label="Select game leaderboard"
            >
              {games.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.label}
                </option>
              ))}
            </select>
            <button className="btn btn--danger" onClick={clearScores}>
              Clear
            </button>
          </div>
        </div>

        <div className="table">
          <div className="table__row table__row--head">
            <div>#</div>
            <div>Player</div>
            <div className="table__right">Score</div>
            <div className="table__muted">When</div>
          </div>
          {rows.length === 0 ? (
            <div className="table__empty">No scores yet. Play a game and finish a run.</div>
          ) : (
            rows.map((r, idx) => (
              <div key={r.createdAt + ':' + idx} className="table__row">
                <div className="table__muted">{idx + 1}</div>
                <div className="table__player">{r.name}</div>
                <div className="table__right">
                  <span className="pill">{r.score.toLocaleString()}</span>
                </div>
                <div className="table__muted">{new Date(r.createdAt).toLocaleString()}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

