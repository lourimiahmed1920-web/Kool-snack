import { useState } from 'react'
import { ClipboardList, Package, CalendarCheck, ChefHat, Timer } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { StaffLayout, type StaffNavItem } from '../components/StaffLayout'
import { OrdersSection } from '../components/OrdersSection'
import { StockSection } from '../components/StockSection'
import { ReservationsSection } from '../components/ReservationsSection'

type Tab = 'orders' | 'stock' | 'reservations'

const TAB_TITLES: Record<Tab, string> = {
  orders: 'Bestellungen',
  stock: 'Lager',
  reservations: 'Reservierungen',
}

export function StaffDashboardPage() {
  const { profile } = useAuth()
  const [tab, setTab] = useState<Tab>('orders')

  const nav: StaffNavItem[] = [
    { key: 'orders', label: 'Bestellungen', icon: ClipboardList, onClick: () => setTab('orders'), active: tab === 'orders' },
    { key: 'stock', label: 'Lager', icon: Package, onClick: () => setTab('stock'), active: tab === 'stock' },
    {
      key: 'reservations',
      label: 'Reservierungen',
      icon: CalendarCheck,
      onClick: () => setTab('reservations'),
      active: tab === 'reservations',
    },
    ...(profile?.role === 'kueche'
      ? [{ key: 'kueche', label: 'Küchenansicht', icon: ChefHat, to: '/kueche' } satisfies StaffNavItem]
      : []),
    { key: 'pointage', label: 'Meine Zeiterfassung', icon: Timer, to: '/staff/pointage' },
  ]

  return (
    <StaffLayout pageTitle={TAB_TITLES[tab]} nav={nav}>
      {tab === 'orders' && <OrdersSection restaurantId={profile?.restaurant_id} />}
      {tab === 'stock' && <StockSection />}
      {tab === 'reservations' && <ReservationsSection restaurantId={profile?.restaurant_id} />}
    </StaffLayout>
  )
}
