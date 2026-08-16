import { useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'
import type { MenuCategory } from '../types/menu'
import { browsableCategories } from '../lib/menuTree'
import { slugify } from '../lib/slug'
import { MenuItemRow } from '../components/MenuItemRow'
import { CategoryChips } from '../components/CategoryChips'
import { useScrollSpy } from '../hooks/useScrollSpy'
import { MenuSkeleton } from '../components/MenuSkeleton'

interface MenuPageProps {
  categories: MenuCategory[]
  loading: boolean
}

/**
 * The full menu on one scrollable screen, with a sticky category chip rail that
 * both jumps to a section and tracks which one you're currently in. This is the
 * pattern every food-ordering app converges on: one long list beats making the
 * customer navigate in and out of a category per dish.
 */
export function MenuPage({ categories, loading }: MenuPageProps) {
  const [query, setQuery] = useState('')
  const cards = useMemo(() => browsableCategories(categories), [categories])

  const sectionIds = useMemo(() => cards.map((card) => `cat-${slugify(card.name)}`), [cards])
  const activeId = useScrollSpy(sectionIds, !query)

  const normalized = query.trim().toLowerCase()
  const matches = useMemo(() => {
    if (!normalized) return []
    return cards.flatMap((card) =>
      card.items
        .filter(
          (item) =>
            item.name.toLowerCase().includes(normalized) ||
            (item.description?.toLowerCase().includes(normalized) ?? false),
        )
        .map((item) => ({ item, categoryName: card.name })),
    )
  }, [cards, normalized])

  if (loading) return <MenuSkeleton />

  return (
    <div className="screen screen--menu">
      <div className="menu-search">
        <Search size={18} className="menu-search__icon" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Gericht suchen…"
          aria-label="Gericht suchen"
          className="menu-search__input"
        />
        {query && (
          <button type="button" className="menu-search__clear" onClick={() => setQuery('')} aria-label="Suche leeren">
            <X size={16} />
          </button>
        )}
      </div>

      {normalized ? (
        <section className="menu-section">
          <h2 className="menu-section__title">
            {matches.length} {matches.length === 1 ? 'Treffer' : 'Treffer'} für „{query.trim()}“
          </h2>
          {matches.length === 0 ? (
            <p className="screen-state">Nichts gefunden. Versuch es mit einem anderen Suchbegriff.</p>
          ) : (
            <div className="item-list">
              {matches.map(({ item, categoryName }) => (
                <MenuItemRow key={item.id} item={item} categoryName={categoryName} />
              ))}
            </div>
          )}
        </section>
      ) : (
        <>
          <CategoryChips cards={cards} activeId={activeId} />

          {cards.map((card) => (
            <section key={card.id} id={`cat-${slugify(card.name)}`} className="menu-section">
              <h2 className="menu-section__title">{card.name}</h2>
              {card.description && <p className="menu-section__description">{card.description}</p>}
              <div className="item-list">
                {card.items.map((item) => (
                  <MenuItemRow key={item.id} item={item} categoryName={card.name} />
                ))}
              </div>
            </section>
          ))}
        </>
      )}
    </div>
  )
}
