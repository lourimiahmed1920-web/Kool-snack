import type { MenuCategory } from '../types/menu'

/**
 * The list of categories the customer actually browses: a category with
 * subcategories is only a container, so its children are the browsable cards; a
 * category without subcategories is browsable itself.
 *
 * This exact flatMap was duplicated across the home grid, the category nav and
 * the category route resolver — three copies that all had to agree for a slug to
 * resolve to the same card the grid linked to.
 *
 * Not to be confused with `flattenCategories` in `useMenu.ts`, which flattens the
 * same tree into a depth-tagged picker list for the admin screens.
 */
export function browsableCategories(categories: MenuCategory[]): MenuCategory[] {
  return categories.flatMap((category) =>
    category.subcategories.length > 0 ? category.subcategories : [category],
  )
}
