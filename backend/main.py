from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import os
import sys
import csv
import datetime
import uuid
from typing import List, Optional
import json

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
    enabled_pii_types: Optional[List[str]] = None  # Optional list of enabled PII type IDs

# --- CSV Logging Setup ---
# backend/main.py -> ../data/classifications.csv
LOG_FILE = os.path.join(os.path.dirname(__file__), '..', 'data', 'classifications.csv')
CONFIG_FILE = os.path.join(os.path.dirname(__file__), '..', 'data', 'system_config.json')

def log_to_csv(data):
    """
    Logs classification result to CSV.
    Fields: id, timestamp, type, category, privacy, privacy_reason, text_snippet
    """
    file_exists = os.path.exists(LOG_FILE)
    
    # Ensure id is present
    submission_id = data.get('id', str(uuid.uuid4()))
    
    with open(LOG_FILE, mode='a', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        if not file_exists:
            writer.writerow(['id', 'timestamp', 'type', 'category', 'privacy', 'privacy_reason', 'text_snippet'])
            
        writer.writerow([
            submission_id,
            datetime.datetime.now().isoformat(),
            data.get('type', 'Texto'),
            data.get('category', 'Geral'),
            data.get('privacy', 'Desconhecido'),
            data.get('reason', ''),
            data.get('text', '') # Full text
        ])
    return submission_id

@app.get("/data/classifications.csv")
async def download_csv(x_admin_password: Optional[str] = Header(None)):
    """
    Endpoint to download the CSV file.
    """
    if x_admin_password != "admin123":
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    from fastapi.responses import FileResponse
    if os.path.exists(LOG_FILE):
        return FileResponse(
            LOG_FILE, 
            media_type='text/csv',
            filename='classifications.csv'
        )
    else:
        raise HTTPException(status_code=404, detail="CSV file not found")

@app.get("/api/dashboard-data")
async def get_dashboard_data(x_admin_password: Optional[str] = Header(None), privacy_filter: Optional[str] = None):
    """
    Returns aggregated data for the dashboard from the CSV log.
    Supports filtering by privacy status.
    """
    if x_admin_password != "admin123":
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    if not os.path.exists(LOG_FILE):
        return {
            "total_count": 0,
            "privacy_counts": {"Público": 0, "Sigiloso": 0},
            "category_counts": {},
            "recent_logs": []
        }
        
    try:
        total_count = 0
        privacy_counts = {"Público": 0, "Sigiloso": 0}
        category_counts = {}
        recent_logs = []
        
        with open(LOG_FILE, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            rows = list(reader)
            
            filtered_rows = []
            
            for row in rows:
                p_status = row.get('privacy', 'Público')
                if 'Sigiloso' in p_status: p_status = 'Sigiloso'
                elif 'Público' in p_status: p_status = 'Público'
                
                cat = row.get('category', 'Geral')
                text_snippet = row.get('text_snippet', '').lower()
                detected_pii = row.get('category', '').lower()

                # Apply Filter
                if privacy_filter and privacy_filter != "Todos":
                    # Standard Status Filter
                    if privacy_filter in ["Sigiloso", "Público"]:
                        if p_status != privacy_filter:
                            continue
                    
                    # Advanced Deep Search Filter
                    else:
                        match_found = False
                        filter_lower = privacy_filter.lower()
                        
                        # 1. Broad Category Keywords Map
                        keywords = []
                        if privacy_filter == "Dados Pessoais":
                            keywords = ["dados pessoais", "cpf", "rg", "email", "e-mail", "telefone", "celular", "endereço", "cep", "passaporte", "eleitor", "nascimento", "cnh", "nome completo", "nome"]
                        elif privacy_filter == "Dados Bancários":
                            keywords = ["dados bancários", "conta bancária", "cartão de crédito", "pix", "banco", "agência", "conta"]
                        elif privacy_filter == "Dados Veiculares":
                            keywords = ["dados veiculares", "placa", "renavam", "veículo"]
                        elif privacy_filter == "Dados de Saúde":
                            keywords = ["dados de saúde", "prontuário", "paciente", "médico", "doença", "exame", "atestado", "saúde"]
                        elif privacy_filter == "Dados Sensíveis (Violência Doméstica)":
                            keywords = ["violência doméstica", "conflitos familiares", "agressão", "medida protetiva"]
                        else:
                            # Specific Filter (e.g. "CPF", "Pix") - Add direct keyword
                            # We replace some common terms for better matching
                            clean_filter = filter_lower.replace("e-mail", "email").replace("pix", "pix")
                            keywords = [filter_lower, clean_filter]

                        # 2. Check for Keyword in Category Label OR Privacy Reason OR Text Snippet
                        # This ensures "Pix" finds rows with "Chave Pix" even if category is "Geral"
                        privacy_reason = row.get('privacy_reason', '').lower()
                        for k in keywords:
                            if k in detected_pii or k in text_snippet or k in privacy_reason:
                                match_found = True
                                break
                        
                        if not match_found:
                            continue

                filtered_rows.append(row)

                # Stats calculation
                privacy_counts[p_status] = privacy_counts.get(p_status, 0) + 1
                
                # Macro Category Mapping for Charts
                main_cat = "Público"
                if p_status == "Sigiloso":
                    cat_lower = cat.lower()
                    if any(k in cat_lower for k in ["prontuário", "paciente", "saúde"]):
                        main_cat = "Dados de Saúde"
                    elif any(k in cat_lower for k in ["banco", "conta", "agência", "pix", "cartão"]):
                        main_cat = "Dados Bancários"
                    elif any(k in cat_lower for k in ["veículo", "placa", "renavam"]):
                        main_cat = "Dados Veiculares"
                    elif any(k in cat_lower for k in ["violência", "agressão", "medida protetiva"]):
                        main_cat = "Dados Sensíveis (Violência Doméstica)"
                    else:
                        # Default to Personal Data if it's sensitive but doesn't match above
                        main_cat = "Dados Pessoais"
                
                category_counts[main_cat] = category_counts.get(main_cat, 0) + 1

            total_count = len(filtered_rows)
            recent_logs = filtered_rows[-50:][::-1]
            
        return {
            "total_count": total_count,
            "privacy_counts": privacy_counts,
            "category_counts": category_counts,
            "recent_logs": recent_logs
        }
            
    except Exception as e:
        print(f"Error reading log file: {e}")
        return {
            "total_count": 0,
            "error": str(e)
        }

@app.get("/api/submissions")
async def get_submissions():
    """
    Returns all submissions from CSV for the 'My Submissions' view.
    Formats data to match the frontend's submission structure.
    """
    if not os.path.exists(LOG_FILE):
        return {"submissions": []}
        
    try:
        submissions = []
        
        with open(LOG_FILE, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            rows = list(reader)
            
            # Reverse to show newest first
            for row in reversed(rows):
                # Format to match frontend structure
                submission = {
                    "id": row.get('id', '')[:8],  # Short ID for display
                    "date": datetime.datetime.fromisoformat(row.get('timestamp', '')).strftime('%d/%m/%Y %H:%M:%S') if row.get('timestamp') else '',
                    "text": row.get('text_snippet', ''),
                    "type": row.get('type', 'Texto'),
                    "category": row.get('category', 'Geral'),
                    "privacy": row.get('privacy', 'Público')
                }
                submissions.append(submission)
            
        return {"submissions": submissions}
            
    except Exception as e:
        print(f"Error reading submissions: {e}")
        return {
            "submissions": [],
            "error": str(e)
        }



@app.post("/api/classify")
async def classify(request: ClassificationRequest):
    from ai_service import classify_and_filter
    result = classify_and_filter(request.text, enabled_pii_types=request.enabled_pii_types)
    
    if result:
        # Generate temporary UUID for this classification session
        # This is NOT yet logged to CSV
        result['id'] = str(uuid.uuid4())
        return result
    else:
        # Return a generic "Uncategorized" response
        return {
            "id": str(uuid.uuid4()),
            "name": "Não Identificado",
            "description": "Não foi possível identificar a categoria automaticamente.",
            "subcategories": [],
            "is_sensitive": False,
            "privacy_status": "Público"
        }

class SubmissionData(BaseModel):
    id: str
    text: str
    type: str = "Texto"
    category: str = "Geral"
    privacy: str = "Público"
    reason: str = ""

@app.post("/api/submit")
async def submit_manifestation(data: SubmissionData):
    """
    Permanently logs a manifestation to the CSV file.
    """
    try:
        submission_id = log_to_csv(data.dict())
        return {"status": "success", "id": submission_id}
    except Exception as e:
        print(f"Error submitting to CSV: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save submission: {str(e)}")

# --- Configuration Endpoints ---

@app.get("/api/config")
async def get_config():
    """Returns the current system configuration."""
    default_config = {
        "enabled_pii_types": [],
        "llm_provider": "gemini",
        "llm_model": "gemini-2.0-flash",
        "ollama_url": "http://localhost:11434",
        "gemini_api_key": "",
        "openai_api_key": "",
        "anthropic_api_key": ""
    }
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
                config = json.load(f)
                # Merge with defaults
                merged = default_config.copy()
                merged.update(config)
                return merged
        except Exception:
            return default_config
    return default_config

class ConfigUpdate(BaseModel):
    enabled_pii_types: List[str]
    llm_provider: Optional[str] = "gemini"
    llm_model: Optional[str] = "gemini-2.0-flash"
    ollama_url: Optional[str] = "http://localhost:11434"
    gemini_api_key: Optional[str] = ""
    openai_api_key: Optional[str] = ""
    anthropic_api_key: Optional[str] = ""

@app.post("/api/config")
async def update_config(config: ConfigUpdate, x_admin_password: Optional[str] = Header(None)):
    """Updates the system configuration."""
    if x_admin_password != "admin123":
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    try:
        with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
            json.dump(config.dict(), f, indent=4)
        return {"status": "success", "config": config.dict()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/admin.html")
@app.get("/admin_new.html")
async def get_old_admin():
    raise HTTPException(status_code=404, detail="Administração consolidada em /admin")

# Admin access
@app.get("/admin")
@app.get("/admin_final.html")
async def get_admin_dashboard():
    from fastapi.responses import FileResponse
    admin_path = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'admin_final.html')
    if os.path.exists(admin_path):
        return FileResponse(admin_path)
    raise HTTPException(status_code=404, detail="Admin page not found")

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
