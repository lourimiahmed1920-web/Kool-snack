import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export interface Restaurant {
  id: string
  name: string
  address: string | null
  phone: string | null
  email: string | null
  /** IANA zone, e.g. Europe/Berlin. Service hours are judged in restaurant-local time. */
  timezone: string | null
  /** Postgres `time` values, e.g. "12:00:00". Editable in the DB without a redeploy. */
  opening_time: string | null
  closing_time: string | null
}

export function useRestaurant(): Restaurant | null {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)

  useEffect(() => {
    let cancelled = false

    supabase
      .from('restaurants')
      .select('id, name, address, phone, email, timezone, opening_time, closing_time')
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled && data) setRestaurant(data)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return restaurant
}
