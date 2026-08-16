import { Pizza, Beef, Drumstick, Salad, CupSoda, UtensilsCrossed, type LucideIcon } from 'lucide-react'
import catPizza from '../assets/menu/cat-pizza.jpg'
import catPizzabroetchen from '../assets/menu/cat-pizzabroetchen.jpg'
import catPasta from '../assets/menu/cat-pasta.jpg'
import catSalate from '../assets/menu/cat-salate.jpg'
import catSchnitzel from '../assets/menu/cat-schnitzel.jpg'
import catBurger from '../assets/menu/cat-burger.jpg'
import catTacos from '../assets/menu/cat-tacos.jpg'
import catShawarma from '../assets/menu/cat-shawarma.jpg'
import catHaehnchen from '../assets/menu/cat-haehnchen.jpg'
import catMilkshakes from '../assets/menu/cat-milkshakes.jpg'
import catGetraenke from '../assets/menu/cat-getraenke.jpg'
import catHeissgetraenke from '../assets/menu/cat-heissgetraenke.jpg'
import catCocktails from '../assets/menu/cat-cocktails.jpg'

import pizzaCapricciosa from '../assets/menu/items/pizza/Capricosa.webp'
import pizzaBolognese from '../assets/menu/items/pizza/Bolognese.webp'
import pizzaCalzone from '../assets/menu/items/pizza/Calzone.webp'
import pizzaDiavolo from '../assets/menu/items/pizza/Diavolo.webp'
import pizzaHawaii from '../assets/menu/items/pizza/Hawaii.webp'
import pizzaHollandaise from '../assets/menu/items/pizza/Hollandaise.webp'
import pizzaVegetarisch from '../assets/menu/items/pizza/Vegetarisch.webp'
import pizzaParma from '../assets/menu/items/pizza/Parma.webp'
import pizzaUeberraschung from '../assets/menu/items/pizza/Uberraschung.webp'
import pizzaSucuk from '../assets/menu/items/pizza/Sucuk.webp'
import itemBurgerBeef from '../assets/menu/items/Burger/BeefBurger.webp'
import itemBurgerChicken from '../assets/menu/items/Burger/Chickenburger.webp'
import itemPastaSeafood from '../assets/menu/items/pasta-seafood.jpg'
import itemSalad from '../assets/menu/items/salad.jpg'
import itemHaehnchenSalat from '../assets/menu/Hahnchensalat.webp'
import itemShrimpsSalat from '../assets/menu/Schrimpssalat.webp'
import itemSpaghettiBolognese from '../assets/menu/SpaghettiBolognese.jpg'
import itemPenneAlfredoNew from '../assets/menu/PenneAlfredo.webp'
import itemPenneVegetarischNew from '../assets/menu/PenneVegetarisch.webp'
import itemIcedCoffee from '../assets/menu/items/iced-coffee.jpg'
import itemSunriseOrange from '../assets/menu/items/Cocktails/orange.webp'
import itemStrawberryDream from '../assets/menu/items/Cocktails/Strawberry.webp'
import itemMangoParadise from '../assets/menu/items/Cocktails/Mango.webp'
import pizzaNapoletana from '../assets/menu/items/pizza/Napoletana.webp'
import itemKaffeeCrema from '../assets/menu/items/Heissgetraenke/Kaffeecrema.webp'
import itemCappuccino from '../assets/menu/items/cappuccino.jpg'
import itemLatteMacchiato from '../assets/menu/items/latte-macchiato.jpg'
import itemAmericano from '../assets/menu/items/Heissgetraenke/Americano.webp'
import itemAglioEOlio from '../assets/menu/items/aglio-e-olio.jpg'
import itemArrabiata from '../assets/menu/items/arrabiata.jpg'
import itemCheeseburger from '../assets/menu/items/Burger/Cheeseburger.webp'
import itemFischburger from '../assets/menu/items/Burger/Fischburger.webp'
import itemVeggieBurger from '../assets/menu/items/Burger/Veggieburger.webp'
import itemSpezialBurger from '../assets/menu/items/Burger/Spezialburger.webp'
import itemDoppelBurger from '../assets/menu/items/Burger/Doppelburger.webp'
import itemGrilledChicken from '../assets/menu/items/grilled-chicken.webp'
import itemEspresso from '../assets/menu/items/espresso.jpg'
import itemKiwiFresh from '../assets/menu/items/Cocktails/kiwi.webp'
import itemTropicalPineapple from '../assets/menu/items/Cocktails/pineapple.webp'
import itemFreshLemonMint from '../assets/menu/items/Cocktails/Limon.webp'
import itemBananaMilkshake from '../assets/menu/items/Cocktails/Bannane.webp'
import itemJagerschnitzel from '../assets/menu/Jagerschnitzel.webp'
import itemWienerSchnitzel from '../assets/menu/Wienerschnitzel.webp'
import itemCordonBleuNew from '../assets/menu/CordonBleuschnitzel.webp'
import itemChickenTacosNew from '../assets/menu/ChickenTacos.webp'
import itemBeefTacos from '../assets/menu/BeefTacos.webp'
import itemMixTacos from '../assets/menu/MixTacos.webp'
import itemSteakTacos from '../assets/menu/SteakTacos.webp'
import itemShawarmaHaehnchenNew from '../assets/menu/ShawarmaRollehahnchen.webp'
import itemShawarmaLamm from '../assets/menu/ShawarmarRollelamm.webp'
import itemHalbesHaehnchen from '../assets/menu/Halbesgegrillteshahnchen.webp'
import itemSpriteNew from '../assets/menu/Sprite.webp'
import itemFantaNew from '../assets/menu/Fanta.webp'
import itemColaNew from '../assets/menu/Cola.webp'
import itemRedBullNew from '../assets/menu/RedBull.webp'
import itemMineralwasser05l from '../assets/menu/MineralWasser0.5l.webp'
import pizzaMargheritaNew from '../assets/menu/PizzaMargherita.webp'
import pizzaSalamiNew from '../assets/menu/Salami.webp'
import pizzaSchinkenNew from '../assets/menu/Schinken.webp'
import pizzaFunghiNew from '../assets/menu/Funghi.webp'
import pizzaTonnoNew from '../assets/menu/Tonno.webp'
import pizzaLachsNew from '../assets/menu/Lachs.webp'
import pizzaScampiNew from '../assets/menu/Scampi.webp'
import pizzaQuattroFormaggiNew from '../assets/menu/QuattroFrommaggi.webp'
import pizzaFruttiDiMareNew from '../assets/menu/Fruttidimare.webp'
import brotchenKase from '../assets/menu/items/PizzaBrotchen/Kase.webp'
import brotchenSchinken from '../assets/menu/items/PizzaBrotchen/schinken.webp'
import brotchenSalami from '../assets/menu/items/PizzaBrotchen/Salami.webp'
import brotchenThunfisch from '../assets/menu/items/PizzaBrotchen/Thunfisch.webp'
import brotchenHaehnchen from '../assets/menu/items/PizzaBrotchen/Hahnchen.webp'

