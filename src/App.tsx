import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import MenuCategories from './pages/MenuCategories'
import MenuItems from './pages/MenuItems'
import Orders from './pages/Orders'
import OrderDetail from './pages/OrderDetail'
import DeliveryZones from './pages/DeliveryZones'
import Discounts from './pages/Discounts'
import Reservations from './pages/Reservations'
import ReservationDetail from './pages/ReservationDetail'
import SimpleReservations from './pages/SimpleReservations'
import SimpleReservationDetail from './pages/SimpleReservationDetail'
import Floors from './pages/Floors'
import Rows from './pages/Rows'
import Tables from './pages/Tables'
import ReservationSettings from './pages/ReservationSettings'
import Gallery from './pages/Gallery'
import CateringPacks from './pages/CateringPacks'
import Offers from './pages/Offers'
import Layout from './components/Layout'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  return <>{children}</>
}

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="orders" element={<Orders />} />
            <Route path="orders/:id" element={<OrderDetail />} />
            <Route path="simple-reservations" element={<SimpleReservations />} />
            <Route path="simple-reservations/:id" element={<SimpleReservationDetail />} />
            <Route path="reservations" element={<Reservations />} />
            <Route path="reservations/:id" element={<ReservationDetail />} />
            <Route path="floors" element={<Floors />} />
            <Route path="rows" element={<Rows />} />
            <Route path="tables" element={<Tables />} />
            <Route path="reservation-settings" element={<ReservationSettings />} />
            <Route path="delivery-zones" element={<DeliveryZones />} />
            <Route path="discounts" element={<Discounts />} />
            <Route path="menu-categories" element={<MenuCategories />} />
            <Route path="menu-items" element={<MenuItems />} />
            <Route path="gallery" element={<Gallery />} />
            <Route path="catering-packs" element={<CateringPacks />} />
            <Route path="offers" element={<Offers />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
