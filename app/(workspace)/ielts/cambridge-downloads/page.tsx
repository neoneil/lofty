import { CambridgeIeltsDownloadCenter } from "@/components/ielts-downloads/cambridge-ielts-download-center";
import { getCambridgeIeltsDownloadBooks } from "@/lib/ielts/cambridge-downloads";
import { requireUser } from "@/lib/auth/require-user";

export const dynamic = "force-dynamic";

export default async function CambridgeIeltsDownloadsPage() {
  const { supabase } = await requireUser("/ielts/cambridge-downloads");
  const books = await getCambridgeIeltsDownloadBooks(supabase);

  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 py-6 text-[var(--text)] sm:px-6 sm:py-8 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <CambridgeIeltsDownloadCenter books={books} />
      </section>
    </main>
  );
}
