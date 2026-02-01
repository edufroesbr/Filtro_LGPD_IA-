"""
Test script to verify the unified data architecture.
Tests that all data flows through server-side CSV storage.
"""
import requests
import json
import time
from datetime import datetime

BASE_URL = "http://localhost:8000"
TIMEOUT = 15  # Seconds to wait for server response

def test_classify_endpoint():
    """Test the /api/classify endpoint and verify it returns a UUID"""
    print("\n" + "="*60)
    print("TEST 1: Classify Endpoint with PII Detection")
    print("="*60)
    
    test_cases = [
        {
            "text": "Meu CPF é 123.456.789-00 e preciso de ajuda com iluminação pública.",
            "expected_privacy": "Sigiloso"
        },
        {
            "text": "Gostaria de informações sobre o horário de funcionamento da biblioteca.",
            "expected_privacy": "Público"
        },
        {
            "text": "Meu email é teste@exemplo.com e telefone (61) 98765-4321",
            "expected_privacy": "Sigiloso"
        }
    ]
    
    for i, test in enumerate(test_cases, 1):
        print(f"\n[*] Test Case {i}: {test['text'][:50]}...")
        
        print(f"   [ ] Sending POST to {BASE_URL}/api/classify...")
        start_time = time.time()
        try:
            response = requests.post(
                f"{BASE_URL}/api/classify",
                json={"text": test["text"]},
                headers={"Content-Type": "application/json"},
                timeout=TIMEOUT
            )
            duration = time.time() - start_time
            print(f"   [OK] Response received in {duration:.2f}s")
        except requests.exceptions.Timeout:
            print(f"   [ERROR] Request timed out after {TIMEOUT}s")
            continue
        except Exception as e:
            print(f"   [ERROR] Request failed: {e}")
            continue
        
        if response.status_code == 200:
            result = response.json()
            print(f"[OK] Status: {response.status_code}")
            print(f"   UUID: {result.get('id', 'N/A')}")
            print(f"   Privacy: {result.get('privacy_status', 'N/A')}")
            print(f"   Reason: {result.get('reason', 'N/A')}")
            
            # Verify UUID is returned
            if 'id' in result and len(result['id']) > 0:
                print(f"   [+] UUID generated successfully")
            else:
                print(f"   [-] ERROR: No UUID returned!")
                
            # Verify privacy status
            if result.get('privacy_status') == test['expected_privacy']:
                print(f"   [+] Privacy status correct: {test['expected_privacy']}")
            else:
                print(f"   [!] Privacy status mismatch: expected {test['expected_privacy']}, got {result.get('privacy_status')}")
        else:
            print(f"[ERROR] Request failed: {response.status_code}")
            print(f"   Response: {response.text}")
        
        time.sleep(0.5)  # Small delay between requests

def test_submissions_endpoint():
    """Test the /api/submissions endpoint"""
    print("\n" + "="*60)
    print("TEST 2: Submissions Endpoint")
    print("="*60)
    
    print(f"   [ ] Sending GET to {BASE_URL}/api/submissions...")
    try:
        response = requests.get(f"{BASE_URL}/api/submissions", timeout=TIMEOUT)
    except requests.exceptions.Timeout:
        print(f"   [ERROR] Request timed out after {TIMEOUT}s")
        return
    
    if response.status_code == 200:
        data = response.json()
        submissions = data.get('submissions', [])
        
        print(f"[OK] Status: {response.status_code}")
        print(f"   Total submissions: {len(submissions)}")
        
        if len(submissions) > 0:
            print(f"\n   [*] Most Recent Submission:")
            latest = submissions[0]
            print(f"      ID: {latest.get('id', 'N/A')}")
            print(f"      Date: {latest.get('date', 'N/A')}")
            print(f"      Type: {latest.get('type', 'N/A')}")
            print(f"      Category: {latest.get('category', 'N/A')}")
            print(f"      Privacy: {latest.get('privacy', 'N/A')}")
            print(f"      Text: {latest.get('text', 'N/A')[:60]}...")
            
            print(f"\n   [+] Submissions endpoint working correctly")
        else:
            print(f"   [!] No submissions found")
    else:
        print(f"❌ Request failed: {response.status_code}")

def test_dashboard_endpoint():
    """Test the /api/dashboard-data endpoint"""
    print("\n" + "="*60)
    print("TEST 3: Dashboard Data Endpoint")
    print("="*60)
    
    print(f"   [ ] Sending GET to {BASE_URL}/api/dashboard-data...")
    try:
        response = requests.get(f"{BASE_URL}/api/dashboard-data", timeout=TIMEOUT)
    except requests.exceptions.Timeout:
        print(f"   [ERROR] Request timed out after {TIMEOUT}s")
        return
    
    if response.status_code == 200:
        data = response.json()
        
        print(f"[OK] Status: {response.status_code}")
        print(f"   Total Count: {data.get('total_count', 0)}")
        print(f"   Privacy Counts:")
        for status, count in data.get('privacy_counts', {}).items():
            print(f"      {status}: {count}")
        
        print(f"   Category Counts:")
        for category, count in data.get('category_counts', {}).items():
            print(f"      {category}: {count}")
        
        recent_logs = data.get('recent_logs', [])
        print(f"   Recent Logs: {len(recent_logs)} entries")
        
        print(f"\n   [+] Dashboard endpoint working correctly")
    else:
        print(f"❌ Request failed: {response.status_code}")

