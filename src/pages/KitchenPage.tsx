import { useAuth } from '../contexts/AuthContext'
import { useOrders } from '../hooks/useOrders'
import type { OrderStatus } from '../types/order'
import { formatOrderNumber } from '../lib/orderStatus'

const currency = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' })
const timeFormat = new Intl.DateTimeFormat('de-DE', { timeStyle: 'short' })

const ACTIVE_STATUSES: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'ready']

const NEXT_ACTION: Partial<Record<OrderStatus, { next: OrderStatus; label: string }>> = {
  pending: { next: 'preparing', label: 'In Zubereitung' },
  confirmed: { next: 'preparing', label: 'In Zubereitung' },
  preparing: { next: 'ready', label: 'Fertig' },
  ready: { next: 'completed', label: 'Abgeschlossen' },
}

export function KitchenPage() {
  const { profile, signOut } = useAuth()
  const { orders, loading, updateStatus } = useOrders(profile?.restaurant_id)
  const activeOrders = orders
    .filter((order) => ACTIVE_STATUSES.includes(order.status))
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  return (
    <main className="kitchen-page">
      <h2>Küche</h2>

      {loading && <p className="menu-state">Lädt…</p>}
      {!loading && activeOrders.length === 0 && <p className="menu-state">Keine offenen Bestellungen.</p>}

      {!loading && activeOrders.length > 0 && (
        <ul className="staff-card-list">
          {activeOrders.map((order) => {
            const action = NEXT_ACTION[order.status]
            return (
              <li key={order.id} className="card staff-card">
                <div className="staff-card__head">
                  <span className="order-number">{formatOrderNumber(order.daily_number)}</span>
                  <span className="staff-card__time">{timeFormat.format(new Date(order.created_at))}</span>
                  <span className="staff-card__meta">{currency.format(order.total_amount)}</span>
                </div>
                <span className="staff-card__body">
                  {order.order_items.map((item) => `${item.quantity}× ${item.menu_items?.name ?? '?'}`).join(', ')}
                </span>
                {order.notes && <span className="staff-card__meta">{order.notes}</span>}
                {/*
                  Primary, by the documented exception in Design.md: advancing an
                  order is the only thing this screen exists to do, so it keeps the
                  solid CTA even though that means one per open order.
                */}
                {action && (
                  <div className="staff-card__actions">
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => updateStatus(order.id, action.next)}
                    >
                      {action.label}
                    </button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <button type="button" className="btn btn-secondary kitchen-page__signout" onClick={signOut}>
        Abmelden
      </button>
    </main>
  )
}
