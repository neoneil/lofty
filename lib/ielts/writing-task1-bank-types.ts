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
};

export type IeltsWritingTask1Bank = {
  title: string;
  subtitle: string;
  updatedAt: string;
  count: number;
  items: IeltsWritingTask1Item[];
  missing: Array<Record<string, unknown>>;
};
