import crypto from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import dotenv from "dotenv";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });

const MODEL = "gpt-image-1-mini";
const QUALITY = "medium";
const SIZE = "1024x1024";
const IMAGE_RELATIVE_PREFIX = "PTE/listening/WFD";
const IMAGE_BUCKET_PREFIX = "pte-images";
const IMAGE_ORDER_PATH = path.join("data", "wfd-image-memory-order.json");
const region = "auto";
const service = "s3";

const variationSeeds = [
  "Use a polished academic visual metaphor with layered props, precise diagrams, glass surfaces, warm editorial lighting, and a refined teal-coral palette.",
  "Use a detailed scientific or institutional scene with documents, tools, diagrams, architecture, and cinematic but restrained lighting.",
  "Use a premium smart-campus or research-lab environment with transparent learning technology, luminous interfaces without readable text, and rich environmental detail.",
  "Use a sophisticated symbolic composition with layered objects, visual cause-and-effect, elegant motion cues, and mature anime-style polish.",
  "Use a quiet library, office, lab, or campus-detail scene with stacked objects, clocks, calendars, equipment, and controlled cinematic shadows.",
  "Use an elegant physics, math, or knowledge scene with deep-space diagrams, tensor-like symbols, orbital paths, geometric structures, and advanced academic atmosphere.",
  "Use a premium course or study-material scene with refined architecture, abstract course cards without readable text, and a rich editorial palette.",
  "Use a detailed nature, farming, climate, or systems scene with weather layers, tools, environmental cues, and clear memory anchors.",
  "Use a deep math-and-philosophy knowledge scene with abstract logic structures, geometric proofs, paradox imagery, and elegant lecture lighting.",
  "Use a mature resource, economy, technology, or ecosystem visual metaphor with spatial tension, layered systems, and high-end anime composition.",
];

function sentenceAllowsPeople(sentence) {
  return /\b(student|students|people|person|persons|human|humans|men|women|professor|professors|teacher|teachers|lecturer|lecturers|tutor|tutors|mentor|mentors|worker|workers|employee|employees|manager|managers|director|directors|staff|customer|customers|farmer|farmers|team|meeting|seminar|seminars|tutorial|tutorials|class|classes|lecture|lectures|society|social|behavior|behaviors|football)\b/i.test(sentence);
}

function getArg(name, fallback) {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length) ?? fallback;
}

function hasFlag(name) {
  return process.argv.includes(`--${name}`);
}

function hmac(key, value) {
  return crypto.createHmac("sha256", key).update(value).digest();
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function encodePathKey(key) {
  return key.split("/").map((part) => encodeURIComponent(part)).join("/");
}

function getSigningKey(secretAccessKey, dateStamp) {
  const dateKey = hmac(`AWS4${secretAccessKey}`, dateStamp);
  const dateRegionKey = hmac(dateKey, region);
  const dateRegionServiceKey = hmac(dateRegionKey, service);
  return hmac(dateRegionServiceKey, "aws4_request");
}

function createR2PresignedPutUrl(key) {
  const endpoint = (process.env.CLOUDFLARE_R2_S3_API_ENDPOINT ?? process.env.CLOUDFLARE_R2_ENDPOINT ?? "https://a3258c7ea50842a467e9f67707e29858.r2.cloudflarestorage.com/ted").replace(/\/+$/, "");
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
  const bucket = process.env.CLOUDFLARE_R2_BUCKET ?? "ted";

  if (!endpoint || !accessKeyId || !secretAccessKey) throw new Error("Missing R2 env.");

  const endpointUrl = new URL(endpoint);
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const host = endpointUrl.host;
  const endpointPath = endpointUrl.pathname.replace(/\/+$/, "");
  const canonicalUri = `${endpointPath || `/${bucket}`}/${encodePathKey(key)}`;
  const credential = `${accessKeyId}/${credentialScope}`;
  const signedHeaders = "host";
  const params = new URLSearchParams({
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": credential,
    "X-Amz-Date": amzDate,
    "X-Amz-Expires": "900",
    "X-Amz-SignedHeaders": signedHeaders,
  });
  const canonicalQueryString = Array.from(params.entries()).map(([paramKey, value]) => `${encodeURIComponent(paramKey)}=${encodeURIComponent(value)}`).sort().join("&");
  const canonicalRequest = ["PUT", canonicalUri, canonicalQueryString, `host:${host}\n`, signedHeaders, "UNSIGNED-PAYLOAD"].join("\n");
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, credentialScope, sha256(canonicalRequest)].join("\n");
  const signature = crypto.createHmac("sha256", getSigningKey(secretAccessKey, dateStamp)).update(stringToSign).digest("hex");
  params.set("X-Amz-Signature", signature);

  return `${endpointUrl.protocol}//${host}${canonicalUri}?${params.toString()}`;
}

function getImageRelativePath(questionId) {
  return `${IMAGE_RELATIVE_PREFIX}/${questionId}/ai-image.png`;
}

function getReplacementImageRelativePath(questionId, runId) {
  return `${IMAGE_RELATIVE_PREFIX}/${questionId}/ai-image-${runId}.png`;
}

