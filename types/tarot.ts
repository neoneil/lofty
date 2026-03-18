export type TarotPosition = "past" | "present" | "future";

export type TarotCard = {
  id: number;
  name: string;
  nameCn: string;
  arcana: "major";
  meaningUp: string[];
  meaningReversed: string[];
};

export type DrawnTarotCard = TarotCard & {
  reversed: boolean;
  position: TarotPosition;
};
