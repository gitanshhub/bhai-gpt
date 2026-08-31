# BakchodAI PRD

## Original problem statement (summary)
Build "BakchodAI" — an AI dost web app with a chronically-online desi personality. 70% dost + 15% Gen Z brainrot + 10% Indian culture + 5% unhinged. Not another ChatGPT clone; it's an entertainment/timepass product.

## User choices (locked)
- LLM: Emergent Universal Key, Claude Sonnet 4.6
- Modes for MVP: Bakchod, Roast Me, Chai Tapri, Timepass, Gyaan Chodu, Relationship Dost
- No login (session-based, localStorage)
- Branding: BakchodAI · tagline "Kaam ka nahi. Par kaafi kaam ka."
- Monetization: none in MVP

## Architecture
- Backend: FastAPI + Motor (Mongo) + emergentintegrations LlmChat (Claude Sonnet 4.6).
- Endpoints (all `/api`): POST /chat, GET /chat/history, DELETE /chat/history, POST /lafda, POST /cooked, POST /aura.
- Personality: prompts.py builds system prompt from (mode × language × intensity).
- Frontend: React 19 + Tailwind + shadcn/ui + Framer motion aesthetic via CSS. Neo-brutalist desi theme (obsidian bg, mirchi red, taxi yellow, tapri blue).
- Session id in localStorage; chat scoped per (session,mode). Bakchodi stats derived and persisted.

## What's implemented (Feb 2026)
- Home: marquee, hero, language toggle, 6-mode bento grid, 7 quick-actions.
- Quick-actions grid: Lafda · Cooked · Aura · Rate My Life · Bro Court · **Lock-In** · **Bhai Profile**.
- Chat: mode header, message list, Enter-to-send, Roast Harder (roast mode), per-mode+per-persona history, stats sheet, intensity slider.
- **Character personas (chat header dropdown)**: BakchodAI (default), Tapri Bhai, Sharma Uncle, Toxic Dost, Startup Bro. Each = system-prompt overlay + per-persona chat history scope.
- **Lore & Callbacks**: after each `/api/chat`, a background task summarizes recent cross-mode conversation into `db.lore` (arcs, user_traits, running_jokes) and re-injects it into future system prompts so BakchodAI can reference past arcs naturally.
- **Lock-In Mode**: `/lock-in` route. User enters task + minutes → `/api/lock-in` returns verdict + first-action + one-rule + 3–5 timed steps. In-app timer with start/pause/reset + step completion highlighting.
- **Bhai Profile Card**: canvas-rendered shareable PNG aggregating localStorage stats (total aura, bakchodi level, roast resistance, avg cooked, last life grade, msgs, lock-ins, top mode, fave character, berozgaar certification). Download PNG + Share text buttons.
- Share buttons on Cooked / Aura / Life / Court results (clipboard).
- Personality prompt: reaction-before-punchline, gradual escalation, callback-aware.
- All interactive elements carry `data-testid`.

## Prioritized backlog (P0/P1/P2)
- P1: "Send this for me" multi-tone reply generator (nonchalant / flirty / unhinged / desi)
- P1: Delusion Detector / Reality Check standalone tool
- P1: Streaming chat responses (currently non-streaming for MVP)
- P2: Regional language packs (Delhi / Mumbai / Punjab / etc.)
- P2: 2-player Roast Battle / Group Bhai room
- P2: Indian Household Simulator scenario mode
- P2: Lore visibility page (show user their own arcs/traits)
- P2: Better share: server-generated OG-image endpoint for real link previews

## Next tasks
See P1 backlog above.
