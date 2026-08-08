"use client";

import { useRouter } from "next/navigation";

import { PteMockExamExperience } from "@/components/mock-assessment/pte-mock-exam";

export function PteMockTestPageClient() {
  const router = useRouter();
  return <PteMockExamExperience onExit={() => router.push("/mock-test")} />;
}
