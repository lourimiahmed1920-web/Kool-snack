import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { LogOut, MoreHorizontal } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { BottomSheet } from './BottomSheet'
import { STAFF_ROLE_LABELS, type StaffRole } from '../types/staff'
import logo from '../assets/kool-snack-logo.webp'

export interface StaffNavItem {
  key: string
  label: string
  icon: LucideIcon
  to?: string
  onClick?: () => void
  active?: boolean
}

interface StaffLayoutProps {
  pageTitle: string
  nav: StaffNavItem[]
  children: React.ReactNode
}

// inhaber/manager land on the full dashboard; mitarbeiter/kueche get the reduced one and
// are blocked by ProtectedRoute from /staff/admin, so the brand link must route accordingly.
const HOME_BY_ROLE: Record<StaffRole, string> = {
  inhaber: '/staff/admin',
  manager: '/staff/admin',
  mitarbeiter: '/staff/dashboard',
  kueche: '/staff/dashboard',
}

/** Bottom bar capacity, leaving the fifth slot for "Mehr". */
const MAX_BAR_TABS = 4

/**
 * Shell for every back-office screen. Two genuinely different layouts, not one
 * responsive layout: a persistent sidebar where there's room for it, and a
 * bottom tab bar on a phone — which is where most of this actually gets used,
 * standing in a kitchen.
 */
export function StaffLayout({ pageTitle, nav, children }: StaffLayoutProps) {
  const { profile, signOut } = useAuth()
  const isCompact = useMediaQuery('(max-width: 820px)')
  const [moreOpen, setMoreOpen] = useState(false)

  const home = HOME_BY_ROLE[profile?.role as StaffRole] ?? '/staff/login'
  const roleLabel = STAFF_ROLE_LABELS[profile?.role as StaffRole] ?? 'Team'

  // In-page tabs come first; links to other routes are secondary by nature and
  // are the first thing pushed into the "Mehr" sheet.
  const tabs = nav.filter((item) => !item.to)
  const links = nav.filter((item) => item.to)
  const barTabs = tabs.slice(0, MAX_BAR_TABS)
  const overflow = [...tabs.slice(MAX_BAR_TABS), ...links]

  const renderNavItem = (item: StaffNavItem, className: string, onNavigate?: () => void) => {
    const Icon = item.icon
    const classes = `${className}${item.active ? ' active' : ''}`

    if (item.to) {
      return (
        <Link key={item.key} to={item.to} className={classes} onClick={onNavigate}>
          <Icon />
          <span>{item.label}</span>
        </Link>
      )
    }
    return (
      <button
        key={item.key}
        type="button"
        className={classes}
        onClick={() => {
          item.onClick?.()
          onNavigate?.()
        }}
      >
        <Icon />
        <span>{item.label}</span>
      </button>
    )
  }

  if (isCompact) {
    return (
      <div className="staff-shell staff-shell--compact">
        <header className="staff-appbar">
          <h1 className="staff-appbar__title">{pageTitle}</h1>
          <span className="staff-appbar__role">{roleLabel}</span>
        </header>

        <div className="staff-content staff-content--compact">{children}</div>

        <nav className="staff-tabbar" aria-label="Bereiche">
          {barTabs.map((item) => renderNavItem(item, 'staff-tab'))}

          {overflow.length > 0 && (
            <button
              type="button"
              className={`staff-tab${moreOpen ? ' active' : ''}`}
              onClick={() => setMoreOpen(true)}
            >
              <MoreHorizontal />
              <span>Mehr</span>
            </button>
          )}
        </nav>

        {moreOpen && (
          <BottomSheet title="Mehr" subtitle={profile?.full_name ?? 'Team'} onClose={() => setMoreOpen(false)}>
            <div className="staff-more">
              {overflow.map((item) => renderNavItem(item, 'staff-more__item', () => setMoreOpen(false)))}
              <button type="button" className="staff-more__item staff-more__item--danger" onClick={signOut}>
                <LogOut />
                <span>Abmelden</span>
              </button>
            </div>
          </BottomSheet>
        )}
      </div>
    )
  }

  return (
    <div className="staff-shell">
      <aside className="staff-sidebar">
        <Link to={home} className="staff-sidebar__brand">
          <img src={logo} alt="" />
          <div>
            <div className="staff-sidebar__brand-name">Kool Snack</div>
            <div className="staff-sidebar__role">{roleLabel}</div>
          </div>
        </Link>

        <nav className="staff-sidebar__nav">{nav.map((item) => renderNavItem(item, 'staff-nav-item'))}</nav>

        <div className="staff-sidebar__footer">
          <div className="staff-sidebar__user">{profile?.full_name ?? 'Team'}</div>
          <button type="button" className="staff-nav-item" onClick={signOut}>
            <LogOut />
            <span>Abmelden</span>
          </button>
        </div>
      </aside>

      <div className="staff-main">
        <header className="staff-topbar">
          <h1>{pageTitle}</h1>
        </header>
        <div className="staff-content">{children}</div>
      </div>
    </div>
  )
}
