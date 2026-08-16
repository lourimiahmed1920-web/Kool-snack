import type { OrderStatus, OrderType } from '../types/order'

/**
 * Customer-facing progress. `cancelled` is deliberately absent — it is an exit,
 * not a step, and every consumer renders it as its own state.
 */
export const STATUS_STEPS: { status: OrderStatus; label: string; hint: string }[] = [
  { status: 'pending', label: 'Bestellt', hint: 'Wir haben deine Bestellung erhalten.' },
  { status: 'confirmed', label: 'Bestätigt', hint: 'Die Küche hat die Bestellung angenommen.' },
  { status: 'preparing', label: 'In Zubereitung', hint: 'Dein Essen wird frisch zubereitet.' },
  { status: 'ready', label: 'Bereit', hint: 'Deine Bestellung ist fertig.' },
  { status: 'completed', label: 'Abgeschlossen', hint: 'Guten Appetit!' },
]

export const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  dine_in: 'Vor Ort',
  pickup: 'Abholung',
  delivery: 'Lieferung',
}

/** Index of the current step, or -1 for `cancelled` (which is not on the track). */
export function stepIndex(status: OrderStatus): number {
  return STATUS_STEPS.findIndex((step) => step.status === status)
}

/** True while an order is still worth surfacing on the home screen. */
export function isOrderActive(status: OrderStatus): boolean {
  return status !== 'completed' && status !== 'cancelled'
}
