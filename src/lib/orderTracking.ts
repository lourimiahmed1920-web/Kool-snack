const STORAGE_KEY = 'kool-snack-last-order'

export interface TrackedOrder {
  id: string
  /** Per-order secret from create_guest_order(); without it the order can't be read back. */
  token: string
}

/** Guest checkout has no accounts, so this is how a customer finds their way back to an order. */
export function saveLastOrder(order: TrackedOrder) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(order))
  } catch {
    // localStorage unavailable (private browsing etc.) — the "Meine Bestellung" link just won't show.
  }
}

export function getLastOrder(): TrackedOrder | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<TrackedOrder>
    return parsed.id && parsed.token ? { id: parsed.id, token: parsed.token } : null
  } catch {
    return null
  }
}
