import { useMemo, useState, type FormEvent } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useStockItems } from '../hooks/useStockItems'
import { useStockMovements } from '../hooks/useStockMovements'
import { supabase } from '../lib/supabase'
import { toUserMessage } from '../lib/errors'
import type { ExpiryStatus, StockMovement, StockMovementReason } from '../types/stock'

const REASON_LABELS: Record<StockMovementReason, string> = {
  purchase: 'Einkauf (+)',
  manual_in: 'Manueller Eingang (+)',
  sale_consumption: 'Verkauf / Verbrauch (−)',
  waste: 'Verlust / Ausschuss (−)',
  adjustment: 'Korrektur (+/−)',
  return: 'Rückgabe an Lieferant (−)',
}

/** Reasons that always remove stock; `adjustment` is the only one that may be signed either way. */
const NEGATIVE_REASONS: StockMovementReason[] = ['sale_consumption', 'waste', 'return']

type FilterTab = 'alle' | 'expiring_soon' | 'expired' | 'low_stock'

const FILTER_LABELS: Record<FilterTab, string> = {
  alle: 'Alle',
  expiring_soon: 'Bald ablaufend',
  expired: 'Abgelaufen',
  low_stock: 'Niedriger Bestand',
}

const EXPIRY_BORDER_COLOR: Record<ExpiryStatus, string> = {
  expired: '#dc2626',
  expiring_soon: '#f59e0b',
  valid: '#16a34a',
  none: '#9ca3af',
}

