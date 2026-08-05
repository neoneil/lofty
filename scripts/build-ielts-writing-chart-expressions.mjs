import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const SOURCE_DOC = "/mnt/c/Users/adela/OneDrive/桌面/pfds/写作/图表作文经典例句.doc";
const EXTRACTED_TEXT = path.join(process.cwd(), "tmp", "docs", "chart-sentences-extracted.txt");
const OUTPUT_PATH = path.join(process.cwd(), "content", "ielts", "vocabulary", "writing", "chart-task-expressions.json");

const createdAt = "2026-08-05T00:00:00.000Z";

const sectionConfigs = [
  {
    heading: '表示"上升和下降"的说法',
    id: "ielts-writing-chart-1",
    slug: "rise-fall",
    title: "上升与下降",
    description: "用于描述数据增长、减少、回落、恢复、加速和放缓，是数据图小作文最核心的趋势语言。",
    aiFocus: "动词和名词结构要交替使用，例如 rise / an increase，避免整篇只写 increase 或 decrease。",
    items: [
      ["go up / rise / increase", "上升；增加", "最基础的上升表达，可用于数量、比例、消费、产量等。正式写作中可以和 from...to... 或 by... 搭配。", ["climb", "grow", "edge up", "see an increase"]],
      ["rise further to", "进一步上升到", "强调前面已经上升，随后继续升至某个数值，适合描述连续增长。", ["increase further to", "climb further to"]],
      ["be up on", "比之前高", "常用于比较两个年份或时期，句式简洁，适合写概述后的细节。", ["be higher than", "show an increase on"]],
      ["plunge / plummet", "暴跌；急剧下降", "表示幅度很大、速度很快的下降，语气强于 fall 和 decline。", ["drop sharply", "fall dramatically", "collapse"]],
      ["fall / decline / drop", "下降；减少", "通用下降表达。fall 偏自然变化，decline 更正式，drop 更直接。", ["decrease", "dip", "go down"]],
      ["a steady decline", "稳定下降", "强调下降过程持续且平缓，可作名词短语放在 after / during 后面。", ["a gradual fall", "a consistent decrease"]],
      ["start to rise", "开始上升", "用于转折点，说明此前趋势结束，新的增长趋势开始。", ["begin to increase", "start climbing"]],
      ["grow steadily", "稳定增长", "强调增长速度平稳，没有剧烈波动。", ["increase consistently", "rise at a steady pace"]],
      ["a drop of", "下降了多少", "名词结构，适合和具体百分比或数值搭配。", ["a fall of", "a decline of"]],
      ["roughly double", "大约翻倍", "表示数值接近两倍，不必精确等于两倍。", ["almost double", "approximately double"]],
      ["be lost at the rate of", "以某速度流失", "常用于土地、资源、人口等持续减少的语境。", ["decline at a rate of", "be reduced by"]],
      ["top", "达到；突破", "作为动词表示达到某个高数值，适合销售额、出口额、总量。", ["reach", "exceed", "surpass"]],
      ["be on the rise", "处于上升趋势", "名词化趋势表达，适合放在概述或背景句中。", ["show an upward trend", "be increasing"]],
      ["be in decline", "处于下降趋势", "对应 be on the rise，强调整体处于减少状态。", ["show a downward trend", "be decreasing"]],
      ["lead to fewer", "导致更少", "用于解释变化结果，适合结果类数据或预测数据。", ["result in fewer", "bring about a reduction in"]],
      ["moderate", "放缓；趋缓", "表示增长、通胀或变化速度下降，但不一定变成负增长。", ["slow", "ease", "level off"]],
      ["reflect a drop / increase", "反映下降/上升", "用于把图中差距、比例变化和背后数据连接起来。", ["indicate a decline", "represent an increase"]],
    ],
  },
  {
    heading: '表示"占据"的说法：',
    id: "ielts-writing-chart-2",
    slug: "proportion-composition",
    title: "占比与构成",
    description: "用于饼图、堆叠柱图、人口结构、支出构成和类别比例。",
    aiFocus: "注意 constitute / comprise / account for 的主语不同：类别 account for 比例，整体 is composed of 类别。",
    items: [
      ["constitute", "构成；占据", "正式表达，主语通常是某个群体或类别，后接整体中的比例。", ["represent", "form", "make up"]],
      ["account for", "占据；占比为", "雅思小作文高频表达，主语是组成部分，宾语是比例或整体份额。", ["make up", "represent", "take up"]],
      ["comprise", "包括；由……组成", "可表示某类别占整体，也可表示整体由若干部分组成；写作时注意主谓关系。", ["consist of", "be made up of"]],
      ["make up", "构成；占", "比 constitute 更自然，适合多数图表语境。", ["represent", "account for"]],
      ["be composed of", "由……组成", "主语通常是整体，后面列出多个组成部分及比例。", ["be made up of", "consist of"]],
      ["as a percentage of", "作为……的百分比", "用于描述某项在家庭支出、人口、预算中的占比。", ["as a proportion of", "as a share of"]],
      ["nearly half of", "将近一半", "近似比例表达，避免所有数据都写精确百分比。", ["almost half", "close to half"]],
      ["the rest", "其余部分", "当已列出主要部分后，用 the rest 简洁收尾。", ["the remaining share", "the remainder"]],
    ],
  },
  {
    heading: '表示"倍数"的说法：',
    id: "ielts-writing-chart-3",
    slug: "multiples",
    title: "倍数与差距",
    description: "用于描述两组数据之间的倍数关系、更多/更少、差额和差距扩大。",
    aiFocus: "倍数表达要区分 twice as...as、three times as often as、four times more than 等结构。",
    items: [
      ["more than double", "超过两倍；翻了一倍多", "强调增长后数值超过原来的两倍，适合明显增长的数据。", ["over double", "more than twice as much as"]],
      ["twice as likely to", "可能性是……的两倍", "用于概率、风险、倾向，不直接用于数量。", ["twice as prone to", "twice as likely as"]],
      ["three times as often as", "频率是……的三倍", "用于频次比较，例如使用互联网、出行、参与活动。", ["three times more frequently than"]],
      ["almost twice as many as", "数量几乎是……的两倍", "主语通常是可数名词数量。", ["nearly double the number of"]],
      ["50% more than", "比……多 50%", "强调相对差距，不等于占比为 50%。", ["half as much again as"]],
      ["four times more than", "比……多四倍", "语气强，适合金额、损失、数量等差距。", ["fourfold higher than"]],
      ["jump 1.5 times to", "跃升 1.5 倍至", "把倍数变化和最终数值放在同一句里。", ["increase by 1.5 times to"]],
      ["three times more than", "比……多三倍", "用于总量差距，后面常接 the number / figure in another year。", ["triple the figure for"]],
    ],
  },
  {
    heading: "读数据的方法：",
    id: "ielts-writing-chart-4",
    slug: "data-reading",
    title: "读数与比例",
    description: "用于精确读图、近似读数、分数、总量、人均值和调查结果描述。",
    aiFocus: "数据题不必每个数字都机械照抄，可以用 some、approximately、the majority of、fewer than 等表达精确度差异。",
    items: [
      ["a quarter of", "四分之一", "分数表达，比 25% 更自然，适合正文细节。", ["one quarter of", "25% of"]],
      ["some", "大约；约有", "放在数字前表示近似值，语气比 approximately 更自然。", ["around", "roughly", "approximately"]],
      ["of those who", "在那些……的人中", "用于从总体中提取子群体，例如海外旅行者中的目的地分布。", ["among those who", "out of those who"]],
      ["with an estimated", "据估计有", "用于估计数据，适合题目给出 approximate / estimated 的情况。", ["an estimated", "approximately"]],
      ["a total of", "总共", "用于总量表达，可放在 spent / sold / produced 等动词后。", ["in total", "altogether"]],
      ["an aggregate of", "总计", "比 a total of 更正式，适合总数较大的统计。", ["a combined total of"]],
      ["per-capita", "人均", "用于人均支出、人均排放、人均收入等。", ["per person", "on a per-person basis"]],
      ["stand at", "处于；为", "稳定、正式地引出某一数值。", ["be recorded at", "be measured at"]],
      ["below poverty line", "低于贫困线", "人口类和社会类图表常见表达。", ["living in poverty", "below the poverty threshold"]],
      ["less than / fewer than", "少于", "less than 通常修饰不可数或比例，fewer than 修饰可数人数/数量。", ["under", "below"]],
      ["the majority of", "大多数", "用于超过一半的比例，不必重复精确数字。", ["most of", "a large majority of"]],
      ["one in ten", "十分之一", "自然比例表达，尤其适合人口、家庭、学生。", ["one out of ten", "10% of"]],
      ["four in ten", "十个中有四个", "口语自然但写作也可用，适合调查结果。", ["40% of", "four out of ten"]],
      ["as many as", "多达", "强调数值高或比例大。", ["up to", "no fewer than"]],
      ["the remaining", "剩余的", "用于列举后收尾，避免重复具体分类名称。", ["the rest", "the remainder"]],
      ["be projected to", "预计将", "用于未来预测图。", ["be forecast to", "be expected to"]],
    ],
  },
  {
    heading: '表示"时间"的说法：',
    id: "ielts-writing-chart-5",
    slug: "time",
    title: "时间与阶段",
    description: "用于描述年份、阶段、起止时间、此前此后、某阶段内的变化。",
    aiFocus: "时间表达最好和趋势动词绑定，例如 by 2005 表示到某时为止，prior to 表示在某变化之前。",
    items: [
      ["since then", "自那以后", "用于承接前文时间点，说明后续趋势。", ["from that point onwards"]],
      ["between...and...", "在……和……之间", "最常用的时间范围表达。", ["from...to...", "over the period from...to..."]],
      ["a month earlier", "一个月前", "用于月度变化比较。", ["the previous month", "one month before"]],
      ["by the end of", "到……末为止", "强调截至某时已经达到的结果。", ["by", "as of the end of"]],
      ["from the 1970s onwards", "从 20 世纪 70 年代起", "用于从某阶段开始持续的变化。", ["from the 1970s forward"]],
      ["for twenty years or so", "大约二十年", "表示持续时长，带近似语气。", ["for around twenty years"]],
      ["over the period", "在整个时期内", "总括某一时间段的变化。", ["during the period", "throughout the period"]],
      ["during the period from...to...", "在从……到……期间", "适合精确说明开始和结束时间。", ["between...and..."]],
      ["in those given years", "在给定年份中", "避免重复题目年份范围。", ["during the years shown"]],
      ["aged between...and...", "年龄在……之间", "用于年龄组比较。", ["in the ... age group"]],
      ["before a substantial increase", "在大幅上升之前", "用于先降后升、先平后升等转折。", ["prior to a sharp rise"]],
      ["prior to", "在……之前", "比 before 更正式。", ["before", "ahead of"]],
      ["after experiencing", "在经历……之后", "适合描述先发生某趋势，再进入另一状态。", ["following", "after undergoing"]],
      ["up to the year", "直到某年", "用于某趋势持续到某年为止。", ["until", "through to"]],
      ["over the course of", "在……过程中", "适合长时间跨度，比如一个世纪。", ["during", "throughout"]],
    ],
  },
  {
    heading: '表示"平稳"或者"波动"的说法：',
    id: "ielts-writing-chart-6",
    slug: "stability-fluctuation",
    title: "平稳与波动",
    description: "用于描述 plateau、flat、steady、constant、stagnate、fluctuate 等非单向变化。",
    aiFocus: "reach a plateau 指上升后到达高位并保持不变；stagnate 更偏停滞，常带负面含义。",
    items: [
      ["reach a plateau", "达到平台期", "通常表示上升后到达较高水平并保持不变，不再继续明显增长。", ["level off", "plateau"]],
      ["fluctuate between...and...", "在……和……之间波动", "最标准的波动表达，需要给出上下限。", ["vary between...and..."]],
      ["strong fluctuations", "剧烈波动", "名词结构，适合描述 birth rates、prices、temperatures。", ["marked fluctuations", "considerable volatility"]],
      ["remain flat at", "保持在某水平", "强调数值没有明显变化。", ["stay flat at", "remain unchanged at"]],
      ["rise and fall within a narrow range", "在小范围内上下波动", "用于轻微波动，不应写成 dramatic fluctuation。", ["vary within a narrow band"]],
      ["remain static", "保持静止；无变化", "比 remain stable 更强调几乎没有变化。", ["remain unchanged", "stay the same"]],
      ["remain steady", "保持稳定", "中性表达，适合价格、比例、数量。", ["stay stable", "hold steady"]],
      ["remain constant", "保持恒定", "强调变化率或水平固定。", ["stay constant", "remain unchanged"]],
      ["remain around that figure", "维持在该数值附近", "用于先快速变化后稳定在某一水平附近。", ["hover around that level"]],
      ["stabilize at", "稳定在", "表示经历变化后进入稳定状态。", ["settle at", "level off at"]],
      ["stagnate", "停滞", "常用于产量、供应、经济数据，暗示缺乏增长。", ["show no growth", "remain stagnant"]],
      ["slight oscillations", "轻微震荡", "比 fluctuations 更书面，适合温度、指数等。", ["minor fluctuations", "small variations"]],
    ],
  },
  {
    heading: "表示历史值的说法：",
    id: "ielts-writing-chart-7",
    slug: "records-extremes",
    title: "峰值与历史值",
    description: "用于最高点、最低点、历史纪录、新高新低、峰值和连续变化。",
    aiFocus: "peak 是达到峰值后可能回落；reach an all-time record 强调历史最高纪录；a new low 强调新低。",
    items: [
      ["a ten-year high", "十年来高点", "用于说明某数值达到过去十年中的最高水平。", ["the highest level in ten years"]],
      ["reach an all-time record", "达到历史纪录", "强调所有记录中最高或最突出。", ["hit a record high", "reach a historic high"]],
      ["a new low", "新低", "用于雨量、价格、比例等低于此前记录。", ["a record low", "the lowest level"]],
      ["an unprecedented rise", "前所未有的上升", "语气强，适合极端增长。", ["an unparalleled increase", "a record rise"]],
      ["peak at", "在……达到峰值", "后接具体数值或比例。", ["reach a peak of", "hit a peak of"]],
      ["the greatest increase", "最大增幅", "用于比较多个类别或时期中的最大变化。", ["the largest rise", "the most significant increase"]],
      ["remain high", "保持高位", "强调数据虽有波动但整体仍高。", ["stay elevated", "remain at a high level"]],
      ["the fourth lowest on record", "有记录以来第四低", "用于精确历史排名。", ["the fourth-lowest recorded level"]],
    ],
  },
  {
    heading: "排列比较的说法：",
    id: "ielts-writing-chart-8",
    slug: "ranking-comparison",
    title: "排序与对比",
    description: "用于排名、领先、落后、超过、相反变化、对比和差距描述。",
    aiFocus: "排序类表达要注意 ranked、came second、followed behind、overtook、far ahead of 等动词和介词搭配。",
    items: [
      ["rank in the top five", "位列前五", "用于国家、类别、行业排名。", ["be among the top five"]],
      ["slip to seventh", "滑落至第七", "排名下降，语气比 fall to 更贴近排名场景。", ["fall to seventh", "drop to seventh place"]],
      ["lead other countries", "领先其他国家", "强调排名或数值第一。", ["take the lead", "be ahead of other countries"]],
      ["follow behind", "紧随其后", "用于第二、第三名描述。", ["come next", "trail behind"]],
      ["come second", "位居第二", "排名类高频表达。", ["rank second", "take second place"]],
      ["beat...into third place", "超过……使其退居第三", "强调竞争排名中的超越。", ["push...into third place"]],
      ["rise two places to", "上升两位至", "用于排名提升。", ["move up two places to"]],
      ["come in at 14th", "位列第 14", "自然排名表达，适合榜单。", ["rank 14th"]],
      ["compare favorably with", "优于；相比表现更好", "正式表达，用于两组整体比较。", ["perform better than"]],
      ["closely followed by", "紧随其后的是", "用于第二大/第二高类别。", ["followed closely by"]],
      ["far ahead of", "远远领先于", "强调差距大。", ["well ahead of", "considerably ahead of"]],
      ["overtake", "超过；赶超", "用于排名或总量后来居上。", ["surpass", "move ahead of"]],
      ["lower than / far below", "低于 / 远低于", "用于对比平均值或另一国家数据。", ["below", "considerably lower than"]],
      ["while / whereas", "而；然而", "用于两个类别反向变化或差异对比。", ["by contrast", "in contrast"]],
      ["marginally larger than", "略大于", "表示差距非常小。", ["slightly higher than", "only a little larger than"]],
      ["at odds with", "与……相反", "用于一个趋势和另一个趋势不一致。", ["in contrast to", "contrary to"]],
      ["even out with age", "随着年龄增长趋于一致", "表示差异逐渐消失。", ["narrow with age", "become more equal"]],
      ["in marked contrast to", "与……形成鲜明对比", "正式对比表达，适合强烈差异。", ["in sharp contrast with"]],
      ["as against", "相比之下；而", "较正式，用于两个数据直接对照。", ["compared with", "as opposed to"]],
    ],
  },
];

