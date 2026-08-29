import type { Metadata } from 'next';
import { ArrowRight, BookOpenCheck, Clock3, GraduationCap, ReceiptText } from 'lucide-react';

import { AiAccessCheckout } from '@/components/billing/ai-access-checkout';
import { TuitionContactCard } from '@/components/billing/tuition-contact-card';
import { AI_ACCESS_PACKAGES, formatAudAmount } from '@/lib/billing/ai-access-packages';
import { TUITION_PACKAGES, type TuitionPackageCode } from '@/lib/billing/tuition-packages';
import { getServerUser } from '@/lib/auth/server-auth';

export const metadata: Metadata = {
  title: '成为会员 | Lofty Education',
  description: '购买 Lofty Education IELTS AI 或 PTE AI 学习助手时间包。',
};

type Props = {
  searchParams?: Promise<{ payment?: string; reason?: string }>;
};

function getPaymentNotice(payment: string | undefined) {
  if (payment === 'tuition_success') {
    return {
      tone: 'success' as const,
      title: '学费付款成功',
      message: '系统已记录你的学费付款，管理员会根据付款记录确认后续课程安排。',
    };
  }

  if (payment === 'tuition_cancelled') {
    return {
      tone: 'warning' as const,
      title: '学费付款已取消',
      message: '你没有完成本次学费付款，可以重新选择课次后再次支付。',
    };
  }

  return null;
}

const TUITION_PACKAGE_NOTES: Record<TuitionPackageCode, string> = {
  tuition_1_lesson: '适合诊断、作文/口语精讲或短期答疑。',
  tuition_10_lessons: '适合一个阶段的系统提分与题型训练。',
  tuition_20_lessons: '适合完整备考周期、基础重建与冲刺规划。',
};

const SMALL_GROUP_TUITION_CARD = {
  code: 'tuition_small_group',
  label: '小班收费',
  description: '小班方案 / 联系确认',
  amountLabel: '联系确认',
  note: '适合 2-6 人同阶段学习，具体费用与课时安排需先和老师沟通后确认。',
};

function TuitionFeesPanel({ isAuthenticated, loginHref }: { isAuthenticated: boolean; loginHref: string }) {
  return (
    <section className='rounded-[var(--radius-lg)] border border-[var(--border-strong)] bg-[var(--card)] p-4 shadow-[var(--shadow-md)] sm:p-5'>
      <div className='flex flex-wrap items-start justify-between gap-3'>
        <div>
          <p className='inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[var(--primary)]'>
            <GraduationCap size={16} />
            Tuition
          </p>
          <h2 className='mt-1.5 text-xl font-semibold text-[var(--text)]'>学费收费</h2>
          <p className='mt-1.5 max-w-2xl text-sm leading-6 text-[var(--text-soft)]'>
            IELTS / PTE 通用课时价格。请先确认学习方案、课次和时间安排，再完成付款。
          </p>
          <div className='mt-3 rounded-[var(--radius-md)] border border-[var(--primary)]/30 bg-[var(--primary-soft)] px-3 py-2 text-xs font-bold leading-5 text-[var(--primary)]'>
            如使用人民币付款，会根据实时汇率换算，实际金额以付款确认页面为准。
          </div>
        </div>
        <div className='inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--text-soft)] shadow-[var(--shadow-xs)]'>
          <ReceiptText size={15} />
          线下确认
        </div>
      </div>

      <TuitionContactCard />

      <div className='mt-4 grid gap-2.5 sm:grid-cols-2'>
        {TUITION_PACKAGES.map((item) => (
          <article key={item.label} className='rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-3 shadow-[var(--shadow-xs)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--primary)]/45 hover:bg-[var(--card-hover)] hover:shadow-[var(--shadow-sm)]'>
            <div className='flex min-h-[118px] flex-col justify-between gap-3'>
              <div className='min-w-0'>
                <div className='flex flex-wrap items-center gap-2'>
                  <h3 className='text-base font-semibold text-[var(--text)]'>{item.label}</h3>
                  <span className='inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--card)] px-2 py-0.5 text-xs font-bold text-[var(--primary)]'><Clock3 size={12} />{item.description}</span>
                </div>
                <p className='mt-1 text-xs leading-5 text-[var(--text-soft)]'>{TUITION_PACKAGE_NOTES[item.code]}</p>
              </div>
              <div className='flex items-end justify-between gap-3'>
                <span className='inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--card)] px-2 py-0.5 text-xs font-semibold text-[var(--text-soft)]'><BookOpenCheck size={12} />IELTS / PTE</span>
                <div className='shrink-0 text-right'>
                  <div className='text-2xl font-black tracking-tight text-[var(--text)]'>{formatAudAmount(item.amountAudCents)}</div>
                  <div className='text-[11px] font-semibold text-[var(--text-faint)]'>AUD</div>
                </div>
              </div>
            </div>
            {isAuthenticated ? (
              <form action='/api/stripe/tuition-checkout' method='post' className='mt-3'>
                <input type='hidden' name='packageCode' value={item.code} />
                <input type='hidden' name='next' value='/membership' />
                <button type='submit' className='inline-flex h-9 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--primary)] px-4 text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition hover:bg-[var(--primary-hover)]'>
                  支付学费
                  <ArrowRight size={15} />
                </button>
              </form>
            ) : (
              <a href={loginHref} className='mt-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--primary)] px-4 text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition hover:bg-[var(--primary-hover)]'>
                登录后支付
                <ArrowRight size={15} />
              </a>
            )}
          </article>
        ))}
        <article className='rounded-[var(--radius-md)] border border-dashed border-[var(--border)] bg-[var(--bg-soft)] px-4 py-3 opacity-85 shadow-[var(--shadow-xs)]'>
          <div className='flex min-h-[118px] flex-col justify-between gap-3'>
            <div className='min-w-0'>
              <div className='flex flex-wrap items-center gap-2'>
                <h3 className='text-base font-semibold text-[var(--text)]'>{SMALL_GROUP_TUITION_CARD.label}</h3>
                <span className='inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--card)] px-2 py-0.5 text-xs font-bold text-[var(--primary)]'><Clock3 size={12} />{SMALL_GROUP_TUITION_CARD.description}</span>
              </div>
              <p className='mt-1 text-xs leading-5 text-[var(--text-soft)]'>{SMALL_GROUP_TUITION_CARD.note}</p>
            </div>
            <div className='flex items-end justify-between gap-3'>
              <span className='inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--card)] px-2 py-0.5 text-xs font-semibold text-[var(--text-soft)]'><BookOpenCheck size={12} />IELTS / PTE</span>
              <div className='shrink-0 text-right'>
                <div className='max-w-[7rem] text-sm font-black leading-5 text-[var(--text)]'>{SMALL_GROUP_TUITION_CARD.amountLabel}</div>
                <div className='text-[11px] font-semibold text-[var(--text-faint)]'>费用与课时</div>
              </div>
            </div>
          </div>
          <button type='button' disabled className='mt-3 inline-flex h-9 w-full cursor-not-allowed items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] px-4 text-sm font-semibold text-[var(--text-faint)] shadow-[var(--shadow-xs)]'>
            支付学费
            <ArrowRight size={15} />
          </button>
        </article>
      </div>

      <div className='mt-4 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-3'>
        <div className='grid gap-2 text-xs leading-5 text-[var(--text-soft)] sm:grid-cols-2'>
          <p><span className='font-bold text-[var(--text)]'>免费试听：</span>1 小时试听课不收费，也不会计入后续报课费用。</p>
          <p>确认课次、上课时间和学习目标后，由管理员线下处理；后续可接入 Stripe 不定额收费。</p>
        </div>
      </div>
    </section>
  );
}

