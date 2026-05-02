import os
import json
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import vertexai
from vertexai.generative_models import GenerativeModel
import firebase_admin
from firebase_admin import credentials

# Initialize Firebase Admin
# When running on Cloud Run, default credentials are used.
try:
    firebase_admin.initialize_app()
except ValueError:
    pass # App already initialized

# Initialize Vertex AI
# Project ID and Location can be inferred from the environment or specified via env vars
project_id = os.environ.get("GOOGLE_CLOUD_PROJECT", "your-project-id")
location = os.environ.get("GOOGLE_CLOUD_LOCATION", "us-central1")

try:
    vertexai.init(project=project_id, location=location)
except Exception as e:
    print(f"Warning: Failed to initialize Vertex AI: {e}")

app = FastAPI(title="Nexus AI Backend")

# Allow CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TaskPrompt(BaseModel):
    prompt: str

@app.post("/api/generate-tasks")
async def generate_tasks(prompt_request: TaskPrompt):
    try:
        model = GenerativeModel("gemini-1.5-flash")
        
        system_instruction = """
        You are an AI task generator for a team collaboration tool.
        Given a user prompt, generate exactly 5 distinct, actionable tasks.
        Return the result as a raw JSON array of objects.
        Each object must have:
        - "title": A short, clear task title (string).
        - "description": A brief description of the task (string).
        - "status": "todo" (string).
        Do not include markdown formatting like ```json ... ```. Just the raw JSON.
        """
        
        response = model.generate_content(
            f"{system_instruction}\n\nUser Prompt: {prompt_request.prompt}"
        )
        
        # Clean up possible markdown wrapper
        raw_text = response.text.strip()
        if raw_text.startswith("```json"):
            raw_text = raw_text[7:]
        if raw_text.startswith("```"):
            raw_text = raw_text[3:]
        if raw_text.endswith("```"):
            raw_text = raw_text[:-3]
            
        tasks = json.loads(raw_text.strip())
        return {"tasks": tasks}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Mount frontend
# We check if frontend/dist exists to mount it, otherwise we don't (useful for local dev backend only)
FRONTEND_DIST = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "dist")
if os.path.isdir(FRONTEND_DIST):
    app.mount("/", StaticFiles(directory=FRONTEND_DIST, html=True), name="frontend")
else:
    @app.get("/")
    def root():
        return {"message": "Nexus AI API is running. Frontend not built yet."}
