import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { CITIES } from '../lib/utils'
import { IconUser, IconStore, IconCheck, IconChevronRight } from '../components/shared/Icons'

// ── PASSWORD STRENGTH ──────────────────────────
function PasswordStrength({ password }) {
  if (!password) return null
  const checks = [
    { label: 'At least 8 characters', pass: password.length >= 8 },
    { label: 'Contains a number',     pass: /\d/.test(password) },
    { label: 'Contains uppercase',    pass: /[A-Z]/.test(password) },
  ]
  const score = checks.filter(c => c.pass).length
  const colors = ['var(--red)', 'var(--amber)', 'var(--green)']
  const labels = ['Weak', 'Fair', 'Strong']
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i < score ? colors[score-1] : 'var(--gray-200)', transition: 'background .3s' }} />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {checks.map(c => (
            <span key={c.label} style={{ fontSize: 11, color: c.pass ? 'var(--green)' : 'var(--gray-500)', display: 'flex', alignItems: 'center', gap: 3 }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill={c.pass ? 'var(--green)' : 'none'} stroke={c.pass ? 'var(--green)' : 'var(--gray-400)'} strokeWidth="3">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              {c.label}
            </span>
          ))}
        </div>
        {score > 0 && <span style={{ fontSize: 11, fontWeight: 600, color: colors[score-1] }}>{labels[score-1]}</span>}
      </div>
    </div>
  )
}

// ── OTP INPUT ──────────────────────────────────
function OtpInput({ value, onChange }) {
  const inputs = useRef([])
  const digits = value.split('').concat(Array(6).fill('')).slice(0, 6)

  function handleKey(i, e) {
    if (e.key === 'Backspace') {
      const next = [...digits]
      next[i] = ''
      onChange(next.join(''))
      if (i > 0) inputs.current[i-1]?.focus()
    }
  }

  function handleChange(i, e) {
    const val = e.target.value.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[i] = val
    onChange(next.join(''))
    if (val && i < 5) inputs.current[i+1]?.focus()
  }

  function handlePaste(e) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    onChange(pasted.padEnd(6, '').slice(0, 6))
    inputs.current[Math.min(pasted.length, 5)]?.focus()
    e.preventDefault()
  }

  return (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={el => inputs.current[i] = el}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={e => handleChange(i, e)}
          onKeyDown={e => handleKey(i, e)}
          onPaste={handlePaste}
          style={{
            width: 48, height: 56, textAlign: 'center', fontSize: 22, fontWeight: 700,
            border: `2px solid ${d ? 'var(--brand)' : 'var(--gray-300)'}`,
            borderRadius: 10, outline: 'none', fontFamily: 'var(--font)',
            background: d ? 'var(--brand-light)' : 'white',
            color: 'var(--gray-900)', transition: 'all .15s',
          }}
        />
      ))}
    </div>
  )
}

// ── PROGRESS BAR ──────────────────────────────
function StepBar({ current, total }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        {Array.from({ length: total }, (_, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700,
              background: i < current ? 'var(--brand)' : i === current ? 'var(--brand)' : 'var(--gray-200)',
              color: i <= current ? 'white' : 'var(--gray-500)',
              transition: 'all .3s',
            }}>
              {i < current
                ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                : i + 1
              }
            </div>
          </div>
        ))}
      </div>
      <div style={{ height: 4, background: 'var(--gray-200)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', background: 'var(--brand)', borderRadius: 2, width: `${(current / (total - 1)) * 100}%`, transition: 'width .4s ease' }} />
      </div>
      <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--gray-500)', marginTop: 8 }}>
        Step {current + 1} of {total}
      </div>
    </div>
  )
}

