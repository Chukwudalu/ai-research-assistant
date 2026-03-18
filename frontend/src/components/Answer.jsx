import React from 'react'

export function Answer({ text, streaming }) {
  if (!text && !streaming) return null

  // Split on citation markers like [1], [2], etc.
  const parts = text.split(/(\[\d+\])/)

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      padding: '24px',
      marginTop: '24px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
        <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Synthesized answer
        </span>
        {streaming && (
          <span style={{ fontSize: '11px', color: 'var(--accent)', fontFamily: 'var(--font-mono)', animation: 'pulse 1.5s ease infinite' }}>
            streaming...
          </span>
        )}
      </div>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
      `}</style>
      <p style={{ fontSize: '15px', lineHeight: 1.8, color: 'var(--text-primary)' }}>
        {parts.map((part, i) => {
          if (/^\[\d+\]$/.test(part)) {
            return (
              <span key={i} style={{
                display: 'inline-flex', alignItems: 'center',
                background: 'var(--accent-dim)',
                color: 'var(--accent)',
                borderRadius: '4px',
                fontSize: '11px', fontWeight: 500,
                padding: '1px 5px', margin: '0 1px',
                fontFamily: 'var(--font-mono)',
                verticalAlign: 'middle',
              }}>
                {part}
              </span>
            )
          }
          return part
        })}
        {streaming && (
          <span style={{
            display: 'inline-block', width: '2px', height: '16px',
            background: 'var(--accent)', marginLeft: '2px', verticalAlign: 'text-bottom',
            animation: 'blink 1s step-end infinite',
          }} />
        )}
      </p>
    </div>
  )
}
