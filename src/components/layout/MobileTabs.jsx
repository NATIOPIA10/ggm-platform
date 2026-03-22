import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

export default function MobileTabs({ basePath, items }) {
  const navigate = useNavigate()
  const location = useLocation()

  const active = (path) => {
    const full = `${basePath}/${path}`
    if (path === '') return location.pathname === basePath || location.pathname === basePath + '/'
    return location.pathname.startsWith(full)
  }

  return (
    <div className="mobile-tabs">
      {items.map(item => (
        <button
          key={item.label}
          className={`mobile-tab-item ${active(item.path) ? 'active' : ''}`}
          onClick={() => navigate(`${basePath}/${item.path}`)}
        >
          {item.Icon && <item.Icon width={14} height={14} />}
          {item.label}
        </button>
      ))}
    </div>
  )
}
