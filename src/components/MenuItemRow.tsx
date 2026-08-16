import { useState } from 'react'
import { Plus, SlidersHorizontal } from 'lucide-react'
import type { MenuItem } from '../types/menu'
import { resolveMenuItemImage, resolveCategoryIconTile } from '../lib/menuImages'
import { useCart } from '../contexts/CartContext'
import { ItemSheet } from './ItemSheet'
import { currency } from '../lib/format'
import { haptic } from '../lib/native'

interface MenuItemRowProps {
  item: MenuItem
  categoryName?: string
}

/**
 * One dish, as a full-width list row: text on the left, thumbnail on the right.
 * Rows beat the old card grid on a phone — two columns of cards leave a dish
 * name about 150px wide, and photo-first cards push most of the menu off-screen.
 *
 * Layout note: the row is a plain container holding two sibling buttons. The
 * "open" button stretches an invisible overlay across the whole row (see
 * `.item-row__open::after`) so tapping the text or the photo opens the sheet,
 * while quick-add stays a real, separately focusable button on top of it —
 * nesting one button inside another is invalid HTML and breaks keyboard use.
 */
export function MenuItemRow({ item, categoryName }: MenuItemRowProps) {
  const [imageFailed, setImageFailed] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const { lines, addLine } = useCart()

  const hasVariants = item.variants.length > 0
  const needsCustomization = hasVariants || item.optionGroups.length > 0
  const imageSrc = resolveMenuItemImage(item.name, categoryName, item.image_url)
  const fromPrice = hasVariants ? Math.min(...item.variants.map((variant) => variant.price)) : item.price
  const inCart = lines.find((line) => line.key === item.id)?.quantity ?? 0
  const { tint, icon: FallbackIcon } = resolveCategoryIconTile(categoryName)

  const quickAdd = () => {
    haptic('medium')
    addLine({
      key: item.id,
      menuItemId: item.id,
      variantId: null,
      name: item.name,
      variantLabel: null,
      selectedOptions: [],
      unitPrice: item.price,
      imageUrl: imageSrc,
    })
  }

  return (
    <>
      <div className="item-row">
        <button type="button" className="item-row__open" onClick={() => setSheetOpen(true)}>
          <span className="item-row__name">
            {item.name}
            {inCart > 0 && <span className="item-row__in-cart">{inCart}×</span>}
          </span>
          {item.description && <span className="item-row__description">{item.description}</span>}
          <span className="item-row__price">
            {hasVariants ? `ab ${currency.format(fromPrice)}` : currency.format(item.price)}
          </span>
        </button>

        <div className="item-row__media">
          {!imageFailed ? (
            <img
              src={imageSrc}
              alt=""
              className="item-row__image"
              loading="lazy"
              decoding="async"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <span className={`item-row__fallback icon-tile--${tint}`} aria-hidden="true">
              <FallbackIcon size={22} />
            </span>
          )}

          {item.is_seasonal && <span className="item-row__badge">Saisonal</span>}

          {needsCustomization ? (
            // Decorative: taps land on the overlay and open the sheet, which is
            // where the variants and options actually live.
            <span className="item-row__add item-row__add--customize" aria-hidden="true">
              <SlidersHorizontal size={16} />
            </span>
          ) : (
            <button
              type="button"
              className="item-row__add"
              onClick={quickAdd}
              aria-label={`${item.name} hinzufügen`}
            >
              <Plus size={18} />
            </button>
          )}
        </div>
      </div>

      {sheetOpen && <ItemSheet item={item} imageUrl={imageSrc} onClose={() => setSheetOpen(false)} />}
    </>
  )
}
