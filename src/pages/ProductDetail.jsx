import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getProductById, toggleFavorite, isFavorited, createOrder, createReview, getOrCreateThread } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { formatPrice, formatDate, CITIES } from '../lib/utils'
import { Spinner, Modal, StarPicker, StarDisplay, ReviewCard, Avatar } from '../components/shared'

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { toast } = useToast()

  const [product,      setProduct]      = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [isFav,        setIsFav]        = useState(false)
  const [activeImg,    setActiveImg]    = useState(0)
  const [orderModal,   setOrderModal]   = useState(false)
  const [reviewModal,  setReviewModal]  = useState(false)
  const [submitting,   setSubmitting]   = useState(false)

  // Order form
  const [qty,      setQty]      = useState(1)
  const [address,  setAddress]  = useState('')
  const [phone,    setPhone]    = useState('')
  const [notes,    setNotes]    = useState('')

  // Review form
  const [rating,  setRating]  = useState(0)
  const [comment, setComment] = useState('')

  useEffect(() => {
    loadProduct()
  }, [id])

  async function loadProduct() {
    setLoading(true)
    try {
      const data = await getProductById(id)
      setProduct(data)
      if (profile) {
        const fav = await isFavorited(profile.id, id)
        setIsFav(fav)
      }
    } catch (e) {
      toast('Product not found', 'error')
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  async function handleFavorite() {
    if (!profile) { navigate('/auth'); return }
    try {
      const added = await toggleFavorite(profile.id, id)
      setIsFav(added)
      toast(added ? 'Saved to favorites ❤️' : 'Removed from favorites', added ? 'success' : 'info')
    } catch { toast('Error', 'error') }
  }

  async function handleMessage() {
    if (!profile) { navigate('/auth'); return }
    try {
      await getOrCreateThread({ userId: profile.id, sellerId: product.seller_id, productId: id })
      navigate('/customer/messages')
    } catch (e) {
      toast('Could not open chat', 'error')
    }
  }

  async function handleOrder() {
    if (!address.trim() || !phone.trim()) {
      toast('Please fill in delivery address and phone', 'error')
      return
    }
    setSubmitting(true)
    try {
      await createOrder({
        userId: profile.id,
        sellerId: product.seller_id,
        items: [{ product_id: id, quantity: qty, unit_price: product.price }],
        deliveryLocation: address,
        phone,
        notes,
      })
      // Auto-create thread
      await getOrCreateThread({ userId: profile.id, sellerId: product.seller_id, productId: id })
      setOrderModal(false)
      toast('Order placed successfully! 🎉', 'success')
      setQty(1); setAddress(''); setPhone(''); setNotes('')
    } catch (e) {
      toast(e.message || 'Order failed', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleReview() {
    if (!rating) { toast('Please select a star rating', 'error'); return }
    if (!comment.trim()) { toast('Please write a review', 'error'); return }
    setSubmitting(true)
    try {
      await createReview({ userId: profile.id, sellerId: product.seller_id, productId: id, rating, comment })
      setReviewModal(false)
      toast('Review posted! ⭐', 'success')
      setRating(0); setComment('')
      loadProduct()
    } catch (e) {
      toast(e.message || 'Error posting review', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Spinner />
  if (!product) return null

  const images = product.images?.length ? product.images : ['📦']
  const isCustomer = profile?.role === 'customer'
  const isSeller   = profile?.id === product.seller_id

  return (
    <div className="container">
      {/* Breadcrumb */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '20px 0 0', fontSize: 13, color: 'var(--gray-600)' }}>
        <span style={{ cursor: 'pointer', color: 'var(--brand)' }} onClick={() => navigate('/')}>Home</span>
        <span>/</span>
        <span style={{ cursor: 'pointer', color: 'var(--brand)' }} onClick={() => navigate('/search')}>Products</span>
        <span>/</span>
        <span>{product.title}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 32, padding: '24px 0 48px' }}>
        {/* Left column */}
        <div>
          {/* Images */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ width: '100%', aspectRatio: '4/3', background: 'var(--gray-100)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 10 }}>
              {images[activeImg]?.startsWith('http') || images[activeImg]?.startsWith('blob')
                ? <img src={images[activeImg]} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: 100 }}>{images[activeImg]}</span>
              }
            </div>
            {images.length > 1 && (
              <div style={{ display: 'flex', gap: 8 }}>
                {images.map((img, i) => (
                  <div
                    key={i}
                    onClick={() => setActiveImg(i)}
                    style={{
                      width: 72, height: 72, borderRadius: 8, overflow: 'hidden', cursor: 'pointer',
                      border: `2px solid ${i === activeImg ? 'var(--brand)' : 'var(--gray-200)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gray-100)',
                    }}
                  >
                    {img?.startsWith('http') ? <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 28 }}>{img}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="card card-pad" style={{ marginBottom: 24 }}>
            <h3 style={{ fontWeight: 700, marginBottom: 12 }}>Description</h3>
            <p style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--gray-700)' }}>{product.description}</p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 16 }}>
              <span className="badge badge-blue">{product.categories?.name}</span>
<span className="badge badge-gray" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
  {product.city}
</span>
<span className="badge badge-gray" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
  {product.views} views
</span>
            </div>
          </div>

          {/* Reviews */}
          <div className="card card-pad">
            <div className="flex-between" style={{ marginBottom: 16 }}>
              <div>
                <h3 style={{ fontWeight: 700 }}>Reviews</h3>
                {product.avg_rating && (
                  <div className="star-row" style={{ marginTop: 4 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--amber)" stroke="var(--amber)" strokeWidth="2">
  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
</svg>
                    <span style={{ fontWeight: 700, fontSize: 16 }}>{product.avg_rating}</span>
                    <span className="text-muted">({product.review_count} review{product.review_count !== 1 ? 's' : ''})</span>
                  </div>
                )}
              </div>
              {isCustomer && (
                <button className="btn btn-outline btn-sm" onClick={() => setReviewModal(true)}>
                  ✍️ Write Review
                </button>
              )}
            </div>
            {product.reviews?.length === 0 ? (
              <p className="text-muted text-sm">No reviews yet. Be the first to review!</p>
            ) : (
              product.reviews?.map(r => <ReviewCard key={r.id} review={r} />)
            )}
          </div>
        </div>

        {/* Right column - sticky */}
        <div style={{ position: 'sticky', top: 'calc(var(--nav-h) + 16px)', alignSelf: 'start' }}>
          <div className="card card-pad" style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 30, fontWeight: 700, color: 'var(--brand)', marginBottom: 6 }}>
              {formatPrice(product.price)}
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{product.title}</h1>
            <StarDisplay rating={product.avg_rating} count={product.review_count} />

            {product.status !== 'approved' && (
              <div className="badge badge-amber" style={{ marginTop: 8 }}>
                Status: {product.status}
              </div>
            )}

            <div style={{ margin: '16px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {isCustomer && (
                <>
                  <button className="btn btn-primary btn-full" onClick={() => setOrderModal(true)}>
                    🛒 Place Order
                  </button>
                  <button className="btn btn-outline btn-full" onClick={handleMessage}>
                    💬 Message Seller
                  </button>
                  <button className="btn btn-ghost btn-full" onClick={handleFavorite}>
                    {isFav ? '❤️ Saved' : '🤍 Save to Favorites'}
                  </button>
                </>
              )}
              {!profile && (
                <button className="btn btn-primary btn-full" onClick={() => navigate('/auth')}>
                  Sign in to Order
                </button>
              )}
              {isSeller && (
                <div className="badge badge-blue" style={{ textAlign: 'center', padding: '10px' }}>
                  This is your listing
                </div>
              )}
            </div>
          </div>

          {/* Seller Card */}
          <div className="card card-pad">
            <h3 style={{ fontWeight: 700, marginBottom: 12, fontSize: 14 }}>About the Seller</h3>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px', background: 'var(--gray-50)', borderRadius: 'var(--radius-lg)', marginBottom: 12 }}>
              <Avatar name={product.users?.name || product.organizations?.name} size="md" src={product.users?.avatar_url} />
              <div>
                <div style={{ fontWeight: 600 }}>{product.organizations?.name || product.users?.name}</div>
                {product.organizations?.verified && (
  <div style={{ fontSize: 12, color: '#1e8e3e', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600, marginTop: 4 }}>
    <svg width="14" height="14" viewBox="0 0 24 24">
      <path fill="#1e8e3e" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
    </svg>
    Verified Seller
  </div>
)}
                <div className="text-muted text-sm">📍 {product.users?.city || product.city}</div>
              </div>
            </div>
            {isCustomer && (
              <button className="btn btn-ghost btn-full btn-sm" onClick={handleMessage}>
                Contact Seller
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Order Modal */}
      <Modal
        open={orderModal}
        onClose={() => setOrderModal(false)}
        title="Place Order"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setOrderModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleOrder} disabled={submitting}>
              {submitting ? 'Placing...' : 'Confirm Order'}
            </button>
          </>
        }
      >
        <div style={{ background: 'var(--gray-50)', borderRadius: 'var(--radius-lg)', padding: 14, marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 8, overflow: 'hidden', background: 'var(--gray-200)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
  {images[0]?.startsWith('http')
    ? <img src={images[0]} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    : <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9aa0a6" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>
  }
</div>
          <div>
            <div style={{ fontWeight: 600 }}>{product.title}</div>
            <div style={{ color: 'var(--brand)', fontWeight: 700 }}>{formatPrice(product.price)}</div>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Quantity</label>
          <input className="form-input" type="number" min="1" value={qty} onChange={e => setQty(+e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Delivery Address *</label>
          <input className="form-input" value={address} onChange={e => setAddress(e.target.value)} placeholder="Enter your full delivery address" />
        </div>
        <div className="form-group">
          <label className="form-label">Phone Number *</label>
          <input className="form-input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+251 91 234 5678" />
        </div>
        <div className="form-group">
          <label className="form-label">Notes (optional)</label>
          <textarea className="form-input" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any special instructions..." />
        </div>
        <div style={{ background: 'var(--brand-light)', borderRadius: 'var(--radius)', padding: 12, fontWeight: 700, color: 'var(--brand)' }}>
          Total: {formatPrice(product.price * qty)}
        </div>
      </Modal>

      {/* Review Modal */}
      <Modal
        open={reviewModal}
        onClose={() => setReviewModal(false)}
        title="Write a Review"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setReviewModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleReview} disabled={submitting}>
              {submitting ? 'Posting...' : 'Post Review'}
            </button>
          </>
        }
      >
        <p style={{ fontWeight: 600, marginBottom: 16 }}>{product.title}</p>
        <div className="form-group">
          <label className="form-label">Your Rating</label>
          <StarPicker value={rating} onChange={setRating} />
        </div>
        <div className="form-group">
          <label className="form-label">Your Review</label>
          <textarea className="form-input" rows={4} value={comment} onChange={e => setComment(e.target.value)} placeholder="Share your experience with this product..." />
        </div>
      </Modal>
    </div>
  )
}
