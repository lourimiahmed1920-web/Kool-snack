import { BarcodeFormat, BarcodeScanner } from '@capacitor-mlkit/barcode-scanning'
import { isNative, isAndroid } from './native'

/**
 * In-app QR scanning for the geofenced clock-in.
 *
 * This exists because the native shell breaks the old flow: scanning the
 * entrance code with the phone's own camera app opens the link in a *browser*,
 * not in the installed app, so the session and the app's location permission are
 * both gone. Staff scan from inside the app instead.
 *
 * The web build has no scanner — there the OS camera → browser round trip still
 * works, so `canScanInApp()` returns false and the UI keeps the "scan the code at
 * the entrance" instruction.
 */

/** Thrown with a ready-to-display German message. */
export class ScanError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ScanError'
  }
}

/**
 * The `isNative` check is load-bearing, not belt-and-braces: on web the plugin's
 * `isSupported()` returns **true** wherever `BarcodeDetector` exists, but
 * `scan()` is unimplemented there and throws. Gating on `isSupported()` alone
 * would light up the scan button in Chrome and then fail on tap.
 *
 * Web scanning would mean `startScan()` plus a hand-built camera overlay, and it
 * still wouldn't work in Safari (no `BarcodeDetector`) — i.e. not on iPhones,
 * where most of this would be used. The camera-app → browser link works there
 * already, so web deliberately keeps that path.
 */
export async function canScanInApp(): Promise<boolean> {
  if (!isNative) return false
  try {
    const { supported } = await BarcodeScanner.isSupported()
    return supported
  } catch {
    return false
  }
}

/**
 * Opens the native scanner UI.
 * @returns the scanned string, or null if the user dismissed the scanner.
 */
export async function scanQrCode(): Promise<string | null> {
  const permission = await BarcodeScanner.checkPermissions()
  if (permission.camera !== 'granted') {
    const requested = await BarcodeScanner.requestPermissions()
    if (requested.camera !== 'granted') {
      throw new ScanError('Kamerazugriff wurde verweigert. Bitte erlaube den Zugriff in den Einstellungen.')
    }
  }

  // On Android the scanner UI ships as an on-demand Play Services module, which
  // is absent on a fresh install and has to be pulled down once.
  if (isAndroid) {
    const { available } = await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable()
    if (!available) {
      await BarcodeScanner.installGoogleBarcodeScannerModule()
      throw new ScanError('Scanner wird installiert. Bitte in einem Moment erneut versuchen.')
    }
  }

  const { barcodes } = await BarcodeScanner.scan({ formats: [BarcodeFormat.QrCode] })
  return barcodes[0]?.rawValue ?? null
}

/**
 * Pulls the clock-in token out of a scanned value. The entrance display encodes a
 * full `/staff/pointage?token=…` URL, but a bare token is accepted too so the
 * flow doesn't break if the display's URL shape ever changes.
 */
export function extractClockToken(scanned: string): string | null {
  try {
    const url = new URL(scanned)
    const token = url.searchParams.get('token')
    if (token) return token
  } catch {
    // Not a URL — fall through to the bare-token case.
  }

  const trimmed = scanned.trim()
  return trimmed.length > 0 && !trimmed.includes(' ') ? trimmed : null
}
