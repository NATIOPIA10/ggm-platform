import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useToast } from '../context/ToastContext'

export default function ResetPassword() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleReset(e) {
    e.preventDefault()
    if (password.length < 6) return toast('Password must be at least 6 characters', 'error')
    if (password !== confirm) return toast('Passwords do not match', 'error')

    setLoading(true)
    try {
      // Check if we have a session (it should be set by Supabase from the URL hash)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        toast('Session expired or invalid. Please request a new reset link.', 'error')
        setLoading(false)
        return
      }

      const { error } = await supabase.auth.updateUser({ password })
      
      if (error) {
        toast(error.message, 'error')
      } else {
        toast('Password updated successfully!', 'success')
        // Sign out to force a fresh login with the new password
        await supabase.auth.signOut()
        navigate('/auth', { replace: true })
      }
    } catch (err) {
      toast(err.message || 'An unexpected error occurred', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: 'calc(100vh - var(--nav-h))',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #f8f9ff 0%, #e8f0fe 100%)',
      padding: 24,
    }}>
      <div style={{
        background: 'white', borderRadius: 20, padding: '36px 40px',
        width: '100%', maxWidth: 400,
        boxShadow: '0 8px 40px rgba(26,115,232,.12)',
      }}>
        <h2 style={{ textAlign: 'center', marginBottom: 8, fontWeight: 700 }}>Reset Password</h2>
        <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--gray-600)', marginBottom: 24 }}>
          Enter your new password below to regain access to your account.
        </p>

        <form onSubmit={handleReset}>
          <div className="form-group">
            <label className="form-label">New Password</label>
            <input 
              className="form-input" 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              placeholder="Min. 6 characters"
              required 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Confirm New Password</label>
            <input 
              className="form-input" 
              type="password" 
              value={confirm} 
              onChange={e => setConfirm(e.target.value)} 
              placeholder="Repeat new password"
              required 
            />
          </div>
          <button 
            type="submit" 
            className="btn btn-primary btn-full" 
            style={{ marginTop: 8, height: 44 }} 
            disabled={loading}
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
