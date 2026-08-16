import { useEffect, useState } from 'react'

/**
 * Subscribes to a CSS media query. Used where a layout difference is structural
 * rather than cosmetic — e.g. the staff shell renders a sidebar on a desk and a
 * bottom tab bar on a phone, which is different markup, not different padding.
 * Anything CSS alone can express should stay in CSS.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)

  useEffect(() => {
    const list = window.matchMedia(query)
    const onChange = (event: MediaQueryListEvent) => setMatches(event.matches)

    // Re-read on subscribe: the viewport can change between the initial render
    // and this effect (rotation, split-view resize).
    setMatches(list.matches)
    list.addEventListener('change', onChange)
    return () => list.removeEventListener('change', onChange)
  }, [query])

  return matches
}
