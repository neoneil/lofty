"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { useRouter } from "next/navigation";
import DictionaryText from "@/components/dictionary/dictionary-text";
import AudioPlayer from "@/components/site/AudioPlayer";
import RecordingPanel from "@/components/site/RecordingPanel";
import Tag from "@/components/ui/tag";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui-v2/card";

type Question = {
  id: string;
  question_text: string;
  tags: string[] | null;
};

type PracticeFeedbackJson = {
  feedback?: string;
  suggestions?: string[];
  raw?: RAScoreResult;
};

type UserPractice = {
  id: string;
  question_type: string;
  question_id: string;
  audio_url: string;
  transcript: string | null;
  overall_score: number | null;
  content_score: number | null;
  fluency_score: number | null;
  pronunciation_score: number | null;
  accuracy_score: number | null;
  completeness_score: number | null;
  feedback_json: PracticeFeedbackJson | null;
  created_at: string | null;
};

type RAScoreResult = {
  overallScore: number;
  contentScore: number;
  fluencyScore: number;
  pronunciationScore: number;
  transcript: string;
  feedback: string;
  suggestions: string[];
  azure?: {
    recognizedText: string;
    pronunciationScore: number | null;
    pronunciationScorePte: number | null;
    accuracyScore: number | null;
    completenessScore: number | null;
    fluencyScore: number | null;
    confidence: number | null;
    words: {
      word: string;
      accuracyScore: number | null;
      errorType: string | null;
      phonemes?: {
        phoneme: string;
        accuracyScore: number | null;
      }[];
    }[];
  };
};

type Props = {
  question: Question;
};

type AzureWordResult = NonNullable<RAScoreResult["azure"]>["words"][number];

type ScoredTextToken = {
  id: string;
  text: string;
  type: "word" | "punctuation";
  word?: AzureWordResult;
};

function getWordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function normalizeWord(text: string) {
  return text.toLowerCase().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
}

function tokenizeText(text: string) {
  return (
    text.match(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)?|[^\s\p{L}\p{N}]+/gu) ??
    []
  );
}

function buildScoredTextTokens(
  text: string,
  words: AzureWordResult[],
): ScoredTextToken[] {
  let azureWordIndex = 0;

  return tokenizeText(text).map((token, index) => {
    const normalizedToken = normalizeWord(token);

    if (!normalizedToken) {
      return {
        id: `${token}-${index}`,
        text: token,
        type: "punctuation",
      };
    }

    let matchedWord: AzureWordResult | undefined;

    for (let offset = 0; offset < 3; offset += 1) {
      const candidate = words[azureWordIndex + offset];
      if (!candidate) break;

      if (normalizeWord(candidate.word) === normalizedToken) {
        matchedWord = candidate;
        azureWordIndex += offset + 1;
        break;
      }
    }

    if (!matchedWord && words[azureWordIndex]) {
      matchedWord = words[azureWordIndex];
      azureWordIndex += 1;
    }

    return {
      id: `${token}-${index}`,
      text: token,
      type: "word",
      word: matchedWord,
    };
  });
}

function getWordTone(word?: AzureWordResult) {
  const score = word?.accuracyScore;
  const errorType = word?.errorType;

  if (!word || score === null || score === undefined) return "neutral";
  if (errorType && errorType !== "None") return "bad";
  if (score >= 85) return "good";
  if (score >= 70) return "warning";
  return "bad";
}

function getWordButtonClass(word?: AzureWordResult) {
  const tone = getWordTone(word);

  if (tone === "good") {
    return "border-[var(--success)]/25 bg-[var(--success-soft)] text-[var(--success)]";
  }

  if (tone === "warning") {
    return "border-[var(--warning)]/35 bg-[var(--warning-soft)] text-[var(--warning)] hover:border-[var(--warning)]";
  }

  if (tone === "bad") {
    return "border-[var(--danger)]/30 bg-[var(--danger-soft)] text-[var(--danger)] hover:border-[var(--danger)]";
  }

  return "border-[var(--border)] bg-[var(--card)] text-[var(--text-soft)]";
}

function getErrorTypeLabel(errorType: string | null | undefined) {
  if (errorType === "Omission") return "漏读";
  if (errorType === "Insertion") return "多读";
  if (errorType === "Mispronunciation") return "误读";
  return "发音不稳定";
}

