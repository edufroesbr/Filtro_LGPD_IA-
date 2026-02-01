"""
Test for User-Reported Issues
- Cases marked as "Sigiloso" with no actual address
- Medical records should be classified as sensitive
- Macro-level categorization
"""
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from ai_service import analyze_privacy

def test_user_reported_issues():
    """Test specific issues reported by user"""
    test_cases = [
        {
            "text": "Gostaria de saber sobre o programa de capacitação",
            "expected_sensitive": False,
            "expected_category": "Público",
            "description": "Texto sem endereço - não deve ser marcado como sigiloso"
        },
        {
            "text": "Preciso de informações sobre o edital",
            "expected_sensitive": False,
            "expected_category": "Público",
            "description": "Texto sem dados pessoais - deve ser público"
        },
        {
            "text": "Solicito análise do prontuário médico número 123456",
            "expected_sensitive": True,
            "expected_category": "Prontuário Médico",
            "description": "Prontuário médico deve ser sigiloso"
        },
        {
            "text": "Paciente João Silva, prontuário PRT-485935, necessita atendimento",
            "expected_sensitive": True,
            "expected_category": "Prontuário Médico",
            "description": "Dados de paciente devem ser sigilosos"
        },
        {
            "text": "Meu nome é Maria Silva, CPF 123.456.789-00, email maria@email.com",
            "expected_sensitive": True,
            "expected_category": "Dados Pessoais",
            "description": "Nome, CPF e email devem ser categorizados como Dados Pessoais"
        },
        {
            "text": "Transferir para conta 1234-5 67890-1, PIX 550e8400-e29b-41d4-a716-446655440000",
            "expected_sensitive": True,
            "expected_category": "Dados Bancários",
            "description": "Conta bancária e PIX devem ser categorizados como Dados Bancários"
        },
        {
            "text": "Moro na Rua das Flores, 123, CEP 70000-000",
            "expected_sensitive": True,
            "expected_category": "Dados Pessoais",
            "description": "Endereço deve ser categorizado como Dados Pessoais"
        },
        {
            "text": "Bloco de anotações está cheio",
            "expected_sensitive": False,
            "expected_category": "Público",
            "description": "Falso positivo: 'Bloco' não é endereço"
        },
        {
            "text": "Conjunto de ideias interessantes",
            "expected_sensitive": False,
            "expected_category": "Público",
            "description": "Falso positivo: 'Conjunto' não é endereço"
        },
        {
            "text": "O setor está em reforma",
            "expected_sensitive": False,
            "expected_category": "Público",
            "description": "Falso positivo: 'setor' genérico não é endereço"
        }
    ]
    
    print("\n" + "="*80)
    print("TESTE DE ISSUES REPORTADOS PELO USUÁRIO")
    print("="*80 + "\n")
    
    passed = 0
    failed = 0
    
    for i, test in enumerate(test_cases, 1):
        print(f"\n{'-'*80}")
        print(f"Teste {i}: {test['description']}")
        print(f"{'-'*80}")
        print(f"Texto: {test['text']}")
        
        result = analyze_privacy(test['text'])
        
        print(f"\nResultado:")
        print(f"  Sensível: {result['is_sensitive']}")
        print(f"  Status: {result['privacy_status']}")
        print(f"  Categoria: {result.get('category', 'N/A')}")
        print(f"  PIIs detectados: {result.get('detected_pii', [])}")
        
        # Verificações
        sensitive_ok = result['is_sensitive'] == test['expected_sensitive']
        category_ok = result.get('category') == test['expected_category']
        
        if sensitive_ok and category_ok:
            print(f"\n[OK] PASSOU")
            passed += 1
        else:
            print(f"\n[ERRO] FALHOU")
            if not sensitive_ok:
                print(f"   Esperado sensível: {test['expected_sensitive']}, obtido: {result['is_sensitive']}")
            if not category_ok:
                print(f"   Esperado categoria: {test['expected_category']}, obtido: {result.get('category')}")
            failed += 1
    
    print(f"\n{'='*80}")
    print(f"RESUMO: {passed} passaram, {failed} falharam")
    print(f"{'='*80}\n")
    
    return failed == 0

if __name__ == "__main__":
    success = test_user_reported_issues()
    sys.exit(0 if success else 1)
