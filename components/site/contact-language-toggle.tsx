'use client';

import { useState } from 'react';

type Language = 'zh' | 'en';

const content = {
  zh: {
    title: '联系 Lofty Education',
    paragraphs: [
      'Neil 老师长期从事 IELTS、PTE 与英语能力提升教学，拥有约 18 年 IELTS 教学经验，并自 PTE Academic 早期进入市场以来，持续从事 PTE 教学、题型研究与机考评分训练。',
      '出国前，Neil 老师曾在北京知名英语培训机构任教，长期负责 IELTS 听、说、读、写及出国考试课程教学；也曾担任 IELTS 考官，对 IELTS 评分标准、学生常见失分点以及考官视角下的语言要求有深入理解。',
      'Neil 老师现定居墨尔本，是澳洲小马哥教育的发起人，同时也是一名人工智能工程师。他将多年一线教学经验与 AI 技术背景结合，持续研究 PTE 机考规则、AI 评分逻辑与学生答题数据，帮助学生更清楚地理解自己为什么失分，以及下一步应该如何提升。',
      'Neil 老师的教学注重清晰、实用和可执行的学习路径，不强调空泛技巧，而是帮助学生建立稳定、可复用的英语表达能力和考试应对能力。',
    ],
    points: ['微信：auschi666', 'IELTS / PTE 课程咨询', 'AI 学习助手与学习规划'],
  },
  en: {
    title: 'Contact Lofty Education',
    paragraphs: [
      'Neil has been teaching IELTS, PTE, and English proficiency courses for many years. He has around 18 years of IELTS teaching experience and has been continuously involved in PTE teaching, question-type research, and computer-based scoring training since the early stages of PTE Academic\'s entry into the market.',
      'Before moving overseas, Neil taught at a well-known English training institution in Beijing, where he was responsible for IELTS listening, speaking, reading, writing, and other international test preparation courses. He also previously served as an IELTS examiner, giving him a deep understanding of IELTS assessment criteria, common student weaknesses, and the language expectations from an examiner\'s perspective.',
      'Neil is now based in Melbourne. He is the founder of Xiao Ma Ge Education Australia and is also an artificial intelligence engineer. By combining years of frontline teaching experience with a technical background in AI, he continues to study PTE computer-based testing rules, AI scoring logic, and student response data, helping students understand more clearly why they lose marks and what they should improve next.',
      'Neil\'s teaching focuses on clear, practical, and actionable learning pathways. Rather than relying on vague test-taking tricks, he helps students build stable, reusable English skills and effective exam strategies.',
    ],
    points: ['WeChat: auschi666', 'IELTS / PTE course advice', 'AI learning access and study planning'],
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
          <div className='mt-2 space-y-3 text-sm leading-7 text-[var(--text-soft)]'>
            {current.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </div>
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
