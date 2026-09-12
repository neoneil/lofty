# Xingji PTE Static Scraping Notes

This file records the September 10, 2026 work notes for scraping Xingji Education / Xingji PTE into Lofty. Continue from here tonight.

## Scope

- Work on branch lofty-lite for this task.
- The user wants static content only, not database-backed content.
- Scrape only Reading and Listening question types that Lofty currently handles as static/missing-style pages.
- For Listening, do not download or store Xingji audio. Store text question content and answers only.
- Target app data file should be data/pte/static-question-banks.json once implementation resumes.
- Target loader is lib/pte/static-sample-questions.ts; current static pages already call getPteStaticQuestionBank(...) for these banks.

## Target Types

Map Xingji models to Lofty static banks:

- Reading Multiple Choice Single: Xingji r_mcs -> Lofty rmcsa, route /pte/reading/rmcsa.
- Reading Multiple Choice Multiple: Xingji r_mcm -> Lofty rmcma, route /pte/reading/rmcma.
- Listening Multiple Choice Single: Xingji l_mcs -> Lofty mcsa, route /pte/listening/mcsa.
- Listening Multiple Choice Multiple: Xingji l_mcm -> Lofty mcma, route /pte/listening/mcma.
- Listening Fill in the Blanks: Xingji l_fib -> Lofty fib_l, route /pte/listening/fib_l.
- Listening Select Missing Word: Xingji l_smw -> Lofty smw, route /pte/listening/smw.
- Listening Highlight Correct Summary: Xingji l_hcs -> Lofty hcs, route /pte/listening/hcs.

Do not scrape Writing, Speaking, Reading RO/FIB/FIBRW, Listening SST/HIW/WFD for this static task unless the user changes scope.

## Browser Tool Issues Observed

- The in-app browser ambient state and browser tool handles can diverge.
- agent.browsers.getDefault() sometimes returned a stale about:blank tab while the visible browser was still on Xingji.
- agent.browsers.getForUrl('https://www.ptexj.com') sometimes found the correct browser instance and tab.
- One confirmed logged-in tab was id 6, URL https://www.ptexj.com/practice/l_mcm/115, title PTE考试练习-PTE猩际.
- Logged-in page text included account display adelai / Neo (PTE & IELTS & IT) and 退出登录.
- The Playwright evaluate context exposed no fetch and no XMLHttpRequest. Page-context API calls failed with TypeError: fetch is not a function and TypeError: XMLHttpRequest is not a constructor.
- Calling tab.goto(...) through the browser bridge sometimes turned the tool-visible tab into about:blank. Avoid relying on direct goto if the bridge is unstable; prefer reading the current visible page or use HTTP/API locally.

## Confirmed Page States

- User navigated to https://www.ptexj.com/practice/r_mcs/218.
- Page type confirmed as Reading Multiple Choice (Single).
- Question confirmed: #218 Teenage Daughter.
- Label showed 预测机经题中等.
- The page displayed the standard sidebar with PTE practice sections and the Reading/Listening target links.

## Public API Findings

- Main frontend bundle inspected from CloudFront: main-e1bd6c38-0.236.5.js.
- Public detail endpoint works without login: GET https://www.ptexj.com/api/v1/questions/q_full_text?model=<model>&num=<num>.
- Example: model=l_mcm&num=115 returns HTTP 200, code 0, message success, type e1.
- Missing/nonexistent question numbers return HTTP 400.
- Public q_full_text returns encrypted data with only full_text after decoding.
- Public q_full_text contains source text, Chinese translation, question, and options. It generally does not include answers for Reading MC / Listening MC / HCS; some types such as l_fib and l_smw may include answer text in full_text.
- Attempts such as answer=true, show_answer=true, with_answer=true, include_answer=true, and full=true did not add answers to public q_full_text.

## E1 Decode Details

- Xingji response type e1 is not AES. It is a Base64 string with a fixed character substitution map.
- Frontend key found in module 25 / module 34: ts3RqNgVd0cAMKUlSQOzh7oyZvPB96EXGbCLiwFWDm48ku2jefJT5YanIH1rpx.
- Decode method: split key into first 31 characters and last 31 characters; build a bidirectional substitution map; swap encrypted characters through that map; Base64-decode; JSON.parse when expecting JSON.
- q_full_text decoded example for l_mcm #115 produced full_text containing 原文, 问题, 选项 for Cashless Experiment.

## Private/Login API Findings