/**
 * Category photos, carried over from the Kool Snack Neuss Lovable prototype
 * (bite-road-app.lovable.app) so the menu uses real, on-brand photography
 * instead of generic stock images.
 */
export const MENU_PHOTOS = {
  pizza: catPizza,
  pizzabroetchen: catPizzabroetchen,
  pasta: catPasta,
  salate: catSalate,
  schnitzel: catSchnitzel,
  burger: catBurger,
  tacos: catTacos,
  shawarma: catShawarma,
  haehnchen: catHaehnchen,
  milkshakes: catMilkshakes,
  getraenke: catGetraenke,
  heissgetraenke: catHeissgetraenke,
  cocktails: catCocktails,
} as const

/** Category name → photo (case-insensitive). Used when no item-specific photo exists. */
const CATEGORY_PHOTOS: Record<string, string> = {
  pizza: MENU_PHOTOS.pizza,
  'gefüllte pizzabrötchen': MENU_PHOTOS.pizzabroetchen,
  salate: MENU_PHOTOS.salate,
  pasta: MENU_PHOTOS.pasta,
  schnitzel: MENU_PHOTOS.schnitzel,
  tacos: MENU_PHOTOS.tacos,
  burger: MENU_PHOTOS.burger,
  'shawarma rolle': MENU_PHOTOS.shawarma,
  'gegrilltes hähnchen': MENU_PHOTOS.haehnchen,
  kaltgetränke: MENU_PHOTOS.getraenke,
  heißgetränke: MENU_PHOTOS.heissgetraenke,
  getränke: MENU_PHOTOS.getraenke,
}

