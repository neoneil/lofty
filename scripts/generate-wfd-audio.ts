
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import { writeFileSync, unlinkSync, existsSync } from "fs";
import { join } from "path";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SECRET_KEY!;
const openaiApiKey = process.env.OPENAI_API_KEY!;

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
}

if (!supabaseServiceRoleKey) {
  throw new Error("Missing SUPABASE_SECRET_KEY");
}

if (!openaiApiKey) {
  throw new Error("Missing OPENAI_API_KEY");
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
const openai = new OpenAI({ apiKey: openaiApiKey });

const BUCKET = "pte-audio";
const VOICE = "nova";
const PAGE_SIZE = 500;

type WfdRow = {
  id: string;
  question_text: string;
  audio_url: string | null;
  ai_voice: string | null;
  audio_status?: string | null;
};

async function generateSpeechMp3(text: string, outputPath: string) {
  const response = await openai.audio.speech.create({
    model: "gpt-4o-mini-tts",
    voice: VOICE,
    input: text,
  });

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  writeFileSync(outputPath, buffer);
}

async function uploadFileToStorage(localPath: string, storagePath: string) {
  const fileBuffer = await import("fs").then((fs) => fs.promises.readFile(localPath));

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, fileBuffer, {
      contentType: "audio/mpeg",
      upsert: true,
    });

  if (error) {
    throw error;
  }
}