- List endpoint requires login: GET /api/v1/questions/list_v2?model=<model>&page=1&per_page=20.
- Without login it returned code 13007, 登录信息不全，请联系客服小猩.
- single_num_v2 requires login and num: GET /api/v1/questions/single_num_v2?model=<model>&num=<num>.
- Login endpoint: POST /api/v1/users/registration/sign_in.
- Required fields include user_detail and password.
- Login succeeded once with the user's email and the password variant without a trailing space.
- Do not store the user's password in any repo file or script. Use env vars for future scripts.
- Login response is plain JSON data with keys: client, token, expiry, acc_type, user_detail, uuid.
- Authenticated API requests need these auth params plus common frontend params.
- Confirmed common params: api_type=e1, locale=zh-CN, s=wx for ptexj domain, device_type=web-1.0.0-web-0.236.5, cv=2.
- logged_in must be the string "true" for authenticated GET requests. Boolean true failed validation.
- If s is missing or wrong, API returns validation error: s does not have a valid value.
- With s=wx and logged_in="true", single_num_v2 returned success and data keys: partial_e, item, item_addition, model, ai_score_coupons, selection_answer_tags, answer_sort_tags, count, current_count, prev_num, next_num.
- With the same auth, list_v2 returned success and data keys: partial_e, questions, page_info. Example l_mcm page_info.total_count was 70.

## Login Risk / Current Blocker

- Xingji enforces login limits and/or single-device/session checks.
- After several login attempts, API returned code 13024, message: 超过登录次数限制，请不要与他人共享账号，请 2 小时后再重试.
- Stop all login attempts until the limit clears. Resume tonight or after the 2-hour lockout.
- Earlier private requests also returned 账号在其他设备登录，当前登录失效 when auth/device fields were incomplete or mismatched.
- Future scraper should login only once per run and reuse that token for all requests.

## Device-Scoped Item Decode Finding

- Private list and single-question item values are not plain e1. They are e1 plus a device-scoped perturbation.
- Frontend module 25 decode function shows: decode device_id using e1 with parseJson=false and deviceScoped=false; extract digit positions with regex /\d+/g and sort them; remove positions.length leading characters from item; for each extracted position, if the character at that position has a substitution-map entry, swap that character before normal e1 decode.
- Attempted custom device_id values such as e1-encoded [] were rejected by login validation, so use a frontend-compatible device_id next time or recover the positions for the generated device id.
- A regular generated device_id such as web-<timestamp> logged in, but its item decode still needs the exact frontend-compatible position handling verified.

## September 12, 2026 Resume Notes

- The user added PTEXJ_EMAIL and PTEXJ_PASSWORD to .env.local. Do not print their values.
- Login works again; code 13024 rate limiting had cleared.
- Use scripts/scrape-ptexj-static-pte.mjs for this static Xingji task.
- The script stores reusable non-source session state in tmp/ptexj/session-state.json.
- Frontend module 106 generates a device id like 3-<uuid> and a first_visit_time timestamp.
- For single_num_v2 detail responses in the current web build, data.item decodes by removing 5 leading characters, swapping encoded positions [2, 7, 13, 19, 22] through the E1 substitution map, then running normal E1 decode and JSON.parse.
- The detail decoder was verified on r_mcs, r_mcm, l_mcs, l_mcm, l_fib, l_smw, and l_hcs.
- list_v2 gives accurate page_info totals but its question summary item strings have a different perturbation. For the current scraper, do not rely on decoding list_v2 summaries; traverse single_num_v2 with prev_num/next_num instead.
- Confirmed available Xingji totals from list_v2 on September 12, 2026: r_mcs 115, r_mcm 67, l_mcs 87, l_mcm 70, l_fib 289, l_smw 89, l_hcs 60.
- Current static task scope is all questions in the missing/static Reading and Listening types, not prediction-only filtering.

## Static App Integration Plan

When resuming implementation:

- data/pte/static-question-banks.json has keys rmcsa, rmcma, mcsa, mcma, fib_l, smw, hcs.
- lib/pte/static-sample-questions.ts imports that JSON and prefers scraped data when a bank array is non-empty; generated placeholders remain as fallback.
- scripts/scrape-ptexj-static-pte.mjs uses env vars PTEXJ_EMAIL and PTEXJ_PASSWORD.
- Script should never print token/password.
- Script should write static JSON only; no DB writes.
- For each target bank, traverse single_num_v2 from the first item to next_num until null.
- Listening banks should store listeningText/question/options/answer text only, never remote audio URLs.

## Verification To Run After Implementation

- cd /home/neodev/lofty.
- Run focused TypeScript checks if available.
- Open or curl these routes after data is written: /pte/reading/rmcsa, /pte/reading/rmcma, /pte/listening/mcsa, /pte/listening/mcma, /pte/listening/fib_l, /pte/listening/smw, /pte/listening/hcs.

## Do Not Forget

- User corrected wording previously: use 题型, not 提醒.
- Do not scrape or save Xingji audio.
- Do not store credentials in code, markdown, JSON, logs, or AGENTS files.
- Stop immediately if Xingji rate-limits login again; do not keep retrying.
