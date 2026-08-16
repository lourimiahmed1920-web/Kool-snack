import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

/**
 * The admin dashboard reads its KPIs straight from the three summary views —
 * `operations_summary_today`, `attendance_summary_today` and `stock_summary` —
 * rather than pulling raw rows and recomputing totals in the browser. The views
 * are the single source of truth for these numbers.
 */
export interface OperationsSummary {
  orders_today: number
  revenue_today: number
  active_orders: number
  reservations_today: number
}

export interface AttendanceSummary {
  employees_present_today: number
  currently_working: number
  hours_worked_today: number
}

export interface StockSummary {
  total_active_items: number
  low_stock_count: number
  out_of_stock_count: number
  total_stock_value: number
}

const EMPTY_OPERATIONS: OperationsSummary = {
  orders_today: 0,
  revenue_today: 0,
  active_orders: 0,
  reservations_today: 0,
}
const EMPTY_ATTENDANCE: AttendanceSummary = {
  employees_present_today: 0,
  currently_working: 0,
  hours_worked_today: 0,
}
const EMPTY_STOCK: StockSummary = {
  total_active_items: 0,
  low_stock_count: 0,
  out_of_stock_count: 0,
  total_stock_value: 0,
}

export function useDashboardSummary(restaurantId: string | null | undefined) {
  const [operations, setOperations] = useState<OperationsSummary>(EMPTY_OPERATIONS)
  const [attendance, setAttendance] = useState<AttendanceSummary>(EMPTY_ATTENDANCE)
  const [stock, setStock] = useState<StockSummary>(EMPTY_STOCK)
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    if (!restaurantId) {
      setOperations(EMPTY_OPERATIONS)
      setAttendance(EMPTY_ATTENDANCE)
      setStock(EMPTY_STOCK)
      setLoading(false)
      return
    }

    setLoading(true)
    const [operationsRes, attendanceRes, stockRes] = await Promise.all([
      supabase.from('operations_summary_today').select('*').eq('restaurant_id', restaurantId).maybeSingle(),
      supabase.from('attendance_summary_today').select('*').eq('restaurant_id', restaurantId).maybeSingle(),
      supabase.from('stock_summary').select('*').eq('restaurant_id', restaurantId).maybeSingle(),
    ])

    // A view returns no row when there is no activity yet — that means zero, not an error.
    setOperations((operationsRes.data as OperationsSummary | null) ?? EMPTY_OPERATIONS)
    setAttendance((attendanceRes.data as AttendanceSummary | null) ?? EMPTY_ATTENDANCE)
    setStock((stockRes.data as StockSummary | null) ?? EMPTY_STOCK)
    setLoading(false)
  }, [restaurantId])

  useEffect(() => {
    reload()
  }, [reload])

  return { operations, attendance, stock, loading, reload }
}
