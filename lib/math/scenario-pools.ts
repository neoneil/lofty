import { MathWordProblemType } from "@/types/math";

export const scenarioPools: Record<MathWordProblemType, string[]> = {
  speed_distance_time: [
    "car trip",
    "train journey",
    "bicycle ride",
    "walking to school",
    "plane flight",
    "bus route",
  ],
  ratio_sharing: [
    "sharing apples",
    "dividing money",
    "classroom grouping",
    "sharing toys",
  ],
  percentage_change: [
    "shop discount",
    "price increase",
    "exam score improvement",
    "sale price",
  ],
  money_cost: [
    "shopping at a store",
    "buying school supplies",
    "buying lunch",
  ],
  age_problem: ["siblings", "parent and child"],
  work_rate: ["cleaning room", "packing boxes"],
  fraction_context: ["pizza sharing", "reading a book"],
  measurement_geometry: ["fencing a garden", "tiling a floor"],
  average_data: ["test scores", "daily temperatures"],
  simple_probability: ["colored marbles", "dice roll"],
};

export function getRandomScenario(topic: MathWordProblemType) {
  const pool = scenarioPools[topic];
  return pool[Math.floor(Math.random() * pool.length)];
}