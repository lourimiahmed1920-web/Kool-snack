export interface MenuItemVariant {
  id: string
  menu_item_id: string
  label: string
  price: number
  display_order: number
}

export interface MenuItemOption {
  id: string
  group_id: string
  label: string
  price_delta: number
  display_order: number
}

export interface MenuItemOptionGroup {
  id: string
  menu_item_id: string
  name: string
  selection_type: 'single' | 'multiple'
  is_required: boolean
  max_selections: number | null
  display_order: number
  options: MenuItemOption[]
}

export interface MenuItem {
  id: string
  restaurant_id: string
  category_id: string | null
  name: string
  description: string | null
  price: number
  image_url: string | null
  is_available: boolean
  is_seasonal: boolean
  allergens: string[] | null
  display_order: number
  variants: MenuItemVariant[]
  optionGroups: MenuItemOptionGroup[]
}

export interface MenuCategory {
  id: string
  restaurant_id: string
  name: string
  description: string | null
  parent_category_id: string | null
  display_order: number
  is_active: boolean
  items: MenuItem[]
  subcategories: MenuCategory[]
}
