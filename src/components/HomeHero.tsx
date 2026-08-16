import { Link } from 'react-router-dom'
import { Phone, Search } from 'lucide-react'
import heroImage from '../assets/menu/hero-food.jpg'
import logo from '../assets/kool-snack-logo.webp'

interface HomeHeroProps {
  restaurantName?: string
  phone?: string | null
}

/**
 * The home screen's header. It replaces the app bar on `/` (see `resolveChrome`
 * in App.tsx) and therefore owns the top safe-area inset itself — under
 * Capacitor's edge-to-edge WebView the brand row would otherwise sit under the
 * status bar.
 */
export function HomeHero({ restaurantName, phone }: HomeHeroProps) {
  return (
    <section className="home-hero" style={{ backgroundImage: `url(${heroImage})` }}>
      <div className="home-hero__scrim" />

      <div className="home-hero__bar">
        <span className="home-hero__brand">
          <img src={logo} alt="" className="home-hero__logo" />
          <span className="home-hero__brand-name">{restaurantName ?? 'Kool Snack'}</span>
        </span>
        {phone && (
          <a
            href={`tel:${phone.replace(/\s+/g, '')}`}
            className="home-hero__call"
            aria-label={`Anrufen: ${phone}`}
          >
            <Phone size={18} />
          </a>
        )}
      </div>

      <div className="home-hero__content">
        <span className="home-hero__badge">100% Halal</span>
        <h1 className="home-hero__title">Hunger? Wir liefern.</h1>
        <p className="home-hero__tagline">
          Pizza aus dem Steinofen, saftige Burger, French Tacos und Shawarma — frisch aus der Hafenstraße.
        </p>
      </div>

      {/* A real link, not an input: tapping it opens the menu screen where the
          search field lives, so the keyboard only appears where results can show. */}
      <Link to="/menu" className="home-hero__search">
        <Search size={18} />
        <span>Gerichte durchsuchen</span>
      </Link>
    </section>
  )
}
