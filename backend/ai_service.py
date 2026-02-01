import warnings
# Suppress FutureWarning from deprecated google.generativeai
warnings.filterwarnings('ignore', category=FutureWarning)
warnings.filterwarnings('ignore', category=UserWarning, module='google.generativeai')

import os
import json
import re
import uuid
import datetime
from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any

# Optional imports for providers
try:
    import google.generativeai as genai
except ImportError:
    genai = None

try:
    from openai import OpenAI
except ImportError:
    OpenAI = None

try:
    import anthropic
except ImportError:
    anthropic = None

try:
    import httpx
except ImportError:
    httpx = None

# Paths
DATA_FILE = os.path.join(os.path.dirname(__file__), '..', 'data', 'categories.json')
CONFIG_FILE = os.path.join(os.path.dirname(__file__), '..', 'data', 'system_config.json')

# --- Utilities ---

def load_categories():
    try:
        if os.path.exists(DATA_FILE):
            with open(DATA_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)['categories']
    except Exception as e:
        print(f"Error loading categories: {e}")
    return []

def get_macro_category(detected_pii):
    """Maps detected PII to macro categories for better visualization"""
    personal_data = ["CPF", "RG", "Email", "Telefone", "Endereço", "CEP", "CNH", 
                     "Passaporte", "Título de Eleitor", "Certidão de Nascimento"]
    banking_data = ["Conta Bancária", "PIX (UUID)", "Cartão de Crédito"]
    health_data = ["Prontuário Médico", "Dados de Paciente"]
    vehicle_data = ["Placa de Veículo (antiga)", "Placa de Veículo (Mercosul)"]
    
    for pii in detected_pii:
        if pii == "Prontuário Médico":
            return "Prontuário Médico"
    
    for pii in detected_pii:
        if pii == "Conflitos Familiares":
            return "Dados Sensíveis (Violência Doméstica)"

    for pii in detected_pii:
        if pii in health_data:
            return "Dados de Saúde"
    
    for pii in detected_pii:
        if pii in banking_data:
            return "Dados Bancários"
    
    for pii in detected_pii:
        if pii in personal_data:
            return "Dados Pessoais"
    
    for pii in detected_pii:
        if pii in vehicle_data:
            return "Dados Veiculares"
    
    return "Público"

# --- Provider Base Class ---

class LLMProvider(ABC):
    @abstractmethod
    def classify_text(self, text: str, categories: List[Dict]) -> Optional[Dict]:
        pass

    @abstractmethod
    def analyze_privacy(self, text: str, enabled_list: str) -> Dict[str, Any]:
        pass

# --- Gemini Provider (Current) ---

class GeminiProvider(LLMProvider):
    def __init__(self, api_key: str, model_name: str = "gemini-2.0-flash"):
        self.api_key = api_key
        self.model_name = model_name
        if genai:
            genai.configure(api_key=api_key)

    def classify_text(self, text: str, categories: List[Dict]) -> Optional[Dict]:
        if not genai: return None
        try:
            model = genai.GenerativeModel(self.model_name)
            cat_list = ", ".join([f"{c['id']} ({', '.join(c['subcategories'])})" for c in categories])
            prompt = f"""
            Classify the following text into one of these categories: {cat_list}.
            Return JSON format: {{"id": "Category", "subcategory": "Subcategory"}}.
            Text: "{text}"
            """
            response = model.generate_content(prompt)
            return self._parse_classification(response.text, categories)
        except Exception as e:
            print(f"Gemini Error: {e}")
            return None

    def analyze_privacy(self, text: str, enabled_list: str) -> Dict[str, Any]:
        if not genai: return {"error": "Library not installed"}
        try:
            model = genai.GenerativeModel(self.model_name)
            prompt = self._get_privacy_prompt(text, enabled_list)
            response = model.generate_content(prompt)
            return self._parse_json(response.text)
        except Exception as e:
            print(f"Gemini Privacy Error: {e}")
            return {"error": str(e)}

    def _parse_classification(self, content: str, categories: List[Dict]) -> Optional[Dict]:
        data = self._parse_json(content)
        if not data: return None
        for cat in categories:
            if cat['id'] == data.get('id'):
                result = cat.copy()
                sub = data.get('subcategory')
                result['selected_subcategory'] = sub if sub in cat['subcategories'] else cat['subcategories'][0]
                return result
        return None

    def _parse_json(self, content: str) -> Dict:
        content = content.strip()
        if content.startswith("```json"): content = content[7:-3].strip()
        elif content.startswith("```"): content = content[3:-3].strip()
        try:
            return json.loads(content)
        except:
            return {}

    def _get_privacy_prompt(self, text, enabled_list):
        return f"""
        Analyze the following text for Personal Identifiable Information (PII) or sensitive personal contexts.
        Strictly follow the Brazilian LGPD and Access to Information Law standards.

        **IMPORTANT**: Only detect and report the following PII types: {enabled_list}
        Ignore any other types of PII that are not in this list.

        Criteria for 'Sensitive' (Sigiloso):
        - Identity Documents: CPF, RG, CNH, Passaporte, Título Eleitor, Certidões.
        - Contact Info: Email, Telefone, Endereço, CEP.
        - Financial Data: Conta Bancária, Cartão de Crédito, Chave PIX.
        - Vehicles: Placas.
        - Health & Specifics: Prontuário Médico, Dados de Paciente, Violência Doméstica.

        Return JSON:
        {{
            "is_sensitive": boolean, 
            "privacy_status": "Sigiloso" | "Público",
            "reason": "Short explanation (PT-BR)",
            "detected_pii": ["List ONLY the enabled types detected"]
        }}
        Text: "{text}"
        """

