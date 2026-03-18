"use client";

import { motion } from "framer-motion";

type TarotDeckProps = {
  disabled?: boolean;
};

export default function TarotDeck({ disabled }: TarotDeckProps) {
  return (
    <div className="relative mx-auto h-105 w-45">
      {Array.from({ length: 12 }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: 20 }}
          animate={{
            opacity: 1,
            x: 0,
            rotate: -10 + index * 1.6,
            y: index * 4,
          }}
          transition={{
            duration: 0.45,
            delay: index * 0.03,
          }}
          className="absolute left-0 top-0 h-62.5 w-42.5 rounded-3xl border border-white/10 bg-[linear-gradient(160deg,#24193d,#130f24)] shadow-lg"
          style={{ zIndex: 30 - index }}
        >
          <div className="flex h-full items-center justify-center rounded-3xl border border-yellow-300/10">
            <div className="rounded-full border border-yellow-300/20 px-4 py-2 text-xs tracking-[0.35em] text-yellow-100/70 uppercase">
              Tarot
            </div>
          </div>
        </motion.div>
      ))}

      <div className="absolute -bottom-8 left-1/2 w-full -translate-x-1/2 text-center text-sm text-purple-100/70">
        {disabled ? "正在抽牌..." : "牌堆"}
      </div>
    </div>
  );
}
