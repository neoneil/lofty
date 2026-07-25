"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

import AiUsageConfirmDialog from "@/components/ai/ai-usage-confirm-dialog";
import { Card, CardContent } from "@/components/ui-v2/card";

type IeltsTestModule = "listening" | "reading";

type Props = {
  moduleType: IeltsTestModule;
  bookNumber: number;
  testNumber: number;
  title: string;
  href: string;
};

const FEATURE_BY_MODULE: Record<IeltsTestModule, string> = {
  listening: "ielts_listening_test",
  reading: "ielts_reading_test",
};

const MODULE_LABEL_BY_MODULE: Record<IeltsTestModule, string> = {
  listening: "听力",
  reading: "阅读",
};

export function IeltsTestEntryCard({ moduleType, bookNumber, testNumber, title, href }: Props) {
  const router = useRouter();
  const [entering, setEntering] = useState(false);
  const moduleLabel = MODULE_LABEL_BY_MODULE[moduleType];

  async function confirmEntry() {
    setEntering(true);

    try {
      const response = await fetch("/api/ielts/test-entry/usage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleType, bookNumber, testNumber }),
      });
      const data = (await response.json()) as { ok?: boolean; message?: string };

      if (!response.ok || !data.ok) {
        window.alert(data.message || "AI 券不足，暂时无法进入这套 test。");
        return;
      }

      router.push(href);
    } finally {
      setEntering(false);
    }
  }

  return (
    <AiUsageConfirmDialog
      feature={FEATURE_BY_MODULE[moduleType]}
      title={`确认进入雅思${moduleLabel} Test`}
      description={`进入 Cambridge IELTS ${bookNumber} ${moduleLabel} Test ${testNumber} 会消耗 1 张 AI 券；同一天重复进入同一套 test 不会重复扣。`}
      onConfirm={confirmEntry}
    >
      {(openDialog) => (
        <button type="button" disabled={entering} onClick={openDialog} className="group block w-full text-left disabled:pointer-events-none disabled:opacity-70">
          <Card className="rounded-[var(--radius-lg)] transition duration-300 group-hover:-translate-y-1 group-hover:border-[var(--primary)]/45 group-hover:shadow-[var(--shadow-lg)]">
            <CardContent className="p-5">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary-soft)] text-lg font-bold text-[var(--primary)]">{testNumber}</div>
              <h2 className="text-lg font-semibold text-[var(--text)]">Test {testNumber}</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">{title}</p>
              <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary)]">{entering ? "正在进入..." : "进入机考"} <ArrowRight size={16} className="transition group-hover:translate-x-1" /></div>
            </CardContent>
          </Card>
        </button>
      )}
    </AiUsageConfirmDialog>
  );
}
