import { useState, type FormEvent } from 'react'
import { LayoutDashboard, Users, ChefHat, QrCode, Timer } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { toUserMessage } from '../lib/errors'
import { useAuth } from '../contexts/AuthContext'
import { useTeam } from '../hooks/useTeam'
import { STAFF_ROLE_LABELS, type StaffRole } from '../types/staff'
import { StaffLayout, type StaffNavItem } from '../components/StaffLayout'

const NAV: StaffNavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, to: '/staff/admin' },
  { key: 'team', label: 'Team', icon: Users, to: '/staff/team', active: true },
  { key: 'kueche', label: 'Küchenansicht', icon: ChefHat, to: '/kueche' },
  { key: 'display', label: 'Anzeige Eingang', icon: QrCode, to: '/staff/pointage-display' },
  { key: 'pointage', label: 'Meine Zeiterfassung', icon: Timer, to: '/staff/pointage' },
]

export function StaffTeamPage() {
  const { profile } = useAuth()
  const { team, loading, reload: loadTeam } = useTeam(profile?.restaurant_id)

  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState<StaffRole>('mitarbeiter')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [created, setCreated] = useState<{ email: string; tempPassword: string } | null>(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    setCreated(null)

    const { data, error: invokeError } = await supabase.functions.invoke('create-staff-account', {
      body: { email, fullName, phone: phone || undefined, role },
    })

    if (invokeError) {
      setError(toUserMessage(invokeError, 'Account konnte nicht erstellt werden.'))
    } else if (data?.error) {
      setError(data.error)
    } else {
      setCreated(data)
      setEmail('')
      setFullName('')
      setPhone('')
      setRole('mitarbeiter')
      await loadTeam()
    }
    setSubmitting(false)
  }

  return (
    <StaffLayout pageTitle="Team" nav={NAV}>
      {loading && <p className="menu-state">Lädt…</p>}

      {!loading && (
        <ul className="staff-card-list">
          {team.map((member) => (
            <li key={member.id} className="card staff-card staff-card--row">
              <div>
                <span className="staff-card__title">{member.full_name ?? '(kein Name)'}</span>
                <span className="staff-card__meta"> · {STAFF_ROLE_LABELS[member.role as StaffRole] ?? member.role}</span>
                <span className={`badge ${member.is_active ? 'badge-success' : 'badge-danger'}`}>
                  {member.is_active ? 'Aktiv' : 'Inaktiv'}
                </span>
              </div>
              {member.phone && <span className="staff-card__meta">{member.phone}</span>}
            </li>
          ))}
        </ul>
      )}

      <h3 className="staff-section-title">Mitarbeiter hinzufügen</h3>

      <form className="checkout-form" onSubmit={handleSubmit}>
        <label className="checkout-form__field">
          Name
          <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </label>
        <label className="checkout-form__field">
          E-Mail
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="checkout-form__field">
          Telefon (optional)
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </label>
        <label className="checkout-form__field">
          Rolle
          <select value={role} onChange={(e) => setRole(e.target.value as StaffRole)}>
            <option value="mitarbeiter">Mitarbeiter</option>
            <option value="kueche">Küche</option>
            <option value="manager">Manager</option>
          </select>
        </label>

        {error && <p className="menu-state menu-state--error">{error}</p>}

        {created && (
          <p className="menu-state menu-state--success">
            Account erstellt für {created.email}. Temporäres Passwort: <strong>{created.tempPassword}</strong>
            <br />
            Bitte sicher an die Person weitergeben — es wird hier nicht erneut angezeigt.
          </p>
        )}

        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Wird erstellt…' : 'Account erstellen'}
        </button>
      </form>
    </StaffLayout>
  )
}
