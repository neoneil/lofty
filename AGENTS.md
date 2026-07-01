# Lofty Codex Project Rules

This file defines the standing collaboration rules for Codex work in the Lofty project.

## Daily Start

- At the start of the first task each day, confirm the current git branch before making any changes.
- If the current branch is not the expected Lofty working branch, stop and ask before editing files.
- The primary working branch for this project is `lofty-v2` unless the user explicitly says otherwise.

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

## UI And Styling

- Reuse the existing Lofty UI system and design tokens first.
- Prefer existing UI components from `components/ui-v2/`, `components/ui/`, and established local components before creating new UI.
- If a new reusable UI primitive is needed, create it as a component in the UI folder and mention it to the user.
- All new or changed UI must support dark theme.
- All new or changed UI must be mobile first. Start with the mobile layout, then add responsive enhancements with `sm:`, `md:`, `lg:`, and larger breakpoints as needed.
- Use existing CSS variables such as `var(--bg)`, `var(--bg-soft)`, `var(--card)`, `var(--text)`, `var(--text-soft)`, `var(--text-faint)`, `var(--border)`, `var(--primary)`, and shadow/radius tokens.
- Avoid hard-coded light-only classes such as `bg-white`, `text-gray-*`, and `border-gray-*` unless there is a specific reason and dark mode remains correct.
- Write `className` values on one line whenever practical.

## Verification

- Run focused verification after changes when practical, such as TypeScript, lint for touched files, or build for config/framework changes.
- If a command fails because of unrelated existing issues, report that clearly and separate it from the current change.
- For frontend UI work, verify the relevant page visually when a dev server/browser is available and the route can be accessed.

## Communication

- Explain what files changed and why.
- Mention when logic was intentionally left untouched.
- Ask before broad refactors, branch changes, destructive git actions, or changes outside the requested scope.