async function processOne(row: WfdRow) {
  const tempPath = join(process.cwd(), "tmp", `${row.id}.mp3`);
  const storagePath = `wfd/${row.id}.mp3`;

  try {
    console.log(`Generating: ${row.id}`);

    await supabase
      .schema("pte")
      .from("wfd")
      .update({
        audio_status: "generating",
        audio_error: null,
      })
      .eq("id", row.id);

    await generateSpeechMp3(row.question_text, tempPath);
    await uploadFileToStorage(tempPath, storagePath);

    const { error: updateError } = await supabase
      .schema("pte")
      .from("wfd")
      .update({
        audio_url: storagePath,
        ai_voice: VOICE,
        audio_status: "ready",
        audio_generated_at: new Date().toISOString(),
        audio_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id);

    if (updateError) {
      throw updateError;
    }

    console.log(`Done: ${row.id}`);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown audio generation error";

    console.error(`Failed: ${row.id}`, message);

    await supabase
      .schema("pte")
      .from("wfd")
      .update({
        audio_status: "failed",
        audio_error: message,
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id);
  } finally {
    if (existsSync(tempPath)) {
      unlinkSync(tempPath);
    }
  }
}

async function fetchAllPendingWfd() {
  let from = 0;
  const allRows: WfdRow[] = [];

  while (true) {
    const { data, error } = await supabase
      .schema("pte")
      .from("wfd")
      .select("id, question_text, audio_url, ai_voice, audio_status")
      .or("audio_url.is.null,ai_voice.is.null")
      .order("created_at", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      break;
    }

    allRows.push(...(data as WfdRow[]));
    console.log(`Fetched ${allRows.length} pending rows so far...`);

    if (data.length < PAGE_SIZE) {
      break;
    }

    from += PAGE_SIZE;
  }

  return allRows;
}

async function main() {
  const { mkdirSync } = await import("fs");
  mkdirSync(join(process.cwd(), "tmp"), { recursive: true });

  const data = await fetchAllPendingWfd();

  if (!data || data.length === 0) {
    console.log("No WFD rows need audio generation.");
    return;
  }

  console.log(`Found ${data.length} rows to process.`);

  for (const row of data) {
    await processOne(row);
  }

  console.log("All done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

// import dotenv from "dotenv";
// dotenv.config({ path: ".env.local" });
// import { createClient } from "@supabase/supabase-js";
// import OpenAI from "openai";
// import { writeFileSync, unlinkSync, existsSync } from "fs";
// import { join } from "path";

// const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// const supabaseServiceRoleKey = process.env.SUPABASE_SECRET_KEY!;
// const openaiApiKey = process.env.OPENAI_API_KEY!;

// if (!supabaseUrl) {
//   throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
// }

// if (!supabaseServiceRoleKey) {
//   throw new Error("Missing SUPABASE_SECRET_KEY");
// }

// if (!openaiApiKey) {
//   throw new Error("Missing OPENAI_API_KEY");
// }

// const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
// const openai = new OpenAI({ apiKey: openaiApiKey });

// const BUCKET = "pte-audio";
// const VOICE = "nova";

// type WfdRow = {
//   id: string;
//   question_text: string;
//   audio_url: string | null;
//   ai_voice: string | null;
//   audio_status?: string | null;
// };

// async function generateSpeechMp3(text: string, outputPath: string) {
// const response = await openai.audio.speech.create({
//   model: "gpt-4o-mini-tts",
//   voice: VOICE,
//   input: text,
// });

//   const arrayBuffer = await response.arrayBuffer();
//   const buffer = Buffer.from(arrayBuffer);
//   writeFileSync(outputPath, buffer);
// }

// async function uploadFileToStorage(localPath: string, storagePath: string) {
//   const fileBuffer = await import("fs").then((fs) => fs.promises.readFile(localPath));

//   const { error } = await supabase.storage
//     .from(BUCKET)
//     .upload(storagePath, fileBuffer, {
//       contentType: "audio/mpeg",
//       upsert: true,
//     });

//   if (error) {
//     throw error;
//   }
// }

// async function processOne(row: WfdRow) {
//   const tempPath = join(process.cwd(), "tmp", `${row.id}.mp3`);
//   const storagePath = `wfd/${row.id}.mp3`;

//   try {
//     console.log(`Generating: ${row.id}`);

//     await supabase
//       .schema("pte")
//       .from("wfd")
//       .update({
//         audio_status: "generating",
//         audio_error: null,
//       })
//       .eq("id", row.id);

//     await generateSpeechMp3(row.question_text, tempPath);
//     await uploadFileToStorage(tempPath, storagePath);

//     const { error: updateError } = await supabase
//       .schema("pte")
//       .from("wfd")
//       .update({
//         audio_url: storagePath,
//         ai_voice: VOICE,
//         audio_status: "ready",
//         audio_generated_at: new Date().toISOString(),
//         audio_error: null,
//         updated_at: new Date().toISOString(),
//       })
//       .eq("id", row.id);

//     if (updateError) {
//       throw updateError;
//     }

//     console.log(`Done: ${row.id}`);
//   } catch (error) {
//     const message =
//       error instanceof Error ? error.message : "Unknown audio generation error";

//     console.error(`Failed: ${row.id}`, message);

//     await supabase
//       .schema("pte")
//       .from("wfd")
//       .update({
//         audio_status: "failed",
//         audio_error: message,
//         updated_at: new Date().toISOString(),
//       })
//       .eq("id", row.id);
//   } finally {
//     if (existsSync(tempPath)) {
//       unlinkSync(tempPath);
//     }
//   }
// }

// async function main() {
//   const { mkdirSync } = await import("fs");
//   mkdirSync(join(process.cwd(), "tmp"), { recursive: true });

//   const { data, error } = await supabase
//     .schema("pte")
//     .from("wfd")
//     .select("id, question_text, audio_url, ai_voice, audio_status")
//     .or("audio_url.is.null,ai_voice.is.null")
//     .order("created_at", { ascending: true });

//   if (error) {
//     throw error;
//   }

//   if (!data || data.length === 0) {
//     console.log("No WFD rows need audio generation.");
//     return;
//   }

//   console.log(`Found ${data.length} rows to process.`);

//   for (const row of data as WfdRow[]) {
//     await processOne(row);
//   }

//   console.log("All done.");
// }

// main().catch((err) => {
//   console.error(err);
//   process.exit(1);
// });