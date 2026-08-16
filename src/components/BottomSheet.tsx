import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { haptic } from '../lib/native'
import { pushBackInterceptor } from '../lib/backStack'

interface BottomSheetProps {
  title: string
  subtitle?: string | null
  onClose: () => void
  children: ReactNode
  /** Sticky action area pinned to the bottom of the sheet, above the safe-area inset. */
  footer?: ReactNode
}

/** Drag distance past which releasing dismisses the sheet instead of snapping back. */
const DISMISS_THRESHOLD_PX = 110

/**
 * The app's modal surface. Sheets slide up from the bottom edge and can be
 * flicked back down, which is what phone users expect — a centred dialog box
 * reads as a website. Everything modal in the customer flow uses this.
 */
export function BottomSheet({ title, subtitle, onClose, children, footer }: BottomSheetProps) {
  const [dragY, setDragY] = useState(0)
  const [closing, setClosing] = useState(false)
  const dragStart = useRef<number | null>(null)
  const closingRef = useRef(false)

  // Play the exit animation before unmounting, so dismissing doesn't just blink.
  // Kept in a ref as well so the effect below can call it without re-subscribing.
  const dismiss = useCallback(() => {
    if (closingRef.current) return
    closingRef.current = true
    setClosing(true)
    window.setTimeout(onClose, 180)
  }, [onClose])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dismiss()
    }
    document.addEventListener('keydown', onKey)

    // Android's back gesture must close the sheet before it touches the route.
    const unregisterBack = pushBackInterceptor(dismiss)

    // Lock the page behind the sheet — without this, scrolling past the end of
    // the sheet's own content scrolls the menu underneath it.
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKey)
      unregisterBack()
      document.body.style.overflow = previousOverflow
    }
  }, [dismiss])

  const onPointerDown = (event: React.PointerEvent) => {
    dragStart.current = event.clientY
    ;(event.target as HTMLElement).setPointerCapture?.(event.pointerId)
  }

  const onPointerMove = (event: React.PointerEvent) => {
    if (dragStart.current === null) return
    // Only downward drags move the sheet; pulling up must not detach it.
    setDragY(Math.max(0, event.clientY - dragStart.current))
  }

  const onPointerUp = () => {
    if (dragStart.current === null) return
    dragStart.current = null
    if (dragY > DISMISS_THRESHOLD_PX) {
      haptic('light')
      dismiss()
    } else {
      setDragY(0)
    }
  }

  return createPortal(
    <div
      className={`sheet-overlay${closing ? ' sheet-overlay--closing' : ''}`}
      role="presentation"
      onClick={dismiss}
    >
      <div
        className={`sheet${closing ? ' sheet--closing' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
        style={{
          transform: dragY ? `translateY(${dragY}px)` : undefined,
          transition: dragStart.current !== null ? 'none' : undefined,
        }}
      >
        <div
          className="sheet__grabber-zone"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <span className="sheet__grabber" aria-hidden="true" />
        </div>

        <div className="sheet__header">
          <div className="sheet__heading">
            <h2 className="sheet__title">{title}</h2>
            {subtitle && <p className="sheet__subtitle">{subtitle}</p>}
          </div>
          <button type="button" className="sheet__close" onClick={dismiss} aria-label="Schließen">
            <X size={20} />
          </button>
        </div>

        <div className="sheet__body">{children}</div>

        {footer && <div className="sheet__footer">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}
