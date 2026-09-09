export type PteStaticQuestionBankKey = "rmcsa" | "rmcma" | "mcsa" | "mcma" | "fib_l" | "smw" | "hcs";

export type PteStaticQuestionCategory = "reading" | "listening";

export type PteStaticQuestionType =
  | "reading-single"
  | "reading-multiple"
  | "listening-single"
  | "listening-multiple"
  | "listening-fill-blank"
  | "listening-missing-word"
  | "listening-summary";

export type PteStaticOption = {
  id: string;
  text: string;
};

export type PteStaticQuestion = {
  id: string;
  index: number;
  bankKey: PteStaticQuestionBankKey;
  category: PteStaticQuestionCategory;
  type: PteStaticQuestionType;
  code: string;
  title: string;
  instruction: string;
  route: string;
  passage?: string;
  listeningText?: string;
  transcriptWithBlanks?: string;
  question?: string;
  options?: PteStaticOption[];
  answer?: string;
  answers?: string[];
  answerText: string;
  tags: string[];
};

type Topic = {
  slug: string;
  subject: string;
  field: string;
  action: string;
  benefit: string;
  group: string;
  method: string;
  challenge: string;
  keyword: string;
  result: string;
  institution: string;
};

const TOPICS: Topic[] = [
  {
    slug: "urban-wetlands",
    subject: "urban wetlands",
    field: "environmental planning",
    action: "absorb heavy rainfall",
    benefit: "reduce neighbourhood flooding",
    group: "local residents",
    method: "satellite maps",
    challenge: "maintenance costs",
    keyword: "wetlands",
    result: "flooding",
    institution: "city councils",
  },
  {
    slug: "community-libraries",
    subject: "community libraries",
    field: "public education",
    action: "host structured study groups",
    benefit: "improve adult literacy",
    group: "new migrants",
    method: "weekly workshops",
    challenge: "limited evening staffing",
    keyword: "libraries",
    result: "literacy",
    institution: "local councils",
  },
  {
    slug: "vertical-farms",
    subject: "vertical farms",
    field: "food technology",
    action: "grow vegetables in stacked indoor systems",
    benefit: "shorten supply chains",
    group: "restaurant buyers",
    method: "controlled lighting",
    challenge: "high energy demand",
    keyword: "farms",
    result: "supply",
    institution: "research institutes",
  },
  {
    slug: "museum-labels",
    subject: "museum labels",
    field: "cultural studies",
    action: "explain objects in plain language",
    benefit: "increase visitor engagement",
    group: "school groups",
    method: "audience testing",
    challenge: "limited wall space",
    keyword: "labels",
    result: "engagement",
    institution: "museums",
  },
  {
    slug: "electric-buses",
    subject: "electric buses",
    field: "urban transport",
    action: "replace diesel vehicles on short routes",
    benefit: "lower roadside emissions",
    group: "commuters",
    method: "route modelling",
    challenge: "charging infrastructure",
    keyword: "buses",
    result: "emissions",
    institution: "transport agencies",
  },
  {
    slug: "coastal-sensors",
    subject: "coastal sensors",
    field: "marine science",
    action: "record water levels during storms",
    benefit: "improve flood warnings",
    group: "coastal households",
    method: "real-time monitoring",
    challenge: "equipment corrosion",
    keyword: "sensors",
    result: "warnings",
    institution: "weather services",
  },
  {
    slug: "school-gardens",
    subject: "school gardens",
    field: "health education",
    action: "connect science lessons with food production",
    benefit: "encourage healthier eating",
    group: "primary students",
    method: "seasonal planting",
    challenge: "holiday maintenance",
    keyword: "gardens",
    result: "nutrition",
    institution: "schools",
  },
  {
    slug: "remote-clinics",
    subject: "remote clinics",
    field: "public health",
    action: "provide video consultations",
    benefit: "reduce travel for patients",
    group: "rural families",
    method: "secure telehealth software",
    challenge: "unstable internet access",
    keyword: "clinics",
    result: "travel",
    institution: "health departments",
  },
  {
    slug: "recycled-concrete",
    subject: "recycled concrete",
    field: "construction engineering",
    action: "reuse crushed building materials",
    benefit: "reduce landfill waste",
    group: "developers",
    method: "strength testing",
    challenge: "quality variation",
    keyword: "concrete",
    result: "waste",
    institution: "engineering firms",
  },
  {
    slug: "river-restoration",
    subject: "river restoration",
    field: "ecology",
    action: "remove barriers from damaged streams",
    benefit: "support fish migration",
    group: "regional communities",
    method: "habitat surveys",
    challenge: "landowner negotiations",
    keyword: "rivers",
    result: "migration",
    institution: "environment agencies",
  },
  {
    slug: "digital-archives",
    subject: "digital archives",
    field: "history",
    action: "scan fragile handwritten records",
    benefit: "protect rare documents",
    group: "family researchers",
    method: "high-resolution imaging",
    challenge: "copyright restrictions",
    keyword: "archives",
    result: "documents",
    institution: "universities",
  },
  {
    slug: "micro-credentials",
    subject: "micro-credentials",
    field: "higher education",
    action: "certify short blocks of learning",
    benefit: "support career changes",
    group: "adult learners",
    method: "industry consultation",
    challenge: "uneven recognition",
    keyword: "credentials",
    result: "careers",
    institution: "colleges",
  },
  {
    slug: "heat-resistant-crops",
    subject: "heat-resistant crops",
    field: "agricultural science",
    action: "maintain yields during hot seasons",
    benefit: "strengthen food security",
    group: "farmers",
    method: "field trials",
    challenge: "seed distribution",
    keyword: "crops",
    result: "yields",
    institution: "agricultural centres",
  },
  {
    slug: "public-art",
    subject: "public art",
    field: "urban design",
    action: "turn unused walls into community landmarks",
    benefit: "increase neighbourhood identity",
    group: "local artists",
    method: "community voting",
    challenge: "long-term cleaning",
    keyword: "art",
    result: "identity",
    institution: "arts councils",
  },
  {
    slug: "smart-parking",
    subject: "smart parking systems",
    field: "transport technology",
    action: "guide drivers to empty spaces",
    benefit: "reduce traffic circulation",
    group: "city drivers",
    method: "sensor networks",
    challenge: "privacy concerns",
    keyword: "parking",
    result: "traffic",
    institution: "municipal planners",
  },
  {
    slug: "language-exchanges",
    subject: "language exchanges",
    field: "applied linguistics",
    action: "pair learners with conversation partners",
    benefit: "increase spoken confidence",
    group: "international students",
    method: "guided weekly tasks",
    challenge: "unequal participation",
    keyword: "exchanges",
    result: "confidence",
    institution: "language centres",
  },
  {
    slug: "solar-roofs",
    subject: "solar roofs",
    field: "renewable energy",
    action: "generate electricity close to demand",
    benefit: "reduce pressure on power grids",
    group: "home owners",
    method: "installation audits",
    challenge: "shaded buildings",
    keyword: "roofs",
    result: "electricity",
    institution: "energy providers",
  },
  {
    slug: "heritage-walks",
    subject: "heritage walks",
    field: "tourism management",
    action: "connect visitors with local stories",
    benefit: "spread tourism spending",
    group: "small businesses",
    method: "guided maps",
    challenge: "seasonal demand",
    keyword: "walks",
    result: "tourism",
    institution: "visitor centres",
  },
  {
    slug: "rainwater-tanks",
    subject: "rainwater tanks",
    field: "water management",
    action: "store water from household roofs",
    benefit: "lower demand during dry months",
    group: "suburban households",
    method: "rebate programs",
    challenge: "irregular rainfall",
    keyword: "tanks",
    result: "demand",
    institution: "water authorities",
  },
  {
    slug: "workplace-mentoring",
    subject: "workplace mentoring",
    field: "organisational behaviour",
    action: "match junior staff with experienced colleagues",
    benefit: "improve staff retention",
    group: "new employees",
    method: "structured check-ins",
    challenge: "mentor workload",
    keyword: "mentoring",
    result: "retention",
    institution: "employers",
  },
  {
    slug: "bike-lanes",
    subject: "protected bike lanes",
    field: "transport planning",
    action: "separate cyclists from fast traffic",
    benefit: "increase short-distance cycling",
    group: "urban commuters",
    method: "traffic counts",
    challenge: "parking removal",
    keyword: "lanes",
    result: "cycling",
    institution: "city planners",
  },
  {
    slug: "food-labelling",
    subject: "food labelling",
    field: "consumer behaviour",
    action: "show nutritional information clearly",
    benefit: "support healthier choices",
    group: "shoppers",
    method: "front-of-pack symbols",
    challenge: "confusing serving sizes",
    keyword: "labelling",
    result: "choices",
    institution: "health agencies",
  },
  {
    slug: "noise-mapping",
    subject: "noise mapping",
    field: "environmental health",
    action: "measure sound levels across neighbourhoods",
    benefit: "identify high-stress locations",
    group: "residents",
    method: "mobile sensors",
    challenge: "changing traffic patterns",
    keyword: "mapping",
    result: "noise",
    institution: "public health teams",
  },
  {
    slug: "online-labs",
    subject: "online laboratories",
    field: "science education",
    action: "simulate experiments for distance learners",
    benefit: "improve access to practical lessons",
    group: "remote students",
    method: "interactive models",
    challenge: "limited tactile experience",
    keyword: "laboratories",
    result: "access",
    institution: "schools",
  },
  {
    slug: "green-bonds",
    subject: "green bonds",
    field: "finance",
    action: "raise money for environmental projects",
    benefit: "attract responsible investors",
    group: "public agencies",
    method: "external certification",
    challenge: "unclear reporting standards",
    keyword: "bonds",
    result: "investment",
    institution: "financial regulators",
  },
  {
    slug: "elderly-fitness",
    subject: "elderly fitness programs",
    field: "community health",
    action: "offer low-impact exercise sessions",
    benefit: "reduce isolation",
    group: "older adults",
    method: "trained instructors",
    challenge: "transport barriers",
    keyword: "fitness",
    result: "isolation",
    institution: "community centres",
  },
  {
    slug: "waterfront-renewal",
    subject: "waterfront renewal",
    field: "urban economics",
    action: "convert industrial land into public space",
    benefit: "increase local business activity",
    group: "nearby residents",
    method: "mixed-use planning",
    challenge: "housing affordability",
    keyword: "renewal",
    result: "activity",
    institution: "development agencies",
  },
  {
    slug: "battery-recycling",
    subject: "battery recycling",
    field: "materials science",
    action: "recover metals from used batteries",
    benefit: "reduce mining pressure",
    group: "manufacturers",
    method: "chemical separation",
    challenge: "collection systems",
    keyword: "recycling",
    result: "metals",
    institution: "technology companies",
  },
  {
    slug: "student-housing",
    subject: "student housing",
    field: "social policy",
    action: "provide stable accommodation near campuses",
    benefit: "reduce commute stress",
    group: "university students",
    method: "partnership funding",
    challenge: "rising construction costs",
    keyword: "housing",
    result: "stress",
    institution: "universities",
  },
  {
    slug: "urban-beekeeping",
    subject: "urban beekeeping",
    field: "environmental education",
    action: "teach residents about pollination",
    benefit: "support local biodiversity",
    group: "community volunteers",
    method: "supervised rooftop hives",
    challenge: "public safety rules",
    keyword: "beekeeping",
    result: "biodiversity",
    institution: "community groups",
  },
];

