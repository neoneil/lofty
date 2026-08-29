'use client';

import Image from 'next/image';
import { ChevronDown, MessageCircle } from 'lucide-react';
import { useState } from 'react';

export function TuitionContactCard() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className='mt-4 rounded-[var(--radius-md)] border border-[var(--primary)]/25 bg-[var(--primary-soft)] p-3 shadow-[var(--shadow-xs)]'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
        <div className='min-w-0'>
          <div className='flex items-center gap-2 text-sm font-bold text-[var(--text)]'>
            <MessageCircle size={17} className='text-[var(--primary)]' />
            联系老师确认后再支付学费
          </div>
          <p className='mt-1.5 text-xs leading-5 text-[var(--text-soft)]'>
            每位学生正式报课前，都会先由小马哥教育发起人 Neil 老师安排 1 小时免费试听与学习诊断，了解基础、目标分数和备考时间，再制定个人学习计划。试听不收费，也不会计入后续课时；是否报课由学生自行决定。
          </p>
        </div>
        <button
          type='button'
          onClick={() => setIsOpen((value) => !value)}
          aria-expanded={isOpen}
          className='inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] px-3 text-xs font-semibold text-[var(--text)] shadow-[var(--shadow-xs)] transition hover:border-[var(--primary)]/45 hover:bg-[var(--card-hover)]'
        >
          联系老师
          <ChevronDown size={15} className={(isOpen ? 'rotate-180' : '') + ' transition-transform duration-300'} />
        </button>
      </div>

      <div className={(isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0') + ' grid transition-all duration-300 ease-out'}>
        <div className='overflow-hidden'>
          <div className='mt-3 grid gap-4 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-3 sm:grid-cols-[184px_1fr] sm:items-center sm:p-4'>
            <Image
              src='/qr.png'
              alt='微信咨询二维码'
              width={420}
              height={420}
              className='mx-auto aspect-square w-full max-w-[220px] rounded-[var(--radius-md)] border border-[var(--border)] bg-white p-2 shadow-[var(--shadow-xs)] sm:mx-0 sm:max-w-[184px]'
            />
            <div className='text-center sm:text-left'>
              <p className='text-sm font-semibold text-[var(--text)]'>微信咨询：auschi666</p>
              <p className='mt-1 text-xs leading-5 text-[var(--text-soft)]'>
                添加时可备注：姓名、目标考试、目标分数和预计考试时间。确认学习方案后，再选择对应课时付款。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
