import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export interface Restaurant {
  id: string
  name: string
  address: string | null
  phone: string | null
  email: string | null
}

export function useRestaurant(): Restaurant | null {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)

  useEffect(() => {
    let cancelled = false

    supabase
      .from('restaurants')
      .select('id, name, address, phone, email')
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
