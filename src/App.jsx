import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import Navbar from './components/layout/Navbar'
import MobileNav from './components/layout/MobileNav'
import FeedbackButton from './components/shared/FeedbackButton'
import Home from './pages/Home'
import Search from './pages/Search'
import ProductDetail from './pages/ProductDetail'
import Auth from './pages/Auth'
import AuthCallback from './pages/AuthCallback'
import RoleSelect  from './pages/RoleSelect'
import CustomerDashboard from './pages/customer/Dashboard'
import SellerDashboard from './pages/seller/Dashboard'
import AdminDashboard from './pages/admin/Dashboard'
import { Spinner } from './components/shared'

function RequireAuth({ children }) {
  const { profile, loading } = useAuth()
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <Spinner />
    </div>
  )
  if (!profile) return <Navigate to="/auth" replace />
  return children
}

function RequireRole({ children, role }) {
  const { profile, loading } = useAuth()
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <Spinner />
    </div>
  )
  if (!profile) return <Navigate to="/auth" replace />
  if (profile.role !== role && profile.role !== 'admin') return <Navigate to="/" replace />
  return children
}

function AppRoutes() {
  return (
    <>
      <Navbar />
      <div className="main-content">
        <Routes>
          <Route path="/"            element={<Home />} />
          <Route path="/search"      element={<Search />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/auth"           element={<Auth />} />
          <Route path="/auth/callback"  element={<AuthCallback />} />
          <Route path="/auth/role"      element={<RoleSelect />} />
          <Route path="/customer/*"  element={<RequireAuth><CustomerDashboard /></RequireAuth>} />
          <Route path="/seller/*"    element={<RequireRole role="seller"><SellerDashboard /></RequireRole>} />
          <Route path="/admin/*"     element={<RequireRole role="admin"><AdminDashboard /></RequireRole>} />
          <Route path="*"            element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <MobileNav />
      <FeedbackButton />
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
