# FastAPI entrypoint (imports routers & mounts app)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from api.convert_steps import router as convert_router
from api.refine_plan import router as refine_router

app = FastAPI(title="AI Service for Devboard")
# Full Permissive CORS Policy
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(convert_router)
app.include_router(refine_router)



@app.get("/")
async def root():
    return {"status": "online", "service": "AI Service for Devboard"}

# Run locally on custom port
if __name__ == "__main__":
    uvicorn.run("index:app", host="0.0.0.0", port=8000, reload=True)