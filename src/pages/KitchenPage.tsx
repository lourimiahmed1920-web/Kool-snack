import { useAuth } from '../contexts/AuthContext'
import { useOrders } from '../hooks/useOrders'
import type { OrderStatus } from '../types/order'

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
        <ul className="time-entry-list" style={{ maxWidth: 640 }}>
          {activeOrders.map((order) => {
            const action = NEXT_ACTION[order.status]
            return (
              <li key={order.id} className="time-entry" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <span className="time-entry__date">{timeFormat.format(new Date(order.created_at))}</span>
                  <span className="time-entry__meta">{currency.format(order.total_amount)}</span>
                </div>
                <span className="time-entry__meta">
                  {order.order_items.map((item) => `${item.quantity}× ${item.menu_items?.name ?? '?'}`).join(', ')}
                </span>
                {order.notes && <span className="time-entry__meta">{order.notes}</span>}
                {action && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ alignSelf: 'flex-start', marginTop: 8 }}
                    onClick={() => updateStatus(order.id, action.next)}
                  >
                    {action.label}
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <button type="button" className="cart-line__remove" onClick={signOut} style={{ marginTop: 24 }}>
        Abmelden
      </button>
    </main>
  )
}
