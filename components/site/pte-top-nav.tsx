import Image from "next/image";
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

function getMainTabIcon(label: string) {
  switch (label.toLowerCase()) {
    case "listening":
      return "/SVG/listening.svg";

    case "reading":
      return "/SVG/reading.svg";

    case "speaking":
      return "/SVG/speaking.svg";

    case "writing":
      return "/SVG/writing.svg";

    default:
      return "/SVG/listening.svg";
  }
}

function MainTabItem({
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
      className={`
        flex flex-shrink-0 items-center gap-2
        whitespace-nowrap rounded-2xl
        px-4 py-2.5
        text-sm font-semibold
        transition

        ${active
          ? "bg-[var(--theme)] text-white shadow-sm"
          : " text-gray-600 hover:bg-[var(--theme)]/6 hover:text-[var(--theme)]"
        }
      `}
    >
      <Image
        src={getMainTabIcon(label)}
        alt={label}
        width={18}
        height={18}
        className={`
          h-[18px] w-[18px] object-contain transition

          ${active
            ? "brightness-0 invert"
            : "opacity-70"
          }
        `}
      />

      <span>{label}</span>
    </Link>
  );
}

function SubTabItem({
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
      className={`
        flex-shrink-0 whitespace-nowrap rounded
        px-3 py-2
        text-[13px] font-medium
        transition

        ${active
          ? "bg-[var(--theme)] text-white shadow-sm"
          : "text-gray-600 hover:bg-[var(--theme)]/6 hover:text-[var(--theme)]"
        }
      `}
    >
      {label}
    </Link>
  );
}

export default function PTETopNav({
  currentMain,
  currentSub,
}: Props) {
  const subTabs = pteSubTabMap[currentMain];

  return (
    <div
      className="
    mb-5
    rounded-[8px]
    bg-gradient-to-r
    from-white/88
    via-white/10
    via-[32%]
    to-transparent
  "
    >

      {/* Main Tabs */}
      <div
        className="
          flex gap-2 overflow-x-auto
          p-3
          sm:flex-wrap
          sm:overflow-visible
        "
      >
        {pteMainTabs.map((tab) => (
          <MainTabItem
            key={tab.href}
            label={tab.label}
            href={tab.href}
            active={currentMain === tab.key}
          />
        ))}
      </div>

      {/* Sub Tabs */}
      <div
        className="
          flex gap-2 overflow-x-auto
          p-3

          sm:flex-wrap
          sm:overflow-visible
        "
      >
        {subTabs.map((tab) => (
          <SubTabItem
            key={tab.href}
            label={tab.label}
            href={tab.href}
            active={currentSub === tab.key}
          />
        ))}
      </div>
    </div>
  );
}