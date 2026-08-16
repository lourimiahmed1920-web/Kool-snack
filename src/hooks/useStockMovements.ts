import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { StockMovement } from '../types/stock'

const RECENT_PER_ITEM = 5

/** Recent stock_movements for the given items, grouped by stock_item_id (most recent first). Pass a memoized `itemIds`. */
export function useStockMovements(itemIds: string[]) {
  const [byItem, setByItem] = useState<Record<string, StockMovement[]>>({})

  const reload = useCallback(async () => {
    if (itemIds.length === 0) {
      setByItem({})
      return
    }
    const { data } = await supabase
      .from('stock_movements')
      .select('*')
      .in('stock_item_id', itemIds)
      .order('created_at', { ascending: false })

    const grouped: Record<string, StockMovement[]> = {}
    for (const movement of (data ?? []) as StockMovement[]) {
      const list = grouped[movement.stock_item_id] ?? []
      if (list.length < RECENT_PER_ITEM) list.push(movement)
      grouped[movement.stock_item_id] = list
    }
    setByItem(grouped)
  }, [itemIds])

  useEffect(() => {
    reload()
  }, [reload])

  return { movementsByItem: byItem, reloadMovements: reload }
}
