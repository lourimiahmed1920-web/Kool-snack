import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export interface TimeEntryWithHours {
  id: string
  profile_id: string
  restaurant_id: string
  clock_in: string
  clock_out: string | null
  method: string | null
  break_minutes: number | null
  worked_minutes: number | null
}

/** Admin attendance detail table: reads the time_entries_with_hours view for one restaurant/day, not client-computed. */
export function useTimeEntriesForDate(restaurantId: string | null | undefined, dateStr: string) {
  const [entries, setEntries] = useState<TimeEntryWithHours[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    if (!restaurantId) {
      setEntries([])
      setLoading(false)
      return
    }
    setLoading(true)

    const startOfDay = new Date(`${dateStr}T00:00:00`)
    const endOfDay = new Date(`${dateStr}T00:00:00`)
    endOfDay.setDate(endOfDay.getDate() + 1)

    const { data } = await supabase
      .from('time_entries_with_hours')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .gte('clock_in', startOfDay.toISOString())
      .lt('clock_in', endOfDay.toISOString())
      .order('clock_in', { ascending: false })

    setEntries((data ?? []) as TimeEntryWithHours[])
    setLoading(false)
  }, [restaurantId, dateStr])

  useEffect(() => {
    reload()
  }, [reload])

  return { entries, loading, reload }
}
