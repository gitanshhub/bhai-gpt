import React, { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PROFILE } from "@/constants/testIds";
import { profileStats } from "@/lib/store";
import { CHAR_BY_ID } from "@/lib/characters";
import { MODE_BY_ID } from "@/lib/modes";
import { X, Download, Share2 } from "lucide-react";
import { toast } from "sonner";

function drawCard(canvas, s) {
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;

  // Background
  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0, 0, W, H);

  // Grain-ish dots
  ctx.fillStyle = "rgba(255,255,255,0.04)";
  for (let i = 0; i < 220; i++) {
    ctx.fillRect(Math.random() * W, Math.random() * H, 2, 2);
  }

  // Yellow marquee bar
  ctx.fillStyle = "#ffcc00";
  ctx.fillRect(0, 0, W, 44);
  ctx.fillStyle = "#000";
  ctx.font = "bold 22px 'Bebas Neue', sans-serif";
  ctx.textBaseline = "middle";
  ctx.fillText("★ BAKCHODAI · CERTIFIED BEROZGAAR REPORT ★", 24, 22);

  // Title
  ctx.fillStyle = "#fff";
  ctx.font = "900 74px 'Bebas Neue', sans-serif";
  ctx.fillText("BHAI PROFILE", 40, 130);

  ctx.fillStyle = "#ff3b30";
  ctx.font = "900 40px 'Bebas Neue', sans-serif";
  ctx.fillText("KYA SCENE HAI, BHAI? 🇮🇳", 40, 178);

  // Big aura number (right side)
  const auraColor = s.totalAura >= 0 ? "#00e5ff" : "#ff3b30";
  ctx.fillStyle = auraColor;
  ctx.font = "900 130px 'Bebas Neue', sans-serif";
  ctx.textAlign = "right";
  const auraStr = (s.totalAura > 0 ? "+" : "") + s.totalAura;
  ctx.fillText(auraStr, W - 40, 180);
  ctx.fillStyle = "#a1a1aa";
  ctx.font = "500 14px 'IBM Plex Mono', monospace";
  ctx.fillText("TOTAL AURA", W - 40, 200);
  ctx.textAlign = "left";

  // Divider
  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(40, 220); ctx.lineTo(W - 40, 220); ctx.stroke();

  // Stats grid
  const stats = [
    { label: "BAKCHODI", value: `${s.bakchodi}/100`, color: "#ff3b30" },
    { label: "ROAST RES.", value: `${s.roastRes}%`, color: "#ffcc00" },
    { label: "AVG COOKED", value: `${s.avgCooked}%`, color: "#f4f0e6" },
    { label: "LAST GRADE", value: s.lastGrade, color: "#34c759" },
    { label: "MSGS SENT", value: `${s.msgs}`, color: "#00e5ff" },
    { label: "LOCK-INS", value: `${s.lockIns}`, color: "#ffcc00" },
  ];
  const cols = 3;
  const cellW = (W - 80 - (cols - 1) * 16) / cols;
  const cellH = 100;
  stats.forEach((st, i) => {
    const c = i % cols;
    const r = Math.floor(i / cols);
    const x = 40 + c * (cellW + 16);
    const y = 250 + r * (cellH + 16);
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, cellW, cellH);
    ctx.fillStyle = "#a1a1aa";
    ctx.font = "700 12px 'IBM Plex Mono', monospace";
    ctx.fillText(st.label, x + 12, y + 22);
    ctx.fillStyle = st.color;
    ctx.font = "900 46px 'Bebas Neue', sans-serif";
    ctx.fillText(st.value, x + 12, y + 74);
  });

  // Top mode / character
  const bottomY = 250 + 2 * (cellH + 16) + 24;
  const mode = MODE_BY_ID[s.topMode];
  const char = CHAR_BY_ID[s.topChar];
  ctx.fillStyle = "#141414";
  ctx.strokeStyle = "#ffcc00";
  ctx.lineWidth = 2;
  ctx.fillRect(40, bottomY, W - 80, 90);
  ctx.strokeRect(40, bottomY, W - 80, 90);
  ctx.fillStyle = "#ffcc00";
  ctx.font = "700 12px 'IBM Plex Mono', monospace";
  ctx.fillText("MOST USED MODE", 56, bottomY + 26);
  ctx.fillText("FAVE CHARACTER", 56 + (W - 80) / 2, bottomY + 26);
  ctx.fillStyle = "#fff";
  ctx.font = "900 32px 'Bebas Neue', sans-serif";
  ctx.fillText(`${mode?.icon || "🗿"}  ${(mode?.name || s.topMode).toUpperCase()}`, 56, bottomY + 64);
  ctx.fillText(`${char?.icon || "🗿"}  ${(char?.name || s.topChar).toUpperCase()}`, 56 + (W - 80) / 2, bottomY + 64);

  // Certification
  const certY = bottomY + 120;
  ctx.fillStyle = s.berozgaarCert ? "#34c759" : "rgba(255,255,255,0.4)";
  ctx.font = "900 28px 'Bebas Neue', sans-serif";
  ctx.fillText(s.berozgaarCert ? "✅ CERTIFIED BEROZGAAR" : "◈ TRAINEE BEROZGAAR", 40, certY);

  // Footer
  ctx.fillStyle = "#71717a";
  ctx.font = "500 12px 'IBM Plex Mono', monospace";
  ctx.fillText("bakchodai · kaam ka nahi. par kaafi kaam ka.", 40, H - 30);

  // Bottom red bar
  ctx.fillStyle = "#ff3b30";
  ctx.fillRect(0, H - 14, W, 14);
}

