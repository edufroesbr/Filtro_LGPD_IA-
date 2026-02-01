import sys
import os
import json

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

import ai_service
from ai_service import ProviderFactory, GeminiProvider, OpenAIProvider, AnthropicProvider, OllamaProvider

def test_factory_defaults():
    print("Testing ProviderFactory with default config...")
    provider = ProviderFactory.get_provider()
    print(f"Result: {type(provider).__name__}")
    
def test_mock_openai_config():
    print("\nTesting OpenAI configuration...")
    config_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'system_config.json')
    
    # Save original config
    with open(config_path, 'r', encoding='utf-8') as f:
        orig = f.read()
    
    try:
        with open(config_path, 'w', encoding='utf-8') as f:
            json.dump({
                "llm_provider": "openai",
                "llm_model": "gpt-4o",
                "enabled_pii_types": []
            }, f)
        
        # Mock env var
        os.environ["OPENAI_API_KEY"] = "sk-test-key"
        provider = ProviderFactory.get_provider()
        print(f"Result: {type(provider).__name__}")
        assert isinstance(provider, OpenAIProvider)
        assert provider.model_name == "gpt-4o"
        
    finally:
        with open(config_path, 'w', encoding='utf-8') as f:
            f.write(orig)

def test_mock_ollama_config():
    print("\nTesting Ollama configuration...")
    config_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'system_config.json')
    
    # Save original config
    with open(config_path, 'r', encoding='utf-8') as f:
        orig = f.read()
    
    try:
        with open(config_path, 'w', encoding='utf-8') as f:
            json.dump({
                "llm_provider": "ollama",
                "llm_model": "llama3",
                "ollama_url": "http://localhost:11434",
                "enabled_pii_types": []
            }, f)
        
        provider = ProviderFactory.get_provider()
        print(f"Result: {type(provider).__name__}")
        assert isinstance(provider, OllamaProvider)
        assert provider.model_name == "llama3"
        
    finally:
        with open(config_path, 'w', encoding='utf-8') as f:
            f.write(orig)

def test_offline_fallback():
    print("\nTesting Offline Fallback (Regex)...")
    text = "Meu CPF é 123.456.789-00"
    # Unset env vars to force offline or simulated offline
    orig_key = os.environ.get("GEMINI_API_KEY")
    if orig_key: del os.environ["GEMINI_API_KEY"]
    
    try:
        result = ai_service.analyze_privacy(text)
        print(f"Privacy Result: {result['privacy_status']}")
        print(f"Detected: {result.get('detected_pii')}")
        assert result['is_sensitive'] == True
        assert "CPF" in result['detected_pii']
    finally:
        if orig_key: os.environ["GEMINI_API_KEY"] = orig_key

if __name__ == "__main__":
    try:
        test_factory_defaults()
        test_mock_openai_config()
        test_mock_ollama_config()
        test_offline_fallback()
        print("\n[SUCCESS] Verification SUCCESSFUL")
    except Exception as e:
        print(f"\n[FAILURE] Verification FAILED: {e}")
        sys.exit(1)