/**
 * "Cocktails & Milkshakes" is a mixed subcategory, so it can't map to a
 * single photo the way the others do — fall back to a keyword check on the
 * item name so milkshakes don't get a cocktail-glass photo and vice versa.
 */
const MIXED_DRINKS_CATEGORY = 'cocktails & milkshakes'

/**
 * Exact "category::item name" → verified, individually-checked photo (case-insensitive).
 * Keyed by category as well as name because a handful of item names repeat across
 * categories with a completely different dish behind them (e.g. "Schinken" and
 * "Salami" each exist as both a whole Pizza and a Gefüllte Pizzabrötchen) — a
 * name-only lookup would show a whole-pizza photo on the pizzabrötchen.
 *
 * Every entry here was visually confirmed to actually depict the dish — several
 * initial candidates (a "seafood pizza" that was really BBQ chicken, a "calzone"
 * that wasn't folded, a "shrimp salad" with no shrimp) were rejected rather than
 * used just because the URL resolved. This is intentionally a partial list:
 * unmapped items fall back to their category photo instead of a guessed match.
 *
 * The pizza entries are cropped from a single AI-generated collage (18 pizzas,
 * each with matching toppings for the exact menu item) rather than stock photos.
 */
const ITEM_PHOTOS: Record<string, string> = {
  'pizza::margherita': pizzaMargheritaNew,
  'pizza::salami': pizzaSalamiNew,
  'pizza::schinken': pizzaSchinkenNew,
  'pizza::capricciosa': pizzaCapricciosa,
  'pizza::funghi': pizzaFunghiNew,
  'pizza::tonno': pizzaTonnoNew,
  'pizza::lachs': pizzaLachsNew,
  'pizza::bolognese': pizzaBolognese,
  'pizza::calzone': pizzaCalzone,
  'pizza::scampi oder shrimps': pizzaScampiNew,
  'pizza::quattro formaggi': pizzaQuattroFormaggiNew,
  'pizza::frutti di mare': pizzaFruttiDiMareNew,
  'pizza::diavolo': pizzaDiavolo,
  'pizza::hawaii': pizzaHawaii,
  'pizza::hollandaise': pizzaHollandaise,
  'pizza::vegetarisch': pizzaVegetarisch,
  'pizza::parma': pizzaParma,
  'pizza::sucuk': pizzaSucuk,
  'pizza::pizza überraschung': pizzaUeberraschung,
  'burger::beef burger': itemBurgerBeef,
  'burger::chicken burger': itemBurgerChicken,
  'pasta::spaghetti bolognese': itemSpaghettiBolognese,
  'pasta::penne vegetarisch': itemPenneVegetarischNew,
  'pasta::spaghetti mit meeresfrüchten': itemPastaSeafood,
  'schnitzel::wiener schnitzel': itemWienerSchnitzel,
  'schnitzel::jägerschnitzel': itemJagerschnitzel,
  'salate::gemischter salat': itemSalad,
  'salate::hähnchen salat': itemHaehnchenSalat,
  'salate::shrimps salat': itemShrimpsSalat,
  'kaltgetränke::coca-cola': itemColaNew,
  'heißgetränke::eiskaffee': itemIcedCoffee,
  'cocktails & milkshakes::sunrise orange': itemSunriseOrange,
  'cocktails & milkshakes::strawberry dream': itemStrawberryDream,
  'cocktails & milkshakes::mango paradise': itemMangoParadise,
  'pizza::napoletana': pizzaNapoletana,
  'heißgetränke::kaffee crema': itemKaffeeCrema,
  'heißgetränke::cappuccino': itemCappuccino,
  'heißgetränke::latte macchiato': itemLatteMacchiato,
  'heißgetränke::americano': itemAmericano,
  'pasta::spaghetti aglio e olio': itemAglioEOlio,
  'pasta::penne arrabiata': itemArrabiata,
  'pasta::penne alfredo': itemPenneAlfredoNew,
  'schnitzel::cordon bleu': itemCordonBleuNew,
  'tacos::chicken tacos': itemChickenTacosNew,
  'tacos::beef tacos': itemBeefTacos,
  'tacos::mix tacos': itemMixTacos,
  'tacos::steak tacos': itemSteakTacos,
  'burger::cheeseburger': itemCheeseburger,
  'burger::fischburger': itemFischburger,
  'burger::veggie burger': itemVeggieBurger,
  'burger::spezial burger': itemSpezialBurger,
  'burger::doppel burger': itemDoppelBurger,
  'shawarma rolle::shawarma hähnchen': itemShawarmaHaehnchenNew,
  'shawarma rolle::shawarma lamm': itemShawarmaLamm,
  'gegrilltes hähnchen::ganzes gegrilltes hähnchen mit reis oder pommes': itemGrilledChicken,
  'gegrilltes hähnchen::halbes gegrilltes hähnchen mit reis oder pommes': itemHalbesHaehnchen,
  'gefüllte pizzabrötchen::käse': brotchenKase,
  'gefüllte pizzabrötchen::schinken': brotchenSchinken,
  'gefüllte pizzabrötchen::salami': brotchenSalami,
  'gefüllte pizzabrötchen::thunfisch': brotchenThunfisch,
  'gefüllte pizzabrötchen::hähnchen & sauce hollandaise': brotchenHaehnchen,
  'kaltgetränke::fanta': itemFantaNew,
  'kaltgetränke::sprite': itemSpriteNew,
  'kaltgetränke::red bull': itemRedBullNew,
  'kaltgetränke::mineralwasser 0,5l': itemMineralwasser05l,
  'heißgetränke::espresso': itemEspresso,
  'cocktails & milkshakes::kiwi fresh': itemKiwiFresh,
  'cocktails & milkshakes::tropical pineapple': itemTropicalPineapple,
  'cocktails & milkshakes::fresh lemon mint': itemFreshLemonMint,
  'cocktails & milkshakes::banana milkshake': itemBananaMilkshake,
}

