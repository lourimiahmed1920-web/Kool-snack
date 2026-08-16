import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { StaffLoginForm } from '../components/StaffLoginForm'
import logo from '../assets/kool-snack-logo.webp'

/**
 * Reached out-of-band (a bookmark or the entrance QR code) — nothing in the
 * customer app links here on purpose, so this screen carries its own branding
 * and safe-area padding rather than sitting inside the customer shell.
 */
export function StaffLoginPage() {
  const { session, profile, loading } = useAuth()
  const location = useLocation()

  if (!loading && session && profile) {
    const defaultPath = profile.role === 'inhaber' || profile.role === 'manager' ? '/staff/admin' : '/staff/dashboard'
    const from = (location.state as { from?: string } | null)?.from ?? defaultPath
    return <Navigate to={from} replace />
  }

  return (
    <main className="staff-auth">
      <div className="staff-auth__card">
        <img src={logo} alt="" className="staff-auth__logo" />
        <h1 className="staff-auth__title">Mitarbeiter-Login</h1>
        <p className="staff-auth__hint">Melde dich mit deinem Team-Konto an.</p>
        <StaffLoginForm />
      </div>
    </main>
  )
}
