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
  order_type: OrderType
  status: OrderStatus
  total_amount: number
  notes: string | null
  created_at: string
  order_items: OrderItemRow[]
}
