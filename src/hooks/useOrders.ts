import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { OrderRow, OrderStatus } from '../types/order'

const ORDER_SELECT = 'id, order_type, status, total_amount, notes, created_at, order_items(id, quantity, unit_price, notes, menu_items(name))'

export function useOrders(restaurantId: string | null | undefined) {
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    if (!restaurantId) {
      setOrders([])
      setLoading(false)
      return
    }
    const { data } = await supabase
      .from('orders')
      .select(ORDER_SELECT)
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false })
      .limit(50)
    setOrders((data ?? []) as unknown as OrderRow[])
    setLoading(false)
  }, [restaurantId])

  useEffect(() => {
    reload()
  }, [reload])

  useEffect(() => {
    if (!restaurantId) return

    const channel = supabase
      .channel(`orders-${restaurantId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${restaurantId}` },
        () => reload(),
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, () => reload())
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [restaurantId, reload])

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    await supabase.from('orders').update({ status }).eq('id', orderId)
  }

  return { orders, loading, reload, updateStatus }
}
