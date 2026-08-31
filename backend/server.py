from fastapi import FastAPI, APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import json
import re
import asyncio
import logging
import uuid
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone

from emergentintegrations.llm.chat import LlmChat, UserMessage

from prompts import (
    build_system_prompt,
    LAFDA_PROMPT,
    COOKED_PROMPT,
    AURA_PROMPT,
    RATE_LIFE_PROMPT,
    BRO_COURT_PROMPT,
    LOCK_IN_PROMPT,
    LORE_EXTRACT_PROMPT,
    CHARACTER_PROMPTS,
)


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="BakchodAI")
api_router = APIRouter(prefix="/api")

logger = logging.getLogger("bakchodai")
logging.basicConfig(level=logging.INFO)


# ---------- Models ----------

class ChatMessageIn(BaseModel):
    session_id: str
    mode: str = "bakchod"
    language: str = "hinglish"
    intensity: int = 6
    message: str
    character: str = "default"


class ChatMessageOut(BaseModel):
    id: str
    session_id: str
    mode: str
    reply: str
    created_at: str


class OneShotIn(BaseModel):
    session_id: Optional[str] = None
    context: Optional[str] = ""  # user situation for cooked / aura
    language: str = "hinglish"


class LafdaOut(BaseModel):
    headline: str
    body: str
    reaction: str


class CookedOut(BaseModel):
    cooked_pct: int
    recoverable_pct: int
    delusion_pct: int
    verdict: str
    uncook_plan: List[str]


class AuraOut(BaseModel):
    aura_points: int
    decision_making: str
    self_respect: str
    confidence: str
    verdict: str


class RateLifeCategory(BaseModel):
    label: str
    score: str


class RateLifeOut(BaseModel):
    overall_grade: str
    aura_delta: int
    categories: List[RateLifeCategory]
    verdict: str
    one_liner: str


class BroCourtOut(BaseModel):
    plaintiff: str
    defendant: str
    charges: List[str]
    cross_examination: List[str]
    verdict: str
    compensation: str
    judge_note: str


class LockInIn(BaseModel):
    task: str
    minutes: int = 45
    session_id: Optional[str] = None


class LockInStep(BaseModel):
    minutes: int
    title: str
    detail: str


class LockInOut(BaseModel):
    verdict: str
    steps: List[LockInStep]
    first_action: str
    one_rule: str


class LoreOut(BaseModel):
    session_id: str
    arcs: List[dict] = []
    user_traits: List[str] = []
    running_jokes: List[str] = []
    updated_at: Optional[str] = None


# ---------- Helpers ----------

def _model():
    # Chosen for personality quality on Hinglish + humor.
    return ("anthropic", "claude-sonnet-4-6")


async def _load_history(session_id: str, limit: int = 20):
    docs = (
        await db.chats.find({"session_id": session_id}, {"_id": 0})
        .sort("created_at", 1)
        .to_list(limit * 2)
    )
    # Return list of {"role","text"} pairs; we only need the last N turns as raw user text
    return docs[-limit:]


def _extract_json(text: str) -> dict:
    """LLMs sometimes wrap JSON in ```json fences or add preamble. Extract robustly."""
    text = text.strip()
    # Try direct
    try:
        return json.loads(text)
    except Exception:
        pass
    # Strip code fences
    fenced = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    if fenced:
        try:
            return json.loads(fenced.group(1))
        except Exception:
            pass
    # First {...} block
    brace = re.search(r"\{.*\}", text, re.DOTALL)
    if brace:
        try:
            return json.loads(brace.group(0))
        except Exception:
            pass
    raise ValueError(f"Could not parse JSON from LLM output: {text[:300]}")


async def _run_chat(system_prompt: str, session_id: str, user_text: str) -> str:
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="LLM key not configured")
    provider, model = _model()
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=session_id,
        system_message=system_prompt,
    ).with_model(provider, model)
    resp = await chat.send_message(UserMessage(text=user_text))
    return resp if isinstance(resp, str) else str(resp)


# ---------- Routes ----------

