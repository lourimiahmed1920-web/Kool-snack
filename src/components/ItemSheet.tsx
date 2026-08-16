import { useMemo, useState } from 'react'
import type { MenuItem } from '../types/menu'
import type { CartLineOption } from '../types/cart'
import { useCart } from '../contexts/CartContext'
import { BottomSheet } from './BottomSheet'
import { QuantityStepper } from './QuantityStepper'
import { currency } from '../lib/format'
import { haptic } from '../lib/native'

interface ItemSheetProps {
  item: MenuItem
  imageUrl: string
  onClose: () => void
}

/**
 * Dish detail + configuration, in a bottom sheet. Shown for every dish, not only
 * configurable ones — for a simple item it is still the only place the photo,
 * description and allergens are readable at full size.
 */
export function ItemSheet({ item, imageUrl, onClose }: ItemSheetProps) {
  const { addLine } = useCart()

  const hasVariants = item.variants.length > 0
  const sortedVariants = useMemo(
    () => [...item.variants].sort((a, b) => a.display_order - b.display_order),
    [item.variants],
  )
  const sortedGroups = useMemo(
    () => [...item.optionGroups].sort((a, b) => a.display_order - b.display_order),
    [item.optionGroups],
  )

  const [variantId, setVariantId] = useState<string | null>(sortedVariants[0]?.id ?? null)
  const [selections, setSelections] = useState<Record<string, string[]>>({})
  const [quantity, setQuantity] = useState(1)

  const selectedVariant = sortedVariants.find((variant) => variant.id === variantId) ?? null
  const basePrice = hasVariants ? (selectedVariant?.price ?? 0) : item.price

  const selectedOptions: CartLineOption[] = sortedGroups.flatMap((group) => {
    const chosenIds = selections[group.id] ?? []
    return group.options
      .filter((option) => chosenIds.includes(option.id))
      .map((option) => ({
        optionId: option.id,
        groupName: group.name,
        label: option.label,
        priceDelta: option.price_delta,
      }))
  })

  const unitPrice = basePrice + selectedOptions.reduce((sum, option) => sum + option.priceDelta, 0)

  const missingRequiredGroup = sortedGroups.find(
    (group) => group.is_required && (selections[group.id]?.length ?? 0) === 0,
  )
  const canSubmit = (!hasVariants || variantId !== null) && !missingRequiredGroup

  function toggleOption(groupId: string, optionId: string, mode: 'single' | 'multiple', max: number | null) {
    haptic('select')
    setSelections((prev) => {
      const current = prev[groupId] ?? []
      if (mode === 'single') return { ...prev, [groupId]: [optionId] }
      if (current.includes(optionId)) {
        return { ...prev, [groupId]: current.filter((id) => id !== optionId) }
      }
      if (max !== null && current.length >= max) return prev
      return { ...prev, [groupId]: [...current, optionId] }
    })
  }

  function handleSubmit() {
    if (!canSubmit) return
    haptic('success')

    // Distinct configurations of the same dish must stack as separate cart lines,
    // so the key has to encode the variant and the chosen options.
    const key = [
      item.id,
      variantId ?? 'base',
      ...selectedOptions.map((option) => `${option.groupName}:${option.label}`).sort(),
    ].join('|')

    addLine(
      {
        key,
        menuItemId: item.id,
        variantId: selectedVariant?.id ?? null,
        name: item.name,
        variantLabel: selectedVariant?.label ?? null,
        selectedOptions,
        unitPrice,
        imageUrl,
      },
      quantity,
    )
    onClose()
  }

  return (
    <BottomSheet
      title={item.name}
      subtitle={item.description}
      onClose={onClose}
      footer={
        <div className="sheet-actions">
          <QuantityStepper
            quantity={quantity}
            onAdd={() => setQuantity((q) => q + 1)}
            onRemove={() => setQuantity((q) => Math.max(1, q - 1))}
            min={1}
          />
          <button type="button" className="btn btn-primary sheet-actions__submit" onClick={handleSubmit} disabled={!canSubmit}>
            <span>In den Warenkorb</span>
            <span className="sheet-actions__price">{currency.format(unitPrice * quantity)}</span>
          </button>
        </div>
      }
    >
      <img src={imageUrl} alt="" className="sheet__hero" loading="eager" decoding="async" />

      {item.allergens && item.allergens.length > 0 && (
        <p className="sheet__allergens">Allergene: {item.allergens.join(', ')}</p>
      )}

      {hasVariants && (
        <fieldset className="option-group">
          <legend className="option-group__header">
            <span className="option-group__name">
              Größe <span className="option-group__required">*</span>
            </span>
            <span className="option-group__hint">1 wählen</span>
          </legend>
          {sortedVariants.map((variant) => (
            <label
              key={variant.id}
              className={`option-row${variantId === variant.id ? ' option-row--selected' : ''}`}
            >
              <input
                type="radio"
                name="variant"
                checked={variantId === variant.id}
                onChange={() => {
                  haptic('select')
                  setVariantId(variant.id)
                }}
              />
              <span className="option-row__label">{variant.label}</span>
              {variant.id !== sortedVariants[0]?.id && (
                <span className="option-row__price">
                  +{currency.format(variant.price - sortedVariants[0].price)}
                </span>
              )}
            </label>
          ))}
        </fieldset>
      )}

      {sortedGroups.map((group) => (
        <fieldset key={group.id} className="option-group">
          <legend className="option-group__header">
            <span className="option-group__name">
              {group.name} {group.is_required && <span className="option-group__required">*</span>}
            </span>
            <span className="option-group__hint">
              {group.selection_type === 'single'
                ? '1 wählen'
                : group.max_selections
                  ? `bis zu ${group.max_selections}`
                  : 'mehrere möglich'}
            </span>
          </legend>
          {group.options.map((option) => {
            const checked = (selections[group.id] ?? []).includes(option.id)
            return (
              <label key={option.id} className={`option-row${checked ? ' option-row--selected' : ''}`}>
                <input
                  type={group.selection_type === 'single' ? 'radio' : 'checkbox'}
                  name={group.id}
                  checked={checked}
                  onChange={() =>
                    toggleOption(group.id, option.id, group.selection_type, group.max_selections)
                  }
                />
                <span className="option-row__label">{option.label}</span>
                {option.price_delta > 0 && (
                  <span className="option-row__price">+{currency.format(option.price_delta)}</span>
                )}
              </label>
            )
          })}
        </fieldset>
      ))}
    </BottomSheet>
  )
}
