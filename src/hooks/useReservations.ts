import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { toUserMessage } from '../lib/errors'

export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed'

export interface Reservation {
  id: string
  guest_name: string
  guest_phone: string
  reservation_time: string
  party_size: number
  status: ReservationStatus
  notes: string | null
}

export function useReservations(restaurantId: string | null | undefined) {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    if (!restaurantId) {
      setReservations([])
      setLoading(false)
      return
    }
    setLoading(true)
    const { data } = await supabase
      .from('reservations')
      .select('id, guest_name, guest_phone, reservation_time, party_size, status, notes')
      .eq('restaurant_id', restaurantId)
      .order('reservation_time', { ascending: true })
      .limit(100)
    setReservations((data ?? []) as Reservation[])
    setLoading(false)
  }, [restaurantId])

  useEffect(() => {
    reload()
  }, [reload])

  const updateStatus = async (id: string, status: ReservationStatus) => {
    await supabase.from('reservations').update({ status }).eq('id', id)
    await reload()
  }

  const createReservation = async (input: {
    guest_name: string
    guest_phone: string
    reservation_time: string
    party_size: number
    notes: string | null
  }) => {
    if (!restaurantId) return { error: 'Kein Restaurant zugeordnet.' }
    const { error } = await supabase
      .from('reservations')
      .insert({ ...input, restaurant_id: restaurantId, status: 'confirmed' })
    if (!error) await reload()
    // Rendered in ReservationsSection — same rule as everywhere else: log the
    // real Postgres error, show a safe German one.
    return { error: error ? toUserMessage(error, 'Reservierung konnte nicht angelegt werden.') : null }
  }

  return { reservations, loading, updateStatus, createReservation }
}