// ── MAIN AUTH COMPONENT ───────────────────────
export default function Auth() {
  const navigate      = useNavigate()
  const [searchParams] = useSearchParams()
  const { signIn, signUp, profile, loading } = useAuth()
  const { toast }     = useToast()

  const [tab, setTab] = useState(searchParams.get('tab') === 'register' ? 'register' : 'login')

  // ── LOGIN STATE ──
  const [loginEmail,    setLoginEmail]    = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginErrors,   setLoginErrors]   = useState({})
  const [submitting,    setSubmitting]    = useState(false)

  // ── REGISTER MULTI-STEP STATE ──
  const [step, setStep] = useState(0)
  const TOTAL_STEPS = 4

  // Step 0 — Basic info
  const [name,      setName]      = useState('')
  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [step0Errors, setStep0Errors] = useState({})

  // Step 1 — Role
  const [role, setRole] = useState('customer')

  // Step 2 — Details
  const [phone,    setPhone]    = useState('')
  const [city,     setCity]     = useState('Addis Ababa')
  const [orgName,  setOrgName]  = useState('')
  const [bizType,  setBizType]  = useState('Retail')
  const [step2Errors, setStep2Errors] = useState({})

  // Step 3 — OTP
  const [otp,         setOtp]         = useState('')
  const [otpSent,     setOtpSent]     = useState(false)
  const [otpValue,    setOtpValue]    = useState('')
  const [otpError,    setOtpError]    = useState('')
  const [countdown,   setCountdown]   = useState(0)
  const [otpLoading,  setOtpLoading]  = useState(false)
  const [verifying,   setVerifying]   = useState(false)
  const timerRef = useRef()

  // Redirect if logged in
  useEffect(() => {
    if (!loading && profile) {
      if (profile.role === 'admin')       navigate('/admin',    { replace: true })
      else if (profile.role === 'seller') navigate('/seller',   { replace: true })
      else                                navigate('/customer', { replace: true })
    }
  }, [profile, loading])

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) { clearInterval(timerRef.current); return }
    timerRef.current = setInterval(() => setCountdown(c => c - 1), 1000)
    return () => clearInterval(timerRef.current)
  }, [countdown])

  if (loading) return null

  // ── LOGIN ──────────────────────────────────
  async function handleLogin(e) {
    e.preventDefault()
    const errs = {}
    if (!loginEmail)    errs.email    = 'Email is required'
    if (!loginPassword) errs.password = 'Password is required'
    if (Object.keys(errs).length) { setLoginErrors(errs); return }
    setSubmitting(true)
    try {
      await signIn({ email: loginEmail, password: loginPassword })
      toast('Welcome back!', 'success')
    } catch (err) {
      toast(err.message || 'Invalid email or password', 'error')
      setSubmitting(false)
    }
  }

  // ── STEP 0 VALIDATION ──────────────────────
  function validateStep0() {
    const errs = {}
    if (!name.trim())           errs.name      = 'Full name is required'
    if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Enter a valid email'
    if (password.length < 6)    errs.password  = 'Minimum 6 characters'
    if (password !== confirmPw) errs.confirmPw = 'Passwords do not match'
    setStep0Errors(errs)
    return Object.keys(errs).length === 0
  }

  // ── STEP 2 VALIDATION ──────────────────────
  function validateStep2() {
    const errs = {}
    if (role === 'seller' && !orgName.trim()) errs.orgName = 'Organization name is required'
    setStep2Errors(errs)
    return Object.keys(errs).length === 0
  }

  // ── SEND OTP via EmailJS ───────────────────
  async function sendOtp() {
    const generated = Math.floor(100000 + Math.random() * 900000).toString()
    setOtp(generated)
    setOtpLoading(true)

    try {
      // EmailJS send
      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: 'ggm-platform' ,
          template_id: 'template_u3gq1ae',
          user_id: 'fH51O3bOZcvZp3Gyb',
          template_params: {
            to_email: email,
            to_name:  name,
            otp_code: generated,
          }
        })
      })

      const responseText = await response.text()
