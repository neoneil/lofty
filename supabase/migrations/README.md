# Lofty Database Migrations

This directory is the source of truth for approved Supabase schema changes.

## Safety Rule

The hosted Supabase project is an established, non-empty database. Never run a remote mutation without first showing the user the proposed SQL, affected objects, risk, verification steps, and rollback plan, then receiving explicit approval.

## Initial Baseline

Do not create a blank initial migration and do not push the existing schema dump as a new migration. Once `SUPABASE_ACCESS_TOKEN` and `SUPABASE_DB_PASSWORD` are configured, link the project and pull the current remote schema into a reviewed baseline migration before adding new changes.

## Workflow

1. Create a migration:

   `corepack pnpm@10 db:migration:new <change_name>`

2. Edit the generated `supabase/migrations/<timestamp>_<change_name>.sql` file.

3. Review the SQL and document its impact and rollback plan.

4. After the project is linked, preview pending migrations:

   `corepack pnpm@10 db:push:dry-run`

5. Show the SQL and dry-run result to the user and request explicit approval.

6. Only after approval, push with a one-command approval flag:

   `SUPABASE_DB_PUSH_APPROVED=YES corepack pnpm@10 db:push`

## Required Environment

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_DB_PASSWORD`
- Project reference passed to `supabase link --project-ref <project-ref>`

Keep credentials in `.env.local` or the local credential store. Never commit them.
