# Lofty Codex Project Rules

This file defines the standing collaboration rules for Codex work in the Lofty project.

## Daily Start

- At the start of the first task each day, confirm the current git branch before making any changes.
- If the current branch is not the expected Lofty working branch, stop and ask before editing files.
- The repository has at least `lofty-v5` and `lofty-lite`; never infer the target branch from the task topic alone.
- If the user explicitly names a branch, work only on that branch. If a new task is ambiguous between `lofty-v5` and `lofty-lite`, ask which branch before editing.
- `lofty-v5` is the full product/database-optimization branch. `lofty-lite` is the simplified product branch and may intentionally differ in UI, content, and enabled features.

## Change Scope

- Only modify code, styles, files, or logic that the user explicitly asks to change.
- Do not change unrelated business logic, data queries, routing, auth, storage, or API behavior unless the user clearly requests it.
- When the task is style-only, keep it style-only.
- When the task is analysis-only, do not edit files.
- Preserve user changes and existing dirty work. Never revert unrelated files.

## Tooling

- Project shell commands must be written and run as WSL/Linux commands.
- Do not write PowerShell project commands for this repository.
- Prefer WSL commands for this project whenever possible.
- If a task can be done through WSL, use WSL instead of PowerShell.
- Avoid using PowerShell for project commands when the same work can be done directly through WSL, especially for shell pipes, quoting, globbing, and path-sensitive operations.

## Architecture

- New functionality must be modular and reusable.
- Prefer creating a focused component, helper, or module instead of mixing new behavior directly into large pages.
- If a feature is likely to be reused, place it in an appropriate shared location such as `components/`, `components/site/`, `components/layout-v2/`, or another existing project pattern.
- Keep changes small and aligned with the current codebase structure.

## Teaching Notes

- When the user says "授课笔记", treat it as Lofty lesson Markdown work unless they clearly mean something else.
- Lesson Markdown files belong under `app/admin/{skill}/{exam}/...`, with skill first and exam second.
- The supported top-level skill folders are `listening`, `speaking`, `reading`, and `writing`.
- The supported exam folders under each skill are `pte` and `ielts`.
- Examples:
  - `app/admin/writing/ielts/task1/line.md`
  - `app/admin/writing/pte/essay/lesson02.md`
  - `app/admin/speaking/pte/ra/lesson01.md`
- `/admin/lesson-notes` should show the four skills first, then split each selected skill into PTE and IELTS sections.
- The dynamic lesson route should remain `/admin/lessons/{exam}/{skill}/...`; do not break existing lesson URLs when reorganizing files.
- Lesson reading is handled by `lib/admin/lesson-content.ts`; update this helper if the folder convention changes.
- New lesson content should follow `content/markdownguide.md` and `content/mardowndesignguide.md`, including front matter, `mode: slides` where appropriate, `<!-- slide -->`, admonition cards, highlights, badges, and footers.
- For generated IELTS/PTE teaching notes, prefer concise slide lessons with clear learning goals, key points, examples, common mistakes, summary, and homework.
- Keep lesson card layout in `/admin/lesson-notes` responsive. Badges such as section labels must stay inside cards on desktop and mobile.

## IELTS Writing Task 1 Bank

- Cambridge IELTS Academic Writing Task 1 screenshots are stored under `public/ielts/writing/task1/`.
- The static index for the frontend is `content/ielts/writing-task1-bank.json`.
- The extraction helper is `scripts/extract-ielts-task1-images.py`; it uses a manually verified page map for Cambridge IELTS 5-21 because scanned PDFs and contents pages can make automatic text search unreliable.
- Screenshots should include the full Task 1 prompt and chart/map/process/table image. Prefer preserving extra page margin over cropping out prompt or visual information.
- The student-facing route is `/ielts/writing/task1-bank`, with the entry card on `/ielts/writing`.
- This feature uses static local files and server-side JSON loading only; do not add browser-side Supabase or R2 requests for this task bank unless explicitly requested.

## Backend Auth And Supabase

- All backend authentication and authorization must use the existing project helpers.
- Protected user-facing server pages should use `lib/auth/require-user.ts`.
- Admin-only server pages and admin-only backend work should use `lib/auth/require-admin.ts` or follow its role-checking pattern.
- Server-side Supabase access should use `lib/supabase/server.ts`.
- Service-role/admin Supabase access must use `lib/supabase/admin.ts` and stay server-only.
- Browser/client components should use `lib/supabase/client.ts` only.
- Because mainland China access must not depend on direct browser-to-Supabase connectivity, do not add new client-side Supabase database, storage, or realtime requests for user-facing features.
- For new user-facing data, auth-adjacent, storage, audit, or learning features, route browser requests through Lofty Next.js API/server actions first, then access Supabase from the server using the approved helpers.
- Existing client-side Supabase usage should be treated as migration debt unless it is an explicitly accepted exception such as Google OAuth.
- Do not create new Supabase clients, auth checks, admin role checks, cookie handling, or service-key logic inline unless the user explicitly asks for a new shared helper.
- Never expose `SUPABASE_SECRET_KEY` or service-role behavior to client components.
- Treat the hosted Supabase project as a mature, non-empty production database.
- Before any remote database structure or data change, show the proposed SQL, affected objects, risk, and verification or rollback plan to the user and receive explicit confirmation.
- This confirmation requirement includes `supabase db push`, table or column changes, indexes, RLS policies, functions, triggers, views, bulk updates, deletes, backfills, and migration repairs.
- Store every approved schema change as a timestamped SQL file in `supabase/migrations/`. Run `db:push:dry-run` before any approved `db:push`.
- Never run `supabase db push`, migration repair, reset, destructive SQL, or bulk data mutation merely because migration tooling is configured.
- PTE feature work must not use Supabase `select("*")`; select only the fields the page, component, or API actually needs. Before changing an existing PTE query, read the consuming code and keep required fields explicit.

## Database Optimization Phase

- The project is now in the database optimization phase on branch `lofty-v5`.
- Prefer improving query shape, data loading boundaries, indexes, views, and server-side aggregation over broad UI rewrites.
- The default goal for new or changed database-backed work is to reduce database IO, network payload size, repeated requests, and unnecessary loading of large fields.
- When implementing future components, pages, server actions, or API routes, default to the optimized data-loading design described in this section. Do not ask the user again whether low-IO query design should be used; it is the project default.
- Treat the following four areas as the main optimization areas unless the user explicitly changes priority:
  - Admin dashboards and student detail pages.
  - IELTS practice, attempts, speaking/writing records, and mock-test result surfaces.
  - PTE practice, attempts, scoring, prediction pages, and mock-test result surfaces.
  - Homework, AI writing feedback, AI analysis history, and mock-test reports.
