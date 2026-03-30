import React, { useEffect, useState } from 'react'
import { adminGetFeedbacks, adminUpdateFeedback, getFeedbackStats, subscribeFeedbacks } from '../../lib/feedback'
import { formatDate, timeAgo } from '../../lib/utils'
import { Spinner, EmptyState, Avatar } from '../../components/shared'
import { useToast } from '../../context/ToastContext'

const TYPE_CONFIG = {
  bug:        { label: 'Bug',        color: '#d93025', bg: '#fce8e6' },
  suggestion: { label: 'Suggestion', color: '#1a73e8', bg: '#e8f0fe' },
  complaint:  { label: 'Complaint',  color: '#f9ab00', bg: '#fef7e0' },
  general:    { label: 'General',    color: '#1e8e3e', bg: '#e6f4ea' },
}

const STATUS_CONFIG = {
  pending:  { label: 'Pending',  color: 'amber' },
  reviewed: { label: 'Reviewed', color: 'blue'  },
  resolved: { label: 'Resolved', color: 'green' },
}

export default function AdminFeedback() {
  const { toast }  = useToast()
  const [feedbacks, setFeedbacks] = useState([])
  const [stats,     setStats]     = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [selected,  setSelected]  = useState(null)
  const [reply,     setReply]     = useState('')
  const [saving,    setSaving]    = useState(false)
  const [filters,   setFilters]   = useState({ type: '', role: '', status: '' })
  const [newCount,  setNewCount]  = useState(0)

  useEffect(() => {
    load()
    // Realtime subscription
    const channel = subscribeFeedbacks((newFeedback) => {
      setFeedbacks(prev => [newFeedback, ...prev])
      setNewCount(c => c + 1)
      toast('New feedback received!', 'info')
    })
    return () => channel.unsubscribe()
  }, [])

  useEffect(() => { load() }, [filters])

  async function load() {
    setLoading(true)
    try {
      const [data, s] = await Promise.all([
        adminGetFeedbacks(filters),
        getFeedbackStats(),
      ])
      setFeedbacks(data)
      setStats(s)
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleStatusChange(id, status) {
    try {
      await adminUpdateFeedback(id, { status })
      setFeedbacks(prev => prev.map(f => f.id === id ? { ...f, status } : f))
      if (selected?.id === id) setSelected(prev => ({ ...prev, status }))
      toast('Status updated', 'success')
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  async function handleReply() {
    if (!reply.trim()) { toast('Enter a reply', 'error'); return }
    setSaving(true)
    try {
      await adminUpdateFeedback(selected.id, { admin_reply: reply.trim(), status: 'reviewed' })
      setFeedbacks(prev => prev.map(f => f.id === selected.id ? { ...f, admin_reply: reply.trim(), status: 'reviewed' } : f))
      setSelected(prev => ({ ...prev, admin_reply: reply.trim(), status: 'reviewed' }))
      toast('Reply sent!', 'success')
      setReply('')
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const f = (key) => (e) => setFilters(prev => ({ ...prev, [key]: e.target.value }))

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1>Feedback</h1>
          <p>{feedbacks.length} total submissions{newCount > 0 && <span style={{ color: 'var(--brand)', fontWeight: 600 }}> · {newCount} new</span>}</p>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="stats-grid mb-24">
          <div className="stat-card">
            <div className="stat-label">Total</div>
            <div className="stat-value">{stats.total}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Pending</div>
            <div className="stat-value" style={{ color: 'var(--amber)' }}>{stats.pending}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Reviewed</div>
            <div className="stat-value" style={{ color: 'var(--brand)' }}>{stats.reviewed}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Resolved</div>
            <div className="stat-value" style={{ color: 'var(--green)' }}>{stats.resolved}</div>
          </div>
          {stats.avgRating && (
            <div className="stat-card">
              <div className="stat-label">Avg Rating</div>
              <div className="stat-value">{stats.avgRating} <span style={{ fontSize: 16, color: 'var(--amber)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--amber)" stroke="var(--amber)" strokeWidth="2" style={{ verticalAlign: 'middle' }}>
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
              </span></div>
            </div>
          )}
        </div>
      )}

      {/* Type breakdown */}
      {stats && (
        <div className="card card-pad mb-24">
          <div style={{ fontWeight: 700, marginBottom: 14, fontSize: 14 }}>Feedback by Type</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {Object.entries(stats.byType).map(([type, count]) => {
              const cfg = TYPE_CONFIG[type]
              const pct = stats.total ? Math.round(count / stats.total * 100) : 0
              return (
                <div key={type} style={{ flex: 1, minWidth: 100, padding: '12px 16px', borderRadius: 10, background: cfg.bg, textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: cfg.color }}>{count}</div>
                  <div style={{ fontSize: 12, color: cfg.color, fontWeight: 600, marginTop: 2 }}>{cfg.label}</div>
                  <div style={{ fontSize: 11, color: cfg.color, opacity: .7 }}>{pct}%</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filter-bar mb-16">
        <select className="filter-select" value={filters.type} onChange={f('type')}>
          <option value="">All Types</option>
          {Object.entries(TYPE_CONFIG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
        </select>
        <select className="filter-select" value={filters.role} onChange={f('role')}>
          <option value="">All Roles</option>
          <option value="customer">Customer</option>
          <option value="seller">Seller</option>
          <option value="admin">Admin</option>
        </select>
        <select className="filter-select" value={filters.status} onChange={f('status')}>
          <option value="">All Status</option>
          {Object.entries(STATUS_CONFIG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
        </select>
        <button className="btn btn-ghost btn-sm" onClick={() => setFilters({ type: '', role: '', status: '' })}>
          Clear
        </button>
      </div>

      {loading ? <Spinner /> : feedbacks.length === 0 ? (
        <EmptyState
          icon={<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>}
          title="No feedback yet"
          message="Feedback from users will appear here"
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 380px' : '1fr', gap: 20, alignItems: 'start' }}>
          {/* List */}
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>User</th><th>Type</th><th>Message</th>
                    <th>Rating</th><th>Status</th><th>Date</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {feedbacks.map(fb => {
                    const tc = TYPE_CONFIG[fb.type]
                    const sc = STATUS_CONFIG[fb.status]
                    const isSelected = selected?.id === fb.id
                    return (
                      <tr key={fb.id}
                        onClick={() => { setSelected(fb); setReply(fb.admin_reply || '') }}
                        style={{ cursor: 'pointer', background: isSelected ? 'var(--brand-light)' : undefined }}
                      >
                        <td>
                          <div className="flex-align gap-8">
                            <Avatar name={fb.users?.name || '?'} size="sm" src={fb.users?.avatar_url} />
                            <div>
                              <div style={{ fontWeight: 500, fontSize: 13 }}>{fb.users?.name || 'User'}</div>
                              <div style={{ fontSize: 11, color: 'var(--gray-500)', textTransform: 'capitalize' }}>{fb.role}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 12, background: tc.bg, color: tc.color, fontSize: 12, fontWeight: 500 }}>
                            {tc.label}
                          </span>
                        </td>
                        <td style={{ maxWidth: 200 }}>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13 }}>
                            {fb.message}
                          </div>
                          {fb.admin_reply && (
                            <div style={{ fontSize: 11, color: 'var(--brand)', marginTop: 2 }}>Replied</div>
                          )}
                        </td>
                        <td>
                          {fb.rating ? (
                            <div style={{ display: 'flex', gap: 1 }}>
                              {[1,2,3,4,5].map(n => (
                                <svg key={n} width="12" height="12" viewBox="0 0 24 24"
                                  fill={n <= fb.rating ? 'var(--amber)' : 'none'}
                                  stroke={n <= fb.rating ? 'var(--amber)' : 'var(--gray-300)'}
                                  strokeWidth="2">
                                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                                </svg>
                              ))}
                            </div>
                          ) : <span className="text-muted text-xs">-</span>}
                        </td>
                        <td><span className={`badge badge-${sc.color}`}>{sc.label}</span></td>
                        <td className="text-muted text-xs">{timeAgo(fb.created_at)}</td>
                        <td onClick={e => e.stopPropagation()}>
                          <select
                            className="filter-select"
                            value={fb.status}
                            onChange={e => handleStatusChange(fb.id, e.target.value)}
                            style={{ fontSize: 12, padding: '4px 8px' }}
                          >
                            <option value="pending">Pending</option>
                            <option value="reviewed">Reviewed</option>
                            <option value="resolved">Resolved</option>
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
                <div style={{ fontWeight: 700, fontSize: 15 }}>Feedback Detail</div>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-500)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>

              {/* User */}
              <div className="flex-align gap-10 mb-16">
                <Avatar name={selected.users?.name} size="md" src={selected.users?.avatar_url} />
                <div>
                  <div style={{ fontWeight: 600 }}>{selected.users?.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>{selected.users?.email}</div>
                  <div style={{ fontSize: 12, color: 'var(--gray-500)', textTransform: 'capitalize' }}>{selected.role}</div>
                </div>
              </div>

              {/* Type + Status */}
              <div className="flex-align gap-8 mb-12">
                <span style={{ padding: '3px 10px', borderRadius: 12, background: TYPE_CONFIG[selected.type]?.bg, color: TYPE_CONFIG[selected.type]?.color, fontSize: 12, fontWeight: 500 }}>
                  {TYPE_CONFIG[selected.type]?.label}
                </span>
                <span className={`badge badge-${STATUS_CONFIG[selected.status]?.color}`}>
                  {STATUS_CONFIG[selected.status]?.label}
                </span>
                <span style={{ fontSize: 12, color: 'var(--gray-500)', marginLeft: 'auto' }}>{formatDate(selected.created_at)}</span>
              </div>

              {/* Rating */}
              {selected.rating && (
                <div className="flex-align gap-4 mb-12">
                  {[1,2,3,4,5].map(n => (
                    <svg key={n} width="16" height="16" viewBox="0 0 24 24"
                      fill={n <= selected.rating ? 'var(--amber)' : 'none'}
                      stroke={n <= selected.rating ? 'var(--amber)' : 'var(--gray-300)'}
                      strokeWidth="2">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                  ))}
                  <span style={{ fontSize: 12, color: 'var(--gray-600)' }}>{selected.rating}/5</span>
                </div>
              )}

              {/* Message */}
              <div style={{ background: 'var(--gray-50)', borderRadius: 10, padding: 14, marginBottom: 14, fontSize: 14, lineHeight: 1.6, color: 'var(--gray-800)' }}>
                {selected.message}
              </div>

              {/* Screenshot */}
              {selected.image_url && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--gray-600)', marginBottom: 6 }}>Screenshot</div>
                  <img src={selected.image_url} alt="screenshot" style={{ width: '100%', borderRadius: 10, border: '1px solid var(--gray-200)' }} />
                </div>
              )}

              {/* Previous reply */}
              {selected.admin_reply && (
                <div style={{ background: 'var(--brand-light)', borderRadius: 10, padding: 12, marginBottom: 14, borderLeft: '3px solid var(--brand)' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--brand)', marginBottom: 4 }}>Your Reply</div>
                  <div style={{ fontSize: 13, color: 'var(--gray-800)', lineHeight: 1.6 }}>{selected.admin_reply}</div>
                </div>
              )}

              {/* Reply box */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--gray-800)', display: 'block', marginBottom: 6 }}>
                  {selected.admin_reply ? 'Update Reply' : 'Write a Reply'}
                </label>
                <textarea
                  className="form-input"
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  placeholder="Write your response..."
                  rows={3}
                  style={{ resize: 'none', marginBottom: 10 }}
                />
                <div className="flex-align gap-8">
                  <select
                    className="filter-select"
                    value={selected.status}
                    onChange={e => handleStatusChange(selected.id, e.target.value)}
                    style={{ flex: 1 }}
                  >
                    <option value="pending">Pending</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="resolved">Resolved</option>
                  </select>
                  <button className="btn btn-primary btn-sm" onClick={handleReply} disabled={saving || !reply.trim()} style={{ flex: 2 }}>
                    {saving ? 'Saving...' : 'Send Reply'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
