
import pandas as pd
import requests
import random
import json
import os
import time

# Configuration
EXCEL_FILE = "repositório 300.xlsx"
API_URL_CLASSIFY = "http://localhost:8000/api/classify"
API_URL_SUBMIT = "http://localhost:8000/api/submit"
NUM_SAMPLES = 27

def run_test():
    if not os.path.exists(EXCEL_FILE):
        print(f"Error: '{EXCEL_FILE}' not found.")
        return

    print(f"Reading '{EXCEL_FILE}'...")
    try:
        df = pd.read_excel(EXCEL_FILE)
        # Ensure we have a text column. Trying common names.
        text_col = None
        for col in df.columns:
            if "TEXTO" in str(col).upper() or "MANIFESTAÇÃO" in str(col).upper() or "DESCRIÇÃO" in str(col).upper():
                text_col = col
                break
        
        if not text_col:
            # Fallback: Use the second column if available (often text), else the first
            text_col = df.columns[1] if len(df.columns) > 1 else df.columns[0]
            print(f"Warning: Could not identify text column. Using '{text_col}'.")

        # Filter out empty texts
        texts = df[text_col].dropna().astype(str).tolist()
        
        if len(texts) < NUM_SAMPLES:
            print(f"Warning: Only {len(texts)} items found. Using all of them.")
            samples = texts
        else:
            samples = random.sample(texts, NUM_SAMPLES)

        print(f"Selected {len(samples)} random samples from {len(texts)} total records.")
        
        for i, text in enumerate(samples):
            print(f"Processing {i+1}/{len(samples)}...")
            
            # 1. Classify
            try:
                # Add a small delay to not overwhelm if rate limited
                time.sleep(0.5) 
                
                resp_cls = requests.post(API_URL_CLASSIFY, json={"text": text})
                if resp_cls.status_code != 200:
                    print(f"  [Error] Classify failed: {resp_cls.text}")
                    continue
                
                result = resp_cls.json()
                
                # Logic to format category string exactly like frontend (for dashboard consistency)
                category_display = result.get('category', 'Geral')
                if result.get('is_sensitive'):
                    detected = result.get('detected_pii', [])
                    if detected:
                        category_display = f"IDENTIFICADO: {', '.join(sorted(list(set(detected))))}"
                    else:
                        category_display = "Sigiloso (Detector Interno)"
                elif "PRONTO PARA" not in str(category_display).upper() and "GERAL" not in str(category_display).upper():
                    # If it's public but has a specific category, we might want to keep it or tag as Ready
                    # As per user request: "Pronto para Transparência" for public
                     category_display = "PRONTO PARA TRANSPARÊNCIA" # Force this for visual consistency if desired, or keep actual category?
                     # User said: "Mude as cores para 'pronto para transparência' ...". The frontend does this logic. 
                     # Let's trust the API result but override if public to match "PRONTO PARA TRANSPARÊNCIA" if that's what the user expects on dashboard for ALL public items.
                     # Actually, let's keep the API's returned category if it is specific, but if it is generic, use Ready.
                     # For the sake of the requested visual:
                     category_display = "PRONTO PARA TRANSPARÊNCIA"

                # 2. Submit
                submit_payload = {
                    "id": result.get('id'),
                    "text": text,
                    "type": "Texto",
                    "category": category_display,
                    "privacy": result.get('privacy_status', 'Público'),
                    "reason": result.get('reason', '')
                }
                
                resp_sub = requests.post(API_URL_SUBMIT, json=submit_payload)
                if resp_sub.status_code == 200:
                    print(f"  [Success] Saved ID: {result.get('id')}")
                else:
                    print(f"  [Error] Submit failed: {resp_sub.text}")

            except Exception as e:
                print(f"  [Exception] {e}")

        print("\nTest completed.")

    except Exception as e:
        print(f"Critical Error: {e}")

if __name__ == "__main__":
    run_test()
