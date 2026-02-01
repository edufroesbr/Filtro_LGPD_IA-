"""
Test Medical Record Detection and Macro Categorization
"""
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from ai_service import analyze_privacy

def test_medical_record_detection():
    """Test that medical records are detected as sensitive"""
    test_cases = [
        {
            "text": "Requeiro análise do prontuário médico PRT-485935 do paciente Ana Souza, CPF 268.646.567-71",
            "expected_sensitive": True,
            "expected_category": "Dados de Saúde",
            "description": "Prontuário médico com CPF"
        },
        {
            "text": "Solicito envio de histórico clínico do paciente João Silva, prontuário PRT-197777",
            "expected_sensitive": True,
            "expected_category": "Dados de Saúde",
            "description": "Prontuário médico com nome de paciente"
        },
        {
            "text": "Requeiro informações sobre política pública de capacitação de servidores",
            "expected_sensitive": False,
            "expected_category": "Público",
            "description": "Texto público sem dados sensíveis"
        },
        {
            "text": "Solicito inclusão cadastral de Ana Souza, CPF 367.608.958-71, telefone (61) 99317-6254",
            "expected_sensitive": True,
            "expected_category": "Dados Pessoais",
            "description": "CPF e telefone - Dados Pessoais"
        },
        {
            "text": "Requeiro transferência para conta 1234-5 67890-1, PIX 550e8400-e29b-41d4-a716-446655440000",
            "expected_sensitive": True,
            "expected_category": "Dados Bancários",
            "description": "Conta bancária e PIX - Dados Bancários"
        },
        {
            "text": "Solicito informações sobre veículo placa ABC-1234",
            "expected_sensitive": True,
            "expected_category": "Dados Veiculares",
            "description": "Placa de veículo - Dados Veiculares"
        }
    ]
    
    print("\n" + "="*80)
    print("TESTE DE DETECÇÃO DE PRONTUÁRIO MÉDICO E CATEGORIZAÇÃO MACRO")
    print("="*80 + "\n")
    
    passed = 0
    failed = 0
    
    for i, test in enumerate(test_cases, 1):
        print(f"\n{'-'*80}")
        print(f"Teste {i}: {test['description']}")
        print(f"{'-'*80}")
        print(f"Texto: {test['text'][:100]}...")
        
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
    success = test_medical_record_detection()
    sys.exit(0 if success else 1)
