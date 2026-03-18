"""
AI Research Assistant — FastAPI Backend
Implements a 3-stage agentic RAG pipeline:
  1. Question decomposition (LLM)
  2. Web retrieval (Tavily)
  3. Synthesis with citations (LLM, streamed)
"""

import os
import json
import asyncio
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import anthropic
from tavily import TavilyClient

from dotenv import load_dotenv
load_dotenv()

app = FastAPI(title="AI Research Assistant")

# Allow local React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://research-assistant-lyart.vercel.app"],
    allow_methods=["*"],
    allow_headers=["*"],
)

anthropic_client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
tavily_client = TavilyClient(api_key=os.environ["TAVILY_API_KEY"])

MODEL = "claude-opus-4-5"


class ResearchRequest(BaseModel):
    query: str


class SubQuestion(BaseModel):
    question: str


class Source(BaseModel):
    title: str
    url: str
    snippet: str
    source: str


class DecomposeResponse(BaseModel):
    sub_questions: list[str]


class SearchResponse(BaseModel):
    sources: list[Source]


# Break down question
@app.post("/api/decompose", response_model=DecomposeResponse)
async def decompose(req: ResearchRequest):
    """Break the user's question into focused smaller questions."""
    if not req.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    message = anthropic_client.messages.create(
        model=MODEL,
        max_tokens=512,
        system=(
            "You are an expert research planner. Given a research question, "
            "decompose it into 3-4 focused sub-questions that together fully answer the original. "
            "Respond ONLY with a valid JSON array of strings. No preamble, no markdown fences. "
            'Example: ["What is X?", "How does Y work?", "What are the trade-offs of Z?"]'
        ),
        messages=[{"role": "user", "content": req.query}],
    )

    raw = message.content[0].text.strip()
    try:
        sub_questions = json.loads(raw)
        if not isinstance(sub_questions, list):
            raise ValueError("Expected a list")
    except (json.JSONDecodeError, ValueError):
        sub_questions = [
            line.strip().lstrip("0123456789.-) ")
            for line in raw.split("\n")
            if "?" in line
        ][:4]

    return DecomposeResponse(sub_questions=sub_questions)


# Web retrieval via Tavily
@app.post("/api/search", response_model=SearchResponse)
async def search(req: ResearchRequest):
    """
    Run parallel Tavily searches for each sub-question passed as the query.
    Expects query to be a JSON-encoded list of sub-questions.
    """
    try:
        sub_questions = json.loads(req.query)
    except json.JSONDecodeError:
        sub_questions = [req.query]

    async def search_one(question: str) -> list[Source]:
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None,
            lambda: tavily_client.search(
                query=question,
                max_results=2,
                search_depth="basic",
                include_answer=False,
            ),
        )
        sources = []
        for r in result.get("results", []):
            sources.append(
                Source(
                    title=r.get("title", "Untitled"),
                    url=r.get("url", ""),
                    snippet=r.get("content", "")[:200],
                    source=r.get("url", "").split("/")[2] if r.get("url") else "unknown",
                )
            )
        return sources

    # Run all searches in parallel
    results = await asyncio.gather(*[search_one(q) for q in sub_questions])

    # Flatten, deduplicate by URL
    seen_urls: set[str] = set()
    all_sources: list[Source] = []
    for batch in results:
        for s in batch:
            if s.url not in seen_urls:
                seen_urls.add(s.url)
                all_sources.append(s)

    return SearchResponse(sources=all_sources[:6])


#Stage 3: Synthesis with streaming
@app.post("/api/synthesize")
async def synthesize(req: ResearchRequest):
    """
    Synthesize a cited answer from the query + sources.
    Streams tokens back as Server-Sent Events (SSE).
    Expects query to be JSON: {"original": str, "sub_questions": [...], "sources": [...]}
    """
    try:
        payload = json.loads(req.query)
        original = payload["original"]
        sub_questions = payload["sub_questions"]
        sources = payload["sources"]
    except (json.JSONDecodeError, KeyError) as e:
        raise HTTPException(status_code=400, detail=f"Invalid payload: {e}")

    # Build a numbered source list for the prompt
    source_block = "\n".join(
        f"[{i+1}] {s['title']} ({s['source']}): {s['snippet']}"
        for i, s in enumerate(sources)
    )

    system_prompt = (
        "You are a senior research analyst writing for a technical audience. "
        "Given a research question, sub-questions, and numbered sources, write a "
        "clear, well-structured answer of 3-5 paragraphs. "
        "Cite sources inline using [1], [2], etc. exactly as they appear in the source list. "
        "Be precise, technical, and honest about uncertainty. "
        "Do not use markdown headers or bullet points — write flowing prose only."
    )

    user_msg = (
        f"Original question: {original}\n\n"
        f"Sub-questions explored:\n"
        + "\n".join(f"- {q}" for q in sub_questions)
        + f"\n\nSources:\n{source_block}"
    )

    def token_stream():
        with anthropic_client.messages.stream(
            model=MODEL,
            max_tokens=1024,
            system=system_prompt,
            messages=[{"role": "user", "content": user_msg}],
        ) as stream:
            for text in stream.text_stream:
                # SSE format: data: <token>\n\n
                yield f"data: {json.dumps({'token': text})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        token_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# Health check 
@app.get("/api/health")
async def health():
    return {"status": "ok", "model": MODEL}