@api_router.get("/")
async def root():
    return {"app": "BakchodAI", "status": "kya scene hai bhai"}


@api_router.post("/chat", response_model=ChatMessageOut)
async def chat(payload: ChatMessageIn, background_tasks: BackgroundTasks):
    # Load lore for this browser session (not scoped by mode — lore is cross-mode)
    lore_doc = await db.lore.find_one({"session_id": payload.session_id}, {"_id": 0})
    lore = None
    if lore_doc:
        lore = {
            "arcs": lore_doc.get("arcs", []),
            "user_traits": lore_doc.get("user_traits", []),
            "running_jokes": lore_doc.get("running_jokes", []),
        }
    system_prompt = build_system_prompt(
        payload.mode, payload.language, payload.intensity,
        character=payload.character, lore=lore,
    )

    # Build a session_id that includes mode+character so history is per-persona
    scoped_session = f"{payload.session_id}::{payload.mode}::{payload.character}"

    # Rehydrate short history so the LLM has context (LlmChat instance is fresh each call)
    history = await _load_history(scoped_session, limit=12)
    context_msg = payload.message
    if history:
        history_text = "\n".join(
            f"{h.get('role','user').upper()}: {h.get('text','')}" for h in history
        )
        context_msg = (
            "Previous conversation (for context only, do not repeat verbatim):\n"
            f"{history_text}\n\nCurrent user message: {payload.message}"
        )

    try:
        reply = await _run_chat(system_prompt, scoped_session, context_msg)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("chat error")
        raise HTTPException(status_code=502, detail=f"LLM error: {e}")

    now = datetime.now(timezone.utc).isoformat()
    user_doc = {
        "id": str(uuid.uuid4()),
        "session_id": scoped_session,
        "user_session": payload.session_id,
        "role": "user",
        "text": payload.message,
        "mode": payload.mode,
        "character": payload.character,
        "language": payload.language,
        "intensity": payload.intensity,
        "created_at": now,
    }
    ai_id = str(uuid.uuid4())
    ai_doc = {
        "id": ai_id,
        "session_id": scoped_session,
        "user_session": payload.session_id,
        "role": "assistant",
        "text": reply,
        "mode": payload.mode,
        "character": payload.character,
        "created_at": now,
    }
    await db.chats.insert_many([user_doc, ai_doc])

    # Background lore refresh — fire and forget
    background_tasks.add_task(_refresh_lore, payload.session_id)

    return ChatMessageOut(
        id=ai_id,
        session_id=scoped_session,
        mode=payload.mode,
        reply=reply,
        created_at=now,
    )


