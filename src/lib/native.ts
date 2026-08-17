import { Capacitor } from '@capacitor/core'
import { App as CapApp } from '@capacitor/app'
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'
import { Keyboard } from '@capacitor/keyboard'
import { SplashScreen } from '@capacitor/splash-screen'
import { StatusBar, Style } from '@capacitor/status-bar'

/*
  Everything native-only funnels through this module so the rest of the app never
  branches on platform. On the web every function here is a no-op that resolves —
  the same components run in `npm run dev` and inside the Capacitor WebView.
*/

export const isNative = Capacitor.isNativePlatform()
export const platform = Capacitor.getPlatform() as 'web' | 'ios' | 'android'
export const isAndroid = platform === 'android'

/**
 * Called once from `main.tsx` after React has mounted. Hiding the splash here
 * rather than letting Capacitor auto-hide it (see `launchAutoHide: false` in
 * capacitor.config.ts) means the user never sees a blank white frame between the
 * splash disappearing and the first route painting.
 */
export async function initNativeShell(): Promise<void> {
  if (!isNative) return

  try {
    await StatusBar.setStyle({ style: Style.Light })
    if (isAndroid) {
      // Ignored when the WebView is edge-to-edge, but harmless and correct for
      // the older devices where Capacitor still tints the bar.
      await StatusBar.setBackgroundColor({ color: '#ffffff' })
    }
  } catch {
    // A device without a controllable status bar is not a reason to fail boot.
  }

  try {
    Keyboard.setAccessoryBarVisible({ isVisible: false })
  } catch {
    // iOS-only API.
  }

  try {
    await SplashScreen.hide({ fadeOutDuration: 200 })
  } catch {
    // No splash configured (or already hidden) — nothing to do.
  }
}

/**
 * Wires the Android hardware/gesture back button to a caller-supplied handler
 * (in practice: React Router's `navigate(-1)`). Without this, back always exits
 * the app from any screen, which is the single most obvious "this is a wrapped
 * website" tell on Android.
 *
 * `canGoBack` is evaluated at press time so it always sees the current route.
 * Returns an unsubscribe function.
 */
export function onHardwareBack(handler: (canGoBack: boolean) => void): () => void {
  if (!isAndroid) return () => {}

  const listener = CapApp.addListener('backButton', ({ canGoBack }) => handler(canGoBack))
  return () => {
    void listener.then((handle) => handle.remove())
  }
}

/** Closes the app. Only meaningful on Android, where back-from-root should exit. */
export function exitApp(): void {
  if (!isAndroid) return
  void CapApp.exitApp()
}

type HapticKind = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'select'

/**
 * Fire-and-forget tactile feedback. Deliberately not awaited anywhere — a
 * dropped haptic must never delay or block the UI action that triggered it.
 */
export function haptic(kind: HapticKind = 'light'): void {
  if (!isNative) return

  try {
    switch (kind) {
      case 'select':
        void Haptics.selectionStart().then(() => Haptics.selectionEnd())
        break
      case 'success':
        void Haptics.notification({ type: NotificationType.Success })
        break
      case 'warning':
        void Haptics.notification({ type: NotificationType.Warning })
        break
      case 'error':
        void Haptics.notification({ type: NotificationType.Error })
        break
      case 'medium':
        void Haptics.impact({ style: ImpactStyle.Medium })
        break
      case 'heavy':
        void Haptics.impact({ style: ImpactStyle.Heavy })
        break
      default:
        void Haptics.impact({ style: ImpactStyle.Light })
    }
  } catch {
    // Device without a taptic engine.
  }
}

/**
 * Adds/removes `body.keyboard-open` so fixed bottom bars (tab bar, cart bar) can
 * hide themselves while the on-screen keyboard covers the bottom of the screen —
 * otherwise they float in the middle of a checkout form.
 * Returns an unsubscribe function.
 */
export function watchKeyboard(): () => void {
  if (!isNative) return () => {}

  const show = Keyboard.addListener('keyboardWillShow', () => {
    document.body.classList.add('keyboard-open')
  })
  const hide = Keyboard.addListener('keyboardWillHide', () => {
    document.body.classList.remove('keyboard-open')
  })

  return () => {
    void show.then((handle) => handle.remove())
    void hide.then((handle) => handle.remove())
    document.body.classList.remove('keyboard-open')
  }
}
