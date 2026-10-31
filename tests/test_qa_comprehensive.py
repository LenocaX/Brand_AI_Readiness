import urllib.request
import urllib.error
import json
import subprocess
import sys
from pathlib import Path

BASE_URL = "http://127.0.0.1:8000"

def test_api_health():
    url = f"{BASE_URL}/api/health"
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req) as response:
        assert response.status == 200
        data = json.loads(response.read().decode())
        assert data.get("status") == "ok"
    print("[OK] Health check passed")

def test_sample_report_endpoint():
    url = f"{BASE_URL}/api/sample-report"
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req) as response:
        assert response.status == 200
        data = json.loads(response.read().decode())
        assert "site" in data
        assert "readiness" in data
        assert "engagement" in data
        assert "findings" in data
    print("[OK] Sample report API endpoint passed")

def test_ssrf_rejections():
    blocked_targets = [
        "http://localhost:8080",
        "http://127.0.0.1:9000",
        "http://169.254.169.254/latest/meta-data",
        "http://10.0.0.1/admin"
    ]
    for target in blocked_targets:
        payload = json.dumps({"url": target}).encode("utf-8")
        req = urllib.request.Request(
            f"{BASE_URL}/api/jobs",
            data=payload,
            headers={"Content-Type": "application/json"}
        )
        try:
            urllib.request.urlopen(req)
            assert False, f"Expected 400 rejection for SSRF target {target}"
        except urllib.error.HTTPError as ex:
            assert ex.code == 400, f"Expected code 400, got {ex.code}"
    print("[OK] SSRF protection verified: blocked loopback and private IP attacks")

def test_job_not_found():
    req = urllib.request.Request(f"{BASE_URL}/api/jobs/nonexistent-job-xyz")
    try:
        urllib.request.urlopen(req)
        assert False, "Expected 404 for invalid job ID"
    except urllib.error.HTTPError as ex:
        assert ex.code == 404
    print("[OK] 404 handled gracefully for invalid job IDs")

if __name__ == "__main__":
    try:
        test_api_health()
        test_sample_report_endpoint()
        test_ssrf_rejections()
        test_job_not_found()
        print("\nAll automated QA backend API tests passed!")
    except Exception as e:
        print(f"QA test failed: {e}")
        sys.exit(1)
