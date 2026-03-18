# AI Research Assistant

A production-style agentic RAG pipeline built with **FastAPI**, **React**, **Anthropic Claude**, and **Tavily**.

Given any research question, the app:
1. **Decomposes** it into focused sub-questions (LLM)
2. **Retrieves** relevant web sources in parallel (Tavily)
3. **Synthesizes** a cited answer, streamed token-by-token (LLM)

---

## Architecture

```
User Query
    │
    ▼
[Stage 1] Question Decomposition     POST /api/decompose
    │  Claude breaks query → 3-4 sub-questions (JSON)
    ▼
[Stage 2] Parallel Web Retrieval     POST /api/search
    │  Tavily searches each sub-question concurrently (asyncio.gather)
    ▼
[Stage 3] Streaming Synthesis        POST /api/synthesize  (SSE)
    │  Claude writes a cited answer, streamed token-by-token
    ▼
Final answer with inline [1][2] citations
```

### Key concepts demonstrated

| Concept | Where |
|---|---|
| **Prompt engineering** | Each stage has a precise system prompt constraining output format |
| **Structured LLM output** | Stage 1 returns JSON; parsed with graceful fallback |
| **Parallel async I/O** | `asyncio.gather` runs Tavily searches concurrently |
| **SSE streaming** | Stage 3 streams tokens via `text/event-stream` |
| **RAG pattern** | Retrieve first, then generate grounded in sources |
| **Agentic chaining** | Output of each stage feeds the next |

---

## Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- [Anthropic API key](https://console.anthropic.com)
- [Tavily API key](https://tavily.com) (free tier available)

### 1. Clone and configure

```bash
git clone https://github.com/YOUR_USERNAME/ai-research-assistant
cd ai-research-assistant
```

### 2. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Set environment variables
cp .env.example .env
# Edit .env and add your API keys

# Load env and run
export $(cat .env | xargs)      # Windows: set each manually
uvicorn main:app --reload --port 8000
```

Backend runs at `http://localhost:8000`.  
Swagger docs at `http://localhost:8000/docs`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`. The Vite proxy forwards `/api/*` to the backend automatically.

---

## API Reference

### `POST /api/decompose`
```json
// Request
{ "query": "How do MoE models differ from dense transformers?" }

// Response
{ "sub_questions": ["What is a dense transformer?", "How do MoE layers work?", ...] }
```

### `POST /api/search`
```json
// Request — query is JSON-encoded list of sub-questions
{ "query": "[\"What is a dense transformer?\", ...]" }

// Response
{ "sources": [{ "title": "...", "url": "...", "snippet": "...", "source": "arxiv.org" }] }
```

### `POST /api/synthesize`
Returns an SSE stream. Each event:
```
data: {"token": "The mixture"}
data: {"token": "-of-experts"}
...
data: [DONE]
```

---

## Project structure

```
ai-research-assistant/
├── backend/
│   ├── main.py              # FastAPI app — all 3 pipeline stages
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── index.html
    ├── vite.config.js       # Dev proxy → backend
    └── src/
        ├── App.jsx          # Main UI, pipeline state display
        ├── index.css        # Global design tokens
        ├── hooks/
        │   └── usePipeline.js   # Orchestrates all 3 API calls + SSE parsing
        └── components/
            ├── StageCard.jsx    # Pipeline step UI
            ├── SourceCard.jsx   # Retrieved source display
            └── Answer.jsx       # Streamed answer with citation badges
```

---

## Extending this project

**Add LangSmith tracing** — wrap each stage with `@traceable` from `langsmith` to get full observability into your LLM calls. Very impressive to show in interviews.

**Swap to a vector DB** — instead of live Tavily search, pre-embed a document corpus (PDFs, docs) into ChromaDB or Pinecone, and retrieve by cosine similarity. This is classic RAG.

**Add re-ranking** — after retrieval, use a cross-encoder model (e.g. `cross-encoder/ms-marco-MiniLM`) to rerank sources by relevance before synthesis.

**Add query routing** — if the question is factual, go to search; if it's analytical, skip retrieval and synthesize from model knowledge. This is called adaptive RAG.

---

## Resume bullet

> **AI Research Assistant** | Python, FastAPI, React, Anthropic Claude API, Tavily  
> Built a 3-stage agentic RAG pipeline: LLM-based question decomposition, parallel async web retrieval, and streaming synthesis with inline citations. Implemented SSE streaming, structured output parsing, and prompt engineering across each pipeline stage.
