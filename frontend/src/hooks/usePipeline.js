import { useState, useCallback } from 'react'

/**
  usePipeline — orchestrates the 3 stage research pipeline
  Stage 1: POST /api/decompose  -> sub_questions[]
  Stage 2: POST /api/search     -> sources[]
  Stage 3: POST /api/synthesize -> streamed answer tokens
 */

const STAGES = ['idle', 'decomposing', 'searching', 'synthesizing', 'done', 'error']

export function usePipeline() {
  const [stage, setStage] = useState('idle')
  const [subQuestions, setSubQuestions] = useState([])
  const [sources, setSources] = useState([])
  const [answer, setAnswer] = useState('')
  const [error, setError] = useState(null)

  const reset = useCallback(() => {
    setStage('idle')
    setSubQuestions([])
    setSources([])
    setAnswer('')
    setError(null)
  }, [])

  const run = useCallback(async (query) => {
    if (!query.trim()) return
    reset()

    try {
      // Decompose
      setStage('decomposing')
      const decomposeRes = await fetch('/api/decompose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      })
      if (!decomposeRes.ok) throw new Error(`Decompose failed: ${decomposeRes.status}`)
      const { sub_questions } = await decomposeRes.json()
      setSubQuestions(sub_questions)

      // Search 
      setStage('searching')
      const searchRes = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: JSON.stringify(sub_questions) }),
      })
      if (!searchRes.ok) throw new Error(`Search failed: ${searchRes.status}`)
      const { sources: fetchedSources } = await searchRes.json()
      setSources(fetchedSources)

      // Streaming synthesis
      setStage('synthesizing')
      setAnswer('')

      const synthRes = await fetch('/api/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: JSON.stringify({
            original: query,
            sub_questions,
            sources: fetchedSources,
          }),
        }),
      })
      if (!synthRes.ok) throw new Error(`Synthesis failed: ${synthRes.status}`)

      // Parse SSE stream manually
      const reader = synthRes.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() 

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const payload = line.slice(6).trim()
          if (payload === '[DONE]') break
          try {
            const { token } = JSON.parse(payload)
            setAnswer(prev => prev + token)
          } catch {
          }
        }
      }

      setStage('done')
    } catch (err) {
      setError(err.message || 'Something went wrong')
      setStage('error')
    }
  }, [reset])

  return { stage, subQuestions, sources, answer, error, run, reset }
}
