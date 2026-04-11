
import { Difficulty, MathWordProblemType } from "@/types/math";

function getDifficultyInstructions(difficulty: Difficulty): string {
  if (difficulty === "easy") {
    return `
Easy difficulty requirements:
- The problem should require 1 clear step, or a very direct 2-step process.
- The student should quickly see what operation or formula to use.
- Use straightforward wording and obvious quantities.
- Do not include hidden intermediate values.
- Do not combine multiple skills in a complicated way.
`;
  }

  if (difficulty === "medium") {
    return `
Medium difficulty requirements:
- The problem should require 2 clear reasoning steps.
- The student should need to identify the setup before calculating.
- Include one intermediate quantity if appropriate.
- The wording should be realistic and slightly less direct than easy.
- The problem may combine simple ideas, but should still feel manageable.
`;
  }

  return `
Hard difficulty requirements:
- The problem must require at least 3 reasoning steps.
- The student must find at least one intermediate value before the final answer.
- The problem must combine at least two ideas, quantities, or stages.
- The final answer must NOT be obtainable by one direct formula substitution.
- The challenge must come from reasoning, not confusing language.
- Keep the wording clear, realistic, and fully solvable.

Do NOT generate:
- one-step direct formula questions
- very short and obvious questions
- simple “find the total” questions
- questions solvable immediately after reading

Before finalizing, check:
- Is this truly hard for a Year 7-9 selective exam student?
- Does it require multi-step reasoning?
- Is there at least one intermediate value?
- Is the wording still clear and realistic?
If not, revise the problem before returning it.
`;
}

function getTopicInstructions(topic: MathWordProblemType, difficulty: Difficulty): string {
  const hardOnly =
    difficulty === "hard"
      ? `
Hard topic-specific requirements:
${getHardTopicInstructions(topic)}
`
      : "";

  return `
Topic requirements:
${getBaseTopicInstructions(topic)}

${hardOnly}
`;
}

function getBaseTopicInstructions(topic: MathWordProblemType): string {
  switch (topic) {
    case "speed_distance_time":
      return `
- Use travel or movement contexts such as car, train, bus, bicycle, plane, or walking.
- Use the relationship distance = speed × time, or its rearranged forms.
- Use realistic values and clear units.
- Prefer questions involving total distance, total time, missing speed, or multi-stage travel.
`;

    case "ratio_sharing":
      return `
- Use sharing or grouping contexts such as apples, money, students, toys, prizes, or beads.
- Use part-to-part ratio, part-to-whole ratio, or proportional sharing.
- Ensure the quantities divide cleanly unless a decimal answer is clearly intended.
- The wording must clearly state the ratio relationship.
`;

    case "percentage_change":
      return `
- Use contexts such as discounts, price increases, mark improvements, population change, or sale prices.
- Use percentage of a quantity, percentage increase, percentage decrease, or reverse percentage.
- Keep the numbers realistic and school-friendly.
- Avoid overly messy decimals unless necessary.
`;

    case "money_cost":
      return `
- Use contexts such as shopping, tickets, lunch orders, school supplies, or unit pricing.
- Use dollars as the main currency context.
- The problem may involve total cost, change, comparing options, or cost per item.
- Keep prices realistic.
`;

    case "age_problem":
      return `
- Use contexts such as siblings, parent and child, cousins, or friends.
- Use present age, future age, past age, sums of ages, or age differences.
- Keep the logic realistic and age relationships possible.
- The problem should be solvable with school-level reasoning or simple algebra.
`;

    case "work_rate":
      return `
- Use contexts such as packing boxes, cleaning rooms, filling tanks, painting fences, or producing items.
- Use the idea of rate × time = work, or combined rates.
- Keep the numbers manageable.
- Avoid university-level work-rate complexity.
`;

    case "fraction_context":
      return `
- Use contexts such as pizza, cake, books, ribbons, money, drinks, or homework.
- Use fraction of a quantity, remaining fraction, comparing fractions, or finding the whole from a fractional part.
- Keep fractions clean and suitable for Year 7-9 students.
`;

    case "measurement_geometry":
      return `
- Use practical contexts such as fencing, tiling, painting, flooring, gardens, walls, boxes, or tanks.
- Use perimeter, area, volume, or basic unit conversion.
- Keep the shapes simple and school-level.
- Use metric units.
`;

    case "average_data":
      return `
- Use contexts such as test scores, temperatures, books read, daily sales, or sports scores.
- Use arithmetic mean, missing value from average, or comparing averages.
- Keep the dataset small and clear.
`;

    case "simple_probability":
      return `
- Use contexts such as marbles, cards, spinners, coins, dice, or selecting from a group.
- Use equally likely outcomes only.
- Use simple probability or complementary probability.
- Keep the problem introductory and school-level.
`;

    default:
      return `
- Generate a realistic school-level word problem.
- Ensure the problem matches the requested topic.
`;
  }
}

