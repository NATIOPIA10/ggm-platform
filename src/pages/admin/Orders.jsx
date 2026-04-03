import React, { useEffect, useState } from 'react'
import { useToast } from '../../context/ToastContext'
import { getAllOrders, adminUpdateOrderStatus } from '../../lib/api'
import { formatPrice, formatDate, orderStatusColor, timeAgo } from '../../lib/utils'
import { Spinner, EmptyState, Avatar, OrderTimeline } from '../../components/shared'
import { IconPackage, IconSearch } from '../../components/shared/Icons'

const STATUSES = ['pending','accepted','processing','delivered','completed','rejected']

export default function AdminOrders() {
  const { toast }      = useToast()
  const [orders,       setOrders]       = useState([])
  const [loading,      setLoading]      = useState(true)
  const [selected,     setSelected]     = useState(null)
  const [filter,       setFilter]       = useState('all')
  const [search,       setSearch]       = useState('')
  const [sellerFilter, setSellerFilter] = useState('all')
  const [updating,     setUpdating]     = useState(null)

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

  async function handleStatusChange(orderId, status) {
    setUpdating(orderId)
    try {
      await adminUpdateOrderStatus(orderId, status)
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o))
      if (selected?.id === orderId) setSelected(prev => ({ ...prev, status }))
      toast(`Order marked as ${status}`, 'success')
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setUpdating(null)
    }
  }

  const sellers = [...new Map(orders.map(o => [o.seller_id, { id: o.seller_id, name: o.seller?.organizations?.name || o.seller?.name }])).values()]

  const filtered = orders
    .filter(o => filter === 'all' || o.status === filter)
    .filter(o => sellerFilter === 'all' || o.seller_id === sellerFilter)
    .filter(o => {
      if (!search) return true
      const q = search.toLowerCase()
      return (
        o.id.toLowerCase().includes(q) ||
        o.customer?.name?.toLowerCase().includes(q) ||
        o.seller?.name?.toLowerCase().includes(q) ||
        o.delivery_location?.toLowerCase().includes(q) ||
        o.order_items?.[0]?.products?.title?.toLowerCase().includes(q)
      )
    })

  const totalRevenue = orders.filter(o => o.status !== 'rejected').reduce((s, o) => s + Number(o.total_price), 0)

  if (loading) return <Spinner />

  return (
    <div>
      <div className="page-header">
        <h1>Orders Management</h1>
        <p>{orders.length} total orders &middot; Revenue: <strong style={{ color: 'var(--brand)' }}>{formatPrice(totalRevenue)}</strong></p>
      </div>

      {/* Stats — clickable to filter */}
      <div className="stats-grid mb-24">
        {[
          { label: 'Pending',    s: 'pending',    color: 'var(--amber)' },
          { label: 'Accepted',   s: 'accepted',   color: 'var(--brand)' },
          { label: 'Processing', s: 'processing', color: 'var(--brand)' },
          { label: 'Delivered',  s: 'delivered',  color: 'var(--green)' },
          { label: 'Completed',  s: 'completed',  color: 'var(--green)' },
          { label: 'Rejected',   s: 'rejected',   color: 'var(--red)'   },
        ].map(({ label, s, color }) => (
          <div
            key={s}
            className="stat-card"
            style={{ cursor: 'pointer', borderBottom: `3px solid ${filter === s ? color : 'transparent'}`, transition: 'border-color .2s' }}
            onClick={() => setFilter(filter === s ? 'all' : s)}
          >
            <div className="stat-label">{label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color }}>{orders.filter(o => o.status === s).length}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex-align gap-10 mb-16" style={{ flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 300 }}>
          <IconSearch width={15} height={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', pointerEvents: 'none' }} />
          <input
            className="form-input"
            style={{ paddingLeft: 34 }}
            placeholder="Search orders..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="filter-select" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">All Status</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        <select className="filter-select" value={sellerFilter} onChange={e => setSellerFilter(e.target.value)}>
          <option value="all">All Sellers</option>
          {sellers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        {(filter !== 'all' || search || sellerFilter !== 'all') && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setFilter('all'); setSearch(''); setSellerFilter('all') }}>Clear</button>
        )}
        <span className="text-muted text-sm">{filtered.length} results</span>
      </div>

      {!filtered.length ? (
        <EmptyState icon={<IconPackage width={48} height={48} />} title="No orders found" message="Try adjusting your filters" />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 380px' : '1fr', gap: 20, alignItems: 'start' }}>

          {/* Table */}
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Seller / Shop</th>
                    <th>Product</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Control</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(o => {
                    const item = o.order_items?.[0]
                    const isSelected = selected?.id === o.id
                    return (
                      <tr
                        key={o.id}
                        onClick={() => setSelected(isSelected ? null : o)}
                        style={{ cursor: 'pointer', background: isSelected ? 'var(--brand-light)' : undefined }}
                      >
                        <td>
                          <span style={{ fontFamily: 'monospace', fontSize: 12, background: 'var(--gray-100)', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>
                            #{o.id.slice(0, 8).toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <div className="flex-align gap-8">
                            <Avatar name={o.customer?.name} size="sm" src={o.customer?.avatar_url} />
                            <div>
                              <div style={{ fontWeight: 500, fontSize: 13 }}>{o.customer?.name || '-'}</div>
                              {o.phone && <div className="text-xs text-muted">{o.phone}</div>}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 500, fontSize: 13 }}>{o.seller?.organizations?.name || o.seller?.name || '-'}</div>
                          <div className="text-xs text-muted">{o.seller?.email}</div>
                        </td>
                        <td className="text-sm">{item?.products?.title || '-'}</td>
                        <td style={{ fontWeight: 700, color: 'var(--brand)' }}>{formatPrice(o.total_price)}</td>
                        <td>
                          <span className={`badge badge-${orderStatusColor(o.status)}`} style={{ textTransform: 'capitalize' }}>
                            {o.status}
                          </span>
                        </td>
                        <td className="text-xs text-muted">{timeAgo(o.created_at)}</td>
                        <td onClick={e => e.stopPropagation()}>
                          <select
                            className="filter-select"
                            value={o.status}
                            onChange={e => handleStatusChange(o.id, e.target.value)}
                            disabled={updating === o.id}
                            style={{ fontSize: 12, padding: '4px 8px' }}
                          >
                            {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                          </select>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detail panel */}
          {selected && (
            <div className="card card-pad" style={{ position: 'sticky', top: 'calc(var(--nav-h) + 16px)' }}>
              <div className="flex-between mb-16">
                <div style={{ fontWeight: 700, fontSize: 15 }}>Order Details</div>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-500)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>

              <div className="flex-between mb-16">
                <span style={{ fontFamily: 'monospace', fontSize: 13, background: 'var(--gray-100)', padding: '4px 10px', borderRadius: 6, fontWeight: 600 }}>
                  #{selected.id.slice(0, 8).toUpperCase()}
                </span>
                <span className={`badge badge-${orderStatusColor(selected.status)}`} style={{ textTransform: 'capitalize' }}>
                  {selected.status}
                </span>
              </div>

              {/* Timeline */}
              {selected.status !== 'rejected' && (
                <div style={{ marginBottom: 20 }}>
                  <OrderTimeline status={selected.status} />
                </div>
              )}

              {/* Customer */}
              <div style={{ marginBottom: 14, padding: 14, background: 'var(--gray-50)', borderRadius: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Customer</div>
                <div className="flex-align gap-10">
                  <Avatar name={selected.customer?.name} size="md" src={selected.customer?.avatar_url} />
                  <div>
                    <div style={{ fontWeight: 600 }}>{selected.customer?.name}</div>
                    <div className="text-xs text-muted">{selected.customer?.email}</div>
                    <div className="text-xs text-muted">{selected.phone}</div>
                    <div className="text-xs text-muted">{selected.delivery_location}</div>
                  </div>
                </div>
              </div>

              {/* Seller */}
              <div style={{ marginBottom: 14, padding: 14, background: 'var(--gray-50)', borderRadius: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Seller</div>
                <div className="flex-align gap-10">
                  <Avatar name={selected.seller?.organizations?.name || selected.seller?.name} size="md" src={selected.seller?.avatar_url} />
                  <div>
                    <div style={{ fontWeight: 600 }}>{selected.seller?.organizations?.name || selected.seller?.name}</div>
                    <div className="text-xs text-muted">{selected.seller?.email}</div>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Order Items</div>
                {selected.order_items?.map((item, i) => (
                  <div key={i} className="flex-between" style={{ padding: '8px 0', borderBottom: '1px solid var(--gray-100)' }}>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>{item.products?.title}</div>
                      <div className="text-xs text-muted">Qty: {item.quantity} x {formatPrice(item.unit_price)}</div>
                    </div>
                    <div style={{ fontWeight: 600, color: 'var(--brand)' }}>{formatPrice(item.unit_price * item.quantity)}</div>
                  </div>
                ))}
                <div className="flex-between" style={{ paddingTop: 10, fontWeight: 700 }}>
                  <span>Total</span>
                  <span style={{ color: 'var(--brand)', fontSize: 16 }}>{formatPrice(selected.total_price)}</span>
                </div>
              </div>

              {selected.notes && (
                <div style={{ marginBottom: 16, padding: 10, background: 'var(--amber-light)', borderRadius: 8, fontSize: 13, color: '#7d4e00' }}>
                  Note: {selected.notes}
                </div>
              )}

              {/* Admin status control */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Update Order Status</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                  {STATUSES.map(s => (
                    <button
                      key={s}
                      className={`btn btn-sm ${selected.status === s ? 'btn-primary' : 'btn-ghost'}`}
                      onClick={() => handleStatusChange(selected.id, s)}
                      disabled={updating === selected.id || selected.status === s}
                      style={{ textTransform: 'capitalize', fontSize: 12, padding: '6px 8px' }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