- Before optimizing a query, identify the exact route/API/component, current selected columns, filters, joins, ordering, pagination, and consuming fields.
- Avoid `select("*")` in new or changed Supabase queries. Select only fields consumed by the route, component, or API response.
- For list pages, load summary fields first and fetch large text/blob-like fields only on detail expansion or detail pages.
- Treat AI feedback, essays, reports, raw responses, transcripts, full question/answer payloads, score details, answer snapshots, recordings metadata, chart/task prompt bodies, and generated explanations as large fields. Do not include them in dashboard, table, card, or history summary queries unless the visible UI immediately needs the full value.
- Summary queries should usually return only IDs, ownership fields, display names, status, type/category, score/band numbers, timestamps, short titles, short previews, counts, and publication/review flags.
- Detail queries should be separated behind click-to-expand, detail page navigation, modal opening, selected record changes, or explicit refresh actions.
- Cache already-loaded detail records in client state or server response state where appropriate so expanding the same record repeatedly does not refetch the same large payload.
- Avoid loading hidden tab content up front when the tab contains large fields. Load the active tab first and fetch other tab content lazily.
- Avoid fetching official answers, correct-answer maps, detailed AI feedback, transcript bodies, or report bodies for normal list screens. Fetch them only for scoring, review, admin detail views, or published student report views that actually display them.
- Prefer server-side routes or server components for data access. Do not add new browser-side Supabase reads for user-facing data unless explicitly approved as an exception.
- Avoid N+1 loops such as fetching one profile, attempt count, score, answer, or feedback record per row. Use grouped queries, `in (...)`, joins through existing views, database views, or RPCs instead.
- Prefer single aggregate queries, views, or RPCs for admin dashboard counts instead of N+1 per-student or per-attempt loops.
- Add or propose indexes based on observed query filters and sort order. Do not add indexes blindly.
- Before remote index, view, function, RLS, or schema changes, show SQL and get explicit user confirmation under the Backend Auth And Supabase rules above.
- Keep static IELTS/PTE content static where already implemented. Use the database for attempts, answers, scores, reports, publication state, audit, and user-owned records.
- Do not move existing static IELTS reading/listening assets or static writing-task-bank content into Supabase during optimization work unless the user explicitly requests a data-source change.
- For IELTS reading/listening, prefer reusing static-file renderers and local/static question data. Database access should be limited to user attempts, saved answers, scores, reports, publication state, and admin audit data.
- For IELTS speaking and writing, list/history pages must not pull full transcript, essay body, raw scoring JSON, or feedback JSON by default. Use summary-first loading and detail-on-demand.
- For PTE practice pages, avoid duplicate page-load queries for question lists and user status when the same information can be returned by one narrowed query, existing view, optimized view, or server-side aggregator.
- For PTE detail pages, question content required to answer the item may load immediately, but previous attempts, AI feedback, score details, and raw scoring data should load only when the UI displays history, feedback, or admin detail.
- For mock tests, keep exam-taking flows resilient by saving answers incrementally, but keep result/report screens summary-first. Admin can open full answers, correct answers, original question text, recording links, score details, and AI feedback on demand.
- For homework and AI writing feedback history, never load complete assignment content, essay text, or full AI feedback JSON in the first history list query. Fetch the full payload only after the user selects or expands a record.
- For admin student detail pages, first show counts, recent activity, statuses, and compact score summaries. Load full practice answers, transcripts, essays, correct answers, and AI feedback only for the selected record.
- When adding a new query, include pagination or an explicit reasonable limit for potentially growing tables such as attempts, answers, events, homework, AI feedback, and reports.
- When changing an existing query, preserve behavior first, then reduce columns and split large payloads. If a field is removed from an initial query, confirm the consuming component receives it from the new detail query before finishing.


## Test Account Deletion Audit

- `neilmaaustralia@gmail.com` is the user's current test account for IELTS and PTE practice testing.
- Current known user id: `43e58d1b-2641-4111-8071-50e5e3b79471`.
- Do not delete this account until the user explicitly asks to run the deletion test.
- Before deleting this test account, update the admin deletion preview and deletion function so they cover the newer tables introduced after the original delete flow.
- The deletion preview and delete flow must include at least: `ai_user_product_limits`, `ai_access_purchases`, `user_billing_profiles`, `student_homework_assignments`, `ielts.writing_attempts`, related `stripe_webhook_events` payload records if the user wants payment-event cleanup, and `mock_exam.*` records such as attempts, sections, answers, answer scores, and events.
- Also keep the existing cleanup for `profiles`, Auth user, `study_plans`, login/activity/device tables, chat tables, Zoom tables, PTE/IELTS speaking attempts, student recordings, and R2 private student audio objects.
- Current read-only audit before the user continues testing found no `student_recordings`, no PTE/IELTS speaking recordings, no mock attempts, and no matching private R2 student-audio objects for this user.
- When the user is ready to delete this account, first run a fresh read-only preview, then patch `getStudentDeletionPreview` and `deleteStudentAndRelatedData`, then test deletion with this account and verify database counts plus R2 leftovers afterward.

## IELTS Answer Visibility

- IELTS reading and listening detail pages currently hide "答案" and "答案与解析" UI behind admin-only rendering.
- IELTS reading and listening Review dialogs may be opened by normal students, but the official-answer toggle and official-answer column must remain admin-only.
- Remember the distinction between UI hiding and data exposure: if `data.answers` or an official answer map is sent to a client component, a determined student could still inspect it in the browser even when the UI hides it.
- Future stricter IELTS reading/listening answer security should avoid sending official answers to non-admin clients. Non-admin submissions should be scored by a Lofty server API, returning score/correctness only and not returning official answer text.

## WeChat Login Prep

- Before implementing WeChat login or WeChat account binding, read `docs/auth/wechat-login-prep.md`.
- WeChat Open Platform login should be treated as server-side OAuth2 work using `openid` and `unionid`; never expose the WeChat AppSecret to client components.
- Prefer starting with WeChat account binding for existing logged-in Lofty users before enabling full WeChat login for new users.

## PTE Essay Sample Generation

- PTE Write Essay sample generation should be incremental and idempotent.
- When new WE questions are added to the database, first compare active prediction questions in `pte.we` with existing rows in `pte.essay_answer`.
- Only generate samples for WE questions that do not already have a row in `pte.essay_answer`.
- Never overwrite existing essay samples or sentence translations unless the user explicitly asks for regeneration.
- Generate in small batches, preferably 5 questions at a time. After each batch, re-count total, completed, and missing questions before continuing.
- Save each generated essay immediately to `pte.essay_answer`, then save its sentence rows to `pte.essay_sentence`.
- If another page, worker, or admin process saves a sample while a batch is running, skip that question instead of creating a duplicate.
- Record AI usage for successful and failed generation attempts using the existing AI usage logging flow.
- If a batch fails midway, keep already saved samples and resume later by finding the remaining missing questions.
- Do not run bulk generation against the remote database without explicit user confirmation because it writes database rows and consumes OpenAI tokens.

