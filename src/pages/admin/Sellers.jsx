import React, { useEffect, useState } from 'react'
import { useToast } from '../../context/ToastContext'
import { adminGetSellers, adminUpdateOrganization } from '../../lib/api'
import { formatDate } from '../../lib/utils'
import { Spinner, EmptyState } from '../../components/shared'

export default function AdminSellers() {
  const { toast }  = useToast()
  const [sellers,  setSellers]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState('all')
  const [search,   setSearch]   = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const data = await adminGetSellers()
      setSellers(data)
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  async function action(id, updates, msg) {
    try {
      await adminUpdateOrganization(id, updates)
      toast(msg, 'success')
      load()
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  const filtered = sellers
    .filter(s => filter === 'all' || s.status === filter)
    .filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase()))

  if (loading) return <Spinner />

  const statusColor = { pending: 'amber', approved: 'green', rejected: 'red' }

  return (
    <div>
      <div className="page-header">
        <h1>Sellers & Organizations</h1>
        <p>{sellers.length} registered sellers · {sellers.filter(s => s.status === 'pending').length} pending</p>
      </div>

      <div className="flex-align gap-10 mb-16" style={{ flexWrap: 'wrap' }}>
        <input
          className="form-input" style={{ maxWidth: 280 }}
          placeholder="Search sellers..."
          value={search} onChange={e => setSearch(e.target.value)}
        />
        <select className="filter-select" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Organization</th><th>Owner</th><th>Phone</th><th>Status</th><th>Verified</th><th>Joined</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(org => (
                <tr key={org.id}>
                  <td style={{ fontWeight: 600 }}>{org.name}</td>
                  <td>
                    <div>
                      <div className="text-sm">{org.users?.name}</div>
                      <div className="text-xs text-muted">{org.users?.email}</div>
                    </div>
                  </td>
                  <td className="text-sm">{org.phone || '-'}</td>
                  <td><span className={`badge badge-${statusColor[org.status]}`}>{org.status}</span></td>
                  <td>{org.verified ? <span className="verified-badge">Verified</span> : <span className="text-muted text-xs">No</span>}</td>
                  <td className="text-sm text-muted">{formatDate(org.created_at)}</td>
                  <td>
                    <div className="flex-align gap-6" style={{ flexWrap: 'wrap' }}>
                      {org.status === 'pending' && <>
                        <button className="btn btn-success btn-sm" onClick={() => action(org.id, { status: 'approved' }, `${org.name} approved ✓`)}>Approve</button>
                        <button className="btn btn-danger btn-sm" onClick={() => action(org.id, { status: 'rejected' }, `${org.name} rejected`)}>Reject</button>
                      </>}
                      {org.status === 'approved' && !org.verified && (
                        <button className="btn btn-outline btn-sm" onClick={() => action(org.id, { verified: true }, `${org.name} verified ✓`)}>Verify</button>
                      )}
                      {org.status === 'approved' && (
                        <button className="btn btn-ghost btn-sm" onClick={() => action(org.id, { status: 'rejected' }, 'Seller suspended')}>Suspend</button>
                      )}
                      {org.status === 'rejected' && (
                        <button className="btn btn-outline btn-sm" onClick={() => action(org.id, { status: 'approved' }, 'Seller reinstated')}>Reinstate</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--gray-500)', padding: 32 }}>No sellers found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
