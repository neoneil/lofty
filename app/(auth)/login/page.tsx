import LoginForm from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="mb-6 text-3xl font-bold">Login</h1>
      <LoginForm />
    </main>
  );
}