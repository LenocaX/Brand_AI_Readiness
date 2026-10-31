import urllib.request
import urllib.error
import json
import pytest

BASE_URL = "http://127.0.0.1:8000"


def http_request(path: str, method: str = "GET", data: dict = None, headers: dict = None):
    url = f"{BASE_URL}{path}"
    req_headers = {"Content-Type": "application/json"}
    if headers:
        req_headers.update(headers)
    payload = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=payload, headers=req_headers, method=method)
    with urllib.request.urlopen(req) as resp:
        body = resp.read().decode("utf-8")
        return resp.status, json.loads(body) if body else {}


def test_workflow_g_existing_functionality():
    # Health check
    status, data = http_request("/api/health")
    assert status == 200
    assert data["status"] == "ok"

    # Sample report endpoint
    status, sample = http_request("/api/sample-report")
    assert status == 200
    assert "site" in sample
    assert "readiness" in sample
    assert "findings" in sample
    assert sample.get("is_sample") is True

    # Tracker script static serving
    req = urllib.request.Request(f"{BASE_URL}/tracker.js")
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200
        content = resp.read().decode("utf-8")
        assert "Canopy Analytics Tracker SDK" in content


def test_workflow_a_and_f_auth_registration_and_isolation():
    import uuid
    uid_a = uuid.uuid4().hex[:6]
    uid_b = uuid.uuid4().hex[:6]

    # Register User A
    status, user_a = http_request(
        "/api/auth/register",
        method="POST",
        data={"email": f"alice_{uid_a}@acme.com", "password": "Password123!", "full_name": "Alice Corp"},
    )
    assert status == 201
    assert user_a["email"] == f"alice_{uid_a}@acme.com"

    # Login User A
    status, login_a = http_request(
        "/api/auth/login",
        method="POST",
        data={"email": f"alice_{uid_a}@acme.com", "password": "Password123!"},
    )
    assert status == 200
    token_a = login_a["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # Register Website for User A
    status, site_a = http_request(
        "/api/websites",
        method="POST",
        data={"url": f"https://alice-{uid_a}.com", "name": "Alice HQ"},
        headers=headers_a,
    )
    assert status == 201
    assert site_a["domain"] == f"alice-{uid_a}.com"
    site_a_id = site_a["id"]

    # Register User B
    status, user_b = http_request(
        "/api/auth/register",
        method="POST",
        data={"email": f"bob_{uid_b}@initech.com", "password": "Password456!", "full_name": "Bob Initech"},
    )
    assert status == 201

    # Login User B
    status, login_b = http_request(
        "/api/auth/login",
        method="POST",
        data={"email": f"bob_{uid_b}@initech.com", "password": "Password456!"},
    )
    token_b = login_b["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # Verify Data Isolation: User B cannot access User A's website details
    try:
        http_request(f"/api/websites/{site_a_id}", headers=headers_b)
        assert False, "Expected 404/unauthorized when User B accesses User A's site"
    except urllib.error.HTTPError as ex:
        assert ex.code == 404


def test_workflow_b_repeat_url_recognition():
    status, res = http_request("/api/websites/repeat-check?url=https://jiitshelf.vercel.app")
    assert status == 200
    assert "is_registered" in res


def test_workflow_c_performance_intelligence():
    # Standalone performance lab audit
    status, perf = http_request("/api/performance/standalone?url=https://example.com&device=desktop")
    assert status == 200
    assert "performance_score" in perf
    assert "metrics" in perf
    assert "lcp" in perf["metrics"]
    assert "inp" in perf["metrics"]
    assert "cls" in perf["metrics"]
    assert "thresholds" in perf
    assert "images" in perf
    assert "recommendations" in perf


def test_workflow_d_visitor_intelligence_pipeline():
    import uuid
    uid = uuid.uuid4().hex[:6]
    # Register user and website first
    _, user = http_request(
        "/api/auth/register",
        method="POST",
        data={"email": f"analytics_{uid}@test.com", "password": "Password123!"},
    )
    _, login = http_request(
        "/api/auth/login",
        method="POST",
        data={"email": f"analytics_{uid}@test.com", "password": "Password123!"},
    )
    headers = {"Authorization": f"Bearer {login['access_token']}"}
    _, site = http_request(
        "/api/websites",
        method="POST",
        data={"url": f"https://metrics-{uid}.com", "name": "Metrics Site"},
        headers=headers,
    )

    # Ingest visitor tracking event for this verified site
    session_token = f"sess_test_{int(uuid_lib_timestamp())}"
    status, collect_res = http_request(
        "/api/analytics/collect",
        method="POST",
        data={
            "website_id": site["id"],
            "session_id": session_token,
            "event_type": "pageview",
            "page_url": f"https://metrics-{uid}.com/",
            "device_category": "desktop",
            "traffic_source": "organic_search",
        },
    )
    assert status == 202
    assert collect_res["status"] == "accepted"

    # Query overview
    status, overview = http_request(f"/api/websites/{site['id']}/analytics/overview")
    assert status == 200
    assert overview["total_visitors"] == 1
    assert overview["pageviews"] == 1


def uuid_lib_timestamp():
    import time
    return time.time()


def test_workflow_e_ai_crawlers_inspection():
    status, crawlers_res = http_request("/api/audits/crawlers/inspect?url=https://example.com")
    assert status == 200
    assert "crawlers" in crawlers_res
    bot_names = [b["name"] for b in crawlers_res["crawlers"]]
    assert "GPTBot" in bot_names
    assert "ClaudeBot" in bot_names
    assert "PerplexityBot" in bot_names
    assert "OAI-SearchBot" in bot_names
    assert "Google-Extended" in bot_names
    assert "Bytespider" in bot_names