/**
 * Attribution for the drink photos above, sourced from Wikimedia Commons
 * (free-licensed real photography, not AI-generated). CC BY / CC BY-SA
 * require on-site credit to stay compliant if this goes live publicly —
 * these are not yet credited anywhere in the UI.
 *
 * - espresso.jpg: "A cup of espresso.jpg" by Vee Satayamas, CC BY-SA 4.0
 *
 * All originals: https://commons.wikimedia.org/wiki/File:<name above>
 */

/** Keyword fallback for when neither an item nor category match is found. */
const KEYWORD_RULES: { pattern: RegExp; photo: string }[] = [
  { pattern: /milkshake|shake/i, photo: MENU_PHOTOS.milkshakes },
  { pattern: /cocktail|dream|paradise|sunrise/i, photo: MENU_PHOTOS.cocktails },
  { pattern: /kaffee|espresso|americano|eiskaffee|tee/i, photo: MENU_PHOTOS.heissgetraenke },
  { pattern: /mint|lemon/i, photo: MENU_PHOTOS.getraenke },
  { pattern: /cola|fanta|sprite|limo|wasser/i, photo: MENU_PHOTOS.getraenke },
  { pattern: /shawarma|döner/i, photo: MENU_PHOTOS.shawarma },
  { pattern: /hähnchen|chicken|gegrillt/i, photo: MENU_PHOTOS.haehnchen },
  { pattern: /burger/i, photo: MENU_PHOTOS.burger },
  { pattern: /taco/i, photo: MENU_PHOTOS.tacos },
  { pattern: /schnitzel|jäger/i, photo: MENU_PHOTOS.schnitzel },
  { pattern: /salat|salad/i, photo: MENU_PHOTOS.salate },
  { pattern: /pasta|spaghetti|penne|nudel/i, photo: MENU_PHOTOS.pasta },
  { pattern: /pizza|calzone|formaggi|margherita|salami|funghi/i, photo: MENU_PHOTOS.pizza },
  { pattern: /brötchen|brötch|käse|schinken/i, photo: MENU_PHOTOS.pizzabroetchen },
]

