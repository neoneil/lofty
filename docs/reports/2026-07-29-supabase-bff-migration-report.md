# Supabase 后端桥接迁移报告

日期：2026-07-29  
分支：lofty-v4

## 目标

大陆地区学生端不再从浏览器直接请求 Supabase 数据库、Supabase Storage 或 Supabase Realtime。浏览器统一请求 Lofty 自己的 Next.js API，由服务端再访问 Supabase。

## 新增统一前端请求入口

- `lib/api/client.ts`
  - `apiGet`
  - `apiPost`
  - `apiPut`
  - `apiPatch`
  - `apiDelete`

前端组件统一用这些 helper 请求本站 API，错误信息统一从后端 JSON 返回。

## Auth 链路

- 注册：前端 -> `POST /api/auth/signup` -> Supabase Auth
- 登录：前端 -> `POST /api/auth/login` -> Supabase Auth
- 邮箱确认：邮件链接 -> `GET /auth/confirm` -> 服务端 `verifyOtp` -> 跳转站内页面
- 登出：前端 -> `POST /api/auth/logout` -> Supabase Auth signOut

保留项：

- Google OAuth 仍然保留前端 Supabase OAuth 调用，因为大陆地区本身无法稳定使用 Google，当前按需求没有改。

## Profile / 头像 / 学习计划摘要

- 用户资料读取：`GET /api/profile/me`
- 用户资料更新：`PATCH /api/profile/me`
- 头像列表读取：`GET /api/profile/me?includeAvatars=1`

已迁移前端：

- `components/profile/profile-menu.tsx`
- `components/debug/auth-debug.tsx`
- `app/(workspace)/classroom/page.tsx`

## Study Plan 链路

- 读取学习计划：`GET /api/study-plan`
- 创建或更新学习计划：`PUT /api/study-plan`

已迁移前端：

- `app/(workspace)/study-plan/page.tsx`

## Selective 链路

- 当前 Selective 用户信息：`GET /api/selective/me`
- 数学题提交：`POST /api/selective/math-attempts`
- 学生历史记录：`GET /api/selective/history`
- Admin 全部历史记录：`GET /api/admin/selective/history`

已迁移前端：

- `app/selective/mathAndQuan/page.tsx`
- `app/selective/writing/page.tsx`
- `app/selective/history/page.tsx`
- `app/admin/selective/history/page.tsx`

## Admin 文章管理链路

- 创建文章：`POST /api/admin/posts`
- 更新文章：`PATCH /api/admin/posts/:id`
- 删除文章：`DELETE /api/admin/posts/:id`
- 封面上传：继续使用现有 `POST /api/admin/storage/public-upload`

已迁移前端：

- `components/admin/create-post-form.tsx`
- `components/admin/edit-post-form.tsx`
- `components/admin/delete-post-button.tsx`

## Chat 链路

学生聊天：

- 会话：`POST /api/chat/session`
- 消息读取/发送：`GET/POST /api/chat/message`
- AI 回复：`POST /api/chat/ai`

Admin 聊天：

- 会话列表：`GET /api/admin/chat/sessions`
- 消息列表：`GET /api/admin/chat/messages`
- 老师回复：`POST /api/admin/chat/reply`

变更：

- 移除了浏览器端 Supabase Realtime channel。
- 改为通过本站 API 每 5 秒轮询一次消息。

## R2 链路

R2 不是 Supabase，当前主要有两种模式：

- 后端代传：`POST /api/admin/storage/public-upload`
  - 浏览器上传到本站 API。
  - 服务端再上传 Cloudflare R2。
- 预签名直传：`POST /api/admin/courses/r2-presign` 后，浏览器 `PUT` 到 R2 预签名 URL。
  - 当前仅用于 admin course upload。
  - 这是 Cloudflare R2 直传，不是 Supabase 直连。

公共资源 URL 仍然通过 Cloudflare R2 public URL 展示。

## 剩余例外

- `components/auth/auth-v2-form.tsx`
- `components/auth/login-form.tsx`
- `components/auth/signup-form.tsx`

以上三个文件只为 Google OAuth 保留 Supabase browser client。邮箱密码注册/登录已经全部迁到后端 API。

- `components/classroom/zoom-meeting.tsx` 的 `ZoomMtgEmbedded.createClient()` 是 Zoom SDK，不是 Supabase。
- `app/admin/course-upload/course-upload-client.tsx` 仍然会使用 R2 预签名 URL 直传 Cloudflare R2。

## 验证结果

本地 `localhost:3001`：

- `POST /api/auth/signup` 空请求返回 `400 {"ok":false,"message":"请输入邮箱。"}`
- `GET /api/profile/me` 未登录返回 `401 {"ok":false,"message":"请先登录。"}`
- `GET /api/study-plan` 未登录返回 `401 {"ok":false,"message":"请先登录。"}`

静态验证：

- `npx tsc --noEmit` 通过
- 关键变更文件 `npx eslint ...` 通过，无 error
- `git diff --check` 通过

线上 `https://www.loftypte.com.au`：

- 当前新 API 返回 404，原因是这批代码还没有部署到线上。
- 部署后应重新测试同样三条 smoke test，并继续用真实账号测试注册、登录、学习计划、profile menu、Selective、chat、admin posts。
