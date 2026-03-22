import React, { useEffect, useRef } from 'react'
import { starsDisplay, formatDate } from '../../lib/utils'

// â??â?? SPINNER â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??
export function Spinner({ small }) {
  return (
    <div className={small ? '' : 'spinner-wrap'}>
      <div className={`spinner ${small ? 'spinner-sm' : ''}`} />
    </div>
  )
}

// â??â?? MODAL â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??
export function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  const maxW = { sm: '380px', md: '560px', lg: '720px' }[size]

  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: maxW }}>
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <button className="btn btn-ghost btn-icon" onClick={onClose} style={{ border: 'none' }}>X</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  )
}

// â??â?? STAR RATING PICKER â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??
export function StarPicker({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: n <= value ? 'var(--amber)' : 'var(--gray-300)' }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill={n <= value ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </button>
      ))}
    </div>
  )
}

// â??â?? STAR DISPLAY â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??
export function StarDisplay({ rating, count }) {
  if (!rating) return null
  return (
    <div className="star-row">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--amber)" stroke="var(--amber)" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
      <span style={{ fontWeight: 500 }}>{rating}</span>
      {count != null && <span className="text-muted text-xs">({count})</span>}
    </div>
  )
}

// â??â?? AVATAR â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??
export function Avatar({ name = '', size = 'md', src }) {
  const initials = name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'
  return (
    <div className={`avatar avatar-${size}`}>
      {src ? <img src={src} alt={name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : initials}
    </div>
  )
}

// â??â?? BADGE â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??
export function Badge({ children, color = 'gray' }) {
  return <span className={`badge badge-${color}`}>{children}</span>
}

// â??â?? EMPTY STATE â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??
export function EmptyState({ icon, title, message, action }) {
  return (
    <div className="empty-state">
      {icon && <div style={{ color: 'var(--gray-300)', marginBottom: 16, display: 'flex', justifyContent: 'center' }}>{icon}</div>}
      {title && <h3>{title}</h3>}
      {message && <p>{message}</p>}
      {action}
    </div>
  )
}

// â??â?? CONFIRM DIALOG â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??
export function ConfirmModal({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', danger }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>{confirmLabel}</button>
        </>
      }
    >
      <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--gray-700)' }}>{message}</p>
    </Modal>
  )
}

// â”€â”€ REVIEW CARD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function ReviewCard({ review }) {
  return (
    <div style={{ padding: '14px 0', borderBottom: '1px solid var(--gray-100)' }}>
      <div className="flex-align gap-8" style={{ marginBottom: 8 }}>
        <Avatar name={review.users?.name} size="sm" src={review.users?.avatar_url} />
        <div>
          <span style={{ fontWeight: 500, fontSize: 14 }}>{review.users?.name}</span>
          <span className="text-muted text-xs" style={{ marginLeft: 8 }}>{formatDate(review.created_at)}</span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 2 }}>
          {[1,2,3,4,5].map(n => (
            <svg key={n} width="14" height="14" viewBox="0 0 24 24"
              fill={n <= review.rating ? 'var(--amber)' : 'none'}
              stroke="var(--amber)" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          ))}
        </div>
      </div>
      <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--gray-700)' }}>{review.comment}</p>
    </div>
  )
}

// â”€â”€ ORDER STATUS TIMELINE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function OrderTimeline({ status }) {
  const steps = ['pending', 'accepted', 'processing', 'delivered', 'completed']
  const idx = steps.indexOf(status)
  return (
    <div className="order-timeline">
      {steps.map((step, i) => (
        <React.Fragment key={step}>
          {i > 0 && <div className={`tl-line ${idx >= i ? 'done' : ''}`} />}
          <div className="tl-step">
            <div className={`tl-dot ${idx > i ? 'done' : idx === i ? 'active' : ''}`}>
              {idx > i ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> : i + 1}
            </div>
            <div className="tl-label">{step.charAt(0).toUpperCase() + step.slice(1)}</div>
          </div>
        </React.Fragment>
      ))}
    </div>
  )
}

// â”€â”€ IMAGE UPLOAD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function ImageUpload({ images, onChange, maxImages = 4 }) {
  const ref = useRef()
  return (
    <div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
        {images.map((img, i) => (
          <div key={i} style={{ width: 80, height: 80, borderRadius: 8, overflow: 'hidden', position: 'relative', border: '1px solid var(--gray-200)' }}>
            {img.startsWith('http') || img.startsWith('blob')
              ? <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>{img}</div>
            }
            <button
              onClick={() => onChange(images.filter((_, j) => j !== i))}
              style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,.5)', color: 'white', border: 'none', borderRadius: '50%', width: 20, height: 20, fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >X</button>
          </div>
        ))}
        {images.length < maxImages && (
          <div
            onClick={() => ref.current?.click()}
            style={{ width: 80, height: 80, borderRadius: 8, border: '2px dashed var(--gray-300)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 24, color: 'var(--gray-500)', transition: 'all .15s' }}
          >+</div>
        )}
      </div>
      <input
        ref={ref} type="file" accept="image/*" multiple className="hidden"
        style={{ display: 'none' }}
        onChange={e => {
          const files = Array.from(e.target.files).slice(0, maxImages - images.length)
          const urls  = files.map(f => URL.createObjectURL(f))
          onChange([...images, ...urls])
        }}
      />
      <p className="form-hint">Upload up to {maxImages} images. Click image to remove.</p>
    </div>
  )
}
