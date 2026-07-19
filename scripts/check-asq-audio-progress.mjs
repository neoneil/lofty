import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

const { data, error } = await supabase.schema("pte").from("asq").select("id,audio_status,ai_voice,audio_url").eq("is_prediction", true).order("created_at", { ascending: true }).order("id", { ascending: true });

if (error) throw new Error(error.message);

const counts = {};
const voices = {};
let validReady = 0;

for (const row of data ?? []) {
  const status = row.audio_status ?? "null";
  counts[status] = (counts[status] ?? 0) + 1;
  if (row.ai_voice) voices[row.ai_voice] = (voices[row.ai_voice] ?? 0) + 1;
  if (row.audio_status === "ready" && row.ai_voice && row.audio_url === `PTE/speaking/ASQ/${row.id}/${row.ai_voice}.mp3`) validReady += 1;
}

console.log(JSON.stringify({ total: data?.length ?? 0, counts, voices, validReady, remaining: (data?.length ?? 0) - validReady }, null, 2));
