import type { DrawnTarotCard, TarotCard, TarotPosition } from "@/types/tarot";

const positions: TarotPosition[] = ["past", "present", "future"];

export function drawThreeCards(cards: TarotCard[]): DrawnTarotCard[] {
  const shuffled = [...cards]
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);

  return shuffled.map((card, index) => ({
    ...card,
    reversed: Math.random() < 0.5,
    position: positions[index],
  }));
}
