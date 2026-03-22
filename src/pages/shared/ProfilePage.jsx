import React, { useState, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { supabase } from '../../lib/supabase'
import { CITIES } from '../../lib/utils'
import { Avatar } from '../../components/shared'
import {
  IconUser, IconEdit, IconShield, IconCheck,
  IconLogOut, IconMapPin, IconSettings
} from '../../components/shared/Icons'
import { useNavigate } from 'react-router-dom'

const TABS = ['Personal Info', 'Security', 'Account']

export default function ProfilePage() {
  const { profile, updateProfile, signOut } = useAuth()
  const { toast }  = useToast()
  const navigate   = useNavigate()

  const [tab,     setTab]     = useState('Personal Info')
  const [saving,  setSaving]  = useState(false)
  const [editing, setEditing] = useState(false)

  // Personal info fields
  const [name,      setName]      = useState(profile?.name || '')
  const [city,      setCity]      = useState(profile?.city || 'Addis Ababa')
  const [phone,     setPhone]     = useState(profile?.phone || '')
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef()

  // Security fields
  const [currentPw, setCurrentPw] = useState('')
  const [newPw,     setNewPw]     = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwSaving,  setPwSaving]  = useState(false)

  if (!profile) return null

  const org = profile.organizations

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { toast('Image must be under 2MB', 'error'); return }

    setUploading(true)
    try {
      const ext  = file.name.split('.').pop()
      const path = `avatars/${profile.id}.${ext}`

      const { error: uploadErr } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true })

      if (uploadErr) throw uploadErr

      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      const url = data.publicUrl + '?t=' + Date.now()

      await updateProfile({ avatar_url: url })
      setAvatarUrl(url)
      toast('Profile photo updated!', 'success')
    } catch (err) {
      // If bucket doesn't exist, show friendly message
      if (err.message?.includes('Bucket')) {
        toast('Create an "avatars" bucket in Supabase Storage first', 'warn')
      } else {
        toast(err.message, 'error')
      }
    } finally {
      setUploading(false)
    }
  }

  async function handleSaveInfo(e) {
    e.preventDefault()
    if (!name.trim()) { toast('Name is required', 'error'); return }
    setSaving(true)
    try {
      await updateProfile({ name: name.trim(), city, phone })
      toast('Profile updated!', 'success')
      setEditing(false)
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault()
    if (!newPw) { toast('Enter a new password', 'error'); return }
    if (newPw.length < 6) { toast('Password must be at least 6 characters', 'error'); return }
    if (newPw !== confirmPw) { toast('Passwords do not match', 'error'); return }
    setPwSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPw })
      if (error) throw error
      toast('Password changed successfully!', 'success')
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setPwSaving(false)
    }
  }

  async function handleSignOut() {
    await signOut()
    navigate('/')
    toast('Signed out', 'success')
  }

  const roleColor = { admin: 'red', seller: 'blue', customer: 'gray' }

  return (
    <div style={{ maxWidth: 640 }}>
      <div className="page-header">
        <h1>My Profile</h1>
        <p>Manage your personal information and account settings</p>
      </div>

      {/* Profile card */}
      <div className="card card-pad mb-24" style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative' }}>
          {/* Avatar display */}
          <div style={{ width: 72, height: 72, borderRadius: '50%', overflow: 'hidden', border: '3px solid var(--gray-200)', position: 'relative' }}>
            {avatarUrl
              ? <img src={avatarUrl} alt={profile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <Avatar name={profile.name} size="xl" />
            }
            {uploading && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="spinner spinner-sm" style={{ borderColor: 'rgba(255,255,255,.3)', borderTopColor: 'white' }} />
              </div>
            )}
          </div>
          {/* Upload button */}
          <label style={{
            position: 'absolute', bottom: 0, right: 0,
            width: 26, height: 26, borderRadius: '50%',
            background: 'var(--brand)', border: '2px solid white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}>
            <IconEdit width={12} height={12} style={{ color: 'white' }} />
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={handleAvatarChange}
            />
          </label>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{profile.name}</div>
          <div style={{ color: 'var(--gray-600)', fontSize: 14, marginTop: 2 }}>{profile.email}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            <span className={`badge badge-${roleColor[profile.role] || 'gray'}`} style={{ textTransform: 'capitalize' }}>
              {profile.role}
            </span>
            {profile.city && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--gray-600)' }}>
                <IconMapPin width={13} height={13} /> {profile.city}
              </span>
            )}
            {org?.verified && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#1e8e3e', fontWeight: 600 }}>
                <svg width="14" height="14" viewBox="0 0 24 24">
                  <path fill="#1e8e3e" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
                </svg>
                Verified Seller
              </span>
            )}
          </div>
        </div>
        <button className="btn btn-outline btn-sm" onClick={() => { setEditing(true); setTab('Personal Info') }}>
          <IconEdit width={14} height={14} /> Edit Profile
        </button>
      </div>

      {/* Seller org card */}
      {org && (
        <div className="card card-pad mb-24" style={{ borderLeft: '4px solid var(--brand)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Shop / Organization</div>
            <span className={`badge badge-${org.status === 'approved' ? 'green' : org.status === 'pending' ? 'amber' : 'red'}`}>
              {org.status}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 3 }}>Shop Name</div>
              <div style={{ fontWeight: 500 }}>{org.name}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 3 }}>Phone</div>
              <div style={{ fontWeight: 500 }}>{org.phone || 'Not set'}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 3 }}>Verified</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {org.verified
                  ? <><IconCheck width={14} height={14} style={{ color: 'var(--green)' }} /> <span style={{ color: 'var(--green)', fontWeight: 500 }}>Yes</span></>
                  : <span style={{ color: 'var(--gray-500)' }}>Not verified</span>
                }
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs mb-24">
        {TABS.map(t => (
          <button key={t} className={`tab-item ${tab === t ? 'tab-active' : ''}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {/* ── PERSONAL INFO ── */}
      {tab === 'Personal Info' && (
        <div className="card card-pad">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 style={{ fontWeight: 700 }}>Personal Information</h3>
            {!editing && (
              <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>
                <IconEdit width={14} height={14} /> Edit
              </button>
            )}
          </div>

          {!editing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { label: 'Full Name',      value: profile.name },
                { label: 'Email Address',  value: profile.email },
                { label: 'City',           value: profile.city || 'Not set' },
                { label: 'Phone',          value: profile.phone || 'Not set' },
                { label: 'Role',           value: profile.role },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', borderBottom: '1px solid var(--gray-100)', paddingBottom: 12 }}>
                  <div style={{ width: 140, fontSize: 13, color: 'var(--gray-500)', fontWeight: 500, flexShrink: 0 }}>{item.label}</div>
                  <div style={{ fontSize: 14, color: 'var(--gray-900)', fontWeight: 500, textTransform: item.label === 'Role' ? 'capitalize' : 'none' }}>{item.value}</div>
                </div>
              ))}
            </div>
          ) : (
            <form onSubmit={handleSaveInfo}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input className="form-input" value={profile.email} disabled style={{ background: 'var(--gray-50)', color: 'var(--gray-500)' }} />
                <p className="form-hint">Email cannot be changed here</p>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">City</label>
                  <select className="form-input" value={city} onChange={e => setCity(e.target.value)}>
                    {CITIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input className="form-input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+251 91 234 5678" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => { setEditing(false); setName(profile.name); setCity(profile.city) }}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ── SECURITY ── */}
      {tab === 'Security' && (
        <div className="card card-pad">
          <h3 style={{ fontWeight: 700, marginBottom: 20 }}>Change Password</h3>
          <form onSubmit={handleChangePassword}>
            <div className="form-group">
              <label className="form-label">New Password *</label>
              <input
                className="form-input" type="password"
                value={newPw} onChange={e => setNewPw(e.target.value)}
                placeholder="Min. 6 characters"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password *</label>
              <input
                className="form-input" type="password"
                value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                placeholder="Repeat new password"
              />
              {newPw && confirmPw && newPw !== confirmPw && (
                <p className="form-error">Passwords do not match</p>
              )}
              {newPw && confirmPw && newPw === confirmPw && (
                <p style={{ fontSize: 12, color: 'var(--green)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <IconCheck width={12} height={12} /> Passwords match
                </p>
              )}
            </div>
            <button type="submit" className="btn btn-primary" disabled={pwSaving || (newPw && confirmPw && newPw !== confirmPw)}>
              {pwSaving ? 'Updating...' : 'Update Password'}
            </button>
          </form>

          <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--gray-200)' }}>
            <h3 style={{ fontWeight: 700, marginBottom: 8 }}>Active Session</h3>
            <p style={{ fontSize: 13, color: 'var(--gray-600)', marginBottom: 16 }}>
              You are currently signed in on this device. Sign out to end your session.
            </p>
            <button className="btn btn-danger" onClick={handleSignOut}>
              <IconLogOut width={14} height={14} /> Sign Out
            </button>
          </div>
        </div>
      )}

      {/* ── ACCOUNT ── */}
      {tab === 'Account' && (
        <div>
          <div className="card card-pad mb-16">
            <h3 style={{ fontWeight: 700, marginBottom: 4 }}>Account Details</h3>
            <p className="text-sm text-muted mb-16">Your account information on GGM platform</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--gray-100)' }}>
                <span style={{ fontSize: 13, color: 'var(--gray-600)' }}>Account Type</span>
                <span className={`badge badge-${roleColor[profile.role] || 'gray'}`} style={{ textTransform: 'capitalize' }}>{profile.role}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--gray-100)' }}>
                <span style={{ fontSize: 13, color: 'var(--gray-600)' }}>User ID</span>
                <span style={{ fontSize: 12, color: 'var(--gray-500)', fontFamily: 'monospace' }}>{profile.id?.slice(0, 16)}...</span>
              </div>
              {org && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--gray-100)' }}>
                    <span style={{ fontSize: 13, color: 'var(--gray-600)' }}>Shop Name</span>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{org.name}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--gray-100)' }}>
                    <span style={{ fontSize: 13, color: 'var(--gray-600)' }}>Shop Status</span>
                    <span className={`badge badge-${org.status === 'approved' ? 'green' : org.status === 'pending' ? 'amber' : 'red'}`}>{org.status}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="card card-pad" style={{ borderLeft: '4px solid var(--red)' }}>
            <h3 style={{ fontWeight: 700, marginBottom: 4, color: 'var(--red)' }}>Danger Zone</h3>
            <p style={{ fontSize: 13, color: 'var(--gray-600)', marginBottom: 16 }}>
              Once you sign out, you will need your email and password to sign back in.
            </p>
            <button className="btn btn-danger" onClick={handleSignOut}>
              <IconLogOut width={14} height={14} /> Sign Out of Account
            </button>
          </div>
        </div>
      )}
    </div>
  )
}