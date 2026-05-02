import os
import json
import base64
import io
import csv
import logging
import functools
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
import vertexai
from vertexai.generative_models import GenerativeModel, Part
import firebase_admin
from firebase_admin import credentials, firestore

# Configure structured logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Firebase Admin
try:
    firebase_admin.initialize_app()
    logger.info("Firebase Admin initialized successfully.")
except ValueError:
    pass # App already initialized

# Initialize Vertex AI
project_id = os.environ.get("GOOGLE_CLOUD_PROJECT", "geometric-ivy-446517-q0-a1a40")
location = os.environ.get("GOOGLE_CLOUD_LOCATION", "us-central1")

try:
    vertexai.init(project=project_id, location=location)
    logger.info("Vertex AI initialized successfully.")
except Exception as e:
    logger.warning(f"Failed to initialize Vertex AI: {e}")

app = FastAPI(
    title="Nexus AI Backend",
    description="Backend API for the Nexus AI Team Collaboration Tool.",
    version="2.0.0"
)

# Secure CORS configuration
origins = [
    "http://localhost:5173",
    "http://localhost:8000",
    "https://geometric-ivy-446517-q0-a1a40.web.app",
    "https://geometric-ivy-446517-q0-a1a40.firebaseapp.com"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

class TaskPrompt(BaseModel):
    """Schema for a standard text-based task generation request."""
    prompt: str = Field(..., min_length=1, max_length=1000, description="The user's input prompt for task generation.")

class VisionTaskPrompt(BaseModel):
    """Schema for a multi-modal vision task generation request."""
    prompt: str = Field(..., min_length=1, max_length=1000, description="Optional prompt or context for the image.")
    image_base64: str = Field(..., description="Base64 encoded string of the uploaded image.")
    mime_type: str = Field(..., description="MIME type of the uploaded image (e.g., image/jpeg).")

@functools.lru_cache(maxsize=100)
def cached_generate_text_tasks(prompt: str) -> str:
    """
    Helper function to generate tasks using Vertex AI and cache the results in memory.
    This improves efficiency by preventing redundant API calls for duplicate prompts.
    """
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
    response = model.generate_content(f"{system_instruction}\n\nUser Prompt: {prompt}")
    return response.text.strip()

def _clean_json_response(raw_text: str) -> dict:
    """Helper to strip markdown wrappers from LLM JSON responses."""
    if raw_text.startswith("```json"):
        raw_text = raw_text[7:]
    if raw_text.startswith("```"):
        raw_text = raw_text[3:]
    if raw_text.endswith("```"):
        raw_text = raw_text[:-3]
    return json.loads(raw_text.strip())

@app.post("/api/generate-tasks", summary="Generate tasks from text prompt")
async def generate_tasks(prompt_request: TaskPrompt):
    """
    Endpoint to generate 5 actionable tasks from a user text prompt using Vertex AI (Gemini 1.5 Flash).
    Implements LRU caching and strict Pydantic validation.
    """
    try:
        raw_text = cached_generate_text_tasks(prompt_request.prompt)
        tasks = _clean_json_response(raw_text)
        return {"tasks": tasks}
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse JSON from LLM: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
    except Exception as e:
        logger.error(f"Error generating tasks: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal Server Error")

@app.post("/api/generate-tasks-vision", summary="Generate tasks from an image")
async def generate_tasks_vision(prompt_request: VisionTaskPrompt):
    """
    Endpoint to generate tasks from an uploaded image (e.g., whiteboard) using Vertex AI (Gemini 1.5 Pro).
    """
    try:
        model = GenerativeModel("gemini-1.5-pro")
        system_instruction = """
        You are an AI task generator for a team collaboration tool.
        Analyze the provided image (e.g., whiteboard notes, diagrams) and the user prompt.
        Extract and generate exactly 5 distinct, actionable tasks based on the image content.
        Return the result as a raw JSON array of objects.
        Each object must have:
        - "title": A short, clear task title (string).
        - "description": A brief description of the task (string).
        - "status": "todo" (string).
        Do not include markdown formatting. Just the raw JSON.
        """
        
        image_data = base64.b64decode(prompt_request.image_base64)
        image_part = Part.from_data(data=image_data, mime_type=prompt_request.mime_type)
        
        response = model.generate_content(
            [system_instruction, image_part, f"User Prompt: {prompt_request.prompt}"]
        )
        
        tasks = _clean_json_response(response.text.strip())
        return {"tasks": tasks}
        
    except Exception as e:
        logger.error(f"Error generating tasks from vision: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal Server Error")

@app.get("/api/export-tasks", summary="Export tasks to CSV")
async def export_tasks():
    """
    Endpoint to export all current tasks from Firestore to a downloadable CSV file.
    """
    try:
        db = firestore.client()
        tasks_ref = db.collection("tasks").order_by("createdAt", direction=firestore.Query.DESCENDING).stream()
        
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Title", "Description", "Status", "AI Generated"])
        
        for task in tasks_ref:
            task_dict = task.to_dict()
            writer.writerow([
                task_dict.get("title", ""),
                task_dict.get("description", ""),
                task_dict.get("status", ""),
                "Yes" if task_dict.get("isAI") else "No"
            ])
            
        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=nexus_tasks.csv"}
        )
    except Exception as e:
        logger.error(f"Error exporting tasks to CSV: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal Server Error")

# Mount frontend
FRONTEND_DIST = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "dist")
if os.path.isdir(FRONTEND_DIST):
    app.mount("/", StaticFiles(directory=FRONTEND_DIST, html=True), name="frontend")
else:
    @app.get("/")
    def root():
        """Root fallback endpoint when frontend is not built."""
        return {"message": "Nexus AI API is running. Frontend not built yet."}
