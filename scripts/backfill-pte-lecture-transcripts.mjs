import fs from "node:fs";
import path from "node:path";

import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });

const predictionOnly = process.argv.includes("--prediction-only=true");
const hasCjk = /[\u3400-\u9fff\uf900-\ufaff]/;
const hasLatin = /[A-Za-z]/;
const sentenceSegmenter = typeof Intl !== "undefined" && Intl.Segmenter ? new Intl.Segmenter("en", { granularity: "sentence" }) : null;

function splitSentences(text) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return [];

  if (sentenceSegmenter) {
    return Array.from(sentenceSegmenter.segment(normalized), (segment) => segment.segment.trim()).filter(Boolean);
  }

  return normalized.split(/(?<=[.!?])\s+/).map((sentence) => sentence.trim()).filter(Boolean);
}

function cleanLine(line) {
  return line
    .replace(/【[^】]*】/g, " ")
    .replace(/（[^）]*[\u3400-\u9fff][^）]*）/g, " ")
    .replace(/\([^)]*[\u3400-\u9fff][^)]*\)/g, " ")
    .replace(/[\u3400-\u9fff\uf900-\ufaff]/g, " ")
    .replace(/[，。；：！？、]/g, " ")
    .replace(/^[-•*\d.)\s]+(?=[A-Za-z"'])/, "")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function extractEnglishTranscript(value) {
  const englishLines = String(value || "")
    .replace(/【[^】]*】/g, "\n")
    .split(/\r?\n+/)
    .map(cleanLine)
    .filter((line) => line && hasLatin.test(line) && !hasCjk.test(line));

  const sentences = [];

  for (const line of englishLines) {
    for (const sentence of splitSentences(line)) {
      const cleaned = sentence.replace(/[ \t]+/g, " ").trim();
      if (cleaned && hasLatin.test(cleaned) && !hasCjk.test(cleaned)) {
        sentences.push(cleaned);
      }
    }
  }

  return sentences.join("\n").trim();
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !serviceKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY.");
}

const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
const jobs = [
  { table: "rl", source: "original_text" },
  { table: "sst", source: "transcript_text" },
];

const backup = { created_at: new Date().toISOString(), prediction_only: predictionOnly, jobs: [] };
let totalUpdated = 0;
let totalSkippedEmpty = 0;

for (const job of jobs) {
  let query = supabase
    .schema("pte")
    .from(job.table)
    .select(`id,${job.source},transcript`)
    .not(job.source, "is", null)
    .or("transcript.is.null,transcript.eq.")
    .order("created_at", { ascending: true });

  if (predictionOnly) {
    query = query.eq("is_prediction", true);
  }

  const { data, error } = await query;
  if (error) throw new Error(`${job.table}: ${error.message}`);

  backup.jobs.push({ table: job.table, source: job.source, rows: data ?? [] });

  let updated = 0;
  let skippedEmpty = 0;

  for (const row of data ?? []) {
    const transcript = extractEnglishTranscript(row[job.source]);

    if (!transcript) {
      skippedEmpty += 1;
      console.log(`${job.table.toUpperCase()} ${row.id} skipped: no English transcript extracted`);
      continue;
    }

    const { error: updateError } = await supabase.schema("pte").from(job.table).update({ transcript }).eq("id", row.id);
    if (updateError) throw new Error(`${job.table} ${row.id}: ${updateError.message}`);

    updated += 1;
  }

  totalUpdated += updated;
  totalSkippedEmpty += skippedEmpty;
  console.log(JSON.stringify({ table: job.table, candidates: data?.length ?? 0, updated, skippedEmpty }));
}

fs.mkdirSync("tmp", { recursive: true });
const backupPath = path.join("tmp", `pte-rl-sst-transcript-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));
console.log(JSON.stringify({ totalUpdated, totalSkippedEmpty, backupPath }));
