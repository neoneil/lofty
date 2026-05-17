
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
    question: {
        id: string;
        question_text: string;
    };
     prevQuestionId: string | null;
    nextQuestionId: string | null;
    questionNumber: number;
};

type Token = {
    text: string;
    type: "correct" | "missing" | "extra";
};

type SubmitResult = {
    // score: number;
    correctWords: number;
    totalWords: number;
    isCorrect: boolean;
    tokens: Token[];
};

export default function WfdDetailClient({
    question,   
    prevQuestionId,
    nextQuestionId,
    questionNumber,
}: Props) {
    const [startedAt] = useState(Date.now());
    const [answer, setAnswer] = useState("");

    const [loading, setLoading] = useState(false);

    const [result, setResult] =
        useState<SubmitResult | null>(null);
    const [showAnswer, setShowAnswer] =
        useState(false);
    const router = useRouter();

    const handleSubmit = async () => {
        setLoading(true);

        try {
            const res = await fetch(
                "/api/pte/wfd/submit",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        questionId: question.id,
                        userAnswer: answer,
                        startedAt,
                    }),
                }
            );

            const data = await res.json();

            if (!res.ok) {
                throw new Error(
                    data.message || "提交失败"
                );
            }

            setResult({
                correctWords: data.score || 0,
                totalWords: data.totalWords || 0,
                isCorrect: data.isCorrect,
                tokens: data.tokens || [],
            });
            // AUTO SHOW ANSWER
            if (!showAnswer) {
                setShowAnswer(true);
            }
            router.refresh();

        } catch (error) {
            console.error(error);

            alert(
                error instanceof Error
                    ? error.message
                    : "提交失败"
            );

        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mt-8 space-y-6">
            {/* QUESTION TEXT */}
            <div
                className="
        round
        bg-gray-50
        px-5 py-5
    "
            >
                <div
                    className="
            mb-4
            flex items-center justify-between
        "
                >
                    <button
                        type="button"
                        onClick={() =>
                            setShowAnswer(
                                !showAnswer
                            )
                        }
                        className="btn-primary"
                    >
                        {showAnswer
                            ? "隐藏答案"
                            : "答案"}
                    </button>
                </div>

                <div
                    className={`
            text-[18px]
            leading-9
            text-gray-800

            transition-all
            duration-300

            ${showAnswer
                            ? "blur-0"
                            : "select-none blur-[10px]"
                        }
        `}
                >
                    {question.question_text}
                </div>
            </div>
            {/* RESULT */}
            {result ? (
                <section className="round border border-gray-200 bg-[#faf8f4] p-6 shadow-sm">

                    {/* TOP */}
                    <div className="mb-5 flex flex-wrap items-center gap-3">

                        <span
                            className={`rounded px-4 py-1.5 text-sm font-semibold ${result.isCorrect
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                                }`}
                        >
                            {result.isCorrect
                                ? "Correct"
                                : "Wrong"}
                        </span>

                        <span className="rounded bg-white px-4 py-1.5 text-sm font-semibold text-gray-700 border border-gray-200">
                            Score: {result.correctWords} / {result.totalWords}
                        </span>
                    </div>

                    {/* ANSWER FEEDBACK */}
                    <div>
                        <div className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-gray-500">
                            Feedback
                        </div>

                        <div className="flex flex-wrap gap-2 rounded border border-gray-200 bg-white p-5 leading-8">

                            {result.tokens.map((token, index) => {

                                if (token.type === "correct") {
                                    return (
                                        <span
                                            key={`${token.text}-${index}`}
                                            className="round bg-green-100 px-2 py-1 text-[15px] font-medium text-green-700"
                                        >
                                            {token.text}
                                        </span>
                                    );
                                }

                                if (token.type === "missing") {
                                    return (
                                        <span
                                            key={`${token.text}-${index}`}
                                            className="round bg-red-100 px-2 py-1 text-[15px] font-medium text-red-700 line-through"
                                        >
                                            {token.text}
                                        </span>
                                    );
                                }

                                return (
                                    <span
                                        key={`${token.text}-${index}`}
                                        className="round bg-yellow-100 px-2 py-1 text-[15px] font-medium text-yellow-700"
                                    >
                                        {token.text}
                                    </span>
                                );
                            })}
                        </div>
                    </div>

                    {/* LEGEND */}
                    <div className="mt-5 flex flex-wrap gap-3 text-xs font-medium text-gray-500">

                        <div className="flex items-center gap-2">
                            <span className="h-3 w-3 rounded bg-green-400" />
                            Correct
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="h-3 w-3 rounded bg-red-400" />
                            Missing
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="h-3 w-3 rounded bg-yellow-400" />
                            Extra
                        </div>
                    </div>
                </section>
            ) : null}
            {/* INPUT */}
            <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                    输入你的答案
                </label>

                <textarea
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="请输入你听到的句子..."
                    className="min-h-[180px] w-full round border border-gray-200 bg-white px-5 py-4 text-[17px] leading-8 text-gray-800 shadow-sm outline-none transition focus:border-[var(--theme)]"
                />
            </div>

            {/* SUBMIT */}
            <div className="flex justify-end">
                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="rounded bg-[var(--theme)] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {loading ? "提交中..." : "提交答案"}
                </button>
            </div>
        </div>
    );
}
// "use client";
// import { useRouter } from "next/navigation";
// import { useState } from "react";
// import { createClient } from "@/lib/supabase/client";
// type Props = {
//     question: {
//         id: string;
//         question_text: string;
//     };
// };

