import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MODE_BY_ID } from "@/lib/modes";
import { api, getSessionId } from "@/lib/api";
import { CHAT } from "@/constants/testIds";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { ArrowLeft, Send, Flame, Trash2, BarChart3, Loader2 } from "lucide-react";

const LANGS = [
  { id: "hinglish", label: "HINGLISH" },
  { id: "hindi", label: "हिंदी" },
  { id: "english", label: "ENGLISH" },
];

function loadStats() {
  try {
    return JSON.parse(localStorage.getItem("bakchod_stats") || "{}");
  } catch { return {}; }
}
function saveStats(s) { localStorage.setItem("bakchod_stats", JSON.stringify(s)); }

function bumpStats(mode) {
  const s = loadStats();
  s.msgs = (s.msgs || 0) + 1;
  s.startedAt = s.startedAt || Date.now();
  s.modes = s.modes || {};
  s.modes[mode] = (s.modes[mode] || 0) + 1;
  // fun derived stats
  const level = Math.min(100, 10 + Math.floor((s.msgs || 0) * 3.2));
  const roastRes = Math.max(5, 100 - Math.floor((s.modes?.roast || 0) * 8));
  const chai = Math.min(100, 20 + (s.modes?.chai || 0) * 6);
  const lafda = Math.min(100, 25 + (s.modes?.bakchod || 0) * 5 + (s.modes?.relationship || 0) * 4);
  s.derived = { level, roastRes, chai, lafda };
  saveStats(s);
  return s;
}

function TimeWasted({ startedAt }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!startedAt) return <span>0m</span>;
  const s = Math.floor((now - startedAt) / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return <span>{h > 0 ? `${h}h ` : ""}{m}m {sec}s</span>;
}

