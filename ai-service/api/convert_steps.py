import json
import os
from fastapi import APIRouter, HTTPException
from .models import ConvertRequest
from .groq_client import get_groq_client


router = APIRouter()

@router.post("/api/convert-steps")
async def convert_steps(req: ConvertRequest):
    if not req.raw_text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    try:
        client = get_groq_client()
        prompt = f"""
        Extract discrete, sequential, actionable execution steps from these raw developer notes.
        Extract discrete, sequential, actionable execution steps from these raw developer notes.

        Rules:
        - Remove conversational fillers and transition words such as "first", "then", and "after that".
        - Return each distinct action as a separate step.
        - Preserve the chronological order.
        - Each step must be a concise, complete sentence.
        - Each step must end with a period.
        - Do not include numbering or bullet characters.
        - Return only the JSON object matching the required schema.

        Raw Notes:
        "{req.raw_text}"
        """

        response = client.chat.completions.create(
            model=os.getenv("CONVERT_MODEL")  or  "openai/gpt-oss-20b",
            response_format={"type": "json_object"},
            messages=[
                {
                    "role": "system",
                    "content": 'You are a technical project parser. Output strict JSON with key "steps" containing a list of step strings. Example: {"steps": ["Step 1", "Step 2"]}'
                },
                {"role": "user", "content": prompt}
            ]
        )

        result = json.loads(response.choices[0].message.content)
        return {"steps": result.get("steps", [])}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))