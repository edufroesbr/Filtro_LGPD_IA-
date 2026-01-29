from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import os
import sys

# Add current directory to path to import ai_service
sys.path.append(os.path.dirname(__file__))

from ai_service import classify_text

app = FastAPI(title="Participa DF API")

"""
Participa DF API
----------------
This is the backend service for the Participa DF PWA.
它 connects the frontend to the Google Gemini API for intelligent classification
of citizen requests.

Endpoints:
- POST /api/classify: Classifies text into categories/subcategories.
- /: Serves the static frontend files.
"""

# Enable CORS for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Input model
class ClassificationRequest(BaseModel):
    text: str
    enabled_pii_types: list[str] = None  # Optional list of enabled PII type IDs

@app.post("/api/classify")
async def classify(request: ClassificationRequest):
    from ai_service import classify_and_filter
    result = classify_and_filter(request.text, enabled_pii_types=request.enabled_pii_types)
    if result:
        return result
    else:
        # Return a generic "Uncategorized" response or 404
        # For UI friendliness, we return a special object
        return {
            "id": "unknown",
            "name": "Não Identificado",
            "description": "Não foi possível identificar a categoria automaticamente.",
            "subcategories": []
        }

# Mount static files (Frontend)
# backend/main.py -> ../frontend
frontend_path = os.path.join(os.path.dirname(__file__), '..', 'frontend')
if os.path.exists(frontend_path):
    app.mount("/", StaticFiles(directory=frontend_path, html=True), name="frontend")
else:
    print(f"Warning: Frontend path {frontend_path} does not exist.")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
