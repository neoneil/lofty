import type { Metadata } from 'next';

import { LegalPolicyToggle } from '@/components/site/legal-policy-toggle';

export const metadata: Metadata = {
  title: 'Terms of Service | Lofty Education',
  description: 'Terms of Service for Lofty Education AI learning and test preparation services.',
};

const zh = {
  badge: 'Lofty Education 服务条款',
  title: '服务条款',
  intro: '本条款说明使用 Lofty Education 课程、题库练习、AI 反馈和付费 AI 权限的主要条件。',
  sections: [
    { heading: '服务范围', body: 'Lofty Education 提供英语考试培训资料、IELTS 与 PTE 练习工具、AI 辅助反馈、作业记录、模考报告和相关学习支持。' },
    { heading: 'AI 会员权限', body: 'AI 权限以一次性时间包形式销售，分为 IELTS AI 和 PTE AI。两个产品分别计时，购买其中一个不会延长另一个产品。' },
    { heading: '不自动续费', body: 'AI 权限不会自动续费。购买的有效期到期后，如果用户希望继续使用付费 AI 功能，可以重新购买。' },
    { heading: '教育用途', body: 'AI 反馈用于学习辅助，不能替代官方考试评分或专业考试判断。用户应将 AI 反馈视为学习建议，而不是保证分数。' },
    { heading: '用户责任', body: '用户应提供准确账号信息，合法使用服务，不共享账号、不滥用 AI 功能、不上传有害内容，也不得尝试绕过权限控制。' },
    { heading: '服务调整', body: '我们可能会不时更新功能、价格、内容或可用性。如技术问题影响付费权限，请联系我们，我们会根据账号和付款记录进行核查。' },
  ],
};

const en = {
  badge: 'Lofty Education Terms of Service',
  title: 'Terms of Service',
  intro: 'These terms describe the main conditions for using Lofty Education courses, practice tools, AI feedback, and paid AI membership.',
  sections: [
    { heading: 'Service scope', body: 'Lofty Education provides English test preparation resources, IELTS and PTE practice tools, AI-assisted feedback, homework records, mock test reports, and related learning support.' },
    { heading: 'AI membership', body: 'AI access is sold as one-time time packages for IELTS AI or PTE AI. The two products are tracked separately. Purchasing one product does not extend the other product.' },
    { heading: 'No automatic renewal', body: 'AI access does not automatically renew. When the purchased access period expires, users may purchase another package if they want to continue using paid AI features.' },
    { heading: 'Educational use', body: 'AI feedback is provided for learning support and may not replace professional examination judgement or official score reporting. Users should treat AI feedback as guidance rather than a guaranteed test result.' },
    { heading: 'User responsibilities', body: 'Users must provide accurate account information, use the service lawfully, and avoid sharing accounts, abusing AI features, uploading harmful content, or attempting to bypass access controls.' },
    { heading: 'Changes and availability', body: 'We may update features, pricing, content, or availability from time to time. If a technical issue affects paid access, users should contact us so we can review the account and payment records.' },
  ],
};

export default function TermsOfServicePage() {
  return <main className='min-h-screen bg-[var(--bg)] px-4 py-10 text-[var(--text)] sm:px-6 lg:px-8 lg:py-14'><LegalPolicyToggle zh={zh} en={en} /></main>;
}
