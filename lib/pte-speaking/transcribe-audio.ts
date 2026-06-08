import { openai } from "./openai-client";

export async function transcribeAudio(file: File) {
  const transcription = await openai.audio.transcriptions.create({
    file,
    model: "gpt-4o-transcribe",
  });

  return transcription.text ?? "";
}