function getPhonemeAdvice(phoneme: string) {
  const normalized = phoneme.replace(/[ˈˌ]/g, "");

  const adviceMap: Record<string, string> = {
    "æ": "嘴巴打开，舌位放低，声音介于 /a/ 和 /e/ 之间，不要读成 /e/。",
    "ɑ": "口腔打开，舌头放低靠后，声音要饱满，不要收得太短。",
    "ʌ": "短促放松，舌头居中，不要读成很重的 /a/。",
    "ə": "弱读音，声音轻短放松，不要把它读得太清楚或太重。",
    "ɜ": "舌头居中，嘴唇放松，英式读法里不要卷舌过重。",
    "i": "嘴角微微拉开，舌位高，声音清晰，不要读成短 /ɪ/。",
    "ɪ": "比 /i:/ 更短更放松，嘴角不要拉太开。",
    "u": "嘴唇收圆，舌位靠后，声音保持稳定，不要读成 /ʊ/。",
    "ʊ": "短促放松，嘴唇轻微收圆，不要拉成长 /u:/。",
    "e": "舌位在中前部，嘴巴半开，不要读成 /æ/。",
    "ɔ": "嘴唇收圆，舌位靠后，声音要有圆唇感。",
    "aɪ": "从 /a/ 滑到 /ɪ/，注意是双元音，不要只发一个单音。",
    "eɪ": "从 /e/ 滑到 /ɪ/，结尾轻收，不要读成纯 /e/。",
    "oʊ": "从 /o/ 滑到 /ʊ/，嘴唇逐渐收圆。",
    "aʊ": "从 /a/ 滑到 /ʊ/，第二段要明显收圆。",
    "θ": "舌尖轻放在上下齿之间送气，不要读成 /s/ 或 /t/。",
    "ð": "舌尖轻触齿间并振动声带，不要读成 /d/ 或 /z/。",
    "r": "舌尖不要碰上颚，舌身后缩，保持卷舌或后置感。",
    "l": "舌尖抵住上齿龈，词尾 /l/ 要有舌尖收尾。",
    "v": "上齿轻触下唇并振动声带，不要读成 /w/。",
    "w": "双唇收圆再打开，不要用上齿咬下唇。",
    "ʃ": "嘴唇微圆，舌面抬起，发出类似 sh 的摩擦音。",
    "ʒ": "在 /ʃ/ 的口型上振动声带，声音更浊。",
    "tʃ": "先短促阻塞再释放成 ch 音，不要拖太长。",
    "dʒ": "先阻塞再释放，并振动声带，类似 j 音。",
    "ŋ": "舌后部抬起抵住软腭，声音从鼻腔出，不要加 /g/。",
    "p": "双唇闭合后爆破，词首要有清晰送气。",
    "b": "双唇闭合后释放并振动声带，不要读得太轻。",
    "t": "舌尖抵上齿龈后释放，词首要清晰送气。",
    "d": "舌尖抵上齿龈后释放并振动声带。",
    "k": "舌后部抵软腭后释放，词首要清晰送气。",
    "g": "舌后部抵软腭后释放并振动声带。",
    "s": "舌尖接近齿龈形成细窄气流，不要读成 /θ/。",
    "z": "保持 /s/ 的口型并振动声带。",
    "f": "上齿轻触下唇送气，不要读成 /h/。",
    "h": "从喉部轻轻送气，口腔不要有明显摩擦阻塞。",
    "m": "双唇闭合，声音从鼻腔出。",
    "n": "舌尖抵上齿龈，声音从鼻腔出。",
  };

  return adviceMap[normalized] ?? "放慢这个音素，先单独练准口型和舌位，再放回单词中连读。";
}

function getWeakPhonemes(word: AzureWordResult) {
  return (
    word.phonemes?.filter(
      (phoneme) =>
        phoneme.accuracyScore !== null && phoneme.accuracyScore < 80,
    ) ?? []
  );
}

