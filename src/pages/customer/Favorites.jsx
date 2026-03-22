import React, { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { getFavorites, toggleFavorite } from '../../lib/api'
import { Spinner, EmptyState } from '../../components/shared'
import { IconHeart } from '../../components/shared/Icons'
import ProductCard from '../../components/product/ProductCard'
import { useNavigate } from 'react-router-dom'

export default function CustomerFavorites() {
  const { profile }   = useAuth()
  const { toast }     = useToast()
  const navigate      = useNavigate()
  const [products, setProducts] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    if (profile) load()
  }, [profile])

  async function load() {
    try {
      const data = await getFavorites(profile.id)
      setProducts(data)
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleFavorite(productId) {
    try {
      const added = await toggleFavorite(profile.id, productId)
      if (!added) {
        setProducts(prev => prev.filter(p => p.id !== productId))
        toast('Removed from favorites', 'info')
      }
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  if (loading) return <Spinner />

  return (
    <div>
      <div className="page-header">
        <h1>Saved Products</h1>
        <p>{products.length} saved item{products.length !== 1 ? 's' : ''}</p>
      </div>

      {!products.length ? (
        <EmptyState
          icon={<IconHeart width={48} height={48} />}
          title="No saved products"
          message="Browse products and tap the heart to save them here"
          action={<button className="btn btn-primary" onClick={() => navigate('/search')}>Browse Products</button>}
        />
      ) : (
        <div className="product-grid">
          {products.map(p => (
            <ProductCard
              key={p.id}
              product={p}
              isFav={true}
              onFavorite={handleFavorite}
            />
          ))}
        </div>
      )}
    </div>
  )
}
