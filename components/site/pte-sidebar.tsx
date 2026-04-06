import Link from "next/link";
import {
  MainTab,
  PTESubTab,
  pteMainTabs,
  pteSubTabMap,
} from "./pte-config";

type Props = {
  currentMain: MainTab;
  currentSub?: PTESubTab;
};

function MainNavItem({
  label,
  href,
  active,
}: {
  label: string;
  href: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition ${
        active
          ? "bg-[var(--theme)] text-white shadow-sm"
          : "text-gray-600 hover:bg-[var(--theme)]/6 hover:text-[var(--theme)]"
      }`}
    >
      <span>{label}</span>

      <svg
        viewBox="0 0 20 20"
        className={`h-4 w-4 ${active ? "text-white/80" : "text-gray-400"}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path d="m7 5 5 5-5 5" />
      </svg>
    </Link>
  );
}

function SubNavItem({
  label,
  href,
  active,
}: {
  label: string;
  href: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`block rounded-2xl px-4 py-3 text-sm font-semibold transition ${
        active
          ? "bg-[var(--theme)] text-white shadow-sm"
          : "text-gray-600 hover:bg-[var(--theme)]/6 hover:text-[var(--theme)]"
      }`}
    >
      {label}
    </Link>
  );
}

function SidebarDecoration() {
  return (
    <div className="overflow-hidden rounded-3xl bg-[linear-gradient(180deg,#faf7f1_0%,#f4efe5_100%)] p-4">
      <div className="mb-4 text-sm font-medium text-gray-500">
        学习中心
      </div>

      <div className="relative h-44">
        <div className="absolute bottom-0 left-0 right-0 h-14 rounded-[18px] bg-white/70 backdrop-blur-sm" />

        <div className="absolute bottom-6 left-4 h-12 w-24 rounded-lg border border-[#cfc7b4] bg-[#d8d1be] shadow-sm" />
        <div className="absolute bottom-10 left-8 h-12 w-24 rounded-lg border border-[#cfc7b4] bg-[#c9c3b2] shadow-sm" />
        <div className="absolute bottom-14 left-12 h-12 w-24 rounded-lg border border-[#cfc7b4] bg-[#bbb7a8] shadow-sm" />

        <div className="absolute bottom-8 left-16 text-xs font-semibold tracking-wide text-white">
          IELTS
        </div>
        <div className="absolute bottom-12 left-20 text-xs font-semibold tracking-wide text-white">
          PTE
        </div>
        <div className="absolute bottom-16 left-24 text-xs font-semibold tracking-wide text-white">
          ENGLISH
        </div>

        <div className="absolute bottom-24 left-3 h-16 w-16 rounded-full border border-[#d8d0c2] bg-[#efeadf]" />
        <div className="absolute bottom-32 left-8 h-8 w-1 rounded-full bg-[#d9d2c6]" />
        <div className="absolute bottom-38 left-10 h-6 w-10 rotate-[-25deg] rounded-full bg-[#e7e0d3]" />
        <div className="absolute bottom-28 left-12 h-7 w-1 rounded-full bg-[#d9d2c6]" />
        <div className="absolute bottom-34 left-14 h-5 w-9 rotate-[20deg] rounded-full bg-[#e7e0d3]" />
      </div>
    </div>
  );
}

export default function PTESidebar({
  currentMain,
  currentSub,
}: Props) {
  const subTabs = pteSubTabMap[currentMain];

  return (
    <aside className="w-full">
      <div className="overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm">
        {/* 主导航 */}
        <div className="space-y-1 border-b border-gray-100 p-4">
          {pteMainTabs.map((tab) => (
            <MainNavItem
              key={tab.href}
              label={tab.label}
              href={tab.href}
              active={currentMain === tab.key}
            />
          ))}
        </div>

        {/* 子导航 */}
        <div className="space-y-2 p-4">
          {subTabs.map((tab) => (
            <SubNavItem
              key={tab.href}
              label={tab.label}
              href={tab.href}
              active={currentSub === tab.key}
            />
          ))}
        </div>

        {/* 装饰区 */}
        <div className="px-4 pb-4 pt-2">
          <SidebarDecoration />

          <button className="mt-4 inline-flex w-full items-center justify-center rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-600 transition hover:border-[var(--theme)]/30 hover:text-[var(--theme)]">
            帮助中心
          </button>
        </div>
      </div>
    </aside>
  );
}