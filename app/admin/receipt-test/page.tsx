import Link from 'next/link';
import type { Metadata } from 'next';

import { ReceiptPreview } from '@/components/billing/receipt-preview';
import { requireAdmin } from '@/lib/auth/require-admin';

export const metadata: Metadata = {
  title: 'Receipt Test | Admin',
};

export default async function AdminReceiptTestPage() {
  await requireAdmin('/admin/receipt-test');

  return (
    <main className='min-h-screen bg-[var(--bg)] px-4 py-8 text-[var(--text)] sm:px-6 lg:px-8'>
      <section className='mx-auto w-full max-w-6xl space-y-5'>
        <div className='rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-sm)] sm:p-6'>
          <Link href='/admin' className='inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary)] hover:underline'>
            返回后台
          </Link>
          <div className='mt-4'>
            <p className='text-sm font-semibold text-[var(--text-soft)]'>Admin Preview</p>
            <h1 className='mt-2 text-2xl font-bold tracking-tight text-[var(--text)] sm:text-3xl'>Receipt Test</h1>
            <p className='mt-2 max-w-3xl text-sm leading-6 text-[var(--text-soft)]'>
              这里只是收据 PDF 的视觉打样，不会发送邮件，也不会改 Stripe / webhook / 数据库逻辑。
            </p>
          </div>
        </div>

        <ReceiptPreview variant='tuition' />
      </section>
    </main>
  );
}
