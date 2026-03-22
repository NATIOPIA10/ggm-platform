import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getSellerProducts, getSellerOrders, getReviewsBySeller, updateOrderStatus } from '../../lib/api'
import { formatPrice, formatDate, orderStatusColor } from '../../lib/utils'
import { Spinner, Avatar } from '../../components/shared'
import { useToast } from '../../context/ToastContext'

export default function SellerOverview() {
  const { profile }  = useAuth()
  const { toast }    = useToast()
  const navigate     = useNavigate()
  const [data, setData]    = useState({ products: [], orders: [], reviews: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile) load()
  }, [profile])

  async function load() {
    try {
      const [products, orders, reviews] = await Promise.all([
        getSellerProducts(profile.id),
        getSellerOrders(profile.id),
        getReviewsBySeller(profile.id),
      ])
      setData({ products, orders, reviews })
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleOrderAction(orderId, status) {
    try {
      await updateOrderStatus(orderId, status)
      toast(`Order ${status}`, 'success')
      load()
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  if (loading) return <Spinner />

  const { products, orders, reviews } = data
  const revenue = orders.filter(o => o.status !== 'rejected').reduce((s, o) => s + Number(o.total_price), 0)
  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null
  const pendingOrders = orders.filter(o => o.status === 'pending')
  const org = profile.organizations

  return (
    <div>
      <div className="page-header">
        <h1>{org?.name || 'Dashboard'}</h1>
        <p>Welcome back, {profile.name}!</p>
      </div>

      {/* Stats */}
      <div className="stats-grid mb-24">
        <div className="stat-card">
          <div className="stat-label">Products</div>
          <div className="stat-value">{products.length}</div>
          <div className="stat-sub">{products.filter(p => p.status === 'approved').length} approved</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Orders</div>
          <div className="stat-value">{orders.length}</div>
          <div className="stat-sub" style={{ color: pendingOrders.length ? 'var(--amber)' : 'var(--green)' }}>
            {pendingOrders.length} pending
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Revenue</div>
          <div className="stat-value" style={{ fontSize: 20 }}>{formatPrice(revenue)}</div>
          <div className="stat-sub">{orders.filter(o => o.status === 'completed').length} completed</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Rating</div>
          <div className="stat-value">{avgRating ? `${avgRating} ★` : '-'}</div>
          <div className="stat-sub">{reviews.length} reviews</div>
        </div>
      </div>

      {/* Pending orders alert */}
      {pendingOrders.length > 0 && (
        <div style={{ background: 'var(--amber-light)', border: '1px solid var(--amber)', borderRadius: 'var(--radius-lg)', padding: '14px 18px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 500, color: '#7d4e00' }}>⚠️ You have {pendingOrders.length} pending order{pendingOrders.length > 1 ? 's' : ''} awaiting your response</span>
          <button className="btn btn-sm" style={{ background: '#7d4e00', color: 'white' }} onClick={() => navigate('/seller/orders')}>View Orders</button>
        </div>
      )}

      {/* Recent orders */}
      <div className="card mb-24">
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontWeight: 700 }}>Recent Orders</h3>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/seller/orders')}>View All</button>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Product</th><th>Customer</th><th>Amount</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 5).map(o => {
                const item = o.order_items?.[0]
                const customer = o.users
                return (
                  <tr key={o.id}>
                    <td style={{ fontWeight: 500 }}>{item?.products?.title || '-'}</td>
                    <td>
                      <div className="flex-align gap-8">
                        <Avatar name={customer?.name} size="sm" src={customer?.avatar_url} />
                        {customer?.name}
                      </div>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--brand)' }}>{formatPrice(o.total_price)}</td>
                    <td><span className={`badge badge-${orderStatusColor(o.status)}`} style={{ textTransform: 'capitalize' }}>{o.status}</span></td>
                    <td>
                      <div className="flex-align gap-6">
                        {o.status === 'pending' && <>
                          <button className="btn btn-success btn-sm" onClick={() => handleOrderAction(o.id, 'accepted')}>Accept</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleOrderAction(o.id, 'rejected')}>Reject</button>
                        </>}
                        {o.status === 'accepted' && <button className="btn btn-primary btn-sm" onClick={() => handleOrderAction(o.id, 'processing')}>Process</button>}
                        {o.status === 'processing' && <button className="btn btn-success btn-sm" onClick={() => handleOrderAction(o.id, 'delivered')}>Delivered</button>}
                        {['delivered','completed','rejected'].includes(o.status) && <span className="text-muted text-xs">Done</span>}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {!orders.length && (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--gray-500)', padding: 32 }}>No orders yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent products */}
      <div className="card">
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontWeight: 700 }}>My Products</h3>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/seller/products')}>Manage Products</button>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Product</th><th>Price</th><th>Status</th><th>Views</th></tr></thead>
            <tbody>
              {products.slice(0, 5).map(p => (
                <tr key={p.id}>
                  <td>
                    <div className="flex-align gap-8">
  <div style={{ width: 40, height: 40, borderRadius: 8, overflow: 'hidden', background: 'var(--gray-100)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    {p.images?.[0]?.startsWith('http')
      ? <img src={p.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9aa0a6" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>
    }
  </div>
  <span style={{ fontWeight: 500 }}>{p.title}</span>
</div>
                  </td>
                  <td style={{ color: 'var(--brand)', fontWeight: 600 }}>{formatPrice(p.price)}</td>
                  <td><span className={`badge badge-${p.status === 'approved' ? 'green' : p.status === 'pending' ? 'amber' : 'red'}`}>{p.status}</span></td>
                  <td className="text-muted">{p.views}</td>
                </tr>
              ))}
              {!products.length && (
                <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--gray-500)', padding: 32 }}>No products yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
