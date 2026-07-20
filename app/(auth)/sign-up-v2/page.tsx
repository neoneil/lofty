import { Suspense } from "react";
import AuthV2Form from "@/components/auth/auth-v2-form";

function SignUpV2Fallback() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-[var(--bg)] px-4 py-6 sm:px-6 lg:min-h-[calc(100vh-4rem)] lg:py-10">
      <div className="mx-auto grid w-full max-w-6xl gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(380px,0.95fr)]">
        <div className="min-h-80 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-soft)] shadow-[var(--shadow-md)]" />
        <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-8 shadow-[var(--shadow-lg)]">
          <p className="text-sm text-[var(--text-soft)]">加载中...</p>
        </div>
      </div>
    </div>
  );
}

export default function SignUpV2Page() {
  return (
    <Suspense fallback={<SignUpV2Fallback />}>
      <AuthV2Form mode="signup" />
    </Suspense>
  );
}