const BANK_META: Record<
  PteStaticQuestionBankKey,
  {
    category: PteStaticQuestionCategory;
    type: PteStaticQuestionType;
    code: string;
    title: string;
    route: string;
    instruction: string;
  }
> = {
  rmcsa: {
    category: "reading",
    type: "reading-single",
    code: "RMCSA",
    title: "Reading Multiple Choice, Single Answer",
    route: "/pte/reading/rmcsa",
    instruction:
      "Read the text and answer the multiple-choice question by selecting the correct response. Only one response is correct.",
  },
  rmcma: {
    category: "reading",
    type: "reading-multiple",
    code: "RMCMA",
    title: "Reading Multiple Choice, Multiple Answers",
    route: "/pte/reading/rmcma",
    instruction:
      "Read the text and answer the question by selecting all the correct responses. More than one response is correct.",
  },
  mcsa: {
    category: "listening",
    type: "listening-single",
    code: "MCSA",
    title: "Listening Multiple Choice, Single Answer",
    route: "/pte/listening/mcsa",
    instruction: "Listen to the recording and answer the multiple-choice question. Only one response is correct.",
  },
  mcma: {
    category: "listening",
    type: "listening-multiple",
    code: "MCMA",
    title: "Listening Multiple Choice, Multiple Answers",
    route: "/pte/listening/mcma",
    instruction:
      "Listen to the recording and answer the question by selecting all the correct responses. More than one response is correct.",
  },
  fib_l: {
    category: "listening",
    type: "listening-fill-blank",
    code: "FIB-L",
    title: "Listening Fill in the Blanks",
    route: "/pte/listening/fib_l",
    instruction: "Listen to the recording and type the missing words in each blank.",
  },
  smw: {
    category: "listening",
    type: "listening-missing-word",
    code: "SMW",
    title: "Select Missing Word",
    route: "/pte/listening/smw",
    instruction:
      "Listen to the recording and select the missing word or phrase that completes the recording.",
  },
  hcs: {
    category: "listening",
    type: "listening-summary",
    code: "HCS",
    title: "Highlight Correct Summary",
    route: "/pte/listening/hcs",
    instruction: "Listen to the recording and select the summary that best matches it.",
  },
};

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function baseQuestion(bankKey: PteStaticQuestionBankKey, topic: Topic, index: number) {
  const meta = BANK_META[bankKey];
  return {
    id: `${bankKey}-${pad(index + 1)}-${topic.slug}`,
    index: index + 1,
    bankKey,
    category: meta.category,
    type: meta.type,
    code: meta.code,
    title: `${meta.code} Practice ${pad(index + 1)}`,
    instruction: meta.instruction,
    route: meta.route,
    tags: [meta.code, topic.field],
  };
}

