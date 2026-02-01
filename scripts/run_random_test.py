import pandas as pd
import requests
import random
import uuid
import time
import sys
import os
import io

# Configuration
# Path is relative to project root
EXCEL_PATH = os.path.join("docs", "repositório 300.xlsx")
API_URL = "http://localhost:8000/api"
NUM_SAMPLES = 27

def run_test():
    print(f"Loading {EXCEL_PATH}...")
    if not os.path.exists(EXCEL_PATH):
        print(f"Error: File not found at {os.path.abspath(EXCEL_PATH)}")
        return

    try:
        df = pd.read_excel(EXCEL_PATH)
    except Exception as e:
        print(f"Error loading Excel: {e}")
        return

    if 'manifestacao' not in df.columns:
        print("Column 'manifestacao' not found.")
        print(f"Available columns: {df.columns}")
        return

    # Filter out empty rows
    df = df.dropna(subset=['manifestacao'])
    
    # Sample
    count = min(NUM_SAMPLES, len(df))
    samples = df.sample(n=count)
    print(f"Selected {count} random samples from {len(df)} total rows.")

    success_count = 0
    
    print("\nStarting submission loop...")
    print("-" * 50)

    for i, row in samples.iterrows():
        text = str(row['manifestacao']).strip()
        if not text: continue
        
        print(f"Processing Item {i}: {text[:60]}...")
        
        # 1. Classify
        classification = {}
        try:
            # Add timeout to avoid hanging indefinitely
            cls_resp = requests.post(f"{API_URL}/classify", json={"text": text}, timeout=10)
            if cls_resp.status_code == 200:
                classification = cls_resp.json()
                print(f"  [AI] Privacy: {classification.get('privacy_status')} | Category: {classification.get('category')}")
            else:
                print(f"  [AI] Failed: {cls_resp.status_code}")
                classification = {"is_sensitive": False, "privacy_status": "Público", "category": "Não Classificado", "reason": "Erro na API"}
        except requests.exceptions.ConnectionError:
            print("  [Error] Could not connect to Backend (is it running on port 8000?)")
            return # Stop completely if server is down
        except Exception as e:
            print(f"  [Error] Classification: {e}")
            classification = {"is_sensitive": False, "privacy_status": "Público", "category": "Não Classificado", "reason": f"Erro: {str(e)}"}

        # 2. Submit
        payload = {
            "id": str(uuid.uuid4()),
            "text": text,
            "type": "Texto",
            "category": classification.get('category', 'Geral'),
            "privacy": classification.get('privacy_status', 'Público'),
            "reason": classification.get('reason', '')
        }
        
        try:
            sub_resp = requests.post(f"{API_URL}/submit", json=payload, timeout=10)
            if sub_resp.status_code == 200:
                print(f"  [DB] Saved ID: {sub_resp.json().get('id')}")
                success_count += 1
            else:
                print(f"  [DB] Failed: {sub_resp.status_code} - {sub_resp.text}")
        except Exception as e:
            print(f"  [DB] Error: {e}")
            
        # Small delay to be nice
        time.sleep(0.1)

    print("-" * 50)
    print(f"Done. Successfully processed {success_count}/{count} items.")

if __name__ == "__main__":
    run_test()
