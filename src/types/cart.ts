export interface CartLineOption {
  /** Needed at checkout: the server re-reads the price from this id, never from priceDelta. */
  optionId: string
  groupName: string
  label: string
  priceDelta: number
}

export interface CartLine {
  /** menu_item_id + variant_id (or 'base') + a hash of selected options so distinct configurations stack as separate lines. */
  key: string
  menuItemId: string
  /** Needed at checkout so the server can price the chosen size itself. */
  variantId: string | null
  name: string
  variantLabel: string | null
  selectedOptions: CartLineOption[]
  /** Display only. The authoritative price is computed by create_guest_order() in Postgres. */
  unitPrice: number
  quantity: number
  imageUrl: string
}