function normalize(value: string): string {
  return value.trim().toLowerCase()
}

export function resolveMenuItemImage(
  itemName: string,
  categoryName?: string | null,
  imageUrl?: string | null,
): string {
  if (imageUrl?.trim()) return imageUrl.trim()

  const name = normalize(itemName)
  const category = categoryName ? normalize(categoryName) : null

  if (category) {
    const itemPhoto = ITEM_PHOTOS[`${category}::${name}`]
    if (itemPhoto) return itemPhoto
  }

  if (category === MIXED_DRINKS_CATEGORY) {
    return /milkshake|shake/i.test(name) ? MENU_PHOTOS.milkshakes : MENU_PHOTOS.cocktails
  }

  if (category) {
    const categoryPhoto = CATEGORY_PHOTOS[category]
    if (categoryPhoto) return categoryPhoto
  }

  for (const rule of KEYWORD_RULES) {
    if (rule.pattern.test(name)) return rule.photo
  }

  return MENU_PHOTOS.pizza
}

export type IconTileTint = 'pizza' | 'burger' | 'drink' | 'salad'

/**
 * Category icon fallback (Design.md): only the four tints defined there
 * exist, so every category is mapped onto the closest one rather than
 * inventing new colors. Only reached when an <img> actually fails to load —
 * resolveMenuItemImage() above already has a real-photo fallback for every
 * known category, so in practice this is a last-resort case.
 */
const CATEGORY_ICON_TILES: Record<string, { tint: IconTileTint; icon: LucideIcon }> = {
  pizza: { tint: 'pizza', icon: Pizza },
  'gefüllte pizzabrötchen': { tint: 'pizza', icon: Pizza },
  pasta: { tint: 'pizza', icon: UtensilsCrossed },
  schnitzel: { tint: 'burger', icon: Beef },
  burger: { tint: 'burger', icon: Beef },
  tacos: { tint: 'burger', icon: Beef },
  'shawarma rolle': { tint: 'burger', icon: Beef },
  'gegrilltes hähnchen': { tint: 'burger', icon: Drumstick },
  salate: { tint: 'salad', icon: Salad },
  milkshakes: { tint: 'drink', icon: CupSoda },
  getränke: { tint: 'drink', icon: CupSoda },
  kaltgetränke: { tint: 'drink', icon: CupSoda },
  heißgetränke: { tint: 'drink', icon: CupSoda },
  cocktails: { tint: 'drink', icon: CupSoda },
  'cocktails & milkshakes': { tint: 'drink', icon: CupSoda },
}

export function resolveCategoryIconTile(categoryName?: string | null): { tint: IconTileTint; icon: LucideIcon } {
  const category = categoryName ? normalize(categoryName) : null
  return (category && CATEGORY_ICON_TILES[category]) || { tint: 'pizza', icon: UtensilsCrossed }
}
