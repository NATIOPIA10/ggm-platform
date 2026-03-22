import React from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import CustomerHome      from './Home'
import CustomerProfile   from './Profile'
import CustomerOrders    from './Orders'
import CustomerFavorites from './Favorites'
import CustomerMessages  from './Messages'
import CustomerReviews   from './Reviews'
import MobileTabs from '../../components/layout/MobileTabs'
import { IconHome, IconUser, IconPackage, IconHeart, IconMessage, IconStar } from '../../components/shared/Icons'

const NAV = [
  { path: '',          label: 'Home',      Icon: IconHome    },
  { path: 'profile',   label: 'Profile',   Icon: IconUser    },
  { path: 'orders',    label: 'Orders',    Icon: IconPackage },
  { path: 'favorites', label: 'Favorites', Icon: IconHeart   },
  { path: 'messages',  label: 'Messages',  Icon: IconMessage },
  { path: 'reviews',   label: 'Reviews',   Icon: IconStar    },
]

export default function CustomerDashboard() {
  const navigate = useNavigate()
  const location = useLocation()

  const active = (path) => {
    if (path === '') return location.pathname === '/customer' || location.pathname === '/customer/'
    return location.pathname.startsWith(`/customer/${path}`)
  }

  return (
    <div className="dashboard-wrap">
      {/* Desktop sidebar */}
      <aside className="sidebar">
        <div className="sidebar-section">My Account</div>
        {NAV.map(item => (
          <button
            key={item.label}
            className={`sidebar-item ${active(item.path) ? 'active' : ''}`}
            onClick={() => navigate(`/customer/${item.path}`)}
          >
            <span className="s-icon"><item.Icon width={16} height={16} /></span>
            {item.label}
          </button>
        ))}
      </aside>

      <div>
        {/* Mobile top tabs */}
        <MobileTabs basePath="/customer" items={NAV} />
        <div className="dashboard-content">
          <Routes>
            <Route index              element={<CustomerHome />} />
            <Route path="profile"     element={<CustomerProfile />} />
            <Route path="orders"      element={<CustomerOrders />} />
            <Route path="favorites"   element={<CustomerFavorites />} />
            <Route path="messages"    element={<CustomerMessages />} />
            <Route path="messages/:threadId" element={<CustomerMessages />} />
            <Route path="reviews"     element={<CustomerReviews />} />
          </Routes>
        </div>
      </div>
    </div>
  )
}
