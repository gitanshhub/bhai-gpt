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
- Home: marquee, hero, language toggle (Hinglish/Hindi/English), 6-mode bento grid, 3 quick-action cards (Lafda, Cooked, Aura).
- Chat page: mode header, message list, Enter-to-send input, Roast Harder button (roast mode), sonner toasts, per-mode history.
- Stats sheet: bakchodi level / roast resistance / chai / lafda potential, time wasted, intensity slider (1-10), language toggle mobile, clear history.
- Special dialogs: Lafda (breaking news red card), Am I Cooked (dashed receipt), Aura Check (neon holographic).
- All interactive elements carry `data-testid`.

## Prioritized backlog (P0/P1/P2)
- P1: Character unlocks (Tapri Bhai, Sharma Uncle, Toxic Dost, Fake Guru, Startup Bro)
- P1: "Send this for me" multi-tone reply generator
- P1: Shareable Aura Card / Lafda image (canvas export → social share)
- P2: Indian Household Simulator scenario mode
- P2: Bro Court / Red Flag Detector / Vibe Check standalone tools
- P2: Regional language packs (Delhi / Mumbai / Punjab / etc.)
- P2: Roast Battle (2-player async)
- P2: Streaming responses (currently non-streaming for speed of MVP)

## Next tasks
See P1 backlog above.