function normalizeText(value) {
  return value.replace(/\r/g, "\n").replace(/\u00a0/g, " ").replace(/[ \t]+/g, " ").trim();
}

async function extractDocText() {
  if (existsSync(EXTRACTED_TEXT)) return readFileSync(EXTRACTED_TEXT, "utf8");

  const possibleModuleRoots = [
    path.join(process.cwd(), "tmp", "word-tools", "node_modules"),
    path.join(process.cwd(), "node_modules"),
  ];
  let WordExtractor = null;
  for (const moduleRoot of possibleModuleRoots) {
    try {
      WordExtractor = createRequire(path.join(moduleRoot, "noop.js"))("word-extractor");
      break;
    } catch {
      WordExtractor = null;
    }
  }
  if (!WordExtractor) {
    throw new Error("Install word-extractor in tmp/word-tools or create tmp/docs/chart-sentences-extracted.txt first.");
  }

  const extractor = new WordExtractor();
  const doc = await extractor.extract(SOURCE_DOC);
  return doc.getBody();
}

function parseSections(text) {
  const lines = normalizeText(text).split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const sections = new Map();
  let activeHeading = "";

  for (const line of lines) {
    const config = sectionConfigs.find((section) => line === section.heading);
    if (config) {
      activeHeading = config.heading;
      sections.set(activeHeading, []);
      continue;
    }

    const match = line.match(/^(\d{1,3})\.\s*(.+)$/);
    if (!match || !activeHeading) continue;
    sections.get(activeHeading).push({
      number: Number(match[1]),
      text: match[2].trim(),
    });
  }

  return sections;
}

