import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { CartLine } from '../types/cart'

// v2: cart lines now carry variantId/optionId for server-side pricing. Bumping the key
// discards pre-existing carts, which lack those ids and would otherwise be mispriced.
const STORAGE_KEY = 'kool-snack-cart-v2'

interface CartContextValue {
  lines: CartLine[]
  itemCount: number
  total: number
  addLine: (line: Omit<CartLine, 'quantity'>, quantity?: number) => void
  updateQuantity: (key: string, quantity: number) => void
  removeLine: (key: string) => void
  clear: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

function loadInitialLines(): CartLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as CartLine[]) : []
  } catch {
    return []
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(loadInitialLines)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines))
  }, [lines])

  const addLine: CartContextValue['addLine'] = (line, quantity = 1) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.key === line.key)
      if (existing) {
        return prev.map((l) => (l.key === line.key ? { ...l, quantity: l.quantity + quantity } : l))
      }
      return [...prev, { ...line, quantity }]
    })
  }

  const updateQuantity: CartContextValue['updateQuantity'] = (key, quantity) => {
    setLines((prev) =>
      quantity <= 0 ? prev.filter((l) => l.key !== key) : prev.map((l) => (l.key === key ? { ...l, quantity } : l)),
    )
  }

  const removeLine: CartContextValue['removeLine'] = (key) => {
    setLines((prev) => prev.filter((l) => l.key !== key))
  }

  const clear = () => setLines([])

  const itemCount = useMemo(() => lines.reduce((sum, l) => sum + l.quantity, 0), [lines])
  const total = useMemo(() => lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0), [lines])

  return (
    <CartContext.Provider value={{ lines, itemCount, total, addLine, updateQuantity, removeLine, clear }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within a CartProvider')
  return ctx
}
