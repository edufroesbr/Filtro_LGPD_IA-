"""
Test to identify and fix false positive detections
"""
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from ai_service import analyze_privacy

def test_false_positives():
    """Test cases that should NOT trigger false positives"""
    test_cases = [
        {
            "text": "Transferir para conta 1234-5 67890-1, PIX 550e8400-e29b-41d4-a716-446655440000",
            "description": "Banking data - should NOT detect phone or voter ID",
            "should_not_detect": ["Telefone", "Título de Eleitor"],
            "should_detect": ["Conta Bancária", "PIX (UUID)"]
        },
        {
            "text": "Meu telefone é (61) 98765-4321",
            "description": "Real phone number - should detect phone",
            "should_detect": ["Telefone"],
            "should_not_detect": []
        },
        {
            "text": "Título de eleitor: 123456789012",
            "description": "Real voter ID - should detect voter ID",
            "should_detect": ["Título de Eleitor"],
            "should_not_detect": []
        },
        {
            "text": "UUID: 550e8400-e29b-41d4-a716-446655440000",
            "description": "UUID alone - should detect PIX",
            "should_detect": ["PIX (UUID)"],
            "should_not_detect": ["Título de Eleitor"]
        },
        {
            "text": "Conta 12345 67890",
            "description": "Account numbers - should detect bank account",
            "should_detect": ["Conta Bancária"],
            "should_not_detect": ["Telefone"]
        }
    ]
    
    print("\n" + "="*80)
    print("TESTE DE FALSOS POSITIVOS")
    print("="*80 + "\n")
    
    passed = 0
    failed = 0
    
    for i, test in enumerate(test_cases, 1):
        print(f"\n{'-'*80}")
        print(f"Teste {i}: {test['description']}")
        print(f"{'-'*80}")
        print(f"Texto: {test['text']}")
        
        result = analyze_privacy(test['text'])
        detected = result.get('detected_pii', [])
        
        print(f"\nPIIs detectados: {detected}")
        
        # Check should_detect
        all_detected = all(pii in detected for pii in test['should_detect'])
        # Check should_not_detect
        none_detected = all(pii not in detected for pii in test['should_not_detect'])
        
        if all_detected and none_detected:
            print(f"\n[OK] PASSOU")
            passed += 1
        else:
            print(f"\n[ERRO] FALHOU")
            if not all_detected:
                missing = [pii for pii in test['should_detect'] if pii not in detected]
                print(f"   Deveria detectar mas não detectou: {missing}")
            if not none_detected:
                false_pos = [pii for pii in test['should_not_detect'] if pii in detected]
                print(f"   Não deveria detectar mas detectou (falso positivo): {false_pos}")
            failed += 1
    
    print(f"\n{'='*80}")
    print(f"RESUMO: {passed} passaram, {failed} falharam")
    print(f"{'='*80}\n")
    
    return failed == 0

if __name__ == "__main__":
    success = test_false_positives()
    sys.exit(0 if success else 1)
