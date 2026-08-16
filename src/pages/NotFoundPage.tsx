import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'

/**
 * Catch-all route. It matters more in the native shell than on the web: a
 * mistyped deep link (or an old push/QR link) lands here instead of on a blank
 * screen with no way back, since there is no browser chrome to escape with.
 */
export function NotFoundPage() {
  return (
    <div className="screen">
      <div className="empty-state">
        <span className="empty-state__icon">
          <Compass size={28} />
        </span>
        <h2 className="empty-state__title">Seite nicht gefunden</h2>
        <p className="empty-state__text">Dieser Link führt ins Leere.</p>
        <Link to="/" className="btn btn-primary">
          Zur Startseite
        </Link>
      </div>
    </div>
  )
}