function readingPassage(topic: Topic) {
  return `${topic.subject} are often presented as a simple solution in ${topic.field}, but their value depends on how carefully they are introduced. Supporters argue that they can ${topic.action} and ${topic.benefit}. However, the evidence is strongest when projects are planned around local needs rather than copied from another city or institution. For this reason, ${topic.institution} increasingly rely on ${topic.method} before making decisions. The main risk is that ${topic.challenge} may reduce the long-term effect of the project if it is ignored at the design stage.`;
}

function listeningText(topic: Topic) {
  return `In today's short lecture, the speaker discusses ${topic.subject} in the context of ${topic.field}. The speaker explains that they can ${topic.action}, which may ${topic.benefit}. The speaker also notes that ${topic.group} are often the first to notice the benefits. However, the speaker warns that ${topic.challenge} can limit success, so ${topic.method} should be used before any large project begins.`;
}

function finalWord(value: string) {
  return value.trim().split(/\s+/).at(-1)?.replace(/[^a-z-]/gi, "") ?? value;
}

function buildRmcsa(topic: Topic, index: number): PteStaticQuestion {
  return {
    ...baseQuestion("rmcsa", topic, index),
    passage: readingPassage(topic),
    question: `What is the writer's main point about ${topic.subject}?`,
    options: [
      { id: "A", text: `They are useful only when ${topic.group} manage them directly.` },
      { id: "B", text: `They work best when decisions are based on local evidence and planning.` },
      { id: "C", text: `They should be avoided because ${topic.challenge} is impossible to solve.` },
      { id: "D", text: `They are mainly decorative and have little practical value.` },
    ],
    answer: "B",
    answerText: "B. They work best when decisions are based on local evidence and planning.",
  };
}

