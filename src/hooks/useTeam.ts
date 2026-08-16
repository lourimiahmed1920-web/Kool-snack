import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { StaffProfile } from '../types/staff'

export function useTeam(restaurantId: string | null | undefined) {
  const [team, setTeam] = useState<StaffProfile[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    if (!restaurantId) {
      setTeam([])
      setLoading(false)
      return
    }
    setLoading(true)
    const { data } = await supabase.from('profiles').select('*').eq('restaurant_id', restaurantId).order('role')
    setTeam((data ?? []) as StaffProfile[])
    setLoading(false)
  }, [restaurantId])

  useEffect(() => {
    reload()
  }, [reload])

  return { team, loading, reload }
}
