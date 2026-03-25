import React, { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getReviewsBySeller } from '../../lib/api'
import { formatDate } from '../../lib/utils'
import { Spinner, EmptyState, Avatar } from '../../components/shared'
import { IconStar } from '../../components/shared/Icons'
import { useNavigate } from 'react-router-dom'

export default function SellerReviews() {
  const { profile }  = useAuth()
  const navigate     = useNavigate()
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile) load()
  }, [profile])

  async function load() {
    try {
      const data = await getReviewsBySeller(profile.id)
      setReviews(data)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Spinner />

  const avg = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null

  const dist = [5,4,3,2,1].map(n => ({
    n, count: reviews.filter(r => r.rating === n).length,
    pct: reviews.length ? Math.round(reviews.filter(r => r.rating === n).length / reviews.length * 100) : 0,
  }))

  return (
    <div>
      <div className="page-header">
        <h1>Reviews & Ratings</h1>
        <p>{reviews.length} reviews received</p>
      </div>

      {!reviews.length ? (
        <EmptyState icon={<IconStar width={48} height={48} />} title="No reviews yet" message="Reviews will appear once customers rate your products" />
      ) : (
        <>
          {/* Summary card */}
          <div className="card card-pad mb-24" style={{ display: 'flex', gap: 32, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 56, fontWeight: 700, color: 'var(--gray-900)' }}>{avg}</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 2, color: 'var(--amber)', fontSize: 22 }}>
                {[1,2,3,4,5].map(n => <span key={n}>{n <= Math.round(avg) ? 'â˜...' : 'â˜†'}</span>)}
              </div>
              <div className="text-muted text-sm mt-4">{reviews.length} reviews</div>
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              {dist.map(({ n, count, pct }) => (
                <div key={n} className="flex-align gap-8" style={{ marginBottom: 6 }}>
                  <span style={{ width: 16, fontSize: 13, textAlign: 'right', flexShrink: 0 }}>{n}</span>
                  <span style={{ color: 'var(--amber)', flexShrink: 0 }}>â˜...</span>
                  <div style={{ flex: 1, height: 8, background: 'var(--gray-200)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: 'var(--amber)', borderRadius: 4, transition: 'width .4s' }} />
                  </div>
                  <span className="text-muted text-xs" style={{ width: 28, textAlign: 'right', flexShrink: 0 }}>{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Review list */}
          <div className="card">
            {reviews.map((r, i) => (
              <div key={r.id} style={{ padding: '16px 20px', borderBottom: i < reviews.length - 1 ? '1px solid var(--gray-100)' : 'none' }}>
                <div className="flex-between" style={{ marginBottom: 10 }}>
                  <div className="flex-align gap-10">
                    <Avatar name={r.users?.name} size="sm"  />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{r.users?.name}</div>
                      <div
                        className="text-xs text-muted"
                        style={{ cursor: 'pointer', color: 'var(--brand)' }}
                        onClick={() => navigate(`/product/${r.product_id}`)}
                      >
                        [~] {r.products?.title}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 1 }}>
                      {[1,2,3,4,5].map(n => (
                        <span key={n} style={{ fontSize: 16, color: n <= r.rating ? 'var(--amber)' : 'var(--gray-200)' }}>â˜...</span>
                      ))}
                    </div>
                    <div className="text-xs text-muted mt-4">{formatDate(r.created_at)}</div>
                  </div>
                </div>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--gray-700)' }}>{r.comment}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
