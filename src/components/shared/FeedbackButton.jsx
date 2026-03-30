import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { submitFeedback } from '../../lib/feedback'

const TYPES = [
  { value: 'bug',        label: 'Bug Report',   color: '#d93025', bg: '#fce8e6',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> },
  { value: 'suggestion', label: 'Suggestion',   color: '#1a73e8', bg: '#e8f0fe',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg> },
  { value: 'complaint',  label: 'Complaint',    color: '#f9ab00', bg: '#fef7e0',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> },
  { value: 'general',    label: 'General',      color: '#1e8e3e', bg: '#e6f4ea',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
]

export default function FeedbackButton() {
  const { profile }   = useAuth()
  const { toast }     = useToast()
  const [open,        setOpen]       = useState(false)
  const [submitted,   setSubmitted]  = useState(false)
  const [submitting,  setSubmitting] = useState(false)
  const [type,        setType]       = useState('general')
  const [message,     setMessage]    = useState('')
  const [rating,      setRating]     = useState(0)
  const [imageFile,   setImageFile]  = useState(null)
  const [imagePreview,setImagePreview] = useState(null)

  if (!profile) return null

  function reset() {
    setType('general'); setMessage(''); setRating(0)
    setImageFile(null); setImagePreview(null); setSubmitted(false)
  }

  function handleClose() { setOpen(false); setTimeout(reset, 300) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!message.trim()) { toast('Please enter a message', 'error'); return }
    setSubmitting(true)
    try {
      await submitFeedback({
        userId: profile.id,
        role:   profile.role,
        type, message: message.trim(), rating, imageFile
      })
      setSubmitted(true)
    } catch (err) {
      toast(err.message || 'Failed to submit feedback', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const selectedType = TYPES.find(t => t.value === type)

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => { setOpen(true); setSubmitted(false) }}
        style={{
          position: 'fixed', bottom: 80, right: 20, zIndex: 90,
          background: 'var(--brand)', color: 'white',
          border: 'none', borderRadius: 28, padding: '10px 18px',
          display: 'flex', alignItems: 'center', gap: 8,
          fontFamily: 'var(--font)', fontSize: 13, fontWeight: 600,
          cursor: 'pointer', boxShadow: '0 4px 16px rgba(26,115,232,.4)',
          transition: 'all .2s',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        Feedback
      </button>

      {/* Modal Backdrop */}
      {open && (
        <div
          onClick={e => e.target === e.currentTarget && handleClose()}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)',
            zIndex: 400, display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end',
            padding: '0 20px 90px', animation: 'fadeIn .2s ease',
          }}
        >
          <div style={{
            background: 'white', borderRadius: 20, width: '100%', maxWidth: 420,
            boxShadow: '0 20px 60px rgba(0,0,0,.2)',
            animation: 'slideUp .3s ease', overflow: 'hidden',
          }}>
            {/* Header */}
            <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>Send Feedback</div>
                <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 2 }}>Help us improve GGM</div>
              </div>
              <button onClick={handleClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-500)', padding: 4, borderRadius: 8 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '18px 20px 20px', maxHeight: '70vh', overflowY: 'auto' }}>
              {submitted ? (
                /* Success State */
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{ width: 64, height: 64, background: 'var(--green-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Thank you!</div>
                  <div style={{ fontSize: 14, color: 'var(--gray-600)', marginBottom: 24 }}>
                    Your feedback has been submitted. We'll review it shortly.
                  </div>
                  <button className="btn btn-primary" onClick={handleClose}>Done</button>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  {/* Type selector */}
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--gray-800)', display: 'block', marginBottom: 8 }}>Feedback Type</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {TYPES.map(t => (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => setType(t.value)}
                          style={{
                            padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                            border: `2px solid ${type === t.value ? t.color : 'var(--gray-200)'}`,
                            background: type === t.value ? t.bg : 'white',
                            display: 'flex', alignItems: 'center', gap: 8,
                            fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500,
                            color: type === t.value ? t.color : 'var(--gray-700)',
                            transition: 'all .15s',
                          }}
                        >
                          <span style={{ color: type === t.value ? t.color : 'var(--gray-400)' }}>{t.icon}</span>
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Message */}
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--gray-800)', display: 'block', marginBottom: 6 }}>Message *</label>
                    <textarea
                      className="form-input"
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      placeholder={
                        type === 'bug'        ? 'Describe the bug you encountered...' :
                        type === 'suggestion' ? 'Share your idea or suggestion...' :
                        type === 'complaint'  ? 'Tell us what went wrong...' :
                                               'Share your thoughts...'
                      }
                      rows={4}
                      required
                      style={{ resize: 'none' }}
                    />
                    <div style={{ fontSize: 11, color: 'var(--gray-500)', marginTop: 4, textAlign: 'right' }}>
                      {message.length} / 500
                    </div>
                  </div>

                  {/* Star Rating */}
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--gray-800)', display: 'block', marginBottom: 8 }}>
                      Rating <span style={{ color: 'var(--gray-500)', fontWeight: 400 }}>(optional)</span>
                    </label>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {[1,2,3,4,5].map(n => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setRating(rating === n ? 0 : n)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, transition: 'transform .1s' }}
                          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'}
                          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                        >
                          <svg width="28" height="28" viewBox="0 0 24 24"
                            fill={n <= rating ? 'var(--amber)' : 'none'}
                            stroke={n <= rating ? 'var(--amber)' : 'var(--gray-300)'}
                            strokeWidth="2">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                          </svg>
                        </button>
                      ))}
                      {rating > 0 && (
                        <span style={{ fontSize: 12, color: 'var(--amber)', alignSelf: 'center', fontWeight: 600, marginLeft: 4 }}>
                          {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][rating]}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Screenshot Upload */}
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--gray-800)', display: 'block', marginBottom: 8 }}>
                      Screenshot <span style={{ color: 'var(--gray-500)', fontWeight: 400 }}>(optional)</span>
                    </label>
                    {imagePreview ? (
                      <div style={{ position: 'relative', display: 'inline-block' }}>
                        <img src={imagePreview} alt="preview" style={{ width: '100%', maxHeight: 120, objectFit: 'cover', borderRadius: 10, border: '1px solid var(--gray-200)' }} />
                        <button
                          type="button"
                          onClick={() => { setImageFile(null); setImagePreview(null) }}
                          style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,.6)', color: 'white', border: 'none', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}
                        >x</button>
                      </div>
                    ) : (
                      <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', border: '2px dashed var(--gray-300)', borderRadius: 10, cursor: 'pointer', fontSize: 13, color: 'var(--gray-600)', transition: 'border-color .15s' }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--brand)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--gray-300)'}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                        Attach a screenshot
                        <input type="file" accept="image/*" style={{ display: 'none' }}
                          onChange={e => {
                            const f = e.target.files?.[0]
                            if (f) { setImageFile(f); setImagePreview(URL.createObjectURL(f)) }
                          }}
                        />
                      </label>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary btn-full"
                    disabled={submitting || !message.trim()}
                    style={{ height: 44, fontSize: 15 }}
                  >
                    {submitting ? 'Submitting...' : 'Submit Feedback'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
