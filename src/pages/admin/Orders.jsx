import React, { useEffect, useState } from 'react'
import { useToast } from '../../context/ToastContext'
import { getAllOrders } from '../../lib/api'
import { formatPrice, formatDate, orderStatusColor } from '../../lib/utils'
import { Spinner, EmptyState } from '../../components/shared'
import { IconPackage } from '../../components/shared/Icons'

export default function AdminOrders() {
  const { toast }  = useToast()
  const [orders,   setOrders]   = useState([])
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState('all')
  const [search,   setSearch]   = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const data = await getAllOrders()
      setOrders(data)
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const filtered = orders
    .filter(o => filter === 'all' || o.status === filter)
    .filter(o => {
      if (!search) return true
      const q = search.toLowerCase()
      return (
        o.id.toLowerCase().includes(q) ||
        o.customer?.name?.toLowerCase().includes(q) ||
        o.delivery_location?.toLowerCase().includes(q)
      )
    })

  const totalRevenue = orders
    .filter(o => o.status !== 'rejected')
    .reduce((s, o) => s + Number(o.total_price), 0)

  if (loading) return <Spinner />

  return (
    <div>
      <div className="page-header">
        <h1>All Orders</h1>
        <p>{orders.length} total orders . Platform revenue: <strong>{formatPrice(totalRevenue)}</strong></p>
      </div>

      {/* Summary row */}
      <div className="stats-grid mb-24">
        {['pending','accepted','processing','delivered','completed','rejected'].map(s => (
          <div key={s} className="stat-card" style={{ padding: '14px 16px' }}>
            <div className="stat-label" style={{ textTransform: 'capitalize' }}>{s}</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{orders.filter(o => o.status === s).length}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex-align gap-10 mb-16" style={{ flexWrap: 'wrap' }}>
        <input
          className="form-input" style={{ maxWidth: 280 }}
          placeholder="Search orders..."
          value={search} onChange={e => setSearch(e.target.value)}
        />
        <select className="filter-select" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">All Status</option>
          {['pending','accepted','processing','delivered','completed','rejected'].map(s => (
            <option key={s} value={s} style={{ textTransform: 'capitalize' }}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
        <span className="text-muted text-sm">{filtered.length} orders</span>
      </div>

      {!filtered.length ? (
        <EmptyState icon={<IconPackage width={48} height={48} />} title="No orders found" message="Try adjusting your filters" />
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Seller</th>
                  <th>Product</th>
                  <th>Amount</th>
                  <th>Delivery</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(o => {
                  const item = o.order_items?.[0]
                  return (
                    <tr key={o.id}>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontSize: 12, background: 'var(--gray-100)', padding: '2px 6px', borderRadius: 4 }}>
                          #{o.id.slice(0, 8).toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500, fontSize: 13 }}>{o.customer?.name || 'â€"'}</div>
                        {o.phone && <div className="text-xs text-muted">{o.phone}</div>}
                      </td>
                      <td className="text-sm">{o.seller?.name || 'â€"'}</td>
                      <td className="text-sm">{item?.products?.title || 'â€"'}</td>
                      <td style={{ fontWeight: 700, color: 'var(--brand)' }}>{formatPrice(o.total_price)}</td>
                      <td className="text-sm text-muted" style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {o.delivery_location || 'â€"'}
                      </td>
                      <td>
                        <span className={`badge badge-${orderStatusColor(o.status)}`} style={{ textTransform: 'capitalize' }}>
                          {o.status}
                        </span>
                      </td>
                      <td className="text-sm text-muted">{formatDate(o.created_at)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
