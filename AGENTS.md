# Lofty Codex Project Rules

This file defines the standing collaboration rules for Codex work in the Lofty project.

## Daily Start

- At the start of the first task each day, confirm the current git branch before making any changes.
- If the current branch is not the expected Lofty working branch, stop and ask before editing files.
- The primary working branch for this project is `lofty-v5` unless the user explicitly says otherwise.
- `lofty-v5` is the active branch for the database optimization phase. Future code changes should be made on `lofty-v5` by default.

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
