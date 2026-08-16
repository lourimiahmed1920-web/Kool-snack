import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { ImagePlus, Trash2, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { uploadMenuImage } from '../lib/menuImageUpload'
import { toUserMessage } from '../lib/errors'
import { resolveMenuItemImage } from '../lib/menuImages'
import type { MenuItem, MenuItemVariant } from '../types/menu'

const currency = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' })

export interface CategoryOption {
  id: string
  name: string
  depth: number
}

interface MenuItemFormProps {
  restaurantId: string
  categoryOptions: CategoryOption[]
  /** null = create a new dish. */
  item: MenuItem | null
  defaultCategoryId?: string
  onSaved: (itemId: string) => void
  onCancel: () => void
}

export function MenuItemForm({
  restaurantId,
  categoryOptions,
  item,
  defaultCategoryId,
  onSaved,
  onCancel,
}: MenuItemFormProps) {
  // Generated up front for new dishes so a photo can be uploaded to its folder before the row exists.
  const idRef = useRef(item?.id ?? crypto.randomUUID())
  const itemId = idRef.current
  const isEdit = item !== null

  const [name, setName] = useState(item?.name ?? '')
  const [categoryId, setCategoryId] = useState(item?.category_id ?? defaultCategoryId ?? categoryOptions[0]?.id ?? '')
  const [price, setPrice] = useState(item ? String(item.price) : '')
  const [description, setDescription] = useState(item?.description ?? '')
  const [allergens, setAllergens] = useState((item?.allergens ?? []).join(', '))
  const [displayOrder, setDisplayOrder] = useState(String(item?.display_order ?? 0))
  const [isAvailable, setIsAvailable] = useState(item?.is_available ?? true)
  const [isSeasonal, setIsSeasonal] = useState(item?.is_seasonal ?? false)
  const [imageUrl, setImageUrl] = useState<string | null>(item?.image_url ?? null)

  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [variants, setVariants] = useState<MenuItemVariant[]>(item?.variants ?? [])
  const [variantLabel, setVariantLabel] = useState('')
  const [variantPrice, setVariantPrice] = useState('')

  const reloadVariants = useCallback(async () => {
    const { data } = await supabase
      .from('menu_item_variants')
      .select('*')
      .eq('menu_item_id', itemId)
      .order('display_order')
    setVariants(
      (data ?? []).map((v) => ({
        id: v.id,
        menu_item_id: v.menu_item_id,
        label: v.label,
        price: Number(v.price),
        display_order: v.display_order,
      })),
    )
  }, [itemId])

  useEffect(() => {
    if (isEdit) reloadVariants()
  }, [isEdit, reloadVariants])

  const handleUpload = async (file: File) => {
    setUploading(true)
    setError(null)
    const { url, error: uploadError } = await uploadMenuImage(file, itemId)
    if (uploadError) {
      setError(uploadError)
    } else {
      setImageUrl(url)
      // Persist immediately for an existing dish so the photo isn't lost if the form is abandoned.
      if (isEdit) await supabase.from('menu_items').update({ image_url: url }).eq('id', itemId)
    }
    setUploading(false)
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!categoryId) {
      setError('Bitte eine Kategorie wählen.')
      return
    }
    setSaving(true)
    setError(null)

    const payload = {
      restaurant_id: restaurantId,
      category_id: categoryId,
      name: name.trim(),
      description: description.trim() || null,
      price: Number(price) || 0,
      image_url: imageUrl,
      is_available: isAvailable,
      is_seasonal: isSeasonal,
      allergens: allergens.trim() ? allergens.split(',').map((a) => a.trim()).filter(Boolean) : null,
      display_order: Number(displayOrder) || 0,
    }

    const { error: saveError } = isEdit
      ? await supabase.from('menu_items').update(payload).eq('id', itemId)
      : await supabase.from('menu_items').insert({ id: itemId, ...payload })

    setSaving(false)
    if (saveError) {
      setError(toUserMessage(saveError, 'Gericht konnte nicht gespeichert werden.'))
      return
    }
    onSaved(itemId)
  }

  const addVariant = async () => {
    if (!variantLabel.trim() || !variantPrice) return
    const { error: variantError } = await supabase.from('menu_item_variants').insert({
      menu_item_id: itemId,
      label: variantLabel.trim(),
      price: Number(variantPrice) || 0,
      display_order: variants.length,
    })
    if (variantError) {
      setError(toUserMessage(variantError, 'Variante konnte nicht hinzugefügt werden.'))
      return
    }
    setVariantLabel('')
    setVariantPrice('')
    await reloadVariants()
  }

  const removeVariant = async (variantId: string) => {
    const { error: variantError } = await supabase.from('menu_item_variants').delete().eq('id', variantId)
    if (variantError) {
      setError(toUserMessage(variantError, 'Variante konnte nicht entfernt werden.'))
      return
    }
    await reloadVariants()
  }

  const previewSrc = imageUrl ?? resolveMenuItemImage(name || 'Gericht', null, null)

  return (
    <form className="menu-admin-form" onSubmit={handleSubmit}>
      <div className="menu-admin-form__header">
        <h4 className="staff-section-title" style={{ marginBottom: 0 }}>
          {isEdit ? 'Gericht bearbeiten' : 'Neues Gericht'}
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
          Kategorie
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            {categoryOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {'  '.repeat(option.depth)}
                {option.name}
              </option>
            ))}
          </select>
        </label>

        <label className="checkout-form__field">
          Preis (€)
          <input
            type="number"
            step="0.01"
            min="0"
            required
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
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

      <label className="checkout-form__field">
        Allergene (mit Komma trennen)
        <input
          type="text"
          placeholder="z. B. Gluten, Laktose"
          value={allergens}
          onChange={(e) => setAllergens(e.target.value)}
        />
      </label>

      <div className="menu-admin-form__toggles">
        <label className="menu-admin-toggle">
          <input type="checkbox" checked={isAvailable} onChange={(e) => setIsAvailable(e.target.checked)} />
          Verfügbar (auf der Speisekarte sichtbar)
        </label>
        <label className="menu-admin-toggle">
          <input type="checkbox" checked={isSeasonal} onChange={(e) => setIsSeasonal(e.target.checked)} />
          Saisonal
        </label>
      </div>

      <div className="menu-admin-form__image">
        <img src={previewSrc} alt="" className="menu-admin-form__preview" />
        <div className="menu-admin-form__image-actions">
          <label className="btn btn-secondary menu-admin-form__upload">
            <ImagePlus size={16} />
            {uploading ? 'Wird hochgeladen…' : 'Foto hochladen'}
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleUpload(file)
                e.target.value = ''
              }}
            />
          </label>
          {imageUrl && (
            <button type="button" className="cart-line__remove" onClick={() => setImageUrl(null)}>
              Foto entfernen
            </button>
          )}
          {!imageUrl && <span className="menu-admin-hint">Ohne Foto wird automatisch ein passendes Bild gewählt.</span>}
        </div>
      </div>

      <div className="menu-admin-variants">
        <h5 className="menu-admin-variants__title">Größen / Varianten</h5>
        {!isEdit && (
          <p className="menu-admin-hint">Zuerst speichern, danach können Varianten hinzugefügt werden.</p>
        )}

        {isEdit && (
          <>
            {variants.length === 0 && <p className="menu-admin-hint">Keine Varianten — es gilt der Grundpreis.</p>}
            {variants.length > 0 && (
              <ul className="menu-admin-variants__list">
                {variants.map((variant) => (
                  <li key={variant.id}>
                    <span>{variant.label}</span>
                    <span>{currency.format(variant.price)}</span>
                    <button
                      type="button"
                      className="menu-admin-icon-btn"
                      onClick={() => removeVariant(variant.id)}
                      aria-label={`${variant.label} entfernen`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="menu-admin-variants__add">
              <input
                type="text"
                placeholder="Bezeichnung (z. B. 31 cm)"
                value={variantLabel}
                onChange={(e) => setVariantLabel(e.target.value)}
              />
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Preis"
                value={variantPrice}
                onChange={(e) => setVariantPrice(e.target.value)}
              />
              <button type="button" className="btn btn-secondary" onClick={addVariant}>
                Hinzufügen
              </button>
            </div>
          </>
        )}
      </div>

      {error && <p className="menu-state menu-state--error">{error}</p>}

      <div className="menu-admin-form__actions">
        <button type="submit" className="btn btn-primary" disabled={saving || uploading}>
          {saving ? 'Wird gespeichert…' : isEdit ? 'Änderungen speichern' : 'Gericht anlegen'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Abbrechen
        </button>
      </div>
    </form>
  )
}
