# AI Prompt 管理迁移报告

日期：2026-07-29  
分支：`lofty-v4`

## 目标

把线上 AI prompt 从分散代码里逐步收拢到统一管理入口：

- 默认 prompt 登记在 `lib/ai-prompts/defaults.ts`
- 线上覆盖版本存储在 Supabase `public.ai_prompts`
- 管理入口为 `/admin/ai-prompts`
- 业务 API 通过 `lib/ai-prompts/server.ts` 读取数据库 prompt；数据库不可用时 fallback 到代码默认 prompt

## 已扫描到的 AI Prompt 文件

扫描关键字包括 `SYSTEM_PROMPT`、`buildPrompt`、`openai.chat.completions.create`、`responses.create` 等。当前发现 24 个候选文件：

- `app/api/admin/analyze-answer/route.ts`
- `app/api/admin/analyze-essay-sentence/route.ts`
- `app/api/admin/generate-essay-answer/route.ts`
- `app/api/chat/ai/route.ts`
- `app/api/course-tools/translate/route.ts`
- `app/api/generate-math-question/route.ts`
- `app/api/generate-writing-prompt/route.ts`
- `app/api/ielts-writing/route.ts`
- `app/api/ielts/speaking/ai/sample/route.ts`
- `app/api/ielts/speaking/ai/score/route.ts`
- `app/api/math/generate/route.ts`
- `app/api/math/submit/route.ts`
- `app/api/pte/essay/submit/scoring/score-essay.ts`
- `app/api/pte/sst/submit/scoring/score-sst.ts`
- `app/api/pte/swt/submit/scoring/score-swt.ts`
- `app/api/review-writing/route.ts`
- `lib/admin/pte-essay-samples.ts`
- `lib/admin/pte-swt-samples.ts`
- `lib/math/generate-math-problem.ts`
- `lib/math/prompt-templates.ts`
- `lib/pte-speaking/score-ra.ts`
- `lib/pte-speaking/score-rs.ts`
- `scripts/classify-di-visual-types.ts`
- `scripts/generate-wfd-ai-images.mjs`
- `scripts/translate-ielts-reading-passages.mjs`

## 已接入数据库管理

当前 registry 共登记 29 个 prompt。进入 `/admin/ai-prompts` 点击一次 `同步默认 Prompt 到数据库`，会一次性 upsert 全部默认 prompt。

这些 prompt 已经登记到 `lib/ai-prompts/defaults.ts`，并且业务调用已改成读取 Supabase 覆盖版本：

- `ielts.speaking.sample.system`
- `ielts.speaking.sample.user`
- `ielts.speaking.score.system`
- `ielts.speaking.score.user`
- `ielts.writing.task2.system`
- `ielts.writing.task2.user`
- `pte.writing.essay.score.user`
- `pte.writing.swt.score.user`
- `pte.listening.sst.score.user`
- `pte.speaking.ra.score.user`
- `pte.speaking.rs.score.user`
- `chat.tutor.system`
- `chat.tutor.user`
- `course.translation.system`
- `selective.writing.prompt.system`
- `selective.writing.prompt.user`
- `selective.writing.review.system`
- `selective.writing.review.user`
- `admin.pte.essay-answer.system`
- `admin.pte.essay-answer.user`
- `admin.pte.essay-sentence.system`
- `admin.pte.essay-sentence.user`
- `admin.analyze-answer.system`
- `admin.analyze-answer.user`
- `admin.pte-essay-samples.system`
- `admin.pte-essay-samples.user`
- `admin.pte-swt-samples.system`
- `admin.pte-swt-samples.user`
- `math.feedback.user`

## 尚未迁移的候选

下面这些仍在原业务文件或脚本里，建议后续分批迁移，避免一次性改动过大影响线上 AI 行为：

- 批量脚本类 prompt：WFD 图片、DI 分类、IELTS 阅读翻译
- Math 题目生成 prompt templates

## 使用规则

以后新增 runtime AI prompt：

1. 先在 `lib/ai-prompts/defaults.ts` 登记默认 prompt。
2. 在业务代码里用 `getAiPromptContent` 或 `renderAiPrompt` 读取。
3. 如果需要线上调整，到 `/admin/ai-prompts` 修改并点击 `Update`。
4. 不做删除流程；不用的 prompt 可以保留或新建 id。

## 数据库说明

需要先执行 migration `supabase/migrations/20260729000200_create_ai_prompts.sql` 创建 `public.ai_prompts` 表。

创建后进入 `/admin/ai-prompts`，点击 `同步默认 Prompt 到数据库`，即可把 registry 中的默认 prompt 写入 Supabase。