# --- OpenAI Provider (and DeepSeek) ---

class OpenAIProvider(LLMProvider):
    def __init__(self, api_key: str, model_name: str = "gpt-4o", base_url: str = None):
        self.client = OpenAI(api_key=api_key, base_url=base_url) if OpenAI else None
        self.model_name = model_name

    def classify_text(self, text: str, categories: List[Dict]) -> Optional[Dict]:
        if not self.client: return None
        try:
            cat_list = ", ".join([f"{c['id']} ({', '.join(c['subcategories'])})" for c in categories])
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[{"role": "user", "content": f"Classify into JSON {{\"id\": \"Cat\", \"subcategory\": \"Sub\"}} using categories: {cat_list}\nText: {text}"}],
                response_format={"type": "json_object"}
            )
            data = json.loads(response.choices[0].message.content)
            for cat in categories:
                if cat['id'] == data.get('id'):
                    res = cat.copy()
                    sub = data.get('subcategory')
                    res['selected_subcategory'] = sub if sub in cat['subcategories'] else cat['subcategories'][0]
                    return res
        except Exception as e:
            print(f"OpenAI Error: {e}")
        return None

    def analyze_privacy(self, text: str, enabled_list: str) -> Dict[str, Any]:
        if not self.client: return {"error": "Library not installed"}
        try:
            prompt = GeminiProvider._get_privacy_prompt(None, text, enabled_list)
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"}
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            return {"error": str(e)}

# --- Anthropic Provider ---

class AnthropicProvider(LLMProvider):
    def __init__(self, api_key: str, model_name: str = "claude-3-5-sonnet-20240620"):
        self.client = anthropic.Anthropic(api_key=api_key) if anthropic else None
        self.model_name = model_name

    def classify_text(self, text: str, categories: List[Dict]) -> Optional[Dict]:
        if not self.client: return None
        try:
            cat_list = ", ".join([f"{c['id']} ({', '.join(c['subcategories'])})" for c in categories])
            prompt = f"Classify this text into one of these categories: {cat_list}. Return ONLY JSON: {{\"id\": \"Category\", \"subcategory\": \"Subcategory\"}}.\nText: {text}"
            message = self.client.messages.create(
                model=self.model_name, max_tokens=1000,
                messages=[{"role": "user", "content": prompt}]
            )
            content = message.content[0].text
            data = json.loads(content[content.find('{'):content.rfind('}')+1])
            for cat in categories:
                if cat['id'] == data.get('id'):
                    res = cat.copy()
                    sub = data.get('subcategory')
                    res['selected_subcategory'] = sub if sub in cat['subcategories'] else cat['subcategories'][0]
                    return res
        except: return None
        return None

    def analyze_privacy(self, text: str, enabled_list: str) -> Dict[str, Any]:
        if not self.client: return {"error": "Library not installed"}
        try:
            prompt = GeminiProvider._get_privacy_prompt(None, text, enabled_list) + "\nReturn ONLY JSON."
            message = self.client.messages.create(
                model=self.model_name, max_tokens=1000,
                messages=[{"role": "user", "content": prompt}]
            )
            content = message.content[0].text
            return json.loads(content[content.find('{'):content.rfind('}')+1])
        except Exception as e:
            return {"error": str(e)}

# --- Ollama Provider ---

class OllamaProvider(LLMProvider):
    def __init__(self, model_name: str = "llama3", base_url: str = "http://localhost:11434"):
        self.model_name = model_name
        self.base_url = f"{base_url}/api/generate"

    def classify_text(self, text: str, categories: List[Dict]) -> Optional[Dict]:
        try:
            cat_list = ", ".join([f"{c['id']} ({', '.join(c['subcategories'])})" for c in categories])
            prompt = f"Classify into JSON {{\"id\": \"Cat\", \"subcategory\": \"Sub\"}} using: {cat_list}\nText: {text}"
            response = httpx.post(self.base_url, json={"model": self.model_name, "prompt": prompt, "stream": False, "format": "json"})
            data = response.json()
            result_json = json.loads(data['response'])
            for cat in categories:
                if cat['id'] == result_json.get('id'):
                    res = cat.copy()
                    sub = result_json.get('subcategory')
                    res['selected_subcategory'] = sub if sub in cat['subcategories'] else cat['subcategories'][0]
                    return res
        except: return None
        return None

    def analyze_privacy(self, text: str, enabled_list: str) -> Dict[str, Any]:
        try:
            prompt = GeminiProvider._get_privacy_prompt(None, text, enabled_list)
            response = httpx.post(self.base_url, json={"model": self.model_name, "prompt": prompt, "stream": False, "format": "json"})
            return json.loads(response.json()['response'])
        except Exception as e:
            return {"error": str(e)}

