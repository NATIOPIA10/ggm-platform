import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../../context/ToastContext'
import {
  adminGetStats,
  adminGetSellers,
  adminGetAllProducts,
  adminUpdateOrganization,
  adminUpdateProduct,
} from '../../lib/api'
import { formatPrice, formatDate } from '../../lib/utils'
import { Spinner } from '../../components/shared'

export default function AdminOverview() {
  const { toast }    = useToast()
  const navigate     = useNavigate()
  const [stats,    setStats]    = useState(null)
  const [sellers,  setSellers]  = useState([])
  const [products, setProducts] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const [s, orgs, prods] = await Promise.all([
        adminGetStats(),
        adminGetSellers(),
        adminGetAllProducts(),
      ])
      setStats(s)
      setSellers(orgs.filter(o => o.status === 'pending'))
      setProducts(prods.filter(p => p.status === 'pending'))
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  async function approveSeller(id) {
    try {
      await adminUpdateOrganization(id, { status: 'approved' })
      toast('Seller approved OK', 'success')
      load()
    } catch (err) { toast(err.message, 'error') }
  }

  async function rejectSeller(id) {
    try {
      await adminUpdateOrganization(id, { status: 'rejected' })
      toast('Seller rejected', 'info')
      load()
    } catch (err) { toast(err.message, 'error') }
  }

  async function approveProduct(id) {
    try {
      await adminUpdateProduct(id, { status: 'approved' })
      toast('Product approved OK', 'success')
      load()
    } catch (err) { toast(err.message, 'error') }
  }

  async function rejectProduct(id) {
    try {
      await adminUpdateProduct(id, { status: 'rejected' })
      toast('Product rejected', 'info')
      load()
    } catch (err) { toast(err.message, 'error') }
  }

  if (loading) return <Spinner />

  return (
    <div>
      <div className="page-header">
        <h1>Platform Overview</h1>
        <p>GGM admin dashboard</p>
      </div>

      {/* Stats */}
      <div className="stats-grid mb-24">
        <div className="stat-card" onClick={() => navigate('/admin/users')} style={{ cursor: 'pointer' }}>
          <div className="stat-label">Total Users</div>
          <div className="stat-value">{stats?.users}</div>
        </div>
        <div className="stat-card" onClick={() => navigate('/admin/sellers')} style={{ cursor: 'pointer' }}>
          <div className="stat-label">Sellers</div>
          <div className="stat-value">{stats?.sellers || 0}</div>
          <div className="stat-sub" style={{ color: stats?.pendingSellers ? 'var(--amber)' : 'var(--green)' }}>
            {stats?.pendingSellers || 0} pending
          </div>
        </div>
        <div className="stat-card" onClick={() => navigate('/admin/products')} style={{ cursor: 'pointer' }}>
          <div className="stat-label">Products</div>
          <div className="stat-value">{stats?.products}</div>
          <div className="stat-sub" style={{ color: stats?.pendingProducts ? 'var(--amber)' : 'var(--green)' }}>
            {stats?.pendingProducts} pending
          </div>
        </div>
        <div className="stat-card" onClick={() => navigate('/admin/orders')} style={{ cursor: 'pointer' }}>
          <div className="stat-label">Orders</div>
          <div className="stat-value">{stats?.orders}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Revenue</div>
          <div className="stat-value" style={{ fontSize: 20 }}>{formatPrice(stats?.totalRevenue)}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Pending Sellers */}
        <div className="card">
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontWeight: 700 }}> Pending Sellers ({sellers.length})</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/sellers')}>View All</button>
          </div>
          <div style={{ padding: sellers.length ? 0 : '32px 20px', textAlign: 'center', color: 'var(--gray-500)', fontSize: 14 }}>
            {!sellers.length && 'All sellers reviewed'}
            {sellers.map(org => (
              <div key={org.id} style={{ padding: '12px 16px', borderBottom: '1px solid var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{org.name}</div>
                  <div className="text-xs text-muted">{org.users?.email} · {org.phone}</div>
                </div>
                <div className="flex-align gap-6">
                  <button className="btn btn-success btn-sm" onClick={() => approveSeller(org.id)}>Approve</button>
                  <button className="btn btn-danger btn-sm" onClick={() => rejectSeller(org.id)}>Reject</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Products */}
        <div className="card">
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontWeight: 700 }}>Pending Products ({products.length})</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/products')}>View All</button>
          </div>
          <div style={{ padding: products.length ? 0 : '32px 20px', textAlign: 'center', color: 'var(--gray-500)', fontSize: 14 }}>
            {!products.length && 'All products reviewed'}
            {products.map(p => (
              <div key={p.id} style={{ padding: '12px 16px', borderBottom: '1px solid var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <div className="flex-align gap-8">
                  <div style={{ width: 36, height: 36, borderRadius: 6, background: 'var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--gray-500)', flexShrink: 0, overflow: 'hidden' }}>
                    {p.images?.[0]?.startsWith('http') ? <img src={p.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : 'IMG'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{p.title}</div>
                    <div className="text-xs text-muted">{formatPrice(p.price)} · {p.organizations?.name}</div>
                  </div>
                </div>
                <div className="flex-align gap-6">
                  <button className="btn btn-success btn-sm" onClick={() => approveProduct(p.id)}>Approve</button>
                  <button className="btn btn-danger btn-sm" onClick={() => rejectProduct(p.id)}>Reject</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}