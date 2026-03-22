import React, { useEffect, useState } from 'react'
import { useToast } from '../../context/ToastContext'
import { adminGetAllProducts, adminUpdateProduct, deleteProduct } from '../../lib/api'
import { formatPrice, formatDate } from '../../lib/utils'
import { Spinner, EmptyState, ConfirmModal } from '../../components/shared'
import { IconTag } from '../../components/shared/Icons'

export default function AdminProducts() {
  const { toast }  = useToast()
  const [products, setProducts] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState('all')
  const [search,   setSearch]   = useState('')
  const [deleteId, setDeleteId] = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const data = await adminGetAllProducts()
      setProducts(data)
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  async function setStatus(id, status) {
    try {
      await adminUpdateProduct(id, { status })
      toast(`Product ${status}`, status === 'approved' ? 'success' : 'info')
      load()
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  async function handleDelete() {
    try {
      await deleteProduct(deleteId)
      toast('Product deleted', 'success')
      setDeleteId(null)
      load()
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  const filtered = products
    .filter(p => filter === 'all' || p.status === filter)
    .filter(p => !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.organizations?.name?.toLowerCase().includes(search.toLowerCase()))

  if (loading) return <Spinner />

  const statusColor = { pending: 'amber', approved: 'green', rejected: 'red' }

  return (
    <div>
      <div className="page-header">
        <h1>Product Management</h1>
        <p>{products.length} total Â· {products.filter(p => p.status === 'pending').length} pending review</p>
      </div>

      <div className="flex-align gap-10 mb-16" style={{ flexWrap: 'wrap' }}>
        <input
          className="form-input" style={{ maxWidth: 280 }}
          placeholder="Search products..."
          value={search} onChange={e => setSearch(e.target.value)}
        />
        <select className="filter-select" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <span className="text-muted text-sm">{filtered.length} results</span>
      </div>

      {!filtered.length ? (
        <EmptyState icon={<IconTag width={48} height={48} />} title="No products found" message="Try adjusting your filters" />
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Product</th><th>Seller</th><th>Category</th>
                  <th>Price</th><th>City</th><th>Status</th><th>Date</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div className="flex-align gap-10">
                        <div style={{ width: 40, height: 40, borderRadius: 'var(--radius)', background: 'var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0, overflow: 'hidden' }}>
                          {p.images?.[0]?.startsWith('http')
                            ? <img src={p.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : (p.images?.[0] || '[~]')}
                        </div>
                        <span style={{ fontWeight: 500, fontSize: 13 }}>{p.title}</span>
                      </div>
                    </td>
                    <td className="text-sm">{p.organizations?.name || p.users?.name || 'â€"'}</td>
                    <td className="text-sm">{p.categories?.name || 'â€"'}</td>
                    <td style={{ fontWeight: 600, color: 'var(--brand)' }}>{formatPrice(p.price)}</td>
                    <td className="text-sm text-muted">{p.city}</td>
                    <td><span className={`badge badge-${statusColor[p.status]}`}>{p.status}</span></td>
                    <td className="text-sm text-muted">{formatDate(p.created_at)}</td>
                    <td>
                      <div className="flex-align gap-6" style={{ flexWrap: 'wrap' }}>
                        {p.status === 'pending' && <>
                          <button className="btn btn-success btn-sm" onClick={() => setStatus(p.id, 'approved')}>OK Approve</button>
                          <button className="btn btn-danger btn-sm" onClick={() => setStatus(p.id, 'rejected')}>X Reject</button>
                        </>}
                        {p.status === 'approved' && (
                          <button className="btn btn-ghost btn-sm" onClick={() => setStatus(p.id, 'rejected')}>Reject</button>
                        )}
                        {p.status === 'rejected' && (
                          <button className="btn btn-outline btn-sm" onClick={() => setStatus(p.id, 'approved')}>Approve</button>
                        )}
                        <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(p.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Product"
        message="Permanently delete this product? This cannot be undone."
        confirmLabel="Delete"
        danger
      />
    </div>
  )
}
