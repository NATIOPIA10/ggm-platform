import React, { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { supabase } from '../../lib/supabase'
import { formatPrice, formatDate, orderStatusColor } from '../../lib/utils'
import { Spinner, EmptyState, Avatar } from '../../components/shared'
import { IconPackage } from '../../components/shared/Icons'

async function getSellerOrders(sellerId) {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*, products(title, images)), customer:users!user_id(name, avatar, avatar_url)')
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

async function updateOrderStatus(orderId, status) {
  const { data, error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId)
    .select()
  if (error) throw error
  return data?.[0]
}

async function escalateOrder(orderId, note) {
  const { data, error } = await supabase
    .from('orders')
    .update({
      escalated: true,
      escalation_note: note,
      escalated_at: new Date().toISOString()
    })
    .eq('id', orderId)
    .select()
  if (error) throw error
  return data?.[0]
}

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

  async function handleEscalate(orderId) {
    const note = window.prompt('Describe the issue you need admin help with:')
    if (!note || !note.trim()) return
    try {
      await escalateOrder(orderId, note.trim())
      toast('Request sent to admin successfully', 'success')
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
        <p>{orders.length} total orders &middot; {orders.filter(o => o.status === 'pending').length} pending</p>
      </div>

      {/* Filter tabs */}
      <div className="tabs">
        {['all', 'pending', 'accepted', 'processing', 'delivered', 'completed', 'rejected'].map(s => (
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
        <EmptyState
          icon={<IconPackage width={48} height={48} />}
          title="No orders"
          message={filter === 'all' ? 'No orders received yet' : `No ${filter} orders`}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(order => {
            const customer = order.customer
            const items    = order.order_items || []

            return (
              <div key={order.id} className="card card-pad">
                {/* Escalation banner */}
                {order.escalated && (
                  <div style={{ marginBottom: 14, padding: '8px 12px', background: 'var(--amber-light)', borderRadius: 8, fontSize: 13, color: '#7d4e00', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="8" x2="12" y2="12"/>
                      <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    Admin has been notified and is reviewing this order
                  </div>
                )}

                <div className="flex-between" style={{ flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
                  <div>
                    {/* Product title */}
                    <div style={{ fontWeight: 700, fontSize: 15 }}>
                      {items.map(i => i.products?.title).filter(Boolean).join(', ') || 'Order'}
                    </div>
                    <div className="text-muted text-sm" style={{ marginTop: 2 }}>
                      #{order.id.slice(0, 8).toUpperCase()} &middot; {formatDate(order.created_at)}
                    </div>

                    {/* Customer */}
                    <div className="flex-align gap-8" style={{ marginTop: 10 }}>
                      <Avatar name={customer?.name} size="sm" src={customer?.avatar_url} />
                      <div>
                        <div style={{ fontWeight: 500, fontSize: 13 }}>{customer?.name}</div>
                        <div className="text-xs text-muted">{order.phone}</div>
                      </div>
                    </div>

                    <div className="text-sm" style={{ marginTop: 8 }}>
                      <span className="text-muted">Delivery: </span>{order.delivery_location}
                    </div>
                    <div className="text-sm">
                      <span className="text-muted">Qty: </span>
                      {items.reduce((s, i) => s + i.quantity, 0)}
                    </div>
                    {order.notes && (
                      <div className="text-sm text-muted" style={{ marginTop: 4 }}>
                        Note: {order.notes}
                      </div>
                    )}
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span
                      className={`badge badge-${orderStatusColor(order.status)}`}
                      style={{ textTransform: 'capitalize', display: 'inline-block', marginBottom: 8 }}
                    >
                      {order.status}
                    </span>
                    <div style={{ fontWeight: 700, color: 'var(--brand)', fontSize: 20 }}>
                      {formatPrice(order.total_price)}
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10, alignItems: 'flex-end' }}>
                      {order.status === 'pending' && (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-success btn-sm" onClick={() => handleAction(order.id, 'accepted')}>
                            Accept
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleAction(order.id, 'rejected')}>
                            Reject
                          </button>
                        </div>
                      )}
                      {order.status === 'accepted' && (
                        <button className="btn btn-primary btn-sm" onClick={() => handleAction(order.id, 'processing')}>
                          Mark Processing
                        </button>
                      )}
                      {order.status === 'processing' && (
                        <button className="btn btn-success btn-sm" onClick={() => handleAction(order.id, 'delivered')}>
                          Mark Delivered
                        </button>
                      )}
                      {order.status === 'delivered' && (
                        <button className="btn btn-success btn-sm" onClick={() => handleAction(order.id, 'completed')}>
                          Complete
                        </button>
                      )}

                      {/* Escalate to admin */}
                      {!['completed', 'rejected'].includes(order.status) && !order.escalated && (
                        <button
                          className="btn btn-sm"
                          style={{ color: 'var(--red)', border: '1px solid var(--red)', background: 'white', marginTop: 4 }}
                          onClick={() => handleEscalate(order.id)}
                        >
                          Request Admin Help
                        </button>
                      )}
                      {order.escalated && (
                        <div style={{ fontSize: 11, color: 'var(--amber)', fontWeight: 600, marginTop: 4 }}>
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
