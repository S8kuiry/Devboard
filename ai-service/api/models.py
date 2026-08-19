# Pydantic request/response schemas
from pydantic import BaseModel
class ConvertRequest(BaseModel):
    raw_text:str

class RefineRequest(BaseModel):
    raw_text: str
    instruction: str = "Fix technical typos, structure chronologically, and clarify missing engineering details."
    mode: str = "chat"  # "chat" or "draft"