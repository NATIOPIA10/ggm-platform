import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { CITIES } from '../lib/utils'
import { IconUser, IconStore } from '../components/shared/Icons'

export default function Auth() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { signIn, signUp, profile, loading } = useAuth()
  const { toast } = useToast()

  const [tab,         setTab]         = useState(searchParams.get('tab') === 'register' ? 'register' : 'login')
  const [role,        setRole]        = useState('customer')
  const [submitting,  setSubmitting]  = useState(false)
  const [errors,      setErrors]      = useState({})

  const [loginEmail,    setLoginEmail]    = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  const [regName,     setRegName]     = useState('')
  const [regEmail,    setRegEmail]    = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regCity,     setRegCity]     = useState('Addis Ababa')
  const [orgName,     setOrgName]     = useState('')
  const [orgPhone,    setOrgPhone]    = useState('')

  // Redirect as soon as profile is available
  useEffect(() => {
    if (!loading && profile) {
      if (profile.role === 'admin')       navigate('/admin',    { replace: true })
      else if (profile.role === 'seller')  navigate('/seller',   { replace: true })
      else                                 navigate('/customer', { replace: true })
    }
  }, [profile, loading])

  async function handleLogin(e) {
    e.preventDefault()
    setErrors({})
    if (!loginEmail)    { setErrors({ email: 'Email is required' }); return }
    if (!loginPassword) { setErrors({ password: 'Password is required' }); return }
    setSubmitting(true)
    try {
      await signIn({ email: loginEmail, password: loginPassword })
      toast('Welcome back!', 'success')
      // useEffect above will redirect once profile loads
    } catch (err) {
      toast(err.message || 'Invalid email or password', 'error')
      setSubmitting(false)
    }
  }

  async function handleRegister(e) {
    e.preventDefault()
    setErrors({})
    const errs = {}
    if (!regName.trim())        errs.name     = 'Full name is required'
    if (!regEmail.trim())       errs.email    = 'Email is required'
    if (regPassword.length < 6) errs.password = 'Password must be at least 6 characters'
    if (role === 'seller' && !orgName.trim()) errs.orgName = 'Shop name is required'
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSubmitting(true)
    try {
      await signUp({ email: regEmail, password: regPassword, name: regName, city: regCity, role, orgName, orgPhone })
      toast(role === 'seller' ? 'Account created! Awaiting admin approval.' : `Welcome to GGM, ${regName}! `, 'success')
      // useEffect above will redirect once profile loads
    } catch (err) {
      toast(err.message || 'Registration failed', 'error')
      setSubmitting(false)
    }
  }

  // While loading session on initial page visit, show nothing to avoid flash
  if (loading) return null

  return (
    <div style={{ minHeight: 'calc(100vh - var(--nav-h))', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gray-50)', padding: 24 }}>
      <div style={{ background: 'white', borderRadius: 'var(--radius-xl)', padding: '40px 36px', width: '100%', maxWidth: 420, boxShadow: 'var(--shadow-lg)' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <svg width="52" height="52" viewBox="0 0 28 28">
            <rect width="12" height="12" fill="#4285F4" rx="2"/>
            <rect x="16" width="12" height="12" fill="#EA4335" rx="2"/>
            <rect y="16" width="12" height="12" fill="#34A853" rx="2"/>
            <rect x="16" y="16" width="12" height="12" fill="#FBBC05" rx="2"/>
          </svg>
          <div style={{ fontWeight: 700, fontSize: 22, marginTop: 10 }}>Google General Market</div>
          <div style={{ fontSize: 14, color: 'var(--gray-600)', marginTop: 4 }}>
            {tab === 'login' ? 'Sign in to your account' : 'Create your account'}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', background: 'var(--gray-100)', borderRadius: 10, padding: 4, marginBottom: 24 }}>
          {['login', 'register'].map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setErrors({}) }}
              style={{
                flex: 1, padding: '8px', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font)', fontSize: 14, fontWeight: 500, transition: 'all .15s',
                background: tab === t ? 'white' : 'transparent',
                color: tab === t ? 'var(--brand)' : 'var(--gray-600)',
                boxShadow: tab === t ? 'var(--shadow-sm)' : 'none',
              }}
            >
              {t === 'login' ? 'Sign In' : 'Register'}
            </button>
          ))}
        </div>

        {/* LOGIN */}
        {tab === 'login' && (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input className={`form-input ${errors.email ? 'error' : ''}`} type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="you@example.com" autoFocus />
              {errors.email && <div className="form-error">{errors.email}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className={`form-input ${errors.password ? 'error' : ''}`} type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="••••••••" />
              {errors.password && <div className="form-error">{errors.password}</div>}
            </div>
            <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: 8 }} disabled={submitting}>
              {submitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        )}

        {/* REGISTER */}
        {tab === 'register' && (
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label className="form-label">I want to</label>
              <div className="role-grid">
                <div className={`role-option ${role === 'customer' ? 'active' : ''}`} onClick={() => setRole('customer')}>
                  <div className="role-option-icon"><IconUser width={28} height={28} /></div>
                  <div className="role-option-name">Buy Products</div>
                  <div className="role-option-desc">Browse & order from sellers</div>
                </div>
                <div className={`role-option ${role === 'seller' ? 'active' : ''}`} onClick={() => setRole('seller')}>
                  <div className="role-option-icon"><IconStore width={28} height={28} /></div>
                  <div className="role-option-name">Sell Products</div>
                  <div className="role-option-desc">List & manage your store</div>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input className={`form-input ${errors.name ? 'error' : ''}`} value={regName} onChange={e => setRegName(e.target.value)} placeholder="Dawit Bekele" />
              {errors.name && <div className="form-error">{errors.name}</div>}
            </div>

            {role === 'seller' && (
              <>
                <div className="form-group">
                  <label className="form-label">Shop / Organization Name *</label>
                  <input className={`form-input ${errors.orgName ? 'error' : ''}`} value={orgName} onChange={e => setOrgName(e.target.value)} placeholder="Bekele Electronics" />
                  {errors.orgName && <div className="form-error">{errors.orgName}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Business Phone</label>
                  <input className="form-input" value={orgPhone} onChange={e => setOrgPhone(e.target.value)} placeholder="+251 91 234 5678" />
                </div>
              </>
            )}

            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input className={`form-input ${errors.email ? 'error' : ''}`} type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} placeholder="you@example.com" />
              {errors.email && <div className="form-error">{errors.email}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">City</label>
              <select className="form-input" value={regCity} onChange={e => setRegCity(e.target.value)}>
                {CITIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Password *</label>
              <input className={`form-input ${errors.password ? 'error' : ''}`} type="password" value={regPassword} onChange={e => setRegPassword(e.target.value)} placeholder="Min. 6 characters" />
              {errors.password && <div className="form-error">{errors.password}</div>}
            </div>

            {role === 'seller' && (
              <div style={{ background: 'var(--amber-light)', borderRadius: 'var(--radius)', padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#7d4e00' }}>
                 Seller accounts require admin approval before you can list products.
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-full" disabled={submitting}>
              {submitting ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        )}

        <div className="divider">or</div>
        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--gray-600)' }}>
          {tab === 'login'
            ? <span>Don't have an account? <button onClick={() => setTab('register')} style={{ background: 'none', border: 'none', color: 'var(--brand)', cursor: 'pointer', fontWeight: 500 }}>Register</button></span>
            : <span>Already have an account? <button onClick={() => setTab('login')} style={{ background: 'none', border: 'none', color: 'var(--brand)', cursor: 'pointer', fontWeight: 500 }}>Sign In</button></span>
          }
        </p>
      </div>
    </div>
  )
}