# Route logic: "ask AI to modify my plan"


from fastapi import APIRouter, HTTPException
from .models import RefineRequest
from .groq_client import get_groq_client

router = APIRouter()

@router.post("/api/ai-refine")
async def refine_plan(req: RefineRequest):
    if not req.raw_text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    try:
        client = get_groq_client()
        prompt = f"""
        Instruction: {req.instruction}

        Current Plan Text:
        "{req.raw_text}"

        Rewrite and enhance the plan while keeping all technical details intact. Return ONLY the enhanced text paragraph.
        """

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a senior software architect helping a developer refine their task execution plan."},
                {"role": "user", "content": prompt}
            ]
        )

        return {"refinedText": response.choices[0].message.content.strip()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))