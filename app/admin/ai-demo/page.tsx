import { AiDemoClient } from "@/components/admin/ai-demo/ai-demo-client";
import { Badge } from "@/components/ui-v2/badge";
import { Card, CardContent } from "@/components/ui-v2/card";
import { AI_DEMO_VOICES } from "@/lib/ai-demo/voices";
import { requireAdminOrEditor } from "@/lib/auth/require-admin";

export default async function AiDemoPage() {
  await requireAdminOrEditor("/admin/ai-demo");

  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 py-8 text-[var(--text)] sm:px-6 lg:px-8">
      <section className="mx-auto max-w-6xl space-y-6">
        <Card className="overflow-hidden rounded-[var(--radius-lg)]">
          <CardContent className="p-5 sm:p-7">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <Badge>AI Demo</Badge>
                <h1 className="mt-4 text-2xl font-bold tracking-tight text-[var(--text)] sm:text-3xl">OpenAI 人声试听</h1>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--text-soft)]">点击声音名称试听 R2 中的 AI 语音样本，后续可以直接按模型名接入听力、口语或课程内容。</p>
              </div>
              <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-3 text-sm text-[var(--text-soft)]">
                <span className="font-semibold text-[var(--text)]">{AI_DEMO_VOICES.length}</span> 个声音样本 · R2 / AI_demo
              </div>
            </div>
          </CardContent>
        </Card>

        <AiDemoClient />
      </section>
    </main>
  );
}