function getHardTopicInstructions(topic: MathWordProblemType): string {
  switch (topic) {
    case "speed_distance_time":
      return `
- Use multiple travel stages, OR include a stop/rest period, OR require time-unit conversion.
- The student may need to find distance for each stage before answering the final question.
- The final question should involve total time, average-like travel reasoning, or a missing quantity.
`;

    case "ratio_sharing":
      return `
- Require finding the total number of ratio parts before calculating the final answer.
- Include a changed condition, such as some items added/removed before the final question, OR reverse from one known part back to the whole.
- Avoid direct “ratio + total = answer in one step” structures.
`;

    case "percentage_change":
      return `
- Combine two percentage ideas, such as discount plus final payment, or increase followed by decrease.
- Or require finding the original amount from the final amount.
- Avoid simple “find 20% of 50” style questions.
`;

    case "money_cost":
      return `
- Combine at least two ideas, such as unit price plus quantity plus remaining money or change.
- Include comparison between options, bundled pricing, or a hidden intermediate total.
- Avoid simple one-line addition-only shopping questions.
`;

    case "age_problem":
      return `
- Require using present age and future/past relationships together.
- Include a sum or difference condition plus a second age condition.
- The student should need at least 3 reasoning steps or a simple equation setup.
`;

    case "work_rate":
      return `
- Use combined rates, partial completion, or different working times.
- The student should need to find one person's rate or a remaining amount before the final answer.
- Avoid single direct rate substitution questions.
`;

    case "fraction_context":
      return `
- Combine two fraction operations, such as using part of a remainder, or reconstructing a whole from a later fraction.
- Include one hidden intermediate amount.
- Avoid direct “find 1/4 of 20” structures.
`;

    case "measurement_geometry":
      return `
- Combine more than one geometric quantity, such as area plus cost, perimeter plus missing side, or volume plus filling/removal.
- Include one intermediate step like finding a missing dimension first.
- Avoid direct single-formula questions.
`;

    case "average_data":
      return `
- Require finding a missing value from a known average, or comparing averages before and after adding data.
- Include an intermediate step such as total sum before the final answer.
- Avoid direct average calculation from a list only.
`;

    case "simple_probability":
      return `
- Use a setup where the student must first determine the total number of valid outcomes or remaining outcomes.
- May include a complementary probability step.
- Keep it school-level, but do not make it a direct favorable-over-total question immediately.
`;

    default:
      return `
- The hard problem must require at least 3 reasoning steps and one intermediate value.
`;
  }
}

export function buildPrompt(
  topic: MathWordProblemType,
  difficulty: Difficulty,
  scenario: string
): string {
  const difficultyInstructions = getDifficultyInstructions(difficulty);
  const topicInstructions = getTopicInstructions(topic, difficulty);

  return `
You are an expert generator of school-level math word problems for students preparing for selective school entrance exams in Victoria, Australia.

Generate exactly 1 word problem.

Requested topic: ${topic}
Requested difficulty: ${difficulty}
Requested scenario: ${scenario}

${difficultyInstructions}

${topicInstructions}

General rules:
- Use a realistic, everyday context.
- Include exactly one main question.
- The problem must have exactly one correct numerical answer.
- All necessary information must be included.
- Use clear and natural English suitable for Year 7-9 students.
- Do not make the wording tricky just to make it hard.
- The difficulty must come from reasoning, structure, or multi-step thinking.
- Do not include the full solution steps.
- Return valid JSON only.
- Do not include markdown code fences.
- The "answer" must be a number only.
- The "unit" should be a short unit like "km", "$", "minutes", or null if no unit is needed.
- The "explanation" should briefly describe the math model, not the full worked solution.

Return JSON in this exact format:
{
  "topic": "${topic}",
  "difficulty": "${difficulty}",
  "subtype": "string",
  "scenario": "${scenario}",
  "question": "string",
  "answer": number,
  "unit": "string or null",
  "explanation": "short math logic"
}
`.trim();
}

// import { MathWordProblemType, Difficulty } from "@/types/math";

// export function buildPrompt(
//   topic: MathWordProblemType,
//   difficulty: Difficulty,
//   scenario: string
// ) {
//   return `
// You are generating a math word problem for selective school exam preparation (Year 7-9).

// Topic: ${topic}
// Difficulty: ${difficulty}
// Scenario: ${scenario}

// Rules:
// - One clear question
// - Real-life context
// - One correct numerical answer
// - No ambiguity
// - Do NOT include solution steps

// Return JSON only:
// {
//   "topic": "${topic}",
//   "difficulty": "${difficulty}",
//   "subtype": "string",
//   "scenario": "${scenario}",
//   "question": "string",
//   "answer": number,
//   "unit": "string or null",
//   "explanation": "short math logic"
// }
// `;
// }