'use client';

import { useState } from 'react';

type Language = 'zh' | 'en';

const content = {
  zh: {
    title: '联系 Lofty Education',
    body: '如果你想咨询 IELTS、PTE 课程、AI 学习助手、付款问题或账号权限，可以通过微信或表单联系我们。请尽量提供考试类型、目标分数、预计考试时间和目前最需要解决的问题。',
    points: ['微信：auschi666', '适合咨询课程、AI 权限、付款和学习计划', '我们会根据你的情况给出下一步建议'],
  },
  en: {
    title: 'Contact Lofty Education',
    body: 'For IELTS, PTE courses, AI learning access, payment issues, or account support, please contact us by WeChat or the form below. Please include your exam type, target score, planned test date, and the main problem you want to solve.',
    points: ['WeChat: auschi666', 'For course advice, AI access, payments, and study plans', 'We will review your situation and suggest the next step'],
  },
};

export function ContactLanguageToggle() {
  const [language, setLanguage] = useState<Language>('zh');
  const current = content[language];

  return (
    <div className='mt-6 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-4'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
        <div>
          <h2 className='text-base font-bold text-[var(--text)]'>{current.title}</h2>
          <p className='mt-2 text-sm leading-7 text-[var(--text-soft)]'>{current.body}</p>
        </div>
        <div className='flex w-fit shrink-0 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-1'>
          <button type='button' onClick={() => setLanguage('zh')} className={'h-9 rounded-[var(--radius-sm)] px-4 text-sm font-bold transition ' + (language === 'zh' ? 'bg-[var(--primary)] text-white shadow-[var(--shadow-sm)]' : 'text-[var(--text-soft)] hover:bg-[var(--bg-soft)] hover:text-[var(--text)]')}>中文</button>
          <button type='button' onClick={() => setLanguage('en')} className={'h-9 rounded-[var(--radius-sm)] px-4 text-sm font-bold transition ' + (language === 'en' ? 'bg-[var(--primary)] text-white shadow-[var(--shadow-sm)]' : 'text-[var(--text-soft)] hover:bg-[var(--bg-soft)] hover:text-[var(--text)]')}>English</button>
        </div>
      </div>
      <ul className='mt-4 grid gap-2 text-sm leading-6 text-[var(--text-soft)] md:grid-cols-3'>
        {current.points.map((point) => <li key={point} className='rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--card)] px-3 py-2'>{point}</li>)}
      </ul>
    </div>
  );
}
