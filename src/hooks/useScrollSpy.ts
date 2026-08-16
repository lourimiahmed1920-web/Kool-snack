import { useEffect, useState } from 'react'

/**
 * Tracks which of the given section elements is currently under the sticky
 * header, so a category rail can highlight where the user actually is.
 *
 * The observer's root margin pulls the detection band down past the app bar and
 * chip rail and up from the bottom, leaving a thin strip near the top of the
 * visible content — without that, the last section on the page can never win,
 * because a short section never reaches the middle of the viewport.
 */
export function useScrollSpy(sectionIds: string[], enabled = true): string | null {
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled || sectionIds.length === 0) {
      setActiveId(null)
      return
    }

    const visible = new Set<string>()

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id)
          else visible.delete(entry.target.id)
        }
        // Preserve menu order rather than intersection-callback order.
        const first = sectionIds.find((id) => visible.has(id))
        if (first) setActiveId(first)
      },
      { rootMargin: '-140px 0px -70% 0px', threshold: 0 },
    )

    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null)

    elements.forEach((element) => observer.observe(element))
    if (elements.length > 0) setActiveId((current) => current ?? elements[0].id)

    return () => observer.disconnect()
  }, [sectionIds, enabled])

  return activeId
}
