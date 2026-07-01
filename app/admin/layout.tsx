import Navbar from "@/components/site/navbar";
import { requireAdminOrEditor } from "@/lib/auth/require-admin";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdminOrEditor();

  return (
    <div className="relative z-10 min-h-screen bg-[var(--bg)] pt-14 lg:pt-16">
      <Navbar />
      {children}
    </div>
  );
}