export function ProfileDialog({ open, onClose }) {
  const canvasRef = useRef(null);
  const [stats, setStats] = useState(profileStats());

  useEffect(() => {
    if (!open) return;
    const s = profileStats();
    setStats(s);
    // Slight delay so fonts have a chance to load
    setTimeout(() => {
      if (canvasRef.current) drawCard(canvasRef.current, s);
    }, 50);
  }, [open]);

  const download = () => {
    if (!canvasRef.current) return;
    const url = canvasRef.current.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `bakchodai-profile-${Date.now()}.png`;
    a.click();
    toast.success("Downloaded. Forward it in the group. 🗿");
  };

  const shareText = async () => {
    const t = `BHAI PROFILE 🗿\nTotal Aura: ${stats.totalAura > 0 ? "+" : ""}${stats.totalAura}\nBakchodi: ${stats.bakchodi}/100\nRoast Resistance: ${stats.roastRes}%\nAvg Cooked: ${stats.avgCooked}%\n${stats.berozgaarCert ? "✅ CERTIFIED BEROZGAAR" : "◈ Trainee Berozgaar"}\n\nvia BakchodAI`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "BhaiGPT Profile", text: t });
      } else {
        await navigator.clipboard.writeText(t);
        toast.success("Profile copied.");
      }
    } catch {}
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        data-testid={PROFILE.dialog}
        className="max-w-2xl bg-[#0a0a0a] border-2 border-white rounded-none p-0 [&>button]:hidden"
      >
        <DialogTitle className="sr-only">Bhai Profile</DialogTitle>
        <div className="flex items-center justify-between border-b-2 border-white/30 px-4 py-2 font-mono text-xs uppercase tracking-widest text-[#ffcc00]">
          <span>◈ Shareable Bhai Report</span>
          <button onClick={onClose} className="text-white hover:text-[#ff3b30] p-1"><X size={16} /></button>
        </div>
        <div className="p-4">
          <canvas
            ref={canvasRef}
            data-testid={PROFILE.canvas}
            width={800}
            height={900}
            className="w-full h-auto max-w-full border-2 border-white/20"
          />
          <div className="flex gap-2 mt-4">
            <Button
              data-testid={PROFILE.download}
              onClick={download}
              className="flex-1 bg-[#ffcc00] text-black border-2 border-[#ffcc00] rounded-none font-mono uppercase tracking-widest hover:bg-white"
            >
              <Download size={14} className="mr-2" /> Download PNG
            </Button>
            <Button
              onClick={shareText}
              className="flex-1 bg-transparent text-white border-2 border-white rounded-none font-mono uppercase tracking-widest hover:bg-white hover:text-black"
            >
              <Share2 size={14} className="mr-2" /> Share
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
