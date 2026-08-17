import { useState } from 'react'
import { useTeam } from '../hooks/useTeam'
import { useTimeEntriesForDate } from '../hooks/useTimeEntriesForDate'

const timeFormat = new Intl.DateTimeFormat('de-DE', { timeStyle: 'short' })

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function formatWorkedMinutes(minutes: number | null): string {
  if (minutes == null) return '–'
  const rounded = Math.max(0, Math.round(minutes))
  return `${Math.floor(rounded / 60)}h ${rounded % 60}min`
}

interface TeamTimeSectionProps {
  restaurantId: string | null | undefined
}

export function TeamTimeSection({ restaurantId }: TeamTimeSectionProps) {
  const [date, setDate] = useState(todayIso)
  const { team } = useTeam(restaurantId)
  const { entries, loading } = useTimeEntriesForDate(restaurantId, date)

  return (
    <div>
      <div className="staff-section-header">
        <h3 className="staff-section-title">Zeiterfassung</h3>
        <div className="staff-filter">
          <div className="field">
            <input
              type="date"
              value={date}
              max={todayIso()}
              aria-label="Tag auswählen"
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {loading && <p className="menu-state">Lädt…</p>}
      {!loading && entries.length === 0 && <p className="menu-state">Keine Einträge an diesem Tag.</p>}

      {!loading && entries.length > 0 && (
        <ul className="staff-card-list">
          {entries.map((entry) => {
            const member = team.find((m) => m.id === entry.profile_id)
            return (
              <li key={entry.id} className="card staff-card staff-card--row">
                <div>
                  <span className="staff-card__title">{member?.full_name ?? 'Unbekannt'}</span>
                  <span className="staff-card__meta">
                    {' '}
                    · {timeFormat.format(new Date(entry.clock_in))}
                    {entry.clock_out ? ` – ${timeFormat.format(new Date(entry.clock_out))}` : ' – läuft'}
                  </span>
                </div>
                <span className="staff-card__meta">{formatWorkedMinutes(entry.worked_minutes)}</span>
              </li>
            )
          })}
        </ul>
      )}

      <p className="staff-note">
        Verspätungen und Anwesenheitsquote sind noch nicht verfügbar — dafür wird eine
        Schichtplan-Funktion benötigt, die es noch nicht gibt.
      </p>
    </div>
  )
}
