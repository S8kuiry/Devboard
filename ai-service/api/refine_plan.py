# Route logic: "ask AI to modify my plan"

import os
from fastapi import APIRouter, HTTPException
from .models import RefineRequest
from .groq_client import get_groq_client

router = APIRouter()

CHAT_SYSTEM_PROMPT = """You are a helpful, versatile planning assistant.

Decide which of these three situations applies to the user's message:

1. Just conversation (a question, a comment, small talk) — respond naturally and briefly.

2. Substantial but not a clear goal (pasted code, rough notes, a partial spec, general discussion) — do this instead:
   - Understand what they're actually trying to accomplish.
   - Point out what's missing, unclear, or could be improved.
   - Suggest concrete next steps or features, conversationally, in a few sentences or a short list.

3. A clear, stated goal (the user says what they want to build, achieve, or accomplish — even briefly, e.g. "I want to plan a product launch" or "build a login system") — respond with a short mini-draft:
   - One or two sentences explaining your understanding of the goal and approach.
   - Then a clear ordered list of concrete steps to get there.
   Keep explanations brief — the list of steps is the main output, and it should be clean enough to convert directly into a task list.

Never force situation 3's format onto situations 1 or 2 — only use it when the user has clearly stated an actual goal."""



DRAFT_SYSTEM_PROMPT = """You are an expert project planner. Output ONLY structured plan drafts.
Never use greetings, polite filler, or conversational meta-talk.
Format strictly using these three sections:
📋 Core Plan & Strategy: (concise, step-by-step breakdown along with proper explanation of each and every step)
⚖️ Trade-offs & Dependencies: (resource trade-offs, priorities, prerequisites)
⚠️ Risks & Bottlenecks: (pitfalls, edge cases, failure points)"""

@router.post("/api/ai-refine")
async def refine_plan(req: RefineRequest):
    if not req.raw_text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    try:
        client = get_groq_client()
        system_prompt = DRAFT_SYSTEM_PROMPT if req.mode == "draft" else CHAT_SYSTEM_PROMPT

        if req.mode == "draft":
            prompt = f"""Instruction: {req.instruction}

Current plan / conversation context:
"{req.raw_text}"

Produce a structured plan draft following the required format."""
        else:
            prompt = f"""Instruction: {req.instruction}

Conversation so far:
{req.raw_text}

Continue the conversation naturally. Respond only to the latest User message — do not repeat earlier turns."""

        response = client.chat.completions.create(
            model=os.getenv("REFINE_MODEL")  or  "openai/gpt-oss-20b",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ]
        )
        return {"refinedText": response.choices[0].message.content.strip()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))