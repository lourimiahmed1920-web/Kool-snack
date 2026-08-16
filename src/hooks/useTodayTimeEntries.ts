import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { TimeEntry } from '../types/timeEntry'

export function useTodayTimeEntries(restaurantId: string | null | undefined) {
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!restaurantId) {
      setEntries([])
      setLoading(false)
      return
    }
    let cancelled = false

    async function load() {
      setLoading(true)
      const startOfDay = new Date()
      startOfDay.setHours(0, 0, 0, 0)

      const { data: entryRows } = await supabase
        .from('time_entries')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .gte('clock_in', startOfDay.toISOString())
        .order('clock_in', { ascending: false })

      const ids = (entryRows ?? []).map((e) => e.id)
      const { data: breakRows } =
        ids.length > 0 ? await supabase.from('time_entry_breaks').select('*').in('time_entry_id', ids) : { data: [] }

      if (cancelled) return

      setEntries(
        (entryRows ?? []).map((entry) => ({
          ...entry,
          breaks: (breakRows ?? []).filter((b) => b.time_entry_id === entry.id),
        })),
      )
      setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [restaurantId])

  return { entries, loading }
}
