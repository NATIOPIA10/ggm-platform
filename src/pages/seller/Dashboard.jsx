import React from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Spinner } from '../../components/shared'
import MobileTabs from '../../components/layout/MobileTabs'
import { IconChart, IconTag, IconPackage, IconMessage, IconStar, IconShield, IconUser, IconFilter } from '../../components/shared/Icons'
import SellerOverview  from './Overview'
import ProfilePage     from '../shared/ProfilePage'
import SellerProducts  from './Products'
import SellerOrders    from './Orders'
import SellerMessages  from './Messages'
import SellerReviews   from './Reviews'
import FeedbackHistory from '../shared/FeedbackHistory'

const NAV = [
  { path: '',          label: 'Overview',  Icon: IconChart   },
  { path: 'profile',   label: 'Profile',   Icon: IconUser    },
  { path: 'products',  label: 'Products',  Icon: IconTag     },
  { path: 'orders',    label: 'Orders',    Icon: IconPackage },
  { path: 'messages',  label: 'Messages',  Icon: IconMessage },
  { path: 'reviews',   label: 'Reviews',   Icon: IconStar    },
  { path: 'feedback',  label: 'My Feedback',Icon: IconFilter  },
]

export default function SellerDashboard() {
  const { profile } = useAuth()
  const navigate    = useNavigate()
  const location    = useLocation()

  if (!profile) return <Spinner />

  const org        = profile.organizations
  const isPending  = org?.status === 'pending'
  const isRejected = org?.status === 'rejected'

  const active = (path) => {
    if (path === '') return location.pathname === '/seller' || location.pathname === '/seller/'
    return location.pathname.startsWith(`/seller/${path}`)
  }

  if (isPending) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - var(--nav-h))', flexDirection: 'column', gap: 16, padding: 24, textAlign: 'center' }}>
      <h2 style={{ fontSize: 22, fontWeight: 700 }}>Pending Approval</h2>
      <p style={{ color: 'var(--gray-600)', maxWidth: 360 }}>
        Your seller account <strong>{org?.name}</strong> is under review. An admin will approve it shortly.
      </p>
      <span className="badge badge-amber" style={{ fontSize: 14, padding: '6px 16px' }}>Status: Pending</span>
      <button className="btn btn-outline" onClick={() => window.location.reload()}>Check Status</button>
    </div>
  )

  if (isRejected) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - var(--nav-h))', flexDirection: 'column', gap: 16, padding: 24, textAlign: 'center' }}>
      <h2 style={{ fontSize: 22, fontWeight: 700 }}>Account Rejected</h2>
      <p style={{ color: 'var(--gray-600)', maxWidth: 360 }}>Your seller application was not approved. Please contact support.</p>
      <span className="badge badge-red" style={{ fontSize: 14, padding: '6px 16px' }}>Status: Rejected</span>
    </div>
  )

  return (
    <div className="dashboard-wrap">
      <aside className="sidebar">
        {org && (
          <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid var(--gray-100)', marginBottom: 8 }}>
            <div style={{ fontWeight: 700, fontSize: 13 }}>{org.name}</div>
            {org.verified && (
              <div style={{ fontSize: 12, color: 'var(--brand)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                <IconShield width={12} height={12} /> Verified Seller
              </div>
            )}
          </div>
        )}
        <div className="sidebar-section">Seller</div>
        {NAV.map(item => (
          <button
            key={item.label}
            className={`sidebar-item ${active(item.path) ? 'active' : ''}`}
            onClick={() => navigate(`/seller/${item.path}`)}
          >
            <span className="s-icon"><item.Icon width={16} height={16} /></span>
            {item.label}
          </button>
        ))}
      </aside>

      <div>
        <MobileTabs basePath="/seller" items={NAV} />
        <div className="dashboard-content">
          <Routes>
            <Route index           element={<SellerOverview />} />
          <Route path="profile"  element={<ProfilePage />} />
            <Route path="products" element={<SellerProducts />} />
            <Route path="orders"   element={<SellerOrders />} />
            <Route path="messages" element={<SellerMessages />} />
            <Route path="messages/:threadId" element={<SellerMessages />} />
            <Route path="reviews"  element={<SellerReviews />} />
          <Route path="feedback" element={<FeedbackHistory />} />
          </Routes>
        </div>
      </div>
    </div>
  )
}
