from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, HttpUrl
from pathlib import Path
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from urllib.parse import urlparse
import ipaddress
import json
import os
import subprocess
import sys
import uuid
import threading
import logging

from backend.database import init_db, SessionLocal
from backend.models_db import AuditRun
from backend.routers.audits import persist_audit_report_to_db
from backend.routers import (
    auth as auth_router,
    websites as websites_router,
    audits as audits_router,
    performance as performance_router,
    analytics as analytics_router,
    monitoring as monitoring_router,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("brand-ai-readiness")

app = FastAPI(title="Canopy — Website Intelligence & Brand AI-Readiness Platform")

# Enable CORS for local frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register modular routers
app.include_router(auth_router.router)
app.include_router(websites_router.router)
app.include_router(audits_router.router)
app.include_router(performance_router.router)
app.include_router(analytics_router.router)
app.include_router(monitoring_router.router)

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "skills" / "audit-orchestrator" / "scripts" / "audit.py"
REPORTS_DIR = ROOT / "reports" / "jobs"
REPORTS_DIR.mkdir(parents=True, exist_ok=True)
SAMPLE_REPORT = ROOT / "reports" / "sample_report.json"
DIST = ROOT / "frontend" / "dist"
TRACKER_JS = ROOT / "frontend" / "public" / "tracker.js"

@app.on_event("startup")
def startup_event():
    logger.info("Initializing Canopy persistent database architecture...")
    init_db()
    logger.info("Canopy database initialized successfully.")

# In-memory job repository for active runtime tracking
jobs: Dict[str, Dict[str, Any]] = {}
job_processes: Dict[str, subprocess.Popen] = {}
jobs_lock = threading.Lock()


class AuditRequest(BaseModel):
    url: HttpUrl
    sync: Optional[bool] = False
    website_id: Optional[str] = None


def run_audit_worker(job_id: str, target_url: str, report_file_path: Path, website_id: Optional[str] = None):
    """
    Background worker that runs the Python audit orchestrator script,
    tracks the actual stdout stages for the 5 specialist skills,
    and updates the job state authentically without synthetic progress.
    Saves and reads exclusively from an isolated per-job report file,
    then automatically persists findings and scores to the relational database.
    """
    logger.info(f"Starting audit job {job_id} for URL: {target_url}")

    with jobs_lock:
        if job_id not in jobs:
            return
        jobs[job_id]["status"] = "in_progress"
        jobs[job_id]["stages"]["crawl"] = "active"
        jobs[job_id]["current_stage"] = "crawl"

    output_lines = []
    try:
        proc = subprocess.Popen(
            [sys.executable, "-u", str(SCRIPT), target_url, str(report_file_path)],
            cwd=str(ROOT),
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
            universal_newlines=True,
            env={
                **os.environ,
                "PYTHONIOENCODING": "utf-8",
                "PYTHONUTF8": "1",
            },
            encoding="utf-8",
            errors="replace",
        )

        with jobs_lock:
            job_processes[job_id] = proc

        if proc.stdout:
            for line in proc.stdout:
                output_lines.append(line)
                text = line.strip()

                with jobs_lock:
                    if job_id not in jobs:
                        break

                    # Crawl & Render
                    if "Running Crawl / Render Audit" in text:
                        jobs[job_id]["stages"]["crawl"] = "active"
                        jobs[job_id]["current_stage"] = "crawl"
                    elif "Crawl / Render Audit completed" in text:
                        jobs[job_id]["stages"]["crawl"] = "completed"

                    # Structured Data
                    elif "Running Structured Data Audit" in text:
                        jobs[job_id]["stages"]["structured_data"] = "active"
                        jobs[job_id]["current_stage"] = "structured_data"
                    elif "Structured Data Audit completed" in text:
                        jobs[job_id]["stages"]["structured_data"] = "completed"

                    # Content Extractability
                    elif "Running Content Extractability Audit" in text:
                        jobs[job_id]["stages"]["content_extractability"] = "active"
                        jobs[job_id]["current_stage"] = "content_extractability"
                    elif "Content Extractability Audit completed" in text:
                        jobs[job_id]["stages"]["content_extractability"] = "completed"

                    # Freshness & Corroboration
                    elif "Running Freshness" in text:
                        jobs[job_id]["stages"]["freshness"] = "active"
                        jobs[job_id]["current_stage"] = "freshness"
                    elif "Freshness & Corroboration Audit completed" in text:
                        jobs[job_id]["stages"]["freshness"] = "completed"

                    # Engagement
                    elif "Running Engagement Audit" in text:
                        jobs[job_id]["stages"]["engagement"] = "active"
                        jobs[job_id]["current_stage"] = "engagement"
                    elif "Engagement Audit completed" in text:
                        jobs[job_id]["stages"]["engagement"] = "completed"
                        jobs[job_id]["stages"]["orchestrator"] = "active"
                        jobs[job_id]["current_stage"] = "orchestrator"

        proc.wait(timeout=150)

        with jobs_lock:
            if proc.returncode == 0 and report_file_path.exists():
                try:
                    report_data = json.loads(report_file_path.read_text(encoding="utf-8"))
                    jobs[job_id]["stages"]["orchestrator"] = "completed"
                    jobs[job_id]["status"] = "completed"
                    jobs[job_id]["completed_at"] = datetime.now(timezone.utc).isoformat()
                    jobs[job_id]["report"] = report_data

                    # Persist to relational database
                    try:
                        db_session = SessionLocal()
                        try:
                            persist_audit_report_to_db(
                                db=db_session,
                                job_id=job_id,
                                target_url=target_url,
                                report=report_data,
                                website_id=website_id or jobs[job_id].get("website_id"),
                            )
                        finally:
                            db_session.close()
                    except Exception as db_err:
                        logger.warning(f"Could not persist report to database for job {job_id}: {db_err}")

                except Exception as parse_err:
                    logger.error(f"Failed to parse report file for job {job_id}: {parse_err}")
                    jobs[job_id]["status"] = "failed"
                    jobs[job_id]["report"] = None
                    jobs[job_id]["error"] = "Audit report was created but could not be parsed."
            else:
                tail = "".join(output_lines[-15:])
                logger.error(f"Audit process {job_id} failed with exit code {proc.returncode}: {tail}")
                jobs[job_id]["status"] = "failed"
                jobs[job_id]["report"] = None
                jobs[job_id]["error"] = f"Audit process was unable to complete inspection (code {proc.returncode}). Verify the target URL is accessible."
                for st_name, st_val in jobs[job_id]["stages"].items():
                    if st_val == "active":
                        jobs[job_id]["stages"][st_name] = "failed"

    except Exception as ex:
        logger.exception(f"Exception during audit job {job_id}: {ex}")
        with jobs_lock:
            if job_id in jobs:
                jobs[job_id]["status"] = "failed"
                jobs[job_id]["report"] = None
                jobs[job_id]["error"] = "An internal error occurred during the audit execution. Please verify the target URL and retry."
                for st_name, st_val in jobs[job_id]["stages"].items():
                    if st_val == "active":
                        jobs[job_id]["stages"][st_name] = "failed"
    finally:
        with jobs_lock:
            job_processes.pop(job_id, None)


@app.get("/api/health")
def health():
    return {"status": "ok", "platform": "Canopy Intelligence"}


@app.get("/tracker.js")
def serve_tracker_script():
    """
    Serves the embeddable Canopy analytics tracking SDK.
    """
    if TRACKER_JS.exists():
        return FileResponse(TRACKER_JS, media_type="application/javascript")
    raise HTTPException(status_code=404, detail="tracker.js not found.")


@app.get("/api/sample-report")
def get_sample_report():
    if not SAMPLE_REPORT.exists():
        raise HTTPException(status_code=404, detail="No sample report available")
    sample_data = json.loads(SAMPLE_REPORT.read_text(encoding="utf-8"))
    sample_data["is_sample"] = True
    return sample_data


def validate_target_url(url_str: str):
    """
    Validates that the target URL is a public web resource.
    Prevents SSRF attacks against loopback, private RFC1918 subnets, and cloud metadata services.
    """
    parsed = urlparse(url_str)
    if parsed.scheme not in ("http", "https"):
        raise HTTPException(status_code=400, detail="Target URL must use HTTP or HTTPS protocol.")

    hostname = (parsed.hostname or "").lower()
    if not hostname:
        raise HTTPException(status_code=400, detail="Target URL missing valid host name.")

    blocked_hosts = {
        "localhost", "127.0.0.1", "::1", "metadata.google.internal",
        "169.254.169.254", "instance-data", "metadata"
    }
    if hostname in blocked_hosts or hostname.endswith(".local") or hostname.endswith(".internal"):
        raise HTTPException(status_code=400, detail="Auditing loopback, internal, or cloud metadata addresses is prohibited.")

    try:
        ip = ipaddress.ip_address(hostname)
        if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved:
            raise HTTPException(status_code=400, detail="Auditing private or loopback IP addresses is prohibited.")
    except ValueError:
        pass


@app.post("/api/jobs")
def create_job(request: AuditRequest):
    """
    Creates an asynchronous audit job with an isolated per-job report file.
    """
    target_url = str(request.url)
    validate_target_url(target_url)
    job_id = f"job-{uuid.uuid4().hex[:12]}"
    job_report_file = REPORTS_DIR / f"{job_id}.json"

    job_data = {
        "job_id": job_id,
        "url": target_url,
        "website_id": request.website_id,
        "status": "pending",
        "current_stage": "crawl",
        "stages": {
            "crawl": "pending",
            "structured_data": "pending",
            "content_extractability": "pending",
            "freshness": "pending",
            "engagement": "pending",
            "orchestrator": "pending",
        },
        "created_at": datetime.now(timezone.utc).isoformat(),
        "completed_at": None,
        "error": None,
        "report": None,
        "report_file": str(job_report_file),
    }

    with jobs_lock:
        jobs[job_id] = job_data

    # Launch worker in background daemon thread with unique output path
    thread = threading.Thread(
        target=run_audit_worker,
        args=(job_id, target_url, job_report_file, request.website_id),
        daemon=True,
    )
    thread.start()

    return job_data


@app.get("/api/jobs/{job_id}")
def get_job_status(job_id: str):
    """
    Returns authentic status of an ongoing or completed audit job.
    Falls back seamlessly to the persistent database if restarted.
    """
    with jobs_lock:
        if job_id in jobs:
            return jobs[job_id]

    # Database fallback check
    db = SessionLocal()
    try:
        run = db.query(AuditRun).filter(AuditRun.id == job_id).first()
        if run:
            return {
                "job_id": run.id,
                "url": run.target_url,
                "status": run.status,
                "current_stage": run.current_stage,
                "stages": run.stages,
                "created_at": run.created_at.isoformat() if run.created_at else None,
                "completed_at": run.completed_at.isoformat() if run.completed_at else None,
                "error": run.error_message,
                "report": run.full_report_json,
                "report_file": None,
            }
    finally:
        db.close()

    raise HTTPException(status_code=404, detail=f"Job '{job_id}' not found.")


@app.post("/api/jobs/{job_id}/cancel")
def cancel_job(job_id: str):
    """
    Cancels an active audit job if currently executing.
    """
    with jobs_lock:
        if job_id not in jobs:
            raise HTTPException(status_code=404, detail=f"Job '{job_id}' not found.")
        proc = job_processes.get(job_id)
        if proc and proc.poll() is None:
            proc.terminate()
        jobs[job_id]["status"] = "failed"
        jobs[job_id]["error"] = "Audit was cancelled by user."
        for st_name, st_val in jobs[job_id]["stages"].items():
            if st_val == "active":
                jobs[job_id]["stages"][st_name] = "failed"
        return {"status": "cancelled", "job_id": job_id}


# Alias endpoint for /api/audits/{job_id}
@app.get("/api/audits/{job_id}")
def get_audit_by_id(job_id: str):
    return get_job_status(job_id)


@app.post("/api/audits")
def create_audit(request: AuditRequest, sync: bool = Query(default=False)):
    """
    Preserves backward compatibility: if sync=True, waits and returns report directly from isolated file.
    Otherwise creates an async job and returns the job descriptor.
    """
    target_url = str(request.url)
    validate_target_url(target_url)

    if sync or request.sync:
        job_id = f"sync-{uuid.uuid4().hex[:12]}"
        sync_report_file = REPORTS_DIR / f"{job_id}.json"
        result = subprocess.run(
            [sys.executable, "-u", str(SCRIPT), target_url, str(sync_report_file)],
            cwd=str(ROOT),
            capture_output=True,
            text=True,
            timeout=150,
            env={
                **os.environ,
                "PYTHONIOENCODING": "utf-8",
                "PYTHONUTF8": "1",
            },
            encoding="utf-8",
            errors="replace",
        )
        if result.returncode != 0 or not sync_report_file.exists():
            logger.error(f"Synchronous audit execution failed: {result.stderr or result.stdout}")
            raise HTTPException(
                status_code=500,
                detail="Audit execution failed during page crawl or specialist evaluation.",
            )
        report_data = json.loads(sync_report_file.read_text(encoding="utf-8"))
        
        # Persist sync report to DB
        try:
            db_session = SessionLocal()
            try:
                persist_audit_report_to_db(
                    db=db_session,
                    job_id=job_id,
                    target_url=target_url,
                    report=report_data,
                    website_id=request.website_id,
                )
            finally:
                db_session.close()
        except Exception as e:
            logger.warning(f"Could not persist sync audit: {e}")

        return report_data

    return create_job(request)


@app.get("/api/report")
def get_report(job_id: Optional[str] = Query(default=None)):
    """
    Returns the authentic completed report for a specific job_id.
    Never returns stale reports or cross-job data.
    """
    if not job_id:
        raise HTTPException(status_code=400, detail="job_id is required to fetch an audit report.")

    with jobs_lock:
        if job_id in jobs:
            job = jobs[job_id]
            if job.get("status") == "completed" and job.get("report"):
                return job["report"]

    # Check database
    db = SessionLocal()
    try:
        run = db.query(AuditRun).filter(AuditRun.id == job_id).first()
        if run and run.full_report_json:
            return run.full_report_json
    finally:
        db.close()

    raise HTTPException(status_code=404, detail=f"No completed report available for job '{job_id}'.")


# Serve frontend build if dist exists
if DIST.exists():
    if (DIST / "assets").exists():
        app.mount("/assets", StaticFiles(directory=str(DIST / "assets")), name="assets")

    @app.get("/{full_path:path}")
    def serve_spa(full_path: str = ""):
        if full_path.startswith("api/") or full_path == "tracker.js":
            raise HTTPException(status_code=404, detail="Not Found")
        file_path = DIST / full_path
        if full_path and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(DIST / "index.html")
