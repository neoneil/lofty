import { notFound } from "next/navigation";
import Link from "next/link";

import { IeltsMockExamClient } from "@/components/mock-test/ielts-mock-exam-client";
import { requireUser } from "@/lib/auth/require-user";
import { isMockTestQuotaError } from "@/lib/mock-test/access";
import { isAllowedIeltsMockTest } from "@/lib/mock-test/ielts";
import { loadIeltsMockAttemptPayload } from "@/lib/mock-test/server";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ test?: string }>;
};

export default async function IeltsMockTestPage({ searchParams }: Props) {
  const { test } = await searchParams;
  const testNumber = Number(test ?? "1");
  if (!isAllowedIeltsMockTest(testNumber)) notFound();

  const { supabase, user } = await requireUser(`/mock-test/ielts?test=${testNumber}`);
  let exam: Awaited<ReturnType<typeof loadIeltsMockAttemptPayload>> | null = null;
  let quotaMessage: string | null = null;

  try {
    exam = await loadIeltsMockAttemptPayload(supabase, user.id, testNumber);
  } catch (error) {
    if (!isMockTestQuotaError(error)) throw error;
    quotaMessage = error.message;
  }

  if (quotaMessage) {
    return (
      <main className="mx-auto flex min-h-[60vh] w-full max-w-3xl items-center justify-center p-5 text-[var(--text)]">
        <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-6 text-center shadow-[var(--shadow-sm)]">
          <h1 className="text-xl font-bold">模考次数已用完</h1>
          <p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">{quotaMessage}</p>
          <Link href="/mock-test" className="mt-5 inline-flex rounded-[var(--radius-sm)] bg-[var(--primary)] px-4 py-2 text-sm font-bold text-white">
            返回模考中心
          </Link>
        </section>
      </main>
    );
  }

  if (!exam) throw new Error("IELTS mock exam payload was not loaded.");

  return <IeltsMockExamClient initialExam={exam} />;
}
