import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Self-hosted so the app has no font request to make at startup — a Google
// Fonts <link> would leave a native launch on a slow/absent connection rendering
// in the fallback face, or not at all.
import '@fontsource-variable/inter'
import './index.css'
import App from './App.tsx'
import { initNativeShell } from './lib/native.ts'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// After mount, so the splash covers the first paint rather than a blank root.
void initNativeShell()
