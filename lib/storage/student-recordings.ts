import "server-only";

import { createPrivateR2PlaybackUrl, uploadPrivateR2Object } from "@/lib/storage/r2-private";
import { getStudentAudioPrivateKey } from "@/lib/storage/public-url";

export function getAudioExtension(file: File) {
  if (file.type.includes("wav")) return "wav";
  if (file.type.includes("ogg")) return "ogg";
  if (file.type.includes("mpeg") || file.type.includes("mp3")) return "mp3";
  return "webm";
}

export function createStudentRecordingKey({ questionSource, userId, extension }: { questionSource: string; userId: string; extension: string }) {
  return `pte-audio/students-audio/${questionSource}/${userId}/${Date.now()}.${extension}`;
}

export async function uploadStudentRecordingToPrivateR2({ file, questionSource, userId }: { file: File; questionSource: string; userId: string }) {
  const key = createStudentRecordingKey({
    questionSource,
    userId,
    extension: getAudioExtension(file),
  });

  await uploadPrivateR2Object({
    key,
    file,
    contentType: file.type || "audio/webm",
  });

  return key;
}

export function getStudentRecordingPlaybackUrl(value: string) {
  const key = getStudentAudioPrivateKey(value);
  if (!key) return value;
  return createPrivateR2PlaybackUrl(key);
}

export function getStudentRecordingStorageKey(value: string) {
  return getStudentAudioPrivateKey(value) ?? value;
}