## PTE SWT Sample Generation

- PTE Summarize Written Text sample generation should also be incremental and idempotent.
- When new SWT questions are added to the database, first compare active prediction questions in `pte.swt` with existing rows in `pte.swt_answer`.
- Only generate samples for SWT questions that do not already have a row in `pte.swt_answer`.
- Never overwrite existing SWT answers, source translations, answer translations, or component rows unless the user explicitly asks for regeneration.
- Generate in small batches, preferably 5 questions at a time. After each batch, re-count total, completed, and missing questions before continuing.
- Save each generated one-sentence SWT answer immediately to `pte.swt_answer`.
- Store the answer Chinese translation in `pte.swt_answer.chinese_explanation`.
- Store the source passage Chinese translation as a `pte.swt_component` row with `component_role = 'source_translation'`.
- Store sentence-combining explanation rows in `pte.swt_component` with grammar pattern, component role, source idea, and Chinese explanation.
- If another page, worker, or admin process saves a SWT answer while a batch is running, skip that question instead of creating a duplicate.
- Record AI usage for successful and failed SWT generation attempts using the existing AI usage logging flow.
- If a batch fails midway, keep already saved samples and resume later by finding the remaining missing questions.
- Do not run bulk SWT generation against the remote database without explicit user confirmation because it writes database rows and consumes OpenAI tokens.

## PTE Question Bank Loading

- New and migrated PTE question-bank list pages must use server-side pagination by default.
- Do not load the full question table and paginate in the browser. The default list query should fetch only the current page, currently 15 rows.
- Student practice status should be joined/merged only for the current page of question ids whenever possible.
- Use `lib/pte/question-bank-page.ts`, `lib/pte/question-bank-server.ts`, `lib/pte/question-bank-pagination.ts`, and `lib/pte/question-bank-presets.ts` as the default pattern for PTE list pages.
- URL query params should drive PTE list search, question status, practice status, activity status, and page number, so refresh/back navigation preserves the current list state.
- If a new PTE table has incomplete columns or no data yet, still scaffold it with the same current-page loading pattern instead of reintroducing `.limit(1500)` or full-table browser filtering.
- Future PTE database optimization target: replace the current multi-query list flow with a single RPC per question-bank page that returns the current page of questions, current-user status for those questions, and `all_question_info` together. Do this later with explicit SQL planning; until then keep the current server-side pagination pattern.

## Dynamic Loading And Disk I/O Follow-up

- The first Disk I/O optimization pass on `lofty-lite` changed Audio Collection to load only the selected group in 20-row pages, lazy-load the secondary exam on analytics/dashboard/achievements pages, cache the shared PTE prediction-id scan for 10 minutes, poll student chat only while open every 10 seconds, and send the activity heartbeat every 10 minutes without route-change duplicate writes.
- When the user says to continue dynamic-loading or Disk I/O optimization, resume from this list instead of re-auditing from scratch.
- Replace Audio Collection offset pagination with keyset/cursor pagination using a stable `(created_at, id)` ordering so deep playback does not repeatedly skip earlier rows.
- Remove `count: "exact"` from the hot Audio Collection request path, or cache group totals for 10-30 minutes. Preserve the per-group total labels through a cached/estimated count response.
- Add `AbortController` handling so changing collection or question type cancels superseded page requests.
- Add short-lived browser/session caching for already loaded groups so navigating away and back does not immediately repeat the same reads.
- Virtualize the Audio Collection playlist, or retain only a bounded window of rendered rows, so listening through hundreds of items does not leave the entire loaded list in the DOM.
- Consider a shared 5-10 minute server cache for common, non-user-specific question/audio pages. Keep authentication and access checks outside the shared cached data function.
- A later database optimization can add a composite pagination index such as `(is_prediction, created_at desc, id)`, but database schema changes require a separate SQL proposal and explicit user confirmation.
- Realtime chat/notification delivery can replace remaining polling later, but evaluate connection complexity and current low traffic before changing it.
- Current activity heartbeat accounting still caps each write at 120 seconds in both the API and database RPC. A 10-minute heartbeat therefore undercounts continuous activity; changing that cap requires an explicitly approved database/RPC change.

## PTE External Question Updates

- When the user says "更新题目", read `AGENTS.xingji-pte.md` before acting. That shorthand means the recurring Firefly/萤火虫 and Xingji/星记 PTE prediction-question scrape, compare, database update, and OpenAI/R2 audio verification workflow.
- Use the wording "题型", not "提醒", in summaries and admin UI related to this workflow.
- Do not store external-site credentials in code, markdown, JSON, logs, or AGENTS files. Use the documented environment variable names only.

## AI Prompt Management

- Any new runtime AI prompt must be registered in `lib/ai-prompts/defaults.ts` with a stable id, title, category, scope, variables, default content, and `usedBy` file references.
- Runtime AI code should read prompt content through `lib/ai-prompts/server.ts` helpers such as `getAiPromptContent` or `renderAiPrompt`, so `/admin/ai-prompts` database edits can take effect without code changes.
- Keep a safe code default for every prompt. If the Supabase `ai_prompts` table is missing or a row is inactive/empty, AI routes should fall back to the default prompt instead of failing.
- Admin prompt editing belongs in `/admin/ai-prompts`; do not add separate prompt editors to feature pages unless the user explicitly asks.
- Do not add prompt deletion flows by default. Prefer update, restore default, or add a new prompt id.
- Before changing the `ai_prompts` database schema or seeding prompt data remotely, show the SQL and get explicit user confirmation.

## UI And Styling

- Reuse the existing Lofty UI system and design tokens first.
- Prefer existing UI components from `components/ui-v2/`, `components/ui/`, and established local components before creating new UI.
- If a new reusable UI primitive is needed, create it as a component in the UI folder and mention it to the user.
- All new or changed UI must support dark theme.
- All new or changed UI must be mobile first. Start with the mobile layout, then add responsive enhancements with `sm:`, `md:`, `lg:`, and larger breakpoints as needed.
- Use existing CSS variables such as `var(--bg)`, `var(--bg-soft)`, `var(--card)`, `var(--text)`, `var(--text-soft)`, `var(--text-faint)`, `var(--border)`, `var(--primary)`, and shadow/radius tokens.
- Avoid hard-coded light-only classes such as `bg-white`, `text-gray-*`, and `border-gray-*` unless there is a specific reason and dark mode remains correct.
- New app routes or route groups that may suspend, fetch data, or show noticeable navigation delay should include a `loading.tsx` that reuses `components/ui/page-loading.tsx`, which uses `public/lottie/loading.json`.
- AI analysis or AI scoring buttons should show `components/ai/ai-loading-label.tsx` during the active analysis state, reusing `public/lottie/AI.json` for consistent IELTS, PTE, and writing workflows.
- Write `className` values on one line whenever practical.

