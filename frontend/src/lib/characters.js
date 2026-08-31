// Selectable character personas (must match backend CHARACTER_PROMPTS keys)
export const CHARACTERS = [
  { id: "default", name: "BakchodAI", icon: "🗿", tagline: "Original recipe." },
  { id: "tapri_bhai", name: "Tapri Bhai", icon: "🚬", tagline: "Knows every lafda." },
  { id: "sharma_uncle", name: "Sharma Uncle", icon: "👨‍🦳", tagline: "Government job form bhara?" },
  { id: "toxic_dost", name: "Toxic Dost", icon: "💀", tagline: "Always wrong. Never boring." },
  { id: "startup_bro", name: "Startup Bro", icon: "📈", tagline: "Every problem is a startup." },
];
export const CHAR_BY_ID = Object.fromEntries(CHARACTERS.map(c => [c.id, c]));
