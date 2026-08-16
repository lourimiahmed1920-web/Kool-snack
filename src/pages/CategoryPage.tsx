import { Link, useParams } from 'react-router-dom'
import type { MenuCategory } from '../types/menu'
import { slugify } from '../lib/slug'
import { browsableCategories } from '../lib/menuTree'
import { MenuItemRow } from '../components/MenuItemRow'
import { MenuSkeleton } from '../components/MenuSkeleton'

interface CategoryPageProps {
  categories: MenuCategory[]
  loading: boolean
}

/**
 * A single category, reached from the home rail. The app bar (title + back) is
 * supplied by the shell — see `resolveChrome` in App.tsx — so this screen only
 * renders the list itself.
 */
export function CategoryPage({ categories, loading }: CategoryPageProps) {
  const { slug } = useParams<{ slug: string }>()

  if (loading) return <MenuSkeleton />

  const match = browsableCategories(categories).find((card) => slugify(card.name) === slug)

  if (!match) {
    return (
      <div className="screen">
        <div className="empty-state">
          <h2 className="empty-state__title">Kategorie nicht gefunden</h2>
          <p className="empty-state__text">Diese Kategorie gibt es nicht (mehr).</p>
          <Link to="/menu" className="btn btn-primary">
            Zur Speisekarte
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="screen">
      {match.description && <p className="menu-section__description">{match.description}</p>}

      {match.items.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state__text">In dieser Kategorie ist gerade nichts verfügbar.</p>
        </div>
      ) : (
        <div className="item-list">
          {match.items.map((item) => (
            <MenuItemRow key={item.id} item={item} categoryName={match.name} />
          ))}
        </div>
      )}
    </div>
  )
}
