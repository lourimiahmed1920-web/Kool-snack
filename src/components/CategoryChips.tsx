import { useEffect, useRef } from 'react'
import type { MenuCategory } from '../types/menu'
import { slugify } from '../lib/slug'
import { haptic } from '../lib/native'

interface CategoryChipsProps {
  cards: MenuCategory[]
  activeId: string | null
}

/**
 * Sticky category rail for the menu screen. Tapping a chip scrolls its section
 * under the header; scrolling the page moves the highlight (see `useScrollSpy`),
 * and the rail scrolls itself so the active chip is never off-screen.
 */
export function CategoryChips({ cards, activeId }: CategoryChipsProps) {
  const railRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!activeId || !railRef.current) return
    const chip = railRef.current.querySelector<HTMLElement>(`[data-target="${activeId}"]`)
    chip?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [activeId])

  const jumpTo = (sectionId: string) => {
    haptic('select')
    const section = document.getElementById(sectionId)
    if (!section) return
    // scroll-margin-top on the section (set in CSS) keeps the heading clear of
    // the app bar and this rail, so a plain scrollIntoView lands correctly.
    section.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="chip-rail" ref={railRef}>
      {cards.map((card) => {
        const sectionId = `cat-${slugify(card.name)}`
        const active = sectionId === activeId
        return (
          <button
            key={card.id}
            type="button"
            data-target={sectionId}
            className={`chip${active ? ' chip--active' : ''}`}
            aria-current={active ? 'true' : undefined}
            onClick={() => jumpTo(sectionId)}
          >
            {card.name}
          </button>
        )
      })}
    </div>
  )
}