console.log('EmailJS response:', response.status, responseText)
if (response.ok) {
        setOtpSent(true)
        setCountdown(300) // 5 minutes
        toast('OTP sent to ' + email, 'success')
      } else {
        throw new Error('Failed to send OTP')
      }
    } catch (err) {
      // For demo: show OTP in toast if EmailJS not configured
      toast(`Demo OTP: ${generated} (configure EmailJS for production)`, 'info', 10000)
      setOtpSent(true)
      setCountdown(300)
    } finally {
      setOtpLoading(false)
    }
  }

  // ── VERIFY OTP & CREATE ACCOUNT ───────────
  async function verifyAndCreate() {
    if (otpValue.length !== 6) { setOtpError('Enter the 6-digit code'); return }
    if (countdown <= 0)        { setOtpError('OTP expired. Please resend.'); return }
    if (otpValue !== otp)      { setOtpError('Incorrect code. Try again.'); return }

    setVerifying(true)
    try {
      await signUp({ email, password, name, city, role, orgName, orgPhone: phone })
      toast(role === 'seller' ? 'Account created! Awaiting admin approval.' : `Welcome to GGM, ${name}!`, 'success')
    } catch (err) {
      toast(err.message || 'Registration failed', 'error')
      setVerifying(false)
    }
  }

  // ── STEP NAVIGATION ───────────────────────
  function nextStep() {
    if (step === 0 && !validateStep0()) return
    if (step === 2 && !validateStep2()) return
    if (step === 2) { sendOtp() }
    setStep(s => s + 1)
  }

  function prevStep() { setStep(s => Math.max(0, s - 1)) }

  const pwScore = [password.length >= 8, /\d/.test(password), /[A-Z]/.test(password)].filter(Boolean).length

  // ── RENDER ─────────────────────────────────
  return (
    <div style={{
      minHeight: 'calc(100vh - var(--nav-h))',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #f8f9ff 0%, #e8f0fe 100%)',
      padding: 24,
    }}>
      <div style={{
        background: 'white', borderRadius: 20, padding: '36px 40px',
        width: '100%', maxWidth: 460,
        boxShadow: '0 8px 40px rgba(26,115,232,.12)',
        animation: 'slideUp .3s ease',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <svg width="48" height="48" viewBox="0 0 28 28">
            <rect width="12" height="12" fill="#4285F4" rx="2"/>
            <rect x="16" width="12" height="12" fill="#EA4335" rx="2"/>
            <rect y="16" width="12" height="12" fill="#34A853" rx="2"/>
            <rect x="16" y="16" width="12" height="12" fill="#FBBC05" rx="2"/>
          </svg>
          <div style={{ fontWeight: 700, fontSize: 20, marginTop: 8 }}>Google General Market</div>
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', background: 'var(--gray-100)', borderRadius: 10, padding: 4, marginBottom: 28 }}>
          {['login', 'register'].map(t => (
            <button key={t} onClick={() => { setTab(t); setStep(0) }} style={{
              flex: 1, padding: '8px', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font)', fontSize: 14, fontWeight: 500, transition: 'all .15s',
              background: tab === t ? 'white' : 'transparent',
              color: tab === t ? 'var(--brand)' : 'var(--gray-600)',
              boxShadow: tab === t ? 'var(--shadow-sm)' : 'none',
            }}>
              {t === 'login' ? 'Sign In' : 'Register'}
            </button>
          ))}
        </div>

        {/* ── LOGIN FORM ── */}
        {tab === 'login' && (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input className={`form-input ${loginErrors.email ? 'error' : ''}`} type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="you@example.com" autoFocus />
              {loginErrors.email && <div className="form-error">{loginErrors.email}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className={`form-input ${loginErrors.password ? 'error' : ''}`} type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="........" />
              {loginErrors.password && <div className="form-error">{loginErrors.password}</div>}
            </div>
            <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: 8, height: 44, fontSize: 15 }} disabled={submitting}>
              {submitting ? 'Signing in...' : 'Sign In'}
            </button>
            <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--gray-600)', marginTop: 16 }}>
              Don't have an account?{' '}
              <button onClick={() => setTab('register')} style={{ background: 'none', border: 'none', color: 'var(--brand)', cursor: 'pointer', fontWeight: 500 }}>Register</button>
            </p>
          </form>
        )}

        {/* ── REGISTER MULTI-STEP ── */}
        {tab === 'register' && (
          <div>
            <StepBar current={step} total={TOTAL_STEPS} />

            {/* ── STEP 0: Basic Info ── */}
            {step === 0 && (
              <div style={{ animation: 'slideUp .25s ease' }}>
                <h3 style={{ fontWeight: 700, marginBottom: 4 }}>Create your account</h3>
                <p style={{ fontSize: 13, color: 'var(--gray-600)', marginBottom: 20 }}>Fill in your basic information</p>

                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input className={`form-input ${step0Errors.name ? 'error' : ''}`} value={name} onChange={e => setName(e.target.value)} placeholder="Dawit Bekele" />
                  {step0Errors.name && <div className="form-error">{step0Errors.name}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input className={`form-input ${step0Errors.email ? 'error' : ''}`} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
                  {step0Errors.email && <div className="form-error">{step0Errors.email}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Password *</label>
                  <input className={`form-input ${step0Errors.password ? 'error' : ''}`} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 6 characters" />
                  <PasswordStrength password={password} />
                  {step0Errors.password && <div className="form-error">{step0Errors.password}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm Password *</label>
                  <input className={`form-input ${step0Errors.confirmPw ? 'error' : ''}`} type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="Repeat password" />
                  {confirmPw && password === confirmPw && (
                    <p style={{ fontSize: 12, color: 'var(--green)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                      Passwords match
                    </p>
                  )}
                  {step0Errors.confirmPw && <div className="form-error">{step0Errors.confirmPw}</div>}
                </div>
                <button className="btn btn-primary btn-full" onClick={nextStep} style={{ height: 44, fontSize: 15, marginTop: 4 }}
                  disabled={!name || !email || !password || !confirmPw || pwScore < 1}>
                  Next <IconChevronRight width={16} height={16} />
                </button>
              </div>
            )}

            {/* ── STEP 1: Role Selection ── */}
            {step === 1 && (
              <div style={{ animation: 'slideUp .25s ease' }}>
                <h3 style={{ fontWeight: 700, marginBottom: 4 }}>How will you use GGM?</h3>
                <p style={{ fontSize: 13, color: 'var(--gray-600)', marginBottom: 24 }}>Choose your account type</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                  {[
                    { value: 'customer', Icon: IconUser,  title: 'Buy Products',  desc: 'Browse and order from verified sellers across Ethiopia' },
                    { value: 'seller',   Icon: IconStore, title: 'Sell Products', desc: 'List your products and manage your own online store' },
                  ].map(r => (
                    <div key={r.value} onClick={() => setRole(r.value)} style={{
                      padding: '16px 18px', borderRadius: 14, cursor: 'pointer',
                      border: `2px solid ${role === r.value ? 'var(--brand)' : 'var(--gray-200)'}`,
                      background: role === r.value ? 'var(--brand-light)' : 'white',
                      display: 'flex', alignItems: 'center', gap: 16,
                      transition: 'all .2s',
                    }}>
                      <div style={{
                        width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                        background: role === r.value ? 'var(--brand)' : 'var(--gray-100)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: role === r.value ? 'white' : 'var(--gray-500)',
                        transition: 'all .2s',
                      }}>
                        <r.Icon width={22} height={22} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 15, color: role === r.value ? 'var(--brand)' : 'var(--gray-900)' }}>{r.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--gray-600)', marginTop: 2 }}>{r.desc}</div>
                      </div>
                      <div style={{
                        width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                        border: `2px solid ${role === r.value ? 'var(--brand)' : 'var(--gray-300)'}`,
                        background: role === r.value ? 'var(--brand)' : 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {role === r.value && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn btn-ghost" onClick={prevStep} style={{ flex: 1, height: 44 }}>Back</button>
                  <button className="btn btn-primary" onClick={nextStep} style={{ flex: 2, height: 44, fontSize: 15 }}>
                    Continue <IconChevronRight width={16} height={16} />
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 2: Role Details ── */}
            {step === 2 && (
              <div style={{ animation: 'slideUp .25s ease' }}>
                <h3 style={{ fontWeight: 700, marginBottom: 4 }}>
                  {role === 'seller' ? 'Business Details' : 'Your Details'}
                </h3>
                <p style={{ fontSize: 13, color: 'var(--gray-600)', marginBottom: 20 }}>
                  {role === 'seller' ? 'Tell us about your business' : 'Almost there! A few more details'}
                </p>

                {role === 'seller' && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Organization / Shop Name *</label>
                      <input className={`form-input ${step2Errors.orgName ? 'error' : ''}`} value={orgName} onChange={e => setOrgName(e.target.value)} placeholder="Bekele Electronics" />
                      {step2Errors.orgName && <div className="form-error">{step2Errors.orgName}</div>}
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
                  <label className="form-label">Phone Number {role === 'seller' ? '*' : '(optional)'}</label>
                  <input className="form-input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+251 91 234 5678" type="tel" />
                </div>
                <div className="form-group">
                  <label className="form-label">City</label>
                  <select className="form-input" value={city} onChange={e => setCity(e.target.value)}>
                    {CITIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>

                {role === 'seller' && (
                  <div style={{ background: 'var(--amber-light)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#7d4e00', display: 'flex', gap: 8 }}>
                    <span>i</span>
                    Seller accounts require admin approval before listing products.
                  </div>
                )}

                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn btn-ghost" onClick={prevStep} style={{ flex: 1, height: 44 }}>Back</button>
                  <button className="btn btn-primary" onClick={nextStep} style={{ flex: 2, height: 44, fontSize: 15 }}>
                    {otpLoading ? 'Sending OTP...' : 'Send OTP'} <IconChevronRight width={16} height={16} />
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 3: OTP Verification ── */}
            {step === 3 && (
              <div style={{ animation: 'slideUp .25s ease', textAlign: 'center' }}>
                <div style={{ width: 64, height: 64, background: 'var(--brand-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </div>
                <h3 style={{ fontWeight: 700, marginBottom: 6 }}>Verify your email</h3>
                <p style={{ fontSize: 13, color: 'var(--gray-600)', marginBottom: 6 }}>
                  We sent a 6-digit code to
                </p>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--brand)', marginBottom: 24 }}>{email}</p>

                <OtpInput value={otpValue} onChange={v => { setOtpValue(v); setOtpError('') }} />

                {otpError && (
                  <div style={{ color: 'var(--red)', fontSize: 13, marginTop: 12 }}>{otpError}</div>
                )}

                {/* Countdown */}
                {countdown > 0 ? (
                  <p style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 14 }}>
                    Code expires in{' '}
                    <span style={{ fontWeight: 700, color: countdown < 60 ? 'var(--red)' : 'var(--gray-700)' }}>
                      {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}
                    </span>
                  </p>
                ) : (
                  <button onClick={sendOtp} style={{ background: 'none', border: 'none', color: 'var(--brand)', fontSize: 13, cursor: 'pointer', marginTop: 14, fontWeight: 500 }}>
                    Resend code
                  </button>
                )}

                <button
                  className="btn btn-primary btn-full"
                  onClick={verifyAndCreate}
                  disabled={otpValue.length !== 6 || verifying}
                  style={{ height: 46, fontSize: 15, marginTop: 20 }}
                >
                  {verifying ? 'Creating account...' : 'Verify & Create Account'}
                </button>

                <button onClick={prevStep} style={{ background: 'none', border: 'none', color: 'var(--gray-600)', fontSize: 13, cursor: 'pointer', marginTop: 12 }}>
                  Back
                </button>
              </div>
            )}

            <div className="divider" style={{ margin: '20px 0 16px' }}>or</div>
            <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--gray-600)' }}>
              Already have an account?{' '}
              <button onClick={() => { setTab('login'); setStep(0) }} style={{ background: 'none', border: 'none', color: 'var(--brand)', cursor: 'pointer', fontWeight: 500 }}>
                Sign In
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}