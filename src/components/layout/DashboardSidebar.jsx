import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

export default function DashboardSidebar({ items, title }) {
  const navigate  = useNavigate()
  const location  = useLocation()

  return (
    <div className="sidebar">
      {title && <div className="sidebar-section">{title}</div>}
      {items.map(item => (
        <button
          key={item.path}
          className={`sidebar-item ${location.pathname === item.path ? 'active' : ''}`}
          onClick={() => navigate(item.path)}
        >
          <span className="s-icon">{item.icon}</span>
          {item.label}
          {item.badge > 0 && <span className="sidebar-badge">{item.badge}</span>}
        </button>
      ))}
    </div>
  )
}
