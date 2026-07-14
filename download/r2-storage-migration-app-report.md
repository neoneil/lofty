# Lofty v3 R2 Storage App Migration Report

Generated: 2026-07-15

## Scope

- Branch: `lofty-v3`
- Supabase database: not modified
- Supabase Storage: not deleted and not modified by app migration code
- Public R2 bucket: used for migrated public assets
- Private R2 bucket: `loftypte`, used for student recordings

## Storage Policy

### Public R2

The app now resolves public migrated assets to R2 public URLs for:

- `avatars`
- `images`
- `ielts`
- `pte-audio` public question assets

Public URL shape:

```text
https://pub-b96989cc617f460facb9c254b7d2c5db.r2.dev/<supabase-bucket>/<object-path>
```

### Private R2

Student recordings use the private R2 bucket:

```text
loftypte
```

Private key shape:

```text
pte-audio/students-audio/<question-type>/<user-id>/<file>
```

Student recordings are no longer exposed as public URLs by new upload code.

## Access Control

Private recording playback is handled by:

```text
GET /api/storage/private-url?key=...
```

Rules:

- Logged-in student can access only their own recording key.
- Admin/editor can access all student recording keys.
- Invalid or non-student-recording keys return an error.
- Response returns a short-lived signed R2 URL.

## Upload Logic

New student recordings now upload directly to private R2 and store the private key in existing database fields.

Covered APIs:

- `app/api/pte/ra/upload/route.ts`
- `app/api/pte/rs/upload/route.ts`
- `app/api/pte/asq/upload/route.ts`
- `app/api/pte/di/upload/route.ts`
- `app/api/pte/rl/upload/route.ts`
- `app/api/pte/rts/upload/route.ts`
- `app/api/pte/sgd/upload/route.ts`
- `app/api/pte/ra/submit/route.ts`
- `app/api/pte/rs/submit/route.ts`
- `lib/pte-speaking/submit-keyword-speaking.ts`

New article cover uploads go to public R2 through an admin-only upload API:

```text
POST /api/admin/storage/public-upload
```

## Playback Logic

`components/site/AudioPlayer.tsx` now detects student recording keys or legacy Supabase student recording URLs. It requests a signed URL before playback.

This supports:

- New private R2 keys
- Existing Supabase public student recording URLs in the database

## Public URL Resolver

Added shared resolver:

```text
lib/storage/public-url.ts
```

It converts migrated Supabase public URLs and plain storage paths into R2 public URLs without changing the database.

## New Helpers

- `lib/storage/public-url.ts`
- `lib/storage/r2-private.ts`
- `lib/storage/student-recordings.ts`

## Verification

Commands run:

```bash
corepack pnpm exec tsc --noEmit
corepack pnpm exec eslint components/site/AudioPlayer.tsx lib/storage/public-url.ts lib/storage/r2-private.ts lib/storage/student-recordings.ts app/api/storage/private-url/route.ts app/api/admin/storage/public-upload/route.ts app/api/pte/ra/submit/route.ts app/api/pte/rs/submit/route.ts lib/pte-speaking/submit-keyword-speaking.ts components/admin/create-post-form.tsx
```

Result:

- TypeScript: passed
- ESLint targeted check: passed

## Remaining Notes

- Supabase database still contains old URLs for some historical rows.
- The app can handle those old student recording URLs by converting them to private R2 keys before signing.
- Supabase Storage still contains original files and should not be deleted until v3 is tested in browser and production-like routes.
- `quote-images` was not migrated to public R2 and should remain private unless a separate signed access flow is built.
