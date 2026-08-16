import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { OrderRow } from '../types/order'

/**
 * Polls get_guest_order() every 15s.
 *
 * Realtime is deliberately not used here: guests no longer have a SELECT policy on
 * `orders` (that policy leaked every customer's name, phone and address to anyone),
 * and Realtime delivers rows through RLS. Access is now proven with the per-order
 * token instead, which Realtime cannot carry — so the status is polled.
 */
const POLL_MS = 15_000

export function useOrderTracking(orderId: string | undefined, token: string | undefined) {
  const [order, setOrder] = useState<OrderRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const fetchOrder = useCallback(async () => {
    if (!orderId || !token) {
      setLoading(false)
      setNotFound(true)
      return
    }

    const { data, error } = await supabase.rpc('get_guest_order', {
      p_order_id: orderId,
      p_token: token,
    })

    if (error || !data) {
      setNotFound(true)
      setOrder(null)
    } else {
      setOrder(data as unknown as OrderRow)
      setNotFound(false)
    }
    setLoading(false)
  }, [orderId, token])

  useEffect(() => {
    // Nothing to poll for: the home screen mounts this hook unconditionally to
    // check whether this device has a recent order, and most of the time it
    // doesn't. Without this guard that ticks a no-op re-render every 15s.
    if (!orderId || !token) {
      setLoading(false)
      setNotFound(true)
      setOrder(null)
      return
    }

    setLoading(true)
    fetchOrder()
    const interval = setInterval(fetchOrder, POLL_MS)
    return () => clearInterval(interval)
  }, [fetchOrder, orderId, token])

  return { order, loading, notFound, refresh: fetchOrder }
}
