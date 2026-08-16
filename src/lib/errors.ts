/**
 * Postgres/Supabase error messages leak internal details (table names, constraint
 * names, policy names) that must never reach a customer. Log the real error for
 * developers, return a safe German message for the UI.
 *
 * Edge Function errors are NOT passed through here: those return deliberate,
 * user-facing strings ("QR-Code abgelaufen", "zu weit entfernt") that should be shown.
 */
export function toUserMessage(error: unknown, fallback = 'Es ist ein Fehler aufgetreten. Bitte versuche es erneut.'): string {
  console.error('[Kool Snack]', error)
  return fallback
}
