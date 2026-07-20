"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, FileText, HelpCircle, MessageCircle, X } from "lucide-react";

import { BrandLockup } from "@/components/site/brand-lockup";
import { BRAND_NAME_CN } from "@/lib/brand";
import { cn } from "@/lib/utils";

type PanelType = "trial" | "resources";

const actions = [
  {
    type: "trial" as const,
    title: "免费试听课程",
    shortTitle: "试听",
    icon: MessageCircle,
  },
  {
    type: "resources" as const,
    title: "免费领取资料",
    shortTitle: "资料",
    icon: FileText,
  },
];

function WechatMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path d="M13.7 8.2C7.9 8.2 3.4 11.7 3.4 16.1c0 2.5 1.4 4.7 3.7 6.1l-.8 2.7 3.2-1.5c1.2.4 2.6.7 4.2.7 5.7 0 10.3-3.6 10.3-8s-4.6-7.9-10.3-7.9Zm-3.5 6.6a1.1 1.1 0 1 1 0-2.2 1.1 1.1 0 0 1 0 2.2Zm7 0a1.1 1.1 0 1 1 0-2.2 1.1 1.1 0 0 1 0 2.2Z" fill="currentColor" opacity=".9" />
      <path d="M21 15.2c4.5 0 7.6 2.8 7.6 6.1 0 1.8-1 3.5-2.6 4.6l.6 2-2.4-1.1c-1 .3-2 .5-3.2.5-3.6 0-6.6-1.8-7.4-4.5 5.6 0 10.3-3.3 10.3-7.5v-.1H21Zm-2.3 5.3a.9.9 0 1 0 0-1.8.9.9 0 0 0 0 1.8Zm5.2 0a.9.9 0 1 0 0-1.8.9.9 0 0 0 0 1.8Z" fill="currentColor" opacity=".55" />
    </svg>
  );
}

function PopupContent({ type }: { type: PanelType }) {
  const title = type === "trial" ? "扫码领取免费试听课程" : "扫码领取备考资料";
  const subtitle = type === "trial" ? "添加老师，预约适合你的 IELTS / PTE 试听安排。" : "添加老师，领取 IELTS / PTE 备考资料包。";

  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] md:items-center">
      <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-white p-3 shadow-[var(--shadow-md)]">
        <Image src="/qr.png" alt="微信二维码" width={420} height={420} className="aspect-square w-full rounded-[var(--radius-md)] object-contain" />
      </div>

      <div className="min-w-0">
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--primary)]/20 bg-[var(--primary-soft)] px-3 py-1 text-xs font-bold text-[var(--primary)]">
          <WechatMark className="h-4 w-4" />
          WeChat: auschi666
        </div>

        <h2 className="mt-4 text-2xl font-black tracking-tight text-[var(--text)] sm:text-3xl">
          扫码加老师好友
        </h2>

        <p className="mt-3 text-sm leading-7 text-[var(--text-soft)] sm:text-base">
          {subtitle}
        </p>

        <div className="mt-5 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-soft)] p-4">
          <div className="text-sm font-bold text-[var(--text)]">
            添加老师
          </div>
          <div className="mt-2 text-lg font-black text-[var(--primary)]">
            澳洲小马哥
          </div>
          <div className="mt-4 grid gap-2 text-sm leading-6 text-[var(--text-soft)]">
            <p>免费试听课程与学习诊断</p>
            <p>领取备考资料、题型清单与规划建议</p>
            <p>适合 PTE、IELTS、留学移民英语备考</p>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-xs font-semibold text-[var(--text-soft)]">
          <MessageCircle size={16} className="shrink-0 text-[var(--primary)]" />
          {title}
        </div>
      </div>
    </div>
  );
}

export function MarketingFloatingActions() {
  const [activePanel, setActivePanel] = useState<PanelType | null>(null);

  useEffect(() => {
    if (!activePanel) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActivePanel(null);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [activePanel]);

  const openPanel = (type: PanelType) => setActivePanel(type);

  return (
    <>
      <div className="fixed bottom-4 left-4 right-4 z-40 grid grid-cols-3 gap-2 md:hidden">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button key={action.type} type="button" onClick={() => openPanel(action.type)} className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] px-2 py-2 text-center text-[11px] font-bold text-[var(--text)] shadow-[var(--shadow-lg)] backdrop-blur-xl transition active:scale-[0.98]">
              {action.type === "trial" ? <WechatMark className="h-5 w-5 text-[var(--primary)]" /> : <Icon size={18} className="text-[var(--primary)]" />}
              <span>{action.shortTitle}</span>
            </button>
          );
        })}
        <Link href="/#faq" className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] px-2 py-2 text-center text-[11px] font-bold text-[var(--text)] shadow-[var(--shadow-lg)] backdrop-blur-xl transition active:scale-[0.98]">
          <HelpCircle size={18} className="text-[var(--primary)]" />
          <span>常见问题</span>
        </Link>
      </div>

      <div className="fixed right-4 top-1/2 z-40 hidden -translate-y-1/2 md:block">
        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-lg)] backdrop-blur-xl">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button key={action.type} type="button" onClick={() => openPanel(action.type)} className={cn("group flex w-[88px] flex-col items-center gap-2 px-2 py-4 text-center transition hover:bg-[var(--primary-soft)]", index ? "border-t border-[var(--border)]" : "")}>
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-soft)] text-[var(--primary)] transition group-hover:border-[var(--primary)]/35 group-hover:bg-[var(--card)]">
                  {action.type === "trial" ? <WechatMark className="h-7 w-7" /> : <Icon size={19} />}
                </span>
                <span className="text-xs font-bold leading-5 text-[var(--text)]">{action.title}</span>
              </button>
            );
          })}

          <Link href="/#faq" className="group flex w-[88px] flex-col items-center gap-2 border-t border-[var(--border)] px-2 py-4 text-center transition hover:bg-[var(--primary-soft)]">
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-soft)] text-[var(--primary)] transition group-hover:border-[var(--primary)]/35 group-hover:bg-[var(--card)]">
              <HelpCircle size={20} />
            </span>
            <span className="text-xs font-bold leading-5 text-[var(--text)]">常见问题</span>
          </Link>
        </div>
      </div>

      <div className={cn("fixed inset-0 z-50 flex items-start justify-center bg-black/45 px-4 pt-20 backdrop-blur-sm transition duration-300 sm:pt-24", activePanel ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0")} onClick={() => setActivePanel(null)}>
        <div className={cn("w-full max-w-4xl rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow-xl)] transition duration-300 sm:p-6", activePanel ? "translate-y-0 opacity-100" : "-translate-y-8 opacity-0")} onClick={(event) => event.stopPropagation()}>
          <div className="mb-5 flex items-start justify-between gap-4 border-b border-[var(--border)] pb-4">
            <BrandLockup label={`${BRAND_NAME_CN}雅思PTE`} />
            <button type="button" onClick={() => setActivePanel(null)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-soft)] text-[var(--text-soft)] transition hover:border-[var(--primary)]/35 hover:text-[var(--primary)]" aria-label="关闭弹窗">
              <X size={18} />
            </button>
          </div>

          {activePanel ? <PopupContent type={activePanel} /> : null}

          <div className="mt-5 flex flex-col gap-3 border-t border-[var(--border)] pt-4 text-xs text-[var(--text-faint)] sm:flex-row sm:items-center sm:justify-between">
            <span>{BRAND_NAME_CN}雅思/PTE</span>
            <Link href="/contact" className="inline-flex items-center gap-1 font-bold text-[var(--primary)] transition hover:text-[var(--primary-hover)]">
              查看更多咨询方式<ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
