import React, { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { Avatar } from '../shared'
import { IconSearch, IconLogOut, IconDashboard } from '../shared/Icons'

export default function Navbar() {
  const { profile, signOut } = useAuth()
  const { toast }  = useToast()
  const navigate   = useNavigate()
  const [query, setQuery]       = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileSearch, setMobileSearch] = useState(false)
  const menuRef  = useRef()
  const searchRef = useRef()

  useEffect(() => {
    const handler = e => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (query.trim()) { navigate(`/search?q=${encodeURIComponent(query.trim())}`); setMobileSearch(false) }
  }

  const handleSignOut = async () => {
    await signOut()
    toast('Signed out', 'success')
    navigate('/')
    setMenuOpen(false)
  }

  const dashLink = () => {
    if (!profile) return '/auth'
    if (profile.role === 'admin')  return '/admin'
    if (profile.role === 'seller') return '/seller'
    return '/customer'
  }

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      height: 'var(--nav-h)', background: 'var(--white)',
      borderBottom: '1px solid var(--gray-200)',
      display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12,
    }}>
      {/* Logo */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0 }}>
        <svg width="26" height="26" viewBox="0 0 28 28">
          <rect width="12" height="12" fill="#4285F4" rx="2"/>
          <rect x="16" width="12" height="12" fill="#EA4335" rx="2"/>
          <rect y="16" width="12" height="12" fill="#34A853" rx="2"/>
          <rect x="16" y="16" width="12" height="12" fill="#FBBC05" rx="2"/>
        </svg>
        <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--gray-900)' }}>
          G<span style={{ color: 'var(--brand)' }}>GM</span>
        </span>
      </Link>

      {/* Desktop search */}
      <form onSubmit={handleSearch} style={{ flex: 1, maxWidth: 600, margin: '0 auto' }} className="nav-search-form">
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--gray-100)', borderRadius: 28,
          padding: '8px 16px', border: '1px solid transparent', transition: 'all .2s',
        }}
          onFocus={e => { e.currentTarget.style.background='white'; e.currentTarget.style.borderColor='var(--gray-300)' }}
          onBlur={e => { e.currentTarget.style.background='var(--gray-100)'; e.currentTarget.style.borderColor='transparent' }}
        >
          <IconSearch width={18} height={18} style={{ color: 'var(--gray-500)', flexShrink: 0 }} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search products, sellers, categories"
            style={{ flex: 1, border: 'none', background: 'none', outline: 'none', fontSize: 15, color: 'var(--gray-900)', fontFamily: 'var(--font)' }}
          />
        </div>
      </form>

      {/* Mobile search button */}
      <button
        className="mobile-search-btn"
        onClick={() => setMobileSearch(v => !v)}
        style={{ display: 'none', background: 'none', border: 'none', padding: 8, cursor: 'pointer', color: 'var(--gray-700)' }}
      >
        <IconSearch width={22} height={22} />
      </button>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto', flexShrink: 0 }}>
        {profile ? (
          <>
            <Link to={dashLink()} className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <IconDashboard width={14} height={14} />
              <span className="hide-mobile">Dashboard</span>
            </Link>
            <div style={{ position: 'relative' }} ref={menuRef}>
              <div onClick={() => setMenuOpen(v => !v)} style={{ cursor: 'pointer' }}>
                <Avatar name={profile.name} size="sm" src={profile.avatar_url} />
              </div>
              {menuOpen && (
                <div style={{
                  position: 'absolute', right: 0, top: '100%', marginTop: 8,
                  background: 'white', border: '1px solid var(--gray-200)',
                  borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)',
                  minWidth: 200, overflow: 'hidden', zIndex: 200,
                }}>
                  <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--gray-100)' }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{profile.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--gray-600)' }}>{profile.email}</div>
                    <span className={`badge badge-${profile.role === 'admin' ? 'red' : profile.role === 'seller' ? 'blue' : 'gray'} mt-8`} style={{ marginTop: 6, display: 'inline-flex' }}>
                      {profile.role}
                    </span>
                  </div>
                  <Link to={dashLink()} onClick={() => setMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', fontSize: 14, color: 'var(--gray-800)', textDecoration: 'none' }}>
                    <IconDashboard width={15} height={15} /> Dashboard
                  </Link>
                  <button onClick={handleSignOut} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', padding: '11px 16px', fontSize: 14, color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font)' }}>
                    <IconLogOut width={15} height={15} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <Link to="/auth" className="btn btn-ghost btn-sm">Sign In</Link>
            <Link to="/auth?tab=register" className="btn btn-primary btn-sm">Register</Link>
          </>
        )}
      </div>

      {/* Mobile search overlay */}
      {mobileSearch && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          background: 'white', padding: '12px 16px',
          borderBottom: '1px solid var(--gray-200)', zIndex: 99,
          boxShadow: 'var(--shadow-md)',
        }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8 }}>
            <input
              ref={searchRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search products..."
              autoFocus
              style={{ flex: 1, padding: '10px 14px', border: '1px solid var(--gray-300)', borderRadius: 'var(--radius)', fontSize: 15, outline: 'none', fontFamily: 'var(--font)' }}
            />
            <button type="submit" className="btn btn-primary">Search</button>
          </form>
        </div>
      )}
    </nav>
  )
}
