import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config({ path: ".env.local", quiet: true });

if (!process.env.OPENAI_API_KEY) {
  throw new Error("Missing OPENAI_API_KEY");
}

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const outputPath = path.join(process.cwd(), "content/posts/2026-exam-prep-posts.json");

const topics = [
  ["pte", "2026 PTE 题型地图：22 种题型，别再拿旧地图赶新考场", "2026-pte-22-question-types"],
  ["pte", "PTE Respond to a Situation：40 秒不是即兴演讲，是把话说对", "2026-pte-respond-to-a-situation"],
  ["pte", "PTE Summarize Group Discussion：别当复读机，要当会议记录员", "2026-pte-summarize-group-discussion"],
  ["pte", "PTE 评分进入 AI + 人工时代：模板还能不能一招鲜？", "2026-pte-ai-human-scoring"],
  ["pte", "PTE 两小时考场节奏：65 道左右，如何不在前半场用光电量", "2026-pte-two-hour-pacing"],
  ["ielts", "2026 IELTS 机考转向：纸笔考试退场前，你该练什么", "2026-ielts-computer-delivery"],
  ["ielts", "IELTS One Skill Retake：单科重考是后悔药，但不是无限续杯", "2026-ielts-one-skill-retake"],
  ["ielts", "IELTS 机考阅读：高亮很多不等于定位很准", "2026-ielts-computer-reading"],
  ["ielts", "IELTS Writing Task 2：2026 没有神秘新标准，逻辑仍然要上班", "2026-ielts-writing-task-2"],
  ["ielts", "IELTS Speaking：背稿像导航播报，自然表达才像真人", "2026-ielts-speaking-natural-response"],
];

const officialFacts = `
Only use these verified official facts for time-sensitive claims:
- Pearson: Changes apply to PTE Academic and PTE Academic UKVI tests taken after 7 August 2025. Two new Speaking & Writing item types are Summarize Group Discussion and Respond to a Situation. The original 20 item types remain. The updated test has approximately 65 scored questions across 22 item types and remains approximately two hours.
- Pearson: Some responses are now part-scored by human experts alongside AI. Humans do not assess pronunciation or oral fluency.
- Pearson: Respond to a Situation presents an everyday situation in audio and text, allows 10 seconds to prepare and 40 seconds to speak.
- IELTS official announcement dated 5 March 2026: from mid-2026 IELTS will no longer offer paper-based tests, with exact timelines varying by market. All tests will move to computer delivery. Selected markets will introduce a Writing on Paper option. Skills assessed and score interpretation do not change.
- IELTS One Skill Retake: available only when eligibility requirements are met; the original full test must be IELTS on computer at a participating centre; it must be taken within 60 days; only one skill and one retake per full test. Acceptance should be checked with the target organisation.
- Do not invent visa score requirements, fees, availability by city, or unofficial scoring weights.
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
      content: `你是熟悉 PTE Academic、IELTS 与澳洲留学考试的资深中文教育编辑。文章必须准确、实用、轻松诙谐，但不能油腻、夸张或贬低考生。${officialFacts}`,
    },
    {
      role: "user",
      content: `为下面 10 个既定主题分别写一篇中文备考文章：\n${topics.map(([exam, title, slug], index) => `${index + 1}. [${exam.toUpperCase()}] ${title} | slug=${slug}`).join("\n")}\n\n要求：\n- 每篇 550-850 个中文字符，短而有用。\n- Markdown 正文，使用 2-4 个二级标题、简短段落和必要的项目符号。\n- 开头直接进入问题，不重复文章标题。\n- 幽默来自贴切比喻，不写段子合集。\n- 明确区分官方事实与教学建议，不把教学建议冒充官方规定。\n- 每篇末尾必须逐字包含标题“## 一句话带走”和“## 官方信息来源”。\n- “一句话带走”下面写一句总结；“官方信息来源”下面至少放一个可点击 Markdown 链接。\n- PTE 来源只使用 https://www.pearsonpte.com/pte-updates-2025/ 与 https://www.pearsonpte.com/pte-academic/test-format/\n- IELTS 视主题使用 https://ielts.org/news-and-insights/updates-to-ielts-test-delivery 或 https://ielts.org/take-a-test/booking-your-test/one-skill-retake 或 https://ielts.org/take-a-test/preparation-resources\n- PTE 更新生效日期必须写成“2025 年 8 月 7 日之后”，绝对不能写成 2026 年 8 月。\n- IELTS 机考转向公告发布日期为 2026 年 3 月 5 日；“2026 年中”是转向开始时间，并非全球同一天切换。\n- 不要声称 IELTS 官方建议了其网页没有明确写出的备考观点；教学建议统一表述为“小马哥建议”。\n- imagePrompt 用英文，为无文字、无标志、无水印、16:9 商务教育编辑风格横版封面；每篇构图不同。\n- title 和 slug 必须原样使用。`,
    },
  ],
  text: {
    format: {
      type: "json_schema",
      name: "exam_posts_2026",
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

  if (exam === "pte" && /2026\s*年\s*8\s*月/.test(post.content)) {
    throw new Error(`Incorrect PTE effective date: ${slug}`);
  }
}

mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), model: "gpt-5.4", posts: result.posts }, null, 2)}\n`);
console.log(`Generated ${result.posts.length} posts -> ${outputPath}`);