function getImageR2Key(relativePath) {
  return `${IMAGE_BUCKET_PREFIX}/${relativePath}`;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry(label, fn, attempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === attempts) break;
      const waitMs = attempt * 3000;
      console.warn(`${label} failed on attempt ${attempt}/${attempts}: ${error.message}. Retrying in ${waitMs}ms.`);
      await delay(waitMs);
    }
  }
  throw lastError;
}

function buildPrompt(sentence, index, { noPeople }) {
  const variationSeed = variationSeeds[index % variationSeeds.length];
  const allowPeople = !noPeople && sentenceAllowsPeople(sentence);
  const noCharacterRule = noPeople
    ? `Special no-people rule for this image:
Do not include any human, person, student, professor, face, eyes, mouth, portrait, body, hand, fist, arm, leg, crowd, silhouette, mascot, creature, or character.
Do not anthropomorphize the muscle, bones, objects, or diagrams.
Use only refined non-character visual storytelling: anatomical structures, muscle fibers, tendons, bones as clean educational shapes, mechanical metaphors, symbolic motion arrows, layered medical-style diagrams, and elegant abstract forms without readable text.`
    : `Default no-character rule for this image:
The sentence does not explicitly require visible people, so do not include any human, person, student, professor, face, eyes, mouth, portrait, body, hand, fist, arm, leg, crowd, silhouette, mascot, creature, or character.
Do not anthropomorphize objects, animals, muscles, bones, tools, books, machines, diagrams, or natural elements.
Use only refined non-character visual storytelling: objects, places, architecture, symbolic motion arrows, scientific structures, tools, maps, abstract systems, environmental details, and elegant diagrams without readable text.`;
  const peopleRule = allowPeople
    ? `People rule:
This sentence explicitly involves people, students, teachers, workers, meetings, teams, society, or human interaction, so visible people are allowed but not required.
If people are not needed for clarity, prefer a character-free scene, symbolic props, environmental storytelling, or visual metaphor.
When people are included, use East Asian and Western faces randomly and naturally across different images, especially for campus, professor, student, lecture, assignment, or classroom sentences.
When students are included, they should look like university students or young adults, not children.
Human characters do not all need large eyes; mix refined anime faces, smaller eyes, sharp eyes, round faces, slim people, heavyset people, tall people, short people, and distinct silhouettes.
When human characters appear, make them more realistic and refined: natural facial structure, believable anatomy, detailed hair, nuanced clothing folds, elegant posture, calm professional presence, and subtle believable emotion.
Facial expressions must be natural, restrained, focused, thoughtful, or mildly engaged. Avoid exaggerated expressions, oversized cartoon mouths, shouting faces, wild eyes, slapstick reactions, rubbery limbs, animal-like comedy faces, and chaotic motion.`
    : noCharacterRule;

  return `Create a 2D animated cartoon illustration for a PTE Write From Dictation memory card.

Sentence concept:
"${sentence}"

Goal:
Make the image help students remember the meaning and key words of the sentence through a creative visual metaphor, not by writing the full sentence.

Style:
Highly stylized 2D anime illustration with a semi-realistic finish, refined animation still, delicate fine linework, elegant character design when characters are needed, polished shading, rich educational detail, high visual clarity, not 3D, not photorealistic.
The tone should feel like premium contemporary anime or a high-end animated film still, not old slapstick cartoons, not rubber-hose animation, not Tom-and-Jerry-like comedy, not childish mascot art.

Creative direction:
Choose one fresh visual approach that best fits the sentence:
- a funny everyday scene
- a symbolic visual metaphor
- an imaginative miniature world
- an object-driven visual metaphor
- a classroom or campus moment
- a simple comic-like snapshot
- a surreal but easy-to-understand memory scene

Variation seed:
${variationSeed}

Text rules:
No readable text in the image.
Do not write the full sentence.
Do not place the sentence on a blackboard, notebook page, poster, or screen.
Do not make text the main visual element.
Do not generate Chinese characters, English words, letters, numbers, brand marks, signs, logos, labels, captions, subtitles, or blackboard writing.
If a classroom, lecture hall, book, board, screen, poster, sign, document, or interface appears, it must be blank or contain only abstract unreadable marks, symbols, diagrams, icons, shapes, arrows, or lines.

Composition rules:
Make the main idea instantly readable.
Include 5-8 memorable visual details related to important nouns, verbs, or concepts in the sentence, while keeping the image readable.
Use a different setting, angle, character type, and color mood from generic classroom images.
${peopleRule}
If the sentence suggests an event, story, discussion, journey, discovery, or cause-and-effect, show it as a small storytelling moment rather than a static object scene.
For lecture, professor, teacher, course, university, academic explanation, physics, math, philosophy, technology, science, or knowledge-heavy sentences, make the visual feel more premium, advanced, and intellectually deep. Show abstract knowledge as beautiful floating diagrams, luminous symbols, layered visual explanations, complex systems, equations as unreadable symbolic marks, geometric structures, cosmic models, neural networks, philosophical logic maps, or curated teaching props. If a lecturer or mentor is explicitly appropriate, keep them realistic, calm, sophisticated, and professionally composed. Avoid childish classroom doodles for these knowledge-explanation scenes.
No horses or pony characters.
No brand logos.
No realistic people.
No cluttered infographic layout.
No dark or scary mood.

Output:
Square 1024x1024 image.`;
}