const sourceText = await extractDocText();
const sections = parseSections(sourceText);

const categories = sectionConfigs.map((section, index) => {
  const examples = sections.get(section.heading) ?? [];
  return {
    id: section.id,
    categoryNumber: index + 1,
    slug: section.slug,
    title: section.title,
    description: section.description,
    aiFocus: section.aiFocus,
    itemCount: section.items.length,
    exampleCount: examples.length,
    items: section.items.map(([term, translation, explanation, variants], itemIndex) => ({
      number: itemIndex + 1,
      term,
      translation,
      itemType: /[\s/.-]/.test(term) ? "Phrase" : "Word",
      starred: true,
      explanation,
      variants,
      raw: `${term} ${translation}`,
    })),
    examples,
  };
});

const exampleCount = categories.reduce((total, category) => total + category.exampleCount, 0);
if (exampleCount !== 125) throw new Error(`Expected 125 examples, received ${exampleCount}.`);

const document = {
  id: "ielts-writing-chart-task-expressions",
  slug: "chart-task-expressions",
  title: "雅思小作文数据表达库",
  subtitle: "按数据图小作文常见说法整理表达、AI 补充讲解，并保留原文 125 条经典例句。",
  exam: "IELTS",
  skill: "Writing",
  category: "Vocabulary",
  createdAt,
  updatedAt: createdAt,
  sourceDocument: "写作/图表作文经典例句.doc",
  wordCount: categories.reduce((total, category) => total + category.itemCount, 0),
  categoryCount: categories.length,
  exampleCount,
  categories,
};

mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
writeFileSync(OUTPUT_PATH, `${JSON.stringify(document, null, 2)}\n`, "utf8");

console.log(`Wrote ${OUTPUT_PATH}`);
console.log(`Categories: ${document.categoryCount}`);
console.log(`Expression items: ${document.wordCount}`);
console.log(`Original examples: ${document.exampleCount}`);
for (const category of document.categories) console.log(`${category.categoryNumber}. ${category.title}: ${category.itemCount} items, ${category.exampleCount} examples`);
