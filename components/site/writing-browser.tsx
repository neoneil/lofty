

"use client";

import { useMemo, useState } from "react";
import AccordionCard from "@/components/site/accordion-card";

type WritingTopic = {
  id: string;
  year: number;
  month: number;
  day: number;
  question_en: string;
  question_zh: string | null;
  question_type: string | null;
  topic_category: string | null;
  created_at: string;
  updated_at: string;
};

type Props = {
  topics: WritingTopic[];
};

function formatDate(year: number, month: number, day: number) {
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

function formatQuestionType(type: string | null) {
  if (!type) return "general";

  const map: Record<string, string> = {
    agree: "agree / disagree",
    discuss: "discuss both views",
    problem: "problem / solution",
    advantage: "advantages / disadvantages",
    double: "double question",
    mixed: "mixed",
  };

  return map[type] ?? type;
}

export default function WritingBrowser({ topics }: Props) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeType, setActiveType] = useState("All");

  const topicsAfterCategory = useMemo(() => {
    if (activeCategory === "All") return topics;
    return topics.filter(
      (item) => (item.topic_category || "uncategorized") === activeCategory
    );
  }, [topics, activeCategory]);

  const topicsAfterType = useMemo(() => {
    if (activeType === "All") return topics;
    return topics.filter(
      (item) => (item.question_type || "general") === activeType
    );
  }, [topics, activeType]);

  const categoryFilters = useMemo(() => {
    const counts = topicsAfterType.reduce<Record<string, number>>((acc, item) => {
      const key = item.topic_category || "uncategorized";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return [
      { label: "All", count: topicsAfterType.length },
      ...Object.entries(counts)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([label, count]) => ({ label, count })),
    ];
  }, [topicsAfterType]);

  const typeFilters = useMemo(() => {
    const counts = topicsAfterCategory.reduce<Record<string, number>>((acc, item) => {
      const key = item.question_type || "general";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return [
      { label: "All", count: topicsAfterCategory.length },
      ...Object.entries(counts)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([label, count]) => ({ label, count })),
    ];
  }, [topicsAfterCategory]);

  const visibleTopics = useMemo(() => {
    return topics.filter((item) => {
      const categoryOk =
        activeCategory === "All" ||
        (item.topic_category || "uncategorized") === activeCategory;

      const typeOk =
        activeType === "All" ||
        (item.question_type || "general") === activeType;

      return categoryOk && typeOk;
    });
  }, [topics, activeCategory, activeType]);

  const [isExporting, setIsExporting] = useState(false);

  async function downloadPdf(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  }

  async function handleExportWriting() {
    try {
      setIsExporting(true);

      const res = await fetch("/api/ielts/writing/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category: activeCategory,
          questionType: activeType,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Writing PDF 导出失败");
      }

      const blob = await res.blob();

      const safeCategory =
        activeCategory === "All" ? "all-category" : activeCategory;
      const safeType = activeType === "All" ? "all-type" : activeType;

      const filename = `writing-task2-${safeCategory}-${safeType}.pdf`;

      await downloadPdf(blob, filename);
    } catch (error) {
      console.error(error);
      alert("Writing PDF 导出失败");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="space-y-8">
      <section>
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-(--theme)">
              Writing Section
            </p>
            <h2 className="text-2xl font-semibold text-(--theme) sm:text-3xl">
              Task 2 Topics
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div
              className="rounded-full border px-4 py-2 text-sm text-(--theme)"
              style={{ borderColor: "var(--border)" }}
            >
              {visibleTopics.length} topics
            </div>

            <button
              type="button"
              onClick={handleExportWriting}
              disabled={isExporting}
              className="btn-secondary rounded-3xl"
              style={{ borderColor: "var(--border)" }}
            >
              {isExporting ? "Exporting..." : "下载 Writing PDF"}
            </button>
          </div>
        </div>

        <div className="mb-6">
          <p className="mb-3 text-sm font-semibold text-(--theme)">
            Topic Category
          </p>
          <div className="flex flex-wrap gap-3">
            {categoryFilters.map((filter) => {
              const active = activeCategory === filter.label;

              return (
                <button
                  key={filter.label}
                  type="button"
                  onClick={() => setActiveCategory(filter.label)}
                  className={`
                    pill-button
                    ${
                      active
                        ? "bg-(--theme) text-white shadow-md"
                        : "bg-(--bg) text-(--theme) hover:shadow-md"
                    }
                  `}
                  style={{ borderColor: "var(--border)" }}
                >
                  {filter.label} ({filter.count})
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-8">
          <p className="mb-3 text-sm font-semibold text-(--theme)">
            Question Type
          </p>
          <div className="flex flex-wrap gap-3">
            {typeFilters.map((filter) => {
              const active = activeType === filter.label;

              return (
                <button
                  key={filter.label}
                  type="button"
                  onClick={() => setActiveType(filter.label)}
                  className={`
                    pill-button
                    ${
                      active
                        ? "bg-(--theme) text-white shadow-md"
                        : "bg-(--bg) text-(--theme) hover:shadow-md"
                    }
                  `}
                  style={{ borderColor: "var(--border)" }}
                >
                  {filter.label} ({filter.count})
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-5">
          {visibleTopics.map((item) => (
            <AccordionCard
              key={item.id}
              title={item.question_en}
              subtitle={item.topic_category || "writing"}
              badge={formatQuestionType(item.question_type)}
            >
              <div className="space-y-6">
                <div className="flex flex-wrap gap-3">
                  <div
                    className="rounded-full border bg-(--card-soft) px-4 py-2 text-sm text-gray-700"
                    style={{ borderColor: "var(--border)" }}
                  >
                    Date: {formatDate(item.year, item.month, item.day)}
                  </div>

                  {item.topic_category && (
                    <div
                      className="rounded-full border bg-(--card-soft) px-4 py-2 text-sm text-gray-700"
                      style={{ borderColor: "var(--border)" }}
                    >
                      Topic: {item.topic_category}
                    </div>
                  )}

                  {item.question_type && (
                    <div
                      className="rounded-full border bg-(--card-soft) px-4 py-2 text-sm text-gray-700"
                      style={{ borderColor: "var(--border)" }}
                    >
                      Type: {formatQuestionType(item.question_type)}
                    </div>
                  )}
                </div>

                <div
                  className="rounded-2xl border bg-(--card-soft) px-5 py-5"
                  style={{ borderColor: "var(--border)" }}
                >
                  <p className="mb-3 text-sm font-semibold text-(--theme)">
                    Essay Question
                  </p>

                  <p className="text-sm leading-8 text-(--theme) sm:text-base">
                    {item.question_en}
                  </p>
                </div>

                {item.question_zh && item.question_zh.trim() !== "" && (
                  <div
                    className="rounded-2xl border px-5 py-5"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <p className="text-sm leading-8 text-gray-700 sm:text-base">
                      {item.question_zh}
                    </p>
                  </div>
                )}
              </div>
            </AccordionCard>
          ))}
        </div>
      </section>
    </div>
  );
}

// "use client";

// import { useMemo, useState } from "react";
// import AccordionCard from "@/components/site/accordion-card";

// type WritingTopic = {
//     id: string;
//     year: number;
//     month: number;
//     day: number;
//     question_en: string;
//     question_zh: string | null;
//     question_type: string | null;
//     topic_category: string | null;
//     created_at: string;
//     updated_at: string;
// };

// type Props = {
//     topics: WritingTopic[];
// };

// function formatDate(year: number, month: number, day: number) {
//     const mm = String(month).padStart(2, "0");
//     const dd = String(day).padStart(2, "0");
//     return `${year}-${mm}-${dd}`;
// }

// function formatQuestionType(type: string | null) {
//     if (!type) return "general";

//     const map: Record<string, string> = {
//         agree: "agree / disagree",
//         discuss: "discuss both views",
//         problem: "problem / solution",
//         advantage: "advantages / disadvantages",
//         double: "double question",
//         mixed: "mixed",
//     };

//     return map[type] ?? type;
// }

// export default function WritingBrowser({ topics }: Props) {
//     const [activeCategory, setActiveCategory] = useState("All");
//     const [activeType, setActiveType] = useState("All");

//     // 当前 category 条件下，真正可见的数据
//     const topicsAfterCategory = useMemo(() => {
//         if (activeCategory === "All") return topics;
//         return topics.filter(
//             (item) => (item.topic_category || "uncategorized") === activeCategory
//         );
//     }, [topics, activeCategory]);

//     // 当前 type 条件下，真正可见的数据
//     const topicsAfterType = useMemo(() => {
//         if (activeType === "All") return topics;
//         return topics.filter(
//             (item) => (item.question_type || "general") === activeType
//         );
//     }, [topics, activeType]);

//     // category 按钮数量：在当前 type 条件下统计
//     const categoryFilters = useMemo(() => {
//         const counts = topicsAfterType.reduce<Record<string, number>>((acc, item) => {
//             const key = item.topic_category || "uncategorized";
//             acc[key] = (acc[key] || 0) + 1;
//             return acc;
//         }, {});

//         return [
//             { label: "All", count: topicsAfterType.length },
//             ...Object.entries(counts)
//                 .sort((a, b) => a[0].localeCompare(b[0]))
//                 .map(([label, count]) => ({ label, count })),
//         ];
//     }, [topicsAfterType]);

//     // type 按钮数量：在当前 category 条件下统计
//     const typeFilters = useMemo(() => {
//         const counts = topicsAfterCategory.reduce<Record<string, number>>((acc, item) => {
//             const key = item.question_type || "general";
//             acc[key] = (acc[key] || 0) + 1;
//             return acc;
//         }, {});

//         return [
//             { label: "All", count: topicsAfterCategory.length },
//             ...Object.entries(counts)
//                 .sort((a, b) => a[0].localeCompare(b[0]))
//                 .map(([label, count]) => ({ label, count })),
//         ];
//     }, [topicsAfterCategory]);

//     // 最终显示：category + type 同时生效
//     const visibleTopics = useMemo(() => {
//         return topics.filter((item) => {
//             const categoryOk =
//                 activeCategory === "All" ||
//                 (item.topic_category || "uncategorized") === activeCategory;

//             const typeOk =
//                 activeType === "All" ||
//                 (item.question_type || "general") === activeType;

//             return categoryOk && typeOk;
//         });
//     }, [topics, activeCategory, activeType]);

//     return (
//         <div className="space-y-8">
//             <section>
//                 <div className="mb-6 flex items-end justify-between gap-4">
//                     <div>
//                         <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
//                             Writing Section
//                         </p>
//                         <h2 className="text-2xl font-semibold text-black sm:text-3xl">
//                             Task 2 Topics
//                         </h2>
//                     </div>

//                     <div
//                         className="rounded-full border px-4 py-2 text-sm text-gray-600"
//                         style={{ borderColor: "var(--border)" }}
//                     >
//                         {visibleTopics.length} topics
//                     </div>
//                 </div>

//                 <div className="mb-6">
//                     <p className="mb-3 text-sm font-semibold text-black">Topic Category</p>
//                     <div className="flex flex-wrap gap-3">
//                         {categoryFilters.map((filter) => {
//                             const active = activeCategory === filter.label;

//                             return (
//                                 <button
//                                     key={filter.label}
//                                     type="button"
//                                     onClick={() => setActiveCategory(filter.label)}
//                                     className={`
//   pill-button
//   ${active
//                                             ? "bg-black text-white shadow-md"
//                                             : "bg-white text-gray-700 hover:shadow-md"
//                                         }
// `}
//                                     style={{ borderColor: "var(--border)" }}
//                                 >
//                                     {filter.label} ({filter.count})
//                                 </button>
//                             );
//                         })}
//                     </div>
//                 </div>

//                 <div className="mb-8">
//                     <p className="mb-3 text-sm font-semibold text-black">Question Type</p>
//                     <div className="flex flex-wrap gap-3">
//                         {typeFilters.map((filter) => {
//                             const active = activeType === filter.label;

//                             return (
//                                 <button
//                                     key={filter.label}
//                                     type="button"
//                                     onClick={() => setActiveType(filter.label)}
//                                     className={`
//   pill-button
//   ${active
//                                             ? "bg-black text-white shadow-md"
//                                             : "bg-white text-gray-700 hover:shadow-md"
//                                         }
// `}
//                                     style={{ borderColor: "var(--border)" }}
//                                 >
//                                     {filter.label} ({filter.count})
//                                 </button>
//                             );
//                         })}
//                     </div>
//                 </div>

//                 <div className="space-y-5">
//                     {visibleTopics.map((item) => (
//                         <AccordionCard
//                             key={item.id}
//                             title={item.question_en}
//                             subtitle={item.topic_category || "writing"}
//                             badge={formatQuestionType(item.question_type)}
//                         >
//                             <div className="space-y-6">
//                                 <div className="flex flex-wrap gap-3">
//                                     <div
//                                         className="rounded-full border bg-(--card-soft) px-4 py-2 text-sm text-gray-700"
//                                         style={{ borderColor: "var(--border)" }}
//                                     >
//                                         Date: {formatDate(item.year, item.month, item.day)}
//                                     </div>

//                                     {item.topic_category && (
//                                         <div
//                                             className="rounded-full border bg-(--card-soft) px-4 py-2 text-sm text-gray-700"
//                                             style={{ borderColor: "var(--border)" }}
//                                         >
//                                             Topic: {item.topic_category}
//                                         </div>
//                                     )}

//                                     {item.question_type && (
//                                         <div
//                                             className="rounded-full border bg-(--card-soft) px-4 py-2 text-sm text-gray-700"
//                                             style={{ borderColor: "var(--border)" }}
//                                         >
//                                             Type: {formatQuestionType(item.question_type)}
//                                         </div>
//                                     )}
//                                 </div>

//                                 <div
//                                     className="rounded-2xl border bg-(--card-soft) px-5 py-5"
//                                     style={{ borderColor: "var(--border)" }}
//                                 >
//                                     <p className="mb-3 text-sm font-semibold text-black">
//                                         Essay Question
//                                     </p>

//                                     <p className="text-sm leading-8 text-black sm:text-base">
//                                         {item.question_en}
//                                     </p>
//                                 </div>

//                                 {item.question_zh && item.question_zh.trim() !== "" && (
//                                     <div
//                                         className="rounded-2xl border px-5 py-5"
//                                         style={{ borderColor: "var(--border)" }}
//                                     >
//                                         <p className="text-sm leading-8 text-gray-700 sm:text-base">
//                                             {item.question_zh}
//                                         </p>
//                                     </div>
//                                 )}
//                             </div>
//                         </AccordionCard>
//                     ))}
//                 </div>
//             </section>
//         </div>
//     );
// }