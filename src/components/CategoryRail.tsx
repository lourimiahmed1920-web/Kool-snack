import { Link } from 'react-router-dom'
import type { MenuCategory } from '../types/menu'
import { resolveMenuItemImage } from '../lib/menuImages'
import { slugify } from '../lib/slug'

interface CategoryRailProps {
  cards: MenuCategory[]
  loading: boolean
}

/** Short category taglines, matching the Kool Snack Neuss prototype's card labels. */
const TAGLINES: Record<string, string> = {
  pizza: 'Aus dem Steinofen',
  'gefüllte pizzabrötchen': 'Frisch gebacken',
  pasta: 'Hausgemacht',
  salate: 'Frisch & knackig',
  schnitzel: 'Knusprig & goldbraun',
  burger: 'Saftig gegrillt',
  tacos: 'Französische Wraps',
  'shawarma rolle': 'Hähnchen & Lamm',
  'gegrilltes hähnchen': 'Vom Grill',
  milkshakes: 'Cremig gemixt',
  getränke: 'Kalt & heiß',
  kaltgetränke: 'Kalt & heiß',
  heißgetränke: 'Kalt & heiß',
  cocktails: 'Fruchtig frisch',
  'cocktails & milkshakes': 'Fruchtig frisch',
}

/**
 * Horizontally scrolling, snap-aligned category cards. The rail deliberately
 * bleeds past the screen padding on both edges so a partially visible next card
 * signals that it scrolls — a wrapped grid gives no such affordance on a phone.
 */
export function CategoryRail({ cards, loading }: CategoryRailProps) {
  if (loading) {
    return (
      <div className="rail" aria-busy="true">
        {[0, 1, 2].map((index) => (
          <div key={index} className="rail-card rail-card--skeleton" />
        ))}
      </div>
    )
  }

  return (
    <div className="rail">
      {cards.map((card, index) => (
        <Link
          key={card.id}
          to={`/menu/${slugify(card.name)}`}
          className="rail-card fade-in-up"
          style={{ animationDelay: `${Math.min(index, 6) * 40}ms` }}
        >
          <img
            src={resolveMenuItemImage(card.name, card.name)}
            alt=""
            className="rail-card__image"
            loading="lazy"
            decoding="async"
          />
          <span className="rail-card__body">
            <span className="rail-card__name">{card.name}</span>
            <span className="rail-card__tagline">{TAGLINES[card.name.trim().toLowerCase()] ?? ''}</span>
          </span>
        </Link>
      ))}
    </div>
  )
}
