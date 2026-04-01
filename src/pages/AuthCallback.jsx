import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Spinner } from '../components/shared'

export default function AuthCallback() {
  const navigate           = useNavigate()
  const { handleGoogleUser } = useAuth()
  const [error, setError]  = useState(null)

  useEffect(() => {
    handleCallback()
  }, [])

  async function handleCallback() {
    try {
      // Exchange code for session
      const { data: { session }, error: sessionErr } = await supabase.auth.getSession()
      if (sessionErr) throw sessionErr
      if (!session?.user) { navigate('/auth'); return }

      // Create/fetch profile
      const result = await handleGoogleUser(session.user)
      if (!result) { navigate('/auth'); return }

      const { profile, isNew } = result

      // New user - go to role selection
      if (isNew) { navigate('/auth/role', { replace: true }); return }

      // Existing user - redirect by role
      if (profile.role === 'admin')        navigate('/admin',    { replace: true })
      else if (profile.role === 'seller')  navigate('/seller',   { replace: true })
      else                                 navigate('/customer', { replace: true })

    } catch (err) {
      console.error('OAuth callback error:', err)
      setError(err.message)
    }
  }

  if (error) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: 16, padding: 24 }}>
      <div style={{ fontSize: 48 }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
      </div>
      <h2 style={{ fontWeight: 700 }}>Authentication Failed</h2>
      <p style={{ color: 'var(--gray-600)', textAlign: 'center' }}>{error}</p>
      <button className="btn btn-primary" onClick={() => navigate('/auth')}>Try Again</button>
    </div>
  )

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: 16 }}>
      <Spinner />
      <p style={{ color: 'var(--gray-600)', fontSize: 14 }}>Signing you in...</p>
    </div>
  )
}
