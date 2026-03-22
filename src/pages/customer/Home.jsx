import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import ProductCard from '../../components/product/ProductCard'
import { Spinner } from '../../components/shared'
import { formatPrice } from '../../lib/utils'

export default function CustomerHome() {
  const { profile }   = useAuth()
  const { toast }     = useToast()
  const navigate      = useNavigate()

  const [categories, setCategories] = useState([])
  const [products,   setProducts]   = useState([])
  const [favSet,     setFavSet]     = useState(new Set())
  const [loading,    setLoading]    = useState(true)
  const [search,     setSearch]     = useState('')
  const [activeCategory, setActiveCategory] = useState('')

  useEffect(() => { loadAll() }, [])
  useEffect(() => { if (profile?.id) loadFavs() }, [profile?.id])

  async function loadAll() {
    setLoading(true)
    try {
      const [catsRes, prodsRes] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase
          .from('products')
          .select('*, categories(name,icon), organizations(name,verified), reviews(rating)')
          .eq('status', 'approved')
          .order('created_at', { ascending: false })
          .limit(60),
      ])
      setCategories(catsRes.data || [])
      setProducts((prodsRes.data || []).map(p => ({
        ...p,
        avg_rating:   p.reviews?.length ? +(p.reviews.reduce((s, r) => s + r.rating, 0) / p.reviews.length).toFixed(1) : null,
        review_count: p.reviews?.length || 0,
      })))
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function loadFavs() {
    const { data } = await supabase
      .from('favorites').select('product_id').eq('user_id', profile.id)
    setFavSet(new Set((data || []).map(f => f.product_id)))
  }

  async function handleFavorite(productId) {
    const isFav = favSet.has(productId)
    setFavSet(prev => { const n = new Set(prev); isFav ? n.delete(productId) : n.add(productId); return n })
    try {
      if (isFav) {
        await supabase.from('favorites').delete().eq('user_id', profile.id).eq('product_id', productId)
        toast('Removed from favorites', 'info')
      } else {
        await supabase.from('favorites').insert({ user_id: profile.id, product_id: productId })
        toast('Saved to favorites', 'success')
      }
    } catch {
      setFavSet(prev => { const n = new Set(prev); isFav ? n.add(productId) : n.delete(productId); return n })
      toast('Something went wrong', 'error')
    }
  }

  // Filter products
  const filtered = products.filter(p => {
    const matchSearch   = !search || p.title.toLowerCase().includes(search.toLowerCase())
    const matchCategory = !activeCategory || p.category_id === activeCategory
    return matchSearch && matchCategory
  })

  const nearby   = filtered.filter(p => p.city === (profile?.city || 'Addis Ababa')).slice(0, 8)
  const trending = [...filtered].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 8)
  const all      = filtered.slice(0, 40)

  return (
    <div>
      {/* Welcome banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%)',
        borderRadius: 'var(--radius-lg)', padding: '28px 28px', marginBottom: 24, color: 'white'
      }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
          Welcome back, {profile?.name?.split(' ')[0]}!
        </h2>
        <p style={{ opacity: .85, marginBottom: 20, fontSize: 14 }}>
          Discover products from verified sellers near you
        </p>
        <div style={{ display: 'flex', background: 'white', borderRadius: 28, overflow: 'hidden', maxWidth: 500 }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products..."
            style={{ flex: 1, padding: '11px 18px', border: 'none', outline: 'none', fontSize: 14, fontFamily: 'var(--font)', color: 'var(--gray-900)' }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{ padding: '0 14px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-500)', fontSize: 18 }}
            >x</button>
          )}
        </div>
      </div>

      {/* Categories */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12 }}>Browse Categories</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveCategory('')}
            style={{
              padding: '7px 16px', borderRadius: 20, border: '1.5px solid',
              borderColor: !activeCategory ? 'var(--brand)' : 'var(--gray-200)',
              background: !activeCategory ? 'var(--brand-light)' : 'white',
              color: !activeCategory ? 'var(--brand)' : 'var(--gray-700)',
              fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font)',
            }}
          >All</button>
          {categories.map(c => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(activeCategory === c.id ? '' : c.id)}
              style={{
                padding: '7px 16px', borderRadius: 20, border: '1.5px solid',
                borderColor: activeCategory === c.id ? 'var(--brand)' : 'var(--gray-200)',
                background: activeCategory === c.id ? 'var(--brand-light)' : 'white',
                color: activeCategory === c.id ? 'var(--brand)' : 'var(--gray-700)',
                fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font)',
              }}
            >{c.name}</button>
          ))}
        </div>
      </div>

      {loading ? <Spinner /> : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--gray-500)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>No products found</div>
          <p>Try a different search or category</p>
          <button className="btn btn-ghost mt-16" onClick={() => { setSearch(''); setActiveCategory('') }}>
            Clear filters
          </button>
        </div>
      ) : (
        <>
          {/* Near you */}
          {!search && !activeCategory && nearby.length > 0 && (
            <Section title={`Near You in ${profile?.city || 'Addis Ababa'}`} products={nearby} favSet={favSet} onFav={handleFavorite} navigate={navigate} />
          )}

          {/* Trending */}
          {!search && !activeCategory && trending.length > 0 && (
            <Section title="Trending Now" products={trending} favSet={favSet} onFav={handleFavorite} navigate={navigate} />
          )}

          {/* All / Search results */}
          <Section
            title={search ? `Results for "${search}"` : activeCategory ? categories.find(c => c.id === activeCategory)?.name || 'Products' : 'All Products'}
            products={all}
            favSet={favSet}
            onFav={handleFavorite}
            navigate={navigate}
          />
        </>
      )}
    </div>
  )
}

function Section({ title, products, favSet, onFav, navigate }) {
  if (!products.length) return null
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 14, color: 'var(--gray-900)' }}>{title}</div>
      <div className="product-grid">
        {products.map(p => (
          <ProductCard key={p.id} product={p} onFavorite={onFav} isFav={favSet.has(p.id)} />
        ))}
      </div>
    </div>
  )
}
