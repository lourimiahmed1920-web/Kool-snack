import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { haptic } from '../lib/native'

interface AppBarProps {
  title: string
  /** Route to fall back to when there is no history to pop (deep link / cold start). */
  back?: string
  trailing?: ReactNode
  /** Renders the bar transparent until the page is scrolled — used over hero imagery. */
  transparent?: boolean
}

/**
 * The single top bar for every screen. It is sticky rather than fixed so content
 * doesn't need a matching top offset, and it carries the top safe-area inset
 * itself — under Capacitor's edge-to-edge WebView nothing else does.
 */
export function AppBar({ title, back, trailing, transparent }: AppBarProps) {
  const navigate = useNavigate()

  const goBack = () => {
    haptic('light')
    // A deep-linked or cold-started screen has no in-app history to pop, which
    // would otherwise walk the user out of the app.
    if (window.history.state?.idx > 0) navigate(-1)
    else navigate(back ?? '/')
  }

  return (
    <header className={`app-bar${transparent ? ' app-bar--transparent' : ''}`}>
      <div className="app-bar__row">
        {back ? (
          <button type="button" className="app-bar__icon-btn" onClick={goBack} aria-label="Zurück">
            <ChevronLeft size={24} />
          </button>
        ) : (
          <span className="app-bar__spacer" aria-hidden="true" />
        )}

        <h1 className="app-bar__title">{title}</h1>

        <span className="app-bar__trailing">{trailing}</span>
      </div>
    </header>
  )
}
