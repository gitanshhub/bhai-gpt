"""Iteration 3 backend tests: characters, lore, lock-in, regressions."""
import os
import time
import uuid
import pytest
import requests

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/") if os.environ.get("REACT_APP_BACKEND_URL") else None
# Fall back to reading frontend .env
if not BASE_URL:
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().rstrip("/")
                break

API = f"{BASE_URL}/api"
TIMEOUT = 60


@pytest.fixture(scope="module")
def sess():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


def test_root(sess):
    r = sess.get(f"{API}/", timeout=TIMEOUT)
    assert r.status_code == 200
    assert r.json().get("app") == "BakchodAI"


def test_chat_startup_bro(sess):
    sid = f"TEST_{uuid.uuid4()}"
    r = sess.post(f"{API}/chat", json={
        "session_id": sid, "mode": "chai", "language": "hinglish",
        "intensity": 6, "character": "startup_bro",
        "message": "bhai maggi banau ya nahi, confusion hai"
    }, timeout=TIMEOUT)
    assert r.status_code == 200, r.text
    reply = r.json().get("reply", "")
    assert reply.strip()
    lower = reply.lower()
    jargon = ["founder", "tam", "raise", "two cents", "offline", "10x", "growth", "product-market", "vertical", "series", "pre-seed", "🚀"]
    assert any(k in lower for k in jargon), f"No startup jargon in reply: {reply}"


def test_chat_sharma_uncle(sess):
    sid = f"TEST_{uuid.uuid4()}"
    r = sess.post(f"{API}/chat", json={
        "session_id": sid, "mode": "chai", "language": "hinglish",
        "intensity": 6, "character": "sharma_uncle",
        "message": "uncle exam ka result aa gaya"
    }, timeout=TIMEOUT)
    assert r.status_code == 200, r.text
    assert r.json().get("reply", "").strip()


def test_chat_default_regression(sess):
    sid = f"TEST_{uuid.uuid4()}"
    r = sess.post(f"{API}/chat", json={
        "session_id": sid, "mode": "bakchod", "language": "hinglish",
        "intensity": 6, "character": "default",
        "message": "kya scene hai bhai"
    }, timeout=TIMEOUT)
    assert r.status_code == 200
    assert r.json().get("reply", "").strip()


def test_history_and_clear_character_scoped(sess):
    sid = f"TEST_{uuid.uuid4()}"
    # send two messages with different characters
    sess.post(f"{API}/chat", json={
        "session_id": sid, "mode": "chai", "language": "hinglish",
        "intensity": 6, "character": "startup_bro",
        "message": "founder mode on"
    }, timeout=TIMEOUT)
    sess.post(f"{API}/chat", json={
        "session_id": sid, "mode": "chai", "language": "hinglish",
        "intensity": 6, "character": "tapri_bhai",
        "message": "chai laga bhai"
    }, timeout=TIMEOUT)

    r = sess.get(f"{API}/chat/history", params={"session_id": sid, "mode": "chai", "character": "startup_bro"}, timeout=TIMEOUT)
    assert r.status_code == 200
    msgs = r.json().get("messages", [])
    assert len(msgs) >= 2
    for m in msgs:
        assert m.get("character") == "startup_bro"

    # delete only startup_bro
    d = sess.delete(f"{API}/chat/history", params={"session_id": sid, "mode": "chai", "character": "startup_bro"}, timeout=TIMEOUT)
    assert d.status_code == 200
    r2 = sess.get(f"{API}/chat/history", params={"session_id": sid, "mode": "chai", "character": "startup_bro"}, timeout=TIMEOUT)
    assert len(r2.json().get("messages", [])) == 0
    # tapri_bhai still there
    r3 = sess.get(f"{API}/chat/history", params={"session_id": sid, "mode": "chai", "character": "tapri_bhai"}, timeout=TIMEOUT)
    assert len(r3.json().get("messages", [])) >= 2