## Verification

- Run focused verification after changes when practical, such as TypeScript, lint for touched files, or build for config/framework changes.
- If a command fails because of unrelated existing issues, report that clearly and separate it from the current change.
- For frontend UI work, verify the relevant page visually when a dev server/browser is available and the route can be accessed.
- Before starting a dev server for testing, check whether port `3001` already has a listener.
- If port `3001` is already in use, treat that dev server as user-managed. Reuse it for testing and never stop, restart, or replace it after making changes.
- If port `3001` has no listener and testing requires the app, start the project dev server on port `3001`, track the process started by Codex, and stop only that process after testing is complete.
- Never terminate a pre-existing process on port `3001`.

## Communication

- Explain what files changed and why.
- Mention when logic was intentionally left untouched.
- Ask before broad refactors, branch changes, destructive git actions, or changes outside the requested scope.

# 项目全景与 AI 接手指南

本节是 Lofty 项目的中文系统地图。另一个 AI 接手项目时，应先阅读本文件前面的强制规则，再使用本节理解产品、代码和数据边界。本文描述的是当前仓库的总体结构；遇到分支差异时，以当前分支代码为准，不能凭本文猜测。

## 1. 产品定位与用户角色

1. Lofty Education（小马哥教育）是 IELTS、PTE、英语能力训练和课程服务平台。
2. 产品同时包含公开营销网站、登录后学生工作台、题库练习、AI 评分、模考、课程资料、付款和管理员后台。
3. 主要用户角色：
   - `user`：普通学生。
   - 付费学生：数据库角色通常仍是 `user`，AI 权限由产品范围和到期时间决定，不要把付费状态错误地当作 `profiles.role`。
   - `editor`：可访问允许编辑者进入的内容后台。
   - `admin`：管理员，可访问全部管理功能，AI 使用原则上不受普通免费额度限制。
4. `profiles.exam_type` 是学生考试方向的唯一主要来源，值为 `ielts`、`pte` 或旧用户的 `null`。
5. `exam_type = null` 的旧用户可看到 IELTS 和 PTE；IELTS 用户默认只显示 IELTS 相关入口；PTE 用户默认只显示 PTE 相关入口；管理员始终可看到两套题库。
6. 不要再把 `study_plans.exam_type` 作为考试方向的主来源。学习计划中的考试类型修改应更新 `profiles.exam_type`。

## 2. 技术栈与运行方式

1. 框架：Next.js 16 App Router、React 19、TypeScript。
2. 样式：Tailwind CSS 4、项目 CSS 变量、现有 `components/ui/` 与 `components/ui-v2/`。
3. 数据和认证：Supabase Auth、PostgreSQL、RLS、RPC、Server/Client Supabase helpers。
4. AI：OpenAI API；PTE 部分口语发音评估还使用 Azure Speech Pronunciation Assessment。
5. 支付：Stripe Checkout + Webhook，一次性付款，不是订阅。
6. 邮件：Resend，用于付款收据、成绩或业务通知。
7. 文件存储：Cloudflare R2，包括音频、视频、图片、课程资源和用户录音等；本地 `public/` 保存适合随部署发布的静态资源。
8. 其他：Three.js 首页地球场景、Framer Motion、Zoom Meeting SDK、PDF Lib、React PDF、Markdown、Recharts。
9. 包管理器：`pnpm@10.34.4`。
10. 本地开发：`pnpm dev`，默认端口 `3001`，当前脚本使用 webpack。
11. 项目命令必须通过 WSL/Linux 执行；不要在项目说明中给出 PowerShell 命令。

## 3. 分支模型

1. `lofty-v5`：完整产品和数据库优化主线。
2. `lofty-lite`：精简产品分支，但仍包含大量完整题库、AI、付款和后台能力。
3. `main` 可能由用户手动同步到某个分支，不能假设 `main` 永远等于 v5 或 lite。
4. 每天首次编辑前运行 `git branch --show-current` 和 `git status --short --branch`。
5. 用户没有说分支且任务可能同时适用于 v5/lite 时，编辑前必须问清楚。
6. 不得自动切分支、硬重置、强推、清理或回滚用户改动。

## 4. 目录与代码组织

1. `app/(marketing)/`：公开营销页面。
2. `app/(auth)/` 与 `app/auth/`：登录、注册、OAuth callback 和邮件确认。
3. `app/(workspace)/`：登录后学生工作台和练习页面。
4. `app/admin/`：管理员页面。
5. `app/api/`：Next.js 服务端 API，用户浏览器应优先通过这里访问动态数据。
6. `components/`：按功能拆分的可复用前端组件。
7. `lib/`：服务端逻辑、认证、数据加载、题型、计分、AI、Stripe、R2、PDF 和工具函数。
8. `content/`：Markdown、JSON 和可版本控制的静态教学/题库内容。
9. `public/`：图片、字体、Lottie、IELTS/PTE 静态资产、下载文件和纹理。
10. `supabase/migrations/`：已经批准并版本化的数据库变更。
11. `scripts/`：内容提取、导入、音频生成或维护脚本。
12. 大页面不要继续堆业务逻辑；优先拆到领域组件和 `lib` helper。

## 5. 前端视觉与交互规范

1. 所有新界面必须支持 light/dark theme，优先使用项目 CSS tokens，禁止只适配白色背景。
2. 所有新界面必须 mobile first，并检查手机、平板和桌面。
3. 页面应商务、清晰、克制；学习和后台页面强调信息密度与操作效率，不做营销式巨型卡片堆叠。
4. 使用 Lucide 图标和既有图标库，不手画可替代的 SVG。
5. 顶部导航、侧栏、卡片、按钮和表单应复用已有组件。
6. 路由可能等待时使用 `loading.tsx` 或项目的 pending-navigation 组件；点击后立即锁定重复点击并给出明确加载反馈。
7. 返回列表时不得保留旧卡片的“正在加载”状态；pending 状态必须随 pathname/search 变化清除。
8. AI 请求使用统一 AI loading 组件；长任务应显示阶段，而不是无限“分析中”。
9. 输入、下拉、录音、播放器和弹窗都必须实测交互，不能只看 TypeScript 通过。
10. 学习文本中的可点击英语单词应复用字典 overlay 交互；PTE 文本和 IELTS 阅读文章的 hover 风格应统一并适配主题。

## 6. Marketing 公开网站

