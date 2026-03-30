import React, { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getUserFeedbacks } from '../../lib/feedback'
import { formatDate } from '../../lib/utils'
import { Spinner, EmptyState } from '../../components/shared'

const TYPE_CONFIG = {
  bug:        { label: 'Bug',        color: '#d93025', bg: '#fce8e6' },
  suggestion: { label: 'Suggestion', color: '#1a73e8', bg: '#e8f0fe' },
  complaint:  { label: 'Complaint',  color: '#f9ab00', bg: '#fef7e0' },
  general:    { label: 'General',    color: '#1e8e3e', bg: '#e6f4ea' },
}

const STATUS_CONFIG = {
  pending:  { label: 'Pending',  color: 'amber', desc: 'Awaiting review by admin' },
  reviewed: { label: 'Reviewed', color: 'blue',  desc: 'Admin has seen your feedback' },
  resolved: { label: 'Resolved', color: 'green', desc: 'Your feedback has been resolved' },
}

export default function FeedbackHistory() {
  const { profile } = useAuth()
  const [feedbacks, setFeedbacks] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [expanded,  setExpanded]  = useState(null)

  useEffect(() => {
    if (profile) load()
  }, [profile])

  async function load() {
    try {
      const data = await getUserFeedbacks(profile.id)
      setFeedbacks(data)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Spinner />

  return (
    <div>
      <div className="page-header">
        <h1>My Feedback</h1>
        <p>{feedbacks.length} submission{feedbacks.length !== 1 ? 's' : ''}</p>
      </div>

      {!feedbacks.length ? (
        <EmptyState
          icon={<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>}
          title="No feedback submitted"
          message="Use the Feedback button to share your thoughts"
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {feedbacks.map(fb => {
            const tc = TYPE_CONFIG[fb.type] || TYPE_CONFIG.general
            const sc = STATUS_CONFIG[fb.status] || STATUS_CONFIG.pending
            const isOpen = expanded === fb.id
            return (
              <div key={fb.id} className="card" style={{ overflow: 'hidden' }}>
                {/* Header row */}
                <div
                  style={{ padding: '14px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}
                  onClick={() => setExpanded(isOpen ? null : fb.id)}
                >
                  <span style={{ padding: '3px 10px', borderRadius: 12, background: tc.bg, color: tc.color, fontSize: 12, fontWeight: 500, flexShrink: 0 }}>
                    {tc.label}
                  </span>
                  <div style={{ flex: 1, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {fb.message}
                  </div>
                  <span className={`badge badge-${sc.color}`} style={{ flexShrink: 0 }}>{sc.label}</span>
                  <span style={{ fontSize: 12, color: 'var(--gray-500)', flexShrink: 0 }}>{formatDate(fb.created_at)}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gray-400)" strokeWidth="2"
                    style={{ flexShrink: 0, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </div>

                {/* Expanded content */}
                {isOpen && (
                  <div style={{ borderTop: '1px solid var(--gray-100)', padding: '14px 18px', animation: 'slideUp .15s ease' }}>
                    {/* Full message */}
                    <div style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--gray-700)', marginBottom: 12 }}>
                      {fb.message}
                    </div>

                    {/* Rating */}
                    {fb.rating && (
                      <div className="flex-align gap-4 mb-12">
                        <span style={{ fontSize: 12, color: 'var(--gray-600)', marginRight: 4 }}>Your rating:</span>
                        {[1,2,3,4,5].map(n => (
                          <svg key={n} width="14" height="14" viewBox="0 0 24 24"
                            fill={n <= fb.rating ? 'var(--amber)' : 'none'}
                            stroke={n <= fb.rating ? 'var(--amber)' : 'var(--gray-300)'}
                            strokeWidth="2">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                          </svg>
                        ))}
                      </div>
                    )}

                    {/* Screenshot */}
                    {fb.image_url && (
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 6 }}>Attached screenshot</div>
                        <img src={fb.image_url} alt="screenshot" style={{ maxWidth: 300, borderRadius: 8, border: '1px solid var(--gray-200)' }} />
                      </div>
                    )}

                    {/* Status timeline */}
                    <div style={{ display: 'flex', gap: 0, marginBottom: fb.admin_reply ? 14 : 0 }}>
                      {['pending', 'reviewed', 'resolved'].map((s, i) => {
                        const statuses = ['pending', 'reviewed', 'resolved']
                        const currentIdx = statuses.indexOf(fb.status)
                        const isDone = i <= currentIdx
                        return (
                          <div key={s} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                            <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                              {i > 0 && <div style={{ flex: 1, height: 2, background: isDone ? 'var(--brand)' : 'var(--gray-200)' }} />}
                              <div style={{
                                width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                                background: isDone ? 'var(--brand)' : 'var(--gray-200)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}>
                                {isDone
                                  ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                                  : <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--gray-400)' }} />
                                }
                              </div>
                              {i < 2 && <div style={{ flex: 1, height: 2, background: i < currentIdx ? 'var(--brand)' : 'var(--gray-200)' }} />}
                            </div>
                            <div style={{ fontSize: 10, color: isDone ? 'var(--brand)' : 'var(--gray-400)', fontWeight: isDone ? 600 : 400, textAlign: 'center', textTransform: 'capitalize' }}>
                              {s}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Admin reply */}
                    {fb.admin_reply && (
                      <div style={{ background: 'var(--brand-light)', borderRadius: 10, padding: '12px 14px', borderLeft: '3px solid var(--brand)' }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--brand)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                          Admin Reply
                        </div>
                        <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--gray-800)' }}>{fb.admin_reply}</div>
                      </div>
                    )}
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
