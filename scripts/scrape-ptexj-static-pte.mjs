import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import dotenv from "dotenv";

dotenv.config({ path: ".env.local", quiet: true });

const API_BASE = "https://www.ptexj.com/api";
const SESSION_PATH = path.join("tmp", "ptexj", "session-state.json");
const OUTPUT_PATH = path.join("data", "pte", "static-question-banks.json");
const E1_KEY = "ts3RqNgVd0cAMKUlSQOzh7oyZvPB96EXGbCLiwFWDm48ku2jefJT5YanIH1rpx";
const DEVICE_ITEM_POSITIONS = [2, 7, 13, 19, 22];

const TARGETS = [
  {
    model: "r_mcs",
    bankKey: "rmcsa",
    category: "reading",
    type: "reading-single",
    code: "RMCSA",
    route: "/pte/reading/rmcsa",
    instruction:
      "Read the text and answer the multiple-choice question by selecting the correct response. Only one response is correct.",
  },
  {
    model: "r_mcm",
    bankKey: "rmcma",
    category: "reading",
    type: "reading-multiple",
    code: "RMCMA",
    route: "/pte/reading/rmcma",
    instruction:
      "Read the text and answer the question by selecting all the correct responses. More than one response is correct.",
  },
  {
    model: "l_mcs",
    bankKey: "mcsa",
    category: "listening",
    type: "listening-single",
    code: "MCSA",
    route: "/pte/listening/mcsa",
    instruction: "Listen to the recording and answer the multiple-choice question. Only one response is correct.",
  },
  {
    model: "l_mcm",
    bankKey: "mcma",
    category: "listening",
    type: "listening-multiple",
    code: "MCMA",
    route: "/pte/listening/mcma",
    instruction:
      "Listen to the recording and answer the question by selecting all the correct responses. More than one response is correct.",
  },
  {
    model: "l_fib",
    bankKey: "fib_l",
    category: "listening",
    type: "listening-fill-blank",
    code: "FIB-L",
    route: "/pte/listening/fib_l",
    instruction: "Listen to the recording and type the missing words in each blank.",
  },
  {
    model: "l_smw",
    bankKey: "smw",
    category: "listening",
    type: "listening-missing-word",
    code: "SMW",
    route: "/pte/listening/smw",
    instruction:
      "Listen to the recording and select the missing word or phrase that completes the recording.",
  },
  {
    model: "l_hcs",
    bankKey: "hcs",
    category: "listening",
    type: "listening-summary",
    code: "HCS",
    route: "/pte/listening/hcs",
    instruction: "Listen to the recording and select the summary that best matches it.",
  },
];

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function buildSubstitutionMap(key = E1_KEY) {
  const left = key.slice(0, 31).split("");
  const right = key.slice(31, 62).split("");
  const map = {};

  for (let index = 0; index < 31; index += 1) {
    map[left[index]] = right[index];
    map[right[index]] = left[index];
  }

  return map;
}

const substitutionMap = buildSubstitutionMap();

function e1DecodeText(value) {
  let base64 = "";
  for (const char of String(value ?? "")) {
    base64 += substitutionMap[char] ?? char;
  }
  return Buffer.from(base64, "base64").toString("utf8");
}

function decodeApiData(body) {
  if (body?.type === "e1" && typeof body.data === "string") {
    return JSON.parse(e1DecodeText(body.data));
  }

  return body?.data ?? body;
}

function decodeDeviceItem(value) {
  let encoded = String(value ?? "").slice(DEVICE_ITEM_POSITIONS.length);

  for (const position of DEVICE_ITEM_POSITIONS) {
    if (encoded[position] && substitutionMap[encoded[position]]) {
      encoded = `${encoded.slice(0, position)}${substitutionMap[encoded[position]]}${encoded.slice(position + 1)}`;
    }
  }

  return JSON.parse(e1DecodeText(encoded));
}

function loadSession() {
  const session = readJson(SESSION_PATH, {});
  return {
    deviceId: session.deviceId ?? `3-${crypto.randomUUID()}`,
    firstVisitTime: session.firstVisitTime ?? String(Date.now()),
    auth: session.auth ?? null,
  };
}

