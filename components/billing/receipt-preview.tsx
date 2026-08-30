import { CheckCircle2, FileText, ShieldCheck } from 'lucide-react';

type ReceiptPreviewProps = {
  variant?: 'tuition' | 'ai';
};

const sampleItems = {
  tuition: {
    titleCn: '学费付款收据',
    titleEn: 'Tuition Payment Receipt',
    receiptNo: 'LFY-20260830-024',
    amount: 'A$180.00',
    itemCn: '一对一课程学费',
    itemEn: '1-on-1 tuition fee',
    descriptionCn: '单次课 / 2 小时',
    descriptionEn: '1 lesson / 2 hours',
    quantity: '1 次',
  },
  ai: {
    titleCn: 'AI 权限付款收据',
    titleEn: 'AI Access Payment Receipt',
    receiptNo: 'LFY-20260830-024',
    amount: 'A$19.00',
    itemCn: 'IELTS AI 学习助手',
    itemEn: 'IELTS AI study assistant',
    descriptionCn: '30 天一次性时间包',
    descriptionEn: '30-day one-time access package',
    quantity: '30 天',
  },
};

export function ReceiptPreview({ variant = 'tuition' }: ReceiptPreviewProps) {
  const receipt = sampleItems[variant];

  return (
    <div className='rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow-md)] sm:p-6'>
      <div className='mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
        <div>
          <p className='inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[var(--primary)]'>
            <FileText size={15} />
            Receipt Test
          </p>
          <h2 className='mt-2 text-xl font-bold text-[var(--text)]'>付款收据 PDF 预览</h2>
          <p className='mt-1 text-sm leading-6 text-[var(--text-soft)]'>
            这是网页打样，真实 PDF 生成逻辑暂时没有改。确认版式后再嵌入中文字体生成附件。
          </p>
        </div>
        <span className='w-fit rounded-full border border-[var(--success)]/25 bg-[var(--success-soft)] px-3 py-1.5 text-xs font-bold text-[var(--success)]'>
          中文优先 / English secondary
        </span>
      </div>

      <div className='overflow-auto rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-soft)] p-3 sm:p-5'>
        <div className='mx-auto min-h-[900px] w-full max-w-[760px] bg-white px-10 py-10 text-slate-900 shadow-[0_24px_80px_rgba(15,23,42,0.18)] sm:px-14 sm:py-11'>
          <header className='flex items-start justify-between gap-8 border-b border-slate-200 pb-6'>
            <div>
              <p className='text-lg font-black tracking-tight text-emerald-800'>小马哥教育</p>
              <p className='mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500'>Lofty Education</p>
              <h1 className='mt-6 text-2xl font-black tracking-tight text-slate-950'>{receipt.titleCn}</h1>
              <p className='mt-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500'>{receipt.titleEn}</p>
              <p className='mt-4 text-xs font-medium text-slate-500'>30 Aug 2026, 11:13</p>
            </div>
            <div className='w-36 rounded-2xl bg-emerald-800 p-4 text-white shadow-lg'>
              <div className='flex items-center gap-2'>
                <CheckCircle2 size={18} />
                <div>
                  <p className='text-lg font-black leading-none'>已付款</p>
                  <p className='mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-100'>Paid</p>
                </div>
              </div>
              <p className='mt-5 text-lg font-black'>{receipt.amount}</p>
              <p className='mt-1 text-xs text-emerald-100'>Australian dollars</p>
            </div>
          </header>

          <section className='mt-6 grid gap-4 md:grid-cols-2'>
            <div className='rounded-2xl border border-slate-200 bg-slate-50 p-5'>
              <p className='text-xs font-black uppercase tracking-[0.14em] text-slate-500'>交费方</p>
              <p className='mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400'>Paid by</p>
              <p className='mt-4 text-base font-black text-slate-950'>Student Name</p>
              <p className='mt-1 text-sm font-semibold text-slate-600'>student@example.com</p>
            </div>
            <div className='rounded-2xl border border-slate-200 bg-slate-50 p-5'>
              <p className='text-xs font-black uppercase tracking-[0.14em] text-slate-500'>收款方</p>
              <p className='mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400'>Merchant</p>
              <p className='mt-4 text-base font-black text-slate-950'>小马哥教育</p>
              <p className='mt-1 text-sm font-semibold text-slate-600'>Lofty Education, Australia</p>
              <p className='mt-1 text-xs font-medium text-slate-500'>Melbourne, Australia</p>
            </div>
          </section>

          <section className='mt-8'>
            <div className='flex items-end justify-between gap-4'>
              <div>
                <h2 className='text-xl font-black text-slate-950'>付款明细</h2>
                <p className='mt-1 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500'>Payment summary</p>
              </div>
              <div className='text-right text-xs font-semibold text-slate-500'>
                <p>收据编号 / Receipt No.</p>
                <p className='mt-1 text-slate-800'>{receipt.receiptNo}</p>
              </div>
            </div>

            <div className='mt-5 overflow-hidden rounded-2xl border border-slate-200'>
              <div className='hidden grid-cols-[1fr_120px_140px] bg-emerald-50 px-5 py-3 text-[11px] font-black text-slate-600 sm:grid'>
                <div>
                  项目
                  <span className='mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400'>Item</span>
                </div>
                <div>
                  数量
                  <span className='mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400'>Quantity</span>
                </div>
                <div className='text-right'>
                  金额
                  <span className='mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400'>Amount</span>
                </div>
              </div>
              <div className='grid gap-4 border-t border-slate-200 px-5 py-4 text-sm sm:grid-cols-[1fr_120px_140px] sm:items-center'>
                <div>
                  <p className='mb-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-400 sm:hidden'>项目 / Item</p>
                  <p className='text-sm font-black text-slate-950'>{receipt.itemCn}</p>
                  <p className='mt-1 text-xs font-semibold text-slate-500'>{receipt.itemEn}</p>
                  <p className='mt-2 text-xs text-slate-600'>{receipt.descriptionCn}</p>
                  <p className='mt-1 text-xs text-slate-400'>{receipt.descriptionEn}</p>
                </div>
                <div className='font-bold text-slate-800'>
                  <p className='mb-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-400 sm:hidden'>数量 / Quantity</p>
                  {receipt.quantity}
                </div>
                <div className='text-base font-black text-slate-950 sm:text-right'>
                  <p className='mb-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-400 sm:hidden'>金额 / Amount</p>
                  {receipt.amount}
                </div>
              </div>
            </div>

            <div className='mt-5 flex justify-end'>
              <div className='w-full max-w-xs rounded-2xl border border-slate-200 bg-slate-50 p-5'>
                <div className='flex items-center justify-between text-sm text-slate-500'>
                  <span>合计</span>
                  <span>Total paid</span>
                </div>
                <div className='mt-3 text-right text-2xl font-black text-emerald-800'>{receipt.amount}</div>
              </div>
            </div>
          </section>

          <section className='mt-8 rounded-2xl border border-emerald-100 bg-emerald-50 p-5'>
            <div className='flex gap-3'>
              <ShieldCheck size={20} className='mt-0.5 shrink-0 text-emerald-800' />
              <div>
                <h2 className='text-sm font-black text-slate-950'>付款说明</h2>
                <p className='mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500'>Payment notes</p>
                <div className='mt-3 space-y-2 text-xs leading-6 text-slate-700'>
                  <p>本收据用于确认 Lofty Education 已收到对应服务款项。</p>
                  <p>This receipt confirms payment received by Lofty Education for the selected service.</p>
                  <p>本文件不是 tax invoice。如需课程安排、付款核对或退款协助，请联系 Lofty Education 管理员。</p>
                  <p>This document is not a tax invoice. For scheduling, payment checks, or refund support, please contact Lofty Education.</p>
                </div>
              </div>
            </div>
          </section>

          <footer className='mt-10 flex items-end justify-between border-t border-slate-200 pt-4 text-xs text-slate-500'>
            <div>
              <p className='font-black text-slate-700'>小马哥教育</p>
              <p className='mt-1'>Lofty Education - Australia</p>
            </div>
            <p>Generated securely after successful payment</p>
          </footer>
        </div>
      </div>
    </div>
  );
}
