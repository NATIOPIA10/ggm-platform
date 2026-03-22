import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getUserReviews } from '../../lib/api'
import { formatDate, formatPrice } from '../../lib/utils'
import { Spinner, EmptyState } from '../../components/shared'
import { IconStar } from '../../components/shared/Icons'

export default function CustomerReviews() {
  const { profile } = useAuth()
  const navigate    = useNavigate()
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile) load()
  }, [profile])

  async function load() {
    try {
      const data = await getUserReviews(profile.id)
      setReviews(data)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Spinner />

  return (
    <div>
      <div className="page-header">
        <h1>My Reviews</h1>
        <p>{reviews.length} review{reviews.length !== 1 ? 's' : ''} posted</p>
      </div>

      {!reviews.length ? (
        <EmptyState
          icon={<IconStar width={48} height={48} />}
          title="No reviews yet"
          message="Order products and share your experience"
          action={<button className="btn btn-primary" onClick={() => navigate('/search')}>Browse Products</button>}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {reviews.map(r => {
            const product = r.products
            const img = product?.images?.[0]
            return (
              <div key={r.id} className="card card-pad">
                <div className="flex-between" style={{ marginBottom: 10 }}>
                  <div
                    className="flex-align gap-12"
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/product/${r.product_id}`)}
                  >
                    <div style={{ width: 48, height: 48, background: 'var(--gray-100)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, overflow: 'hidden', flexShrink: 0 }}>
                      {img && img.startsWith('http') ? <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--gray-400)" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--brand)', fontSize: 14 }}>{product?.title || 'Product'}</div>
                      <div className="text-muted text-xs mt-4">{formatDate(r.created_at)}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 2 }}>
  {[1,2,3,4,5].map(n => (
    <svg key={n} width="16" height="16" viewBox="0 0 24 24"
      fill={n <= r.rating ? 'var(--amber)' : 'var(--gray-200)'}
      stroke={n <= r.rating ? 'var(--amber)' : 'var(--gray-200)'}
      strokeWidth="2">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ))}
</div>
                </div>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--gray-700)' }}>{r.comment}</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
