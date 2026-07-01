import type {
  AzurePronunciationPhoneme,
  AzurePronunciationSummary,
  AzurePronunciationWord,
} from "./types";

type AzurePronunciationAssessment = {
  AccuracyScore?: number;
  FluencyScore?: number;
  CompletenessScore?: number;
  PronScore?: number;
  ErrorType?: string;
};

type AzurePhoneme = {
  Phoneme?: string;
  Offset?: number;
  Duration?: number;
  AccuracyScore?: number;
  PronunciationAssessment?: AzurePronunciationAssessment;
};

type AzureWord = {
  Word?: string;
  Offset?: number;
  Duration?: number;
  AccuracyScore?: number;
  ErrorType?: string;
  PronunciationAssessment?: AzurePronunciationAssessment;
  Phonemes?: AzurePhoneme[];
};

type AzureNBest = {
  Confidence?: number;
  Display?: string;
  Lexical?: string;
  AccuracyScore?: number;
  FluencyScore?: number;
  CompletenessScore?: number;
  PronScore?: number;
  ProsodyScore?: number;
  PronunciationAssessment?: AzurePronunciationAssessment;
  Words?: AzureWord[];
};

export type AzurePronunciationResult = {
  RecognitionStatus?: string;
  DisplayText?: string;
  NBest?: AzureNBest[];
};

type Args = {
  file: File;
  referenceText: string;
  durationSeconds?: number | null;
};

function getAzureSpeechUrl() {
  const region = process.env.AZURE_SPEECH_REGION?.trim();
  const endpoint = process.env.AZURE_SPEECH_ENDPOINT?.trim();

  if (endpoint?.includes("/speech/recognition/")) {
    return endpoint;
  }

  if (region) {
    return `https://${region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US&format=detailed`;
  }

  throw new Error("Azure Speech region 未配置");
}

function toBase64Json(value: Record<string, unknown>) {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64");
}

function toNullableNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function toPteScore(score: number | null) {
  return score === null ? null : Math.round(Math.max(0, Math.min(100, score)) * 0.9);
}

function getContentType(file: File) {
  if (file.type.includes("ogg")) return "audio/ogg; codecs=opus";
  if (file.type.includes("wav")) return "audio/wav; codecs=audio/pcm; samplerate=16000";
  return file.type || "audio/ogg; codecs=opus";
}

function summarizeWord(word: AzureWord): AzurePronunciationWord {
  const assessment = word.PronunciationAssessment;
  const phonemes: AzurePronunciationPhoneme[] | undefined =
    word.Phonemes?.map((phoneme) => ({
      phoneme: phoneme.Phoneme ?? "",
      accuracyScore: toNullableNumber(
        phoneme.PronunciationAssessment?.AccuracyScore ??
          phoneme.AccuracyScore,
      ),
      offset: toNullableNumber(phoneme.Offset),
      duration: toNullableNumber(phoneme.Duration),
    }));

  return {
    word: word.Word ?? "",
    accuracyScore: toNullableNumber(
      assessment?.AccuracyScore ?? word.AccuracyScore,
    ),
    errorType: assessment?.ErrorType ?? word.ErrorType ?? null,
    offset: toNullableNumber(word.Offset),
    duration: toNullableNumber(word.Duration),
    phonemes,
  };
}

export function summarizeAzurePronunciation(
  result: AzurePronunciationResult,
): AzurePronunciationSummary {
  const best = result.NBest?.[0];
  const assessment = best?.PronunciationAssessment;
  const pronunciationScore = toNullableNumber(
    assessment?.PronScore ?? best?.PronScore,
  );

  return {
    recognizedText: best?.Display ?? result.DisplayText ?? "",
    pronunciationScore,
    pronunciationScorePte: toPteScore(pronunciationScore),
    accuracyScore: toNullableNumber(
      assessment?.AccuracyScore ?? best?.AccuracyScore,
    ),
    completenessScore: toNullableNumber(
      assessment?.CompletenessScore ?? best?.CompletenessScore,
    ),
    fluencyScore: toNullableNumber(
      assessment?.FluencyScore ?? best?.FluencyScore,
    ),
    confidence: toNullableNumber(best?.Confidence),
    words: best?.Words?.map(summarizeWord) ?? [],
  };
}

function assertHasPronunciationAssessment(
  result: AzurePronunciationResult,
  summary: AzurePronunciationSummary,
  context: {
    contentType: string;
    durationSeconds?: number | null;
  },
) {
  if (summary.pronunciationScore !== null) return;

  console.error("Azure pronunciation assessment missing:", {
    recognitionStatus: result.RecognitionStatus,
    displayText: result.DisplayText,
    nbestCount: result.NBest?.length ?? 0,
    hasNBestAssessment: Boolean(
      result.NBest?.[0]?.PronunciationAssessment || result.NBest?.[0]?.PronScore,
    ),
    hasWords: Boolean(result.NBest?.[0]?.Words?.length),
    contentType: context.contentType,
    durationSeconds: context.durationSeconds ?? null,
    raw: result,
  });
  throw new Error("Azure 未返回发音评分，请检查音频格式或 Pronunciation-Assessment 参数");
}

export async function assessAzurePronunciation({
  file,
  referenceText,
  durationSeconds,
}: Args) {
  const key = process.env.AZURE_SPEECH_KEY?.trim();

  if (!key) {
    throw new Error("Azure Speech key 未配置");
  }

  const scripted = Boolean(referenceText.trim());
  const assessmentHeader = toBase64Json({
    ...(scripted ? { ReferenceText: referenceText, EnableMiscue: true } : {}),
    GradingSystem: "HundredMark",
    Granularity: "Phoneme",
    Dimension: "Comprehensive",
    PhonemeAlphabet: "IPA",
    NBestPhonemeCount: 5,
  });

  const contentType = getContentType(file);

  const response = await fetch(getAzureSpeechUrl(), {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": key,
      "Content-Type": contentType,
      "Pronunciation-Assessment": assessmentHeader,
      Accept: "application/json",
    },
    body: await file.arrayBuffer(),
  });

  const text = await response.text();
  const json = text ? (JSON.parse(text) as AzurePronunciationResult) : {};

  if (!response.ok) {
    console.error("Azure pronunciation error:", {
      status: response.status,
      region: process.env.AZURE_SPEECH_REGION,
      endpointType: process.env.AZURE_SPEECH_ENDPOINT?.includes(
        "/speech/recognition/",
      )
        ? "full-recognition-url"
        : "region-stt-url",
      response: json,
    });
    throw new Error(`Azure 发音评估失败：${response.status}`);
  }

  if (json.RecognitionStatus && json.RecognitionStatus !== "Success") {
    console.error("Azure pronunciation recognition status:", json);
    throw new Error(`Azure 识别失败：${json.RecognitionStatus}`);
  }

  const summary = summarizeAzurePronunciation(json);
  assertHasPronunciationAssessment(json, summary, {
    contentType,
    durationSeconds,
  });

  return {
    raw: json,
    summary,
  };
}