1. 首页 `/`：`lofty-lite` 桌面版包含 Three.js 地球和轨道小球导航；手机/平板使用更轻量的文字、图标和卡片布局。
2. 首页地球和小球属于高交互视觉功能，改动后必须检查帧率、拖动、碰撞、遮挡、点击和响应式。
3. `/contact`：中英双语品牌与 Neil 老师介绍、微信咨询和预约入口。
4. `/posts`、`/posts/[slug]`：IELTS/PTE 备考文章；支持 IELTS/PTE 分类筛选；“为什么选择小马哥教育”保持置顶。
5. `/courses`：保留课程总入口/待开发内容；`/courses/ielts` 与 `/courses/pte` 分别展示课程产品。
6. IELTS/PTE 课程页包括一对一、3-5 人小班、刷题班；一对一详情尽量复用管理员课程说明内容。
7. `/membership`：AI 时间包和学费展示。当前分支如将学费区域 blur/disabled，则不得擅自重新开放。
8. `/privacy-policy`、`/terms-of-service`、`/refund-policy`：中英双语业务条款，付款页面应能访问。
9. `/demos`：公开演示入口。
10. Marketing 页面不应为了展示内容而直接从浏览器连接 Supabase。

## 7. 登录、注册与验证系统

1. 当前首选登录/注册页面是 `/login-v2` 与 `/sign-up-v2`；旧 `/login`、`/sign-up` 仍可能保留兼容。
2. 支持邮箱密码和 Google OAuth。
3. Google OAuth 从 `/api/auth/google` 发起，经 `/auth/callback` 返回；邮件确认使用 `/auth/confirm`。
4. `NEXT_PUBLIC_SITE_URL`/服务端 origin 必须与生产域名和 Supabase Redirect URLs 一致，避免 OAuth 返回错误域名。
5. 注册时必须选择 IELTS 或 PTE，并写入 `profiles.exam_type`；已有旧用户可为 null。
6. 服务端页面认证统一使用 `getServerUser`、`requireUser`、`requireAdmin` 或 `requireAdminOrEditor`。
7. 权限检查不能只靠隐藏前端按钮；敏感 API 必须在服务端重新验证用户和角色。
8. Supabase service role 只能留在 server-only 文件和服务端执行环境。
9. 登出、session 失效和 401 后，心跳/通知轮询不能无限制造控制台错误。
10. Google OAuth 是已接受的浏览器 Supabase 例外；其余用户数据尽量走 Lofty API。

## 8. 登录后工作台与导航

1. 默认工作台为 `/dashboard-v2`。
2. 学生入口包括：总览、学习计划、IELTS/PTE 题库、课程、作业、词汇、发音、语法、音频收藏、学习视频、模考、AI 使用和设置。
3. 侧栏根据 `profiles.exam_type` 过滤考试相关入口；管理员显示 IELTS 与 PTE 两套入口。
4. 学习计划紧跟总览；成就在设置之前（保留当前已确定顺序，除非用户另行修改）。
5. 顶栏和账户菜单不显示“AI token 0/100”这类无意义技术指标。
6. 账户状态应按实际权限显示普通用户、付费会员或管理员；付费权限应显示对应 IELTS/PTE 到期日。
7. Heartbeat 用于活跃状态而非持续内容查询；通知先查未读摘要，打开后再查列表；成就不做高频轮询。

## 9. 后端 API 总原则

1. 浏览器请求进入 `app/api/**/route.ts`，服务端再通过 Supabase/OpenAI/Azure/R2/Stripe/Resend 访问外部服务。
2. API 必须验证登录、角色、资源归属和参数，不信任客户端传入的 user id、分数、价格或权限。
3. 价格、套餐、AI prompt、正确答案、管理员字段均由服务端决定。
4. API 错误给用户返回可理解的消息；详细错误只写服务端日志，禁止泄露 secret、SQL、完整 webhook payload 或个人信息。
5. 写操作应幂等或可重试；Stripe webhook、AI 生成、音频生成和模考提交尤其如此。
6. 长操作要有超时和可恢复策略；不要无限等待 OpenAI/Azure。
7. 上传前检查 MIME、扩展名、大小和资源归属；下载私有资源通过签名 URL。
8. 所有新 API 都要考虑大陆网络环境，不能要求浏览器直连 Supabase。

## 10. Supabase 客户端与大陆网络约束

1. 服务端普通用户访问：`lib/supabase/server.ts`。
2. 服务端 service-role 访问：`lib/supabase/admin.ts`，仅 server-only。
3. 浏览器客户端：`lib/supabase/client.ts`，只用于明确允许的场景。
4. 中国大陆通常不能稳定直连 Supabase，因此新的数据库、Storage、Realtime 访问必须优先通过 Lofty 服务端 API。
5. 不新增客户端 `.from(...)`、Storage 或 Realtime 查询，除非用户明确批准。
6. 现有浏览器直连是迁移债务，不应作为新功能模板。

## 11. 数据库类别与主要职责

1. `public.profiles`：用户姓名、邮箱、角色、`exam_type` 等身份资料。
2. AI 权限与付款：`ai_user_product_limits`、`ai_access_purchases`、`user_billing_profiles`、`stripe_webhook_events`、`tuition_payments`。
3. AI 使用：使用日志、原子额度 reservation/RPC、按 feature 和产品范围校验。
4. PTE：多个题型 schema/table、question info、attempts、student recordings、答案/样例表。
5. IELTS：speaking/writing attempts、练习提交、静态题库对应的用户答案和记录。
6. 作业：`student_homework_assignments`、通知、写作反馈和发布状态。
7. 模考：`mock_exam.exams`、`exam_sections`、`exam_questions`、`exam_answer_keys`、`attempts`、`attempt_sections`、`attempt_answers`、`attempt_answer_scores`、`attempt_events`。
8. 教室/Zoom：课堂、参会、房间和通知相关表。
9. 内容：文章、课程、AI prompts、必要的管理内容表。
10. 活动与审计：login/device audit、activity heartbeat、通知和管理员查询记录。
11. 实际表结构以 Supabase 和 migration 为准；本文不能代替 schema inspection。

## 12. 数据库变更纪律

1. 托管数据库是非空生产库。
2. 任何表、列、约束、索引、RLS、view、RPC、trigger、bulk update/delete/backfill 先给用户 SQL、影响、风险、验证和回滚方案。
3. 得到明确确认后才执行，并保存 timestamped migration。
4. 执行前跑 `pnpm db:push:dry-run`；不得自动 reset 或 repair。
5. 新查询禁止 `select("*")`，只选择当前 UI 消费字段。
6. 列表使用分页和 summary fields；大文本、JSON、essay、transcript、AI feedback、录音和答案按需加载。
7. 避免 N+1；使用 `in`、join、view、RPC 或一次聚合查询。
8. 索引必须对应真实过滤和排序；不要盲目加索引。
9. 管理后台数据库调试组件只供 admin 使用，未来用户要求关闭时应能快速移除或禁用。

## 13. 静态文件、动态数据与 Source of Truth

