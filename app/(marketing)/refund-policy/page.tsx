import type { Metadata } from 'next';

import { LegalPolicyToggle } from '@/components/site/legal-policy-toggle';

export const metadata: Metadata = {
  title: 'Refund Policy | Lofty Education',
  description: 'Refund Policy for Lofty Education AI membership and learning services.',
};

const zh = {
  badge: 'Lofty Education 退款政策',
  title: '退款政策',
  intro: '本政策说明我们如何处理 AI 权限、课程支持和付款问题相关的退款或调整请求。',
  sections: [
    { heading: 'AI 数字服务', body: 'AI 会员属于付款后自动开通到用户账号的数字学习服务。由于服务可即时使用并会产生 AI 成本，已开通的 AI 权限一般不支持退款。' },
    { heading: '可审核情况', body: '如果出现重复付款、明显系统错误、误重复购买，或付款成功但权限未正确开通，我们会根据记录进行审核并处理。' },
    { heading: '如何申请协助', body: '请通过 Contact 页面联系我们，并提供账号邮箱、付款日期、购买产品和问题说明。我们会结合 Stripe 付款记录和系统权限日志核查。' },
    { heading: '退款方式', body: '如果退款申请获批，通常会通过 Stripe 原路退回到原付款方式。银行卡、支付宝和银行处理时间取决于支付网络与 Stripe。' },
    { heading: '课程与辅导服务', body: '非 AI 的课程或辅导安排，退款或改期会根据已约定的课程计划、上课安排和服务是否已经交付来处理。' },
  ],
};

const en = {
  badge: 'Lofty Education Refund Policy',
  title: 'Refund Policy',
  intro: 'This policy explains how we handle refund and adjustment requests for AI access, course support, and payment issues.',
  sections: [
    { heading: 'AI digital access', body: 'AI membership is a digital learning service that is activated on the user account after successful payment. Because access can be used immediately and creates service costs, activated AI access is generally not refundable.' },
    { heading: 'Eligible review cases', body: 'We will review refund or adjustment requests for duplicate payments, clear system errors, accidental double purchase, or cases where paid access was not activated correctly.' },
    { heading: 'How to request help', body: 'Please contact us through the Contact page with the account email, payment date, product purchased, and a short explanation. We may use Stripe payment records and internal access logs to verify the request.' },
    { heading: 'Processing method', body: 'If a refund is approved, it will usually be returned through the original payment method via Stripe. Bank, card, and Alipay processing times depend on the payment network and Stripe.' },
    { heading: 'Course and coaching services', body: 'For non-AI coaching or course arrangements, refund or rescheduling terms may depend on the agreed class plan, teaching schedule, and whether the service has already been delivered.' },
  ],
};

export default function RefundPolicyPage() {
  return <main className='min-h-screen bg-[var(--bg)] px-4 py-10 text-[var(--text)] sm:px-6 lg:px-8 lg:py-14'><LegalPolicyToggle zh={zh} en={en} /></main>;
}
