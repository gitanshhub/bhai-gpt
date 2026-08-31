// Metadata for the 6 core bakchodi modes.
// icon = emoji fine per design guidelines (unhinged emojis allowed).

export const MODES = [
  {
    id: "bakchod",
    name: "Bakchod Mode",
    icon: "🗿",
    tagline: "Maximum nonsense. Zero productivity.",
    accent: "#ffcc00",
    shadow: "shadow-brut-y",
    intro: "Bhai, main aa gaya. Ab kya barbaad karna hai?",
  },
  {
    id: "roast",
    name: "Roast Me",
    icon: "🔥",
    tagline: "Beizzati session. You asked for it.",
    accent: "#ff3b30",
    shadow: "shadow-brut",
    intro: "Tayaar hai? Sach sunne ki himmat hai bhi ya bas dhamki?",
  },
  {
    id: "gyaan",
    name: "Gyaan Chodu",
    icon: "🧠",
    tagline: "Useless but weirdly interesting facts.",
    accent: "#00e5ff",
    shadow: "shadow-brut-b",
    intro: "Bata koi topic. Ya bol 'random' — jo bhi.",
  },
  {
    id: "chai",
    name: "Chai Tapri",
    icon: "☕",
    tagline: "Chill mode. Baat kar. No rush.",
    accent: "#34c759",
    shadow: "shadow-brut-g",
    intro: "Haan bhai bol. Kya scene chal raha hai aaj?",
  },
  {
    id: "timepass",
    name: "Timepass",
    icon: "🎲",
    tagline: "Games, quizzes, would-you-rather.",
    accent: "#ffcc00",
    shadow: "shadow-brut-y",
    intro: "Chal ek game khelte hain. Bolo 'start'.",
  },
  {
    id: "relationship",
    name: "Relationship Dost",
    icon: "❤️",
    tagline: "Terrible-but-funny advice. Sometimes real.",
    accent: "#ff3b30",
    shadow: "shadow-brut",
    intro: "Bata lafda kya hai. Aur haan — 'block' is always on the table.",
  },
];

export const MODE_BY_ID = Object.fromEntries(MODES.map((m) => [m.id, m]));