export default function Chat() {
  const { modeId } = useParams();
  const navigate = useNavigate();
  const mode = MODE_BY_ID[modeId] || MODE_BY_ID.bakchod;
  const [sessionId] = useState(getSessionId());
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [lang, setLang] = useState(() => localStorage.getItem("bakchod_lang") || "hinglish");
  const [intensity, setIntensity] = useState(() => Number(localStorage.getItem("bakchod_intensity") || 6));
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(loadStats());
  const listRef = useRef(null);

  // Load history
  useEffect(() => {
    (async () => {
      try {
        const r = await api.history(sessionId, mode.id);
        setMessages(r.messages || []);
      } catch {}
    })();
  }, [sessionId, mode.id]);

  // Auto scroll
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, loading]);

  const send = async (overrideText) => {
    const text = (overrideText ?? input).trim();
    if (!text || loading) return;
    setLoading(true);
    setInput("");
    const now = new Date().toISOString();
    const optimistic = { id: `u-${Date.now()}`, role: "user", text, created_at: now };
    setMessages((m) => [...m, optimistic]);
    try {
      const res = await api.chat({
        session_id: sessionId,
        mode: mode.id,
        language: lang,
        intensity,
        message: text,
      });
      const aiMsg = { id: res.id, role: "assistant", text: res.reply, created_at: res.created_at };
      setMessages((m) => [...m, aiMsg]);
      setStats(bumpStats(mode.id));
    } catch (e) {
      toast.error("Bhai server ne dhoka de diya. Try again.");
      setMessages((m) => m.slice(0, -1));
      setInput(text);
    } finally {
      setLoading(false);
    }
  };

  const roastHarder = () => send("ROAST HARDER. Aur zyada beizzati kar. No mercy but stay within the safe zones.");

  const clearChat = async () => {
    await api.clearHistory(sessionId, mode.id);
    setMessages([]);
    toast("History cleared. Fresh bakchodi loading.", { className: "font-mono" });
  };

  const changeIntensity = (v) => {
    const val = v[0];
    setIntensity(val);
    localStorage.setItem("bakchod_intensity", String(val));
  };

  const changeLang = (l) => { setLang(l); localStorage.setItem("bakchod_lang", l); };

  return (
    <div data-testid={CHAT.root} className="min-h-screen flex flex-col bg-[#0a0a0a] text-white">
      {/* Header */}
      <header
        data-testid={CHAT.header}
        className="sticky top-0 z-30 border-b-2 border-white/20 bg-black/95 backdrop-blur px-4 sm:px-6 py-3 flex items-center gap-3"
      >
        <button
          data-testid={CHAT.backBtn}
          onClick={() => navigate("/")}
          className="border-2 border-white p-2 hover:bg-white hover:text-black transition-colors"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1 min-w-0">
          <div data-testid={CHAT.modeTitle} className="font-display text-2xl sm:text-3xl uppercase leading-none truncate">
            {mode.icon} {mode.name}
          </div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-white/50 truncate">{mode.tagline}</div>
        </div>
        <div className="hidden sm:inline-flex border-2 border-white">
          {LANGS.map((l) => (
            <button
              key={l.id}
              onClick={() => changeLang(l.id)}
              className={
                "px-2 py-1 font-mono text-[10px] uppercase tracking-widest " +
                (lang === l.id ? "bg-[#ffcc00] text-black" : "hover:bg-white hover:text-black")
              }
            >{l.label}</button>
          ))}
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <button
              data-testid={CHAT.statsBtn}
              className="border-2 border-white p-2 hover:bg-white hover:text-black"
              aria-label="Stats"
            ><BarChart3 size={16} /></button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="bg-black border-l-2 border-white text-white rounded-none p-0 w-full sm:max-w-sm"
          >
            <SheetTitle className="sr-only">Bakchodi Stats</SheetTitle>
            <div className="p-6 space-y-5 font-mono">
              <div>
                <div className="text-xs uppercase tracking-[0.3em] text-[#ffcc00] mb-1">Certified</div>
                <div className="font-display text-4xl uppercase leading-none">Berozgaar ✅</div>
              </div>

              <StatBar label="Bakchodi Level" val={stats.derived?.level || 0} color="#ff3b30" />
              <StatBar label="Roast Resistance" val={stats.derived?.roastRes || 100} color="#ffcc00" />
              <StatBar label="Chai Dependency" val={stats.derived?.chai || 20} color="#34c759" />
              <StatBar label="Lafda Potential" val={stats.derived?.lafda || 25} color="#00e5ff" />

              <div>
                <div className="text-xs uppercase tracking-widest text-white/50">Time Wasted</div>
                <div className="font-display text-3xl"><TimeWasted startedAt={stats.startedAt} /></div>
              </div>

              <div>
                <div className="text-xs uppercase tracking-widest text-white/50 mb-2">Total Messages</div>
                <div className="font-display text-3xl">{stats.msgs || 0}</div>
              </div>

              <div className="border-t-2 border-white/20 pt-4">
                <div className="text-xs uppercase tracking-widest text-white/50 mb-3">Bakchodi Intensity: {intensity}/10</div>
                <Slider
                  data-testid={CHAT.intensitySlider}
                  value={[intensity]}
                  min={1}
                  max={10}
                  step={1}
                  onValueChange={changeIntensity}
                />
                <div className="flex justify-between text-[10px] uppercase tracking-widest text-white/40 mt-2">
                  <span>Calm</span><span>Nuclear</span>
                </div>
              </div>

              <div className="sm:hidden border-t-2 border-white/20 pt-4">
                <div className="text-xs uppercase tracking-widest text-white/50 mb-2">Language</div>
                <div className="inline-flex border-2 border-white">
                  {LANGS.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => changeLang(l.id)}
                      className={
                        "px-3 py-1.5 font-mono text-[10px] uppercase " +
                        (lang === l.id ? "bg-[#ffcc00] text-black" : "hover:bg-white hover:text-black")
                      }
                    >{l.label}</button>
                  ))}
                </div>
              </div>

              <Button
                data-testid={CHAT.clearBtn}
                onClick={clearChat}
                variant="outline"
                className="w-full bg-transparent border-2 border-white text-white rounded-none font-mono uppercase tracking-widest hover:bg-[#ff3b30] hover:border-[#ff3b30]"
              >
                <Trash2 size={14} className="mr-2" /> Clear history
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </header>

      {/* Messages */}
      <main ref={listRef} data-testid={CHAT.messagesList} className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.length === 0 && !loading && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">{mode.icon}</div>
              <div className="font-display text-3xl uppercase" style={{ color: mode.accent }}>{mode.intro}</div>
              <div className="font-mono text-xs text-white/50 mt-2">Type kar. Start bakchodi.</div>
            </div>
          )}

          {messages.map((m) => (
            <div
              key={m.id}
              data-testid={CHAT.message(m.id)}
              className={"pop-in flex " + (m.role === "user" ? "justify-end" : "justify-start")}
            >
              <div
                className={
                  m.role === "user"
                    ? "max-w-[85%] border-2 border-[#ffcc00] bg-black text-white font-mono text-sm p-3 sm:p-4 rounded-none"
                    : "max-w-[85%] bg-[#1a1a1a] text-[#eaeaea] border-l-4 border-[#ff3b30] font-mono text-sm p-3 sm:p-4 rounded-none whitespace-pre-wrap"
                }
              >
                {m.role !== "user" && (
                  <div className="text-[10px] uppercase tracking-widest text-[#ff3b30] mb-1">
                    BakchodAI · {mode.name}
                  </div>
                )}
                {m.text}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start pop-in">
              <div className="bg-[#1a1a1a] text-[#00e5ff] border-l-4 border-[#ff3b30] font-mono text-sm p-3 sm:p-4 rounded-none inline-flex items-center gap-2">
                <Loader2 size={14} className="animate-spin" /> soch raha hoon...
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Input */}
      <footer className="sticky bottom-0 border-t-2 border-white/20 bg-black/95 backdrop-blur px-4 sm:px-6 py-3">
        <div className="max-w-3xl mx-auto">
          {mode.id === "roast" && (
            <div className="flex justify-end mb-2">
              <Button
                data-testid={CHAT.roastHarder}
                onClick={roastHarder}
                disabled={loading || messages.length === 0}
                className="bg-[#ff3b30] text-white border-2 border-[#ff3b30] rounded-none font-mono uppercase tracking-widest hover:bg-black hover:text-[#ff3b30]"
              >
                <Flame size={14} className="mr-2" /> Roast Harder
              </Button>
            </div>
          )}
          <div className="flex gap-2 items-end">
            <Textarea
              data-testid={CHAT.input}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
              }}
              placeholder={`Type in ${lang}... (Enter to send)`}
              className="min-h-[52px] max-h-[160px] bg-black text-white border-2 border-white rounded-none font-mono resize-none focus-visible:ring-0 focus-visible:border-[#ffcc00]"
            />
            <Button
              data-testid={CHAT.sendBtn}
              onClick={() => send()}
              disabled={loading || !input.trim()}
              className="h-[52px] w-[52px] bg-[#ffcc00] text-black border-2 border-[#ffcc00] rounded-none hover:bg-white hover:border-white"
              aria-label="Send"
            >
              <Send size={18} />
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}

function StatBar({ label, val, color }) {
  return (
    <div>
      <div className="flex justify-between text-xs uppercase tracking-widest">
        <span className="text-white/70">{label}</span>
        <span style={{ color }}>{val}/100</span>
      </div>
      <div className="mt-1 h-2 bg-white/10 border-2 border-white/20">
        <div className="h-full" style={{ width: `${Math.min(100, Math.max(0, val))}%`, background: color }} />
      </div>
    </div>
  );
}
