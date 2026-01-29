"""
Test script for comprehensive PII detection with user-configurable filters.
Tests all 15 PII types individually and in combinations.
"""

import sys
import os

# Add parent directory to path to import ai_service
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from ai_service import analyze_privacy

def test_pii_type(pii_type, text, description):
    """Test a specific PII type"""
    print(f"\n{'='*70}")
    print(f"Testing: {description}")
    print(f"PII Type: {pii_type}")
    print(f"Text: {text}")
    print(f"{'='*70}")
    
    # Test with only this PII type enabled
    result = analyze_privacy(text, enabled_pii_types=[pii_type])
    
    print(f"[OK] Status: {result['privacy_status']}")
    print(f"[INFO] Reason: {result['reason']}")
    print(f"[DETECT] Detected: {result['detected_pii']}")
    
    # Verify detection
    if result['is_sensitive']:
        print("[PASSED] PII was detected")
    else:
        print("[FAILED] PII was NOT detected")
    
    return result

def test_selective_filtering():
    """Test that disabling a PII type actually prevents its detection"""
    print(f"\n{'#'*70}")
    print("SELECTIVE FILTERING TEST")
    print(f"{'#'*70}")
    
    text = "Meu CPF é 123.456.789-00 e meu email é teste@exemplo.com"
    
    # Test 1: Both enabled
    print("\n--- Test 1: Both CPF and Email enabled ---")
    result = analyze_privacy(text, enabled_pii_types=["cpf", "email"])
    print(f"Detected: {result['detected_pii']}")
    assert result['is_sensitive'], "Should detect PII"
    assert len(result['detected_pii']) == 2, "Should detect both types"
    
    # Test 2: Only CPF enabled
    print("\n--- Test 2: Only CPF enabled (Email disabled) ---")
    result = analyze_privacy(text, enabled_pii_types=["cpf"])
    print(f"Detected: {result['detected_pii']}")
    assert "CPF" in result['detected_pii'], "Should detect CPF"
    assert "Email" not in result['detected_pii'], "Should NOT detect Email"
    
    # Test 3: Only Email enabled
    print("\n--- Test 3: Only Email enabled (CPF disabled) ---")
    result = analyze_privacy(text, enabled_pii_types=["email"])
    print(f"Detected: {result['detected_pii']}")
    assert "Email" in result['detected_pii'], "Should detect Email"
    assert "CPF" not in result['detected_pii'], "Should NOT detect CPF"
    
    # Test 4: None enabled (should use all by default)
    print("\n--- Test 4: None specified (default: all enabled) ---")
    result = analyze_privacy(text, enabled_pii_types=None)
    print(f"Detected: {result['detected_pii']}")
    assert result['is_sensitive'], "Should detect PII"
    
    print("\n[OK] All selective filtering tests passed!")

def main():
    print("="*70)
    print("COMPREHENSIVE PII DETECTION TEST SUITE")
    print("Testing 15 Types of PII with User-Configurable Filters")
    print("="*70)
    
    # Test data for each PII type
    test_cases = [
        # Documents
        ("cpf", "Meu CPF é 123.456.789-00", "CPF - Cadastro de Pessoa Física"),
        ("rg", "RG: 12.345.678-9", "RG - Registro Geral"),
        ("cnh", "CNH 12345678901", "CNH - Carteira de Habilitação"),
        ("passport", "Passaporte: AB123456", "Passaporte"),
        ("voter_id", "Título de eleitor: 123456789012", "Título de Eleitor"),
        ("birth_certificate", "Certidão: 123456 01 55 2024 1 12345", "Certidão de Nascimento"),
        
        # Contact
        ("email", "Entre em contato: joao@exemplo.com.br", "Email"),
        ("phone", "Telefone: (61) 98765-4321", "Telefone/Celular"),
        ("address", "Moro na Rua das Flores, 123", "Endereço Residencial"),
        ("cep", "CEP: 70000-000", "CEP - Código Postal"),
        
        # Financial
        ("bank_account", "Agência 1234-5 Conta 678901-2", "Conta Bancária"),
        ("credit_card", "Cartão: 12345-678901-23456-7890", "Cartão de Crédito"),
        ("pix", "PIX: 550e8400-e29b-41d4-a716-446655440000", "Chave PIX (UUID)"),
        
        # Vehicles
        ("plate_old", "Placa do carro: ABC-1234", "Placa de Veículo Antiga"),
        ("plate_mercosul", "Placa nova: ABC1D23", "Placa de Veículo Mercosul"),
    ]
    
    # Run individual tests
    results = []
    for pii_type, text, description in test_cases:
        result = test_pii_type(pii_type, text, description)
        results.append((pii_type, result['is_sensitive']))
    
    # Summary
    print(f"\n{'='*70}")
    print("TEST SUMMARY")
    print(f"{'='*70}")
    passed = sum(1 for _, is_sensitive in results if is_sensitive)
    total = len(results)
    print(f"Passed: {passed}/{total}")
    
    for pii_type, is_sensitive in results:
        status = "[PASS]" if is_sensitive else "[FAIL]"
        print(f"{status} - {pii_type}")
    
    # Test selective filtering
    test_selective_filtering()
    
    # Test public text (no PII)
    print(f"\n{'='*70}")
    print("PUBLIC TEXT TEST (Should NOT detect PII)")
    print(f"{'='*70}")
    public_text = "A iluminação pública da rua está quebrada há 3 dias"
    result = analyze_privacy(public_text, enabled_pii_types=None)
    print(f"Text: {public_text}")
    print(f"Status: {result['privacy_status']}")
    print(f"Detected: {result['detected_pii']}")
    
    if not result['is_sensitive']:
        print("[PASS] Correctly identified as public")
    else:
        print("[FAIL] Incorrectly marked as sensitive")
    
    print(f"\n{'='*70}")
    print("TEST SUITE COMPLETED")
    print(f"{'='*70}")

if __name__ == "__main__":
    main()
