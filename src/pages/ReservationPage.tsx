import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { CalendarCheck, Minus, Plus } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { toUserMessage } from '../lib/errors'
import { dateTimeFormat } from '../lib/format'
import { haptic } from '../lib/native'

/** Local date (not UTC) — a UTC-based value would block "today" for users ahead of UTC. */
function todayIso(): string {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10)
}

const MAX_PARTY_SIZE = 20

interface ReservationPageProps {
  restaurantId?: string
}

interface Confirmation {
  reservationTime: string
  partySize: number
  name: string
}

/**
 * Guest table booking. Inserts into `reservations` directly (guest INSERT is
 * allowed by policy); guests deliberately cannot read reservations back, which is
 * why the confirmation is rendered from local state rather than re-fetched.
 */
export function ReservationPage({ restaurantId }: ReservationPageProps) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [partySize, setPartySize] = useState(2)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!restaurantId || !date || !time) return

    setSubmitting(true)
    setError(null)

    const reservationTime = new Date(`${date}T${time}`).toISOString()

    const { error: insertError } = await supabase.from('reservations').insert({
      restaurant_id: restaurantId,
      customer_id: null,
      guest_name: name,
      guest_phone: phone,
      party_size: partySize,
      reservation_time: reservationTime,
      notes: notes || null,
    })

    if (insertError) {
      haptic('error')
      setError(toUserMessage(insertError, 'Reservierung konnte nicht gesendet werden. Bitte versuche es erneut.'))
    } else {
      haptic('success')
      setConfirmation({ reservationTime, partySize, name })
      setDate('')
      setTime('')
      setNotes('')
    }
    setSubmitting(false)
  }

  if (confirmation) {
    return (
      <div className="screen">
        <div className="empty-state">
          <span className="empty-state__icon empty-state__icon--success">
            <CalendarCheck size={28} />
          </span>
          <h2 className="empty-state__title">Danke, {confirmation.name}!</h2>
          <p className="empty-state__text">
            Tisch für {confirmation.partySize} {confirmation.partySize === 1 ? 'Person' : 'Personen'} am{' '}
            {dateTimeFormat.format(new Date(confirmation.reservationTime))}. Wir bestätigen dir die Reservierung
            telefonisch, sobald möglich.
          </p>
          <button type="button" className="btn btn-primary" onClick={() => setConfirmation(null)}>
            Weitere Reservierung
          </button>
          <Link to="/" className="btn btn-secondary">
            Zur Startseite
          </Link>
        </div>
      </div>
    )
  }

  return (
    <form className="screen screen--with-action screen--form" onSubmit={handleSubmit}>
      <section className="form-section">
        <h2 className="form-section__title">Wann möchtest du kommen?</h2>

        <div className="field-row">
          <label className="field">
            Datum
            <input
              type="date"
              required
              min={todayIso()}
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </label>
          <label className="field">
            Uhrzeit
            <input type="time" required value={time} onChange={(event) => setTime(event.target.value)} />
          </label>
        </div>

        {/* A stepper rather than a number input: party size is a small integer and
            tapping beats summoning a numeric keyboard for it. */}
        <div className="field">
          Personenanzahl
          <div className="party-size">
            <button
              type="button"
              className="stepper__btn"
              onClick={() => {
                haptic('light')
                setPartySize((size) => Math.max(1, size - 1))
              }}
              disabled={partySize <= 1}
              aria-label="Weniger Personen"
            >
              <Minus size={16} />
            </button>
            <span className="party-size__value" aria-live="polite">
              {partySize}
            </span>
            <button
              type="button"
              className="stepper__btn"
              onClick={() => {
                haptic('light')
                setPartySize((size) => Math.min(MAX_PARTY_SIZE, size + 1))
              }}
              disabled={partySize >= MAX_PARTY_SIZE}
              aria-label="Mehr Personen"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      </section>

      <section className="form-section">
        <h2 className="form-section__title">Deine Kontaktdaten</h2>

        <label className="field">
          Name
          <input
            type="text"
            required
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <label className="field">
          Telefon
          <input
            type="tel"
            required
            autoComplete="tel"
            inputMode="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
        </label>
        <label className="field">
          Hinweis (optional)
          <textarea rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} />
        </label>
      </section>

      {error && <p className="screen-state screen-state--error">{error}</p>}

      <div className="action-bar">
        <button type="submit" className="btn btn-primary action-bar__button" disabled={submitting || !restaurantId}>
          {submitting ? 'Wird gesendet…' : 'Tisch reservieren'}
        </button>
      </div>
    </form>
  )
}
