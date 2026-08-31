import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SPECIAL } from "@/constants/testIds";
import { api } from "@/lib/api";
import { push, inc } from "@/lib/store";
import { X, RefreshCw, Loader2, Share2, Check } from "lucide-react";
import { toast } from "sonner";

function copyText(text) {
  try {
    const p = navigator.clipboard?.writeText(text);
    if (p && typeof p.catch === "function") p.catch(() => {});
    return true;
  } catch { return false; }
}

// ---------------- Lafda Generator ----------------
export function LafdaDialog({ open, onClose }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const fetchLafda = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.lafda({});
      setData(res);
      inc("lafda_generated");
    } catch (e) {
      setError("Server ne bhi hath khade kar diye. Try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && !data) fetchLafda();
    if (!open) setData(null);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        data-testid={SPECIAL.lafdaDialog}
        className="max-w-2xl bg-[#ff3b30] border-2 border-white rounded-none p-0 text-white [&>button]:hidden"
      >
        <DialogTitle className="sr-only">Lafda Generator</DialogTitle>
        <div className="flex items-center justify-between border-b-2 border-white px-4 py-2 font-mono text-xs uppercase tracking-widest">
          <span className="blink">● LIVE</span>
          <span>BAKCHOD NEWS NETWORK · BNN</span>
          <button onClick={onClose} className="hover:bg-white hover:text-[#ff3b30] p-1"><X size={16} /></button>
        </div>
        <div className="p-6 min-h-[280px] flex flex-col justify-between gap-6 scan">
          {loading && (
            <div className="flex-1 flex items-center justify-center font-mono uppercase tracking-widest">
              <Loader2 className="animate-spin mr-2" /> LAFDA LOADING...
            </div>
          )}
          {!loading && error && <div className="font-mono">{error}</div>}
          {!loading && data && (
            <>
              <div>
                <div className="font-mono text-xs uppercase tracking-widest text-white/70 mb-2">Breaking</div>
                <h2
                  data-testid={SPECIAL.lafdaHeadline}
                  className="font-display text-4xl sm:text-5xl leading-none uppercase"
                >
                  {data.headline}
                </h2>
                <p className="mt-4 font-mono text-sm leading-relaxed text-white/95">{data.body}</p>
              </div>
              <div className="flex items-end justify-between gap-4">
                <div className="font-hand text-2xl text-[#ffcc00]">{data.reaction}</div>
                <Button
                  data-testid={SPECIAL.lafdaRegen}
                  onClick={fetchLafda}
                  className="bg-black text-white border-2 border-white rounded-none font-mono uppercase hover:bg-white hover:text-black"
                >
                  <RefreshCw size={14} className="mr-2" /> Regenerate
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------- Am I Cooked ----------------
export function CookedDialog({ open, onClose }) {
  const [ctx, setCtx] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => { if (!open) { setResult(null); setCtx(""); setError(null); } }, [open]);

  const submit = async () => {
    if (!ctx.trim()) return;
    setLoading(true); setError(null);
    try {
      const r = await api.cooked({ context: ctx });
      setResult(r);
      push("cooked_history", { cooked_pct: r.cooked_pct, verdict: r.verdict });
    } catch (e) {
      setError(e?.response?.data?.detail || "Something broke bhai.");
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        data-testid={SPECIAL.cookedDialog}
        className="max-w-lg bg-transparent border-none rounded-none p-0 [&>button]:hidden"
      >
        <DialogTitle className="sr-only">Am I Cooked?</DialogTitle>
        <div className="receipt-dashed p-6 font-mono text-sm">
          <div className="flex items-center justify-between border-b border-dashed border-black pb-2 mb-4">
            <span className="uppercase tracking-widest text-xs">Cooked Receipt</span>
            <button onClick={onClose} className="hover:bg-black hover:text-[#f4f0e6] p-1"><X size={14} /></button>
          </div>
          <div className="uppercase text-xs tracking-widest mb-1">*** BakchodAI Diagnostic ***</div>
          <div className="text-xs mb-4">Timestamp: {new Date().toLocaleString()}</div>

          {!result && (
            <div className="space-y-3">
              <div className="text-xs uppercase tracking-widest">Describe your situation:</div>
              <Textarea
                data-testid={SPECIAL.cookedInput}
                value={ctx}
                onChange={(e) => setCtx(e.target.value)}
                placeholder="Bhai I have 3 assignments due tomorrow and haven't started..."
                className="bg-[#f4f0e6] border-2 border-black rounded-none text-black font-mono min-h-[100px] focus-visible:ring-0"
              />
              {error && <div className="text-[#ff3b30] text-xs">{error}</div>}
              <Button
                data-testid={SPECIAL.cookedSubmit}
                onClick={submit}
                disabled={loading}
                className="w-full bg-black text-[#f4f0e6] border-2 border-black rounded-none font-mono uppercase tracking-widest hover:bg-[#ff3b30]"
              >
                {loading ? "Diagnosing..." : "Am I Cooked?"}
              </Button>
            </div>
          )}

          {result && (
            <div data-testid={SPECIAL.cookedResult} className="space-y-2 pop-in">
              <StatRow label="Cooked" value={`${result.cooked_pct}%`} bar={result.cooked_pct} />
              <StatRow label="Recoverable" value={`${result.recoverable_pct}%`} bar={result.recoverable_pct} />
              <StatRow label="Delusion" value={`${result.delusion_pct}%`} bar={result.delusion_pct} />
              <div className="border-t border-dashed border-black my-3" />
              <div className="text-xs uppercase tracking-widest">Verdict:</div>
              <div className="text-sm">{result.verdict}</div>
              <div className="border-t border-dashed border-black my-3" />
              <div className="text-xs uppercase tracking-widest mb-1">Uncook Plan:</div>
              <ul className="list-none space-y-1">
                {result.uncook_plan.map((p, i) => (
                  <li key={i} className="text-sm">▸ {p}</li>
                ))}
              </ul>
              <div className="border-t border-dashed border-black mt-4 pt-2 text-center text-[10px] uppercase tracking-widest">
                — thank you come again 🙏 —
              </div>
              <div className="flex gap-2 mt-2">
                <Button
                  data-testid={SPECIAL.shareBtn}
                  onClick={() => {
                    const text = `🚨 COOKED CHECK\nCooked: ${result.cooked_pct}%\nRecoverable: ${result.recoverable_pct}%\nDelusion: ${result.delusion_pct}%\n\n${result.verdict}\n\nUncook Plan:\n${result.uncook_plan.map(p => "• "+p).join("\n")}\n\nvia BakchodAI`;
                    if (copyText(text)) { toast.success("Copied. Forward to your group."); }
                  }}
                  className="flex-1 bg-black text-[#f4f0e6] border-2 border-black rounded-none font-mono uppercase tracking-widest hover:bg-[#ff3b30]"
                >
                  <Share2 size={14} className="mr-2" /> Share
                </Button>
                <Button
                  onClick={() => setResult(null)}
                  className="flex-1 bg-transparent text-black border-2 border-black rounded-none font-mono uppercase tracking-widest hover:bg-black hover:text-[#f4f0e6]"
                >
                  Check again
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StatRow({ label, value, bar }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-24 text-xs uppercase tracking-widest">{label}</div>
      <div className="flex-1 h-2 bg-black/20 relative">
        <div className="h-full bg-black" style={{ width: `${Math.max(0, Math.min(100, bar))}%` }} />
      </div>
      <div className="w-12 text-right text-xs font-bold">{value}</div>
    </div>
  );
}

// ---------------- Aura Check ----------------
export function AuraDialog({ open, onClose }) {
  const [ctx, setCtx] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => { if (!open) { setResult(null); setCtx(""); setError(null); } }, [open]);

  const submit = async () => {
    if (!ctx.trim()) return;
    setLoading(true); setError(null);
    try {
      const r = await api.aura({ context: ctx });
      setResult(r);
      push("aura_history", { points: r.aura_points, verdict: r.verdict });
    } catch (e) {
      setError(e?.response?.data?.detail || "Something broke bhai.");
    } finally { setLoading(false); }
  };

  const auraColor = result?.aura_points >= 0 ? "#00e5ff" : "#ff3b30";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        data-testid={SPECIAL.auraDialog}
        className="max-w-lg bg-black border-2 rounded-none p-0 [&>button]:hidden"
        style={{ borderColor: result ? auraColor : "#00e5ff", boxShadow: `0 0 40px ${result ? auraColor : "#00e5ff"}66` }}
      >
        <DialogTitle className="sr-only">Aura Check</DialogTitle>
        <div className="p-6 font-mono">
          <div className="flex items-center justify-between mb-6">
            <div className="text-[#00e5ff] uppercase tracking-[0.3em] text-xs">◈ Aura Scanner v2.4</div>
            <button onClick={onClose} className="text-white hover:text-[#ff3b30]"><X size={16} /></button>
          </div>

          {!result && (
            <div className="space-y-4">
              <div className="text-xs uppercase tracking-widest text-white/70">Describe your decision / action:</div>
              <Textarea
                data-testid={SPECIAL.auraInput}
                value={ctx}
                onChange={(e) => setCtx(e.target.value)}
                placeholder="I texted my ex at 2 AM..."
                className="bg-[#141414] border-2 border-[#00e5ff]/40 rounded-none text-white font-mono min-h-[100px] focus-visible:ring-0 focus-visible:border-[#00e5ff]"
              />
              {error && <div className="text-[#ff3b30] text-xs">{error}</div>}
              <Button
                data-testid={SPECIAL.auraSubmit}
                onClick={submit}
                disabled={loading}
                className="w-full bg-[#00e5ff] text-black border-2 border-[#00e5ff] rounded-none font-mono uppercase tracking-widest hover:bg-white hover:border-white"
              >
                {loading ? "Scanning..." : "Aura Check"}
              </Button>
            </div>
          )}

          {result && (
            <div data-testid={SPECIAL.auraResult} className="space-y-4 pop-in">
              <div className="text-center">
                <div className="text-xs uppercase tracking-widest text-white/50">Aura Points</div>
                <div
                  className="font-display text-7xl sm:text-8xl leading-none"
                  style={{ color: auraColor, textShadow: `0 0 30px ${auraColor}` }}
                >
                  {result.aura_points > 0 ? `+${result.aura_points}` : result.aura_points}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <StatBox label="Decision" value={result.decision_making} />
                <StatBox label="Self-Respect" value={result.self_respect} />
                <StatBox label="Confidence" value={result.confidence} />
              </div>
              <div className="border-t-2 border-[#00e5ff]/40 pt-3">
                <div className="text-xs uppercase tracking-widest text-white/50 mb-1">Verdict</div>
                <div className="text-white text-sm">{result.verdict}</div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    const text = `🗿 AURA REPORT\nAura: ${result.aura_points > 0 ? "+" : ""}${result.aura_points}\nDecision: ${result.decision_making}\nSelf-Respect: ${result.self_respect}\nConfidence: ${result.confidence}\n\n${result.verdict}\n\nvia BakchodAI`;
                    if (copyText(text)) { toast.success("Aura report copied. Post it."); }
                  }}
                  className="flex-1 bg-[#00e5ff] text-black border-2 border-[#00e5ff] rounded-none font-mono uppercase tracking-widest hover:bg-white hover:border-white"
                >
                  <Share2 size={14} className="mr-2" /> Share
                </Button>
                <Button
                  onClick={() => setResult(null)}
                  className="flex-1 bg-transparent text-white border-2 border-white rounded-none font-mono uppercase tracking-widest hover:bg-white hover:text-black"
                >
                  Check again
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StatBox({ label, value }) {
  return (
    <div className="border-2 border-white/20 p-2">
      <div className="text-[10px] uppercase tracking-widest text-white/50">{label}</div>
      <div className="text-white text-sm font-bold truncate" title={value}>{value}</div>
    </div>
  );
}
