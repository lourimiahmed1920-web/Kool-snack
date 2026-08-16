/**
 * Enforced by the Postgres enum `stock_movement_reason`. Verified against the live
 * database — do not change this list from a document without re-checking `pg_enum`,
 * because sending a value the enum does not know silently breaks every booking.
 */
export type StockMovementReason =
  | 'purchase'
  | 'manual_in'
  | 'sale_consumption'
  | 'waste'
  | 'adjustment'
  | 'return'

export type ExpiryStatus = 'expired' | 'expiring_soon' | 'valid' | 'none'

export interface StockItem {
  id: string
  restaurant_id: string
  name: string
  unit: string
  quantity: number
  low_stock_threshold: number | null
  expiry_date: string | null
  expiry_warning_days: number
  expiry_status: ExpiryStatus
  is_low_stock: boolean
}

export interface StockMovement {
  id: string
  stock_item_id: string
  profile_id: string
  change_amount: number
  reason: StockMovementReason
  note: string | null
  created_at: string
}
