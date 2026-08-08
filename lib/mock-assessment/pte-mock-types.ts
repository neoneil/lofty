export type PteMockSection = "speaking" | "writing" | "reading" | "listening";

export type PteMockQuestionType = "RA" | "RS" | "DI" | "RL" | "ASQ" | "SGD" | "RTS" | "SWT" | "ESSAY" | "RO" | "FIBRW" | "FIBR" | "SST" | "HIW" | "WFD";

export type PteMockBlank = {
  index: number;
  answer: string;
  options: string[];
};

export type PteMockQuestion = {
  id: string;
  section: PteMockSection;
  type: PteMockQuestionType;
  title: string;
  prompt: string;
  audioUrl?: string;
  imageUrl?: string;
  answer?: string;
  sentences?: string[];
  blanks?: PteMockBlank[];
};

export type PteMockQuestionResponse = {
  text?: string;
  values?: Record<string, string | number | string[]>;
  orderedItems?: string[];
  selectedIndexes?: number[];
  recording?: {
    blob: Blob;
    mimeType: string;
    durationSeconds?: number;
  };
};

export type PteMockExamData = {
  speaking: PteMockQuestion[];
  writing: PteMockQuestion[];
  reading: PteMockQuestion[];
  listening: PteMockQuestion[];
  warnings: string[];
};
