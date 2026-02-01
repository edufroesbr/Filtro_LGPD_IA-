#!/usr/bin/env python3
"""
Dashboard Verification Script
==============================
This script verifies that the dashboard API is working correctly
and displays the current state of the CSV data.

Usage:
    python scripts/verify_dashboard.py
"""

import requests
import json
import os
import csv
from pathlib import Path

def main():
    headers = {"X-Admin-Password": "admin123"}
    print("=" * 70)
    print("PARTICIPA DF - DASHBOARD VERIFICATION")
    print("=" * 70)
    print()
    
    # 1. Check if backend is running
    print("[1] Checking if backend is running...")
    try:
        response = requests.get("http://localhost:8000/api/dashboard-data", headers=headers, timeout=5)
        print("   [OK] Backend is running!")
        print()
    except requests.exceptions.ConnectionError:
        print("   [ERROR] Backend is NOT running!")
        print("   [TIP] Start it with: cd backend && python main.py")
        return
    except Exception as e:
        print(f"   [ERROR] Error: {e}")
        return
    
    # 2. Check CSV file
    print("[2] Checking CSV file...")
    csv_path = Path(__file__).parent.parent / "data" / "classifications.csv"
    
    if csv_path.exists():
        with open(csv_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            record_count = len(lines) - 1  # Exclude header
        print(f"   [OK] CSV file exists: {csv_path}")
        print(f"   [DATA] Records in CSV: {record_count}")
        print()
    else:
        print(f"   [ERROR] CSV file not found: {csv_path}")
        print()
    
    # 3. Test API endpoint
    print("[3] Testing /api/dashboard-data endpoint...")
    try:
        response = requests.get("http://localhost:8000/api/dashboard-data", headers=headers)
        data = response.json()
        
        print(f"   [OK] API Response received!")
        print()
        print("   DASHBOARD DATA:")
        print(f"      Total Count: {data.get('total_count', 0)}")
        print()
        
        # Privacy breakdown
        privacy = data.get('privacy_counts', {})
        print("   PRIVACY BREAKDOWN:")
        for status, count in privacy.items():
            print(f"      {status}: {count}")
        print()
        
        # Category breakdown
        categories = data.get('category_counts', {})
        print("   CATEGORY BREAKDOWN:")
        for cat, count in categories.items():
            print(f"      {cat}: {count}")
        print()
        
        # Recent logs
        recent = data.get('recent_logs', [])
        print(f"   RECENT LOGS: {len(recent)} records")
        if recent:
            print()
            print("   Last 3 records:")
            for i, log in enumerate(recent[:3], 1):
                print(f"      {i}. ID: {log.get('id', 'N/A')[:8]}...")
                print(f"         Privacy: {log.get('privacy', 'N/A')}")
                print(f"         Text: {log.get('text_snippet', 'N/A')[:60]}...")
                print()
        
    except Exception as e:
        print(f"   [ERROR] API Error: {e}")
        return
    
    # 4. Summary
    print("=" * 70)
    print("SUMMARY")
    print("=" * 70)
    
    if data.get('total_count', 0) > 0:
        print("[SUCCESS] Dashboard has data and should display correctly!")
        print()
        print("To view in browser:")
        print("   1. Open: http://localhost:8000")
        print("   2. Click the Dashboard button (top-right)")
        print("   3. You should see:")
        print(f"      - Total: {data.get('total_count', 0)} manifestacoes")
        print(f"      - Privacy chart with {len(privacy)} categories")
        print(f"      - Category chart with {len(categories)} categories")
        print(f"      - Table with {len(recent)} recent records")
    else:
        print("[WARNING] Dashboard is empty!")
        print()
        print("To populate with test data:")
        print("   Option 1: Run Playwright demo")
        print("      run_live_demo.bat")
        print()
        print("   Option 2: Use simulation button")
        print("      1. Open http://localhost:8000")
        print("      2. Click Dashboard")
        print("      3. Click Simular Dados (e-SIC)")
    
    print()
    print("=" * 70)

if __name__ == "__main__":
    main()
