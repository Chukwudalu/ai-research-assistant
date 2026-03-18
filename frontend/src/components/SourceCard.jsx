import React from 'react'

export function SourceCard({ index, title, source, snippet, url }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'block',
        background: 'var(--bg-raised)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '12px 14px',
        textDecoration: 'none',
        transition: 'border-color 0.15s',
        cursor: 'pointer',
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-md)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
        <span style={{
          minWidth: '22px', height: '22px',
          background: 'var(--accent-dim)',
          color: 'var(--accent)',
          borderRadius: '5px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '11px', fontWeight: 500, fontFamily: 'var(--font-mono)',
          marginTop: '1px',
        }}>
          {index}
        </span>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {title}
          </p>
          <p style={{ fontSize: '11px', color: 'var(--accent)', marginBottom: '5px', fontFamily: 'var(--font-mono)' }}>
            {source}
          </p>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {snippet}
          </p>
        </div>
      </div>
    </a>
  )
}
