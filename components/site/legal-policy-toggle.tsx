'use client';

import Link from 'next/link';
import { useState } from 'react';

type Language = 'zh' | 'en';

type PolicyContent = {
  badge: string;
  title: string;
  intro: string;
  sections: Array<{
    heading: string;
    body: string;
  }>;
};

type Props = {
  zh: PolicyContent;
  en: PolicyContent;
};

export function LegalPolicyToggle({ zh, en }: Props) {
  const [language, setLanguage] = useState<Language>('zh');
  const content = language === 'zh' ? zh : en;

  return (
    <article className='mx-auto max-w-4xl rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-sm)] sm:p-8'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
        <div>
          <p className='text-sm font-semibold text-[var(--primary)]'>{content.badge}</p>
          <h1 className='mt-3 text-2xl font-bold tracking-tight sm:text-3xl'>{content.title}</h1>
        </div>
        <div className='flex w-fit rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-1'>
          <button type='button' onClick={() => setLanguage('zh')} className={'h-9 rounded-[var(--radius-sm)] px-4 text-sm font-bold transition ' + (language === 'zh' ? 'bg-[var(--primary)] text-white shadow-[var(--shadow-sm)]' : 'text-[var(--text-soft)] hover:bg-[var(--card)] hover:text-[var(--text)]')}>中文</button>
          <button type='button' onClick={() => setLanguage('en')} className={'h-9 rounded-[var(--radius-sm)] px-4 text-sm font-bold transition ' + (language === 'en' ? 'bg-[var(--primary)] text-white shadow-[var(--shadow-sm)]' : 'text-[var(--text-soft)] hover:bg-[var(--card)] hover:text-[var(--text)]')}>English</button>
        </div>
      </div>

      <p className='mt-4 text-sm leading-7 text-[var(--text-soft)]'>{content.intro}</p>
      <div className='mt-8 space-y-5'>
        {content.sections.map((section) => (
          <section key={section.heading}>
            <h2 className='text-lg font-bold'>{section.heading}</h2>
            <p className='mt-2 text-sm leading-7 text-[var(--text-soft)]'>{section.body}</p>
          </section>
        ))}
      </div>
      <div className='mt-8 flex flex-wrap gap-3 text-sm font-semibold text-[var(--primary)]'>
        <Link href='/membership'>Membership / 成为会员</Link>
        <Link href='/contact'>Contact / 联系我们</Link>
      </div>
    </article>
  );
}
