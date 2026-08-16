import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import type { StaffRole } from '../types/staff'

const STAFF_ROLES: StaffRole[] = ['inhaber', 'manager', 'mitarbeiter', 'kueche']

interface ProtectedRouteProps {
  children: ReactNode
  /** Defaults to any staff role (inhaber/manager/mitarbeiter/kueche) — customer accounts are never allowed here. */
  allowedRoles?: StaffRole[]
}

export function ProtectedRoute({ children, allowedRoles = STAFF_ROLES }: ProtectedRouteProps) {
  const { session, profile, loading } = useAuth()
  const location = useLocation()

  if (loading) return <p className="menu-state">Lädt…</p>

  if (!session || !profile) {
    return <Navigate to="/staff/login" state={{ from: location.pathname + location.search }} replace />
  }

  if (!allowedRoles.includes(profile.role as StaffRole)) {
    return <p className="menu-state menu-state--error">Kein Zugriff für deine Rolle.</p>
  }

  return <>{children}</>
}
