export const slogans = [
  "Go Further with English",
  "Reach Higher, Speak Better",
  "Elevate Your English",
  "Beyond English, Toward Excellence",
  "Higher Vision, Better English",
  "English That Takes You Further",
  "Unlock Your English Potential",
  "From Good to Great English",
  "Step Up Your English Game",
  "Master English, Expand Your World",
  "English for a Bigger World",
  "Open Minds, Global Voices",
  "Speak Globally, Think Broadly",
  "Your Bridge to the World",
  "Language Beyond Borders",
  "Precision in Language, Power in Expression",
  "Where English Meets Excellence",
  "Clarity, Confidence, Communication",
  "Build Strong Foundations in English",
  "Academic English, Real Results",
  "Aim High, Go Far with English",
  "High Standards, Far Horizons",
  "Rise Higher, Go Further",
  "High Vision. Far Reach. English.",
  "Where Vision Meets Language",
  "Learn English, Reach Beyond",
  "Stronger English, Brighter Future",
  "English with Vision and Purpose",
];

export function getRandomSlogan() {
  const randomIndex = Math.floor(Math.random() * slogans.length);
  return slogans[randomIndex];
}