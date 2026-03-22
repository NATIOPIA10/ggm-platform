import React, { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { getProducts, getCategories, toggleFavorite } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import ProductCard from '../components/product/ProductCard'
import { Spinner, EmptyState } from '../components/shared'
import { CITIES } from '../lib/utils'

const PRICE_RANGES = [
  { label: 'Any Price',         value: '' },
  { label: 'Under 500 Birr',    value: '0-500' },
  { label: '500 - 2,000 Birr',  value: '500-2000' },
  { label: '2,000 - 10,000',    value: '2000-10000' },
  { label: '10,000 - 50,000',   value: '10000-50000' },
  { label: '50,000+',           value: '50000-99999999' },
]

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate  = useNavigate()
  const { profile } = useAuth()
  const { toast }   = useToast()

  const [products,   setProducts]   = useState([])
  const [categories, setCategories] = useState([])
  const [favs,       setFavs]       = useState(new Set())
  const [loading,    setLoading]    = useState(true)

  // Filter state derived from URL
  const q         = searchParams.get('q')        || ''
  const category  = searchParams.get('category') || ''
  const city      = searchParams.get('city')     || ''
  const price     = searchParams.get('price')    || ''
  const sort      = searchParams.get('sort')     || 'newest'

  useEffect(() => { getCategories().then(setCategories) }, [])
  useEffect(() => { loadProducts() }, [q, category, city, price, sort])

  async function loadProducts() {
    setLoading(true)
    try {
      let minPrice, maxPrice
      if (price) { [minPrice, maxPrice] = price.split('-').map(Number) }
      const data = await getProducts({ search: q, category, city, minPrice, maxPrice, sort, limit: 60 })
      setProducts(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  function setFilter(key, value) {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    setSearchParams(next)
  }

  async function handleFavorite(productId) {
    if (!profile) { navigate('/auth'); return }
    try {
      const added = await toggleFavorite(profile.id, productId)
      setFavs(prev => { const n = new Set(prev); added ? n.add(productId) : n.delete(productId); return n })
      toast(added ? 'Saved ❤️' : 'Removed from favorites', added ? 'success' : 'info')
    } catch { toast('Error', 'error') }
  }

  const hasFilters = q || category || city || price

  return (
    <div className="container" style={{ paddingTop: 16 }}>
      {/* Filter bar */}
      <div className="filter-bar">
        <select
          className="filter-select"
          value={category}
          onChange={e => setFilter('category', e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
        </select>

        <select
          className="filter-select"
          value={city}
          onChange={e => setFilter('city', e.target.value)}
        >
          <option value="">All Cities</option>
          {CITIES.map(c => <option key={c}>{c}</option>)}
        </select>

        <select
          className="filter-select"
          value={price}
          onChange={e => setFilter('price', e.target.value)}
        >
          {PRICE_RANGES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>

        <select
          className="filter-select"
          value={sort}
          onChange={e => setFilter('sort', e.target.value)}
        >
          <option value="newest">Newest First</option>
          <option value="price-asc">Price: Low → High</option>
          <option value="price-desc">Price: High → Low</option>
        </select>

        {hasFilters && (
          <button className="btn btn-ghost btn-sm" onClick={() => setSearchParams({})}>
            ✕ Clear filters
          </button>
        )}
      </div>

      {/* Results header */}
      <div style={{ marginBottom: 16, color: 'var(--gray-700)', fontSize: 14 }}>
        {loading ? 'Searching...' : `${products.length} product${products.length !== 1 ? 's' : ''} found${q ? ` for "${q}"` : ''}`}
      </div>

      {/* Results */}
      {loading ? (
        <Spinner />
      ) : products.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No products found"
          message="Try adjusting your filters or search for something else."
          action={<button className="btn btn-primary" onClick={() => setSearchParams({})}>Clear filters</button>}
        />
      ) : (
        <div className="product-grid">
          {products.map(p => (
            <ProductCard
              key={p.id}
              product={p}
              onFavorite={handleFavorite}
              isFav={favs.has(p.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
