import fs from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import matter from "gray-matter";
import OpenAI from "openai";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONTENT_ROOT = path.join(ROOT, "content", "ielts", "cambridge");
const BOOKS = [21, 20, 19, 18, 17, 16];
const TESTS = [1, 2, 3, 4];
const SECTIONS = [1, 2, 3, 4];
const MODEL = process.env.OPENAI_TRANSCRIPTION_MODEL || "whisper-1";
const DRY_RUN = process.argv.includes("--dry-run");
const FORCE = process.argv.includes("--force");
const LIMIT = readNumberArg("--limit");
const START = Math.max(1, readNumberArg("--start") || 1);

loadEnvFile(path.join(ROOT, ".env.local"));
loadEnvFile(path.join(ROOT, ".env"));

async function main() {
  const jobs = [];

  for (const book of BOOKS) {
    for (const test of TESTS) {
      for (const section of SECTIONS) {
        const mdPath = path.join(CONTENT_ROOT, `${book}`, `test${test}`, "listening", `section${section}.md`);
        const vttPath = path.join(CONTENT_ROOT, `${book}`, `test${test}`, "listening", `section${section}.vtt`);
        if (!fs.existsSync(mdPath)) throw new Error(`Missing section markdown: ${relative(mdPath)}`);

        const parsed = matter(await readFile(mdPath, "utf8"));
        const sectionRaw = parseJsonRecord(parsed.data.section_raw_data_json);
        const assets = parseJsonArray(parsed.data.assets_json);
        const audioUrl = findSectionAudioUrl(sectionRaw, assets);
        if (!audioUrl) throw new Error(`Missing short section audio: Cambridge ${book} Test ${test} Section ${section}`);

        jobs.push({ book, test, section, mdPath, vttPath, audioUrl });
      }
    }
  }

  const uniqueAudioCount = new Set(jobs.map((job) => job.audioUrl)).size;
  console.log(`Found ${jobs.length} section jobs, ${uniqueAudioCount} unique short audio urls.`);
  if (jobs.length !== 96 || uniqueAudioCount !== 96) {
    throw new Error(`Expected 96 section jobs and 96 unique short audio urls, got jobs=${jobs.length}, uniqueAudios=${uniqueAudioCount}.`);
  }

  const runJobs = jobs.slice(START - 1, LIMIT ? START - 1 + LIMIT : undefined);
  const existing = runJobs.filter((job) => fs.existsSync(job.vttPath)).length;
  console.log(`Existing VTT files in run: ${existing}. Pending in run: ${FORCE ? runJobs.length : runJobs.length - existing}.`);
  if (DRY_RUN) {
    for (const job of runJobs) console.log(`[dry-run] ${label(job)} -> ${relative(job.vttPath)}`);
    return;
  }

  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is missing.");

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "lofty-ielts-vtt-"));
  const failures = [];

  for (let index = 0; index < runJobs.length; index += 1) {
    const job = runJobs[index];
    const prefix = `[${index + 1}/${runJobs.length}] ${label(job)}`;

    if (!FORCE && fs.existsSync(job.vttPath)) {
      console.log(`${prefix} skip existing`);
      continue;
    }

    try {
      const audioPath = path.join(tmpDir, `${job.book}-test${job.test}-section${job.section}.mp3`);
      console.log(`${prefix} downloading audio`);
      await downloadFileWithRetry(job.audioUrl, audioPath);

      console.log(`${prefix} transcribing with ${MODEL}`);
      const started = Date.now();
      const vtt = await client.audio.transcriptions.create({
        file: fs.createReadStream(audioPath),
        model: MODEL,
        response_format: "vtt",
      });

      await writeFile(job.vttPath, typeof vtt === "string" ? vtt : String(vtt), "utf8");
      console.log(`${prefix} saved ${relative(job.vttPath)} in ${Math.round((Date.now() - started) / 1000)}s`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failures.push({ job, message });
      console.error(`${prefix} failed: ${message}`);
    }
  }

  await mkdir(path.join(ROOT, "download"), { recursive: true });
  const reportPath = path.join(ROOT, "download", "ielts-vtt-transcription-report.json");
  await writeFile(reportPath, JSON.stringify({ createdAt: new Date().toISOString(), model: MODEL, total: runJobs.length, failures }, null, 2), "utf8");
  console.log(`Done. Failures: ${failures.length}. Report: ${relative(reportPath)}`);
  if (failures.length > 0) process.exitCode = 1;
}

function findSectionAudioUrl(sectionRaw, assets) {
  const rawUrl = firstString(sectionRaw.analysisAudio) || firstString(sectionRaw.analysis_audio);
  if (!rawUrl) return "";

  const rawName = fileName(rawUrl);
  const matched = assets.find((asset) => asset.asset_type === "audio" && fileName(firstString(asset.metadata?.source_url)) === rawName)
    || assets.find((asset) => asset.asset_type === "audio" && fileName(firstString(asset.public_url)) === rawName)
    || assets.find((asset) => asset.asset_type === "audio" && fileName(firstString(asset.storage_path)) === rawName);

  return firstString(matched?.public_url) || rawUrl;
}

async function downloadFileWithRetry(url, targetPath) {
  const attempts = 3;
  let lastError = null;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await downloadFile(url, targetPath);
      return;
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
    }
  }
  throw lastError;
}

async function downloadFile(url, targetPath) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`Download failed ${response.status} ${response.statusText}`);
    await writeFile(targetPath, Buffer.from(await response.arrayBuffer()));
  } finally {
    clearTimeout(timeout);
  }
}

function parseJsonRecord(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) return value;
  if (typeof value !== "string") return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function parseJsonArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
}

function label(job) {
  return `Cambridge ${job.book} Test ${job.test} Section ${job.section}`;
}

function fileName(value) {
  return value.split("?")[0]?.split("/").pop() || "";
}

function firstString(value) {
  return typeof value === "string" ? value : "";
}

function relative(targetPath) {
  return path.relative(ROOT, targetPath);
}

function readNumberArg(name) {
  const inline = process.argv.find((arg) => arg.startsWith(`${name}=`));
  const raw = inline ? inline.slice(name.length + 1) : process.argv[process.argv.indexOf(name) + 1];
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
