"""Iteration 2 tests: /api/rate-life, /api/bro-court + regression on existing endpoints."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL")
if not BASE_URL:
    # Fall back to frontend .env
    from pathlib import Path
    env = Path("/app/frontend/.env").read_text()
    for line in env.splitlines():
        if line.startswith("REACT_APP_BACKEND_URL="):
            BASE_URL = line.split("=", 1)[1].strip()
            break
BASE_URL = BASE_URL.rstrip("/")
API = f"{BASE_URL}/api"

TIMEOUT = 60


@pytest.fixture(scope="module")
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


# ---------- NEW: rate-life ----------

def test_rate_life_valid(s):
    r = s.post(f"{API}/rate-life", json={"context": "Slept at 4am, skipped 2 classes, ordered ₹500 food, doom scrolled reels for 3 hours."}, timeout=TIMEOUT)
    assert r.status_code == 200, r.text
    d = r.json()
    assert isinstance(d.get("overall_grade"), str) and d["overall_grade"]
    assert isinstance(d.get("aura_delta"), int)
    assert isinstance(d.get("categories"), list) and len(d["categories"]) >= 1
    for c in d["categories"]:
        assert isinstance(c.get("label"), str) and c["label"]
        assert isinstance(c.get("score"), str) and c["score"]
    assert isinstance(d.get("verdict"), str) and d["verdict"]
    assert isinstance(d.get("one_liner"), str) and d["one_liner"]


def test_rate_life_empty(s):
    r = s.post(f"{API}/rate-life", json={"context": ""}, timeout=TIMEOUT)
    assert r.status_code == 400


# ---------- NEW: bro-court ----------

def test_bro_court_valid(s):
    r = s.post(f"{API}/bro-court", json={"context": "Rahul borrowed ₹800 four months ago for Zomato and still hasn't paid."}, timeout=TIMEOUT)
    assert r.status_code == 200, r.text
    d = r.json()
    for k in ["plaintiff", "defendant", "verdict", "compensation", "judge_note"]:
        assert isinstance(d.get(k), str) and d[k].strip(), f"{k} empty"
    assert isinstance(d.get("charges"), list) and len(d["charges"]) >= 1
    assert isinstance(d.get("cross_examination"), list) and len(d["cross_examination"]) >= 1
    for c in d["charges"]:
        assert isinstance(c, str) and c.strip()
    for q in d["cross_examination"]:
        assert isinstance(q, str) and q.strip()


def test_bro_court_empty(s):
    r = s.post(f"{API}/bro-court", json={"context": ""}, timeout=TIMEOUT)
    assert r.status_code == 400


# ---------- REGRESSION ----------

def test_chat_bakchod(s):
    r = s.post(f"{API}/chat", json={
        "session_id": "TEST_it2", "mode": "bakchod", "language": "hinglish",
        "intensity": 6, "message": "Bhai bored ho raha hoon."
    }, timeout=TIMEOUT)
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["reply"] and isinstance(d["reply"], str)
    assert d["mode"] == "bakchod"


def test_lafda(s):
    r = s.post(f"{API}/lafda", json={}, timeout=TIMEOUT)
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["headline"] and d["body"] and d["reaction"]


def test_cooked(s):
    r = s.post(f"{API}/cooked", json={"context": "Exam kal hai, syllabus untouched."}, timeout=TIMEOUT)
    assert r.status_code == 200, r.text
    d = r.json()
    assert isinstance(d["cooked_pct"], int)
    assert isinstance(d["uncook_plan"], list) and len(d["uncook_plan"]) >= 1


def test_aura(s):
    r = s.post(f"{API}/aura", json={"context": "Texted ex 3am 'u up?'"}, timeout=TIMEOUT)
    assert r.status_code == 200, r.text
    d = r.json()
    assert isinstance(d["aura_points"], int)
    assert d["verdict"]
