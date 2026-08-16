import { Link, NavLink, useLocation } from 'react-router-dom'
import { Home, UtensilsCrossed, ShoppingBag, CalendarClock } from 'lucide-react'
import { useCart } from '../contexts/CartContext'
import { haptic } from '../lib/native'
import logo from '../assets/kool-snack-logo.webp'

const TABS = [
  { to: '/', label: 'Start', Icon: Home, match: (path: string) => path === '/' },
  { to: '/menu', label: 'Karte', Icon: UtensilsCrossed, match: (path: string) => path.startsWith('/menu') },
  { to: '/cart', label: 'Warenkorb', Icon: ShoppingBag, match: (path: string) => path === '/cart' },
  {
    to: '/reservierung',
    label: 'Reservieren',
    Icon: CalendarClock,
    match: (path: string) => path === '/reservierung',
  },
] as const

/**
 * Primary navigation. One component, two presentations, switched in CSS at the
 * `lg` breakpoint: a fixed bottom tab bar on phones and tablets (and therefore
 * always in the native app), a sticky top header with the brand on desktop —
 * a bottom tab bar stretched across a 1920px window is the clearest possible
 * sign that a site is just a phone layout that never grew up.
 *
 * The brand link is always rendered and hidden below `lg`; keeping the markup
 * identical avoids a re-render on every resize past the breakpoint.
 */
export function TabBar() {
  const { itemCount } = useCart()
  const { pathname } = useLocation()

  return (
    <nav className="tab-bar" aria-label="Hauptnavigation">
      <div className="tab-bar__inner">
        <Link to="/" className="tab-bar__brand">
          <img src={logo} alt="" className="tab-bar__logo" />
          <span>Kool Snack</span>
        </Link>

        <div className="tab-bar__tabs">
          {TABS.map(({ to, label, Icon, match }) => {
            const active = match(pathname)
            return (
              <NavLink
                key={to}
                to={to}
                className={`tab-bar__tab${active ? ' tab-bar__tab--active' : ''}`}
                aria-current={active ? 'page' : undefined}
                onClick={() => haptic('select')}
              >
                <span className="tab-bar__icon">
                  <Icon size={22} strokeWidth={active ? 2.4 : 1.9} />
                  {to === '/cart' && itemCount > 0 && (
                    <span className="tab-bar__badge" aria-label={`${itemCount} Artikel`}>
                      {itemCount > 99 ? '99+' : itemCount}
                    </span>
                  )}
                </span>
                <span className="tab-bar__label">{label}</span>
              </NavLink>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
