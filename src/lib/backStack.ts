/*
  A stack of "things the back gesture should close before it navigates".

  Android's hardware/gesture back is a single global event, so without this an
  open bottom sheet would stay on screen while the route behind it changed. Any
  transient overlay (sheet, picker) pushes its dismiss handler on mount and pops
  it on unmount; the app-level back handler consults this first.
*/

type Dismiss = () => void

const stack: Dismiss[] = []

/** Registers a dismiss handler as the current top-most overlay. Returns an unregister. */
export function pushBackInterceptor(dismiss: Dismiss): () => void {
  stack.push(dismiss)
  return () => {
    const index = stack.lastIndexOf(dismiss)
    if (index !== -1) stack.splice(index, 1)
  }
}

/**
 * Runs the top-most overlay's dismiss handler, if any.
 * @returns true when an overlay handled the back press and navigation must not happen.
 */
export function consumeBackInterceptor(): boolean {
  const dismiss = stack.pop()
  if (!dismiss) return false
  dismiss()
  return true
}
