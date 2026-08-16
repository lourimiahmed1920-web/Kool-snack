import type { CapacitorConfig } from '@capacitor/cli'

/*
  Native shell config. The web build in `dist/` is what gets packaged — there is
  no separate native codebase, so `npm run build` must run before `npx cap sync`
  (see the `cap:sync` script in package.json).

  Capacitor 8 renders the WebView edge-to-edge on Android, so every screen has to
  respect the safe-area insets itself. `index.html` sets `viewport-fit=cover` for
  that reason — without it Capacitor logs a warning and the insets stay 0.
*/
const config: CapacitorConfig = {
  appId: 'de.koolsnack.app',
  appName: 'Kool Snack',
  webDir: 'dist',

  // Matches --color-surface-alt so there is no white/black flash behind the
  // WebView while a route is still painting.
  backgroundColor: '#FAFAFA',

  android: {
    // Pinch-zoom would let a mis-tap wreck the layout of a fixed-bar app.
    zoomEnabled: false,
  },

  ios: {
    zoomEnabled: false,
    // We handle insets ourselves in CSS; letting UIKit also inset the scroll
    // view would double the padding under the notch.
    contentInset: 'never',
  },

  plugins: {
    SplashScreen: {
      // Hidden manually from src/lib/native.ts once React has mounted, so the
      // splash never lifts on an empty screen.
      launchAutoHide: false,
      // White, not the brand red: the source logo is an opaque square with its
      // own white ground (no alpha), so any other colour frames it in a visible
      // white box. Keep this in sync with `splashBackground` in
      // android/app/src/main/res/values/colors.xml.
      backgroundColor: '#FFFFFF',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: {
      // Light = light bar background, dark icons — matches the app's light UI.
      style: 'LIGHT',
      backgroundColor: '#FFFFFF',
    },
    Keyboard: {
      // Shrink the WebView instead of sliding it, so the fixed bottom bars stay
      // pinned to the top of the keyboard rather than being pushed off-screen.
      resize: 'native',
      resizeOnFullScreen: true,
    },
  },
}

export default config
