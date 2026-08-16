import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { toUserMessage } from '../lib/errors'
import type { MenuCategory, MenuItem, MenuItemOption, MenuItemOptionGroup, MenuItemVariant } from '../types/menu'

interface UseMenuOptions {
  /**
   * Admin screens must see hidden rows so a deactivated category / unavailable dish
   * can be found and re-enabled. The public site must never pass this — RLS still
   * blocks anon reads of hidden rows, this only relaxes the client-side filter.
   */
  includeHidden?: boolean
}

interface UseMenuResult {
  categories: MenuCategory[]
  loading: boolean
  error: string | null
  reload: () => Promise<void>
}

export function useMenu({ includeHidden = false }: UseMenuOptions = {}): UseMenuResult {
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    let categoriesQuery = supabase.from('menu_categories').select('*').order('display_order')
    let itemsQuery = supabase.from('menu_items').select('*').order('display_order')
    if (!includeHidden) {
      categoriesQuery = categoriesQuery.eq('is_active', true)
      itemsQuery = itemsQuery.eq('is_available', true)
    }

    const [categoriesRes, itemsRes, variantsRes, optionGroupsRes, optionsRes] = await Promise.all([
      categoriesQuery,
      itemsQuery,
      supabase.from('menu_item_variants').select('*').order('display_order'),
      supabase.from('menu_item_option_groups').select('*').order('display_order'),
      supabase.from('menu_item_options').select('*').order('display_order'),
    ])

    const firstError =
      categoriesRes.error ?? itemsRes.error ?? variantsRes.error ?? optionGroupsRes.error ?? optionsRes.error
    if (firstError) {
      // This string is rendered on the public home and menu screens, so it must
      // never be the raw PostgREST message — those name tables, columns and RLS
      // policies. toUserMessage logs the real error for developers instead.
      setError(
        toUserMessage(firstError, 'Die Speisekarte konnte nicht geladen werden. Bitte versuche es später erneut.'),
      )
      setLoading(false)
      return
    }

    const variantsByItem = new Map<string, MenuItemVariant[]>()
    for (const v of variantsRes.data ?? []) {
      const variant: MenuItemVariant = {
        id: v.id,
        menu_item_id: v.menu_item_id,
        label: v.label,
        price: Number(v.price),
        display_order: v.display_order,
      }
      const list = variantsByItem.get(v.menu_item_id) ?? []
      list.push(variant)
      variantsByItem.set(v.menu_item_id, list)
    }

    const optionsByGroup = new Map<string, MenuItemOption[]>()
    for (const o of optionsRes.data ?? []) {
      const option: MenuItemOption = {
        id: o.id,
        group_id: o.group_id,
        label: o.label,
        price_delta: Number(o.price_delta),
        display_order: o.display_order,
      }
      const list = optionsByGroup.get(o.group_id) ?? []
      list.push(option)
      optionsByGroup.set(o.group_id, list)
    }

    const optionGroupsByItem = new Map<string, MenuItemOptionGroup[]>()
    for (const g of optionGroupsRes.data ?? []) {
      const group: MenuItemOptionGroup = {
        id: g.id,
        menu_item_id: g.menu_item_id,
        name: g.name,
        selection_type: g.selection_type,
        is_required: g.is_required,
        max_selections: g.max_selections,
        display_order: g.display_order,
        options: optionsByGroup.get(g.id) ?? [],
      }
      const list = optionGroupsByItem.get(g.menu_item_id) ?? []
      list.push(group)
      optionGroupsByItem.set(g.menu_item_id, list)
    }

    const itemsByCategory = new Map<string, MenuItem[]>()
    for (const raw of itemsRes.data ?? []) {
      const item: MenuItem = {
        id: raw.id,
        restaurant_id: raw.restaurant_id,
        category_id: raw.category_id,
        name: raw.name,
        description: raw.description,
        price: Number(raw.price),
        image_url: raw.image_url,
        is_available: raw.is_available,
        is_seasonal: raw.is_seasonal,
        allergens: raw.allergens,
        display_order: raw.display_order,
        variants: variantsByItem.get(raw.id) ?? [],
        optionGroups: optionGroupsByItem.get(raw.id) ?? [],
      }
      if (!item.category_id) continue
      const list = itemsByCategory.get(item.category_id) ?? []
      list.push(item)
      itemsByCategory.set(item.category_id, list)
    }

    const categoryMap = new Map<string, MenuCategory>()
    for (const raw of categoriesRes.data ?? []) {
      categoryMap.set(raw.id, {
        id: raw.id,
        restaurant_id: raw.restaurant_id,
        name: raw.name,
        description: raw.description,
        parent_category_id: raw.parent_category_id,
        display_order: raw.display_order,
        is_active: raw.is_active,
        items: itemsByCategory.get(raw.id) ?? [],
        subcategories: [],
      })
    }

    const roots: MenuCategory[] = []
    for (const category of categoryMap.values()) {
      if (category.parent_category_id) {
        const parent = categoryMap.get(category.parent_category_id)
        if (parent) {
          parent.subcategories.push(category)
          continue
        }
      }
      roots.push(category)
    }

    const byOrder = (a: MenuCategory, b: MenuCategory) => a.display_order - b.display_order
    roots.sort(byOrder)
    for (const category of categoryMap.values()) {
      category.subcategories.sort(byOrder)
    }

    setCategories(roots)
    setLoading(false)
  }, [includeHidden])

  useEffect(() => {
    let cancelled = false
    load().catch(() => {
      if (!cancelled) setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [load])

  return { categories, loading, error, reload: load }
}

/** Flattens the category tree into a selectable list, keeping parent → child order and depth. */
export function flattenCategories(categories: MenuCategory[]): { id: string; name: string; depth: number }[] {
  const out: { id: string; name: string; depth: number }[] = []
  const walk = (list: MenuCategory[], depth: number) => {
    for (const category of list) {
      out.push({ id: category.id, name: category.name, depth })
      walk(category.subcategories, depth + 1)
    }
  }
  walk(categories, 0)
  return out
}
