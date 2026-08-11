import "server-only";

import { createPrivateR2PlaybackUrl, uploadPrivateR2Object } from "@/lib/storage/r2-private";
import { getStudentAudioPrivateKey } from "@/lib/storage/public-url";

const MAX_STUDENT_RECORDING_BYTES = 25 * 1024 * 1024;
const ALLOWED_AUDIO_TYPES = new Set([
  "audio/webm",
  "audio/wav",
  "audio/wave",
  "audio/x-wav",
  "audio/ogg",
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/x-m4a",
]);

function normalizeAudioContentType(contentType: string) {
  return contentType.split(";")[0]?.trim().toLowerCase() ?? "";
}

export class StudentRecordingUploadError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "StudentRecordingUploadError";
    this.status = status;
  }
}

export function isStudentRecordingUploadError(error: unknown): error is StudentRecordingUploadError {
  return error instanceof StudentRecordingUploadError;
}

export function getAudioExtension(file: File) {
  const contentType = normalizeAudioContentType(file.type);
  if (contentType.includes("wav")) return "wav";
  if (contentType.includes("ogg")) return "ogg";
  if (contentType.includes("mpeg") || contentType.includes("mp3")) return "mp3";
  return "webm";
}

export function createStudentRecordingKey({ questionSource, userId, extension }: { questionSource: string; userId: string; extension: string }) {
  return `pte-audio/students-audio/${questionSource}/${userId}/${Date.now()}.${extension}`;
}

export function validateStudentRecordingFile(file: File) {
  const contentType = normalizeAudioContentType(file.type);

  if (!ALLOWED_AUDIO_TYPES.has(contentType)) {
    throw new StudentRecordingUploadError("录音文件格式不支持，请上传 webm、wav、ogg、mp3 或 m4a 音频。");
  }

  if (file.size <= 0) {
    throw new StudentRecordingUploadError("录音文件为空。");
  }

  if (file.size > MAX_STUDENT_RECORDING_BYTES) {
    throw new StudentRecordingUploadError("录音文件过大，请控制在 25MB 以内。");
  }
}

export async function uploadStudentRecordingToPrivateR2({ file, questionSource, userId }: { file: File; questionSource: string; userId: string }) {
  validateStudentRecordingFile(file);

  const key = createStudentRecordingKey({
    questionSource,
    userId,
    extension: getAudioExtension(file),
  });

  await uploadPrivateR2Object({
    key,
    file,
    contentType: normalizeAudioContentType(file.type) || "audio/webm",
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
