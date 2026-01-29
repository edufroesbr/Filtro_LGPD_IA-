import warnings
# Suppress FutureWarning from deprecated google.generativeai
warnings.filterwarnings('ignore', category=FutureWarning, module='google.generativeai')

import google.generativeai as genai
import json
import os

# Path to categories file from backend directory
# backend/ai_service.py -> ../data/categories.json
DATA_FILE = os.path.join(os.path.dirname(__file__), '..', 'data', 'categories.json')

def load_categories():
    try:
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)['categories']
    except FileNotFoundError:
        print(f"Error: Categories file not found at {DATA_FILE}")
        return []

def classify_text(text):
    """
    Classifies text using Google Gemini if API key is present,
    otherwise falls back to keyword matching.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    categories = load_categories()

    if api_key:
        try:
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel('gemini-2.0-flash')
            
            # Construct a clear prompt with valid categories
            cat_list = ", ".join([f"{c['id']} ({', '.join(c['subcategories'])})" for c in categories])
            prompt = f"""
            Classify the following text into one of these categories: {cat_list}.
            Return JSON format: {{"id": "Category", "subcategory": "Subcategory"}}.
            Text: "{text}"
            """
            
            response = model.generate_content(prompt)
            # Simple JSON extraction (could be more robust)
            content = response.text.strip()
            # Clean up potential markdown code blocks
            if content.startswith("```json"):
                content = content[7:-3].strip()
            elif content.startswith("```"):
                content = content[3:-3].strip()
                
            data = json.loads(content)
            
            # Match with loaded categories to return full object
            for cat in categories:
                if cat['id'] == data.get('id'):
                    # Create a copy to attach the specific matched subcategory
                    result = cat.copy()
                    # Determine subcategory (simple match or default)
                    sub = data.get('subcategory')
                    if sub in cat['subcategories']:
                        result['selected_subcategory'] = sub
                    else:
                        result['selected_subcategory'] = cat['subcategories'][0]
                    return result

        except Exception as e:
            print(f"Gemini API Error: {e}")
            # Fallback to keywords

    # --- Fallback: Keyword Matching ---
    text = text.lower()
    
    keywords = {
        "denuncia": ["roubo", "corrupção", "ilegal", "desvio", "assédio", "propina", "abuso"],
        "reclamacao": ["demora", "fila", "ruim", "quebrado", "falta", "mal atendido", "grosseiro"],
        "sugestao": ["poderia", "sugiro", "ideia", "melhorar", "proposta", "nova"],
        "elogio": ["ótimo", "parabéns", "excelente", "bom", "rápido", "agradecer", "eficiente"],
        "solicitacao": ["conserto", "luz", "buraco", "poda", "lixo", "asfalto", "sinalização"],
        "informacao": ["telefone", "onde", "quando", "horário", "documento", "como", "endereço"]
    }

    best_match = None
    max_score = 0

    for cat_id, words in keywords.items():
        score = sum(1 for w in words if w in text)
        if score > max_score:
            max_score = score
            best_match = cat_id
            
    return None

def analyze_privacy(text, enabled_pii_types=None):
    """
    Analyzes text for PII (Personal Identifiable Information) compliance
    according to Edital 8.1 (Public vs Sensitive).
    
    Args:
        text: The text to analyze
        enabled_pii_types: Optional list of enabled PII type IDs from user config
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    
    # Default Safe Response (Fall-back to Sensitive if unsure)
    default_response = {
        "is_sensitive": True,
        "privacy_status": "Sigiloso",
        "reason": "Análise manual necessária (IA Offline ou Indecisa)",
        "detected_pii": []
    }
    
    # Map of PII type IDs to pattern info
    pii_pattern_map = {
        # Documents
        "cpf": (r'\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b', "CPF"),
        "rg": (r'\b\d{1,2}\.?\d{3}\.?\d{3}-?[0-9X]\b', "RG"),
        "cnh": (r'\b\d{11}\b', "CNH"),
        "passport": (r'\b[A-Z]{2}\d{6}\b', "Passaporte"),
        "voter_id": (r'\b\d{12}\b', "Título de Eleitor"),
        "birth_certificate": (r'\b\d{6}\s\d{2}\s\d{2}\s\d{4}\s\d\s\d{5}\b', "Certidão de Nascimento"),
        
        # Contact Info
        "email": (r'[\w.-]+@[\w.-]+\.\w+', "Email"),
        "phone": (r'\(?\d{2}\)?\s?\d{4,5}-?\d{4}', "Telefone"),
        "cep": (r'\b\d{5}-?\d{3}\b', "CEP"),
        "address": (r'\b(?:Rua|Av\.|Avenida|Alameda|Travessa|Quadra|Lote)\s+[A-Za-zÀ-ÿ\s]+,?\s*\d+', "Endereço"),
        
        # Financial Data
        "bank_account": (r'\b\d{4}-?\d{1}\s+\d{5,}-?\d{1}\b', "Conta Bancária"),
        "credit_card": (r'\b\d{5}-?\d{6}-?\d{5}-?\d{4}\b', "Cartão de Crédito"),
        "pix": (r'\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b', "PIX (UUID)"),
        
        # Vehicles
        "plate_old": (r'\b[A-Z]{3}-?\d{4}\b', "Placa de Veículo (antiga)"),
        "plate_mercosul": (r'\b[A-Z]{3}\d[A-Z]\d{2}\b', "Placa de Veículo (Mercosul)"),
    }
    
    # If enabled_pii_types is None or empty, use all types
    if not enabled_pii_types:
        enabled_pii_types = list(pii_pattern_map.keys())

    if not api_key:
        # Advanced Offline Regex Check - only check enabled types
        import re
        
        detected = []
        for pii_id in enabled_pii_types:
            if pii_id in pii_pattern_map:
                pat, name = pii_pattern_map[pii_id]
                if re.search(pat, text, re.IGNORECASE):
                    if name not in detected:  # Avoid duplicates
                        detected.append(name)
        
        if detected:
            return {
                "is_sensitive": True,
                "privacy_status": "Sigiloso",
                "reason": f"Dados sensíveis detectados: {', '.join(detected)}",
                "detected_pii": detected
            }
        return {
            "is_sensitive": False,
            "privacy_status": "Público",
            "reason": "Nenhum dado sensível detectado",
            "detected_pii": []
        }

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.0-flash')
        
        # Build enabled types description for prompt
        enabled_types_desc = []
        type_map = {
            "cpf": "CPF", "rg": "RG", "cnh": "CNH", 
            "passport": "Passaporte", "voter_id": "Título de Eleitor",
            "birth_certificate": "Certidão de Nascimento",
            "email": "Email", "phone": "Telefone", 
            "address": "Endereço", "cep": "CEP",
            "bank_account": "Conta Bancária", "credit_card": "Cartão de Crédito", 
            "pix": "Chave PIX",
            "plate_old": "Placa de Veículo", "plate_mercosul": "Placa Mercosul",
            "name": "Nome Pessoal", "health": "Dados de Saúde", 
            "family_dispute": "Conflitos Familiares"
        }
        
        for pii_id in enabled_pii_types:
            if pii_id in type_map:
                enabled_types_desc.append(type_map[pii_id])
        
        enabled_list = ", ".join(enabled_types_desc) if enabled_types_desc else "todos os tipos"
        
        prompt = f"""
        Analyze the following text for Personal Identifiable Information (PII) or sensitive personal contexts.
        Strictly follow the Brazilian LGPD and Access to Information Law standards.

        **IMPORTANT**: Only detect and report the following PII types: {enabled_list}
        Ignore any other types of PII that are not in this list.

        Criteria for 'Sensitive' (Sigiloso):
        
        **Identity Documents** (if enabled):
        - Contains names of private individuals (not public figures)
        - Contains CPF, RG, CNH (Carteira Nacional de Habilitação)
        - Contains Passport numbers, Título de Eleitor
        - Contains birth certificates or other civil registry numbers
        
        **Contact Information** (if enabled):
        - Contains Email addresses, Phone Numbers
        - Contains physical addresses (street, number, CEP)
        
        **Financial Data** (if enabled):
        - Contains bank account numbers (agência + conta)
        - Contains credit card numbers
        - Contains PIX keys (CPF, email, phone, random key)
        
        **Vehicles** (if enabled):
        - Contains vehicle plates (old format ABC-1234 or Mercosul format ABC1D23)
        
        **Health & Personal Situations** (if enabled):
        - Contains personal health data or medical history
        - Contains descriptions of family disputes, harassment, or personal financial situations
        
        **Testing Data**:
        - Contains 'Dados Sintéticos' or mock PII patterns often used in testing

        Criteria for 'Public' (Público):
        - General complaints about infrastructure (holes, lights, trash)
        - Policy questions without personal data
        - Praise for public services without identifying other citizens
        - Questions about public processes using only protocol numbers

        Return JSON:
        {{
            "is_sensitive": boolean, 
            "privacy_status": "Sigiloso" | "Público",
            "reason": "Short explanation (PT-BR)",
            "detected_pii": ["List ONLY the enabled types detected, e.g., 'CPF', 'Email', etc."]
        }}

        Text: "{text}"
        """
        
        response = model.generate_content(prompt)
        content = response.text.strip()
        
        # Clean markdown
        if content.startswith("```json"):
            content = content[7:-3].strip()
        elif content.startswith("```"):
            content = content[3:-3].strip()
            
        return json.loads(content)

    except Exception as e:
        print(f"Gemini API Error: {e}")
        return default_response

# Main entry point helper that combines both (for backward compatibility if needed)
def classify_and_filter(text, enabled_pii_types=None):
    privacy_result = analyze_privacy(text, enabled_pii_types=enabled_pii_types)
    
    # If using old classification logic, we can merge or just return privacy
    # For Edital 8.1 focus, Privacy is paramount.
    
    return privacy_result

