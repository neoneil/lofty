export type IeltsWritingTask1Item = {
  id: string;
  bookNumber: number;
  testNumber: number;
  title: string;
  taskType: string;
  sourcePdf: string;
  sourcePage: number;
  image: string;
  promptPreview: string;
  sortOrder: number;
  modelAnswer?: string;
  modelAnswerUpdatedAt?: string;
};

export type IeltsWritingTask1Bank = {
  title: string;
  subtitle: string;
  updatedAt: string;
  count: number;
  items: IeltsWritingTask1Item[];
  missing: Array<Record<string, unknown>>;
};

export type IeltsWritingTask1ModelAnswer = {
  id: string;
  modelAnswer: string;
  updatedAt: string;
};

export type IeltsWritingTask1ModelAnswerBank = {
  updatedAt: string;
  items: Record<string, IeltsWritingTask1ModelAnswer>;
};