async def _refresh_lore(user_session: str):
    """Background task: pull recent user chats across all modes, summarize into lore doc."""
    try:
        total_msgs = await db.chats.count_documents({"user_session": user_session})
        if total_msgs < 4:
            return
        # Get last ~30 messages across ALL scoped sessions for this user_session
        docs = (
            await db.chats.find({"user_session": user_session}, {"_id": 0})
            .sort("created_at", -1)
            .to_list(30)
        )
        docs = list(reversed(docs))  # chronological
        # Freshness: only re-extract if 4+ new messages since last extract (uses absolute count)
        existing = await db.lore.find_one({"session_id": user_session}, {"_id": 0})
        last_count = (existing or {}).get("last_msg_count", 0)
        if existing and total_msgs - last_count < 4:
            return
        transcript = "\n".join(
            f"{d.get('role','user').upper()} [{d.get('mode','?')}]: {d.get('text','')[:400]}"
            for d in docs
        )
        raw = await _run_chat(LORE_EXTRACT_PROMPT, f"lore-{user_session}", transcript)
        try:
            data = _extract_json(raw)
        except Exception:
            return
        doc = {
            "session_id": user_session,
            "arcs": (data.get("arcs") or [])[:5],
            "user_traits": (data.get("user_traits") or [])[:6],
            "running_jokes": (data.get("running_jokes") or [])[:5],
            "last_msg_count": total_msgs,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.lore.update_one(
            {"session_id": user_session}, {"$set": doc}, upsert=True
        )
    except Exception:
        logger.exception("lore refresh failed")


@api_router.get("/chat/history")
async def get_history(session_id: str, mode: str, character: str = "default"):
    scoped = f"{session_id}::{mode}::{character}"
    docs = (
        await db.chats.find({"session_id": scoped}, {"_id": 0})
        .sort("created_at", 1)
        .to_list(500)
    )
    return {"messages": docs}


@api_router.delete("/chat/history")
async def clear_history(session_id: str, mode: str, character: str = "default"):
    scoped = f"{session_id}::{mode}::{character}"
    await db.chats.delete_many({"session_id": scoped})
    return {"cleared": True}


@api_router.get("/lore", response_model=LoreOut)
async def get_lore(session_id: str):
    doc = await db.lore.find_one({"session_id": session_id}, {"_id": 0})
    if not doc:
        return LoreOut(session_id=session_id)
    return LoreOut(
        session_id=session_id,
        arcs=doc.get("arcs", []),
        user_traits=doc.get("user_traits", []),
        running_jokes=doc.get("running_jokes", []),
        updated_at=doc.get("updated_at"),
    )


@api_router.post("/lock-in", response_model=LockInOut)
async def lock_in_plan(payload: LockInIn):
    task = (payload.task or "").strip()
    if not task:
        raise HTTPException(status_code=400, detail="Bhai task toh bata pehle.")
    minutes = max(5, min(180, int(payload.minutes or 45)))
    session_id = payload.session_id or f"lockin-{uuid.uuid4()}"
    ctx = f"Task: {task}\nMinutes available: {minutes}"
    try:
        raw = await _run_chat(LOCK_IN_PROMPT, session_id, ctx)
        data = _extract_json(raw)
        raw_steps = data.get("steps", []) or []
        steps = []
        for s in raw_steps[:5]:
            if isinstance(s, dict):
                steps.append(LockInStep(
                    minutes=int(s.get("minutes", 5) or 5),
                    title=str(s.get("title", "Step"))[:80],
                    detail=str(s.get("detail", ""))[:160],
                ))
        if not steps:
            steps = [LockInStep(minutes=minutes, title="Just start", detail="Open the thing. Do the smallest first action.")]
        return LockInOut(
            verdict=str(data.get("verdict", ""))[:200] or "Chal kaam pe lag.",
            steps=steps,
            first_action=str(data.get("first_action", ""))[:160] or "Open the file/app you need.",
            one_rule=str(data.get("one_rule", ""))[:120] or "Phone in another room.",
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("lock-in error")
        raise HTTPException(status_code=502, detail=f"Lock-in plan failed: {e}")


@api_router.post("/lafda", response_model=LafdaOut)
async def generate_lafda(payload: OneShotIn):
    session_id = payload.session_id or f"lafda-{uuid.uuid4()}"
    user_text = payload.context or "Generate a fresh absurd breaking news lafda now. Vary the topic."
    try:
        raw = await _run_chat(LAFDA_PROMPT, session_id, user_text)
        data = _extract_json(raw)
        return LafdaOut(
            headline=str(data.get("headline", "")).strip() or "LAFDA GENERATOR CRASHED",
            body=str(data.get("body", "")).strip() or "Server ne bhi hath khade kar diye.",
            reaction=str(data.get("reaction", "💀 Nation is not ready.")).strip(),
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("lafda error")
        raise HTTPException(status_code=502, detail=f"Lafda generation failed: {e}")


@api_router.post("/cooked", response_model=CookedOut)
async def am_i_cooked(payload: OneShotIn):
    if not (payload.context or "").strip():
        raise HTTPException(status_code=400, detail="Bhai situation toh bata pehle.")
    session_id = payload.session_id or f"cooked-{uuid.uuid4()}"
    try:
        raw = await _run_chat(COOKED_PROMPT, session_id, payload.context)
        data = _extract_json(raw)
        plan = data.get("uncook_plan", [])
        if isinstance(plan, str):
            plan = [plan]
        return CookedOut(
            cooked_pct=int(data.get("cooked_pct", 50)),
            recoverable_pct=int(data.get("recoverable_pct", 40)),
            delusion_pct=int(data.get("delusion_pct", 30)),
            verdict=str(data.get("verdict", "Bhai stats bhi cooked hain.")),
            uncook_plan=[str(x) for x in plan][:5] or ["Deep breath le. Baaki dekhte hain."],
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("cooked error")
        raise HTTPException(status_code=502, detail=f"Cooked check failed: {e}")


@api_router.post("/aura", response_model=AuraOut)
async def aura_check(payload: OneShotIn):
    if not (payload.context or "").strip():
        raise HTTPException(status_code=400, detail="Bhai decision toh bata pehle.")
    session_id = payload.session_id or f"aura-{uuid.uuid4()}"
    try:
        raw = await _run_chat(AURA_PROMPT, session_id, payload.context)
        data = _extract_json(raw)
        return AuraOut(
            aura_points=int(data.get("aura_points", 0)),
            decision_making=str(data.get("decision_making", "C")),
            self_respect=str(data.get("self_respect", "intact")),
            confidence=str(data.get("confidence", "+0")),
            verdict=str(data.get("verdict", "Aura check karne wala AI bhi confused hai.")),
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("aura error")
        raise HTTPException(status_code=502, detail=f"Aura check failed: {e}")


@api_router.post("/rate-life", response_model=RateLifeOut)
async def rate_life(payload: OneShotIn):
    if not (payload.context or "").strip():
        raise HTTPException(status_code=400, detail="Bhai apni life ka scene toh bata.")
    session_id = payload.session_id or f"life-{uuid.uuid4()}"
    try:
        raw = await _run_chat(RATE_LIFE_PROMPT, session_id, payload.context)
        data = _extract_json(raw)
        cats = data.get("categories", []) or []
        cleaned_cats = []
        for c in cats[:6]:
            if isinstance(c, dict):
                cleaned_cats.append(RateLifeCategory(
                    label=str(c.get("label", ""))[:32] or "Category",
                    score=str(c.get("score", ""))[:16] or "-"
                ))
        if not cleaned_cats:
            cleaned_cats = [RateLifeCategory(label="Overall", score="?")]
        return RateLifeOut(
            overall_grade=str(data.get("overall_grade", "C"))[:24],
            aura_delta=int(data.get("aura_delta", 0)),
            categories=cleaned_cats,
            verdict=str(data.get("verdict", "Life audit bhi bakchodi ban gayi.")),
            one_liner=str(data.get("one_liner", "Side quest activated. 💀"))[:120],
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("rate-life error")
        raise HTTPException(status_code=502, detail=f"Life audit failed: {e}")


@api_router.post("/bro-court", response_model=BroCourtOut)
async def bro_court(payload: OneShotIn):
    if not (payload.context or "").strip():
        raise HTTPException(status_code=400, detail="Bhai case toh file kar pehle.")
    session_id = payload.session_id or f"court-{uuid.uuid4()}"
    try:
        raw = await _run_chat(BRO_COURT_PROMPT, session_id, payload.context)
        data = _extract_json(raw)
        charges = data.get("charges", []) or []
        cross = data.get("cross_examination", []) or []
        if isinstance(charges, str): charges = [charges]
        if isinstance(cross, str): cross = [cross]
        return BroCourtOut(
            plaintiff=str(data.get("plaintiff", "You"))[:40],
            defendant=str(data.get("defendant", "That mf"))[:40],
            charges=[str(c)[:140] for c in charges][:4] or ["Being a whole clown."],
            cross_examination=[str(q)[:200] for q in cross][:4] or ["Do you have anything to say for yourself?"],
            verdict=str(data.get("verdict", "GUILTY"))[:60],
            compensation=str(data.get("compensation", "One chai + emotional damages."))[:280],
            judge_note=str(data.get("judge_note", "Court dismissed. Get out."))[:200],
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("bro-court error")
        raise HTTPException(status_code=502, detail=f"Bro Court crashed: {e}")


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