function saveSession(session) {
  writeJson(SESSION_PATH, session);
}

function hasUsableAuth(auth) {
  if (!auth?.user_detail || !auth?.token || !auth?.client || !auth?.acc_type) return false;
  if (!auth.expiry) return true;
  return Number(auth.expiry) - 60 > Math.floor(Date.now() / 1000);
}

function commonParams(session, loggedIn = false) {
  return {
    api_type: "e1",
    locale: "zh-CN",
    s: "wx",
    device_type: "web-1.0.0-web-0.236.5",
    device_id: session.deviceId,
    first_visit_time: session.firstVisitTime,
    logged_in: loggedIn ? "true" : "false",
    cv: "2",
  };
}

function authParams(session) {
  return {
    ...commonParams(session, true),
    user_detail: session.auth.user_detail,
    token: session.auth.token,
    acc_type: String(session.auth.acc_type),
    client: session.auth.client,
  };
}

async function requestJson(pathname, init) {
  const response = await fetch(`${API_BASE}${pathname}`, init);
  const text = await response.text();
  let body;

  try {
    body = JSON.parse(text);
  } catch {
    throw new Error(`Xingji returned non-JSON response: HTTP ${response.status}`);
  }

  if (!response.ok || body.code !== 0) {
    const message = body.msg || body.message || `HTTP ${response.status}`;
    const error = new Error(`Xingji API error ${body.code ?? response.status}: ${message}`);
    error.status = response.status;
    error.code = body.code;
    throw error;
  }

  return body;
}

async function login(session) {
  const email = process.env.PTEXJ_EMAIL;
  const password = process.env.PTEXJ_PASSWORD;

  if (!email || !password) {
    throw new Error("Missing PTEXJ_EMAIL or PTEXJ_PASSWORD in .env.local");
  }

  const body = await requestJson("/v1/users/registration/sign_in", {
    method: "POST",
    headers: { "content-type": "application/json;charset=UTF-8" },
    body: JSON.stringify({
      ...commonParams(session, false),
      user_detail: email,
      password,
    }),
  });

  const data = decodeApiData(body);
  session.auth = {
    user_detail: data.user_detail,
    token: data.token,
    acc_type: data.acc_type,
    client: data.client,
    expiry: data.expiry,
  };
  saveSession(session);
}

async function ensureAuth(session) {
  if (hasUsableAuth(session.auth)) return;
  await login(session);
}

async function fetchSingle(session, model, num, retryOnAuthError = true) {
  const params = new URLSearchParams({
    ...authParams(session),
    model,
    num: String(num),
  });

  try {
    const body = await requestJson(`/v1/questions/single_num_v2?${params}`);
    const data = decodeApiData(body);
    return {
      item: decodeDeviceItem(data.item),
      count: data.count,
      currentCount: data.current_count,
      prevNum: data.prev_num,
      nextNum: data.next_num,
    };
  } catch (error) {
    if (retryOnAuthError && [13007, 13009, 13024, 13065].includes(Number(error.code))) {
      if (Number(error.code) === 13024) throw error;
      session.auth = null;
      await login(session);
      return fetchSingle(session, model, num, false);
    }

    throw error;
  }
}

function cleanText(value) {
  return String(value ?? "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*<p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function optionFromChoice(choice, index) {
  return {
    id: choice.label || String.fromCharCode(65 + index),
    text: cleanText(choice.choice),
  };
}

function answerLabels(item) {
  const correctLabels = (item.choices ?? [])
    .filter((choice) => choice.correct)
    .map((choice) => choice.label)
    .filter(Boolean);

  if (correctLabels.length) return correctLabels;

  return String(item.answer_in_text ?? "")
    .split(/[,，/ ]+/)
    .map((part) => part.trim().replace(/[^A-Z]/gi, "").toUpperCase())
    .filter(Boolean);
}

function answerTextFromChoices(item) {
  const labels = answerLabels(item);
  const choices = item.choices ?? [];
  const parts = labels.map((label) => {
    const choice = choices.find((candidate) => candidate.label === label);
    return choice ? `${label}. ${cleanText(choice.choice)}` : label;
  });

  return parts.join("; ");
}

function parseFibAnswers(answerInText) {
  return String(answerInText ?? "")
    .split(/\s*[,，]\s*(?=\d+\.)/)
    .map((part) => part.replace(/^\s*\d+\.\s*/, "").trim())
    .filter(Boolean);
}

function buildTranscriptWithBlanks(text) {
  let blankIndex = 0;
  return cleanText(text)
    .replace(/\*\*([^\s,.!?;:，。？！；：)]+)/g, () => {
      blankIndex += 1;
      return `{{${blankIndex}}}`;
    })
    .replace(/\*\*/g, "");
}

