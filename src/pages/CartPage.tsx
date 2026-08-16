import { Link, useNavigate } from 'react-router-dom'
import { ShoppingBag } from 'lucide-react'
import { useCart } from '../contexts/CartContext'
import { QuantityStepper } from '../components/QuantityStepper'
import { currency } from '../lib/format'
import { haptic } from '../lib/native'

/**
 * Step one of checkout: review what's in the basket. Contact details live on the
 * next screen (`/checkout`) rather than below the list — a single screen that
 * scrolls from items through to a submit button is a web checkout, and it buries
 * the total the customer is actually deciding on.
 */
export function CartPage() {
  const { lines, itemCount, total, updateQuantity } = useCart()
  const navigate = useNavigate()

  if (lines.length === 0) {
    return (
      <div className="screen">
        <div className="empty-state">
          <span className="empty-state__icon">
            <ShoppingBag size={28} />
          </span>
          <h2 className="empty-state__title">Dein Warenkorb ist leer</h2>
          <p className="empty-state__text">Stöber durch die Speisekarte und leg etwas Leckeres rein.</p>
          <Link to="/menu" className="btn btn-primary">
            Zur Speisekarte
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="screen screen--with-action screen--cart">
      <ul className="cart-list">
        {lines.map((line) => (
          <li key={line.key} className="cart-item">
            <img src={line.imageUrl} alt="" className="cart-item__image" loading="lazy" />

            <div className="cart-item__body">
              <span className="cart-item__name">{line.name}</span>
              {(line.variantLabel || line.selectedOptions.length > 0) && (
                <span className="cart-item__config">
                  {[line.variantLabel, ...line.selectedOptions.map((option) => option.label)]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              )}
              <span className="cart-item__price">{currency.format(line.unitPrice * line.quantity)}</span>
            </div>

            <QuantityStepper
              quantity={line.quantity}
              onAdd={() => updateQuantity(line.key, line.quantity + 1)}
              onRemove={() => updateQuantity(line.key, line.quantity - 1)}
            />
          </li>
        ))}
      </ul>

      <Link to="/menu" className="cart-list__more">
        + Weitere Artikel hinzufügen
      </Link>

      {/*
        Summary and CTA travel together: stacked under the list on a phone,
        parked in a sticky right-hand column from `lg` (see .screen--cart).
      */}
      <div className="cart-summary">
        <div className="summary">
          <div className="summary__row">
            <span>
              Zwischensumme ({itemCount} {itemCount === 1 ? 'Artikel' : 'Artikel'})
            </span>
            <span>{currency.format(total)}</span>
          </div>
          <div className="summary__row summary__row--total">
            <span>Gesamt</span>
            <strong>{currency.format(total)}</strong>
          </div>
        </div>

        <div className="action-bar">
          <button
            type="button"
            className="btn btn-primary action-bar__button"
            onClick={() => {
              haptic('medium')
              navigate('/checkout')
            }}
          >
            <span>Zur Kasse</span>
            <span className="action-bar__price">{currency.format(total)}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