// type SubmitResult = {
//     score: number;
//     isCorrect: boolean;
//     missingWords: string[];
//     extraWords: string[];
// };

// function normalizeText(text: string) {
//     return text
//         .toLowerCase()
//         .replace(/[.,!?]/g, "")
//         .trim();
// }

// function calculateResult(
//     answer: string,
//     target: string
// ): SubmitResult {
//     const answerWords = normalizeText(answer).split(/\s+/);
//     const targetWords = normalizeText(target).split(/\s+/);

//     let matched = 0;

//     const missingWords: string[] = [];

//     targetWords.forEach((word) => {
//         if (answerWords.includes(word)) {
//             matched++;
//         } else {
//             missingWords.push(word);
//         }
//     });

//     const extraWords = answerWords.filter(
//         (word) => !targetWords.includes(word)
//     );

//     const score = Math.round(
//         (matched / targetWords.length) * 100
//     );

//     return {
//         score,
//         isCorrect: score >= 90,
//         missingWords,
//         extraWords,
//     };
// }

// export default function WfdDetailClient({
//     question,
// }: Props) {
//     const [answer, setAnswer] = useState("");

//     const [loading, setLoading] = useState(false);

//     const [result, setResult] =
//         useState<SubmitResult | null>(null);
//     const supabase = createClient();
//     const router = useRouter();

//     const handleSubmit = async () => {
//   setLoading(true);

//   try {
//     const res = await fetch(
//       "/api/pte/wfd/submit",
//       {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           questionId: question.id,
//           userAnswer: answer,
//           startedAt: Date.now(),
//         }),
//       }
//     );

//     const data = await res.json();

//     if (!res.ok) {
//       throw new Error(
//         data.message || "提交失败"
//       );
//     }

//     setResult({
//       score:
//         Math.round(
//           (data.score / data.totalWords) * 100
//         ) || 0,

//       isCorrect: data.isCorrect,

//       missingWords:
//         data.tokens
//           ?.filter(
//             (t: any) =>
//               t.type === "missing"
//           )
//           .map((t: any) => t.text) || [],

//       extraWords:
//         data.tokens
//           ?.filter(
//             (t: any) =>
//               t.type === "extra"
//           )
//           .map((t: any) => t.text) || [],
//     });

//     router.refresh();

//   } catch (error) {
//     console.error(error);

//     alert(
//       error instanceof Error
//         ? error.message
//         : "提交失败"
//     );

//   } finally {
//     setLoading(false);
//   }
// };

//     return (
//         <div className="mt-8 space-y-6">

//             {/* Input */}
//             <div>
//                 <label className="mb-2 block text-sm font-semibold text-gray-700">
//                     输入你的答案
//                 </label>

//                 <textarea
//                     value={answer}
//                     onChange={(e) => setAnswer(e.target.value)}
//                     placeholder="请输入你听到的句子..."
//                     className="min-h-[160px] w-full round border border-gray-200 bg-white px-5 py-4 text-[17px] leading-8 text-gray-800 shadow-sm outline-none transition focus:border-[var(--theme)]"
//                 />
//             </div>

//             {/* Submit */}
//             <div className="flex justify-end">
//                 <button
//                     type="button"
//                     onClick={handleSubmit}
//                     disabled={loading}
//                     className="rounded bg-[var(--theme)] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
//                 >
//                     {loading ? "提交中..." : "提交答案"}
//                 </button>
//             </div>

//             {/* Result */}
//             {result ? (
//                 <section className="round border border-gray-200 bg-gray-50 p-5">

//                     <div className="mb-4 flex flex-wrap items-center gap-3">

//                         <span
//                             className={`rounded px-4 py-1 text-sm font-semibold ${result.isCorrect
//                                     ? "bg-green-100 text-green-700"
//                                     : "bg-red-100 text-red-700"
//                                 }`}
//                         >
//                             {result.isCorrect ? "Correct" : "Wrong"}
//                         </span>

//                         <span className="text-sm font-medium text-gray-600">
//                             Score: {result.score}
//                         </span>
//                     </div>

//                     {/* Missing */}
//                     {result.missingWords.length > 0 ? (
//                         <div className="mb-4">
//                             <div className="mb-2 text-sm font-semibold text-gray-700">
//                                 Missing Words
//                             </div>

//                             <div className="flex flex-wrap gap-2">
//                                 {result.missingWords.map((word) => (
//                                     <span
//                                         key={word}
//                                         className="rounded bg-red-100 px-3 py-1 text-sm text-red-700"
//                                     >
//                                         {word}
//                                     </span>
//                                 ))}
//                             </div>
//                         </div>
//                     ) : null}

//                     {/* Extra */}
//                     {result.extraWords.length > 0 ? (
//                         <div>
//                             <div className="mb-2 text-sm font-semibold text-gray-700">
//                                 Extra Words
//                             </div>

//                             <div className="flex flex-wrap gap-2">
//                                 {result.extraWords.map((word) => (
//                                     <span
//                                         key={word}
//                                         className="rounded bg-yellow-100 px-3 py-1 text-sm text-yellow-700"
//                                     >
//                                         {word}
//                                     </span>
//                                 ))}
//                             </div>
//                         </div>
//                     ) : null}
//                 </section>
//             ) : null}
//         </div>
//     );
// }