import Link from 'next/link';

export default function CoursesPage() {
  return (
    <main className='min-h-screen bg-[var(--bg)] px-5 pt-28 text-[var(--text)]'>
      <section className='mx-auto max-w-3xl rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-8 text-center shadow-[var(--shadow-md)] md:p-10'>
        <p className='inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--primary-soft)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--primary)]'>
          Courses
        </p>

        <h1 className='mt-5 text-2xl font-black tracking-tight md:text-3xl'>
          课程中心待开发
        </h1>

        <p className='mx-auto mt-4 max-w-2xl text-sm leading-7 text-[var(--text-soft)]'>
          雅思课程大纲和 PTE 课程大纲已经拆分到课程设置下拉菜单中。
        </p>

        <div className='mt-7 flex flex-col justify-center gap-3 sm:flex-row'>
          <Link
            href='/courses/ielts'
            className='rounded-[var(--radius-sm)] bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition hover:bg-[var(--primary-hover)]'
          >
            雅思课程大纲
          </Link>

          <Link
            href='/courses/pte'
            className='rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--card)] px-6 py-3 text-sm font-semibold text-[var(--text)] transition hover:bg-[var(--bg-soft)]'
          >
            PTE 课程大纲
          </Link>
        </div>
      </section>
    </main>
  );
}