1. IELTS 阅读/听力题目和文章优先使用仓库静态文件，不要重新搬到 Supabase。
2. Cambridge 阅读主内容位于 `content/ielts/cambridge/{book}/...`；不要误改旧生成目录或 docs 副本，先追踪当前 loader 实际读取路径。
3. IELTS Task 1 截图位于 `public/ielts/writing/task1/`，索引是 `content/ielts/writing-task1-bank.json`。
4. 教学笔记和全屏知识材料使用 Markdown/静态内容，读取逻辑在 `lib/admin/lesson-content.ts` 等现有 helper。
5. PTE 主题库多数来自 Supabase；少数置顶训练题、未成熟题型和生成 DI 素材使用 `content/pte/`、`content/pte/di-generated/` 或 `public/pte/`。
6. 学生 attempt、答案、分数、录音、反馈、权限、付款、发布状态永远是动态数据，应写数据库或对象存储。
7. 静态题如果需要学生录音/评分，必须有稳定 question id 和兼容 attempt/storage 的映射，不能只在数组中临时编号。
8. R2 object key 和数据库 audio/image URL 必须保持稳定；更新题目时检查关联资源是否缺失。

## 14. IELTS 功能

1. 总入口 `/ielts`，分 Listening、Reading、Speaking、Writing。
2. Reading：Cambridge 7-21 静态文章/题目；页面左右分栏，左侧文章、右侧题目，支持字体大小、加粗、字典、Review 和答题。
3. Listening：主要开放 Cambridge 16-21；题目/选项来自静态数据，音频从已有静态/R2 来源播放。
4. Reading/Listening 输入框必须保持焦点、可输入，并根据答案长度适度自动变宽；不能因父组件重渲染每 0.5 秒丢值。
5. Matching、多选、流程图、下拉和填空必须按题型独立验证，不要用一个全局 renderer 修复某题时破坏其他题。
6. 普通用户可见 Review 题号，但官方答案和答案解析保持管理员权限；更严格时不能把官方答案送到普通用户客户端。
7. Speaking：题目主要来自 Supabase，包含 Part 1/2/3、示范、录音和 AI 评分。
8. Writing：Task 1 bank 为静态截图；Task 2 等题目可来自数据库；学生答案和批改结果保存到 IELTS writing attempts。
9. Admin 作文精批 `/admin/analyze_answer` 是管理员工作流，完整报告可发布给学生，在“我的作业”复用同一展示组件。
10. IELTS AI 与 PTE AI 权限严格分离，IELTS 功能只消耗 IELTS 权限/免费额度。

## 15. PTE 题型与练习系统

1. Speaking：RA、RS、DI、RL、ASQ、RTS、SGD。
2. Writing：SWT、Essay。
3. Reading：FIBR、FIBRW、RO、RMCSA、RMCMA。
4. Listening：SST、WFD、HIW、MCSA、MCMA、FIB_L、SMW、HCS。
5. 每个成熟题型通常包含列表、`[id]` 详情、提交 API、历史/录音或反馈。
6. PTE 列表默认服务端分页，每页 15 条；音频集合页可使用不同分页值。
7. 筛选、搜索、状态和页码写入 URL，刷新/返回后保持状态。
8. 详情页顺序必须来自筛选后的唯一稳定完整顺序；列表每页只是该顺序的切片。
9. 排序至少有稳定第二字段（通常 id）；不得每点上一题/下一题重新全表查询。
10. 只有完整顺序最后一题没有“下一题”；第 15、30 等分页边界必须连续进入下一条。
11. 详情页可通过 `/api/pte/question-order` 等现有机制复用完整顺序，不能重新造第二套排序。
12. 音频题应预取下一题音频；切题时锁定按钮；有多音色时从可用音色中随机，不能固定同一声音。
13. WFD/RS prediction 题需要维护现有多音色规则；新增或更新 prediction 后检查/补生成 R2 音频。
14. RA 静态专项 30 题应固定置于前两页；RS 专项 120 句按当前实现固定在前八页。修改前先读现有 static preset/order 代码。
15. DI 生成题包括代码绘制的线图、柱图、饼图、表格、地图和真实场景图片；精确图表不能交给图像模型随意画数字。
16. 所有录音上传、评分和 attempt 必须验证 question id、用户归属、文件限制和 AI 权限。
17. SWT 缺少题目正文的记录在列表中不显示，但不要未经允许删除数据库数据。

## 16. PTE 评分与 AI 反馈

1. PTE 口语评分不是只看转写文本；可结合 Azure 发音评估和 OpenAI 教学反馈。
2. Azure 429 是上游限流/配额问题，API 应返回可重试提示，不应无说明地 500。
3. RA 评分必须校准，避免 OpenAI 因“可理解”而给出虚高 80+；Content、Fluency、Pronunciation 要有明确扣分锚点和分数上限逻辑。
4. 评分代码、prompt 和后处理三层应共同约束，不只改 prompt 文案。
5. 各题型官方答题时间、文字长度、录音时长和 preparation time 要独立配置，不要用一个全局数字。
6. OpenAI 返回必须做 schema/JSON 校验、超时、空响应和 invalid JSON 处理。
7. 评分失败不得伪造成功分数；保留可重试状态和足够的服务端诊断日志。

## 17. AI Prompt 与额度系统

1. 所有运行时 prompt 注册在 `lib/ai-prompts/defaults.ts`，使用稳定 id、变量、category、scope 和 `usedBy`。
2. 运行时通过 `lib/ai-prompts/server.ts` 获取数据库版本；数据库缺行、停用或异常时回退到代码默认 prompt。
3. 管理员在 `/admin/ai-prompts` 编辑，不在各功能页面复制 prompt 编辑器。
4. IELTS 和 PTE 的 AI 权限以 `product_scope` 分开计时、购买和校验。
5. 普通未付费用户默认每天每个适用规则可使用 3 次；不再设置用户可见的月度上限。
6. 付费用户在对应产品有效期内显示当日已用次数 / `∞`；购买 IELTS 不应解锁 PTE，反之亦然。
7. 管理员原则上无限使用 AI，但付款记录和到期日期仍可保留展示。
8. 每次调用前使用原子 reservation/RPC 校验额度，避免并发绕过限制；失败调用按现有规则释放或记录。
9. UI 不展示 token 技术计数；展示产品、会员状态和明确到期日。
10. 模型名称和成本可能变化；改模型前检查当前 OpenAI 官方文档、响应格式、超时和价格。

## 18. 作业与作文批改

1. 管理员 AI 作文精批入口为 `/admin/analyze_answer`。
2. 旧 `/ielts-writing` 作文批改路径不应重新作为主功能恢复。
3. 报告包含四项 IELTS 写作评分、Overall、题目、审题、逻辑/论据、逐段和逐句反馈。
4. 句子点击后右侧显示该句问题；这套交互是核心行为，样式升级不能破坏。
5. 历史记录支持删除和“发送给学生”。
6. 发布给学生后，在“我的作业”显示与管理员相同的报告组件，避免双份 UI 漂移。
7. 历史列表只加载摘要；点击记录后再加载作文全文和完整 AI feedback。

