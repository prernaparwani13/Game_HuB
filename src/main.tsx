import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './providers/ThemeProvider'
import { AudioProvider } from './providers/AudioProvider'
import { ProfileProvider } from './providers/ProfileProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <AudioProvider>
        <ProfileProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </ProfileProvider>
      </AudioProvider>
    </ThemeProvider>
  </StrictMode>,
)
