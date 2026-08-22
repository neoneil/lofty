export type BookBuilderExam = "ielts" | "pte";

export type BookCatalogKind =
  | "ielts-cambridge"
  | "ielts-task1-bank"
  | "lesson-note"
  | "pte-question-bank";

export type BookCatalogItem = {
  id: string;
  exam: BookBuilderExam;
  kind: BookCatalogKind;
  group: string;
  title: string;
  description: string;
  itemCount: number | null;
  badge: string;
};

export type BookBuilderStudent = {
  id: string;
  name: string;
  email: string | null;
};

export type SelectedBookContent = {
  id: string;
  title: string;
};

export type BookBuilderPayload = {
  exam: BookBuilderExam;
  title: string;
  subtitle: string;
  studentId: string | null;
  coverDataUrl: string | null;
  includeAnswers: boolean;
  contents: SelectedBookContent[];
};

export type BookQuestionItem = {
  id: string;
  number: number;
  title: string | null;
  bodyHtml: string;
  imageUrl: string | null;
  answerHtml: string | null;
};

export type BookContentBlock =
  | { type: "html"; html: string }
  | { type: "markdown"; markdown: string }
  | { type: "image"; src: string; alt: string; caption: string | null }
  | { type: "questions"; items: BookQuestionItem[] }
  | { type: "notice"; title: string; body: string };

export type BookDocumentSection = {
  id: string;
  title: string;
  eyebrow: string | null;
  pageBreakBefore: boolean;
  blocks: BookContentBlock[];
};

export type BookDocumentChapter = {
  id: string;
  title: string;
  sourceLabel: string;
  sections: BookDocumentSection[];
};

export type BookPreviewDocument = {
  exam: BookBuilderExam;
  title: string;
  subtitle: string;
  student: BookBuilderStudent | null;
  coverDataUrl: string | null;
  includeAnswers: boolean;
  generatedAt: string;
  chapters: BookDocumentChapter[];
  itemCount: number;
};
