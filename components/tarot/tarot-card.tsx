"use client";

import { motion } from "framer-motion";
import type { DrawnTarotCard } from "@/types/tarot";

type TarotCardProps = {
  card: DrawnTarotCard;
  index: number;
};

const positionLabel = {
  past: "过去",
  present: "现在",
  future: "未来",
};

export default function TarotCard({ card, index }: TarotCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, rotate: -6 }}
      animate={{
        opacity: 1,
        y: 0,
        rotate: card.reversed ? 180 : 0,
      }}
      transition={{
        duration: 0.55,
        delay: index * 0.18,
        ease: "easeOut",
      }}
      className="relative w-42.5 sm:w-47.5"
    >
      <div className="rounded-3xl border border-white/10 bg-linear-to-b from-[#1b1630] to-[#0d0b18] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
        <div className="mb-3 flex items-center justify-between text-xs tracking-[0.25em] text-purple-200/80 uppercase">
          <span>{positionLabel[card.position]}</span>
          <span>{card.reversed ? "逆位" : "正位"}</span>
        </div>

        <div className="flex aspect-2/3 items-center justify-center rounded-[18px] border border-yellow-300/20 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_55%),linear-gradient(180deg,rgba(255,225,160,0.10),rgba(255,255,255,0.02))] p-5 text-center">
          <div>
            <div className="mb-2 text-sm text-yellow-100/70">Major Arcana</div>
            <div className="text-2xl font-semibold text-yellow-50">{card.nameCn}</div>
            <div className="mt-2 text-sm text-purple-100/80">{card.name}</div>
          </div>
        </div>

        <div className="mt-3 text-center text-xs text-purple-100/75">
          {card.reversed ? "Reversed" : "Upright"}
        </div>
      </div>
    </motion.div>
  );
}
