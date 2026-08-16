import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { QrCode, MapPin, CheckCircle2, AlertCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { toUserMessage } from '../lib/errors'
import { getCurrentCoords, GeoError } from '../lib/geo'
import { canScanInApp, extractClockToken, scanQrCode, ScanError } from '../lib/qrScanner'
import { timeFormat } from '../lib/format'
import { haptic } from '../lib/native'

const ACTION_LABELS: Record<string, string> = {
  clock_in: 'Eingestempelt',
  clock_out: 'Ausgestempelt',
}

type Status = 'idle' | 'scanning' | 'locating' | 'submitting' | 'success' | 'error'

interface Result {
  action: string
  timestamp: string
}

/**
 * Personal clock in/out. The geofence *is* the feature — there is deliberately no
 * manual clock button. A token identifies the currently displayed entrance code
 * (single-use, ~45s lifetime) and the edge function checks the caller's position
 * against the restaurant's radius before booking anything.
 */
export function PointagePage() {
  const { profile } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const urlToken = searchParams.get('token')

  const [status, setStatus] = useState<Status>('idle')
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [scannerAvailable, setScannerAvailable] = useState(false)

  useEffect(() => {
    void canScanInApp().then(setScannerAvailable)
  }, [])

  const redeem = useCallback(async (token: string) => {
    setError(null)
    setResult(null)
    setStatus('locating')

    let coords
    try {
      coords = await getCurrentCoords()
    } catch (geoError) {
      haptic('error')
      setStatus('error')
      setError(
        geoError instanceof GeoError
          ? geoError.message
          : 'Standort konnte nicht ermittelt werden. Bitte versuche es erneut.',
      )
      return
    }

    setStatus('submitting')

    const { data, error: invokeError } = await supabase.functions.invoke('redeem-clock-token', {
      body: { token, latitude: coords.latitude, longitude: coords.longitude },
    })

    // The edge function returns deliberate, user-facing German strings
    // ("QR-Code abgelaufen", "zu weit entfernt") — those are shown as-is.
    if (invokeError || data?.error) {
      haptic('error')
      setStatus('error')
      setError(data?.error ?? toUserMessage(invokeError, 'Pointage fehlgeschlagen. Bitte erneut versuchen.'))
      return
    }

    haptic('success')
    setStatus('success')
    setResult({ action: data.action, timestamp: data.timestamp })
  }, [])

  // A token in the URL means the code was scanned with the phone's camera app
  // (the web path). Consume it immediately, then strip it so a refresh doesn't
  // retry an already-used, single-use token.
  useEffect(() => {
    if (!urlToken) return
    setSearchParams({}, { replace: true })
    void redeem(urlToken)
  }, [urlToken, redeem, setSearchParams])

  const handleScan = async () => {
    haptic('light')
    setError(null)
    setStatus('scanning')

    try {
      const scanned = await scanQrCode()
      if (scanned === null) {
        setStatus('idle')
        return
      }

      const token = extractClockToken(scanned)
      if (!token) {
        haptic('error')
        setStatus('error')
        setError('Dieser QR-Code gehört nicht zur Zeiterfassung.')
        return
      }

      await redeem(token)
    } catch (scanError) {
      haptic('error')
      setStatus('error')
      setError(
        scanError instanceof ScanError
          ? scanError.message
          : 'Der Scanner konnte nicht geöffnet werden. Bitte versuche es erneut.',
      )
    }
  }

  const busy = status === 'scanning' || status === 'locating' || status === 'submitting'

  return (
    <main className="pointage">
      <header className="pointage__head">
        <h1 className="pointage__title">Hallo, {profile?.full_name ?? 'Team'}</h1>
        <p className="pointage__subtitle">Zeiterfassung</p>
      </header>

      <div className="pointage__stage">
        {status === 'success' && result ? (
          <div className="pointage__result">
            <span className="pointage__result-icon">
              <CheckCircle2 size={40} />
            </span>
            <strong className="pointage__result-label">{ACTION_LABELS[result.action] ?? result.action}</strong>
            <span className="pointage__result-time">{timeFormat.format(new Date(result.timestamp))}</span>
          </div>
        ) : status === 'error' ? (
          <div className="pointage__result">
            <span className="pointage__result-icon pointage__result-icon--error">
              <AlertCircle size={40} />
            </span>
            <p className="pointage__error">{error}</p>
          </div>
        ) : busy ? (
          <div className="pointage__result">
            <span className="pointage__result-icon pointage__result-icon--busy">
              <MapPin size={40} />
            </span>
            <strong className="pointage__result-label">
              {status === 'scanning'
                ? 'Scanner geöffnet…'
                : status === 'locating'
                  ? 'Standort wird ermittelt…'
                  : 'Wird gebucht…'}
            </strong>
          </div>
        ) : (
          <div className="pointage__result">
            <span className="pointage__result-icon pointage__result-icon--idle">
              <QrCode size={40} />
            </span>
            <strong className="pointage__result-label">Bereit zum Stempeln</strong>
            <span className="pointage__hint">
              {scannerAvailable
                ? 'Scanne den QR-Code am Eingang. Du musst dich dafür im Restaurant befinden.'
                : 'Scanne den QR-Code am Eingang mit deiner Kamera. Du musst dich dafür im Restaurant befinden.'}
            </span>
          </div>
        )}
      </div>

      {scannerAvailable && (
        <div className="action-bar action-bar--standalone">
          <button type="button" className="btn btn-primary action-bar__button" onClick={handleScan} disabled={busy}>
            <QrCode size={20} />
            <span>{status === 'error' ? 'Erneut scannen' : 'QR-Code scannen'}</span>
          </button>
        </div>
      )}
    </main>
  )
}
