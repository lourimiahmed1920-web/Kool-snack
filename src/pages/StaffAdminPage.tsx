import { useState } from 'react'
import {
  LayoutDashboard,
  ClipboardList,
  Package,
  CalendarCheck,
  Clock,
  Users,
  ChefHat,
  QrCode,
  Timer,
  UtensilsCrossed,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { StaffLayout, type StaffNavItem } from '../components/StaffLayout'
import { OverviewSection } from '../components/OverviewSection'
import { OrdersSection } from '../components/OrdersSection'
import { MenuSection } from '../components/MenuSection'
import { StockSection } from '../components/StockSection'
import { TeamTimeSection } from '../components/TeamTimeSection'
import { ReservationsSection } from '../components/ReservationsSection'

type Tab = 'overview' | 'orders' | 'menu' | 'stock' | 'reservations' | 'time'

const TAB_TITLES: Record<Tab, string> = {
  overview: 'Übersicht',
  orders: 'Bestellungen',
  menu: 'Speisekarte',
  stock: 'Lager',
  reservations: 'Reservierungen',
  time: 'Zeiterfassung',
}

export function StaffAdminPage() {
  const { profile } = useAuth()
  const [tab, setTab] = useState<Tab>('overview')

  const nav: StaffNavItem[] = [
    { key: 'overview', label: 'Übersicht', icon: LayoutDashboard, onClick: () => setTab('overview'), active: tab === 'overview' },
    { key: 'orders', label: 'Bestellungen', icon: ClipboardList, onClick: () => setTab('orders'), active: tab === 'orders' },
    { key: 'menu', label: 'Speisekarte', icon: UtensilsCrossed, onClick: () => setTab('menu'), active: tab === 'menu' },
    { key: 'stock', label: 'Lager', icon: Package, onClick: () => setTab('stock'), active: tab === 'stock' },
    {
      key: 'reservations',
      label: 'Reservierungen',
      icon: CalendarCheck,
      onClick: () => setTab('reservations'),
      active: tab === 'reservations',
    },
    { key: 'time', label: 'Zeiterfassung', icon: Clock, onClick: () => setTab('time'), active: tab === 'time' },
    { key: 'team', label: 'Team', icon: Users, to: '/staff/team' },
    { key: 'kueche', label: 'Küchenansicht', icon: ChefHat, to: '/kueche' },
    { key: 'display', label: 'Anzeige Eingang', icon: QrCode, to: '/staff/pointage-display' },
    { key: 'pointage', label: 'Meine Zeiterfassung', icon: Timer, to: '/staff/pointage' },
  ]

  return (
    <StaffLayout pageTitle={TAB_TITLES[tab]} nav={nav}>
      {tab === 'overview' && <OverviewSection restaurantId={profile?.restaurant_id} />}
      {tab === 'orders' && <OrdersSection restaurantId={profile?.restaurant_id} />}
      {tab === 'menu' && <MenuSection restaurantId={profile?.restaurant_id} />}
      {tab === 'stock' && <StockSection />}
      {tab === 'reservations' && <ReservationsSection restaurantId={profile?.restaurant_id} />}
      {tab === 'time' && <TeamTimeSection restaurantId={profile?.restaurant_id} />}
    </StaffLayout>
  )
}