function buildRmcma(topic: Topic, index: number): PteStaticQuestion {
  return {
    ...baseQuestion("rmcma", topic, index),
    passage: readingPassage(topic),
    question: "Which TWO claims are made in the text?",
    options: [
      { id: "A", text: `${topic.subject} can ${topic.action}.` },
      { id: "B", text: `${topic.subject} always succeed when copied from another location.` },
      { id: "C", text: `${topic.method} can help institutions make better planning decisions.` },
      { id: "D", text: `${topic.challenge} has no effect on long-term outcomes.` },
      { id: "E", text: `${topic.group} should not be considered when projects are designed.` },
    ],
    answers: ["A", "C"],
    answerText: "A and C.",
  };
}

function buildMcsa(topic: Topic, index: number): PteStaticQuestion {
  return {
    ...baseQuestion("mcsa", topic, index),
    listeningText: listeningText(topic),
    question: `What is the main reason the speaker supports careful planning for ${topic.subject}?`,
    options: [
      { id: "A", text: `Because ${topic.subject} should replace all other public projects.` },
      { id: "B", text: `Because local needs and evidence affect whether the project succeeds.` },
      { id: "C", text: `Because ${topic.group} usually oppose new projects.` },
      { id: "D", text: `Because ${topic.challenge} has already been completely solved.` },
    ],
    answer: "B",
    answerText: "B. Because local needs and evidence affect whether the project succeeds.",
  };
}

