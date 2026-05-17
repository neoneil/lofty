import { Suspense } from "react";
import LoginForm from "@/components/auth/login-form";

function LoginFallback() {
  return (
    <div className="min-h-screen bg-transparent px-4 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
        <div className="w-full max-w-105 rounded border border-(--border) bg-(--card-soft-bg) p-8 shadow-[0_10px_30px_rgba(0,0,0,0.06)] sm:p-10">
          <p className="text-sm text-(--muted)">Loading...</p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="mx-auto max-w-4xl bg-transparent px-6 py-12">
      <Suspense fallback={<LoginFallback />}>
        <LoginForm />
      </Suspense>
    </main>
  );
}

// import LoginForm from "@/components/auth/login-form";

// export default function LoginPage() {
//   return (
//     <main className="mx-auto max-w-4xl px-6 py-12 bg-transparent">
//       {/* <h1 className="mb-6 text-3xl font-bold">Login</h1> */}
//       <LoginForm />
//     </main>
//   );
// }