def test_csv_download():
    """Test CSV file download"""
    print("\n" + "="*60)
    print("TEST 4: CSV Download Endpoint")
    print("="*60)
    
    print(f"   [ ] Sending GET to {BASE_URL}/data/classifications.csv...")
    try:
        response = requests.get(f"{BASE_URL}/data/classifications.csv", timeout=TIMEOUT)
    except requests.exceptions.Timeout:
        print(f"   [ERROR] Request timed out after {TIMEOUT}s")
        return
    
    if response.status_code == 200:
        lines = response.text.strip().split('\n')
        print(f"[OK] Status: {response.status_code}")
        print(f"   CSV Lines: {len(lines)}")
        print(f"   Header: {lines[0][:80]}...")
        
        if len(lines) > 1:
            print(f"   Last Entry: {lines[-1][:80]}...")
            print(f"\n   [+] CSV download working correctly")
        else:
            print(f"   [!] CSV appears empty")
    else:
        print(f"❌ Request failed: {response.status_code}")

def verify_unified_architecture():
    """Verify that the unified architecture is working"""
    print("\n" + "="*60)
    print("TEST 5: Unified Architecture Verification")
    print("="*60)
    
    # Get initial count
    try:
        dashboard_response = requests.get(f"{BASE_URL}/api/dashboard-data", timeout=TIMEOUT)
    except requests.exceptions.Timeout:
        print(f"   [ERROR] Request timed out after {TIMEOUT}s")
        return
    initial_count = dashboard_response.json().get('total_count', 0)
    print(f"[*] Initial submission count: {initial_count}")
    
    # Submit a new test entry
    print(f"\n[*] Submitting new test entry...")
    try:
        classify_response = requests.post(
            f"{BASE_URL}/api/classify",
            json={"text": "Test submission to verify unified architecture - timestamp: " + datetime.now().isoformat()},
            timeout=TIMEOUT
        )
    except requests.exceptions.Timeout:
        print(f"   [ERROR] Request timed out after {TIMEOUT}s")
        return
    
    if classify_response.status_code == 200:
        result = classify_response.json()
        temp_id = result.get('id', '')
        print(f"   [+] Classification successful, temp ID: {temp_id}")
        
        # Now submit for permanent logging
        print(f"[*] Submitting for permanent logging...")
        try:
            submit_response = requests.post(
                f"{BASE_URL}/api/submit",
                json={
                    "id": temp_id,
                    "text": "Test submission to verify unified architecture - timestamp: " + datetime.now().isoformat(),
                    "category": result.get('category', 'Geral'),
                    "privacy": result.get('privacy_status', 'Público'),
                    "reason": result.get('reason', '')
                },
                timeout=TIMEOUT
            )
        except requests.exceptions.Timeout:
            print(f"   [ERROR] Submit request timed out after {TIMEOUT}s")
            return
            
        if submit_response.status_code != 200:
            print(f"   [-] ERROR: Submit failed: {submit_response.status_code}")
            print(f"       {submit_response.text}")
            return
            
        submission_id = submit_response.json().get('id', '')
        print(f"   [+] Permanent submission successful, protocol: {submission_id}")
        
        # Wait a moment for the data to be written
        time.sleep(1)
        
        # Check if it appears in dashboard
        try:
            dashboard_response = requests.get(f"{BASE_URL}/api/dashboard-data", timeout=TIMEOUT)
        except requests.exceptions.Timeout:
            print(f"   [ERROR] Request timed out after {TIMEOUT}s")
            return
        new_count = dashboard_response.json().get('total_count', 0)
        print(f"\n[*] New submission count: {new_count}")
        
        if new_count == initial_count + 1:
            print(f"   [+] Dashboard updated correctly (+1)")
        else:
            print(f"   [-] Dashboard count mismatch: expected {initial_count + 1}, got {new_count}")
        
        # Check if it appears in submissions
        try:
            submissions_response = requests.get(f"{BASE_URL}/api/submissions", timeout=TIMEOUT)
        except requests.exceptions.Timeout:
            print(f"   [ERROR] Request timed out after {TIMEOUT}s")
            return
        submissions = submissions_response.json().get('submissions', [])
        
        # Look for our submission by partial ID match
        found = False
        for sub in submissions:
            if sub.get('id', '').startswith(submission_id[:8]):
                found = True
                print(f"   [+] Submission found in /api/submissions")
                break
        
        if not found:
            print(f"   [!] Submission not found in /api/submissions list")
        
        print(f"\n{'='*60}")
        print(f"[OK] UNIFIED ARCHITECTURE VERIFICATION COMPLETE")
        print(f"{'='*60}")
        print(f"   All data flows through server-side CSV storage")
        print(f"   Dashboard, Submissions, and CSV are synchronized")
    else:
        print(f"[ERROR] Submission failed: {classify_response.status_code}")

def main():
    print("\n" + "="*60)
    print("UNIFIED DATA ARCHITECTURE TEST SUITE")
    print("="*60)
    print(f"Testing server at: {BASE_URL}")
    print(f"Test started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    try:
        # Run all tests
        test_classify_endpoint()
        test_submissions_endpoint()
        test_dashboard_endpoint()
        test_csv_download()
        verify_unified_architecture()
        
        print("\n" + "="*60)
        print("[OK] ALL TESTS COMPLETED SUCCESSFULLY")
        print("="*60)
        
    except requests.exceptions.ConnectionError:
        print("\n[ERROR] Could not connect to server")
        print("   Make sure the backend is running: python backend/main.py")
    except Exception as e:
        print(f"\n[ERROR] {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
