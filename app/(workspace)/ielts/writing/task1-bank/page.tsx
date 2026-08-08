import Container from "@/components/site/container";
import Task1BankClient from "@/components/ielts-writing/task1-bank-client";
import { getAdminAccess } from "@/lib/auth/admin-access";
import { requireUser } from "@/lib/auth/require-user";
import { getIeltsWritingTask1Bank } from "@/lib/ielts/writing-task1-bank";

export default async function IeltsWritingTask1BankPage() {
  const userContext = await requireUser("/ielts/writing/task1-bank");
  const isAdmin = await getAdminAccess(userContext);
  const bank = await getIeltsWritingTask1Bank();
  const books = new Set(bank.items.map((item) => item.bookNumber));

  return (
    <main className="py-10 text-[var(--text)] sm:py-14 lg:py-16">
      <Container>
        <section className="mb-8 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)]">
          <div className="grid gap-0 lg:grid-cols-[1fr_320px]">
            <div className="p-6 sm:p-8">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-faint)]">IELTS WRITING TASK 1</p>
              <h1 className="text-2xl font-bold tracking-tight text-[var(--primary)] sm:text-4xl">{bank.title}</h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--text-soft)] sm:text-base">{bank.subtitle}</p>
            </div>
            <div className="grid grid-cols-3 border-t border-[var(--border)] bg-[var(--bg-soft)] lg:grid-cols-1 lg:border-l lg:border-t-0">
              <div className="p-4 sm:p-5">
                <p className="text-xs font-semibold text-[var(--text-faint)]">题目数量</p>
                <p className="mt-2 text-2xl font-bold text-[var(--text)]">{bank.items.length}</p>
              </div>
              <div className="border-l border-[var(--border)] p-4 sm:p-5 lg:border-l-0 lg:border-t">
                <p className="text-xs font-semibold text-[var(--text-faint)]">剑桥范围</p>
                <p className="mt-2 text-2xl font-bold text-[var(--text)]">5-21</p>
              </div>
              <div className="border-l border-[var(--border)] p-4 sm:p-5 lg:border-l-0 lg:border-t">
                <p className="text-xs font-semibold text-[var(--text-faint)]">书本数量</p>
                <p className="mt-2 text-2xl font-bold text-[var(--text)]">{books.size}</p>
              </div>
            </div>
          </div>
        </section>

        <Task1BankClient items={bank.items} isAdmin={isAdmin} />
      </Container>
    </main>
  );
}
