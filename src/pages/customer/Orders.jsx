import React, { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getCustomerOrders } from '../../lib/api'
import { formatPrice, formatDate, orderStatusColor } from '../../lib/utils'
import { Spinner, EmptyState, OrderTimeline } from '../../components/shared'
import { IconPackage } from '../../components/shared/Icons'
import { useNavigate } from 'react-router-dom'

export default function CustomerOrders() {
  const { profile } = useAuth()
  const navigate    = useNavigate()
  const [orders,  setOrders]  = useState([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState('all')

  useEffect(() => {
    if (profile) loadOrders()
  }, [profile])

  async function loadOrders() {
    try {
      const data = await getCustomerOrders(profile.id)
      setOrders(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter)

  if (loading) return <Spinner />

  return (
    <div>
      <div className="page-header">
        <h1>My Orders</h1>
        <p>{orders.length} total orders</p>
      </div>

      {/* Filter tabs */}
      <div className="tabs">
        {['all','pending','accepted','processing','delivered','completed','rejected'].map(s => (
          <button
            key={s}
            className={`tab-item ${filter === s ? 'tab-active' : ''}`}
            onClick={() => setFilter(s)}
            style={{ textTransform: 'capitalize' }}
          >
            {s}
            {s !== 'all' && <span style={{ marginLeft: 4, fontSize: 11, color: 'var(--gray-500)' }}>
              ({orders.filter(o => o.status === s).length})
            </span>}
          </button>
        ))}
      </div>

      {!filtered.length ? (
        <EmptyState
          icon={<IconPackage width={48} height={48} />}
          title="No orders yet"
          message="Browse products and place your first order"
          action={<button className="btn btn-primary" onClick={() => navigate('/search')}>Browse Products</button>}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filtered.map(order => {
            const item = order.order_items?.[0]
            const product = item?.products
            return (
              <div key={order.id} className="card card-pad">
                <div className="flex-between" style={{ marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>
                      {product?.title || 'Order'}
                    </div>
                    <div className="text-muted text-sm" style={{ marginTop: 2 }}>
                      Order #{order.id.slice(0, 8).toUpperCase()} · {formatDate(order.created_at)}
                    </div>
                    <div className="text-sm mt-4">
                      <span className="text-muted">Qty: </span>
                      {order.order_items?.reduce((s, i) => s + i.quantity, 0) || 1} ·
                      <span className="text-muted"> Delivery: </span>
                      {order.delivery_location}
                    </div>
                    {order.notes && (
                      <div className="text-sm text-muted mt-4">ðŸ" {order.notes}</div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className={`badge badge-${orderStatusColor(order.status)}`} style={{ textTransform: 'capitalize', display: 'block', marginBottom: 6 }}>
                      {order.status}
                    </span>
                    <div style={{ fontWeight: 700, color: 'var(--brand)', fontSize: 18 }}>
                      {formatPrice(order.total_price)}
                    </div>
                  </div>
                </div>

                {/* Timeline €" only for non-rejected orders */}
                {order.status !== 'rejected' && (
                  <OrderTimeline status={order.status} />
                )}

                {order.status === 'rejected' && (
                  <div style={{ padding: '10px 14px', background: 'var(--red-light)', borderRadius: 'var(--radius)', fontSize: 13, color: 'var(--red)', marginTop: 12 }}>
                    X This order was rejected by the seller.
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
