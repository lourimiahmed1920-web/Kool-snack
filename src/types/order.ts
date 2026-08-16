export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled'
export type OrderType = 'dine_in' | 'pickup' | 'delivery'

export interface OrderItemRow {
  id: string
  quantity: number
  unit_price: number
  notes: string | null
  menu_items: { name: string } | null
}

export interface OrderRow {
  id: string
  /**
   * Human-readable per-day sequence, assigned by the trg_orders_daily_number
   * trigger. Nullable only in theory (rows predating the column were
   * backfilled) — treat a missing value as "not numbered" rather than crashing.
   */
  daily_number: number | null
  order_type: OrderType
  status: OrderStatus
  total_amount: number
  notes: string | null
  created_at: string
  order_items: OrderItemRow[]
}
