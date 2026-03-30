import React from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { IconDashboard, IconUsers, IconStore, IconTag, IconFolder, IconPackage, IconUser, IconMessage } from '../../components/shared/Icons'
import MobileTabs from '../../components/layout/MobileTabs'
import AdminOverview   from './Overview'
import ProfilePage     from '../shared/ProfilePage'
import AdminUsers      from './Users'
import AdminSellers    from './Sellers'
import AdminProducts   from './Products'
import AdminCategories from './Categories'
import AdminOrders     from './Orders'
import AdminFeedback   from './Feedback'

const NAV = [
  { path: '',           label: 'Overview',   Icon: IconDashboard },
  { path: 'profile',    label: 'Profile',    Icon: IconUser      },
  { path: 'users',      label: 'Users',      Icon: IconUsers     },
  { path: 'sellers',    label: 'Sellers',    Icon: IconStore     },
  { path: 'products',   label: 'Products',   Icon: IconTag       },
  { path: 'categories', label: 'Categories', Icon: IconFolder    },
  { path: 'orders',     label: 'Orders',     Icon: IconPackage   },
  { path: 'feedback',   label: 'Feedback',   Icon: IconMessage   },
]

export default function AdminDashboard() {
  const navigate = useNavigate()
  const location = useLocation()

  const active = (path) => {
    if (path === '') return location.pathname === '/admin' || location.pathname === '/admin/'
    return location.pathname.startsWith(`/admin/${path}`)
  }

  return (
    <div className="dashboard-wrap">
      <aside className="sidebar">
        <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid var(--gray-100)', marginBottom: 8 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>GGM Admin</div>
          <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 2 }}>Platform Control</div>
        </div>
        <div className="sidebar-section">Management</div>
        {NAV.map(item => (
          <button
            key={item.label}
            className={`sidebar-item ${active(item.path) ? 'active' : ''}`}
            onClick={() => navigate(`/admin/${item.path}`)}
          >
            <span className="s-icon"><item.Icon width={16} height={16} /></span>
            {item.label}
          </button>
        ))}
      </aside>

      <div>
        <MobileTabs basePath="/admin" items={NAV} />
        <div className="dashboard-content">
          <Routes>
            <Route index              element={<AdminOverview />} />
          <Route path="profile"   element={<ProfilePage />} />
            <Route path="users"       element={<AdminUsers />} />
            <Route path="sellers"     element={<AdminSellers />} />
            <Route path="products"    element={<AdminProducts />} />
            <Route path="categories"  element={<AdminCategories />} />
            <Route path="orders"      element={<AdminOrders />} />
          <Route path="feedback"    element={<AdminFeedback />} />
          </Routes>
        </div>
      </div>
    </div>
  )
}
