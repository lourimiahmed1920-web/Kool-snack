import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useOrders } from '../hooks/useOrders'
import { formatOrderNumber } from '../lib/orderStatus'
import { CreateOrderPanel } from './CreateOrderPanel'
import type { OrderStatus } from '../types/order'

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Neu',
  confirmed: 'Bestätigt',
  preparing: 'In Zubereitung',
  ready: 'Fertig',
  completed: 'Abgeschlossen',
  cancelled: 'Storniert',
}

const ORDER_TYPE_LABELS: Record<string, string> = {
  dine_in: 'Vor Ort',
  pickup: 'Abholung',
  delivery: 'Lieferung',
}

const currency = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' })
const dateTimeFormat = new Intl.DateTimeFormat('de-DE', { dateStyle: 'short', timeStyle: 'short' })

interface OrdersSectionProps {
  restaurantId: string | null | undefined
}

export function OrdersSection({ restaurantId }: OrdersSectionProps) {
  const { profile } = useAuth()
  const { orders, loading, updateStatus, reload } = useOrders(restaurantId)
  const [creating, setCreating] = useState(false)
  // Matches the "Staff can create orders" RLS policy: inhaber/manager/mitarbeiter, not kueche.
  const canCreateOrders =
    profile?.role === 'inhaber' || profile?.role === 'manager' || profile?.role === 'mitarbeiter'

  return (
    <div>
      <div className="staff-section-header">
        <h3 className="staff-section-title">Bestellungen</h3>
        {canCreateOrders && !creating && (
          <button type="button" className="btn btn-primary" onClick={() => setCreating(true)}>
            <Plus size={16} />
            Neue Bestellung
          </button>
        )}
      </div>

      {creating && (
        <CreateOrderPanel
          restaurantId={restaurantId}
          onClose={() => setCreating(false)}
          onCreated={() => {
            setCreating(false)
            reload()
          }}
        />
      )}

      {loading && <p className="menu-state">Lädt…</p>}
      {!loading && orders.length === 0 && <p className="menu-state">Keine Bestellungen.</p>}

      {!loading && orders.length > 0 && (
        <ul className="staff-card-list">
          {orders.map((order) => (
            <li key={order.id} className="card staff-card">
              <div className="staff-card__head">
                <span className="order-number">{formatOrderNumber(order.daily_number)}</span>
                <span className="staff-card__time">{dateTimeFormat.format(new Date(order.created_at))}</span>
                <span className="staff-card__meta">
                  {ORDER_TYPE_LABELS[order.order_type] ?? order.order_type} · {currency.format(order.total_amount)}
                </span>
              </div>
              <span className="staff-card__body">
                {order.order_items.map((item) => `${item.quantity}× ${item.menu_items?.name ?? '?'}`).join(', ')}
              </span>
              {order.notes && <span className="staff-card__meta">{order.notes}</span>}
              <div className="field">
                <select
                  value={order.status}
                  aria-label="Status der Bestellung"
                  onChange={(e) => updateStatus(order.id, e.target.value as OrderStatus)}
                >
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
