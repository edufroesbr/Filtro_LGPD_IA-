import sys
import os
import shutil
from fastapi.testclient import TestClient
import pandas as pd

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from main import app, LOG_FILE

client = TestClient(app)

def test_csv_logging_and_dashboard():
    print("Testing CSV Logging and Dashboard...")
    
    # 1. Clean up existing log for clean test (optional, or just count before/after)
    initial_count = 0
    if os.path.exists(LOG_FILE):
        try:
            df = pd.read_csv(LOG_FILE)
            initial_count = len(df)
        except:
            pass
            
    # 2. Send a Classification Request
    payload = {
        "text": "Meu CPF é 123.456.789-00 e quero denunciar um roubo."
    }
    response = client.post("/api/classify", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data['privacy_status'] == 'Sigiloso'
    print("[OK] Classification successful.")
    
    # 2.5 Submit the classification
    submit_payload = {
        "id": data['id'],
        "text": payload['text'],
        "type": "Texto",
        "category": "Geral",
        "privacy": data['privacy_status'],
        "reason": data['reason']
    }
    submit_response = client.post("/api/submit", json=submit_payload)
    assert submit_response.status_code == 200
    print("[OK] Submission successful.")
    
    # 3. Verify CSV exists and has new row
    assert os.path.exists(LOG_FILE)
    df = pd.read_csv(LOG_FILE)
    assert len(df) == initial_count + 1
    # Check if the last row matches our request
    last_row = df.iloc[-1]
    assert "123.456.789-00" in last_row['text_snippet']
    assert last_row['privacy'] == 'Sigiloso'
    print("[OK] CSV logging successful.")
    
    # 4. Check Dashboard Endpoint
    dash_response = client.get("/api/dashboard-data", headers={"X-Admin-Password": "admin123"})
    assert dash_response.status_code == 200
    dash_data = dash_response.json()
    
    assert dash_data['total_count'] == initial_count + 1
    assert dash_data['privacy_counts']['Sigiloso'] >= 1
    print("[OK] Dashboard API successful.")

if __name__ == "__main__":
    try:
        test_csv_logging_and_dashboard()
        print("\nAll tests passed!")
    except Exception as e:
        print(f"\n[FAIL] Test Failed: {e}")
        import traceback
        traceback.print_exc()
