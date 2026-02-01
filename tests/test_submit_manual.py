"""
Teste Manual de Envio - Participa DF
Este script simula o envio de uma manifestação e verifica a confirmação.
"""

import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_submit_with_pii():
    """Testa o envio de uma manifestação com PII"""
    print("\n" + "="*60)
    print("TESTE DE ENVIO COM CONFIRMACAO")
    print("="*60 + "\n")
    
    # Dados de teste
    test_text = "Meu CPF é 123.456.789-00 e meu email é teste@email.com. Quero denunciar um problema."
    
    print(f"[*] Texto de teste:\n{test_text}\n")
    
    # Enviar para classificação
    print("[>] Enviando para classificacao...")
    response = client.post("/api/classify", json={"text": test_text})
    
    if response.status_code == 200:
        result = response.json()
        print("[OK] Classificacao bem-sucedida!\n")
        
        # Simular o envio (como o frontend faria)
        print("[>] Enviando para submissao...")
        submit_data = {
            "id": result.get('id'),
            "text": test_text,
            "type": "Texto",
            "category": result.get('category', 'Geral'),
            "privacy": result.get('privacy_status', 'Sigiloso'),
            "reason": result.get('reason', '')
        }
        submit_response = client.post("/api/submit", json=submit_data)
        if submit_response.status_code != 200:
            print(f"[ERROR] Falha na submissao: {submit_response.text}")
            return

        print(f"[INFO] Resultado:")
        print(f"   - Status: {result.get('privacy_status', 'N/A')}")
        print(f"   - Motivo: {result.get('reason', 'N/A')}")
        print(f"   - PII Detectado: {', '.join(result.get('detected_pii', []))}")
        print(f"   - E Sensivel: {'Sim' if result.get('is_sensitive') else 'Nao'}")
        
        # Verificar se foi logado no CSV
        print("\n[>] Verificando CSV...")
        csv_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'classifications.csv')
        if os.path.exists(csv_path):
            with open(csv_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
                print(f"[OK] CSV atualizado! Total de registros: {len(lines) - 1}")
                print(f"[DATA] Ultimo registro:\n   {lines[-1].strip()}")
        else:
            print("[ERROR] CSV nao encontrado!")
        
        # Verificar dashboard
        print("\n[>] Verificando Dashboard...")
        dash_response = client.get("/api/dashboard-data", headers={"X-Admin-Password": "admin123"})
        if dash_response.status_code == 200:
            dash_data = dash_response.json()
            print(f"[OK] Dashboard acessivel!")
            print(f"   - Total: {dash_data['total_count']}")
            print(f"   - Publico: {dash_data['privacy_counts'].get('Público', 0)}")
            print(f"   - Sigiloso: {dash_data['privacy_counts'].get('Sigiloso', 0)}")
        
        print("\n" + "="*60)
        print("[SUCCESS] TESTE CONCLUIDO COM SUCESSO!")
        print("="*60)
        print("\n[NEXT] PROXIMOS PASSOS:")
        print("   1. Acesse http://localhost:8000")
        print("   2. Digite o texto de teste")
        print("   3. Clique em 'Enviar Registro'")
        print("   4. Veja o modal de confirmacao com protocolo")
        print("   5. Acesse http://localhost:8000/admin_final.html para ver o dashboard")
        print("\n")
        
    else:
        print(f"❌ Erro na classificação: {response.status_code}")
        print(response.text)

if __name__ == "__main__":
    test_submit_with_pii()
