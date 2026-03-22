import React from 'react'
import { useNavigate } from 'react-router-dom'
import { formatPrice, truncate } from '../../lib/utils'
import { StarDisplay } from '../shared'
import { IconMapPin, IconStore, IconHeartFilled, IconHeart, IconShield } from '../shared/Icons'

export default function ProductCard({ product, onFavorite, isFav }) {
  const navigate = useNavigate()
  const img = product.images?.[0]

  return (
    <div className="product-card" onClick={() => navigate(`/product/${product.id}`)}>
      <div className="product-img-wrap">
        {img && (img.startsWith('http') || img.startsWith('blob'))
          ? <img src={img} alt={product.title} />
          : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', background: 'var(--gray-100)' }}>
              <IconStore width={48} height={48} style={{ color: 'var(--gray-300)' }} />
            </div>
        }
        {onFavorite && (
          <button
            className="product-fav-btn"
            onClick={e => { e.stopPropagation(); onFavorite(product.id) }}
            title={isFav ? 'Remove from favorites' : 'Save to favorites'}
            style={{ color: isFav ? 'var(--red)' : 'var(--gray-500)' }}
          >
            {isFav
              ? <IconHeartFilled width={16} height={16} />
              : <IconHeart width={16} height={16} />
            }
          </button>
        )}
        {product.status === 'pending' && (
          <span style={{ position: 'absolute', top: 8, left: 8, background: 'var(--amber)', color: 'white', fontSize: 11, padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>
            Pending
          </span>
        )}
      </div>
      <div className="product-info">
        <div className="product-title">{product.title}</div>
        <div className="product-price">{formatPrice(product.price)}</div>
        <StarDisplay rating={product.avg_rating} count={product.review_count} />
        <div className="product-meta">
          <IconMapPin width={12} height={12} style={{ flexShrink: 0 }} />
          {product.city}
        </div>
        {product.organizations?.name && (
          <div className="product-meta" style={{ marginTop: 2 }}>
            <IconStore width={12} height={12} style={{ flexShrink: 0 }} />
            {truncate(product.organizations.name, 28)}
            {product.organizations?.verified && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 11, color: 'var(--brand)', marginLeft: 4 }}>
                <IconShield width={11} height={11} /> Verified
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}