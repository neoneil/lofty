import Link from 'next/link';
import { Database, ReceiptText, Search, UserRound } from 'lucide-react';

import { requireAdmin } from '@/lib/auth/require-admin';
import { normalizeAiAccessProductScope } from '@/lib/billing/ai-access-packages';
import { createAdminClient } from '@/lib/supabase/admin';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type AnyRecord = Record<string, unknown>;
type QueryResult<T> = { data: T | null; error: { message: string } | null };

type ProfileRecord = AnyRecord & {
  id: string;
  email?: string | null;
  full_name?: string | null;
  exam_type?: string | null;
  role?: string | null;
  is_my_student?: boolean | null;
  selective_access?: boolean | null;
  created_at?: string | null;
};

const PROFILE_SELECT = 'id, email, full_name, exam_type, role, is_my_student, selective_access, created_at, updated_at';
const PRODUCT_LIMIT_SELECT = 'user_id, product_scope, daily_limit, monthly_limit, is_unlimited, unlimited_until, created_at, updated_at';
const LEGACY_LIMIT_SELECT = 'user_id, daily_limit, monthly_limit, is_unlimited, unlimited_until, created_at, updated_at';
const AI_PURCHASE_SELECT = 'id, user_id, product_scope, package_code, access_days, status, currency, amount_total, amount_subtotal, stripe_checkout_session_id, stripe_payment_status, access_started_at, access_until, created_at, updated_at';
const TUITION_PAYMENT_SELECT = 'id, user_id, package_code, package_label, lesson_count, total_hours, status, currency, amount_total, amount_subtotal, stripe_checkout_session_id, stripe_payment_status, paid_at, cancelled_at, failed_at, created_at, updated_at';
const AI_USAGE_LOG_SELECT = 'id, user_id, feature, product_scope, model, prompt_tokens, completion_tokens, total_tokens, estimated_cost, status, error_message, created_at';
const WEBHOOK_EVENT_SELECT = 'id, stripe_event_id, event_type, processed_at, processing_error, created_at';

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatDate(value: unknown) {
  if (typeof value !== 'string' || !value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Australia/Sydney',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

function formatMoney(cents: unknown, currency: unknown) {
  const value = Number(cents);
  if (!Number.isFinite(value)) return '-';
  const normalizedCurrency = typeof currency === 'string' && currency ? currency.toUpperCase() : 'AUD';
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: normalizedCurrency,
  }).format(value / 100);
}

