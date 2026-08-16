import { Link } from 'react-router-dom'
import { ShoppingBag } from 'lucide-react'
import { useCart } from '../contexts/CartContext'
import { currency } from '../lib/format'
import { haptic } from '../lib/native'

/**
 * Persistent "you have a cart" bar that floats just above the tab bar while
 * browsing. It is the shortcut that keeps adding items from feeling like a
 * one-way trip — without it the only route to checkout is the tab badge.
 */
export function CartBar() {
  const { lines, itemCount, total } = useCart()

  if (lines.length === 0) return null

  return (
    <div className="cart-bar">
      <Link to="/cart" className="cart-bar__button" onClick={() => haptic('medium')}>
        <span className="cart-bar__count">
          <ShoppingBag size={18} />
          {itemCount}
        </span>
        <span className="cart-bar__label">Zum Warenkorb</span>
        <span className="cart-bar__total">{currency.format(total)}</span>
      </Link>
    </div>
  )
}
