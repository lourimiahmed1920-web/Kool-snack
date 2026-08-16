import { useMemo, useState, type FormEvent } from 'react'
import { X, Utensils, ShoppingBag, Bike } from 'lucide-react'
import { useMenu } from '../hooks/useMenu'
import { resolveMenuItemImage } from '../lib/menuImages'
import { supabase } from '../lib/supabase'
import { toUserMessage } from '../lib/errors'
import { QuantityStepper } from './QuantityStepper'
import type { CartLine } from '../types/cart'
import type { OrderType } from '../types/order'

const currency = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' })

const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  dine_in: 'Vor Ort',
  pickup: 'Abholung',
  delivery: 'Lieferung',
}

const ORDER_TYPE_ICONS: Record<OrderType, typeof Utensils> = {
  dine_in: Utensils,
  pickup: ShoppingBag,
  delivery: Bike,
}

interface CreateOrderPanelProps {
  restaurantId: string | null | undefined
  onClose: () => void
  onCreated: () => void
}

export function CreateOrderPanel({ restaurantId, onClose, onCreated }: CreateOrderPanelProps) {
  const { categories, loading: menuLoading } = useMenu()
  const cards = useMemo(
    () => categories.flatMap((category) => (category.subcategories.length > 0 ? category.subcategories : [category])),
    [categories],
  )

  const [activeCard, setActiveCard] = useState<string | null>(null)
  const currentCard = cards.find((c) => c.id === activeCard) ?? cards[0]

  const [lines, setLines] = useState<CartLine[]>([])
  const [orderType, setOrderType] = useState<OrderType>('dine_in')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const total = lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0)

  const quantityFor = (key: string) => lines.find((l) => l.key === key)?.quantity ?? 0

  const updateQuantity = (key: string, quantity: number) => {
    setLines((prev) =>
      quantity <= 0 ? prev.filter((l) => l.key !== key) : prev.map((l) => (l.key === key ? { ...l, quantity } : l)),
    )
  }

  const addLine = (line: Omit<CartLine, 'quantity'>) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.key === line.key)
      if (existing) return prev.map((l) => (l.key === line.key ? { ...l, quantity: l.quantity + 1 } : l))
      return [...prev, { ...line, quantity: 1 }]
    })
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!restaurantId || lines.length === 0) return

    setSubmitting(true)
    setError(null)

    const contactNote = [
      name ? `Name: ${name}` : null,
      phone ? `Telefon: ${phone}` : null,
      notes ? `Hinweis: ${notes}` : null,
    ]
      .filter(Boolean)
      .join(' | ')

    // Same server-priced, atomic path as the customer checkout.
    const { data, error: rpcError } = await supabase.rpc('create_guest_order', {
      p_restaurant_id: restaurantId,
      p_order_type: orderType,
      p_notes: contactNote || 'Manuell erfasst',
      p_items: lines.map((line) => ({
        menu_item_id: line.menuItemId,
        variant_id: line.variantId,
        quantity: line.quantity,
        option_ids: line.selectedOptions.map((option) => option.optionId),
      })),
    })

    const created = (data as { order_id: string }[] | null)?.[0]

    if (rpcError || !created) {
      setError(toUserMessage(rpcError, 'Bestellung konnte nicht angelegt werden.'))
      setSubmitting(false)
      return
    }

    // Staff-entered orders are taken in person, so they start as confirmed.
    await supabase.from('orders').update({ status: 'confirmed' }).eq('id', created.order_id)

    setSubmitting(false)
    onCreated()
  }

  return (
    <div className="create-order">
      <div className="create-order__header">
        <h3 className="staff-section-title">Neue Bestellung</h3>
        <button type="button" className="create-order__close" onClick={onClose} aria-label="Schließen">
          <X />
        </button>
      </div>

      {menuLoading && <p className="menu-state">Menü wird geladen…</p>}

      {!menuLoading && (
        <div className="create-order__body">
          <div className="create-order__picker">
            <div className="create-order__categories">
              {cards.map((card) => (
                <button
                  key={card.id}
                  type="button"
                  className={`create-order__category${currentCard?.id === card.id ? ' active' : ''}`}
                  onClick={() => setActiveCard(card.id)}
                >
                  {card.name}
                </button>
              ))}
            </div>

            <ul className="create-order__items">
              {currentCard?.items.map((item) => {
                const imageSrc = resolveMenuItemImage(item.name, currentCard.name, item.image_url)
                if (item.variants.length > 0) {
                  return (
                    <li key={item.id} className="create-order__item">
                      <img src={imageSrc} alt="" className="create-order__item-image" />
                      <div className="create-order__item-info">
                        <span className="create-order__item-name">{item.name}</span>
                        {item.variants.map((variant) => {
                          const key = `${item.id}:${variant.id}`
                          return (
                            <div key={variant.id} className="create-order__variant-row">
                              <span>
                                {variant.label} · {currency.format(variant.price)}
                              </span>
                              <QuantityStepper
                                quantity={quantityFor(key)}
                                onAdd={() =>
                                  addLine({
                                    key,
                                    menuItemId: item.id,
                                    variantId: variant.id,
                                    name: item.name,
                                    variantLabel: variant.label,
                                    selectedOptions: [],
                                    unitPrice: variant.price,
                                    imageUrl: imageSrc,
                                  })
                                }
                                onRemove={() => updateQuantity(key, quantityFor(key) - 1)}
                              />
                            </div>
                          )
                        })}
                      </div>
                    </li>
                  )
                }
                return (
                  <li key={item.id} className="create-order__item">
                    <img src={imageSrc} alt="" className="create-order__item-image" />
                    <div className="create-order__item-info">
                      <span className="create-order__item-name">{item.name}</span>
                      <span className="create-order__item-price">{currency.format(item.price)}</span>
                    </div>
                    <QuantityStepper
                      quantity={quantityFor(item.id)}
                      onAdd={() =>
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
                      onRemove={() => updateQuantity(item.id, quantityFor(item.id) - 1)}
                    />
                  </li>
                )
              })}
            </ul>
          </div>

          <form className="create-order__summary" onSubmit={handleSubmit}>
            <h4 className="staff-section-title">Bestellung</h4>

            {lines.length === 0 && <p className="menu-state">Noch keine Artikel ausgewählt.</p>}

            {lines.length > 0 && (
              <ul className="create-order__summary-lines">
                {lines.map((line) => (
                  <li key={line.key}>
                    <span>
                      {line.quantity}× {line.name}
                      {line.variantLabel ? ` (${line.variantLabel})` : ''}
                    </span>
                    <span>{currency.format(line.unitPrice * line.quantity)}</span>
                  </li>
                ))}
              </ul>
            )}

            <div className="cart-total">
              <span>Gesamt</span>
              <strong>{currency.format(total)}</strong>
            </div>

            <div className="checkout-form__order-type">
              {(Object.keys(ORDER_TYPE_LABELS) as OrderType[]).map((type) => {
                const Icon = ORDER_TYPE_ICONS[type]
                return (
                  <label key={type} className={orderType === type ? 'active' : ''}>
                    <input type="radio" checked={orderType === type} onChange={() => setOrderType(type)} />
                    <Icon />
                    {ORDER_TYPE_LABELS[type]}
                  </label>
                )
              })}
            </div>

            <label className="checkout-form__field">
              Name (optional)
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label className="checkout-form__field">
              Telefon (optional)
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </label>
            <label className="checkout-form__field">
              Hinweis (optional)
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </label>

            {error && <p className="menu-state menu-state--error">{error}</p>}

            <button type="submit" className="btn btn-primary" disabled={submitting || lines.length === 0 || !restaurantId}>
              {submitting ? 'Wird angelegt…' : `Bestellung anlegen · ${currency.format(total)}`}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
