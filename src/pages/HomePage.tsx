import { Link } from 'react-router-dom'
import { Phone, ChevronRight, ShieldCheck, ChefHat, Bike, Clock, MapPin } from 'lucide-react'
import { HomeHero } from '../components/HomeHero'
import { CategoryRail } from '../components/CategoryRail'
import { ActiveOrderCard } from '../components/ActiveOrderCard'
import { browsableCategories } from '../lib/menuTree'
import type { MenuCategory } from '../types/menu'

interface HomePageProps {
  categories: MenuCategory[]
  loading: boolean
  restaurantName?: string
  phone?: string | null
  address?: string | null
}

const HIGHLIGHTS = [
  { Icon: ShieldCheck, title: '100% Halal', text: 'Ausschließlich halal-zertifizierte Zutaten.' },
  { Icon: ChefHat, title: 'Frisch zubereitet', text: 'Pizza aus dem Steinofen, alles frisch gemacht.' },
  { Icon: Bike, title: 'Schnelle Lieferung', text: 'In Neuss & Umgebung, meist in 15–25 Minuten.' },
  { Icon: Clock, title: 'Täglich geöffnet', text: '12:00 bis 22:00 Uhr, auch an Feiertagen.' },
]

export function HomePage({ categories, loading, restaurantName, phone, address }: HomePageProps) {
  const cards = browsableCategories(categories)

  return (
    <div className="screen screen--home">
      <HomeHero restaurantName={restaurantName} phone={phone} />

      {/* Only renders when this device has a recent order — for a guest with no
          account, this card is the only way back to a live order after leaving. */}
      <ActiveOrderCard />

      <section className="home-section">
        <div className="home-section__head">
          <h2 className="home-section__title">Beliebte Kategorien</h2>
          <Link to="/menu" className="home-section__more">
            Alle <ChevronRight size={16} />
          </Link>
        </div>
        <CategoryRail cards={cards} loading={loading} />
      </section>

      <section className="home-section">
        <h2 className="home-section__title">Warum Kool Snack</h2>
        <div className="highlight-grid">
          {HIGHLIGHTS.map(({ Icon, title, text }, index) => (
            <div key={title} className="highlight-card fade-in-up" style={{ animationDelay: `${index * 40}ms` }}>
              <span className="highlight-card__icon">
                <Icon size={18} />
              </span>
              <strong className="highlight-card__title">{title}</strong>
              <span className="highlight-card__text">{text}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="home-section">
        <h2 className="home-section__title">Besuch uns</h2>
        <div className="info-list">
          {address && (
            <div className="info-row">
              <span className="info-row__icon">
                <MapPin size={18} />
              </span>
              <span className="info-row__body">
                <span className="info-row__label">Adresse</span>
                <span className="info-row__value">{address}</span>
              </span>
            </div>
          )}
          {phone && (
            <a className="info-row" href={`tel:${phone.replace(/\s+/g, '')}`}>
              <span className="info-row__icon">
                <Phone size={18} />
              </span>
              <span className="info-row__body">
                <span className="info-row__label">Telefon</span>
                <span className="info-row__value">{phone}</span>
              </span>
              <ChevronRight size={18} className="info-row__chevron" />
            </a>
          )}
          <div className="info-row">
            <span className="info-row__icon">
              <Clock size={18} />
            </span>
            <span className="info-row__body">
              <span className="info-row__label">Öffnungszeiten</span>
              <span className="info-row__value">Täglich 12:00 – 22:00 Uhr</span>
            </span>
          </div>
        </div>
      </section>
    </div>
  )
}
