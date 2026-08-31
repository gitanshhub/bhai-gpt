import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MODES } from "@/lib/modes";
import { HOME } from "@/constants/testIds";
import { Button } from "@/components/ui/button";
import { LafdaDialog, CookedDialog, AuraDialog } from "@/components/bakchod/SpecialDialogs";
import { RateLifeDialog, BroCourtDialog } from "@/components/bakchod/ExtraDialogs";
import { Flame, Skull, Sparkles, ClipboardList, Gavel } from "lucide-react";

const MARQUEE_ITEMS = [
  "KYA SCENE HAI, BHAI? 🇮🇳",
  "WARNING: MAXIMUM BAKCHODI AHEAD",
  "KAAM KA NAHI. PAR KAAFI KAAM KA.",
  "AI FOR PEOPLE WHO HAVE NOTHING BETTER TO DO",
  "AURA CHECK REQUIRED",
  "CERTIFIED BEROZGAAR ONLY",
];

function LanguagePicker({ lang, setLang }) {
  const opts = [
    { id: "hinglish", label: "HINGLISH", testid: HOME.langHinglish },
    { id: "hindi", label: "हिंदी", testid: HOME.langHindi },
    { id: "english", label: "ENGLISH", testid: HOME.langEnglish },
  ];
  return (
    <div className="inline-flex border-2 border-white bg-black">
      {opts.map((o) => {
        const active = lang === o.id;
        return (
          <button
            key={o.id}
            data-testid={o.testid}
            onClick={() => setLang(o.id)}
            className={
              "px-4 py-2 font-mono text-xs uppercase tracking-widest transition-colors " +
              (active ? "bg-[#ffcc00] text-black" : "bg-black text-white hover:bg-white hover:text-black")
            }
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [lang, setLang] = useState(() => localStorage.getItem("bakchod_lang") || "hinglish");
  const [lafdaOpen, setLafdaOpen] = useState(false);
  const [cookedOpen, setCookedOpen] = useState(false);
  const [auraOpen, setAuraOpen] = useState(false);
  const [lifeOpen, setLifeOpen] = useState(false);
  const [courtOpen, setCourtOpen] = useState(false);

  const chooseLang = (l) => { setLang(l); localStorage.setItem("bakchod_lang", l); };

  const openMode = (id) => {
    localStorage.setItem("bakchod_lang", lang);
    navigate(`/chat/${id}`);
  };

  return (
    <div className="min-h-screen text-white">
      {/* Marquee */}
      <div className="border-b-2 border-white bg-[#ffcc00] text-black overflow-hidden">
        <div className="marquee py-2">
          <div className="marquee-track font-display text-2xl sm:text-3xl">
            {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((t, i) => (
              <span key={i} className="mx-6">★ {t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Top bar */}
      <div className="border-b-2 border-white/20 px-4 sm:px-8 py-3 flex items-center justify-between">
        <div className="font-display text-2xl tracking-wide">
          BAKCHOD<span className="text-[#ff3b30]">AI</span>
          <span className="ml-2 font-hand text-[#ffcc00] text-lg">— dost hoon bhai</span>
        </div>
        <LanguagePicker lang={lang} setLang={chooseLang} />
      </div>

      {/* Hero */}
      <section className="px-4 sm:px-8 pt-10 sm:pt-16 pb-10 max-w-6xl">
        <div className="font-mono text-xs uppercase tracking-[0.3em] text-[#ffcc00] mb-4">
          ◈ Kaam ka nahi. Par kaafi kaam ka.
        </div>
        <h1
          data-testid={HOME.heroTitle}
          className="hero-title text-6xl sm:text-8xl md:text-9xl uppercase font-black"
        >
          KYA SCENE
          <br />
          HAI, <span className="text-[#ff3b30]">BHAI?</span> <span className="text-[#00e5ff]">🇮🇳</span>
        </h1>
        <p className="mt-6 font-mono text-sm sm:text-base text-white/70 max-w-xl leading-relaxed">
          Aapka AI dost — jobless, overconfident, chronically online. Bakchodi, roasts, aura checks, lafda — jo bhi
          barbaad karna hai aaj. Ek button dabao. Bakchodi shuru.
        </p>
      </section>

      {/* Mode Grid — Bento */}
      <section className="px-4 sm:px-8 pb-12 max-w-6xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-2 w-2 bg-[#ff3b30]" />
          <div className="font-mono text-xs uppercase tracking-[0.3em] text-white/60">Pick your poison</div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {MODES.map((m, idx) => (
            <button
              key={m.id}
              data-testid={HOME.modeCard(m.id)}
              onClick={() => openMode(m.id)}
              className={
                "brut-card text-left p-5 sm:p-6 min-h-[170px] flex flex-col justify-between group " +
                (idx % 5 === 0 ? "lg:col-span-2" : "")
              }
            >
              <div>
                <div className="text-4xl sm:text-5xl mb-3">{m.icon}</div>
                <div className="font-display text-2xl sm:text-3xl uppercase leading-none">{m.name}</div>
                <div className="font-mono text-xs mt-2 text-white/60">{m.tagline}</div>
              </div>
              <div
                className="font-mono text-[10px] uppercase tracking-widest mt-4"
                style={{ color: m.accent }}
              >
                ▸ Enter mode
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Quick Actions */}
      <section className="px-4 sm:px-8 pb-16 max-w-6xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-2 w-2 bg-[#00e5ff]" />
          <div className="font-mono text-xs uppercase tracking-[0.3em] text-white/60">Instant chaos</div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <QuickBtn
            testid={HOME.quickLafda}
            onClick={() => setLafdaOpen(true)}
            bg="#ff3b30"
            fg="#fff"
            icon={<Flame size={22} />}
            title="Lafda"
            subtitle="Fake breaking news, real damage."
          />
          <QuickBtn
            testid={HOME.quickCooked}
            onClick={() => setCookedOpen(true)}
            bg="#f4f0e6"
            fg="#0a0a0a"
            icon={<Skull size={22} />}
            title="Am I Cooked?"
            subtitle="Situation diagnostic receipt."
          />
          <QuickBtn
            testid={HOME.quickAura}
            onClick={() => setAuraOpen(true)}
            bg="#00e5ff"
            fg="#000"
            icon={<Sparkles size={22} />}
            title="Aura Check"
            subtitle="Rate your last decision."
          />
          <QuickBtn
            testid={HOME.quickLife}
            onClick={() => setLifeOpen(true)}
            bg="#ffcc00"
            fg="#000"
            icon={<ClipboardList size={22} />}
            title="Rate My Life"
            subtitle="Full life audit. Brutally honest."
          />
          <QuickBtn
            testid={HOME.quickCourt}
            onClick={() => setCourtOpen(true)}
            bg="#141414"
            fg="#ffcc00"
            icon={<Gavel size={22} />}
            title="Bro Court"
            subtitle="File a case. Get a verdict."
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-2 border-white/20 px-4 sm:px-8 py-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="font-mono text-xs uppercase tracking-widest text-white/50">
          © BakchodAI · Certified Berozgaar Product
        </div>
        <div className="font-hand text-2xl text-[#ffcc00]">bhai, tune scroll bhi kar liya 🗿</div>
      </footer>

      <LafdaDialog open={lafdaOpen} onClose={() => setLafdaOpen(false)} />
      <CookedDialog open={cookedOpen} onClose={() => setCookedOpen(false)} />
      <AuraDialog open={auraOpen} onClose={() => setAuraOpen(false)} />
      <RateLifeDialog open={lifeOpen} onClose={() => setLifeOpen(false)} />
      <BroCourtDialog open={courtOpen} onClose={() => setCourtOpen(false)} />
    </div>
  );
}

function QuickBtn({ testid, onClick, bg, fg, icon, title, subtitle }) {
  return (
    <button
      data-testid={testid}
      onClick={onClick}
      className="text-left p-5 border-2 border-white rounded-none transition-transform duration-150 hover:-translate-y-1 hover:translate-x-[-1px]"
      style={{ background: bg, color: fg, boxShadow: "6px 6px 0 0 #ffffff" }}
    >
      <div className="flex items-center gap-2 mb-2">{icon}<span className="font-mono text-[10px] uppercase tracking-widest">Quick</span></div>
      <div className="font-display text-3xl uppercase leading-none">{title}</div>
      <div className="font-mono text-xs mt-2 opacity-80">{subtitle}</div>
    </button>
  );
}
