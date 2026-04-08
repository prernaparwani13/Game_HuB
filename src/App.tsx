import { Navigate, Route, Routes } from 'react-router-dom'
import { Navbar } from './components/Navbar'
import { HomePage } from './pages/HomePage'
import { SnakePage } from './pages/SnakePage'
import { BlockPuzzlePage } from './pages/BlockPuzzlePage'
import { EndlessRunnerPage } from './pages/EndlessRunnerPage'
import { MathQuizPage } from './pages/MathQuizPage'
import { BubbleShooterPage } from './pages/BubbleShooterPage'
import { LeaderboardPage } from './pages/LeaderboardPage'

export default function App() {
  return (
    <div className="app">
      <div className="bg-orbs" aria-hidden="true" />
      <Navbar />
      <main className="main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/games/snake" element={<SnakePage />} />
          <Route path="/games/block-puzzle" element={<BlockPuzzlePage />} />
          <Route path="/games/endless-runner" element={<EndlessRunnerPage />} />
          <Route path="/games/math-quiz" element={<MathQuizPage />} />
          <Route path="/games/bubble-shooter" element={<BubbleShooterPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}
