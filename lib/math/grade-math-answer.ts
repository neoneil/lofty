import { AutoGradeResult } from "@/types/math";

export function gradeNumericAnswer(
  studentRaw: string,
  correctAnswer: number,
  tolerance = 0
): AutoGradeResult {
  const parsed = Number(studentRaw.trim());

  if (Number.isNaN(parsed)) {
    return {
      isCorrect: false,
      studentAnswerRaw: studentRaw,
      studentAnswerParsed: null,
      correctAnswer,
      acceptedTolerance: tolerance,
      feedback: "Please enter a valid number.",
    };
  }

  const isCorrect = Math.abs(parsed - correctAnswer) <= tolerance;

  return {
    isCorrect,
    studentAnswerRaw: studentRaw,
    studentAnswerParsed: parsed,
    correctAnswer,
    acceptedTolerance: tolerance,
    feedback: isCorrect
      ? "Correct."
      : `Incorrect. Correct answer is ${correctAnswer}`,
  };
}