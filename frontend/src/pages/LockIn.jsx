import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, getSessionId } from "@/lib/api";
import { LOCKIN } from "@/constants/testIds";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { inc } from "@/lib/store";
import { ArrowLeft, Play, Pause, Square, Loader2, Check } from "lucide-react";

function fmt(sec) {
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function LockIn() {
  const navigate = useNavigate();
  const [task, setTask] = useState("");
  const [minutes, setMinutes] = useState(45);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const tick = useRef(null);

  useEffect(() => {
    if (running && remaining > 0) {
      tick.current = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
      return () => clearInterval(tick.current);
    }
    if (running && remaining === 0) {
      setRunning(false);
      setCompleted(true);
      inc("lock_ins_completed");
      toast.success("Lock-in complete. Bhai actually did it. 🗿", { duration: 5000 });
    }
  }, [running, remaining]);

  const genPlan = async () => {
    if (!task.trim()) { toast.error("Bhai task toh bata."); return; }
    setLoading(true);
    try {
      const r = await api.lockIn({ task: task.trim(), minutes, session_id: getSessionId() });
      setPlan(r);
      setRemaining(minutes * 60);
      setCompleted(false);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Plan generation failed.");
    } finally { setLoading(false); }
  };

  const start = () => setRunning(true);
  const pause = () => setRunning(false);
  const stop = () => { setRunning(false); setRemaining(0); setPlan(null); setCompleted(false); };

  const progress = plan ? 1 - remaining / (minutes * 60) : 0;

  return (
    <div data-testid={LOCKIN.root} className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="border-b-2 border-white/20 px-4 sm:px-8 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate("/")}
          className="border-2 border-white p-2 hover:bg-white hover:text-black transition-colors"
        ><ArrowLeft size={16} /></button>
        <div className="flex-1">
          <div className="font-display text-2xl sm:text-3xl uppercase leading-none">🔒 LOCK-IN</div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-white/50">No bakchodi. Just work.</div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-8 py-8">
        {!plan && (
          <div className="space-y-6 pop-in">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-[#ffcc00] mb-2">◈ Task</div>
              <Textarea
                data-testid={LOCKIN.taskInput}
                value={task}
                onChange={(e) => setTask(e.target.value)}
                placeholder="What are you locking in for? e.g. 'Finish DSA chapter 3 - recursion'"
                className="bg-black text-white border-2 border-white rounded-none font-mono min-h-[100px] focus-visible:ring-0 focus-visible:border-[#ffcc00]"
              />
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-[#ffcc00] mb-2">◈ Minutes</div>
              <div className="flex items-center gap-3">
                <Input
                  data-testid={LOCKIN.minutesInput}
                  type="number"
                  min={5}
                  max={180}
                  value={minutes}
                  onChange={(e) => setMinutes(Math.max(5, Math.min(180, Number(e.target.value) || 45)))}
                  className="bg-black text-white border-2 border-white rounded-none font-mono w-32 h-12 text-center text-xl focus-visible:ring-0 focus-visible:border-[#ffcc00]"
                />
                <div className="flex gap-2">
                  {[25, 45, 90].map((m) => (
                    <button
                      key={m}
                      onClick={() => setMinutes(m)}
                      className={"px-3 py-2 border-2 font-mono text-xs uppercase tracking-widest " +
                        (minutes === m ? "bg-[#ffcc00] text-black border-[#ffcc00]" : "border-white/40 text-white/70 hover:border-white")}
                    >{m}m</button>
                  ))}
                </div>
              </div>
            </div>
            <Button
              data-testid={LOCKIN.planBtn}
              onClick={genPlan}
              disabled={loading || !task.trim()}
              className="w-full h-14 bg-[#ff3b30] text-white border-2 border-[#ff3b30] rounded-none font-display text-2xl uppercase tracking-wider hover:bg-black hover:text-[#ff3b30]"
              style={{ boxShadow: "6px 6px 0 0 #ffcc00" }}
            >
              {loading ? <><Loader2 className="mr-2 animate-spin" size={18} /> Planning</> : "Lock Me In 🔒"}
            </Button>
          </div>
        )}

        {plan && (
          <div className="space-y-6 pop-in">
            <div className="border-2 border-white p-6" style={{ boxShadow: "6px 6px 0 0 #ffcc00" }}>
              <div className="font-mono text-[10px] uppercase tracking-widest text-[#ffcc00] mb-2">◈ Verdict</div>
              <div className="font-mono text-sm">{plan.verdict}</div>
              <div className="border-t-2 border-white/20 mt-4 pt-3">
                <div className="font-mono text-[10px] uppercase tracking-widest text-[#ff3b30] mb-1">Right now (60 sec):</div>
                <div className="font-mono text-sm">▸ {plan.first_action}</div>
              </div>
              <div className="border-t-2 border-white/20 mt-3 pt-3">
                <div className="font-mono text-[10px] uppercase tracking-widest text-[#00e5ff] mb-1">Rule this session:</div>
                <div className="font-mono text-sm">▸ {plan.one_rule}</div>
              </div>
            </div>

            {/* Timer */}
            <div className="border-2 border-[#ffcc00] p-6 bg-black" style={{ boxShadow: "6px 6px 0 0 #ff3b30" }}>
              <div className="font-mono text-[10px] uppercase tracking-widest text-[#ffcc00] mb-2 text-center">
                {completed ? "◈ Session Complete" : running ? "◈ In Session" : "◈ Ready"}
              </div>
              <div
                data-testid={LOCKIN.timer}
                className="font-display text-7xl sm:text-8xl text-center leading-none"
                style={{ color: completed ? "#34c759" : running ? "#ff3b30" : "#ffcc00" }}
              >
                {fmt(remaining)}
              </div>
              <div className="mt-4 h-2 border-2 border-white/30 relative">
                <div className="h-full bg-[#ffcc00]" style={{ width: `${progress * 100}%` }} />
              </div>
              <div className="mt-5 flex justify-center gap-3">
                {!completed && !running && (
                  <Button
                    data-testid={LOCKIN.startBtn}
                    onClick={start}
                    className="bg-[#34c759] text-black border-2 border-[#34c759] rounded-none font-mono uppercase hover:bg-white hover:border-white"
                  ><Play size={16} className="mr-2" /> Start</Button>
                )}
                {running && (
                  <Button
                    data-testid={LOCKIN.pauseBtn}
                    onClick={pause}
                    className="bg-[#ffcc00] text-black border-2 border-[#ffcc00] rounded-none font-mono uppercase hover:bg-white"
                  ><Pause size={16} className="mr-2" /> Pause</Button>
                )}
                <Button
                  data-testid={LOCKIN.stopBtn}
                  onClick={stop}
                  className="bg-transparent text-white border-2 border-white rounded-none font-mono uppercase hover:bg-[#ff3b30] hover:border-[#ff3b30]"
                ><Square size={16} className="mr-2" /> {completed ? "New Session" : "Reset"}</Button>
              </div>
              {completed && (
                <div data-testid={LOCKIN.completeBtn} className="mt-6 text-center">
                  <div className="text-6xl mb-2">🗿</div>
                  <div className="font-display text-2xl uppercase">Bhai actually did it.</div>
                  <div className="font-mono text-xs text-white/60 mt-1">Screenshot this. May never happen again.</div>
                </div>
              )}
            </div>

            {/* Steps */}
            <div data-testid={LOCKIN.stepList}>
              <div className="font-mono text-[10px] uppercase tracking-widest text-[#ffcc00] mb-3">◈ Plan · {minutes} min</div>
              <div className="space-y-3">
                {plan.steps.map((s, i) => {
                  const cumulativeSec = plan.steps.slice(0, i + 1).reduce((a, b) => a + (b.minutes || 0), 0) * 60;
                  const elapsedSec = minutes * 60 - remaining;
                  const done = elapsedSec >= cumulativeSec && (running || completed);
                  return (
                    <div
                      key={i}
                      className={"border-2 p-4 " + (done ? "border-[#34c759] bg-[#34c759]/10" : "border-white/30")}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-display text-lg uppercase leading-none flex items-center gap-2">
                          {done && <Check size={16} className="text-[#34c759]" />}
                          {i + 1}. {s.title}
                        </div>
                        <div className="font-mono text-xs text-[#ffcc00]">{s.minutes} min</div>
                      </div>
                      <div className="font-mono text-sm text-white/70 mt-1">{s.detail}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