function StockAdjustForm({ itemId, unit, onDone }: { itemId: string; unit: string; onDone: () => void }) {
  const { profile } = useAuth()
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState<StockMovementReason>('purchase')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!profile) return
    const numeric = Number(amount)
    if (!numeric) return

    setSubmitting(true)
    setError(null)

    const signedAmount =
      reason === 'adjustment' ? numeric : NEGATIVE_REASONS.includes(reason) ? -Math.abs(numeric) : Math.abs(numeric)

    const { error: insertError } = await supabase.from('stock_movements').insert({
      stock_item_id: itemId,
      profile_id: profile.id,
      change_amount: signedAmount,
      reason,
      note: note || null,
    })

    if (insertError) {
      setError(toUserMessage(insertError, 'Buchung konnte nicht gespeichert werden.'))
    } else {
      setAmount('')
      setNote('')
      onDone()
    }
    setSubmitting(false)
  }

  return (
    <form className="stock-adjust-form" onSubmit={handleSubmit}>
      <select value={reason} onChange={(e) => setReason(e.target.value as StockMovementReason)}>
        {Object.entries(REASON_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <input
        type="number"
        step="any"
        min={reason === 'adjustment' ? undefined : '0'}
        placeholder={`Menge (${unit})`}
        required
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <input type="text" placeholder="Notiz (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
      <button type="submit" className="qty-stepper__add" disabled={submitting} aria-label="Buchen">
        ✓
      </button>
      {error && <p className="menu-state menu-state--error">{error}</p>}
    </form>
  )
}

function StockMovementHistory({ movements }: { movements: StockMovement[] }) {
  if (movements.length === 0) return null

  return (
    <ul className="stock-movement-history">
      {movements.map((m) => (
        <li key={m.id}>
          <span>{REASON_LABELS[m.reason]}</span>
          <span>
            {m.change_amount > 0 ? '+' : ''}
            {m.change_amount}
          </span>
          <span>{new Date(m.created_at).toLocaleDateString('de-DE')}</span>
          {m.note && <span className="stock-movement-history__note">{m.note}</span>}
        </li>
      ))}
    </ul>
  )
}

export function StockSection() {
  const { profile } = useAuth()
  const { items, loading, reload } = useStockItems(profile?.restaurant_id)
  const canManageCatalog = profile?.role === 'inhaber' || profile?.role === 'manager'
  const [filter, setFilter] = useState<FilterTab>('alle')

  const [name, setName] = useState('')
  const [unit, setUnit] = useState('')
  const [threshold, setThreshold] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [expiryWarningDays, setExpiryWarningDays] = useState('3')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const filteredItems = useMemo(() => {
    if (filter === 'alle') return items
    if (filter === 'low_stock') return items.filter((item) => item.is_low_stock)
    return items.filter((item) => item.expiry_status === filter)
  }, [items, filter])

  const itemIds = useMemo(() => items.map((item) => item.id), [items])
  const { movementsByItem, reloadMovements } = useStockMovements(itemIds)

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault()
    if (!profile?.restaurant_id) return
    setCreating(true)
    setCreateError(null)

    const { error } = await supabase.from('stock_items').insert({
      restaurant_id: profile.restaurant_id,
      name,
      unit,
      low_stock_threshold: threshold ? Number(threshold) : null,
      expiry_date: expiryDate || null,
      expiry_warning_days: Number(expiryWarningDays) || 3,
    })

    if (error) {
      setCreateError(toUserMessage(error, 'Artikel konnte nicht angelegt werden.'))
    } else {
      setName('')
      setUnit('')
      setThreshold('')
      setExpiryDate('')
      setExpiryWarningDays('3')
      await reload()
    }
    setCreating(false)
  }

  return (
    <div>
      <h3 className="staff-section-title">Lager</h3>

      <div className="checkout-form__order-type" style={{ maxWidth: 460, marginBottom: 16 }}>
        {(Object.keys(FILTER_LABELS) as FilterTab[]).map((tab) => (
          <label key={tab} className={filter === tab ? 'active' : ''}>
            <input type="radio" checked={filter === tab} onChange={() => setFilter(tab)} />
            {FILTER_LABELS[tab]}
          </label>
        ))}
      </div>

      {loading && <p className="menu-state">Lädt…</p>}
      {!loading && filteredItems.length === 0 && <p className="menu-state">Keine Lagerartikel in dieser Ansicht.</p>}

      {!loading && filteredItems.length > 0 && (
        <ul className="stock-list">
          {filteredItems.map((item) => (
            <li
              key={item.id}
              className={`stock-item${item.is_low_stock ? ' stock-item--low' : ''}`}
              style={{ borderLeft: `4px solid ${EXPIRY_BORDER_COLOR[item.expiry_status]}` }}
            >
              <div className="stock-item__header">
                <span className="stock-item__name">{item.name}</span>
                <span className="stock-item__quantity">
                  {item.quantity} {item.unit}
                  {item.is_low_stock && <span className="stock-item__badge">Niedrig</span>}
                </span>
              </div>
              {item.expiry_date && (
                <div className="stock-item__meta">
                  MHD: {new Date(item.expiry_date).toLocaleDateString('de-DE')}
                  {item.expiry_status === 'expired' && ' · Abgelaufen'}
                  {item.expiry_status === 'expiring_soon' && ' · Läuft bald ab'}
                </div>
              )}
              <StockAdjustForm
                itemId={item.id}
                unit={item.unit}
                onDone={() => {
                  reload()
                  reloadMovements()
                }}
              />
              <StockMovementHistory movements={movementsByItem[item.id] ?? []} />
            </li>
          ))}
        </ul>
      )}

      {canManageCatalog && (
        <>
          <h4 className="staff-section-title">Neuer Lagerartikel</h4>
          <form className="checkout-form" onSubmit={handleCreate}>
            <label className="checkout-form__field">
              Name
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label className="checkout-form__field">
              Einheit (z. B. kg, l, Stk.)
              <input type="text" required value={unit} onChange={(e) => setUnit(e.target.value)} />
            </label>
            <label className="checkout-form__field">
              Warnschwelle (optional)
              <input type="number" step="any" min="0" value={threshold} onChange={(e) => setThreshold(e.target.value)} />
            </label>
            <label className="checkout-form__field">
              Mindesthaltbarkeitsdatum (optional)
              <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
            </label>
            <label className="checkout-form__field">
              Warnung vor Ablauf (Tage)
              <input
                type="number"
                min="0"
                value={expiryWarningDays}
                onChange={(e) => setExpiryWarningDays(e.target.value)}
              />
            </label>
            {createError && <p className="menu-state menu-state--error">{createError}</p>}
            <button type="submit" className="btn btn-primary" disabled={creating}>
              {creating ? 'Wird erstellt…' : 'Artikel anlegen'}
            </button>
          </form>
        </>
      )}
    </div>
  )
}
