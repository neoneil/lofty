import type { Metadata } from 'next';

import { LegalPolicyToggle } from '@/components/site/legal-policy-toggle';

export const metadata: Metadata = {
  title: 'Privacy Policy | Lofty Education',
  description: 'Privacy Policy for Lofty Education AI learning and test preparation services.',
};

const zh = {
  badge: 'Lofty Education 隐私政策',
  title: '隐私政策',
  intro: '本政策说明 Lofty Education 如何在英语考试培训、AI 学习工具、付款和学生支持过程中收集与使用信息。',
  sections: [
    { heading: '我们收集的信息', body: '我们会收集账号信息，例如姓名、邮箱、考试类型、学习进度、AI 使用记录、付款状态，以及你在 IELTS 或 PTE 练习中提交的作文、答案、录音或其他学习内容。' },
    { heading: '信息用途', body: '这些信息用于提供课程访问、AI 批改与反馈、作业记录、模考报告、付款开通、账号安全、客户支持和服务改进。' },
    { heading: '付款信息', body: '付款由 Stripe 处理。我们不会在本应用中保存完整银行卡号或支付宝账号凭证。Stripe 会向我们返回付款状态和交易编号，用于自动开通你购买的 AI 权限。' },
    { heading: 'AI 学习数据', body: '你提交的文本、音频、答案、作文和练习记录可能会被用于生成 AI 反馈并保存学习历史。管理员可为了教学、支持和质量控制查看学生学习内容。' },
    { heading: '数据共享', body: '我们只会向运行平台所需的服务提供商共享必要信息，例如 Supabase、Stripe、AI 服务、邮件或存储服务，并仅限于本政策说明的用途。' },
    { heading: '联系我们', body: '如果你有隐私问题，或需要我们协助处理账号数据，请通过 Contact 页面联系我们。' },
  ],
};

const en = {
  badge: 'Lofty Education Privacy Policy',
  title: 'Privacy Policy',
  intro: 'This policy explains how Lofty Education collects and uses information for English test preparation, AI learning tools, payments, and student support.',
  sections: [
    { heading: 'Information we collect', body: 'We collect account information such as name, email address, selected exam type, learning progress, AI usage records, payment status, and information you choose to submit for IELTS or PTE practice.' },
    { heading: 'How we use information', body: 'We use this information to provide course access, AI feedback, homework records, mock test reports, payment fulfilment, support, account security, and service improvement.' },
    { heading: 'Payments', body: 'Payments are processed by Stripe. We do not store full card numbers or Alipay credentials in our application. Stripe provides payment status and transaction references so we can activate the purchased AI access.' },
    { heading: 'AI learning data', body: 'Text, audio, answers, essays, and practice records may be processed to generate feedback and maintain your learning history. Admin users may review student work for teaching, support, and quality control.' },
    { heading: 'Data sharing', body: 'We share data only with service providers needed to operate the platform, such as Supabase, Stripe, AI services, email or storage providers, and only for the purposes described here.' },
    { heading: 'Contact', body: 'If you have privacy questions or want to request account data assistance, please contact us through the Contact page.' },
  ],
};

export default function PrivacyPolicyPage() {
  return <main className='min-h-screen bg-[var(--bg)] px-4 py-10 text-[var(--text)] sm:px-6 lg:px-8 lg:py-14'><LegalPolicyToggle zh={zh} en={en} /></main>;
}