function formatDateTime(value: string | null) {
  if (!value) return "";

  return new Date(value).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function subscribeQuestionOrder(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function getQuestionOrderSnapshot() {
  return sessionStorage.getItem("ra-question-order") ?? "[]";
}

function getServerQuestionOrderSnapshot() {
  return "[]";
}

export default function RaDetailClient({ question }: Props) {
  const router = useRouter();
  const questionOrderSnapshot = useSyncExternalStore(
    subscribeQuestionOrder,
    getQuestionOrderSnapshot,
    getServerQuestionOrderSnapshot,
  );
  const questionNav = useMemo(() => {
    let ids: string[] = [];

    try {
      ids = JSON.parse(questionOrderSnapshot);
    } catch {
      ids = [];
    }

    const currentIndex = ids.findIndex((qId) => qId === question.id);

    if (currentIndex === -1) {
      return {
        questionNumber: 0,
        prevQuestionId: null as string | null,
        nextQuestionId: null as string | null,
      };
    }

    return {
      questionNumber: currentIndex + 1,
      prevQuestionId: currentIndex > 0 ? ids[currentIndex - 1] : null,
      nextQuestionId:
        currentIndex < ids.length - 1 ? ids[currentIndex + 1] : null,
    };
  }, [question.id, questionOrderSnapshot]);
  const [practices, setPractices] = useState<UserPractice[]>([]);
  const [practicesLoading, setPracticesLoading] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [expandedPracticeIds, setExpandedPracticeIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [scoreResult, setScoreResult] = useState<RAScoreResult | null>(null);
  const [selectedWord, setSelectedWord] = useState<AzureWordResult | null>(null);
  const scoredTextTokens = useMemo(
    () =>
      scoreResult?.azure
        ? buildScoredTextTokens(question.question_text, scoreResult.azure.words)
        : [],
    [question.question_text, scoreResult],
  );

  const loadPractices = useCallback(
    async ({ showLoading = true }: { showLoading?: boolean } = {}) => {
      if (showLoading) {
        setPracticesLoading(true);
      }

      try {
        const res = await fetch(`/api/pte/ra/recordings?questionId=${question.id}`);
        const json = await res.json();

        if (!res.ok || !json.ok) {
          throw new Error(json.message || "加载历史录音失败");
        }

        setPractices(json.practices ?? json.recordings ?? []);
      } catch (error) {
        console.error(error);
      } finally {
        if (showLoading) {
          setPracticesLoading(false);
        }
      }
    },
    [question.id],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadPractices();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadPractices]);

  const togglePractice = (practiceId: string) => {
    setExpandedPracticeIds((prev) => {
      const next = new Set(prev);

      if (next.has(practiceId)) {
        next.delete(practiceId);
      } else {
        next.add(practiceId);
      }

      return next;
    });
  };

  return (
    <div className="mt-8 space-y-6">
      <div className="round bg-[var(--bg-soft)] px-5 py-5">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Tag tone="theme">RA</Tag>
          {questionNav.questionNumber > 0 ? (
            <Tag tone="green">第 {questionNav.questionNumber} 题</Tag>
          ) : null}
          <Tag tone="yellow">{getWordCount(question.question_text)} Words</Tag>
        </div>

        <div className="text-[18px] leading-9 text-[var(--text)]">
          <DictionaryText text={question.question_text} />
        </div>

        {question.tags?.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {question.tags.map((tag) => (
              <Tag key={tag} tone="neutral">
                {tag}
              </Tag>
            ))}
          </div>
        ) : null}
      </div>

      <div className="mx-auto w-full max-w-[50%] space-y-6 max-lg:max-w-[72%] max-sm:max-w-full">
        <RecordingPanel
          questionId={question.id}
          type="RA"
          preparationDuration={40}
          maxDuration={40}
          autoStart
          uploadUrl="/api/pte/ra/submit"
          uploadFormat="wav"
          onUploadSuccess={(_newRecording, response) => {
            const aiFeedback = response?.aiFeedback as RAScoreResult | undefined;
            if (aiFeedback) {
              setScoreResult(aiFeedback);
            }

            setHistoryOpen(true);
            void loadPractices({ showLoading: false });
            router.refresh();
          }}
        />

        {scoreResult ? (
          <Card>
            <CardContent className="space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`rounded px-4 py-1.5 text-sm font-semibold ${
                    scoreResult.overallScore >= 65
                      ? "bg-[var(--success-soft)] text-[var(--success)]"
                      : "bg-[var(--danger-soft)] text-[var(--danger)]"
                  }`}
                >
                  {scoreResult.overallScore >= 65
                    ? "Good"
                    : "Needs Improvement"}
                </span>

                <span className="rounded border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-1.5 text-sm font-semibold text-[var(--text)]">
                  Score: {scoreResult.overallScore} / 90
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ["Content", scoreResult.contentScore],
                  ["Fluency", scoreResult.fluencyScore],
                  ["Pronunciation", scoreResult.pronunciationScore],
                ].map(([label, score]) => (
                  <div
                    key={label}
                    className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-soft)] p-4"
                  >
                    <div className="text-xs font-semibold uppercase tracking-wide text-[var(--text-soft)]">
                      {label}
                    </div>
                    <div className="mt-2 text-2xl font-black text-[var(--primary)]">
                      {score}
                    </div>
                  </div>
                ))}
              </div>

              {scoreResult.azure ? (
                <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-soft)] p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-[var(--text)]">
                      Azure 发音细节
                    </h3>
                    <span className="text-xs font-medium text-[var(--text-soft)]">
                      原始分 0-100，PTE 展示分已换算到 0-90
                    </span>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-4">
                    {[
                      ["PronScore", scoreResult.azure.pronunciationScore],
                      ["Accuracy", scoreResult.azure.accuracyScore],
                      ["Completeness", scoreResult.azure.completenessScore],
                      ["Azure Fluency", scoreResult.azure.fluencyScore],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="rounded border border-[var(--border)] bg-[var(--card)] px-3 py-2"
                      >
                        <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-soft)]">
                          {label}
                        </div>
                        <div className="mt-1 text-lg font-black text-[var(--primary)]">
                          {value ?? "-"}
                        </div>
                      </div>
                    ))}
                  </div>

                  {scoreResult.azure.words.length ? (
                    <div className="mt-4">
                      <div className="mb-3 flex flex-wrap items-center gap-3 text-xs font-medium text-[var(--text-soft)]">
                        <span>原文逐词发音分</span>
                        <span className="inline-flex items-center gap-1">
                          <span className="h-2.5 w-2.5 rounded-full bg-[var(--success)]" />
                          好
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <span className="h-2.5 w-2.5 rounded-full bg-[var(--warning)]" />
                          需注意
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <span className="h-2.5 w-2.5 rounded-full bg-[var(--danger)]" />
                          读错
                        </span>
                      </div>

                      <div className="rounded border border-[var(--border)] bg-[var(--card)] p-3">
                        <div className="flex flex-wrap items-end gap-x-1.5 gap-y-3">
                          {scoredTextTokens.map((token) => {
                            if (token.type === "punctuation") {
                              return (
                                <span
                                  key={token.id}
                                  className="mb-5 text-lg font-semibold text-[var(--text-soft)]"
                                >
                                  {token.text}
                                </span>
                              );
                            }

                            const word = token.word;
                            const tone = getWordTone(word);
                            const canOpen = tone === "warning" || tone === "bad";

                            return (
                              <button
                                key={token.id}
                                type="button"
                                disabled={!canOpen}
                                onClick={() => {
                                  if (canOpen && word) {
                                    setSelectedWord(word);
                                  }
                                }}
                                className={`flex min-h-[58px] min-w-[54px] flex-col items-center justify-center rounded border px-2 py-1.5 text-center transition ${getWordButtonClass(word)} ${canOpen ? "cursor-pointer hover:shadow-[var(--shadow-sm)]" : "cursor-default"}`}
                              >
                                <span className="text-[13px] font-semibold leading-tight">
                                  {token.text}
                                </span>
                                <span className="mt-1 text-[11px] font-black">
                                  {word?.accuracyScore !== null &&
                                  word?.accuracyScore !== undefined
                                    ? Math.round(word.accuracyScore)
                                    : "-"}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div>
                <h3 className="text-sm font-semibold text-[var(--text)]">
                  AI 反馈
                </h3>
                <p className="mt-2 text-sm leading-7 text-[var(--text-soft)]">
                  {scoreResult.feedback}
                </p>
              </div>

              {scoreResult.suggestions.length ? (
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text)]">
                    提升建议
                  </h3>
                  <ul className="mt-2 space-y-2 text-sm leading-7 text-[var(--text-soft)]">
                    {scoreResult.suggestions.map((suggestion) => (
                      <li key={suggestion} className="flex gap-2">
                        <span className="text-[var(--primary)]">•</span>
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div>
                <h3 className="text-sm font-semibold text-[var(--text)]">
                  录音转写
                </h3>
                <p className="mt-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-soft)] p-4 text-sm leading-7 text-[var(--text)]">
                  {scoreResult.transcript}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {selectedWord ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-6 backdrop-blur-sm">
            <div className="max-h-[86vh] w-full max-w-lg overflow-y-auto overscroll-contain rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-lg)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-[var(--text-soft)]">
                    音素纠正
                  </div>
                  <h3 className="mt-1 text-2xl font-black text-[var(--text)]">
                    {selectedWord.word}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedWord(null)}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-soft)] text-[var(--text-soft)] transition hover:text-[var(--text)]"
                  aria-label="关闭"
                >
                  ×
                </button>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <div className="rounded border border-[var(--border)] bg-[var(--bg-soft)] p-3">
                  <div className="text-xs font-semibold text-[var(--text-soft)]">
                    Word Accuracy
                  </div>
                  <div className="mt-1 text-xl font-black text-[var(--primary)]">
                    {selectedWord.accuracyScore !== null
                      ? Math.round(selectedWord.accuracyScore)
                      : "-"}
                  </div>
                </div>
                <div className="rounded border border-[var(--border)] bg-[var(--bg-soft)] p-3">
                  <div className="text-xs font-semibold text-[var(--text-soft)]">
                    Error Type
                  </div>
                  <div className="mt-1 text-xl font-black text-[var(--danger)]">
                    {getErrorTypeLabel(selectedWord.errorType)}
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {getWeakPhonemes(selectedWord).length ? (
                  getWeakPhonemes(selectedWord).map((phoneme, index) => (
                    <div
                      key={`${selectedWord.word}-${phoneme.phoneme}-${index}`}
                      className="rounded border border-[var(--warning)]/35 bg-[var(--warning-soft)] p-3"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded bg-[var(--card)] px-2 py-1 text-lg font-black text-[var(--warning)]">
                          /{phoneme.phoneme}/
                        </span>
                        <span className="text-sm font-semibold text-[var(--warning)]">
                          音素分 {Math.round(phoneme.accuracyScore ?? 0)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-7 text-[var(--text)]">
                        {getPhonemeAdvice(phoneme.phoneme)}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded border border-[var(--border)] bg-[var(--bg-soft)] p-3 text-sm leading-7 text-[var(--text-soft)]">
                    Azure 标记这个词需要注意，但本次没有返回低分音素。
                    请先慢读这个词，确认重音、元音长度和结尾辅音是否完整。
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}

        <Card>
          <CardHeader>
            <div>
              <CardTitle>历史练习</CardTitle>
              <CardDescription>展开后查看录音、AI 分数和反馈</CardDescription>
            </div>

            <button
              type="button"
              onClick={() => setHistoryOpen((open) => !open)}
              className="rounded border border-[var(--border)] bg-[var(--bg-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--text-soft)] transition hover:text-[var(--text)]"
            >
              {historyOpen ? "收起" : `展开 · ${practices.length} 条`}
            </button>
          </CardHeader>

          {historyOpen ? (
            <CardContent>
              {practicesLoading ? (
                <p className="text-sm text-[var(--text-soft)]">
                  正在加载历史练习...
                </p>
              ) : practices.length === 0 ? (
                <p className="text-sm text-[var(--text-soft)]">暂无历史练习</p>
              ) : (
                <div className="space-y-3">
                  {practices.map((practice, index) => {
                    const expanded = expandedPracticeIds.has(practice.id);
                    const feedback =
                      practice.feedback_json?.feedback ??
                      practice.feedback_json?.raw?.feedback ??
                      "";
                    const suggestions =
                      practice.feedback_json?.suggestions ??
                      practice.feedback_json?.raw?.suggestions ??
                      [];

                    return (
                      <div
                        key={practice.id}
                        className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-soft)]"
                      >
                        <button
                          type="button"
                          onClick={() => togglePractice(practice.id)}
                          className="flex w-full flex-wrap items-center justify-between gap-3 px-4 py-3 text-left"
                        >
                          <div>
                            <div className="text-sm font-semibold text-[var(--text)]">
                              练习 {index + 1}
                            </div>
                            <div className="mt-1 text-xs text-[var(--text-soft)]">
                              {formatDateTime(practice.created_at)}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded bg-[var(--card)] px-3 py-1 text-xs font-semibold text-[var(--primary)]">
                              {practice.overall_score ?? "-"} / 90
                            </span>
                            <span className="text-xs font-semibold text-[var(--text-soft)]">
                              {expanded ? "收起" : "展开"}
                            </span>
                          </div>
                        </button>

                        {expanded ? (
                          <div className="space-y-4 border-t border-[var(--border)] px-4 py-4">
                            <div className="mx-auto w-full max-w-[88%] max-sm:max-w-full">
                              <AudioPlayer
                                url={practice.audio_url}
                                size="compact"
                              />
                            </div>

                            <div className="grid gap-2 sm:grid-cols-4">
                              {[
                                ["Overall", practice.overall_score],
                                ["Content", practice.content_score],
                                ["Fluency", practice.fluency_score],
                                ["Pronunciation", practice.pronunciation_score],
                              ].map(([label, value]) => (
                                <div
                                  key={label}
                                  className="rounded border border-[var(--border)] bg-[var(--card)] px-3 py-2"
                                >
                                  <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-soft)]">
                                    {label}
                                  </div>
                                  <div className="mt-1 text-lg font-black text-[var(--primary)]">
                                    {value ?? "-"}
                                  </div>
                                </div>
                              ))}
                            </div>

                            <div className="grid gap-2 sm:grid-cols-2">
                              <div className="rounded border border-[var(--border)] bg-[var(--card)] px-3 py-2">
                                <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-soft)]">
                                  Accuracy
                                </div>
                                <div className="mt-1 text-lg font-black text-[var(--primary)]">
                                  {practice.accuracy_score ?? "-"}
                                </div>
                              </div>
                              <div className="rounded border border-[var(--border)] bg-[var(--card)] px-3 py-2">
                                <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-soft)]">
                                  Completeness
                                </div>
                                <div className="mt-1 text-lg font-black text-[var(--primary)]">
                                  {practice.completeness_score ?? "-"}
                                </div>
                              </div>
                            </div>

                            {feedback ? (
                              <div>
                                <div className="text-sm font-semibold text-[var(--text)]">
                                  AI 反馈
                                </div>
                                <p className="mt-2 text-sm leading-7 text-[var(--text-soft)]">
                                  {feedback}
                                </p>
                              </div>
                            ) : null}

                            {suggestions.length ? (
                              <div>
                                <div className="text-sm font-semibold text-[var(--text)]">
                                  提升建议
                                </div>
                                <ul className="mt-2 space-y-2 text-sm leading-7 text-[var(--text-soft)]">
                                  {suggestions.map((suggestion) => (
                                    <li key={suggestion} className="flex gap-2">
                                      <span className="text-[var(--primary)]">
                                        •
                                      </span>
                                      <span>{suggestion}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ) : null}

                            {practice.transcript ? (
                              <div>
                                <div className="text-sm font-semibold text-[var(--text)]">
                                  录音转写
                                </div>
                                <p className="mt-2 rounded border border-[var(--border)] bg-[var(--card)] p-3 text-sm leading-7 text-[var(--text)]">
                                  {practice.transcript}
                                </p>
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          ) : null}
        </Card>
      </div>

      <div className="mt-8 flex items-center justify-between">
        {questionNav.prevQuestionId ? (
          <Link
            href={`/pte/speaking/ra/${questionNav.prevQuestionId}`}
            className="inline-flex items-center gap-2 rounded border border-[var(--border)] bg-[var(--card)] px-3 py-3 text-sm font-semibold text-[var(--text-soft)] transition hover:border-[var(--theme)]/30 hover:text-[var(--theme)]"
          >
            <div className="h-5 w-5 text-[var(--primary)]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M14.7 5.3a1 1 0 0 1 0 1.4L10.41 11H20a1 1 0 1 1 0 2h-9.59l4.3 4.3a1 1 0 0 1-1.42 1.4l-6-6a1 1 0 0 1 0-1.4l6-6a1 1 0 0 1 1.41 0z" />
              </svg>
            </div>
            <span>上一题</span>
          </Link>
        ) : (
          <div />
        )}

        {questionNav.nextQuestionId ? (
          <Link
            href={`/pte/speaking/ra/${questionNav.nextQuestionId}`}
            className="inline-flex items-center gap-2 rounded bg-[var(--theme)] px-3 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            <span>下一题</span>
            <div className="h-5 w-5 text-white">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M9.3 18.7a1 1 0 0 1 0-1.4L13.59 13H4a1 1 0 1 1 0-2h9.59L9.3 6.7a1 1 0 1 1 1.42-1.4l6 6a1 1 0 0 1 0 1.4l-6 6a1 1 0 0 1-1.41 0z" />
              </svg>
            </div>
          </Link>
        ) : null}
      </div>
    </div>
  );
}
