import React, { useEffect, useState } from 'react'
import { useToast } from '../../context/ToastContext'
import { useAuth } from '../../context/AuthContext'
import { adminGetUsers, adminDeleteUser } from '../../lib/api'
import { formatDate } from '../../lib/utils'
import { Spinner, Avatar, ConfirmModal } from '../../components/shared'

export default function AdminUsers() {
  const { profile } = useAuth()
  const { toast }   = useToast()
  const [users,    setUsers]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [deleteId, setDeleteId] = useState(null)
  const [roleFilter, setRoleFilter] = useState('all')

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const data = await adminGetUsers()
      setUsers(data)
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    try {
      await adminDeleteUser(deleteId)
      toast('User removed', 'success')
      setDeleteId(null)
      load()
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  const filtered = users
    .filter(u => roleFilter === 'all' || u.role === roleFilter)
    .filter(u => !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))

  if (loading) return <Spinner />

  const roleColor = { admin: 'red', seller: 'blue', customer: 'gray' }

  return (
    <div>
      <div className="page-header">
        <h1>Users</h1>
        <p>{users.length} registered users</p>
      </div>

      {/* Filters */}
      <div className="flex-align gap-10 mb-16" style={{ flexWrap: 'wrap' }}>
        <input
          className="form-input"
          style={{ maxWidth: 280 }}
          placeholder="Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="filter-select" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="seller">Seller</option>
          <option value="customer">Customer</option>
        </select>
        <span className="text-muted text-sm">{filtered.length} results</span>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>User</th><th>Email</th><th>Role</th><th>City</th><th>Joined</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id}>
                  <td>
                    <div className="flex-align gap-8">
                      <Avatar name={u.name} size="sm" />
                      <span style={{ fontWeight: 500 }}>{u.name}</span>
                    </div>
                  </td>
                  <td className="text-sm">{u.email}</td>
                  <td><span className={`badge badge-${roleColor[u.role] || 'gray'}`}>{u.role}</span></td>
                  <td className="text-sm text-muted">{u.city}</td>
                  <td className="text-sm text-muted">{formatDate(u.created_at)}</td>
                  <td>
                    {u.id !== profile.id ? (
                      <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(u.id)}>Remove</button>
                    ) : (
                      <span className="text-muted text-xs">You</span>
                    )}
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--gray-500)', padding: 32 }}>No users found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Remove User"
        message="Are you sure you want to remove this user? All their data will be deleted."
        confirmLabel="Remove"
        danger
      />
    </div>
  )
}