def test_lore_empty_and_schema(sess):
    sid = f"TEST_{uuid.uuid4()}"
    r = sess.get(f"{API}/lore", params={"session_id": sid}, timeout=TIMEOUT)
    assert r.status_code == 200
    j = r.json()
    assert j["session_id"] == sid
    assert j["arcs"] == []
    assert j["user_traits"] == []
    assert j["running_jokes"] == []


def test_lore_after_chats(sess):
    sid = f"TEST_lore_{uuid.uuid4()}"
    msgs = [
        "bhai meri ex ne block kar diya 4 mahine ho gaye",
        "gym join karna hai kal se pakka",
        "job dhoondh raha hoon 6 mahine se, thak gaya",
        "kal se pakka padhai shuru",
        "ex ne insta pe story dekhi meri",
        "kal se pakka gym jaunga bhai",
    ]
    for m in msgs:
        sess.post(f"{API}/chat", json={
            "session_id": sid, "mode": "chai", "language": "hinglish",
            "intensity": 5, "character": "default", "message": m
        }, timeout=TIMEOUT)
    time.sleep(15)
    r = sess.get(f"{API}/lore", params={"session_id": sid}, timeout=TIMEOUT)
    assert r.status_code == 200
    j = r.json()
    # only schema is asserted (per test-brief)
    assert set(["session_id", "arcs", "user_traits", "running_jokes", "updated_at"]).issubset(j.keys())


def test_lockin_valid(sess):
    r = sess.post(f"{API}/lock-in", json={"task": "Finish DSA recursion chapter", "minutes": 45}, timeout=TIMEOUT)
    assert r.status_code == 200, r.text
    j = r.json()
    for k in ["verdict", "steps", "first_action", "one_rule"]:
        assert k in j
    assert isinstance(j["steps"], list) and len(j["steps"]) >= 1
    total = sum(s["minutes"] for s in j["steps"])
    assert 30 <= total <= 60, f"steps sum {total} not near 45"
    for s in j["steps"]:
        assert "minutes" in s and "title" in s and "detail" in s


def test_lockin_empty_task(sess):
    r = sess.post(f"{API}/lock-in", json={"task": "   ", "minutes": 30}, timeout=TIMEOUT)
    assert r.status_code == 400


def test_lockin_clamped_low(sess):
    r = sess.post(f"{API}/lock-in", json={"task": "read a page", "minutes": 2}, timeout=TIMEOUT)
    assert r.status_code == 200


def test_lockin_clamped_high(sess):
    r = sess.post(f"{API}/lock-in", json={"task": "big deep work", "minutes": 500}, timeout=TIMEOUT)
    assert r.status_code == 200


def test_lafda_regression(sess):
    r = sess.post(f"{API}/lafda", json={"language": "hinglish"}, timeout=TIMEOUT)
    assert r.status_code == 200
    j = r.json()
    assert j.get("headline") and j.get("body")


def test_cooked_regression(sess):
    r = sess.post(f"{API}/cooked", json={"context": "exam kal hai, kuch padha nahi"}, timeout=TIMEOUT)
    assert r.status_code == 200
    j = r.json()
    assert isinstance(j.get("cooked_pct"), int)


def test_aura_regression(sess):
    r = sess.post(f"{API}/aura", json={"context": "unblocked ex after 3 months"}, timeout=TIMEOUT)
    assert r.status_code == 200
    assert isinstance(r.json().get("aura_points"), int)


def test_rate_life_regression(sess):
    r = sess.post(f"{API}/rate-life", json={"context": "slept 3 hours, 8 chais, no work done"}, timeout=TIMEOUT)
    assert r.status_code == 200
    assert r.json().get("overall_grade")


def test_bro_court_regression(sess):
    r = sess.post(f"{API}/bro-court", json={"context": "friend owes 500 rupees for 6 months"}, timeout=TIMEOUT)
    assert r.status_code == 200
    assert r.json().get("verdict")
