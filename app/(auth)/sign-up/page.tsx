import SignupForm from "@/components/auth/signup-form";

export default function SignUpPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="mb-6 text-3xl font-bold">Sign up</h1>
      <SignupForm />
    </main>
  );
}