function buildMcma(topic: Topic, index: number): PteStaticQuestion {
  return {
    ...baseQuestion("mcma", topic, index),
    listeningText: listeningText(topic),
    question: "Which TWO points are mentioned by the speaker?",
    options: [
      { id: "A", text: `${topic.subject} have no connection with ${topic.field}.` },
      { id: "B", text: `${topic.subject} can ${topic.action}.` },
      { id: "C", text: `${topic.group} are never affected by the project.` },
      { id: "D", text: `${topic.challenge} may limit the success of the project.` },
      { id: "E", text: `${topic.method} should be avoided during planning.` },
    ],
    answers: ["B", "D"],
    answerText: "B and D.",
  };
}

function buildFibL(topic: Topic, index: number): PteStaticQuestion {
  return {
    ...baseQuestion("fib_l", topic, index),
    listeningText: `Researchers studying ${topic.subject} have found that careful planning can improve ${topic.result}. The project usually depends on reliable evidence, especially when ${topic.group} are directly affected. Without attention to practical limits, the benefits may become weaker over time.`,
    transcriptWithBlanks:
      `Researchers studying ${topic.subject} have found that careful planning can improve {{1}}. ` +
      `The project usually depends on reliable evidence, especially when {{2}} are directly affected. ` +
      `Without attention to practical {{3}}, the benefits may become weaker over {{4}}.`,
    answers: [topic.result, finalWord(topic.group), "limits", "time"],
    answerText: `1. ${topic.result}  2. ${finalWord(topic.group)}  3. limits  4. time`,
  };
}

const SMW_ENDINGS = [
  "before any final decision is made",
  "when the first results are reviewed",
  "after local needs have been measured",
  "once the pilot program is complete",
];

function buildSmw(topic: Topic, index: number): PteStaticQuestion {
  const answer = SMW_ENDINGS[index % SMW_ENDINGS.length];
  return {
    ...baseQuestion("smw", topic, index),
    listeningText:
      `The committee is interested in ${topic.subject} because the project could ${topic.action}. ` +
      `Members agree that the potential benefit is clear, especially for ${topic.group}. ` +
      `However, they also believe that ${topic.method} is needed ${answer}.`,
    question: "The recording ends with:",
    options: [
      { id: "A", text: answer },
      { id: "B", text: "because the project was cancelled immediately" },
      { id: "C", text: "although nobody understood the proposal" },
      { id: "D", text: "while the old system disappears completely" },
    ],
    answer: "A",
    answerText: `A. ${answer}.`,
  };
}

function buildHcs(topic: Topic, index: number): PteStaticQuestion {
  return {
    ...baseQuestion("hcs", topic, index),
    listeningText: listeningText(topic),
    question: "Select the best summary of the recording.",
    options: [
      {
        id: "A",
        text: `The speaker argues that ${topic.subject} are no longer relevant to ${topic.field}.`,
      },
      {
        id: "B",
        text: `The speaker says ${topic.subject} can be valuable, but their success depends on planning, evidence and managing practical limits.`,
      },
      {
        id: "C",
        text: `The speaker mainly compares ${topic.subject} with unrelated entertainment activities.`,
      },
      {
        id: "D",
        text: `The speaker claims that ${topic.challenge} has made all future projects impossible.`,
      },
    ],
    answer: "B",
    answerText:
      "B. The speaker says the project can be valuable, but its success depends on planning, evidence and managing practical limits.",
  };
}

export const PTE_STATIC_QUESTION_BANKS = {
  rmcsa: TOPICS.map(buildRmcsa),
  rmcma: TOPICS.map(buildRmcma),
  mcsa: TOPICS.map(buildMcsa),
  mcma: TOPICS.map(buildMcma),
  fib_l: TOPICS.map(buildFibL),
  smw: TOPICS.map(buildSmw),
  hcs: TOPICS.map(buildHcs),
} satisfies Record<PteStaticQuestionBankKey, PteStaticQuestion[]>;

export function getPteStaticQuestionBank(bankKey: PteStaticQuestionBankKey) {
  return PTE_STATIC_QUESTION_BANKS[bankKey];
}

export function getPteStaticQuestion(bankKey: PteStaticQuestionBankKey, id: string) {
  return PTE_STATIC_QUESTION_BANKS[bankKey].find((question) => question.id === id) ?? null;
}

export function getPteStaticQuestionMeta(bankKey: PteStaticQuestionBankKey) {
  return BANK_META[bankKey];
}
