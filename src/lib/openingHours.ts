/*
  Service hours — shared by the displayed opening times and the checkout gate,
  so the two can never drift apart.

  The values come from `restaurants.opening_time` / `closing_time`, which means
  the owner can change them from the database without a redeploy. The constants
  below are only a fallback for the moment before that row has loaded.

  This is the *UX* layer. It runs in the browser, so it is bypassed by changing
  the device clock or by calling the RPC directly. The authoritative check lives
  inside `create_guest_order()`, which raises SQLSTATE `KS001` when closed —
  CheckoutPage passes that message straight through.
*/

export interface ServiceHours {
  /** Minutes since local midnight. */
  openMinute: number
  closeMinute: number
}

export const DEFAULT_HOURS: ServiceHours = { openMinute: 12 * 60, closeMinute: 22 * 60 }
export const DEFAULT_TIME_ZONE = 'Europe/Berlin'

/** Parses Postgres `time` ("12:00:00") into minutes; falls back on anything unparseable. */
export function parseHours(open?: string | null, close?: string | null): ServiceHours {
  const toMinutes = (value: string | null | undefined, fallback: number): number => {
    const match = /^(\d{1,2}):(\d{2})/.exec(value ?? '')
    if (!match) return fallback
    return Number(match[1]) * 60 + Number(match[2])
  }
  return {
    openMinute: toMinutes(open, DEFAULT_HOURS.openMinute),
    closeMinute: toMinutes(close, DEFAULT_HOURS.closeMinute),
  }
}

/** "12:00 – 22:00" — derived, so the display can never contradict the gate. */
export function formatHours(hours: ServiceHours = DEFAULT_HOURS): string {
  const fmt = (minutes: number) =>
    `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
  return `${fmt(hours.openMinute)} – ${fmt(hours.closeMinute)}`
}

/**
 * Minutes since midnight *in the restaurant's timezone*, not the visitor's.
 * A customer ordering from another timezone must still be judged against Neuss
 * local time, so this cannot use the raw Date getters.
 */
function localMinutesNow(timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date())

  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? '0')
  const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? '0')
  return hour * 60 + minute
}

/**
 * Whether the kitchen is currently taking orders.
 *
 * Handles a window that wraps past midnight (e.g. 18:00–02:00) as well as a
 * normal one, so changing the hours later cannot silently invert the logic.
 * Mirrors the CASE in `create_guest_order()`.
 */
export function isOpenNow(hours: ServiceHours = DEFAULT_HOURS, timeZone: string = DEFAULT_TIME_ZONE): boolean {
  let now: number
  try {
    now = localMinutesNow(timeZone)
  } catch {
    // Unknown IANA zone — fall back rather than block ordering entirely.
    now = localMinutesNow(DEFAULT_TIME_ZONE)
  }

  const { openMinute, closeMinute } = hours
  return openMinute <= closeMinute
    ? now >= openMinute && now < closeMinute
    : now >= openMinute || now < closeMinute
}

export const CLOSED_MESSAGE = 'Wir haben gerade geschlossen.'
