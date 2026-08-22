'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CreditCard, ShieldCheck, Sparkles } from 'lucide-react';

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
};

export function AiAccessCheckout({ packages, isAuthenticated = true, loginHref = '/login-v2?next=/membership' }: Props) {
  const [loadingKey, setLoadingKey] = useState<string | null>(null);


  return (
    <section className='rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-sm)] sm:p-6'>
      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div>
          <p className='inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary)]'>
            <Sparkles size={16} />
            AI Access
          </p>
          <h2 className='mt-2 text-xl font-bold text-[var(--text)]'>开通 AI 学习助手</h2>
          <p className='mt-2 max-w-2xl text-sm leading-6 text-[var(--text-soft)]'>
            IELTS AI 和 PTE AI 分开计时，购买后只会给对应考试的 AI 功能增加有效期。到期后不会自动续费。
          </p>
          <div className='mt-3 rounded-[var(--radius-md)] border border-[var(--primary)]/30 bg-[var(--primary-soft)] px-4 py-3 text-sm font-bold leading-6 text-[var(--primary)]'>
            如使用 支付宝 付款，会根据实时汇率显示人民币金额，实际金额以支付页面为准。
          </div>
        </div>
        <div className='inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-soft)] px-3 py-2 text-xs font-semibold text-[var(--text-soft)]'>
          <ShieldCheck size={15} />
          Stripe 安全支付
        </div>
      </div>

      <div className='mt-5 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-4'>
        <h3 className='text-sm font-bold text-[var(--text)]'>购买说明</h3>
        <ul className='mt-3 grid gap-2 text-sm leading-6 text-[var(--text-soft)] md:grid-cols-2'>
          <li>AI 权限为一次性时间包：30 / 60 / 90 / 180 天。</li>
          <li>购买后不会自动续费，到期后可重新购买。</li>
          <li>付款成功后系统会自动开通对应 IELTS AI 或 PTE AI 权限。</li>
          <li>IELTS AI 与 PTE AI 分开计时，购买只增加对应考试的 AI 有效期。</li>
          <li>由于 AI 数字服务会即时开通并产生使用成本，开通后一般不支持退款。</li>
          <li>如遇重复付款、系统错误或特殊情况，请通过 Contact 联系我们处理。</li>
        </ul>
        <div className='mt-4 flex flex-wrap gap-x-3 gap-y-2 text-sm font-semibold text-[var(--primary)]'>
          <Link href='/contact' className='hover:underline'>Contact</Link>
          <span className='text-[var(--text-faint)]'>·</span>
          <Link href='/privacy-policy' className='hover:underline'>Privacy Policy</Link>
          <span className='text-[var(--text-faint)]'>·</span>
          <Link href='/terms-of-service' className='hover:underline'>Terms of Service</Link>
          <span className='text-[var(--text-faint)]'>·</span>
          <Link href='/refund-policy' className='hover:underline'>Refund Policy</Link>
        </div>
      </div>

      <div className='mt-5 grid gap-4 lg:grid-cols-2'>
        {AI_ACCESS_PRODUCT_SCOPES.map((scopeConfig) => (
          <div key={scopeConfig.scope} className='rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-4'>
            <div>
              <div className='text-base font-bold text-[var(--text)]'>{scopeConfig.title}</div>
              <p className='mt-1 min-h-10 text-sm leading-6 text-[var(--text-soft)]'>{scopeConfig.description}</p>
            </div>
            <div className='mt-4 grid gap-2 sm:grid-cols-2'>
              {packages.map((item) => {
                const checkoutKey = scopeConfig.scope + ':' + item.code;
                const loading = loadingKey === checkoutKey;

                return (
                  <div key={scopeConfig.scope + ':' + item.code} className='relative rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-3 shadow-[var(--shadow-xs)]'>
                    {item.recommended ? (
                      <span className='absolute right-3 top-3 rounded-full bg-[var(--primary)] px-2 py-1 text-[11px] font-bold text-white'>
                        推荐
                      </span>
                    ) : null}
                    <div className='text-sm font-bold text-[var(--text)]'>{item.days} 天</div>
                    <div className='mt-3 text-2xl font-black text-[var(--primary)]'>{formatAudAmount(item.amountAudCents)}</div>
                    <div className='mt-1 text-xs font-medium text-[var(--text-soft)]'>
                      约 {formatAudAmount(Math.round(item.amountAudCents / Math.max(1, item.days / 30)))} / 月
                    </div>
                    {isAuthenticated ? (
                      <form action='/api/stripe/checkout' method='post' onSubmit={() => setLoadingKey(checkoutKey)}>
                        <input type='hidden' name='packageCode' value={item.code} />
                        <input type='hidden' name='productScope' value={scopeConfig.scope} />
                        <input type='hidden' name='next' value='/membership' />
                        <button type='submit' disabled={Boolean(loadingKey)} className={cn('mt-4 inline-flex h-9 w-full items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary)] px-4 text-sm font-medium text-white shadow-[var(--shadow-sm)] transition-all duration-200 hover:bg-[var(--primary-hover)]', loadingKey ? 'opacity-70' : '')}>
                          {loading ? '正在前往 Stripe...' : '立即开通'}
                        </button>
                      </form>
                    ) : (
                      <a href={loginHref} onClick={() => setLoadingKey(checkoutKey)} className={cn('mt-4 inline-flex h-9 w-full items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary)] px-4 text-sm font-medium text-white shadow-[var(--shadow-sm)] transition-all duration-200 hover:bg-[var(--primary-hover)]', loadingKey ? 'pointer-events-none opacity-70' : '')}>
                        {loading ? '正在前往登录...' : '立即开通'}
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className='mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div className='text-sm leading-6 text-[var(--text-soft)]'>
          <div className='inline-flex items-center gap-2 font-semibold text-[var(--text)]'>
            <CreditCard size={16} />
            银行卡 / Alipay
          </div>
          <p className='mt-1'>
            支付由 Stripe 安全处理。银行卡按澳币结算；支付宝支付页面会显示人民币换算金额。
          </p>
        </div>
      </div>
    </section>
  );
}
