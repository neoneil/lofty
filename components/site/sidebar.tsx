import Image from "next/image";
import Link from "next/link";

const items = [
  {
    title: "智能练习",
    desc: "AI personalized practice",
    icon: "/SVG/12.svg",
  },
  {
    title: "高频词汇",
    desc: "Core vocabulary bank",
    icon: "/SVG/37.svg",
  },
  {
    title: "错题中心",
    desc: "Review weak questions",
    icon: "/SVG/58.svg",
  },
  {
    title: "学习记录",
    desc: "Daily learning history",
    icon: "/SVG/74.svg",
  },
  {
    title: "收藏题目",
    desc: "Saved practice items",
    icon: "/SVG/96.svg",
  },
  {
    title: "Shadowing",
    desc: "Speaking imitation lab",
    icon: "/SVG/121.svg",
  },
  {
    title: "模考中心",
    desc: "Full mock exams",
    icon: "/SVG/136.svg",
  },
  {
    title: "数据分析",
    desc: "Performance analytics",
    icon: "/SVG/149.svg",
  },
];

function SidebarButton({
  title,
  desc,
  icon,
}: {
  title: string;
  desc: string;
  icon: string;
}) {
  return (
    <Link
      href="#"
      className="
        group flex items-center gap-3
        rounded-2xl
        border border-gray-100
        bg-white
        px-3 py-2.5
        transition

        hover:border-[var(--theme)]/20
        hover:bg-[var(--theme)]/[0.03]
      "
    >
      <div
        className="
          flex h-10 w-10 flex-shrink-0
          items-center justify-center
          rounded
          bg-[#f7f4ef]
        "
      >
        <Image
          src={icon}
          alt={title}
          width={20}
          height={20}
          className="
            h-5 w-5 object-contain
            opacity-80
            transition
            group-hover:scale-110
          "
        />
      </div>

      <div className="min-w-0 flex-1">
        <div
          className="
            truncate
            text-[13px]
            font-semibold
            text-gray-800
          "
        >
          {title}
        </div>

        <div
          className="
            truncate
            text-[11px]
            text-gray-400
          "
        >
          {desc}
        </div>
      </div>
    </Link>
  );
}

export default function PTEFeatureSidebar() {
  return (
    <aside className="w-full">
      <div
        className="
          overflow-hidden
          rounded-[28px]
          border border-gray-200
          bg-white
          shadow-sm
        "
      >
        {/* Header */}
        <div className="border-b border-gray-100 px-4 py-4">
          <div className="text-sm font-semibold text-gray-800">
            学习中心
          </div>

          <div className="mt-1 text-xs text-gray-400">
            PTE Smart Learning System
          </div>
        </div>

        {/* Content */}
        <div className="space-y-2 p-3">
          {items.map((item) => (
            <SidebarButton
              key={item.title}
              title={item.title}
              desc={item.desc}
              icon={item.icon}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 p-3">
          <div
            className="
              rounded-2xl
              bg-[linear-gradient(135deg,var(--theme),#4f6b5f)]
              p-4
              text-white
            "
          >
            <div className="text-sm font-semibold">
              AI 学习助手
            </div>

            <div className="mt-1 text-xs text-white/80">
              Personalized study recommendations
            </div>

            <button
              className="
                mt-3 w-full rounded
                bg-white/15
                px-3 py-2
                text-xs font-medium
                backdrop-blur-sm
                transition
                hover:bg-white/20
              "
            >
              即将上线
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}