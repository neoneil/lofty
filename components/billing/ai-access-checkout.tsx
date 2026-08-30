'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, BadgeCheck, CheckCircle2, CreditCard, Landmark, MessageCircle, ShieldCheck, Sparkles } from 'lucide-react';

import { AI_ACCESS_PRODUCT_SCOPES, formatAudAmount, type AiAccessPackageCode } from '@/lib/billing/ai-access-packages';
import { cn } from '@/lib/utils';

type CheckoutPackage = {
  code: AiAccessPackageCode;
  days: number;
  label: string;
  amountAudCents: number;
  recommended?: boolean;
};

type Props = {
  packages: CheckoutPackage[];
  isAuthenticated?: boolean;
  loginHref?: string;
  compact?: boolean;
};

const PAYMENT_METHODS = [
  {
    label: '银行卡',
    description: 'Visa / Mastercard / 澳洲银行卡',
    icon: CreditCard,
    accent: 'text-[var(--primary)] bg-[var(--primary-soft)]',
  },
  {
    label: '支付宝',
    description: '支付宝付款，实时汇率显示人民币',
    icon: Landmark,
    accent: 'text-[#1677ff] bg-[#1677ff]/10',
  },
  {
    label: '微信支付',
    description: '微信支付图标展示，实际以 Stripe 支付页为准',
    icon: MessageCircle,
    accent: 'text-[#19a34a] bg-[#19a34a]/10',
  },
] as const;

const PACKAGE_FEATURES = ['考试 AI', '即时开通', '不自动续费'];

function PaymentMethodIconRow({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cn('flex max-w-full flex-wrap items-center justify-start gap-1.5 sm:justify-end', compact ? 'gap-1' : '')}>
      {PAYMENT_METHODS.map((method) => {
        const Icon = method.icon;
        return (
          <span key={method.label} title={method.label} aria-label={method.label} className={cn('inline-flex items-center justify-center gap-1 rounded-full border border-[var(--border)] bg-[var(--bg-soft)] text-[var(--text-soft)]', compact ? 'h-6 px-1.5 text-[10px]' : 'h-8 px-2 text-xs')}>
            <Icon size={compact ? 11 : 13} className={method.accent.split(' ')[0]} />
            <span className='leading-none'>{method.label}</span>
          </span>
        );
      })}
    </div>
  );
}