function formatValue(key: string, value: unknown) {
  if (value === null || value === undefined || value === '') return '-';
  if (key.endsWith('_at') || key.includes('date')) return formatDate(value);
  if (key === 'amount_total' || key === 'amount_subtotal') return formatMoney(value, 'aud');
  if (key === 'product_scope') return getScopeLabel(value);
  if (key === 'status') return getStatusLabel(value);
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function getDisplayName(profile: ProfileRecord) {
  return String(profile.full_name || profile.email || profile.id);
}

function getStatusLabel(value: unknown) {
  if (value === 'fulfilled') return '已付款 / 已开通';
  if (value === 'paid') return '已付款';
  if (value === 'pending') return '等待支付';
  if (value === 'cancelled') return '已取消';
  if (value === 'failed') return '支付失败';
  if (value === 'refunded') return '已退款';
  return typeof value === 'string' && value ? value : '-';
}

function getScopeLabel(value: unknown) {
  const scope = normalizeAiAccessProductScope(value);
  if (scope === 'ielts') return 'IELTS AI';
  if (scope === 'pte') return 'PTE AI';
  if (typeof value === 'string' && value) return value;
  return 'AI';
}

function getPurchaseTotals(purchases: AnyRecord[]) {
  const paidStatuses = new Set(['fulfilled', 'paid']);
  const paid = purchases.filter((purchase) => paidStatuses.has(String(purchase.status ?? '')));
  const totalAudCents = paid.reduce((sum, purchase) => {
    const currency = typeof purchase.currency === 'string' ? purchase.currency.toLowerCase() : 'aud';
    const amount = Number(purchase.amount_total ?? 0);
    return currency === 'aud' && Number.isFinite(amount) ? sum + amount : sum;
  }, 0);
  const totalDays = paid.reduce((sum, purchase) => {
    const days = Number(purchase.access_days ?? 0);
    return Number.isFinite(days) ? sum + days : sum;
  }, 0);
  return { paidCount: paid.length, totalAudCents, totalDays };
}

function getTuitionPaymentTotals(payments: AnyRecord[]) {
  const paid = payments.filter((payment) => String(payment.status ?? '') === 'paid');
  const totalAudCents = paid.reduce((sum, payment) => {
    const currency = typeof payment.currency === 'string' ? payment.currency.toLowerCase() : 'aud';
    const amount = Number(payment.amount_total ?? 0);
    return currency === 'aud' && Number.isFinite(amount) ? sum + amount : sum;
  }, 0);
  const totalHours = paid.reduce((sum, payment) => {
    const hours = Number(payment.total_hours ?? 0);
    return Number.isFinite(hours) ? sum + hours : sum;
  }, 0);
  return { paidCount: paid.length, totalAudCents, totalHours };
}

async function safeQuery<T>(label: string, query: PromiseLike<QueryResult<T>>) {
  const result = await query;
  if (result.error) {
    console.error(label + ' query failed:', result.error);
    return { data: null, error: result.error.message };
  }
  return { data: result.data, error: null };
}

function InfoGrid({ rows }: { rows: Array<[string, unknown, string?]> }) {
  return (
    <div className='grid gap-3 md:grid-cols-2 xl:grid-cols-3'>
      {rows.map(([label, value, kind]) => {
        const display = kind === 'date' ? formatDate(value) : kind === 'money' ? formatMoney(value, 'aud') : kind === 'scope' ? getScopeLabel(value) : kind === 'status' ? getStatusLabel(value) : formatValue('', value);
        return (
          <div key={label} className='rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-3'>
            <p className='text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-faint)]'>{label}</p>
            <p className='mt-1 break-words text-sm font-semibold text-[var(--text)]'>{display}</p>
          </div>
        );
      })}
    </div>
  );
}

function JsonDetails({ title, value }: { title: string; value: unknown }) {
  if (!value || typeof value !== 'object') return null;
  return (
    <details className='rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-4'>
      <summary className='cursor-pointer text-sm font-bold text-[var(--text)]'>{title}</summary>
      <pre className='mt-3 max-h-80 overflow-auto whitespace-pre-wrap rounded-[var(--radius-sm)] bg-[var(--card)] p-3 text-xs leading-5 text-[var(--text-soft)]'>{formatValue('', value)}</pre>
    </details>
  );
}

function DataTable({ title, rows, emptyText, error }: { title: string; rows: AnyRecord[]; emptyText: string; error?: string | null }) {
  const keys = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  return (
    <section className='rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-sm)]'>
      <div className='mb-4 flex items-center justify-between gap-3'>
        <h2 className='text-lg font-bold text-[var(--text)]'>{title}</h2>
        <span className='rounded-full border border-[var(--border)] bg-[var(--bg-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--text-soft)]'>{rows.length} 条</span>
      </div>
      {error ? <p className='mb-3 rounded-[var(--radius-md)] border border-[var(--danger)]/20 bg-[var(--danger-soft)] p-3 text-sm font-semibold text-[var(--danger)]'>查询失败：{error}</p> : null}
      {rows.length === 0 ? (
        <p className='rounded-[var(--radius-md)] border border-dashed border-[var(--border)] bg-[var(--bg-soft)] p-4 text-sm text-[var(--text-soft)]'>{emptyText}</p>
      ) : (
        <div className='overflow-x-auto'>
          <table className='min-w-full border-separate border-spacing-0 text-left text-sm'>
            <thead>
              <tr>
                {keys.map((key) => <th key={key} className='sticky top-0 border-b border-[var(--border)] bg-[var(--card)] px-3 py-2 text-xs font-bold uppercase tracking-[0.08em] text-[var(--text-faint)]'>{key}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={String(row.id ?? row.event_id ?? rowIndex)}>
                  {keys.map((key) => {
                    const value = row[key];
                    const isJson = value && typeof value === 'object';
                    return (
                      <td key={key} className='max-w-[320px] border-b border-[var(--border)] px-3 py-2 align-top text-[var(--text-soft)]'>
                        {isJson ? <pre className='max-h-40 overflow-auto whitespace-pre-wrap text-xs leading-5'>{formatValue(key, value)}</pre> : <span className='break-words'>{formatValue(key, value)}</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default async function AdminStudentPaymentsPage({ searchParams }: { searchParams?: SearchParams }) {
  await requireAdmin('/admin/student-payments');

  const params = searchParams ? await searchParams : {};
  const query = (getParam(params.q) ?? '').trim().toLowerCase();
  const selectedUserId = (getParam(params.userId) ?? '').trim();
  const supabase = createAdminClient();

  const profilesResult = await safeQuery<ProfileRecord[]>(
    'student payments profiles',
    supabase.from('profiles').select(PROFILE_SELECT).order('created_at', { ascending: false })
  );

  const profiles = (profilesResult.data ?? [])
    .filter((profile) => profile.role !== 'admin')
    .filter((profile) => {
      if (!query) return true;
      return [profile.id, profile.email, profile.full_name, profile.exam_type, profile.role].filter(Boolean).join(' ').toLowerCase().includes(query);
    });

  const selectedProfile = profiles.find((profile) => profile.id === selectedUserId) ?? null;
  const activeProfile = selectedProfile ?? profiles[0] ?? null;
  const activeUserId = activeProfile?.id ?? '';

  const empty = { data: [], error: null };
  const [authResult, productLimitsResult, legacyLimitResult, purchasesResult, tuitionPaymentsResult, usageLogsResult, webhookEventsResult] = activeUserId
    ? await Promise.all([
        supabase.auth.admin.getUserById(activeUserId),
        safeQuery<AnyRecord[]>('student payments product limits', supabase.from('ai_user_product_limits').select(PRODUCT_LIMIT_SELECT).eq('user_id', activeUserId).order('product_scope', { ascending: true })),
        safeQuery<AnyRecord[]>('student payments legacy limits', supabase.from('ai_user_limits').select(LEGACY_LIMIT_SELECT).eq('user_id', activeUserId)),
        safeQuery<AnyRecord[]>('student payments purchases', supabase.from('ai_access_purchases').select(AI_PURCHASE_SELECT).eq('user_id', activeUserId).order('created_at', { ascending: false })),
        safeQuery<AnyRecord[]>('student tuition payments', supabase.from('tuition_payments').select(TUITION_PAYMENT_SELECT).eq('user_id', activeUserId).order('created_at', { ascending: false })),
        safeQuery<AnyRecord[]>('student payments usage logs', supabase.from('ai_usage_logs').select(AI_USAGE_LOG_SELECT).eq('user_id', activeUserId).order('created_at', { ascending: false }).limit(80)),
        safeQuery<AnyRecord[]>('student payments webhook events', supabase.from('stripe_webhook_events').select(WEBHOOK_EVENT_SELECT).order('created_at', { ascending: false }).limit(120)),
      ])
    : [null, empty, empty, empty, empty, empty, empty];

  const authUser = authResult && 'data' in authResult ? authResult.data.user : null;
  const authError = authResult && 'error' in authResult && authResult.error ? authResult.error.message : null;
  const productLimits = productLimitsResult.data ?? [];
  const legacyLimits = legacyLimitResult.data ?? [];
  const purchases = purchasesResult.data ?? [];
  const tuitionPayments = tuitionPaymentsResult.data ?? [];
  const usageLogs = usageLogsResult.data ?? [];
  const webhookEvents = (webhookEventsResult.data ?? []).slice(0, 30);
  const totals = getPurchaseTotals(purchases);
  const tuitionTotals = getTuitionPaymentTotals(tuitionPayments);

  return (
    <main className='min-h-screen bg-[var(--bg)] px-4 py-8 text-[var(--text)] sm:px-6 lg:px-8'>
      <section className='mx-auto w-full max-w-7xl space-y-6'>
        <div className='rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-sm)] sm:p-6'>
          <Link href='/admin' className='inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary)] hover:underline'>返回后台</Link>
          <div className='mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between'>
            <div>
              <p className='text-sm font-semibold text-[var(--text-soft)]'>Admin</p>
              <h1 className='mt-2 flex items-center gap-3 text-2xl font-bold tracking-tight text-[var(--text)] sm:text-3xl'><ReceiptText size={28} className='text-[var(--primary)]' />学生付款详情</h1>
              <p className='mt-2 text-sm leading-6 text-[var(--text-soft)]'>查看学生 Profile、Auth 账号、AI 权限、Stripe 购买记录、AI 使用日志和 webhook 事件。</p>
            </div>
            <div className='grid gap-2 text-sm sm:grid-cols-2 xl:grid-cols-5'>
              <div className='rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-3'><p className='text-xs text-[var(--text-faint)]'>已付款订单</p><p className='mt-1 text-lg font-black text-[var(--text)]'>{totals.paidCount}</p></div>
              <div className='rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-3'><p className='text-xs text-[var(--text-faint)]'>AI 总付款</p><p className='mt-1 text-lg font-black text-[var(--text)]'>{formatMoney(totals.totalAudCents, 'aud')}</p></div>
              <div className='rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-3'><p className='text-xs text-[var(--text-faint)]'>AI 天数</p><p className='mt-1 text-lg font-black text-[var(--text)]'>{totals.totalDays}</p></div>
              <div className='rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-3'><p className='text-xs text-[var(--text-faint)]'>学费订单</p><p className='mt-1 text-lg font-black text-[var(--text)]'>{tuitionTotals.paidCount}</p></div>
              <div className='rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-3'><p className='text-xs text-[var(--text-faint)]'>学费总额 / 小时</p><p className='mt-1 text-lg font-black text-[var(--text)]'>{formatMoney(tuitionTotals.totalAudCents, 'aud')} / {tuitionTotals.totalHours}</p></div>
            </div>
          </div>
        </div>

        <div className='grid gap-5 lg:grid-cols-[340px_minmax(0,1fr)]'>
          <aside className='rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow-sm)] lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-auto'>
            <form action='/admin/student-payments' className='mb-4'>
              <label className='relative block'>
                <Search size={16} className='pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]' />
                <input name='q' defaultValue={getParam(params.q) ?? ''} placeholder='搜索学生姓名 / 邮箱 / ID' className='h-11 w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] pl-9 pr-3 text-sm text-[var(--text)] outline-none transition focus:border-[var(--primary)]' />
              </label>
            </form>
            <div className='mb-3 flex items-center justify-between'>
              <h2 className='text-sm font-bold text-[var(--text)]'>学生列表</h2>
              <span className='rounded-full border border-[var(--border)] bg-[var(--bg-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--text-soft)]'>{profiles.length}</span>
            </div>
            <div className='space-y-2'>
              {profiles.length === 0 ? <p className='rounded-[var(--radius-md)] border border-dashed border-[var(--border)] bg-[var(--bg-soft)] p-4 text-sm text-[var(--text-soft)]'>没有找到学生。</p> : profiles.map((profile) => {
                const active = profile.id === activeUserId;
                const href = '/admin/student-payments?userId=' + encodeURIComponent(profile.id) + (query ? '&q=' + encodeURIComponent(query) : '');
                return (
                  <Link key={profile.id} href={href} className={'block rounded-[var(--radius-md)] border p-3 transition ' + (active ? 'border-[var(--primary)] bg-[var(--primary-soft)] shadow-[inset_3px_0_0_var(--primary)]' : 'border-[var(--border)] bg-[var(--card)] hover:bg-[var(--bg-soft)]')}>
                    <p className='truncate text-sm font-bold text-[var(--text)]'>{getDisplayName(profile)}</p>
                    <p className='mt-1 truncate text-xs text-[var(--text-soft)]'>{String(profile.email || profile.id)}</p>
                    <div className='mt-2 flex flex-wrap gap-1.5'>
                      <span className='rounded-full bg-[var(--bg-soft)] px-2 py-0.5 text-[11px] font-semibold text-[var(--text-soft)]'>{String(profile.exam_type || 'null')}</span>
                      <span className='rounded-full bg-[var(--bg-soft)] px-2 py-0.5 text-[11px] font-semibold text-[var(--text-soft)]'>{String(profile.role || 'user')}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </aside>

          <div className='space-y-5'>
            {!activeUserId || !activeProfile ? (
              <section className='rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-8 text-center shadow-[var(--shadow-sm)]'><p className='text-sm text-[var(--text-soft)]'>请选择一个学生。</p></section>
            ) : (
              <>
                <section className='rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-sm)]'>
                  <div className='mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
                    <div>
                      <h2 className='flex items-center gap-2 text-lg font-bold text-[var(--text)]'><UserRound size={20} className='text-[var(--primary)]' />学生资料</h2>
                      <p className='mt-1 break-all text-sm text-[var(--text-soft)]'>{activeUserId}</p>
                    </div>
                    <Link href={'/admin/student-plans?student=' + encodeURIComponent(activeUserId)} className='w-fit rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-soft)] px-3 py-2 text-sm font-semibold text-[var(--text)] transition hover:border-[var(--primary)]/40 hover:text-[var(--primary)]'>打开学生计划</Link>
                  </div>
                  <InfoGrid rows={[
                    ['姓名', activeProfile.full_name],
                    ['邮箱', activeProfile.email],
                    ['考试类型', activeProfile.exam_type],
                    ['角色', activeProfile.role],
                    ['Profile 创建', activeProfile.created_at, 'date'],
                    ['Auth 创建', authUser?.created_at, 'date'],
                    ['最近登录', authUser?.last_sign_in_at, 'date'],
                    ['邮箱确认', authUser?.email_confirmed_at, 'date'],
                    ['手机号', authUser?.phone],
                  ]} />
                  {authError ? <p className='mt-3 rounded-[var(--radius-md)] border border-[var(--danger)]/20 bg-[var(--danger-soft)] p-3 text-sm font-semibold text-[var(--danger)]'>Auth 查询失败：{authError}</p> : null}
                  <div className='mt-4 grid gap-3 lg:grid-cols-2'>
                    <JsonDetails title='Profile 安全摘要' value={{
                      id: activeProfile.id,
                      email: activeProfile.email,
                      full_name: activeProfile.full_name,
                      exam_type: activeProfile.exam_type,
                      role: activeProfile.role,
                      is_my_student: activeProfile.is_my_student,
                      selective_access: activeProfile.selective_access,
                      created_at: activeProfile.created_at,
                    }} />
                    <JsonDetails title='Auth User 安全摘要' value={{
                      id: authUser?.id,
                      email: authUser?.email,
                      created_at: authUser?.created_at,
                      last_sign_in_at: authUser?.last_sign_in_at,
                      email_confirmed_at: authUser?.email_confirmed_at,
                      phone: authUser?.phone,
                      providers: authUser?.identities?.map((identity) => identity.provider),
                    }} />
                  </div>
                </section>

                <DataTable title='当前 AI 权限 ai_user_product_limits' rows={productLimits} emptyText='没有 ai_user_product_limits 记录。' error={productLimitsResult.error} />
                <DataTable title='旧 AI 权限 ai_user_limits' rows={legacyLimits} emptyText='没有 ai_user_limits 旧额度记录。' error={legacyLimitResult.error} />
                <DataTable title='付款 / 购买记录 ai_access_purchases' rows={purchases} emptyText='该学生暂无购买记录。' error={purchasesResult.error} />
                <DataTable title='学费付款 tuition_payments' rows={tuitionPayments} emptyText='该学生暂无学费付款记录。' error={tuitionPaymentsResult.error} />
                <DataTable title='最近 AI 使用日志 ai_usage_logs' rows={usageLogs} emptyText='该学生暂无 AI 使用日志。' error={usageLogsResult.error} />
                <DataTable title='最近 Stripe Webhook 事件摘要 stripe_webhook_events' rows={webhookEvents} emptyText='暂无 webhook 事件摘要。' error={webhookEventsResult.error} />

                <section className='rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-sm)]'>
                  <h2 className='mb-4 flex items-center gap-2 text-lg font-bold text-[var(--text)]'><Database size={20} className='text-[var(--primary)]' />查询范围</h2>
                  <div className='grid gap-3 md:grid-cols-2'>
                    {['profiles', 'auth.users', 'ai_user_product_limits', 'ai_user_limits', 'ai_access_purchases', 'tuition_payments', 'ai_usage_logs', 'stripe_webhook_events'].map((table) => <div key={table} className='rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-3 text-sm font-semibold text-[var(--text-soft)]'>{table}</div>)}
                  </div>
                </section>
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
