import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AppBar } from './components/AppBar'
import { TabBar } from './components/TabBar'
import { CartBar } from './components/CartBar'
import { HomePage } from './pages/HomePage'
import { MenuPage } from './pages/MenuPage'
import { CategoryPage } from './pages/CategoryPage'
import { CartPage } from './pages/CartPage'
import { CheckoutPage } from './pages/CheckoutPage'
import { OrderConfirmedPage } from './pages/OrderConfirmedPage'
import { ReservationPage } from './pages/ReservationPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { StaffLoginPage } from './pages/StaffLoginPage'
import { PointagePage } from './pages/PointagePage'
import { PointageDisplayPage } from './pages/PointageDisplayPage'
import { StaffAdminPage } from './pages/StaffAdminPage'
import { StaffDashboardPage } from './pages/StaffDashboardPage'
import { StaffTeamPage } from './pages/StaffTeamPage'
import { KitchenPage } from './pages/KitchenPage'
import { ProtectedRoute } from './components/ProtectedRoute'
import { useMenu } from './hooks/useMenu'
import { useRestaurant } from './hooks/useRestaurant'
import { useHardwareBack, useKeyboardClass, useScrollToTopOnNavigate } from './hooks/useAppNavigation'
import { CartProvider } from './contexts/CartContext'
import { AuthProvider } from './contexts/AuthContext'
import { browsableCategories } from './lib/menuTree'
import { parseHours } from './lib/openingHours'
import { slugify } from './lib/slug'
import type { MenuCategory } from './types/menu'
import type { Restaurant } from './hooks/useRestaurant'
import './App.css'

interface AppShellProps {
  categories: MenuCategory[]
  loading: boolean
  error: string | null
  restaurant: Restaurant | null
}

interface Chrome {
  appBar: { title: string; back?: string } | null
  cartBar: boolean
}

/**
 * Which app-level chrome each customer screen gets. Keeping this in one table —
 * rather than letting every page render its own header — is what makes the top
 * and bottom bars behave identically on every screen, which is most of what
 * separates an app from a set of web pages.
 *
 * Returns `null` for staff routes and the kitchen display: those render their
 * own full-screen shells and must never show the customer tab bar.
 */
function resolveChrome(pathname: string, categories: MenuCategory[]): Chrome | null {
  if (pathname.startsWith('/staff') || pathname === '/kueche') return null

  // The home screen's hero doubles as its header, so it gets no app bar.
  if (pathname === '/') return { appBar: null, cartBar: true }

  if (pathname === '/menu') return { appBar: { title: 'Speisekarte' }, cartBar: true }

  if (pathname.startsWith('/menu/')) {
    const slug = pathname.slice('/menu/'.length)
    const match = browsableCategories(categories).find((card) => slugify(card.name) === slug)
    return { appBar: { title: match?.name ?? 'Speisekarte', back: '/menu' }, cartBar: true }
  }

  if (pathname === '/cart') return { appBar: { title: 'Warenkorb', back: '/menu' }, cartBar: false }
  if (pathname === '/checkout') return { appBar: { title: 'Bestellung abschließen', back: '/cart' }, cartBar: false }
  if (pathname === '/reservierung') return { appBar: { title: 'Tisch reservieren' }, cartBar: false }
  if (pathname.startsWith('/order-confirmed'))
    return { appBar: { title: 'Deine Bestellung', back: '/' }, cartBar: false }

  return { appBar: { title: 'Nicht gefunden', back: '/' }, cartBar: false }
}

function AppShell({ categories, loading, error, restaurant }: AppShellProps) {
  const location = useLocation()
  // Parsed once here so the displayed hours and the checkout gate read the same row.
  const hours = parseHours(restaurant?.opening_time, restaurant?.closing_time)
  const chrome = resolveChrome(location.pathname, categories)

  useScrollToTopOnNavigate()
  useHardwareBack()
  useKeyboardClass()

  return (
    <div className={`app${chrome ? ' app--tabbed' : ''}`}>
      {/*
        First in the DOM even though it renders at the *bottom* on phones: there
        it is `position: fixed`, so it is out of flow and document order doesn't
        affect where it lands. On desktop it becomes a `position: sticky` top
        nav, and sticky cannot lift an element above its preceding siblings — as
        the last child it simply sat below the page content. Nav-first is also
        the correct reading and tab order.
      */}
      {chrome && <TabBar />}

      {chrome?.appBar && <AppBar title={chrome.appBar.title} back={chrome.appBar.back} />}

      <main className="app-content">
        {error ? (
          <p className="screen-state screen-state--error">Fehler beim Laden des Menüs: {error}</p>
        ) : (
          <Routes>
            {/* Public — no login anywhere in this flow, guests order/reserve with customer_id = null */}
            <Route
              path="/"
              element={
                <HomePage
                  categories={categories}
                  loading={loading}
                  restaurantName={restaurant?.name}
                  phone={restaurant?.phone}
                  address={restaurant?.address}
                  hours={hours}
                />
              }
            />
            <Route path="/menu" element={<MenuPage categories={categories} loading={loading} />} />
            <Route path="/menu/:slug" element={<CategoryPage categories={categories} loading={loading} />} />
            <Route path="/cart" element={<CartPage hours={hours} timeZone={restaurant?.timezone} />} />
            <Route
              path="/checkout"
              element={
                <CheckoutPage restaurantId={restaurant?.id} hours={hours} timeZone={restaurant?.timezone} />
              }
            />
            <Route path="/order-confirmed/:orderId" element={<OrderConfirmedPage />} />
            <Route path="/reservierung" element={<ReservationPage restaurantId={restaurant?.id} />} />

            {/* Staff — everything below requires /staff/login, except the entrance display kiosk */}
            <Route path="/staff/login" element={<StaffLoginPage />} />
            <Route path="/staff/pointage-display" element={<PointageDisplayPage restaurantId={restaurant?.id} />} />
            <Route
              path="/staff/pointage"
              element={
                <ProtectedRoute>
                  <PointagePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff/admin"
              element={
                <ProtectedRoute allowedRoles={['inhaber', 'manager']}>
                  <StaffAdminPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff/dashboard"
              element={
                <ProtectedRoute allowedRoles={['mitarbeiter', 'kueche']}>
                  <StaffDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff/team"
              element={
                <ProtectedRoute allowedRoles={['inhaber', 'manager']}>
                  <StaffTeamPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/kueche"
              element={
                <ProtectedRoute allowedRoles={['inhaber', 'manager', 'kueche']}>
                  <KitchenPage />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        )}
      </main>

      {chrome?.cartBar && <CartBar />}
    </div>
  )
}

function App() {
  const { categories, loading, error } = useMenu()
  const restaurant = useRestaurant()

  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <AppShell categories={categories} loading={loading} error={error} restaurant={restaurant} />
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  )
}

export default App
