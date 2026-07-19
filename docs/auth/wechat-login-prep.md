# WeChat Login Prep For Lofty

This note records the planned WeChat Open Platform login approach for Lofty.

## Official References

- WeChat Open Platform intro: https://developers.weixin.qq.com/doc/oplatform/open/intro.html
- Website app PC WeChat capabilities: https://developers.weixin.qq.com/doc/oplatform/Website_App/WeChat_PC_APIs/guideline.html
- Website app business domain configuration: https://developers.weixin.qq.com/doc/oplatform/Website_App/WeChat_PC_APIs/domain.html
- Website app WeChat login: https://developers.weixin.qq.com/doc/oplatform/Website_App/WeChat_Login/Wechat_Login.html

## Key Facts

- Website app WeChat login uses OAuth2 authorization code flow.
- Website login scope is `snsapi_login`.
- The login request redirects users through `https://open.weixin.qq.com/connect/qrconnect`.
- WeChat redirects back to `redirect_uri` with `code` and `state`.
- The server exchanges `code` for `access_token` through `https://api.weixin.qq.com/sns/oauth2/access_token`.
- The response includes `openid`; `unionid` may also be returned when the app is under the same WeChat Open Platform account.
- `openid` identifies a user under one AppID.
- `unionid` identifies a user across apps under the same WeChat Open Platform account.
- Prefer `unionid` for long-term identity linking when available.

## WeChat Platform Requirements

- Register and verify a WeChat Open Platform developer account.
- Create and pass review for a website app.
- Apply for WeChat login and pass review.
- Obtain `AppID` and `AppSecret`.
- Configure business domain in WeChat Open Platform.
- Business domain must use HTTPS and must not include a trailing path.
- Example domain value: `https://www.loftypte.com.au`.
- Place the WeChat verification file in the site root when WeChat requires it.

## Environment Variables

Use server-only environment variables for secrets.

```env
WECHAT_OPEN_APP_ID=
WECHAT_OPEN_APP_SECRET=
WECHAT_LOGIN_REDIRECT_URI=https://www.loftypte.com.au/api/auth/wechat/callback
WECHAT_LOGIN_STATE_SECRET=
```

Never expose `WECHAT_OPEN_APP_SECRET` to client components.

## Recommended Lofty Implementation Plan

Phase 1: WeChat account binding.

- Require the user to already be logged in with the current Lofty/Supabase auth flow.
- Add a "Bind WeChat" action in profile/settings.
- Start WeChat OAuth, verify callback `state`, exchange `code`, then store the user's `openid` and `unionid`.
- This is the safest first step because it does not replace the current auth system.

Phase 2: WeChat login for returning bound users.

- Add a WeChat login button to the existing login page.
- After callback, find the mapped Lofty user by `provider + openid` or `unionid`.
- Establish the normal Lofty authenticated session.

Phase 3: WeChat registration for new users.

- If no mapping exists, ask the user to add email or phone before creating/linking a Lofty account.
- Do not assume WeChat will return an email address.

## Suggested Routes

```text
GET /api/auth/wechat/start
GET /api/auth/wechat/callback
```

`start` should:

- Generate a CSRF-safe `state`.
- Store state in a secure HTTP-only cookie or server-side session.
- Redirect to WeChat OAuth.

`callback` should:

- Validate `state`.
- Exchange `code` for `access_token`.
- Read `openid` and `unionid`.
- Bind or locate the corresponding Lofty user.
- Redirect to the intended original page.

## Suggested Database Shape

Prefer a reusable provider account table instead of adding WeChat-only fields directly to `profiles`.

```sql
create table public.oauth_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  provider_user_id text not null,
  unionid text,
  nickname text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_user_id),
  unique (provider, unionid)
);
```

Only add this table after explicit user confirmation because it changes the mature Supabase database.

If Lofty only needs login, avoid storing WeChat `access_token` and `refresh_token` long-term. Use the token to fetch basic user info, then discard it.

## Security Requirements

- Keep all WeChat token exchange logic server-side.
- Validate `state` to prevent CSRF.
- Allowlist return paths to avoid open redirects.
- Do not trust nickname or avatar as identity.
- Do not expose AppSecret in browser code.
- Use existing Lofty auth helpers and Supabase helpers:
  - `lib/auth/require-user.ts`
  - `lib/auth/require-admin.ts`
  - `lib/supabase/server.ts`
  - `lib/supabase/admin.ts`
- Do not create inline Supabase clients or inline auth logic.

## Open Decisions Before Implementation

- Confirm canonical production domain: `www.loftypte.com.au` or apex domain.
- Decide whether mobile browser support is required in the first version.
- Decide whether first release should be binding-only or full login.
- Decide whether new WeChat users must provide email before account creation.
