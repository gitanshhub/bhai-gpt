import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SPECIAL } from "@/constants/testIds";
import { api } from "@/lib/api";
import { X, Loader2, Share2, Check, Gavel } from "lucide-react";
import { toast } from "sonner";

function copyText(text) {
  try {
    const p = navigator.clipboard?.writeText(text);
    if (p && typeof p.catch === "function") p.catch(() => {});
    return true;
  } catch { return false; }
}

// ---------------- Rate My Life ----------------
export function RateLifeDialog({ open, onClose }) {
  const [ctx, setCtx] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => { if (!open) { setResult(null); setCtx(""); setError(null); setCopied(false); } }, [open]);

  const submit = async () => {
    if (!ctx.trim()) return;
    setLoading(true); setError(null);
    try {
      const r = await api.rateLife({ context: ctx });
      setResult(r);
    } catch (e) {
      setError(e?.response?.data?.detail || "Life audit broke bhai.");
    } finally { setLoading(false); }
  };

  const share = () => {
    if (!result) return;
    const cats = result.categories.map((c) => `${c.label}: ${c.score}`).join(" · ");
    const text = `LIFE AUDIT 🧾\nGrade: ${result.overall_grade} · Aura: ${result.aura_delta > 0 ? "+" : ""}${result.aura_delta}\n${cats}\n\n${result.one_liner}\n— BakchodAI`;
    if (copyText(text)) {
      setCopied(true);
      toast.success("Copied. Ab friends ko bhej de.");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        data-testid={SPECIAL.lifeDialog}
        className="max-w-lg bg-[#ffcc00] border-2 border-black rounded-none p-0 text-black [&>button]:hidden"
        style={{ boxShadow: "8px 8px 0 0 #0a0a0a" }}
      >
        <DialogTitle className="sr-only">Rate My Life</DialogTitle>
        <div className="flex items-center justify-between border-b-2 border-black px-4 py-2 font-mono text-xs uppercase tracking-widest">
          <span>◈ LIFE AUDIT — invoice #{Math.floor(Math.random() * 9999)}</span>
          <button onClick={onClose} className="hover:bg-black hover:text-[#ffcc00] p-1"><X size={16} /></button>
        </div>
        <div className="p-6 min-h-[240px] font-mono">
          {!result && (
            <div className="space-y-4">
              <div className="text-xs uppercase tracking-widest">Describe your day / choices:</div>
              <Textarea
                data-testid={SPECIAL.lifeInput}
                value={ctx}
                onChange={(e) => setCtx(e.target.value)}
                placeholder="Slept at 4am, woke at 11, skipped class, ordered ₹400 food..."
                className="bg-[#ffe066] border-2 border-black rounded-none text-black font-mono min-h-[100px] focus-visible:ring-0 placeholder:text-black/50"
              />
              {error && <div className="text-[#ff3b30] text-xs">{error}</div>}
              <Button
                data-testid={SPECIAL.lifeSubmit}
                onClick={submit}
                disabled={loading}
                className="w-full bg-black text-[#ffcc00] border-2 border-black rounded-none font-mono uppercase tracking-widest hover:bg-[#ff3b30] hover:text-white"
              >
                {loading ? "Auditing..." : "Rate My Life"}
              </Button>
            </div>
          )}

          {result && (
            <div data-testid={SPECIAL.lifeResult} className="space-y-4 pop-in">
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-widest">Overall Grade</div>
                  <div className="font-display text-6xl leading-none">{result.overall_grade}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-widest">Aura Δ</div>
                  <div
                    className="font-display text-4xl leading-none"
                    style={{ color: result.aura_delta >= 0 ? "#0a7a2d" : "#ff3b30" }}
                  >
                    {result.aura_delta > 0 ? `+${result.aura_delta}` : result.aura_delta}
                  </div>
                </div>
              </div>

              <div className="border-t-2 border-black pt-3 space-y-1">
                {result.categories.map((c, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="uppercase tracking-widest text-xs">{c.label}</span>
                    <span className="font-bold">{c.score}</span>
                  </div>
                ))}
              </div>

              <div className="border-t-2 border-black pt-3 text-sm whitespace-pre-wrap">{result.verdict}</div>

              <div className="border-t-2 border-black pt-3 font-hand text-2xl">{result.one_liner}</div>

              <div className="flex gap-2">
                <Button
                  data-testid={SPECIAL.shareBtn}
                  onClick={share}
                  className="flex-1 bg-black text-[#ffcc00] border-2 border-black rounded-none font-mono uppercase tracking-widest hover:bg-[#ff3b30] hover:text-white"
                >
                  {copied ? <Check size={14} className="mr-2" /> : <Share2 size={14} className="mr-2" />}
                  {copied ? "Copied" : "Share"}
                </Button>
                <Button
                  onClick={() => setResult(null)}
                  className="flex-1 bg-transparent text-black border-2 border-black rounded-none font-mono uppercase tracking-widest hover:bg-black hover:text-[#ffcc00]"
                >
                  Audit again
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------- Bro Court ----------------
export function BroCourtDialog({ open, onClose }) {
  const [ctx, setCtx] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => { if (!open) { setResult(null); setCtx(""); setError(null); setCopied(false); } }, [open]);

  const submit = async () => {
    if (!ctx.trim()) return;
    setLoading(true); setError(null);
    try {
      const r = await api.broCourt({ context: ctx });
      setResult(r);
    } catch (e) {
      setError(e?.response?.data?.detail || "Court adjourned by force.");
    } finally { setLoading(false); }
  };

  const share = () => {
    if (!result) return;
    const text = `⚖️ BRO COURT\n${result.plaintiff} vs ${result.defendant}\n\nCharges:\n${result.charges.map(c => "• " + c).join("\n")}\n\nVerdict: ${result.verdict}\nCompensation: ${result.compensation}\n\n— ${result.judge_note}\n\nvia BakchodAI`;
    if (copyText(text)) {
      setCopied(true);
      toast.success("Verdict copied. Forward it.");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        data-testid={SPECIAL.courtDialog}
        className="max-w-xl bg-[#141414] border-2 border-[#ffcc00] rounded-none p-0 text-white [&>button]:hidden"
        style={{ boxShadow: "8px 8px 0 0 #ff3b30" }}
      >
        <DialogTitle className="sr-only">Bro Court</DialogTitle>
        <div className="flex items-center justify-between border-b-2 border-[#ffcc00] px-4 py-2 font-mono text-xs uppercase tracking-widest text-[#ffcc00]">
          <span className="flex items-center gap-2"><Gavel size={14} /> Bro Court · Session in progress</span>
          <button onClick={onClose} className="hover:text-white p-1"><X size={16} /></button>
        </div>
        <div className="p-6 font-mono">
          {!result && (
            <div className="space-y-4">
              <div className="text-xs uppercase tracking-widest text-[#ffcc00]">File your case:</div>
              <Textarea
                data-testid={SPECIAL.courtInput}
                value={ctx}
                onChange={(e) => setCtx(e.target.value)}
                placeholder="Rahul borrowed ₹800 four months ago and still hasn't paid..."
                className="bg-black border-2 border-[#ffcc00]/50 rounded-none text-white font-mono min-h-[120px] focus-visible:ring-0 focus-visible:border-[#ffcc00]"
              />
              {error && <div className="text-[#ff3b30] text-xs">{error}</div>}
              <Button
                data-testid={SPECIAL.courtSubmit}
                onClick={submit}
                disabled={loading}
                className="w-full bg-[#ffcc00] text-black border-2 border-[#ffcc00] rounded-none font-mono uppercase tracking-widest hover:bg-white hover:border-white"
              >
                {loading ? "Court in session..." : "Convene Court"}
              </Button>
            </div>
          )}

          {result && (
            <div data-testid={SPECIAL.courtResult} className="space-y-4 pop-in">
              <div className="grid grid-cols-2 gap-3">
                <div className="border-2 border-white p-2">
                  <div className="text-[10px] uppercase tracking-widest text-white/50">Plaintiff</div>
                  <div className="text-sm font-bold">{result.plaintiff}</div>
                </div>
                <div className="border-2 border-[#ff3b30] p-2">
                  <div className="text-[10px] uppercase tracking-widest text-[#ff3b30]">Defendant</div>
                  <div className="text-sm font-bold">{result.defendant}</div>
                </div>
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-widest text-[#ffcc00] mb-1">Charges</div>
                <ul className="space-y-1 text-sm">
                  {result.charges.map((c, i) => <li key={i}>§ {c}</li>)}
                </ul>
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-widest text-[#ffcc00] mb-1">Cross-Examination</div>
                <ul className="space-y-1 text-sm text-white/80">
                  {result.cross_examination.map((q, i) => <li key={i}>Q: {q}</li>)}
                </ul>
              </div>

              <div className="border-2 border-[#ff3b30] p-3">
                <div className="text-[10px] uppercase tracking-widest text-[#ff3b30]">Verdict</div>
                <div className="font-display text-3xl uppercase leading-none mt-1">{result.verdict}</div>
                <div className="text-sm mt-2">{result.compensation}</div>
              </div>

              <div className="font-hand text-2xl text-[#ffcc00] border-t-2 border-[#ffcc00]/40 pt-3">
                — {result.judge_note}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={share}
                  className="flex-1 bg-[#ffcc00] text-black border-2 border-[#ffcc00] rounded-none font-mono uppercase tracking-widest hover:bg-white"
                >
                  {copied ? <Check size={14} className="mr-2" /> : <Share2 size={14} className="mr-2" />}
                  {copied ? "Copied" : "Send Verdict"}
                </Button>
                <Button
                  onClick={() => setResult(null)}
                  className="flex-1 bg-transparent text-white border-2 border-white rounded-none font-mono uppercase tracking-widest hover:bg-white hover:text-black"
                >
                  New Case
                </Button>
              </div>
            </div>
          )}

          {loading && !result && (
            <div className="mt-4 flex items-center gap-2 text-[#ffcc00] text-xs uppercase tracking-widest">
              <Loader2 className="animate-spin" size={14} /> Cross-examining witnesses...
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
