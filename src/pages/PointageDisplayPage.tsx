import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { supabase } from '../lib/supabase'
import { toUserMessage } from '../lib/errors'

interface PointageDisplayPageProps {
  restaurantId?: string
}

interface TokenState {
  token: string
  expiresInSeconds: number
  fetchedAt: number
}

const REFRESH_INTERVAL_MS = 30_000

export function PointageDisplayPage({ restaurantId }: PointageDisplayPageProps) {
  const [state, setState] = useState<TokenState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    if (!restaurantId) return
    let cancelled = false

    async function fetchToken() {
      const { data, error: invokeError } = await supabase.functions.invoke('generate-clock-token', {
        body: { restaurantId },
      })

      if (cancelled) return

      if (invokeError || !data?.token) {
        setError(toUserMessage(invokeError, 'QR-Code konnte nicht geladen werden.'))
        return
      }

      setError(null)
      setState({ token: data.token, expiresInSeconds: data.expiresInSeconds, fetchedAt: Date.now() })
    }

    fetchToken()
    const interval = setInterval(fetchToken, REFRESH_INTERVAL_MS)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [restaurantId])

  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(tick)
  }, [])

  const qrUrl = state ? `${window.location.origin}/staff/pointage?token=${state.token}` : null
  const secondsLeft = state
    ? Math.max(0, state.expiresInSeconds - Math.floor((now - state.fetchedAt) / 1000))
    : null

  return (
    <main className="pointage-display-page">
      <h1 className="pointage-display-page__title">Ein- / Ausstempeln</h1>
      <p className="pointage-display-page__hint">Scanne den QR-Code mit deinem Handy</p>

      {error && <p className="menu-state menu-state--error">{error}</p>}

      {qrUrl && (
        <div className="pointage-display-page__qr">
          <QRCodeSVG value={qrUrl} size={320} level="M" marginSize={2} />
        </div>
      )}

      {secondsLeft != null && (
        <p className="pointage-display-page__countdown">Aktualisiert in {secondsLeft}s</p>
      )}
    </main>
  )
}
