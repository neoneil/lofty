import type { Metadata } from 'next';

import { AiAccessCheckout } from '@/components/billing/ai-access-checkout';
import { AI_ACCESS_PACKAGES } from '@/lib/billing/ai-access-packages';
import { getServerUser } from '@/lib/auth/server-auth';
import { BRAND_EDUCATION_CN, BRAND_NAME_CN } from '@/lib/brand';

export const metadata: Metadata = {
  title: '成为会员 | Lofty Education',
  description: '购买 Lofty Education IELTS AI 或 PTE AI 学习助手时间包。',
};

type Props = {
  searchParams?: Promise<{ payment?: string; reason?: string }> | { payment?: string; reason?: string };
};

export default async function MembershipPage({ searchParams }: Props) {
  const context = await getServerUser();
  const resolvedSearchParams = searchParams ? await searchParams : null;
  const paymentError = resolvedSearchParams?.payment === 'error';
  const checkoutPackages = AI_ACCESS_PACKAGES.map((item) => ({
    code: item.code,
    days: item.days,
    label: item.label,
    amountAudCents: item.amountAudCents,
    recommended: 'recommended' in item ? item.recommended : false,
  }));

  return (
    <main className='min-h-screen bg-[var(--bg)] px-4 py-10 text-[var(--text)] sm:px-6 lg:px-8 lg:py-14'>
      <section className='mx-auto w-full max-w-6xl space-y-6'>
        <div className='rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-sm)] sm:p-8'>
          <p className='text-sm font-semibold text-[var(--primary)]'>Lofty AI Membership</p>
          <h1 className='mt-3 text-2xl font-bold tracking-tight text-[var(--text)] sm:text-3xl'>开通 AI 学习助手</h1>
          <p className='mt-4 max-w-3xl text-sm leading-7 text-[var(--text-soft)] sm:text-base'>
            {BRAND_NAME_CN} 为 IELTS 与 PTE 学生提供 AI 写作、口语和题型练习辅助。请选择对应考试的 AI 权限；IELTS AI 与 PTE AI 分开计时，购买后只会给对应考试的 AI 功能增加有效期。到期后不会自动续费。
          </p>
          <div className='mt-5 grid gap-3 text-sm text-[var(--text-soft)] md:grid-cols-3'>
            <div className='rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-4'>一次性购买，不自动续费</div>
            <div className='rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-4'>澳洲银行卡 / 中国支付宝 由 Stripe 安全处理</div>
            <div className='rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-4'>付款成功后可使用对应AI权限</div>
          </div>
          <p className='mt-5 text-xs leading-5 text-[var(--text-faint)]'>服务提供方：{BRAND_EDUCATION_CN} / Lofty Education，Australia.</p>
        </div>

        {paymentError ? (
          <div className='rounded-[var(--radius-md)] border border-[var(--danger)]/30 bg-[var(--danger-soft)] px-4 py-3 text-sm font-semibold leading-6 text-[var(--danger)]'>
            支付页面打开失败，请刷新后重试。若仍然失败，请联系管理员处理。
          </div>
        ) : null}

        <AiAccessCheckout packages={checkoutPackages} isAuthenticated={Boolean(context)} loginHref='/login-v2?next=%2Fmembership' />
      </section>
    </main>
  );
}
