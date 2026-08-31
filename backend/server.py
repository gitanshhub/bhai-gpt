from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import json
import re
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
async def chat(payload: ChatMessageIn):
    system_prompt = build_system_prompt(payload.mode, payload.language, payload.intensity)

    # Build a session_id that includes mode so history is per-mode within one browser session
    scoped_session = f"{payload.session_id}::{payload.mode}"

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
        "role": "user",
        "text": payload.message,
        "mode": payload.mode,
        "language": payload.language,
        "intensity": payload.intensity,
        "created_at": now,
    }
    ai_id = str(uuid.uuid4())
    ai_doc = {
        "id": ai_id,
        "session_id": scoped_session,
        "role": "assistant",
        "text": reply,
        "mode": payload.mode,
        "created_at": now,
    }
    await db.chats.insert_many([user_doc, ai_doc])

    return ChatMessageOut(
        id=ai_id,
        session_id=scoped_session,
        mode=payload.mode,
        reply=reply,
        created_at=now,
    )


@api_router.get("/chat/history")
async def get_history(session_id: str, mode: str):
    scoped = f"{session_id}::{mode}"
    docs = (
        await db.chats.find({"session_id": scoped}, {"_id": 0})
        .sort("created_at", 1)
        .to_list(500)
    )
    return {"messages": docs}


@api_router.delete("/chat/history")
async def clear_history(session_id: str, mode: str):
    scoped = f"{session_id}::{mode}"
    await db.chats.delete_many({"session_id": scoped})
    return {"cleared": True}


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
