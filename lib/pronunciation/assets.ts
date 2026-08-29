export type PronunciationCategory = "short-vowels" | "long-vowels" | "diphthongs" | "consonant-pairs";

export type PronunciationAsset = {
  id: string;
  order: number;
  category: PronunciationCategory;
  symbol: string;
  title: string;
  subtitle: string;
  exampleWords: string[];
  audioUrl: string;
};

const pronunciationAssetBaseUrl = "https://pub-b96989cc617f460facb9c254b7d2c5db.r2.dev/pronunciation";

export const phonemicChartUrl = `${pronunciationAssetBaseUrl}/phonemic-chart.jpg`;

export const pronunciationCategoryLabels: Record<PronunciationCategory, { label: string; english: string; description: string }> = {
  "short-vowels": {
    label: "短元音",
    english: "Short vowels",
    description: "建立英式发音的核心口型与舌位。",
  },
  "long-vowels": {
    label: "长元音",
    english: "Long vowels",
    description: "训练稳定拉长与清晰音质。",
  },
  diphthongs: {
    label: "双元音",
    english: "Diphthongs",
    description: "练习从起始音滑向目标音。",
  },
  "consonant-pairs": {
    label: "辅音组合",
    english: "Consonant pairs",
    description: "集中处理 IELTS/PTE 里最容易混淆的辅音。",
  },
};

