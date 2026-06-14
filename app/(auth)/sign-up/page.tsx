import { Suspense } from "react";
import SignupForm from "@/components/auth/signup-form";

function SignUpFallback() {
  return (
    <div className="min-h-screen bg-transparent px-4 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
        <div className="w-full max-w-105 rounded border border-(--border) bg-(--card-soft-bg) p-8 shadow-[0_10px_30px_rgba(0,0,0,0.06)] sm:p-10">
          <p className="text-sm text-(--muted)">加载中...</p>
        </div>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12 bg-transparent">
      {/* <h1 className="mb-6 text-3xl font-bold">Sign up</h1> */}
      <Suspense fallback={<SignUpFallback />}>
        <SignupForm />
      </Suspense>
    </main>
  );
}
