import { useEffect } from 'react'
import { Link, useLocation, useParams, useSearchParams, Navigate } from 'react-router-dom'
import { Check, XCircle } from 'lucide-react'
import type { CartLine } from '../types/cart'
import type { OrderStatus, OrderType } from '../types/order'
import { useOrderTracking } from '../hooks/useOrderTracking'
import { getLastOrder, saveLastOrder } from '../lib/orderTracking'
import { ORDER_TYPE_LABELS, STATUS_STEPS, stepIndex } from '../lib/orderStatus'
import { currency } from '../lib/format'

interface ConfirmationState {
  orderId: string
  lines: CartLine[]
  total: number
  orderType: OrderType
  name: string
}

interface DisplayLine {
  key: string
  label: string
  quantity: number
  unitPrice: number
}

/**
 * Live order status. Revisitable, not a one-shot receipt: on a refresh, a closed
 * tab or a direct link there is no router state, so the order is re-fetched by id
 * and polled (see `useOrderTracking` — Realtime can't be used because guests have
 * no SELECT on `orders`; the per-order token is what proves access).
 */
export function OrderConfirmedPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const navState = location.state as ConfirmationState | null

  // The token proves ownership of this order. It arrives in the URL right after
  // checkout; on a later visit we fall back to the copy saved at checkout time.
  const stored = getLastOrder()
  const token = searchParams.get('t') ?? (stored && stored.id === orderId ? stored.token : undefined)

  useEffect(() => {
    if (orderId && token) saveLastOrder({ id: orderId, token })
  }, [orderId, token])

  const { order, loading } = useOrderTracking(orderId, token)

  if (!orderId) return <Navigate to="/" replace />

  if (!token) {
    return (
      <div className="screen">
        <div className="empty-state">
          <h2 className="empty-state__title">Bestellung nicht abrufbar</h2>
          <p className="empty-state__text">
            Dieser Link ist unvollständig. Bitte öffne die Bestellung über den Link, den du nach dem Bestellen
            erhalten hast.
          </p>
          <Link to="/" className="btn btn-primary">
            Zur Startseite
          </Link>
        </div>
      </div>
    )
  }

  const hasCheckoutState = navState?.orderId === orderId

  // While the first poll is in flight we can still render everything from the
  // checkout hand-off, so a fresh order never flashes a loading screen.
  if (loading && !order && !hasCheckoutState) {
    return (
      <div className="screen">
        <p className="screen-state">Bestellung wird geladen…</p>
      </div>
    )
  }

  if (!loading && !order && !hasCheckoutState) {
    return (
      <div className="screen">
        <div className="empty-state">
          <h2 className="empty-state__title">Bestellung nicht gefunden</h2>
          <p className="empty-state__text">Wir konnten diese Bestellung nicht finden.</p>
          <Link to="/" className="btn btn-primary">
            Zur Startseite
          </Link>
        </div>
      </div>
    )
  }

  const status: OrderStatus = order?.status ?? 'pending'
  const orderType: OrderType = order?.order_type ?? navState?.orderType ?? 'pickup'
  const total: number = order?.total_amount ?? navState?.total ?? 0
  const name = hasCheckoutState ? navState.name : null
  const current = stepIndex(status)

  const displayLines: DisplayLine[] = order
    ? order.order_items.map((item) => ({
        key: item.id,
        label: (item.menu_items?.name ?? 'Artikel') + (item.notes ? ` (${item.notes})` : ''),
        quantity: item.quantity,
        unitPrice: item.unit_price,
      }))
    : (navState?.lines ?? []).map((line) => ({
        key: line.key,
        label:
          line.name +
          (line.variantLabel ? ` (${line.variantLabel})` : '') +
          (line.selectedOptions.length > 0
            ? ` – ${line.selectedOptions.map((option) => option.label).join(', ')}`
            : ''),
        quantity: line.quantity,
        unitPrice: line.unitPrice,
      }))

  return (
    <div className="screen">
      <div className="track-head">
        <span className={`track-head__icon${status === 'cancelled' ? ' track-head__icon--cancelled' : ''}`}>
          {status === 'cancelled' ? <XCircle size={28} /> : <Check size={28} />}
        </span>
        <h2 className="track-head__title">
          {status === 'cancelled' ? 'Bestellung storniert' : name ? `Danke, ${name}!` : 'Deine Bestellung'}
        </h2>
        <p className="track-head__meta">
          {ORDER_TYPE_LABELS[orderType]} · Nr. {orderId.slice(0, 8)}
        </p>
      </div>

      {status === 'cancelled' ? (
        <p className="screen-state screen-state--error">
          Diese Bestellung wurde storniert. Bitte melde dich telefonisch bei uns, wenn das unerwartet ist.
        </p>
      ) : (
        <ol className="timeline">
          {STATUS_STEPS.map((step, index) => {
            const done = index < current
            const active = index === current
            return (
              <li
                key={step.status}
                className={`timeline__step${done ? ' timeline__step--done' : ''}${
                  active ? ' timeline__step--active' : ''
                }`}
              >
                <span className="timeline__marker" aria-hidden="true">
                  {done ? <Check size={13} strokeWidth={3} /> : null}
                </span>
                <span className="timeline__body">
                  <span className="timeline__label">{step.label}</span>
                  {active && <span className="timeline__hint">{step.hint}</span>}
                </span>
              </li>
            )
          })}
        </ol>
      )}

      <section className="form-section">
        <h3 className="form-section__title">Deine Artikel</h3>
        <ul className="receipt">
          {displayLines.map((line) => (
            <li key={line.key} className="receipt__row">
              <span className="receipt__qty">{line.quantity}×</span>
              <span className="receipt__label">{line.label}</span>
              <span className="receipt__price">{currency.format(line.unitPrice * line.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="summary">
          <div className="summary__row summary__row--total">
            <span>Gesamt</span>
            <strong>{currency.format(total)}</strong>
          </div>
        </div>
      </section>

      <Link to="/menu" className="btn btn-secondary btn-block">
        Weiter einkaufen
      </Link>
    </div>
  )
}