export default async function MembershipPage({ searchParams }: Props) {
  const context = await getServerUser();
  const resolvedSearchParams = searchParams ? await searchParams : null;
  const paymentError = resolvedSearchParams?.payment === 'error';
  const paymentErrorReason = typeof resolvedSearchParams?.reason === 'string' ? resolvedSearchParams.reason : '';
  const paymentNotice = getPaymentNotice(resolvedSearchParams?.payment);
  const checkoutPackages = AI_ACCESS_PACKAGES.map((item) => ({
    code: item.code,
    days: item.days,
    label: item.label,
    amountAudCents: item.amountAudCents,
    recommended: 'recommended' in item ? item.recommended : false,
  }));

  return (
    <main className='min-h-screen bg-[var(--bg)] px-3 pb-4 pt-20 text-[var(--text)] sm:px-5 lg:px-6 lg:pb-5 lg:pt-24'>
      <section className='mx-auto w-full max-w-[1500px] space-y-4'>
        {paymentError ? (
          <div className='rounded-[var(--radius-md)] border border-[var(--danger)]/30 bg-[var(--danger-soft)] px-4 py-3 text-sm font-semibold leading-6 text-[var(--danger)]'>
            支付页面打开失败，请刷新后重试。若仍然失败，请联系管理员处理。{paymentErrorReason ? ` 错误：${paymentErrorReason}` : ''}
          </div>
        ) : null}
        {paymentNotice ? (
          <div className={(paymentNotice.tone === 'success' ? 'border-[var(--success)]/30 bg-[var(--success-soft)] text-[var(--success)]' : 'border-[var(--warning)]/30 bg-[var(--warning-soft)] text-[var(--warning)]') + ' rounded-[var(--radius-md)] border px-4 py-3 text-sm font-semibold leading-6'}>
            <div>{paymentNotice.title}</div>
            <p className='mt-1 font-medium'>{paymentNotice.message}</p>
          </div>
        ) : null}

        <div className='grid gap-4 xl:grid-cols-2 xl:items-start'>
          <AiAccessCheckout packages={checkoutPackages} isAuthenticated={Boolean(context)} loginHref='/login-v2?next=%2Fmembership' compact />
          <TuitionFeesPanel isAuthenticated={Boolean(context)} loginHref='/login-v2?next=%2Fmembership' />
        </div>
      </section>
    </main>
  );
}
