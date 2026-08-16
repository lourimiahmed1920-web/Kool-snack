import { useMemo, useState, type FormEvent } from 'react'
import { Pencil, Plus, Trash2, X } from 'lucide-react'
import { useMenu, flattenCategories } from '../hooks/useMenu'
import { supabase } from '../lib/supabase'
import { resolveMenuItemImage } from '../lib/menuImages'
import { toUserMessage } from '../lib/errors'
import { MenuItemForm } from './MenuItemForm'
import type { MenuCategory, MenuItem } from '../types/menu'

const currency = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' })

type Tab = 'items' | 'categories'

type FormState =
  | { mode: 'closed' }
  | { mode: 'create'; categoryId?: string }
  | { mode: 'edit'; item: MenuItem }

interface MenuSectionProps {
  restaurantId: string | null | undefined
}

/** Flattens the tree into render rows so subcategory dishes are listed under their own heading. */
function categoryRows(categories: MenuCategory[], depth = 0): { category: MenuCategory; depth: number }[] {
  return categories.flatMap((category) => [
    { category, depth },
    ...categoryRows(category.subcategories, depth + 1),
  ])
}

export function MenuSection({ restaurantId }: MenuSectionProps) {
  const { categories, loading, error, reload } = useMenu({ includeHidden: true })
  const [tab, setTab] = useState<Tab>('items')
  const [form, setForm] = useState<FormState>({ mode: 'closed' })
  const [actionError, setActionError] = useState<string | null>(null)

  const categoryOptions = useMemo(() => flattenCategories(categories), [categories])
  const rows = useMemo(() => categoryRows(categories), [categories])

  const toggleAvailability = async (item: MenuItem) => {
    setActionError(null)
    const { error: toggleError } = await supabase
      .from('menu_items')
      .update({ is_available: !item.is_available })
      .eq('id', item.id)
    if (toggleError) setActionError(toUserMessage(toggleError, 'Verfügbarkeit konnte nicht geändert werden.'))
    await reload()
  }

  const deleteItem = async (item: MenuItem) => {
    setActionError(null)
    const { error: deleteError } = await supabase.from('menu_items').delete().eq('id', item.id)
    if (deleteError) {
      // Dishes referenced by past orders can't be deleted — hiding them is the correct action.
      setActionError(
        `„${item.name}" kann nicht gelöscht werden (vermutlich in bestehenden Bestellungen verwendet). ` +
          'Setze das Gericht stattdessen auf „nicht verfügbar".',
      )
      return
    }
    await reload()
  }

  if (!restaurantId) return <p className="menu-state">Kein Restaurant zugeordnet.</p>

  return (
    <div>
      <div className="menu-admin-header">
        <h3 className="staff-section-title" style={{ marginBottom: 0 }}>
          Speisekarte
        </h3>
        {tab === 'items' && form.mode === 'closed' && (
          <button type="button" className="btn btn-primary" style={{ padding: '8px 16px' }} onClick={() => setForm({ mode: 'create' })}>
            <Plus size={16} />
            Neues Gericht
          </button>
        )}
      </div>

      <div className="checkout-form__order-type" style={{ maxWidth: 320, marginBottom: 16 }}>
        <label className={tab === 'items' ? 'active' : ''}>
          <input type="radio" checked={tab === 'items'} onChange={() => setTab('items')} />
          Gerichte
        </label>
        <label className={tab === 'categories' ? 'active' : ''}>
          <input type="radio" checked={tab === 'categories'} onChange={() => setTab('categories')} />
          Kategorien
        </label>
      </div>

      {error && <p className="menu-state menu-state--error">{error}</p>}
      {actionError && <p className="menu-state menu-state--error">{actionError}</p>}
      {loading && <p className="menu-state">Lädt…</p>}

      {form.mode !== 'closed' && tab === 'items' && (
        <MenuItemForm
          restaurantId={restaurantId}
          categoryOptions={categoryOptions}
          item={form.mode === 'edit' ? form.item : null}
          defaultCategoryId={form.mode === 'create' ? form.categoryId : undefined}
          onCancel={() => setForm({ mode: 'closed' })}
          onSaved={async (itemId) => {
            await reload()
            // Keep a freshly created dish open so variants can be added straight away.
            if (form.mode === 'create') {
              const { data } = await supabase.from('menu_items').select('*').eq('id', itemId).single()
              if (data) {
                setForm({
                  mode: 'edit',
                  item: { ...(data as MenuItem), price: Number(data.price), variants: [], optionGroups: [] },
                })
                return
              }
            }
            setForm({ mode: 'closed' })
          }}
        />
      )}

      {!loading && tab === 'items' && (
        <div className="menu-admin-list">
          {rows.map(({ category, depth }) =>
            category.items.length === 0 ? null : (
              <div key={category.id} className="menu-admin-group" style={{ marginLeft: depth * 12 }}>
                <div className="menu-admin-group__header">
                  <span className="menu-admin-group__name">{category.name}</span>
                  <span className="menu-admin-group__count">{category.items.length}</span>
                  {!category.is_active && <span className="badge badge-danger">Kategorie inaktiv</span>}
                </div>

                <ul className="menu-admin-rows">
                  {category.items.map((item) => (
                    <li key={item.id} className={`menu-admin-row${item.is_available ? '' : ' menu-admin-row--hidden'}`}>
                      <img
                        src={resolveMenuItemImage(item.name, category.name, item.image_url)}
                        alt=""
                        className="menu-admin-row__thumb"
                        loading="lazy"
                      />
                      <div className="menu-admin-row__info">
                        <span className="menu-admin-row__name">{item.name}</span>
                        <span className="menu-admin-row__meta">
                          {item.variants.length > 0
                            ? `ab ${currency.format(Math.min(...item.variants.map((v) => v.price)))} · ${item.variants.length} Varianten`
                            : currency.format(item.price)}
                        </span>
                      </div>

                      <div className="menu-admin-row__badges">
                        {item.is_seasonal && <span className="badge badge-warning">Saisonal</span>}
                        {!item.is_available && <span className="badge badge-danger">Nicht verfügbar</span>}
                        {!item.image_url && <span className="badge">Kein eigenes Foto</span>}
                      </div>

                      <div className="menu-admin-row__actions">
                        <button type="button" className="btn btn-secondary" onClick={() => toggleAvailability(item)}>
                          {item.is_available ? 'Ausblenden' : 'Anzeigen'}
                        </button>
                        <button
                          type="button"
                          className="menu-admin-icon-btn"
                          onClick={() => setForm({ mode: 'edit', item })}
                          aria-label={`${item.name} bearbeiten`}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          className="menu-admin-icon-btn menu-admin-icon-btn--danger"
                          onClick={() => deleteItem(item)}
                          aria-label={`${item.name} löschen`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ),
          )}
        </div>
      )}

      {!loading && tab === 'categories' && (
        <CategoryManager categories={categories} restaurantId={restaurantId} onChanged={reload} />
      )}
    </div>
  )
}

interface CategoryManagerProps {
  categories: MenuCategory[]
  restaurantId: string
  onChanged: () => Promise<void>
}

function CategoryManager({ categories, restaurantId, onChanged }: CategoryManagerProps) {
  const rows = useMemo(() => categoryRows(categories), [categories])
  const [editing, setEditing] = useState<MenuCategory | null>(null)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const remove = async (category: MenuCategory) => {
    setError(null)
    const { error: deleteError } = await supabase.from('menu_categories').delete().eq('id', category.id)
    if (deleteError) {
      setError(
        `„${category.name}" kann nicht gelöscht werden — die Kategorie enthält noch Gerichte oder wird verwendet. ` +
          'Setze sie stattdessen auf inaktiv.',
      )
      return
    }
    await onChanged()
  }

  const toggleActive = async (category: MenuCategory) => {
    setError(null)
    const { error: toggleError } = await supabase
      .from('menu_categories')
      .update({ is_active: !category.is_active })
      .eq('id', category.id)
    if (toggleError) setError(toUserMessage(toggleError, 'Kategorie konnte nicht geändert werden.'))
    await onChanged()
  }

  return (
    <div>
      {error && <p className="menu-state menu-state--error">{error}</p>}

      {!creating && !editing && (
        <button type="button" className="btn btn-secondary" style={{ marginBottom: 12 }} onClick={() => setCreating(true)}>
          <Plus size={15} />
          Neue Kategorie
        </button>
      )}

      {(creating || editing) && (
        <CategoryForm
          restaurantId={restaurantId}
          category={editing}
          categories={categories}
          onCancel={() => {
            setCreating(false)
            setEditing(null)
          }}
          onSaved={async () => {
            setCreating(false)
            setEditing(null)
            await onChanged()
          }}
        />
      )}

      <ul className="menu-admin-rows">
        {rows.map(({ category, depth }) => (
          <li key={category.id} className="menu-admin-row" style={{ marginLeft: depth * 16 }}>
            <div className="menu-admin-row__info">
              <span className="menu-admin-row__name">{category.name}</span>
              <span className="menu-admin-row__meta">
                {category.items.length} Gerichte
                {category.subcategories.length > 0 && ` · ${category.subcategories.length} Unterkategorien`}
              </span>
            </div>
            {!category.is_active && <span className="badge badge-danger">Inaktiv</span>}
            <div className="menu-admin-row__actions">
              <button type="button" className="btn btn-secondary" onClick={() => toggleActive(category)}>
                {category.is_active ? 'Deaktivieren' : 'Aktivieren'}
              </button>
              <button
                type="button"
                className="menu-admin-icon-btn"
                onClick={() => setEditing(category)}
                aria-label={`${category.name} bearbeiten`}
              >
                <Pencil size={15} />
              </button>
              <button
                type="button"
                className="menu-admin-icon-btn menu-admin-icon-btn--danger"
                onClick={() => remove(category)}
                aria-label={`${category.name} löschen`}
              >
                <Trash2 size={15} />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

interface CategoryFormProps {
  restaurantId: string
  category: MenuCategory | null
  categories: MenuCategory[]
  onSaved: () => void
  onCancel: () => void
}

function CategoryForm({ restaurantId, category, categories, onSaved, onCancel }: CategoryFormProps) {
  const [name, setName] = useState(category?.name ?? '')
  const [description, setDescription] = useState(category?.description ?? '')
  const [parentId, setParentId] = useState(category?.parent_category_id ?? '')
  const [displayOrder, setDisplayOrder] = useState(String(category?.display_order ?? 0))
  const [isActive, setIsActive] = useState(category?.is_active ?? true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // A category can't be its own parent; nesting deeper than one level isn't supported by the public menu.
  const parentOptions = categories.filter((c) => c.id !== category?.id)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError(null)

    const payload = {
      restaurant_id: restaurantId,
      name: name.trim(),
      description: description.trim() || null,
      parent_category_id: parentId || null,
      display_order: Number(displayOrder) || 0,
      is_active: isActive,
    }

    const { error: saveError } = category
      ? await supabase.from('menu_categories').update(payload).eq('id', category.id)
      : await supabase.from('menu_categories').insert(payload)

    setSaving(false)
    if (saveError) {
      setError(toUserMessage(saveError, 'Kategorie konnte nicht gespeichert werden.'))
      return
    }
    onSaved()
  }

  return (
    <form className="menu-admin-form" onSubmit={handleSubmit}>
      <div className="menu-admin-form__header">
        <h4 className="staff-section-title" style={{ marginBottom: 0 }}>
          {category ? 'Kategorie bearbeiten' : 'Neue Kategorie'}
        </h4>
        <button type="button" className="menu-admin-form__close" onClick={onCancel} aria-label="Schließen">
          <X size={18} />
        </button>
      </div>

      <div className="menu-admin-form__grid">
        <label className="checkout-form__field">
          Name
          <input type="text" required value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="checkout-form__field">
          Übergeordnete Kategorie
          <select value={parentId} onChange={(e) => setParentId(e.target.value)}>
            <option value="">— keine (Hauptkategorie)</option>
            {parentOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </label>
        <label className="checkout-form__field">
          Reihenfolge
          <input type="number" value={displayOrder} onChange={(e) => setDisplayOrder(e.target.value)} />
        </label>
      </div>

      <label className="checkout-form__field">
        Beschreibung
        <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
      </label>

      <label className="menu-admin-toggle">
        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
        Aktiv (auf der Speisekarte sichtbar)
      </label>

      {error && <p className="menu-state menu-state--error">{error}</p>}

      <div className="menu-admin-form__actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Wird gespeichert…' : category ? 'Änderungen speichern' : 'Kategorie anlegen'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Abbrechen
        </button>
      </div>
    </form>
  )
}