function parseSourceIds(value) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => item.toUpperCase().startsWith("LOFTY-WFD-") ? item.toUpperCase() : `LOFTY-WFD-${item.padStart(4, "0")}`);
}

async function findCandidates(supabase, limit, { replaceExisting, sourceIds }) {
  let query = supabase
    .schema("pte")
    .from("wfd")
    .select("id, source_question_id, question_text, ai_image, created_at")
    .eq("is_prediction", true)
    .not("question_text", "is", null)
    .order("created_at", { ascending: false })
    .order("source_question_id", { ascending: true })
    .limit(limit);

  if (sourceIds.length > 0) {
    query = query.in("source_question_id", sourceIds);
  } else {
    query = replaceExisting ? query.not("ai_image", "is", null) : query.or("ai_image.is.null,ai_image.eq.");
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);
  return data ?? [];
}

async function generateImage(openai, prompt) {
  const result = await openai.images.generate({
    model: MODEL,
    prompt,
    size: SIZE,
    quality: QUALITY,
    n: 1,
  });

  const b64 = result.data?.[0]?.b64_json;
  if (!b64) throw new Error("OpenAI image response did not include b64_json.");
  return Buffer.from(b64, "base64");
}

async function uploadImage(key, body) {
  const response = await fetch(createR2PresignedPutUrl(key), {
    method: "PUT",
    headers: { "Content-Type": "image/png" },
    body,
  });

  if (!response.ok) throw new Error(`R2 upload failed for ${key}: ${response.status} ${response.statusText}`);
}

function writeBackup(rows) {
  mkdirSync("download", { recursive: true });
  const backupPath = path.join("download", `wfd-ai-image-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
  writeFileSync(backupPath, JSON.stringify({ createdAt: new Date().toISOString(), rows }, null, 2));
  return backupPath;
}

function readImageOrder() {
  if (!existsSync(IMAGE_ORDER_PATH)) return [];
  const parsed = JSON.parse(readFileSync(IMAGE_ORDER_PATH, "utf8"));
  return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
}

function appendImageOrder(questionId) {
  const order = readImageOrder();
  if (order.includes(questionId)) return;
  order.push(questionId);
  mkdirSync(path.dirname(IMAGE_ORDER_PATH), { recursive: true });
  writeFileSync(IMAGE_ORDER_PATH, `${JSON.stringify(order, null, 2)}\n`);
}

const limit = Math.max(1, Math.min(50, Number(getArg("limit", "10")) || 10));
const execute = hasFlag("execute");
const replaceExisting = hasFlag("replace-existing");
const runId = getArg("run-id", new Date().toISOString().slice(0, 19).replace(/[-:T]/g, ""));
const sourceIds = parseSourceIds(getArg("source-ids", ""));
const noPeople = hasFlag("no-people");

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) throw new Error("Missing Supabase admin env.");
if (execute && !process.env.OPENAI_API_KEY) throw new Error("Missing OPENAI_API_KEY.");

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const openai = execute ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

const candidates = await findCandidates(supabase, limit, { replaceExisting, sourceIds });
console.log(`WFD AI image candidates: ${candidates.length} execute=${execute} replaceExisting=${replaceExisting} noPeople=${noPeople} sourceIds=${sourceIds.join(",") || "none"}`);
candidates.forEach((question, index) => {
  console.log(`${index + 1}. ${question.source_question_id ?? question.id} ${question.id} ${question.question_text}`);
});

if (!execute) {
  console.log("\nDry run only. Add --execute to generate images, upload R2 objects, and update pte.wfd.ai_image.");
  process.exit(0);
}

const backupPath = writeBackup(candidates.map((row) => ({ id: row.id, ai_image: row.ai_image ?? null })));
console.log(`Backup written: ${backupPath}`);

for (const [index, question] of candidates.entries()) {
  const relativePath = replaceExisting ? getReplacementImageRelativePath(question.id, runId) : getImageRelativePath(question.id);
  const key = getImageR2Key(relativePath);
  const prompt = buildPrompt(question.question_text, index, { noPeople });

  console.log(`\n${index + 1}/${candidates.length} ${question.id}`);
  console.log(`Generating image with ${MODEL} ${QUALITY} ${SIZE}`);
  const image = await withRetry(`Generate ${question.id}`, () => generateImage(openai, prompt));

  console.log(`Uploading ${key}`);
  await withRetry(`Upload ${question.id}`, () => uploadImage(key, image));

  console.log(`Updating pte.wfd.ai_image = ${relativePath}`);
  const { error } = await withRetry(`Update ${question.id}`, () => supabase.schema("pte").from("wfd").update({ ai_image: relativePath }).eq("id", question.id));
  if (error) throw new Error(error.message);
  appendImageOrder(question.id);
}

console.log(`\nCompleted ${candidates.length} WFD AI images.`);
