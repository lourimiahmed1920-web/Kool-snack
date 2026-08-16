import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Utensils, ShoppingBag, Bike } from 'lucide-react'
import { useCart } from '../contexts/CartContext'
import { supabase } from '../lib/supabase'
import { saveLastOrder } from '../lib/orderTracking'
import { toUserMessage } from '../lib/errors'
import { currency } from '../lib/format'
import { haptic } from '../lib/native'
import { CLOSED_MESSAGE, formatHours, type ServiceHours } from '../lib/openingHours'
import { useIsOpen } from '../hooks/useIsOpen'
import type { OrderType } from '../types/order'

interface CheckoutPageProps {
  restaurantId?: string
  hours: ServiceHours
  timeZone?: string | null
}

const ORDER_TYPES: { value: OrderType; label: string; Icon: typeof Utensils }[] = [
  { value: 'dine_in', label: 'Vor Ort', Icon: Utensils },
  { value: 'pickup', label: 'Abholung', Icon: ShoppingBag },
  { value: 'delivery', label: 'Lieferung', Icon: Bike },
]

/**
 * Step two of checkout: how and who. Placing the order goes through the
 * `create_guest_order()` RPC — never a direct insert. Postgres reads every price
 * itself, so nothing this form sends about money is trusted, and the guest INSERT
 * policies on `orders`/`order_items` were dropped so the RPC can't be bypassed.
 */
export function CheckoutPage({ restaurantId, hours, timeZone }: CheckoutPageProps) {
  const { lines, total, clear } = useCart()
  const navigate = useNavigate()
  const isOpen = useIsOpen(hours, timeZone)

  const [orderType, setOrderType] = useState<OrderType>('pickup')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reachable by back-navigation after the cart was emptied or submitted.
  if (lines.length === 0 && !submitting) return <Navigate to="/cart" replace />

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!restaurantId || lines.length === 0) return

    // Re-checked at submit, not just at render: the form can sit open across
    // closing time. This is a UX gate only — see the note in lib/openingHours.
    if (!isOpen) {
      haptic('error')
      setError(`${CLOSED_MESSAGE} Bestellungen nehmen wir täglich von ${formatHours(hours)} Uhr entgegen.`)
      return
    }

    setSubmitting(true)
    setError(null)

    const contactNote = [
      `Name: ${name}`,
      `Telefon: ${phone}`,
      orderType === 'delivery' && address ? `Adresse: ${address}` : null,
      notes ? `Hinweis: ${notes}` : null,
    ]
      .filter(Boolean)
      .join(' | ')

    const { data, error: rpcError } = await supabase.rpc('create_guest_order', {
      p_restaurant_id: restaurantId,
      p_order_type: orderType,
      p_notes: contactNote,
      p_items: lines.map((line) => ({
        menu_item_id: line.menuItemId,
        variant_id: line.variantId,
        quantity: line.quantity,
        option_ids: line.selectedOptions.map((option) => option.optionId),
      })),
    })

    const created = (
      data as { order_id: string; access_token: string; total_amount: number; daily_number: number | null }[] | null
    )?.[0]

    if (rpcError || !created) {
      haptic('error')
      // KS001 is raised deliberately by create_guest_order when the restaurant is
      // closed. It is a user-facing message, so it passes through instead of being
      // replaced by the generic fallback — this is the server-side gate the
      // browser check cannot enforce, and the customer needs to know why.
      const closed = (rpcError as { code?: string } | null)?.code === 'KS001'
      setError(
        closed
          ? `${CLOSED_MESSAGE} Bestellungen nehmen wir täglich von ${formatHours(hours)} Uhr entgegen.`
          : toUserMessage(rpcError, 'Bestellung konnte nicht gesendet werden. Bitte versuche es erneut.'),
      )
      setSubmitting(false)
      return
    }

    haptic('success')
    const confirmedLines = lines
    saveLastOrder({ id: created.order_id, token: created.access_token })
    clear()
    navigate(`/order-confirmed/${created.order_id}?t=${created.access_token}`, {
      replace: true,
      state: {
        orderId: created.order_id,
        lines: confirmedLines,
        total: created.total_amount,
        dailyNumber: created.daily_number,
        orderType,
        name,
      },
    })
  }

  return (
    <form className="screen screen--with-action screen--checkout" onSubmit={handleSubmit}>
      <div className="checkout-fields">
        {!isOpen && (
          <p className="screen-state screen-state--error">
            {CLOSED_MESSAGE} Bestellungen nehmen wir täglich von {formatHours(hours)} Uhr entgegen.
          </p>
        )}

        <section className="form-section">
          <h2 className="form-section__title">Wie möchtest du bestellen?</h2>
          <div className="segmented" role="radiogroup" aria-label="Bestellart">
            {ORDER_TYPES.map(({ value, label, Icon }) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={orderType === value}
                className={`segmented__option${orderType === value ? ' segmented__option--active' : ''}`}
                onClick={() => {
                  haptic('select')
                  setOrderType(value)
                }}
              >
                <Icon size={20} />
                <span>{label}</span>
              </button>
            ))}
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

          {orderType === 'delivery' && (
            <label className="field">
              Lieferadresse
              <input
                type="text"
                required
                autoComplete="street-address"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
              />
            </label>
          )}

          <label className="field">
            Hinweis (optional)
            <textarea rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} />
          </label>
        </section>

        {error && <p className="screen-state screen-state--error">{error}</p>}
      </div>

      {/* Stacked below the form on a phone, sticky beside it from `lg`. */}
      <div className="checkout-aside">
        <div className="summary">
          <h2 className="summary__title">Deine Bestellung</h2>
          <ul className="receipt">
            {lines.map((line) => (
              <li key={line.key} className="receipt__row">
                <span className="receipt__qty">{line.quantity}×</span>
                <span className="receipt__label">
                  {line.name}
                  {line.variantLabel ? ` (${line.variantLabel})` : ''}
                </span>
                <span className="receipt__price">{currency.format(line.unitPrice * line.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="summary__row summary__row--total">
            <span>Gesamt</span>
            <strong>{currency.format(total)}</strong>
          </div>
        </div>

        <div className="action-bar">
          <button
            type="submit"
            className="btn btn-primary action-bar__button"
            disabled={submitting || !restaurantId || !isOpen}
          >
            {submitting ? (
              <span>Wird gesendet…</span>
            ) : !isOpen ? (
              <span>Zurzeit geschlossen</span>
            ) : (
              <>
                <span>Jetzt bestellen</span>
                <span className="action-bar__price">{currency.format(total)}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  )
}
