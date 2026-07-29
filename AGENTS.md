# Lofty Codex Project Rules

This file defines the standing collaboration rules for Codex work in the Lofty project.

## Daily Start

- At the start of the first task each day, confirm the current git branch before making any changes.
- If the current branch is not the expected Lofty working branch, stop and ask before editing files.
- The primary working branch for this project is `lofty-v4` unless the user explicitly says otherwise.

## Change Scope

- Only modify code, styles, files, or logic that the user explicitly asks to change.
- Do not change unrelated business logic, data queries, routing, auth, storage, or API behavior unless the user clearly requests it.
- When the task is style-only, keep it style-only.
- When the task is analysis-only, do not edit files.
- Preserve user changes and existing dirty work. Never revert unrelated files.

## Tooling

- Prefer WSL commands for this project whenever possible.
- If a task can be done through WSL, use WSL instead of PowerShell.
- Avoid using PowerShell for project commands when the same work can be done directly through WSL, especially for shell pipes, quoting, globbing, and path-sensitive operations.

## Architecture

- New functionality must be modular and reusable.
- Prefer creating a focused component, helper, or module instead of mixing new behavior directly into large pages.
- If a feature is likely to be reused, place it in an appropriate shared location such as `components/`, `components/site/`, `components/layout-v2/`, or another existing project pattern.
- Keep changes small and aligned with the current codebase structure.

## Backend Auth And Supabase

- All backend authentication and authorization must use the existing project helpers.
- Protected user-facing server pages should use `lib/auth/require-user.ts`.
- Admin-only server pages and admin-only backend work should use `lib/auth/require-admin.ts` or follow its role-checking pattern.
- Server-side Supabase access should use `lib/supabase/server.ts`.
- Service-role/admin Supabase access must use `lib/supabase/admin.ts` and stay server-only.
- Browser/client components should use `lib/supabase/client.ts` only.
- Do not create new Supabase clients, auth checks, admin role checks, cookie handling, or service-key logic inline unless the user explicitly asks for a new shared helper.
- Never expose `SUPABASE_SECRET_KEY` or service-role behavior to client components.
- Treat the hosted Supabase project as a mature, non-empty production database.
- Before any remote database structure or data change, show the proposed SQL, affected objects, risk, and verification or rollback plan to the user and receive explicit confirmation.
- This confirmation requirement includes `supabase db push`, table or column changes, indexes, RLS policies, functions, triggers, views, bulk updates, deletes, backfills, and migration repairs.
- Store every approved schema change as a timestamped SQL file in `supabase/migrations/`. Run `db:push:dry-run` before any approved `db:push`.
- Never run `supabase db push`, migration repair, reset, destructive SQL, or bulk data mutation merely because migration tooling is configured.
- PTE feature work must not use Supabase `select("*")`; select only the fields the page, component, or API actually needs. Before changing an existing PTE query, read the consuming code and keep required fields explicit.

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
