import { Geolocation } from '@capacitor/geolocation'
import { isNative } from './native'

export interface Coords {
  latitude: number
  longitude: number
}

/** Thrown with a ready-to-display German message; callers render `.message` as-is. */
export class GeoError extends Error {
  readonly denied: boolean

  constructor(message: string, denied = false) {
    super(message)
    this.name = 'GeoError'
    this.denied = denied
  }
}

const TIMEOUT_MS = 10_000

/**
 * One position fix, from the native Geolocation API inside the app and from the
 * browser API on the web.
 *
 * The native path matters beyond tidiness: `navigator.geolocation` inside a
 * WebView needs the host app to already hold the OS location permission, and
 * nothing in a web page can prompt for it. Going through the plugin lets the app
 * request the permission itself, which is what makes the geofenced clock-in work
 * on a fresh install.
 */
export async function getCurrentCoords(): Promise<Coords> {
  if (isNative) {
    try {
      const permission = await Geolocation.checkPermissions()
      if (permission.location !== 'granted') {
        const requested = await Geolocation.requestPermissions({ permissions: ['location'] })
        if (requested.location !== 'granted') {
          throw new GeoError(
            'Standortzugriff wurde verweigert. Bitte erlaube den Standortzugriff in den Einstellungen und scanne erneut.',
            true,
          )
        }
      }

      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: TIMEOUT_MS,
        maximumAge: 0,
      })
      return { latitude: position.coords.latitude, longitude: position.coords.longitude }
    } catch (error) {
      if (error instanceof GeoError) throw error
      throw new GeoError('Standort konnte nicht ermittelt werden. Bitte versuche es erneut.')
    }
  }

  if (!navigator.geolocation) {
    throw new GeoError('Standortabfrage wird von diesem Gerät nicht unterstützt.')
  }

  return new Promise<Coords>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
      (geoError) => {
        reject(
          geoError.code === geoError.PERMISSION_DENIED
            ? new GeoError(
                'Standortzugriff wurde verweigert. Bitte erlaube den Standortzugriff und scanne den QR-Code erneut.',
                true,
              )
            : new GeoError('Standort konnte nicht ermittelt werden. Bitte versuche es erneut.'),
        )
      },
      { enableHighAccuracy: true, timeout: TIMEOUT_MS, maximumAge: 0 },
    )
  })
}
