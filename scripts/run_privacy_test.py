"""
Batch Privacy Test Script - Edital 8.1 Compliance
Processes a sample of e-SIC requests to validate PII detection accuracy
"""
import pandas as pd
import sys
import os
import csv
from collections import Counter

# Add backend to path to import ai_service
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from ai_service import analyze_privacy

def main():
    # Load Excel data
    excel_path = os.path.join(os.path.dirname(__file__), '..', 'docs', 'AMOSTRA_e-SIC.xlsx')
    print(f"Loading data from: {excel_path}")
    
    try:
        df = pd.read_excel(excel_path)
        print(f"Total records available: {len(df)}")
    except Exception as e:
        print(f"Error loading Excel: {e}")
        return
    
    # Sample 30 random records
    sample_size = min(30, len(df))
    sample_df = df.sample(n=sample_size, random_state=42)
    print(f"Processing {sample_size} samples...")
    
    # Process each record
    results = []
    pii_type_counter = Counter()
    
    for idx, row in sample_df.iterrows():
        record_id = row['ID']
        text = row['Texto Mascarado']
        
        print(f"\nProcessing ID: {record_id}...")
        
        # Call privacy analysis
        result = analyze_privacy(text)
        
        # Extract detected PII types
        detected_pii = result.get('detected_pii', [])
        pii_str = ', '.join(detected_pii) if detected_pii else 'None'
        
        # Count PII types for statistics
        if result.get('is_sensitive'):
            for pii_type in detected_pii:
                pii_type_counter[pii_type] += 1
        
        results.append({
            'ID': record_id,
            'Original_Text': text[:100] + '...' if len(text) > 100 else text,
            'Is_Sensitive': result.get('is_sensitive'),
            'Privacy_Status': result.get('privacy_status'),
            'Reason': result.get('reason'),
            'Detected_PII': pii_str
        })
        
        print(f"  Status: {result.get('privacy_status')} | PII: {pii_str}")
    
    # Save to CSV
    output_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'privacy_test_results.csv')
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    with open(output_path, 'w', newline='', encoding='utf-8-sig') as f:
        writer = csv.DictWriter(f, fieldnames=['ID', 'Original_Text', 'Is_Sensitive', 'Privacy_Status', 'Reason', 'Detected_PII'])
        writer.writeheader()
        writer.writerows(results)
    
    print(f"\n{'='*60}")
    print(f"Results saved to: {output_path}")
    print(f"{'='*60}")
    
    # Statistical Summary
    total = len(results)
    sensitive_count = sum(1 for r in results if r['Is_Sensitive'])
    public_count = total - sensitive_count
    
    print(f"\n[STATISTICAL SUMMARY]")
    print(f"{'='*60}")
    print(f"Total Analyzed: {total}")
    print(f"Sensitive (Sigiloso): {sensitive_count} ({sensitive_count/total*100:.1f}%)")
    print(f"Public (Público): {public_count} ({public_count/total*100:.1f}%)")
    print(f"\n[PII TYPES DETECTED]")
    print(f"{'='*60}")
    
    if pii_type_counter:
        for pii_type, count in pii_type_counter.most_common():
            print(f"  {pii_type}: {count} occurrences")
    else:
        print("  No PII detected in sample")
    
    print(f"{'='*60}")
    print("\n[SUCCESS] Test completed successfully!")

if __name__ == "__main__":
    main()
