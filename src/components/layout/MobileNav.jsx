import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  IconHome, IconSearch, IconUser, IconPackage,
  IconChart, IconDashboard, IconMessage, IconHeart
} from '../shared/Icons'

export default function MobileNav() {
  const { profile } = useAuth()
  const navigate    = useNavigate()
  const location    = useLocation()

  const is = (path) => location.pathname === path || location.pathname.startsWith(path + '/')

  // Different nav items based on role
  const getNavItems = () => {
    if (!profile) return [
      { label: 'Home',    icon: IconHome,   path: '/' },
      { label: 'Search',  icon: IconSearch, path: '/search' },
      { label: 'Sign In', icon: IconUser,   path: '/auth' },
    ]

    if (profile.role === 'admin') return [
      { label: 'Overview',  icon: IconDashboard, path: '/admin' },
      { label: 'Products',  icon: IconPackage,   path: '/admin/products' },
      { label: 'Sellers',   icon: IconUser,      path: '/admin/sellers' },
      { label: 'Orders',    icon: IconChart,     path: '/admin/orders' },
      { label: 'Profile',   icon: IconUser,      path: '/admin/profile' },
    ]

    if (profile.role === 'seller') return [
      { label: 'Overview',  icon: IconChart,     path: '/seller' },
      { label: 'Products',  icon: IconPackage,   path: '/seller/products' },
      { label: 'Orders',    icon: IconPackage,   path: '/seller/orders' },
      { label: 'Messages',  icon: IconMessage,   path: '/seller/messages' },
      { label: 'Profile',   icon: IconUser,      path: '/seller/profile' },
    ]

    // Customer
    return [
      { label: 'Home',      icon: IconHome,    path: '/customer' },
      { label: 'Search',    icon: IconSearch,  path: '/search' },
      { label: 'Favorites', icon: IconHeart,   path: '/customer/favorites' },
      { label: 'Orders',    icon: IconPackage, path: '/customer/orders' },
      { label: 'Messages',  icon: IconMessage, path: '/customer/messages' },
    ]
  }

  const items = getNavItems()

  return (
    <nav className="mobile-nav">
      <div className="mobile-nav-inner">
        {items.map(item => {
          const active = is(item.path)
          return (
            <button
              key={item.label}
              className={`mobile-nav-item ${active ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <item.icon width={22} height={22} strokeWidth={active ? 2.5 : 1.8} />
              <span>{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
