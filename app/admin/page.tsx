
import { AdminModuleSwitcher } from "@/components/admin/admin-module-switcher";
import { requireAdminOrEditor } from "@/lib/auth/require-admin";

export default async function AdminPage() {
  const { profile, user } = await requireAdminOrEditor("/admin");

  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 py-10 text-[var(--text)] sm:px-6 lg:px-8">
      <section className="mx-auto max-w-6xl">
        <div className="mb-8 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-sm)] backdrop-blur-xl sm:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-3 text-sm font-semibold text-[var(--text-soft)]">
                Lofty Education Admin
              </p>

              <h1 className="text-2xl font-bold tracking-tight text-[var(--text)] md:text-3xl">
                后台管理
              </h1>
            </div>

            <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] px-5 py-4 text-sm text-[var(--text-soft)]">
              <p className="font-semibold text-[var(--text)]">{user.email}</p>
              <p className="mt-1">
                Role:{" "}
                <span className="font-semibold capitalize text-[var(--primary)]">
                  {profile.role}
                </span>
              </p>
            </div>
          </div>
        </div>

        <AdminModuleSwitcher />
      </section>
    </main>
  );
}
