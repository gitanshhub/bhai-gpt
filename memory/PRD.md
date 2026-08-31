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
- Home: marquee, hero, language toggle (Hinglish/Hindi/English), 6-mode bento grid.
- Home quick-actions grid (5 buttons): Lafda · Am I Cooked · Aura Check · **Rate My Life** · **Bro Court**.
- Chat page: mode header, message list, Enter-to-send input, Roast Harder button (roast mode), sonner toasts, per-mode history.
- Stats sheet: bakchodi level / roast resistance / chai / lafda potential, time wasted, intensity slider (1-10), language toggle mobile, clear history.
- Special dialogs: Lafda (breaking news), Am I Cooked (receipt), Aura Check (neon), **Rate My Life (yellow audit)**, **Bro Court (courtroom verdict)**.
- Share buttons on Cooked, Aura, Life, Court result cards → copies formatted text to clipboard (viral loop).
- Personality prompt upgraded: reaction-before-punchline, gradual escalation, callback-friendly, deadpan defaults.
- All interactive elements carry `data-testid`.

## Prioritized backlog (P0/P1/P2)
- P1: **Bhai Profile / Aura Card** — persistent stat sheet with shareable canvas PNG (biggest viral asset)
- P1: **Lore & Callbacks** — remember arcs across sessions ("we're not repeating the Ex Arc again")
- P1: Character unlocks (Tapri Bhai, Sharma Uncle, Toxic Dost, Fake Guru, Startup Bro) as chat sub-personas
- P1: **Bhai Push / Lock-In Mode** — 45-min focus timer that switches personality to no-nonsense
- P2: "Send this for me" multi-tone reply generator (nonchalant / flirty / unhinged / desi)
- P2: Delusion Detector / Reality Check standalone tool
- P2: Regional language packs (Delhi / Mumbai / Punjab / etc.)
- P2: 2-player Roast Battle / Group Bhai room
- P2: Streaming responses (currently non-streaming for MVP simplicity)

## Next tasks
See P1 backlog above.
