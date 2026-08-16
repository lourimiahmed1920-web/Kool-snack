import { ClipboardList, CalendarClock, Euro, CalendarCheck, Users2, UserCheck, Timer, PackageX, PackageSearch, Boxes } from 'lucide-react'
import { useDashboardSummary } from '../hooks/useDashboardSummary'

const currency = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' })

interface OverviewSectionProps {
  restaurantId: string | null | undefined
}

interface StatCardProps {
  icon: typeof ClipboardList
  label: string
  value: string | number
  sub: string
  warn?: boolean
}

function StatCard({ icon: Icon, label, value, sub, warn = false }: StatCardProps) {
  return (
    <div className={`stat-card${warn ? ' stat-card--warn' : ''}`}>
      <div className="stat-card__icon">
        <Icon />
      </div>
      <div className="stat-card__label">{label}</div>
      <div className="stat-card__value">{value}</div>
      <div className="stat-card__sub">{sub}</div>
    </div>
  )
}

/**
 * Three KPI groups, one summary view each — the views own these numbers, the browser
 * only renders them. Nothing here is recomputed from raw rows.
 */
export function OverviewSection({ restaurantId }: OverviewSectionProps) {
  const { operations, attendance, stock, loading } = useDashboardSummary(restaurantId)

  if (loading) return <p className="menu-state">Lädt…</p>

  return (
    <div className="overview">
      <section className="overview__group">
        <h3 className="overview__title">Betrieb heute</h3>
        <div className="stat-grid">
          <StatCard
            icon={ClipboardList}
            label="Bestellungen heute"
            value={operations.orders_today}
            sub="seit Mitternacht"
          />
          <StatCard
            icon={Euro}
            label="Umsatz heute"
            value={currency.format(operations.revenue_today)}
            sub="alle Bestellungen"
          />
          <StatCard
            icon={CalendarClock}
            label="Offene Bestellungen"
            value={operations.active_orders}
            sub="in Bearbeitung"
            warn={operations.active_orders > 0}
          />
          <StatCard
            icon={CalendarCheck}
            label="Reservierungen heute"
            value={operations.reservations_today}
            sub="erwartete Gäste"
          />
        </div>
      </section>

      <section className="overview__group">
        <h3 className="overview__title">Anwesenheit</h3>
        <div className="stat-grid">
          <StatCard
            icon={Users2}
            label="Heute anwesend"
            value={attendance.employees_present_today}
            sub="Mitarbeiter"
          />
          <StatCard
            icon={UserCheck}
            label="Gerade im Dienst"
            value={attendance.currently_working}
            sub="eingestempelt"
          />
          <StatCard
            icon={Timer}
            label="Arbeitsstunden heute"
            value={`${Number(attendance.hours_worked_today ?? 0).toFixed(1)} h`}
            sub="gesamtes Team"
          />
        </div>
      </section>

      <section className="overview__group">
        <h3 className="overview__title">Lager</h3>
        <div className="stat-grid">
          <StatCard
            icon={PackageSearch}
            label="Niedriger Bestand"
            value={stock.low_stock_count}
            sub="nachbestellen"
            warn={stock.low_stock_count > 0}
          />
          <StatCard
            icon={PackageX}
            label="Nicht vorrätig"
            value={stock.out_of_stock_count}
            sub="aufgebraucht"
            warn={stock.out_of_stock_count > 0}
          />
          <StatCard
            icon={Boxes}
            label="Lagerwert"
            value={currency.format(stock.total_stock_value ?? 0)}
            sub={`${stock.total_active_items} aktive Artikel`}
          />
        </div>
      </section>
    </div>
  )
}
