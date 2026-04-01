import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { supabase } from '../lib/supabase'
import { CITIES } from '../lib/utils'
import { IconUser, IconStore } from '../components/shared/Icons'

export default function RoleSelect() {
  const navigate           = useNavigate()
  const { profile, updateProfile, refetchProfile } = useAuth()
  const { toast }          = useToast()

  const [role,     setRole]    = useState('customer')
  const [orgName,  setOrgName] = useState('')
  const [phone,    setPhone]   = useState('')
  const [city,     setCity]    = useState('Addis Ababa')
  const [bizType,  setBizType] = useState('Retail')
  const [step,     setStep]    = useState(0) // 0 = role, 1 = details
  const [saving,   setSaving]  = useState(false)
  const [errors,   setErrors]  = useState({})

  async function handleContinue() {
    if (step === 0) { setStep(1); return }

    // Validate
    const errs = {}
    if (role === 'seller' && !orgName.trim()) errs.orgName = 'Shop name is required'
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSaving(true)
    try {
      // Update user role and city
      await updateProfile({ role, city, phone })

      // Create org if seller
      if (role === 'seller') {
        const { error: orgErr } = await supabase
          .from('organizations')
          .insert({ user_id: profile.id, name: orgName.trim(), phone, status: 'pending' })
        if (orgErr) throw orgErr
      }

      await refetchProfile()
      toast(role === 'seller' ? 'Account created! Awaiting admin approval.' : `Welcome to GGM! Let's get started.`, 'success')

      if (role === 'seller') navigate('/seller', { replace: true })
      else                   navigate('/customer', { replace: true })

    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #f8f9ff 0%, #e8f0fe 100%)', padding: 24,
    }}>
      <div style={{
        background: 'white', borderRadius: 20, padding: '40px 36px',
        width: '100%', maxWidth: 460,
        boxShadow: '0 8px 40px rgba(26,115,232,.12)',
        animation: 'slideUp .3s ease',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <svg width="48" height="48" viewBox="0 0 28 28">
            <rect width="12" height="12" fill="#4285F4" rx="2"/>
            <rect x="16" width="12" height="12" fill="#EA4335" rx="2"/>
            <rect y="16" width="12" height="12" fill="#34A853" rx="2"/>
            <rect x="16" y="16" width="12" height="12" fill="#FBBC05" rx="2"/>
          </svg>
          {profile && (
            <div style={{ marginTop: 12 }}>
              {profile.avatar_url && (
                <img src={profile.avatar_url} alt={profile.name} style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--gray-200)', marginBottom: 8 }} />
              )}
              <div style={{ fontWeight: 700, fontSize: 18 }}>Welcome, {profile.name.split(' ')[0]}!</div>
              <div style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 2 }}>One last step to set up your account</div>
            </div>
          )}
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 28 }}>
          {[0, 1].map(i => (
            <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= step ? 'var(--brand)' : 'var(--gray-200)', transition: 'background .3s' }} />
          ))}
        </div>

        {/* Step 0: Role Selection */}
        {step === 0 && (
          <div style={{ animation: 'slideUp .25s ease' }}>
            <h3 style={{ fontWeight: 700, marginBottom: 4, fontSize: 18 }}>How will you use GGM?</h3>
            <p style={{ fontSize: 13, color: 'var(--gray-600)', marginBottom: 24 }}>Choose your account type to get started</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
              {[
                { value: 'customer', Icon: IconUser,  title: 'Buy Products',  desc: 'Browse and order from verified sellers across Ethiopia', color: '#1a73e8' },
                { value: 'seller',   Icon: IconStore, title: 'Sell Products', desc: 'List your products and manage your own online store', color: '#1e8e3e' },
              ].map(r => (
                <div
                  key={r.value}
                  onClick={() => setRole(r.value)}
                  style={{
                    padding: '18px 20px', borderRadius: 14, cursor: 'pointer',
                    border: `2px solid ${role === r.value ? r.color : 'var(--gray-200)'}`,
                    background: role === r.value ? (r.color === '#1a73e8' ? 'var(--brand-light)' : '#e6f4ea') : 'white',
                    display: 'flex', alignItems: 'center', gap: 16,
                    transition: 'all .2s',
                  }}
                >
                  <div style={{
                    width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                    background: role === r.value ? r.color : 'var(--gray-100)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: role === r.value ? 'white' : 'var(--gray-400)',
                    transition: 'all .2s',
                  }}>
                    <r.Icon width={24} height={24} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: role === r.value ? r.color : 'var(--gray-900)' }}>{r.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 3, lineHeight: 1.4 }}>{r.desc}</div>
                  </div>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                    border: `2px solid ${role === r.value ? r.color : 'var(--gray-300)'}`,
                    background: role === r.value ? r.color : 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all .2s',
                  }}>
                    {role === r.value && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button className="btn btn-primary btn-full" onClick={handleContinue} style={{ height: 46, fontSize: 15 }}>
              Continue
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: 6 }}>
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </div>
        )}

        {/* Step 1: Details */}
        {step === 1 && (
          <div style={{ animation: 'slideUp .25s ease' }}>
            <h3 style={{ fontWeight: 700, marginBottom: 4, fontSize: 18 }}>
              {role === 'seller' ? 'Business Details' : 'Your Details'}
            </h3>
            <p style={{ fontSize: 13, color: 'var(--gray-600)', marginBottom: 20 }}>
              {role === 'seller' ? 'Tell us about your business' : 'A few details to personalize your experience'}
            </p>

            {role === 'seller' && (
              <>
                <div className="form-group">
                  <label className="form-label">Shop / Organization Name *</label>
                  <input
                    className={`form-input ${errors.orgName ? 'error' : ''}`}
                    value={orgName} onChange={e => { setOrgName(e.target.value); setErrors({}) }}
                    placeholder="e.g. Bekele Electronics"
                  />
                  {errors.orgName && <div className="form-error">{errors.orgName}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Business Type</label>
                  <select className="form-input" value={bizType} onChange={e => setBizType(e.target.value)}>
                    {['Retail','Wholesale','Manufacturing','Services','Food & Beverage','Fashion','Electronics','Real Estate','Other'].map(t => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div className="form-group">
              <label className="form-label">Phone Number {role === 'customer' ? '(optional)' : ''}</label>
              <input className="form-input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+251 91 234 5678" type="tel" />
            </div>

            <div className="form-group">
              <label className="form-label">City</label>
              <select className="form-input" value={city} onChange={e => setCity(e.target.value)}>
                {CITIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>

            {role === 'seller' && (
              <div style={{ background: 'var(--amber-light)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#7d4e00', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginTop: 1, flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                Seller accounts require admin approval before listing products.
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost" onClick={() => setStep(0)} style={{ flex: 1, height: 44 }}>Back</button>
              <button className="btn btn-primary" onClick={handleContinue} disabled={saving} style={{ flex: 2, height: 44, fontSize: 15 }}>
                {saving ? 'Creating account...' : 'Get Started'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