export const pronunciationAssets: PronunciationAsset[] = [
  { id: "short-i", order: 1, category: "short-vowels", symbol: "/ɪ/", title: "short i", subtitle: "短促、放松，不要读成长 /iː/。", exampleWords: ["sit", "ship", "business"], audioUrl: `${pronunciationAssetBaseUrl}/1-short-i.mp3` },
  { id: "short-e", order: 2, category: "short-vowels", symbol: "/e/", title: "short e", subtitle: "嘴角自然展开，声音短而清楚。", exampleWords: ["bed", "head", "many"], audioUrl: `${pronunciationAssetBaseUrl}/2-short-e.mp3` },
  { id: "short-ae", order: 3, category: "short-vowels", symbol: "/æ/", title: "short ae", subtitle: "口腔打开，避免读成中文“爱”。", exampleWords: ["cat", "plan", "academic"], audioUrl: `${pronunciationAssetBaseUrl}/3-short-ae.mp3` },
  { id: "short-o", order: 4, category: "short-vowels", symbol: "/ɒ/", title: "short o", subtitle: "英式短 o，口型圆但发音短。", exampleWords: ["hot", "cost", "quality"], audioUrl: `${pronunciationAssetBaseUrl}/4-short-o.mp3` },
  { id: "short-uuu", order: 5, category: "short-vowels", symbol: "/ʊ/", title: "short u", subtitle: "短促的 /ʊ/，不要拉成长音。", exampleWords: ["book", "put", "could"], audioUrl: `${pronunciationAssetBaseUrl}/6-short-u.mp3` },
  { id: "short-u", order: 6, category: "short-vowels", symbol: "/ʌ/", title: "short uh", subtitle: "中央打开的短元音，常见于重读音节。", exampleWords: ["cup", "study", "enough"], audioUrl: `${pronunciationAssetBaseUrl}/5-short-uuu.mp3` },
  { id: "schwa", order: 7, category: "short-vowels", symbol: "/ə/", title: "schwa", subtitle: "弱读核心音，决定英语节奏自然度。", exampleWords: ["about", "teacher", "support"], audioUrl: `${pronunciationAssetBaseUrl}/7-schwa.mp3` },
  { id: "long-i", order: 8, category: "long-vowels", symbol: "/iː/", title: "long ee", subtitle: "嘴角展开，声音稳定拉长。", exampleWords: ["see", "people", "machine"], audioUrl: `${pronunciationAssetBaseUrl}/8-long-i.mp3` },
  { id: "long-a", order: 9, category: "long-vowels", symbol: "/ɑː/", title: "long ar", subtitle: "英式长 a，喉咙打开、不要卷舌。", exampleWords: ["car", "part", "father"], audioUrl: `${pronunciationAssetBaseUrl}/9-long-a.mp3` },
  { id: "long-u", order: 10, category: "long-vowels", symbol: "/uː/", title: "long oo", subtitle: "双唇收圆，声音向前集中。", exampleWords: ["blue", "move", "student"], audioUrl: `${pronunciationAssetBaseUrl}/10-long-u.mp3` },
  { id: "long-or", order: 11, category: "long-vowels", symbol: "/ɔː/", title: "long or", subtitle: "圆唇长音，注意不要读成短 o。", exampleWords: ["law", "course", "thought"], audioUrl: `${pronunciationAssetBaseUrl}/11-long-or.mp3` },
  { id: "long-er", order: 12, category: "long-vowels", symbol: "/ɜː/", title: "long er", subtitle: "英式不卷舌长音，声音放在中部。", exampleWords: ["bird", "work", "learn"], audioUrl: `${pronunciationAssetBaseUrl}/12-long-er.mp3` },
  { id: "diphth-ai", order: 13, category: "diphthongs", symbol: "/aɪ/", title: "diphthong ai", subtitle: "从开口音自然滑向 /ɪ/。", exampleWords: ["time", "price", "society"], audioUrl: `${pronunciationAssetBaseUrl}/13-diphth-ai.mp3` },
  { id: "diphth-ei", order: 14, category: "diphthongs", symbol: "/eɪ/", title: "diphthong ei", subtitle: "先稳住 /e/，再轻滑到 /ɪ/。", exampleWords: ["day", "change", "education"], audioUrl: `${pronunciationAssetBaseUrl}/14-diphth-ei.mp3` },
  { id: "diphth-oi", order: 15, category: "diphthongs", symbol: "/ɔɪ/", title: "diphthong oi", subtitle: "圆唇开始，结尾轻收。", exampleWords: ["choice", "voice", "employ"], audioUrl: `${pronunciationAssetBaseUrl}/15-diphth-oi.mp3` },
  { id: "diphth-au", order: 16, category: "diphthongs", symbol: "/aʊ/", title: "diphthong au", subtitle: "口型从打开滑向收圆。", exampleWords: ["now", "house", "allow"], audioUrl: `${pronunciationAssetBaseUrl}/16-diphth-au.mp3` },
  { id: "diphth-ou", order: 17, category: "diphthongs", symbol: "/əʊ/", title: "diphthong ou", subtitle: "英式 /əʊ/，不要读成美式过重的 /oʊ/。", exampleWords: ["go", "home", "global"], audioUrl: `${pronunciationAssetBaseUrl}/17-diphth-ou.mp3` },
  { id: "diphth-ia", order: 18, category: "diphthongs", symbol: "/ɪə/", title: "diphthong ear", subtitle: "从 /ɪ/ 轻轻滑向弱读音。", exampleWords: ["near", "clear", "experience"], audioUrl: `${pronunciationAssetBaseUrl}/18-diphth-ia.mp3` },
  { id: "diphth-air", order: 19, category: "diphthongs", symbol: "/eə/", title: "diphthong air", subtitle: "英式 air 音，避免卷舌过重。", exampleWords: ["care", "share", "compare"], audioUrl: `${pronunciationAssetBaseUrl}/19-diphth-air.mp3` },
  { id: "diphth-ua", order: 20, category: "diphthongs", symbol: "/ʊə/", title: "diphthong ure", subtitle: "较少见但考试听力中容易混淆。", exampleWords: ["sure", "tour", "curious"], audioUrl: `${pronunciationAssetBaseUrl}/20-diphth-ua.mp3` },
  { id: "th-and-th", order: 25, category: "consonant-pairs", symbol: "/θ/ /ð/", title: "th pair", subtitle: "舌尖轻触齿间，区分清辅音和浊辅音。", exampleWords: ["think", "third", "this"], audioUrl: `${pronunciationAssetBaseUrl}/25-th-and-th.mp3` },
  { id: "sh-and-zh", order: 27, category: "consonant-pairs", symbol: "/ʃ/ /ʒ/", title: "sh pair", subtitle: "舌面抬起，注意 /ʒ/ 的声带振动。", exampleWords: ["ship", "measure", "usually"], audioUrl: `${pronunciationAssetBaseUrl}/27-sh-and-z.mp3` },
  { id: "ch-and-dzh", order: 28, category: "consonant-pairs", symbol: "/tʃ/ /dʒ/", title: "ch pair", subtitle: "先阻塞再释放，避免读散。", exampleWords: ["choice", "job", "education"], audioUrl: `${pronunciationAssetBaseUrl}/28-ch-and-dz.mp3` },
];
