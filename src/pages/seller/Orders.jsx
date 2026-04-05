import React, { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { getSellerOrders, updateOrderStatus } from '../../lib/api'
import { formatPrice, formatDate, orderStatusColor } from '../../lib/utils'
import { Spinner, EmptyState, Avatar } from '../../components/shared'
import { IconPackage } from '../../components/shared/Icons'
import { sellerEscalateOrder } from '../../lib/api'

export default function SellerOrders() {
  const { profile } = useAuth()
  const { toast }   = useToast()
  const [orders,  setOrders]  = useState([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState('all')

  useEffect(() => {
    if (profile) load()
  }, [profile])

  async function load() {
    try {
      const data = await getSellerOrders(profile.id)
      setOrders(data)
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleAction(orderId, status) {
    try {
      await updateOrderStatus(orderId, status)
      toast(`Order marked as ${status}`, 'success')
      load()
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter)

  if (loading) return <Spinner />

  return (
    <div>
      <div className="page-header">
        <h1>Orders</h1>
        <p>{orders.length} total orders Â· {orders.filter(o => o.status === 'pending').length} pending</p>
      </div>

      <div className="tabs">
        {['all','pending','accepted','processing','delivered','completed','rejected'].map(s => (
          <button
            key={s}
            className={`tab-item ${filter === s ? 'tab-active' : ''}`}
            onClick={() => setFilter(s)}
            style={{ textTransform: 'capitalize' }}
          >
            {s}
            {s !== 'all' && (
              <span style={{ marginLeft: 4, fontSize: 11, color: 'var(--gray-500)' }}>
                ({orders.filter(o => o.status === s).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {!filtered.length ? (
        <EmptyState icon={<IconPackage width={48} height={48} />} title="No orders" message={filter === 'all' ? 'No orders received yet' : `No ${filter} orders`} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(order => {
            const customer = order.users
            const items    = order.order_items || []
            return (
              <div key={order.id} className="card card-pad">
                <div className="flex-between" style={{ flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>
                      {items.map(i => i.products?.title).join(', ') || 'Order'}
                    </div>
                    <div className="text-muted text-sm" style={{ marginTop: 2 }}>
                      #{order.id.slice(0, 8).toUpperCase()}  {formatDate(order.created_at)}
                    </div>

                    {/* Customer info */}
                    <div className="flex-align gap-8 mt-8">
                      <Avatar name={customer?.name} size="sm" src={customer?.avatar_url} /> 
                      <div>
                       
                        <div style={{ fontWeight: 500, fontSize: 13 }}>{customer?.name}</div>
                        <div className="text-xs text-muted">{order.phone}</div>
                      </div>
                    </div>

                    <div className="text-sm mt-8">
                      <span className="text-muted">Delivery: </span>{order.delivery_location}
                    </div>
                    <div className="text-sm">
                      <span className="text-muted">Qty: </span>
                      {items.reduce((s, i) => s + i.quantity, 0)}
                    </div>
                    {order.notes && (
                      <div className="text-sm text-muted mt-4">ðŸ" {order.notes}</div>
                    )}
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span className={`badge badge-${orderStatusColor(order.status)}`} style={{ textTransform: 'capitalize', marginBottom: 8, display: 'inline-block' }}>
                      {order.status}
                    </span>
                    <div style={{ fontWeight: 700, color: 'var(--brand)', fontSize: 20 }}>
                      {formatPrice(order.total_price)}
                    </div>

                    {/* Action buttons */}
                    <div className="flex-align gap-6 mt-8" style={{ justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      {order.status === 'pending' && <>
                        <button className="btn btn-success btn-sm" onClick={() => handleAction(order.id, 'accepted')}>OK Accept</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleAction(order.id, 'rejected')}>X Reject</button>
                      </>}
                      {order.status === 'accepted' && (
                        <button className="btn btn-primary btn-sm" onClick={() => handleAction(order.id, 'processing')}>Mark Processing</button>
                      )}
                      {order.status === 'processing' && (
                        <button className="btn btn-success btn-sm" onClick={() => handleAction(order.id, 'delivered')}>Mark Delivered</button>
                      )}
                      {order.status === 'delivered' && (
                        <button className="btn btn-success btn-sm" onClick={() => handleAction(order.id, 'completed')}>Complete</button>
                      )}
                      {!['completed','rejected'].includes(order.status) && !order.escalated && (
                        <button
                          className="btn btn-sm"
                          style={{ color: 'var(--red)', border: '1px solid var(--red)', background: 'white', marginTop: 4 }}
                          onClick={async () => {
                            const note = window.prompt('Describe the issue you need admin help with:')
                            if (!note) return
                            try {
                              await sellerEscalateOrder(order.id, note)
                              toast('Request sent to admin', 'success')
                              load()
                            } catch (err) { toast(err.message, 'error') }
                          }}
                        >
                          Request Admin Help
                        </button>
                      )}
                      {order.escalated && (
                        <div style={{ fontSize: 11, color: 'var(--red)', marginTop: 4, fontWeight: 600 }}>
                          Admin notified
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

            )
          })}
        </div>
      )}
    </div>
  )
}
