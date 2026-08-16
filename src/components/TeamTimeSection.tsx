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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <h3 className="staff-section-title" style={{ marginBottom: 0 }}>
          Zeiterfassung
        </h3>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} max={todayIso()} />
      </div>

      {loading && <p className="menu-state">Lädt…</p>}
      {!loading && entries.length === 0 && <p className="menu-state">Keine Einträge an diesem Tag.</p>}

      {!loading && entries.length > 0 && (
        <ul className="time-entry-list">
          {entries.map((entry) => {
            const member = team.find((m) => m.id === entry.profile_id)
            return (
              <li key={entry.id} className="time-entry">
                <div>
                  <span className="time-entry__date">{member?.full_name ?? 'Unbekannt'}</span>
                  <span className="time-entry__range">
                    {' '}
                    · {timeFormat.format(new Date(entry.clock_in))}
                    {entry.clock_out ? ` – ${timeFormat.format(new Date(entry.clock_out))}` : ' – läuft'}
                  </span>
                </div>
                <div className="time-entry__meta">
                  <span>{formatWorkedMinutes(entry.worked_minutes)}</span>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <p className="menu-state" style={{ fontSize: 12 }}>
        Verspätungen und Anwesenheitsquote sind noch nicht verfügbar — dafür wird eine
        Schichtplan-Funktion benötigt, die es noch nicht gibt.
      </p>
    </div>
  )
}
