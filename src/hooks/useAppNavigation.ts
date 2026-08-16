import { useEffect } from 'react'
import { useLocation, useNavigate, useNavigationType } from 'react-router-dom'
import { exitApp, onHardwareBack, watchKeyboard } from '../lib/native'
import { consumeBackInterceptor } from '../lib/backStack'

/**
 * Scrolls to the top on every forward navigation, but leaves POP (back/forward)
 * alone so returning to a long menu doesn't dump the user at the top of it.
 */
export function useScrollToTopOnNavigate(): void {
  const { pathname } = useLocation()
  const navigationType = useNavigationType()

  useEffect(() => {
    if (navigationType === 'POP') return
    window.scrollTo(0, 0)
  }, [pathname, navigationType])
}

/**
 * Makes the Android back gesture behave like a native app: close any open
 * overlay first, then walk back through in-app history, and only exit the app
 * from a root screen. On iOS and the web this is inert.
 */
export function useHardwareBack(): void {
  const navigate = useNavigate()

  useEffect(() => {
    return onHardwareBack((canGoBack) => {
      if (consumeBackInterceptor()) return
      if (canGoBack && window.history.state?.idx > 0) navigate(-1)
      else exitApp()
    })
  }, [navigate])
}

/** Adds/removes `body.keyboard-open` for the lifetime of the app. */
export function useKeyboardClass(): void {
  useEffect(() => watchKeyboard(), [])
}
