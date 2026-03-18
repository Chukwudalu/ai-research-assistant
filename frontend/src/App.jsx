import React, { useState, useRef } from 'react'
import { usePipeline } from './hooks/usePipeline'
import { StageCard } from './components/StageCard'
import { SourceCard } from './components/SourceCard'
import { Answer } from './components/Answer'

const EXAMPLE_QUERIES = [
  'How do mixture-of-experts models differ from dense transformers?',
  'What are the trade-offs between RAG and fine-tuning for LLM knowledge?',
  'How does RLHF work and what are its key limitations?',
]

function stageStatus(currentStage, targetStage) {
  const order = { decomposing: 1, searching: 2, synthesizing: 3, done: 4 }
  const targets = { decompose: 1, search: 2, synth: 3 }
  const cur = order[currentStage] || 0
  const tgt = targets[targetStage]
  if (cur > tgt) return 'done'
  if (cur === tgt) return 'running'
  return 'waiting'
}

const BADGES = {
  decompose: { bg: 'rgba(124,106,247,0.15)', color: '#a89cf7' },
  search:    { bg: 'rgba(62,207,142,0.12)',  color: '#3ecf8e' },
  synth:     { bg: 'rgba(245,158,11,0.12)',  color: '#f59e0b' },
}

export default function App() {
  const [query, setQuery] = useState('')
  const { stage, subQuestions, sources, answer, error, run, reset } = usePipeline()
  const textareaRef = useRef(null)
  const isRunning = ['decomposing', 'searching', 'synthesizing'].includes(stage)

  function handleSubmit() {
    if (!query.trim() || isRunning) return
    run(query)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit()
  }

  function handleExample(q) {
    setQuery(q)
    textareaRef.current?.focus()
  }

  const showPipeline = stage !== 'idle'

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{
        borderBottom: '1px solid var(--border)',
        padding: '16px 24px',
        display: 'flex', alignItems: 'center', gap: '12px',
      }}>
        <span style={{ fontWeight: 500, fontSize: '14px' }}>Jeremiah's AI Research Assistant</span>
       
      </header>

      {/* Main */}
      <main style={{ flex: 1, maxWidth: '760px', width: '100%', margin: '0 auto', padding: '40px 24px' }}>

        {/* Query input */}
        <div style={{ marginBottom: '28px' }}>
          <textarea
            ref={textareaRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a research question..."
            disabled={isRunning}
            rows={3}
            style={{
              width: '100%', padding: '16px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-md)',
              borderRadius: '12px',
              color: 'var(--text-primary)',
              fontSize: '15px', fontFamily: 'var(--font-sans)',
              resize: 'vertical', outline: 'none', lineHeight: 1.6,
              transition: 'border-color 0.15s',
              opacity: isRunning ? 0.6 : 1,
            }}
            onFocus={e => e.target.style.borderColor = 'var(--accent-border)'}
            onBlur={e => e.target.style.borderColor = 'var(--border-md)'}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
            <button
              onClick={handleSubmit}
              disabled={isRunning || !query.trim()}
              style={{
                padding: '9px 18px',
                background: isRunning || !query.trim() ? 'var(--bg-raised)' : 'var(--accent)',
                color: isRunning || !query.trim() ? 'var(--text-muted)' : '#fff',
                border: 'none', borderRadius: '8px',
                fontSize: '13px', fontWeight: 500, fontFamily: 'var(--font-sans)',
                cursor: isRunning || !query.trim() ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {isRunning ? 'Researching...' : 'Run pipeline'}
            </button>

            {showPipeline && (
              <button
                onClick={() => { reset(); setQuery('') }}
                disabled={isRunning}
                style={{
                  padding: '9px 14px', background: 'none',
                  border: '1px solid var(--border)', borderRadius: '8px',
                  color: 'var(--text-secondary)', fontSize: '13px',
                  fontFamily: 'var(--font-sans)', cursor: 'pointer',
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={e => e.target.style.borderColor = 'var(--border-md)'}
                onMouseLeave={e => e.target.style.borderColor = 'var(--border)'}
              >
                Reset
              </button>
            )}

            <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--text-muted)' }}>
              ⌘+Enter to run
            </span>
          </div>
        </div>

        {/* Example queries */}
        {!showPipeline && (
          <div style={{ marginBottom: '32px' }}>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>Try an example:</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {EXAMPLE_QUERIES.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleExample(q)}
                  style={{
                    textAlign: 'left', background: 'var(--bg-card)',
                    border: '1px solid var(--border)', borderRadius: '8px',
                    padding: '10px 14px', color: 'var(--text-secondary)',
                    fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--font-sans)',
                    transition: 'border-color 0.15s, color 0.15s',
                  }}
                  onMouseEnter={e => { e.target.style.borderColor = 'var(--border-md)'; e.target.style.color = 'var(--text-primary)' }}
                  onMouseLeave={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--text-secondary)' }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Pipeline stages */}
        {showPipeline && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

            {/* Stage 1: Decompose */}
            <StageCard
              number={1}
              badge={BADGES.decompose}
              label="Question decomposition"
              status={stageStatus(stage, 'decompose')}
            >
              {subQuestions.length > 0 && (
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {subQuestions.map((q, i) => (
                    <li key={i} style={{
                      display: 'flex', gap: '10px', alignItems: 'flex-start',
                      background: 'var(--bg-raised)', borderRadius: '7px',
                      padding: '9px 12px', fontSize: '13px',
                    }}>
                      <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', minWidth: '18px' }}>
                        {i + 1}.
                      </span>
                      <span style={{ color: 'var(--text-primary)' }}>{q}</span>
                    </li>
                  ))}
                </ul>
              )}
            </StageCard>

            {/* Search */}
            <StageCard
              number={2}
              badge={BADGES.search}
              label="Web retrieval"
              status={stageStatus(stage, 'search')}
            >
              {sources.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {sources.map((s, i) => (
                    <SourceCard key={i} index={i + 1} {...s} />
                  ))}
                </div>
              )}
            </StageCard>

            {/* Synthesize */}
            <StageCard
              number={3}
              badge={BADGES.synth}
              label="Synthesis with citations"
              status={stageStatus(stage, 'synth')}
            >
              {(stage === 'synthesizing' || stage === 'done') && answer.length === 0 && (
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Writing answer...</p>
              )}
            </StageCard>

            {/* Error */}
            {error && (
              <div style={{
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: '10px', padding: '14px 16px',
                fontSize: '13px', color: '#fca5a5',
              }}>
                <strong>Error:</strong> {error}
              </div>
            )}
          </div>
        )}

        {/* Streamed answer */}
        <Answer text={answer} streaming={stage === 'synthesizing'} />

      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '16px 24px', textAlign: 'center' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Developed by Jeremiah 
        </span>
      </footer>
    </div>
  )
}