# --- Factory & Fallbacks ---

class ProviderFactory:
    @staticmethod
    def get_provider() -> Optional[LLMProvider]:
        config = {}
        if os.path.exists(CONFIG_FILE):
            try:
                with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
                    config = json.load(f)
            except: pass
        
        provider_type = config.get("llm_provider", "gemini")
        model_name = config.get("llm_model")
        
        if provider_type == "gemini":
            key = config.get("gemini_api_key") or os.environ.get("GEMINI_API_KEY")
            if key: return GeminiProvider(key, model_name or "gemini-2.0-flash")
        
        elif provider_type == "openai":
            key = config.get("openai_api_key") or os.environ.get("OPENAI_API_KEY")
            if key: return OpenAIProvider(key, model_name or "gpt-4o")
            
        elif provider_type == "anthropic":
            key = config.get("anthropic_api_key") or os.environ.get("ANTHROPIC_API_KEY")
            if key: return AnthropicProvider(key, model_name or "claude-3-5-sonnet-20240620")
            
        elif provider_type == "ollama":
            return OllamaProvider(model_name or "llama3", config.get("ollama_url", "http://localhost:11434"))

        # Last resort: Try Gemini if env var exists even if not in config
        key = os.environ.get("GEMINI_API_KEY")
        if key: return GeminiProvider(key)
        
        return None

# --- Main Functions (Preserving Interface) ---

def classify_text(text):
    categories = load_categories()
    provider = ProviderFactory.get_provider()
    
    if provider:
        result = provider.classify_text(text, categories)
        if result: return result
        
    # Fallback: Keyword Matching
    text_lower = text.lower()
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
        score = sum(1 for w in words if w in text_lower)
        if score > max_score:
            max_score = score
            best_match = cat_id
    if best_match:
        for cat in categories:
            if cat['id'] == best_match:
                res = cat.copy()
                res['selected_subcategory'] = cat['subcategories'][0]
                return res
    return None

def analyze_privacy(text, enabled_pii_types=None):
    pii_pattern_map = {
        "cpf": (r'\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b', "CPF"),
        "rg": (r'\b\d{1,2}\.?\d{3}\.?\d{3}-?[0-9X]\b', "RG"),
        "email": (r'[\w.-]+@[\w.-]+\.\w+', "Email"),
        "phone": (r'\(?0?\d{2}\)?[\s-]?9?\d{4}[\s-]\d{4}\b', "Telefone"),
        "address": (r'(?i)(Rua|Av|Avenida|Alameda|Travessa)\s+[A-Z][a-z]+', "Endereço"), # Simplified for file size
        "bank_account": (r'\b\d{4,5}[-\s]\d{1}\b', "Conta Bancária"),
        "pix": (r'\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b', "PIX")
    }
    
    # Load config if needed
    if enabled_pii_types is None:
        try:
            if os.path.exists(CONFIG_FILE):
                with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
                    enabled_pii_types = json.load(f).get('enabled_pii_types')
        except: pass
    if enabled_pii_types is None: enabled_pii_types = list(pii_pattern_map.keys())

    # Offline Check
    detected = []
    for pii_id in enabled_pii_types:
        if pii_id in pii_pattern_map:
            pat, name = pii_pattern_map[pii_id]
            if re.search(pat, text, re.IGNORECASE if pii_id != "address" else 0):
                if name not in detected: detected.append(name)

    provider = ProviderFactory.get_provider()
    if provider:
        enabled_list = ", ".join(detected) if detected else "todos"
        result = provider.analyze_privacy(text, enabled_list)
        if "error" not in result:
            result['category'] = get_macro_category(result.get('detected_pii', []))
            return result

    # Offline Result
    if detected:
        return {
            "is_sensitive": True, "privacy_status": "Sigiloso",
            "category": get_macro_category(detected),
            "reason": f"Dados detectados via regex: {', '.join(detected)}",
            "detected_pii": detected
        }
    return {"is_sensitive": False, "privacy_status": "Público", "category": "Público", "reason": "Nenhum dado detectado", "detected_pii": []}

def classify_and_filter(text, enabled_pii_types=None):
    return analyze_privacy(text, enabled_pii_types=enabled_pii_types)

