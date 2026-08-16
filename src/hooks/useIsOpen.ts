import { useEffect, useState } from 'react'
import { DEFAULT_TIME_ZONE, isOpenNow, type ServiceHours } from '../lib/openingHours'

/** How often to re-check. Fine-grained enough that closing time takes effect promptly. */
const TICK_MS = 30_000

/**
 * Whether the restaurant is currently taking orders, re-evaluated on a timer.
 *
 * The timer matters: a customer who opens the cart at 21:58 and takes five
 * minutes to fill in their details must be stopped at checkout, not allowed
 * through on a stale value computed at mount.
 */
export function useIsOpen(hours: ServiceHours, timeZone: string | null | undefined): boolean {
  const zone = timeZone || DEFAULT_TIME_ZONE
  const { openMinute, closeMinute } = hours
  const [open, setOpen] = useState(() => isOpenNow(hours, zone))

  useEffect(() => {
    // Depend on the primitives, not the object: a fresh { openMinute, closeMinute }
    // identity on every render would restart the interval each time.
    const current = { openMinute, closeMinute }
    setOpen(isOpenNow(current, zone))
    const id = setInterval(() => setOpen(isOpenNow(current, zone)), TICK_MS)
    return () => clearInterval(id)
  }, [openMinute, closeMinute, zone])

  return open
}
