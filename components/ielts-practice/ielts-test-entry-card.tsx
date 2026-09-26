"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LoaderCircle } from "lucide-react";

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
  const [progress, setProgress] = useState(0);
  const moduleLabel = MODULE_LABEL_BY_MODULE[moduleType];

  useEffect(() => {
    if (!entering) return;
    const steps = [
      window.setTimeout(() => setProgress(42), 250),
      window.setTimeout(() => setProgress(68), 750),
      window.setTimeout(() => setProgress(84), 1500),
      window.setTimeout(() => setProgress(93), 3000),
    ];
    return () => steps.forEach(window.clearTimeout);
  }, [entering]);

  async function confirmEntry() {
    setProgress(16);
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
        setEntering(false);
        return;
      }

      setProgress(76);
      router.push(href);
    } catch {
      window.alert("进入 Test 失败，请检查网络后重试。");
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
          <Card className="relative overflow-hidden rounded-[var(--radius-lg)] transition duration-300 group-hover:-translate-y-1 group-hover:border-[var(--primary)]/45 group-hover:shadow-[var(--shadow-lg)]">
            <CardContent className="p-5">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary-soft)] text-lg font-bold text-[var(--primary)]">{testNumber}</div>
              <h2 className="text-lg font-semibold text-[var(--text)]">Test {testNumber}</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">{title}</p>
              <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary)]">{entering ? <><LoaderCircle size={16} className="animate-spin" />正在准备题目</> : <>进入机考 <ArrowRight size={16} className="transition group-hover:translate-x-1" /></>}</div>
            </CardContent>
            {entering ? <div className="absolute inset-x-0 bottom-0 h-1.5 bg-[var(--primary-soft)]"><div className="h-full bg-[var(--primary)] transition-[width] duration-500 ease-out" style={{ width: `${progress}%` }} /></div> : null}
          </Card>
        </button>
      )}
    </AiUsageConfirmDialog>
  );
}
