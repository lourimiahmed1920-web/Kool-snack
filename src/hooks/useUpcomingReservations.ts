import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export interface ReservationSummary {
  id: string
  guest_name: string
  guest_phone: string
  reservation_time: string
  party_size: number
  status: string
}

export function useUpcomingReservations(restaurantId: string | null | undefined) {
  const [reservations, setReservations] = useState<ReservationSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!restaurantId) {
      setReservations([])
      setLoading(false)
      return
    }
    let cancelled = false

    supabase
      .from('reservations')
      .select('id, guest_name, guest_phone, reservation_time, party_size, status')
      .eq('restaurant_id', restaurantId)
      .gte('reservation_time', new Date().toISOString())
      .order('reservation_time', { ascending: true })
      .limit(20)
      .then(({ data }) => {
        if (cancelled) return
        setReservations((data ?? []) as ReservationSummary[])
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [restaurantId])

  return { reservations, loading }
}
