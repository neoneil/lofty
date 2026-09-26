import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config({ path: ".env.local", quiet: true });

if (!process.env.OPENAI_API_KEY) throw new Error("Missing OPENAI_API_KEY");

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const outputPath = path.join(process.cwd(), "content/posts/2026-question-type-posts.json");
const topics = [
  ["pte", "PTE RA 提分：不是读得越快越像高手，断句才是隐形方向盘", "2026-pte-ra-phrasing-fluency"],
  ["pte", "PTE WFD 提分：耳朵记意思，语法帮你把漏词抓回来", "2026-pte-wfd-listening-spelling"],
  ["pte", "PTE Write Essay：20 分钟写 200–300 词，先搭骨架再装修", "2026-pte-write-essay-structure"],
  ["pte", "PTE SWT：一句话写 5–75 词，逗号不能兼职当万能胶", "2026-pte-swt-one-sentence"],
  ["pte", "PTE Reading FIB：空格不是猜词游戏，词性和搭配才是线索", "2026-pte-reading-fib-collocation"],
  ["ielts", "IELTS Writing：四项标准一起上班，别只让高级词加班", "2026-ielts-writing-four-criteria"],
  ["ielts", "IELTS Listening 选择题：选项都听见了，为什么还是选错？", "2026-ielts-listening-multiple-choice"],
  ["ielts", "IELTS 阅读 TFNG 与 YNNG：没写不是错，反着写才是错", "2026-ielts-reading-tfng-ynng"],
  ["ielts", "IELTS Speaking Part 2：一分钟笔记，不要写成微型作文", "2026-ielts-speaking-part-2"],
  ["ielts", "IELTS Speaking Part 3：从个人故事走向抽象讨论，别只回答 Yes", "2026-ielts-speaking-part-3"],
];

const verifiedFacts = `
Use only these verified official facts for claims about exam rules:
- PTE Read Aloud: on-screen text up to 60 words; 30-40 seconds to prepare; scored for Content, Oral Fluency and Pronunciation; substitutions, insertions and omissions hurt Content; candidates should speak clearly and need not rush.
- PTE Write Essay: 20 minutes; argumentative essay of 200-300 words; full Form credit inside that range; fewer than 120 or more than 380 words makes the response score zero across traits. It is scored for Content, Form, Development Structure and Coherence, Grammar, General Linguistic Range, Vocabulary and Spelling. Human experts also review Content, DSC and GLR.
- PTE Summarize Written Text: one sentence, 5-75 words; outside that range scores zero across the four factors; Content, Form, Grammar and Vocabulary are assessed. Its official source is the Speaking & Writing format page.
- For WFD and PTE Reading Fill in the Blanks, avoid inventing unofficial weightings, guaranteed templates or exact item counts. Describe official task behaviour conservatively and label training methods as Xiaomage recommendations.
- IELTS Academic Writing: 60 minutes and two tasks; Task 1 at least 150 words/about 20 minutes; Task 2 at least 250 words/about 40 minutes and contributes twice as much as Task 1. Four criteria: Task Achievement/Response, Coherence and Cohesion, Lexical Resource, Grammatical Range and Accuracy.
- IELTS Listening: 4 parts, 40 questions, recordings heard once, questions follow recording order. Multiple choice can require one answer from three options or more than one answer from a longer list; read instructions carefully.
- IELTS Reading TFNG: True agrees with text, False contradicts text, Not Given neither agrees nor contradicts. Do not use outside knowledge. YNNG concerns writer's views/claims; explain this as a distinction, not a different logical definition.
- IELTS Speaking: 11-14 minutes, three parts, assessed on Fluency and Coherence, Lexical Resource, Grammatical Range and Accuracy, Pronunciation. Part 2 gives one minute preparation and up to two minutes speaking. Part 3 is a 4-5 minute discussion of broader and more abstract issues linked to Part 2.
- Exact IELTS official URLs: Writing https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-writing ; Listening https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-listening ; Reading https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-reading ; Speaking https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-speaking .
`;

const schema = {
  type: "object",
  additionalProperties: false,
  properties: {
    posts: {
      type: "array",
      minItems: 10,
      maxItems: 10,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          exam: { type: "string", enum: ["pte", "ielts"] },
          slug: { type: "string" },
          title: { type: "string" },
          excerpt: { type: "string" },
          content: { type: "string" },
          imagePrompt: { type: "string" },
        },
        required: ["exam", "slug", "title", "excerpt", "content", "imagePrompt"],
      },
    },
  },
  required: ["posts"],
};

const response = await client.responses.create({
  model: "gpt-5.4",
  input: [
    {
      role: "system",
      content: `你是资深 PTE Academic 与 IELTS 中文教育编辑。文章必须准确、实用、商务而有一点轻松幽默。不能编造官方规则、评分权重或所谓内部秘诀。${verifiedFacts}`,
    },
    {
      role: "user",
      content: `为以下 10 个既定题型主题写中文备考文章：\n${topics.map(([exam, title, slug], index) => `${index + 1}. [${exam.toUpperCase()}] ${title} | slug=${slug}`).join("\n")}\n\n要求：\n- 每篇约 900-1300 个中文字符，比上一批更深入，但段落保持短小。\n- Markdown 正文，使用 3-5 个正文二级标题，并穿插必要列表和具体例子。\n- 开头直接提出常见问题，不重复标题。\n- 明确标注“官方规则”和“小马哥建议”，不要混淆。\n- 教学建议必须可执行：说明错误表现、错误原因、练习步骤和考场动作。\n- 幽默来自贴切比喻，不油腻、不夸张、不贬低学生。\n- 每篇末尾必须逐字包含“## 一句话带走”和“## 官方信息来源”。\n- PTE 使用 Pearson 官方题型页面：https://www.pearsonpte.com/pte-academic/test-format/ ，并按题型使用 /speaking-writing/、/reading/ 或 /listening/ 子页。\n- IELTS 按主题使用官方 writing、listening、reading、speaking format 页面。\n- 来源写成可点击 Markdown 链接。\n- imagePrompt 使用英文，要求无文字、无标志、无水印、16:9 商务教育编辑风格，每篇构图明显不同。\n- title 和 slug 必须原样使用。`,
    },
  ],
  text: {
    format: {
      type: "json_schema",
      name: "question_type_posts_2026",
      strict: true,
      schema,
    },
  },
});

const result = JSON.parse(response.output_text);

for (const [index, post] of result.posts.entries()) {
  const [exam, title, slug] = topics[index];
  post.exam = exam;
  post.title = title;
  post.slug = slug;

  if (!post.content.includes("## 一句话带走") || !post.content.includes("## 官方信息来源")) {
    throw new Error(`Missing required sections: ${slug}`);
  }
}

mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), model: "gpt-5.4", posts: result.posts }, null, 2)}\n`);
console.log(`Generated ${result.posts.length} posts -> ${outputPath}`);
