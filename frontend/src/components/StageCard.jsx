import React from 'react'

const statusColors = {
  waiting:  { dot: '#4e4d58', label: '#4e4d58' },
  running:  { dot: '#7c6af7', label: '#7c6af7' },
  done:     { dot: '#3ecf8e', label: '#3ecf8e' },
}

export function StageCard({ number, badge, label, status, children }) {
  const colors = statusColors[status] || statusColors.waiting

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: `1px solid ${status === 'running' ? 'var(--accent-border)' : 'var(--border)'}`,
      borderRadius: '12px',
      padding: '18px 20px',
      transition: 'border-color 0.2s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: children ? '14px' : 0 }}>
        <span style={{
          fontSize: '11px',
          fontWeight: 500,
          padding: '3px 9px',
          borderRadius: '999px',
          background: badge.bg,
          color: badge.color,
          letterSpacing: '0.03em',
        }}>
          Step {number}
        </span>
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{label}</span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
          {status === 'running' && <Spinner />}
          <span style={{
            width: '6px', height: '6px', borderRadius: '50%',
            background: colors.dot, display: 'inline-block',
            boxShadow: status === 'running' ? `0 0 6px var(--accent)` : 'none',
          }} />
          <span style={{ fontSize: '12px', color: colors.label, fontFamily: 'var(--font-mono)' }}>
            {status}
          </span>
        </div>
      </div>
      {children}
    </div>
  )
}

function Spinner() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" style={{ animation: 'spin 0.7s linear infinite' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <circle cx="7" cy="7" r="5.5" fill="none" stroke="var(--accent)" strokeWidth="1.5"
        strokeDasharray="20" strokeDashoffset="8" strokeLinecap="round" />
    </svg>
  )
}