## 19. 模考系统

1. 总入口 `/mock-test`，根据 `profiles.exam_type` 显示 IELTS 或 PTE，加英语综合能力评估；综合能力评估内部不再重复显示其他模考。
2. IELTS 第一版开放 Cambridge 21 Test 1-4，Listening/Reading 使用与单项练习一致的静态题源和 renderer。
3. IELTS 包含 Listening、Reading、Writing、Speaking；Listening/Reading 可自动评分，Writing 保存答案，Speaking 题来自现有数据库。
4. IELTS 严格机考流程，自动进入下一模块/最终提交；题目级断点；答案每次变化即保存。
5. Listening 播放过程中按现有规则不能退出。
6. PTE 使用现有题库和现有题型评分 API；只允许在听说读写 section 间断点退出，不在单题中任意断点。
7. PTE 提交后提示“成绩将在 24 小时内出现”，不要向学生即时暴露内部评分过程。
8. IELTS/PTE attempt 状态包括 `in_progress`、`submitted`、`scored`、`needs_review`、`abandoned`、`cancelled`。
9. Admin 在 `/admin/mock-tests` 查看原题、学生答案、正确答案、录音、分数、AI 反馈并人工确认。
10. 管理员发布后学生才在报告页看到完整成绩；邮件只发基本成绩和登录查看提示。
11. 报告支持打印/保存 PDF。
12. 普通用户原则上每类模考只有一次机会；内部/管理员学生按既有 unlimited 规则可重复。

## 20. 课程、教学资料与媒体

1. `/my-courses` 显示已开放课程和 TED 视频；视频、封面和字幕可存 R2。
2. `/admin/course-upload` 负责课程资源上传；管理员 presign API 必须鉴权。
3. `/admin/lesson-notes` 先按听说读写分类，再分 IELTS/PTE；“雅思 PTE 知识点”是全屏文字材料，不强制做 slides。
4. Markdown slides 和 article 模式应由服务端读取文件，客户端组件不能导入 `node:fs`。
5. `/pronunciation` 使用 28 个发音音频和 phonemic chart；音标图可全屏 overlay 动画查看。
6. `/vocabulary`、`/grammar`、`/learning-video`、`/audio-collection` 是独立学习工具，修改时保留现有数据源和进度逻辑。
7. `/downloads` 生成 WFD/RS 等 PDF；版式、水印、预测题过滤和 A4 横排规则均属于业务要求，改动后必须渲染检查。

## 21. Stripe 收费系统

1. 所有收费是一次性付款，不自动续费。
2. AI 套餐：30/60/90/180 天，当前代码默认 AUD 19/35/49/89。
3. IELTS AI 和 PTE AI 是两个独立产品范围；购买只延长对应范围到期时间。
4. 连续购买从当前有效期末继续累加；已经过期则从付款成功时间开始。
5. AI 套餐定义在 `lib/billing/ai-access-packages.ts`；改价格时同时检查 Stripe Price env fallback、显示金额和数据库记录。
6. Checkout 位于 `/api/stripe/checkout`；付款方式目前代码明确请求 `card` 和 `alipay`。WeChat 是否出现取决于代码和 Stripe 账户/地区配置，不能仅靠前端图标。
7. 学费套餐通过 `/api/stripe/tuition-checkout`；当前产品包括单次、10 次、20 次等，实际启用状态以 membership UI 为准。
8. 学费区域当前如处于 blur/暂不开放状态，不要因为后端已打通就擅自开放。
9. Webhook `/api/stripe/webhook` 验签后记录 event，并调用幂等 RPC 完成 AI 权限或学费订单。
10. 至少处理 Checkout 完成、异步付款成功、异步付款失败和过期/取消等现有事件分支。
11. Stripe test/live customer id 不能混用；切换 key 时旧 mode customer 应重新创建，而不是继续引用。
12. 付款成功后通过 Resend 发送中英结合 PDF receipt；收据不暴露 payment intent、checkout session、个人管理员姓名或私人 Gmail。
13. Receipt 编号、付款人、商户“小马哥教育 / Lofty Education, Melbourne Australia”、项目、数量和金额必须清晰且中文不乱码。
14. Webhook 是开通权限的唯一可信路径之一；不能根据 success URL 直接授予权限。

## 22. R2、音频和文件资源

1. R2 用于 PTE/IELTS 音频、学生录音、TED 视频/字幕/封面、DI 图片、发音音频和课程资料。
2. 公共教学资源可使用公共 URL；学生私有录音必须通过服务端权限检查和短期签名 URL。
3. WFD/RS 多音色文件需按稳定命名规则生成并写回关联字段；不要只上传文件不更新引用。
4. 音频生成脚本必须可重复执行，跳过已存在的有效音频，并报告缺失、失败和重复。
5. 更新题目 `is_prediction=true` 后检查所需音色是否齐全。
6. 删除用户前先 dry-run 数据库和 R2 object preview，再删除并复查残留。
7. 不在日志、AGENTS 或前端暴露 R2 secret、Supabase key、OpenAI key、Azure key、Stripe secret、Resend key。

## 23. 邮件、通知与课堂

1. Resend 发付款收据、模考成绩通知和必要业务邮件。
2. 邮件失败不应撤销已经成功的付款或评分；记录错误并允许管理员重发。
3. 通知接口默认只轮询 unread summary，用户打开通知面板后再取详细列表。
4. Activity heartbeat 只记录活跃时间，不应携带大数据或触发完整 profile 查询。
5. Zoom classroom 使用服务端创建/签名流程，SDK secret 不进入客户端。
6. 学生只能加入被授权的课堂；管理员可开始、结束和管理课堂通知。

## 24. 管理员后台

1. `/admin` 是管理入口；不要在精简学生前端时删除或改坏管理员功能。
2. 主要模块：dashboard、学生与进度、学习计划、付款详情、AI prompts/usage、作文精批、作业、模考、文章、课程、授课笔记、题库音频、范文、成书和调试工具。
3. 所有 admin 页面和 API 都必须服务端验证 `admin`；内容编辑可按现有规则允许 `editor`。
4. Admin dashboard 应使用聚合 view/RPC，避免逐学生 N+1。
5. 学生详情先展示计数和摘要，再懒加载完整题目、答案、录音、作文和 AI feedback。
6. `/admin/student-payments` 展示 profile、billing profile、AI purchases、tuition 和 webhook 摘要；缺表或无权限时应优雅降级而不是页面 crash。
7. `/admin/db-playground` 和 DB query debug 仅开发/管理员使用，返回结果应脱敏并限制大小。
8. `/admin/book-builder` 可组合 IELTS/PTE 静态内容、授课笔记和用户资料预览 PDF；不要一次把所有大文件送到浏览器。

## 25. 性能与数据库 IO

