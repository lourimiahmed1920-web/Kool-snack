import { useState, type FormEvent } from 'react'
import { useReservations, type ReservationStatus } from '../hooks/useReservations'

const STATUS_LABELS: Record<ReservationStatus, string> = {
  pending: 'Ausstehend',
  confirmed: 'Bestätigt',
  cancelled: 'Storniert',
  completed: 'Abgeschlossen',
}

const dateTimeFormat = new Intl.DateTimeFormat('de-DE', { dateStyle: 'short', timeStyle: 'short' })

interface ReservationsSectionProps {
  restaurantId: string | null | undefined
}

export function ReservationsSection({ restaurantId }: ReservationsSectionProps) {
  const { reservations, loading, updateStatus, createReservation } = useReservations(restaurantId)
  const [dateFilter, setDateFilter] = useState('')

  const visibleReservations = dateFilter
    ? reservations.filter((r) => r.reservation_time.slice(0, 10) === dateFilter)
    : reservations

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [partySize, setPartySize] = useState('2')
  const [notes, setNotes] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault()
    if (!date || !time) return
    setCreating(true)
    setCreateError(null)

    const { error } = await createReservation({
      guest_name: name,
      guest_phone: phone,
      reservation_time: new Date(`${date}T${time}`).toISOString(),
      party_size: Number(partySize),
      notes: notes || null,
    })

    if (error) {
      setCreateError(error)
    } else {
      setName('')
      setPhone('')
      setDate('')
      setTime('')
      setPartySize('2')
      setNotes('')
    }
    setCreating(false)
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <h3 className="staff-section-title" style={{ marginBottom: 0 }}>
          Reservierungen
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
          {dateFilter && (
            <button type="button" className="cart-line__remove" onClick={() => setDateFilter('')}>
              Alle
            </button>
          )}
        </div>
      </div>

      {loading && <p className="menu-state">Lädt…</p>}
      {!loading && visibleReservations.length === 0 && <p className="menu-state">Keine Reservierungen.</p>}

      {!loading && visibleReservations.length > 0 && (
        <ul className="time-entry-list" style={{ maxWidth: 640 }}>
          {visibleReservations.map((reservation) => (
            <li key={reservation.id} className="time-entry" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <span className="time-entry__date">{dateTimeFormat.format(new Date(reservation.reservation_time))}</span>
                <span className="time-entry__meta">
                  {reservation.guest_name} · {reservation.party_size} Personen
                </span>
              </div>
              <span className="time-entry__meta">{reservation.guest_phone}</span>
              {reservation.notes && <span className="time-entry__meta">{reservation.notes}</span>}

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
                <span className="time-entry__meta">{STATUS_LABELS[reservation.status]}</span>
                {reservation.status === 'pending' && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ padding: '6px 14px' }}
                    onClick={() => updateStatus(reservation.id, 'confirmed')}
                  >
                    Bestätigen
                  </button>
                )}
                {(reservation.status === 'pending' || reservation.status === 'confirmed') && (
                  <button
                    type="button"
                    className="cart-line__remove"
                    onClick={() => updateStatus(reservation.id, 'cancelled')}
                  >
                    Stornieren
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <h4 className="staff-section-title">Reservierung hinzufügen</h4>
      <form className="checkout-form" onSubmit={handleCreate} style={{ maxWidth: 460 }}>
        <label className="checkout-form__field">
          Name
          <input type="text" required value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="checkout-form__field">
          Telefon
          <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} />
        </label>
        <label className="checkout-form__field">
          Datum
          <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label className="checkout-form__field">
          Uhrzeit
          <input type="time" required value={time} onChange={(e) => setTime(e.target.value)} />
        </label>
        <label className="checkout-form__field">
          Personenanzahl
          <input type="number" min="1" required value={partySize} onChange={(e) => setPartySize(e.target.value)} />
        </label>
        <label className="checkout-form__field">
          Hinweis (optional)
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
        </label>

        {createError && <p className="menu-state menu-state--error">{createError}</p>}

        <button type="submit" className="btn btn-primary" disabled={creating || !restaurantId}>
          {creating ? 'Wird gespeichert…' : 'Reservierung anlegen'}
        </button>
      </form>
    </div>
  )
}
