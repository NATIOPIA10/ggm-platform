import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getCached, setCached } from '../lib/cache'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import ProductCard from '../components/product/ProductCard'
import { Spinner } from '../components/shared'

export default function Home() {
  const navigate    = useNavigate()
  const { profile } = useAuth()
  const { toast }   = useToast()

  const [categories, setCategories] = useState([])
  const [products,   setProducts]   = useState([])
  const [favSet,     setFavSet]     = useState(new Set())
  const [loading,    setLoading]    = useState(true)
  const [heroQuery,  setHeroQuery]  = useState('')

  // Load products + categories once on mount
  useEffect(() => { loadAll() }, [])

  // Load favorites only when profile is known
  useEffect(() => {
    if (profile?.id) loadFavs()
    else setFavSet(new Set())
  }, [profile?.id])

  async function loadAll() {
    setLoading(true)
    try {
      const cached = getCached('home_data')
      if (cached) {
        setCategories(cached.categories)
        setProducts(cached.products)
        setLoading(false)
        return
      }

      // One parallel fetch for both
      const [catsRes, prodsRes] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase
          .from('products')
          .select('*, categories(name,icon), organizations(name,verified), reviews(rating)')
          .eq('status', 'approved')
          .order('created_at', { ascending: false })
          .limit(40),
      ])

      const enriched = (prodsRes.data || []).map(p => ({
        ...p,
        avg_rating:   p.reviews?.length ? +(p.reviews.reduce((s, r) => s + r.rating, 0) / p.reviews.length).toFixed(1) : null,
        review_count: p.reviews?.length || 0,
      }))

      const result = { categories: catsRes.data || [], products: enriched }
      setCached('home_data', result, 10_000) // cache 1 min
      setCategories(result.categories)
      setProducts(result.products)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function loadFavs() {
    const cacheKey = `favs_${profile.id}`
    const cached = getCached(cacheKey)
    if (cached) { setFavSet(new Set(cached)); return }
    const { data } = await supabase
      .from('favorites').select('product_id').eq('user_id', profile.id)
    const ids = (data || []).map(f => f.product_id)
    setCached(cacheKey, ids, 30_000)
    setFavSet(new Set(ids))
  }

  async function handleFavorite(productId) {
    if (!profile) { navigate('/auth'); return }
    const isFav = favSet.has(productId)
    // Optimistic
    setFavSet(prev => { const n = new Set(prev); isFav ? n.delete(productId) : n.add(productId); return n })
    try {
      if (isFav) {
        await supabase.from('favorites').delete().eq('user_id', profile.id).eq('product_id', productId)
        toast('Removed from favorites', 'info')
      } else {
        await supabase.from('favorites').insert({ user_id: profile.id, product_id: productId })
        toast('Saved [h]', 'success')
      }
      setCached(`favs_${profile.id}`, null, 0)
    } catch {
      // Revert
      setFavSet(prev => { const n = new Set(prev); isFav ? n.add(productId) : n.delete(productId); return n })
      toast('Something went wrong', 'error')
    }
  }

  function handleHeroSearch(e) {
    e.preventDefault()
    if (heroQuery.trim()) navigate(`/search?q=${encodeURIComponent(heroQuery.trim())}`)
  }

  const city     = profile?.city || 'Addis Ababa'
  const nearby   = products.filter(p => p.city === city).slice(0, 8)
  const trending = [...products].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 8)
  const featured = products.slice(0, 8)

  return (
    <div>
      {/* Hero */}
      <div className="hero">
        <div className="container">
          <h1>Find Everything You Need</h1>
          <p>Browse thousands of products from verified local sellers across Ethiopia</p>
          <form onSubmit={handleHeroSearch} className="hero-search">
            <input value={heroQuery} onChange={e => setHeroQuery(e.target.value)} placeholder="What are you looking for?" />
            <button type="submit" className="hero-search-btn">Search</button>
          </form>
        </div>
      </div>

      <div className="container">
        {/* Categories */}
        <div className="section">
          <div className="section-header">
            <div className="section-title">Browse Categories</div>
          </div>
          <div className="cat-row">
            {categories.map(c => (
              <div key={c.id} className="cat-chip" onClick={() => navigate(`/search?category=${c.id}`)}>
                <span className="cat-chip-name">{c.name}</span>
              </div>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '60px 0' }}><Spinner /></div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🛍️</div>
            <h3 style={{ fontSize: 20, fontWeight: 600, color: 'var(--gray-800)', marginBottom: 8 }}>No products yet</h3>
            <p style={{ color: 'var(--gray-600)', marginBottom: 20 }}>Be the first to list a product!</p>
            <button className="btn btn-primary" onClick={() => navigate('/auth?tab=register')}>Start Selling</button>
          </div>
        ) : (
          <>
            {nearby.length > 0 && (
              <Section title={` Near You in ${city}`} products={nearby} favSet={favSet} onFav={handleFavorite} navigate={navigate} />
            )}
            <Section title=" Trending Now"      products={trending} favSet={favSet} onFav={handleFavorite} navigate={navigate} />
            <Section title=" Featured Products" products={featured} favSet={favSet} onFav={handleFavorite} navigate={navigate} />
          </>
        )}
      </div>
    </div>
  )
}

function Section({ title, products, favSet, onFav, navigate }) {
  if (!products.length) return null
  return (
    <div className="section">
      <div className="section-header">
        <div className="section-title">{title}</div>
        <span className="section-link" onClick={() => navigate('/search')}>View all →</span>
      </div>
      <div className="product-grid">
        {products.map(p => (
          <ProductCard key={p.id} product={p} onFavorite={onFav} isFav={favSet.has(p.id)} />
        ))}
      </div>
    </div>
  )
}