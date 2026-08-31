// Central localStorage store for aura history, cooked/life results, character prefs, stats.

const KEY = "bakchod_store_v1";

const DEFAULT = {
  aura_history: [],       // {points, verdict, ts}
  cooked_history: [],     // {cooked_pct, verdict, ts}
  life_history: [],       // {grade, aura_delta, one_liner, ts}
  characters_used: {},    // { tapri_bhai: 3, ... }
  courts_filed: 0,
  lafda_generated: 0,
  lock_ins_completed: 0,
  msgs: 0,
  modes: {},              // { bakchod: 3, ... }
  startedAt: 0,
};

export function loadStore() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULT, ...JSON.parse(raw) } : { ...DEFAULT };
  } catch {
    return { ...DEFAULT };
  }
}

export function saveStore(s) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {}
}

export function push(field, item, max = 20) {
  const s = loadStore();
  s[field] = [...(s[field] || []), { ...item, ts: Date.now() }].slice(-max);
  saveStore(s);
  return s;
}

export function inc(field, key, by = 1) {
  const s = loadStore();
  if (key === undefined) {
    s[field] = (s[field] || 0) + by;
  } else {
    s[field] = s[field] || {};
    s[field][key] = (s[field][key] || 0) + by;
  }
  saveStore(s);
  return s;
}

export function bumpMsgs(mode) {
  const s = loadStore();
  s.msgs = (s.msgs || 0) + 1;
  s.startedAt = s.startedAt || Date.now();
  s.modes = s.modes || {};
  s.modes[mode] = (s.modes[mode] || 0) + 1;
  const level = Math.min(100, 10 + Math.floor((s.msgs || 0) * 3.2));
  const roastRes = Math.max(5, 100 - Math.floor((s.modes?.roast || 0) * 8));
  const chai = Math.min(100, 20 + (s.modes?.chai || 0) * 6);
  const lafda = Math.min(100, 25 + (s.modes?.bakchod || 0) * 5 + (s.modes?.relationship || 0) * 4);
  s.derived = { level, roastRes, chai, lafda };
  saveStore(s);
  return s;
}

// Aggregate stats for profile card
export function profileStats() {
  const s = loadStore();
  const auraArr = s.aura_history || [];
  const totalAura = auraArr.reduce((a, b) => a + (b.points || 0), 0);
  const avgAura = auraArr.length ? Math.round(totalAura / auraArr.length) : 0;
  const cookedArr = s.cooked_history || [];
  const avgCooked = cookedArr.length
    ? Math.round(cookedArr.reduce((a, b) => a + (b.cooked_pct || 0), 0) / cookedArr.length)
    : 0;
  const lifeArr = s.life_history || [];
  const lastGrade = lifeArr.length ? lifeArr[lifeArr.length - 1].grade : "?";
  const bakchodi = s.derived?.level ?? 10;
  const roastRes = s.derived?.roastRes ?? 100;
  const berozgaarCert = (s.msgs || 0) >= 8;
  const topMode = Object.entries(s.modes || {}).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";
  const topChar = Object.entries(s.characters_used || {}).sort((a, b) => b[1] - a[1])[0]?.[0] || "default";
  return {
    totalAura, avgAura, avgCooked, lastGrade, bakchodi, roastRes,
    berozgaarCert, topMode, topChar,
    msgs: s.msgs || 0, lockIns: s.lock_ins_completed || 0,
    courts: s.courts_filed || 0, lafda: s.lafda_generated || 0,
  };
}
