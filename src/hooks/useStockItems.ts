import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { ExpiryStatus, StockItem } from '../types/stock'

const URGENCY: Record<ExpiryStatus, number> = {
  expired: 0,
  expiring_soon: 1,
  valid: 2,
  none: 3,
}

export function useStockItems(restaurantId: string | null | undefined) {
  const [items, setItems] = useState<StockItem[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    if (!restaurantId) {
      setItems([])
      setLoading(false)
      return
    }
    setLoading(true)
    const { data } = await supabase
      .from('stock_items_with_status')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('name')
    const sorted = ((data ?? []) as StockItem[]).sort(
      (a, b) => URGENCY[a.expiry_status] - URGENCY[b.expiry_status],
    )
    setItems(sorted)
    setLoading(false)
  }, [restaurantId])

  useEffect(() => {
    reload()
  }, [reload])

  return { items, loading, reload }
}