export function AiAccessCheckout({ packages, isAuthenticated = true, loginHref = '/login-v2?next=/membership', compact = false }: Props) {
  const [loadingKey, setLoadingKey] = useState<string | null>(null);


  return (
    <section className='rounded-[var(--radius-lg)] border border-[var(--border-strong)] bg-[var(--card)] p-4 shadow-[var(--shadow-md)] sm:p-5'>
      <div className='flex flex-wrap items-start justify-between gap-3'>
        <div>
          <p className='inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[var(--primary)]'>
            <Sparkles size={16} />
            AI Access
          </p>
          <h2 className='mt-1.5 text-xl font-semibold text-[var(--text)]'>选择考试方向与 AI 时间包</h2>
          <p className='mt-1.5 max-w-2xl text-sm leading-6 text-[var(--text-soft)]'>
            IELTS AI 和 PTE AI 分开计时，购买后只会给对应考试的 AI 功能增加有效期。到期后不会自动续费。
          </p>
          <div className='mt-3 rounded-[var(--radius-md)] border border-[var(--primary)]/30 bg-[var(--primary-soft)] px-3 py-2 text-xs font-bold leading-5 text-[var(--primary)]'>
            如使用 支付宝 付款，会根据实时汇率显示人民币金额，实际金额以支付页面为准。
          </div>
        </div>
        <div className='inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--text-soft)] shadow-[var(--shadow-xs)]'>
          <ShieldCheck size={15} />
          Stripe 安全支付
        </div>
      </div>

      <div className={cn('mt-4 grid gap-3', compact ? '' : 'lg:grid-cols-2')}>
        {AI_ACCESS_PRODUCT_SCOPES.map((scopeConfig) => (
          <div key={scopeConfig.scope} className='overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-soft)] shadow-[var(--shadow-sm)]'>
            <div className='border-b border-[var(--border)] bg-[var(--card)] p-3 sm:p-4'>
              <div className='flex items-start justify-between gap-4'>
                <div>
                  <div className='text-base font-semibold text-[var(--text)]'>{scopeConfig.title}</div>
                  <p className='mt-1 max-w-xl text-xs leading-5 text-[var(--text-soft)]'>{scopeConfig.description}</p>
                </div>
                <span className='shrink-0 rounded-full border border-[var(--border)] bg-[var(--bg-soft)] px-3 py-1 text-xs font-bold text-[var(--primary)]'>{scopeConfig.label}</span>
              </div>
            </div>
            <div className={cn('grid gap-2.5 p-3 sm:p-4', compact ? 'sm:grid-cols-2 lg:grid-cols-1 2xl:grid-cols-2' : 'sm:grid-cols-2')}>
              {packages.map((item) => {
                const checkoutKey = scopeConfig.scope + ':' + item.code;
                const loading = loadingKey === checkoutKey;
                const monthlyAmount = formatAudAmount(Math.round(item.amountAudCents / Math.max(1, item.days / 30)));

                return (
                  <div key={scopeConfig.scope + ':' + item.code} className={cn('group overflow-hidden rounded-[var(--radius-md)] border bg-[var(--card)] p-3 shadow-[var(--shadow-xs)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--primary)]/45 hover:shadow-[var(--shadow-md)]', item.recommended ? 'border-[var(--primary)]/55 ring-1 ring-[var(--primary)]/20' : 'border-[var(--border)]')}>
                    <div className='flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between'>
                      <div className='min-w-0'>
                        <div className='truncate text-sm font-bold text-[var(--text)]'>{item.label}</div>
                        {item.recommended ? (
                          <span className='mt-1 inline-flex items-center gap-1 rounded-full bg-[var(--primary)] px-2 py-0.5 text-[10px] font-bold text-white shadow-[var(--shadow-sm)]'>
                            <BadgeCheck size={11} />
                            推荐
                          </span>
                        ) : null}
                      </div>
                      <PaymentMethodIconRow compact />
                    </div>
                    <div className='mt-2'>
                      <div className='flex flex-wrap items-end gap-x-2 gap-y-1'>
                        <span className='text-2xl font-black tracking-tight text-[var(--text)]'>{formatAudAmount(item.amountAudCents)}</span>
                        <span className='pb-1 text-xs font-semibold text-[var(--text-faint)]'>AUD</span>
                        <span className='pb-1 text-xs font-medium text-[var(--text-soft)]'>约 {monthlyAmount} / 月</span>
                      </div>
                    </div>
                    <div className='mt-3 grid gap-1.5 border-t border-[var(--border)] pt-3 sm:grid-cols-3'>
                      {PACKAGE_FEATURES.map((feature) => (
                        <div key={feature} className='flex min-h-7 items-center justify-center gap-1 rounded-[var(--radius-sm)] bg-[var(--bg-soft)] px-1.5 text-center text-[11px] font-semibold leading-4 text-[var(--text-soft)]'>
                          <CheckCircle2 size={12} className='shrink-0 text-[var(--success)]' />
                          {feature}
                        </div>
                      ))}
                    </div>
                    {isAuthenticated ? (
                      <form action='/api/stripe/checkout' method='post' onSubmit={() => setLoadingKey(checkoutKey)}>
                        <input type='hidden' name='packageCode' value={item.code} />
                        <input type='hidden' name='productScope' value={scopeConfig.scope} />
                        <input type='hidden' name='next' value='/membership' />
                        <button type='submit' disabled={Boolean(loadingKey)} className={cn('mt-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--primary)] px-4 text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition-all duration-200 hover:bg-[var(--primary-hover)]', loadingKey ? 'opacity-70' : '')}>
                          {loading ? '正在前往 Stripe...' : '立即开通'}
                          {!loading ? <ArrowRight size={15} /> : null}
                        </button>
                      </form>
                    ) : (
                      <a href={loginHref} onClick={() => setLoadingKey(checkoutKey)} className={cn('mt-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--primary)] px-4 text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition-all duration-200 hover:bg-[var(--primary-hover)]', loadingKey ? 'pointer-events-none opacity-70' : '')}>
                        {loading ? '正在前往登录...' : '立即开通'}
                        {!loading ? <ArrowRight size={15} /> : null}
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className='mt-4 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-3 sm:p-4'>
        <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
          <div>
            <h3 className='text-sm font-bold text-[var(--text)]'>购买说明</h3>
            <ul className='mt-2 grid gap-x-5 gap-y-1 text-xs leading-5 text-[var(--text-soft)] md:grid-cols-2'>
              <li>AI 权限为一次性时间包：30 / 60 / 90 / 180 天。</li>
              <li>购买后不会自动续费，到期后可重新购买。</li>
              <li>付款成功后系统会自动开通对应 IELTS AI 或 PTE AI 权限。</li>
              <li>IELTS AI 与 PTE AI 分开计时，购买只增加对应考试的 AI 有效期。</li>
              <li>由于 AI 数字服务会即时开通并产生使用成本，开通后一般不支持退款。</li>
              <li>如遇重复付款、系统错误或特殊情况，请通过 Contact 联系我们处理。</li>
            </ul>
          </div>
          <div className='shrink-0 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--text-soft)]'>
            <div className='inline-flex items-center gap-2 font-semibold text-[var(--text)]'>
              <ShieldCheck size={16} />
              Stripe Checkout
            </div>
            <p className='mt-1 max-w-xs text-xs leading-5'>最终可用付款方式以 Stripe 支付页面和你的 Stripe 后台开通状态为准。</p>
          </div>
        </div>
        <div className='mt-4 flex flex-wrap gap-x-3 gap-y-2 border-t border-[var(--border)] pt-4 text-sm font-semibold text-[var(--primary)]'>
          <Link href='/contact' className='hover:underline'>Contact</Link>
          <span className='text-[var(--text-faint)]'>·</span>
          <Link href='/privacy-policy' className='hover:underline'>Privacy Policy</Link>
          <span className='text-[var(--text-faint)]'>·</span>
          <Link href='/terms-of-service' className='hover:underline'>Terms of Service</Link>
          <span className='text-[var(--text-faint)]'>·</span>
          <Link href='/refund-policy' className='hover:underline'>Refund Policy</Link>
        </div>
      </div>
    </section>
  );
}
