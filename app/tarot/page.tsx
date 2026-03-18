import TarotClient from "@/components/tarot/tarot-client";

export const metadata = {
  title: "Tarot Reading",
  description: "Draw three tarot cards and get an AI reading.",
};

export default function TarotPage() {
  return <TarotClient />;
}
