import json
import os
import sys

# Path to categories file
DATA_FILE = os.path.join(os.path.dirname(__file__), '..', 'data', 'categories.json')

def load_categories():
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)['categories']

def classify_text(text):
    """
    Simulates AI classification. 
    In the real version, this would call an LLM or use a trained model.
    For now, we use keyword matching.
    """
    text = text.lower()
    categories = load_categories()
    
    # Simple keyword mapping (Mock AI)
    keywords = {
        "denuncia": ["roubo", "corrupção", "ilegal", "desvio", "assédio"],
        "reclamacao": ["demora", "fila", "ruim", "quebrado", "falta"],
        "sugestao": ["poderia", "sugiro", "ideia", "melhorar"],
        "elogio": ["ótimo", "parabéns", "excelente", "bom", "rápido"],
        "solicitacao": ["conserto", "luz", "buraco", "poda", "lixo"],
        "informacao": ["telefone", "onde", "quando", "horário", "documento"]
    }

    best_match = None
    max_score = 0

    for cat_id, words in keywords.items():
        score = sum(1 for w in words if w in text)
        if score > max_score:
            max_score = score
            best_match = cat_id
            
    if best_match:
        # Find the category object
        for cat in categories:
            if cat['id'] == best_match:
                return cat
                
    return None # Could not classify

if __name__ == "__main__":
    if len(sys.argv) > 1:
        user_input = " ".join(sys.argv[1:])
    else:
        print("Usage: python classify_request.py <text>")
        sys.exit(1)

    result = classify_text(user_input)
    
    if result:
        print(f"Categoria Detectada: {result['name']}")
        print(f"Descrição: {result.get('description', '')}")
        print("Subcategorias sugeridas:")
        for sub in result['subcategories']:
            print(f" - {sub}")
    else:
        print("Não foi possível categorizar automaticamente. Por favor, selecione uma categoria manual.")