function labelsToTags(item, code) {
  const labels = (item.labels ?? [])
    .map((label) => cleanText(label.label))
    .filter(Boolean);
  return [code, ...labels, `Xingji #${item.num}`];
}

function toStaticQuestion(target, item, index) {
  const base = {
    id: `${target.bankKey}-${item.num}`,
    index,
    bankKey: target.bankKey,
    category: target.category,
    type: target.type,
    code: target.code,
    title: cleanText(item.name || item.title || `${target.code} #${item.num}`),
    instruction: target.instruction,
    route: target.route,
    answerText: cleanText(item.answer_in_text),
    tags: labelsToTags(item, target.code),
  };

  if (target.type === "listening-fill-blank") {
    const answers = parseFibAnswers(item.answer_in_text);
    return {
      ...base,
      transcriptWithBlanks: buildTranscriptWithBlanks(item.text),
      answers,
      answerText: answers.map((answer, answerIndex) => `${answerIndex + 1}. ${answer}`).join("; "),
    };
  }

  const labels = answerLabels(item);
  const options = (item.choices ?? []).map(optionFromChoice);
  const choiceAnswerText = answerTextFromChoices(item);
  const question = cleanText(item.question);

  if (target.category === "reading") {
    return {
      ...base,
      passage: cleanText(item.text),
      question,
      options,
      ...(target.type === "reading-multiple" ? { answers: labels } : { answer: labels[0] }),
      answerText: choiceAnswerText || base.answerText,
    };
  }

  return {
    ...base,
    listeningText: cleanText(item.transcript || item.text),
    question,
    options,
    ...(target.type === "listening-multiple" ? { answers: labels } : { answer: labels[0] }),
    answerText: choiceAnswerText || base.answerText,
  };
}

async function findFirstQuestion(session, model) {
  let current = await fetchSingle(session, model, 9999);
  const seen = new Set();

  while (current.prevNum && !seen.has(current.item.num)) {
    seen.add(current.item.num);
    current = await fetchSingle(session, model, current.prevNum);
  }

  return current;
}

async function scrapeTarget(session, target) {
  console.log(`Scraping ${target.code} (${target.model})...`);

  let current = await findFirstQuestion(session, target.model);
  const items = [];
  const seen = new Set();
  const expectedCount = Number(current.count ?? 0);

  while (current?.item && !seen.has(current.item.num)) {
    seen.add(current.item.num);
    items.push(current.item);

    if (!current.nextNum) break;
    current = await fetchSingle(session, target.model, current.nextNum);

    if (items.length % 25 === 0) {
      console.log(`  ${target.code}: ${items.length}/${expectedCount || "?"}`);
    }
  }

  const questions = items.map((item, index) => toStaticQuestion(target, item, index + 1));
  console.log(`  ${target.code}: ${questions.length}/${expectedCount || questions.length} saved`);
  return questions;
}

async function main() {
  const session = loadSession();
  saveSession(session);
  await ensureAuth(session);

  const output = {};
  const summary = {};

  for (const target of TARGETS) {
    const questions = await scrapeTarget(session, target);
    output[target.bankKey] = questions;
    summary[target.bankKey] = questions.length;
  }

  writeJson(OUTPUT_PATH, output);
  console.log(`Wrote ${OUTPUT_PATH}`);
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