1. 目标不是单纯减少请求数量，而是减少重复 IO、无用列、大 payload、N+1 和浏览器直连。
2. 列表首屏只加载当前页；PTE 默认 15 条。
3. 大字段 detail-on-demand，并缓存已经打开的 detail。
4. 隐藏 tab 不预加载；打开后再请求。
5. 音频/图片合理预取下一条，但不能一次预取整个题库。
6. Admin dashboard 使用已有 overview RPC/view；PTE 后续目标是“题目当前页 + 用户状态 + question_info”合成一个 RPC。
7. 静态 IELTS 内容直接从部署文件加载，不为相同内容增加数据库 IO。
8. 共享非用户题目数据可短期 server cache；认证、权限和个人数据不能错误共享缓存。
9. 所有成长型表查询必须分页或显式 limit。
10. 优化前记录当前请求、列、过滤、排序和消费者，优化后验证行为完全一致。

## 26. 安全底线

1. Secret key 只放服务端环境变量；Stripe publishable key 可公开，secret/webhook secret 不可公开。
2. 所有管理员、付款、AI 权限、模考发布、文件上传、删除和导出操作必须服务端鉴权。
3. 不相信客户端价格、access days、role、score、correct answer、user id 和 storage key。
4. 防止 open redirect：`next` 只能是本站安全相对路径。
5. 上传限制文件类型、大小、路径和对象名，防止任意文件覆盖。
6. 富文本/Markdown/AI HTML 输出必须按现有安全 renderer 处理，禁止直接注入未清洗 HTML。
7. 用户删除必须包含 auth、profiles、attempts、recordings、payments 关联策略和 R2；付款审计是否保留需用户决定并符合法律/会计要求。
8. 日志不得包含作文全文、录音、OAuth token、支付 secret、完整 webhook payload 或服务密钥。
9. RLS 不能被前端 UI 权限替代；service role 使用范围越小越好。

## 27. 环境变量类别

不得把真实值写进本文。接手 AI 只检查变量是否配置：

1. Site URL 和 public origin。
2. Supabase URL、anon/publishable key、server/service key。
3. OpenAI API key 和项目所需模型配置。
4. Azure Speech key、region 和 endpoint。
5. Cloudflare R2 account、bucket、endpoint、access key、secret 和 public base URL。
6. Stripe secret key、webhook secret，以及可选 Stripe Price ids。
7. Resend API key、from address。
8. Zoom SDK/server credentials。
9. 外部题库抓取凭证只能存在环境变量，规则详见 `AGENTS.xingji-pte.md`。

## 28. 测试与验收清单

1. 改动前确认分支和 dirty tree。
2. 运行相关单元/脚本检查、`pnpm exec tsc --noEmit`、目标文件 lint；配置/框架改动跑完整 `pnpm build`。
3. Build 需要真实必需 env；公开首页不得在缺 Supabase key 的预渲染阶段无保护地创建 client。
4. 前端用桌面、平板、手机检查；重点看 navbar 遮挡、横向溢出、文字换行、卡片高度和弹窗可视区域。
5. 题库逐项检查列表分页、筛选、卡片 loading、返回列表、详情顺序、上一题/下一题和最后一题。
6. IELTS 检查输入、select options、多选、重复渲染、题号、文章段落和 Review。
7. PTE 音频检查播放次数、随机音色、缺失文件、下一题预取、录音上传和评分失败提示。
8. Auth 检查邮箱、Google、callback、生产域名、登录后 profile 和考试方向。
9. Stripe 使用 test mode 验证 card/Alipay、webhook 幂等、权限累加、receipt 和失败/取消；生产实付前核对 live keys/webhook/methods。
10. 数据库改动执行前后都运行只读验证 SQL，记录结果。
11. 如果端口 3001 已被占用，复用用户服务器，不停止、不重启。

## 29. 当前已知技术债与易错点

1. `lofty-v5` 与 `lofty-lite` 会持续分化，不能无脑 merge 或把一个分支的全部 UI 覆盖到另一个。
2. 部分旧页面仍可能浏览器直连 Supabase，应逐步迁移服务端 API，但不能一次性大改。
3. IELTS 静态内容曾存在重复生成目录，改文字前必须确认 loader 的真实源文件。
4. PTE 各题型历史实现不完全一致，列表顺序、分页和 detail navigation 应逐步统一到 shared helpers。
5. 音频题可能出现 DB 有题但 R2 音频或多音色缺失，题库更新后要做完整性审计。
6. OpenAI 长输出可能 empty/invalid JSON/timeout；需 schema 校验、分阶段反馈和降级。
7. Azure 会发生 429；需要区分额度、并发和区域服务错误。
8. Next.js 16 默认 Turbopack 与自定义 webpack 配置可能冲突；当前 dev 显式使用 webpack，build 配置改动必须完整验证。
9. Three.js 新版本有 deprecated Clock/ShadowMap 警告；不影响主要业务但后续应迁移。
10. 管理员数据库 debug 数字可能代表被 instrument 的查询事件，不等于浏览器网络请求数；解释时区分 SQL event、API request 和 UI action。

## 30. 接手 AI 的标准工作顺序

1. 阅读本 `AGENTS.md`；涉及外部 PTE 更新再读 `AGENTS.xingji-pte.md`。
2. 用 WSL 进入 `/home/neodev/lofty`。
3. 确认当前分支、git status 和用户指定分支。
4. 找到 route、page、component、API、lib helper、数据源和数据库对象的完整调用链。
5. 先判断任务是静态内容、前端、服务端、数据库、R2、AI 还是跨系统任务。
6. 对跨系统任务画清楚：用户动作 -> 页面 -> API -> auth -> DB/AI/R2/Stripe -> response -> UI。
7. 数据库远程变更先给 SQL 等待确认；其余明确请求可直接实现。
8. 复用现有组件和 helper，保持行为一致，只修改请求范围。
9. 完成后做针对性测试；长任务分阶段自测并继续，不在中间半成品处停止。
10. 最终向用户报告：改了什么、涉及哪些文件、测试结果、哪些部分因数据库/外部配置未完成。

## 31. 绝对不要做的事

1. 不在错误分支编辑。
2. 不回滚、覆盖或清理用户未提交改动。
3. 不未经确认执行远程 SQL、migration push、批量更新或删除。
4. 不把 service role、Stripe secret、OpenAI/Azure/R2 secret 暴露到客户端。
5. 不让中国大陆用户的新功能依赖浏览器直连 Supabase。
6. 不把 IELTS 静态题库随意改成数据库渲染。
7. 不把 PTE 全表拉到浏览器再分页。
8. 不在列表页加载完整作文、AI JSON、transcript、答案和录音详情。
9. 不只隐藏 UI 而忽略 API 权限和数据泄露。
10. 不在没有视觉/交互验证的情况下宣称前端问题已经修复。
