import { IELTS_PRACTICE_BOOK_NUMBERS } from "@/lib/ielts/books";

type QueryResult<T> = PromiseLike<{ data: T[] | null; error: { message: string } | null }>;

type QueryBuilder<T> = QueryResult<T> & {
  eq: (column: string, value: string | number | boolean) => QueryBuilder<T>;
  in: (column: string, values: Array<string | number>) => QueryBuilder<T>;
  order: (column: string, options?: { ascending?: boolean }) => QueryBuilder<T>;
};

type SupabaseLike = {
  schema: (schema: string) => {
    from: (table: string) => {
      select: <T>(columns: string) => QueryBuilder<T>;
    };
  };
};

const QUERY_CHUNK_SIZE = 60;

export type IeltsBook = {
  id: string;
  book_number: number;
  title: string;
  is_active: boolean;
};

export type IeltsTest = {
  id: string;
  book_id: string;
  test_number: number;
  title: string;
};

export type IeltsModule = {
  id: string;
  test_id: string;
  module_type: "listening" | "reading" | "writing" | "speaking";
  title: string;
  duration_minutes: number | null;
  sort_order: number;
  raw_data: Record<string, unknown>;
};

export type IeltsSection = {
  id: string;
  module_id: string;
  section_number: number;
  title: string | null;
  instruction: string | null;
  passage_title: string | null;
  passage_text: string | null;
  sort_order: number;
  raw_data: Record<string, unknown>;
};

export type IeltsQuestion = {
  id: string;
  section_id: string;
  question_number_start: number;
  question_number_end: number | null;
  question_type: string;
  prompt: string | null;
  instruction: string | null;
  content: Record<string, unknown>;
  options: Array<Record<string, unknown>>;
  sort_order: number;
  raw_data?: Record<string, unknown>;
};

export type IeltsAnswer = {
  id: string;
  question_id: string;
  answer_data: {
    answers?: Array<Record<string, unknown>>;
    options?: Array<Record<string, unknown>>;
  };
  explanation: string | null;
  raw_data?: Record<string, unknown>;
};

export type IeltsAsset = {
  id: string;
  book_id: string | null;
  test_id: string | null;
  module_id: string | null;
  section_id: string | null;
  question_id: string | null;
  asset_type: "audio" | "image" | "pdf" | "json" | "other";
  bucket: string;
  storage_path: string;
  public_url: string | null;
  mime_type: string | null;
  duration_seconds: number | null;
  metadata: Record<string, unknown>;
};

export type IeltsPracticeSummary = {
  book: IeltsBook;
  testCount: number;
  moduleCount: number;
  sectionCount: number;
  questionCount: number;
  assetCount: number;
};

export type IeltsBookPracticeData = {
  book: IeltsBook | null;
  tests: IeltsTest[];
  modules: IeltsModule[];
  sections: IeltsSection[];
  questions: IeltsQuestion[];
  answers: IeltsAnswer[];
  assets: IeltsAsset[];
};

async function runQuery<T>(query: QueryResult<T>) {
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

async function runInChunks<T>(values: Array<string | number>, buildQuery: (chunk: Array<string | number>) => QueryResult<T>) {
  const rows: T[] = [];
  for (let index = 0; index < values.length; index += QUERY_CHUNK_SIZE) {
    rows.push(...await runQuery<T>(buildQuery(values.slice(index, index + QUERY_CHUNK_SIZE))));
  }
  return rows;
}

function ids(rows: Array<{ id: string }>) {
  return rows.map((row) => row.id);
}

type ModuleSummaryRow = {
  id: string;
  test_id: string;
};

type SectionSummaryRow = {
  id: string;
  module_id: string;
};

type QuestionSummaryRow = {
  id: string;
  section_id: string;
};

type AssetSummaryRow = {
  id: string;
  book_id: string | null;
  test_id: string | null;
};

export async function getIeltsPracticeSummaries(client: unknown): Promise<IeltsPracticeSummary[]> {
  const schema = (client as SupabaseLike).schema("ielts");
  const books = await runQuery<IeltsBook>(
    schema.from("cambridge_books").select<IeltsBook>("id, book_number, title, is_active").in("book_number", [...IELTS_PRACTICE_BOOK_NUMBERS]).order("book_number", { ascending: false }),
  );
  const tests = books.length > 0 ? await runQuery<IeltsTest>(
    schema.from("tests").select<IeltsTest>("id, book_id, test_number, title").in("book_id", ids(books)).order("test_number", { ascending: true }),
  ) : [];
  const modules = tests.length > 0 ? await runInChunks<ModuleSummaryRow>(
    ids(tests),
    (chunk) => schema.from("test_modules").select<ModuleSummaryRow>("id, test_id").in("test_id", chunk),
  ) : [];
  const sections = modules.length > 0 ? await runInChunks<SectionSummaryRow>(
    ids(modules),
    (chunk) => schema.from("sections").select<SectionSummaryRow>("id, module_id").in("module_id", chunk),
  ) : [];
  const questions = sections.length > 0 ? await runInChunks<QuestionSummaryRow>(
    ids(sections),
    (chunk) => schema.from("questions").select<QuestionSummaryRow>("id, section_id").in("section_id", chunk),
  ) : [];
  const assets = tests.length > 0 ? await runInChunks<AssetSummaryRow>(
    ids(tests),
    (chunk) => schema.from("assets").select<AssetSummaryRow>("id, book_id, test_id").in("test_id", chunk),
  ) : [];

  return books.map((book) => {
    const bookTests = tests.filter((test) => test.book_id === book.id);
    const bookModules = modules.filter((module) => bookTests.some((test) => test.id === module.test_id));
    const bookSections = sections.filter((section) => bookModules.some((module) => module.id === section.module_id));
    const bookQuestions = questions.filter((question) => bookSections.some((section) => section.id === question.section_id));
    const bookAssets = assets.filter((asset) => asset.book_id === book.id || bookTests.some((test) => test.id === asset.test_id));

    return {
      book,
      testCount: bookTests.length,
      moduleCount: bookModules.length,
      sectionCount: bookSections.length,
      questionCount: bookQuestions.length,
      assetCount: bookAssets.length,
    };
  });
}

export async function getIeltsBookPracticeData(client: unknown, bookNumber: number, testNumber?: number): Promise<IeltsBookPracticeData> {
  const schema = (client as SupabaseLike).schema("ielts");
  const [book] = await runQuery<IeltsBook>(
    schema.from("cambridge_books").select<IeltsBook>("id, book_number, title, is_active").eq("book_number", bookNumber),
  );

  if (!book) {
    return { book: null, tests: [], modules: [], sections: [], questions: [], answers: [], assets: [] };
  }

  const tests = await runQuery<IeltsTest>(
    schema.from("tests").select<IeltsTest>("id, book_id, test_number, title").eq("book_id", book.id).order("test_number", { ascending: true }),
  );
  const activeTest = tests.find((test) => test.test_number === testNumber) ?? tests[0];
  const activeTests = activeTest ? [activeTest] : [];
  const modules = activeTests.length > 0 ? await runInChunks<IeltsModule>(
    ids(activeTests),
    (chunk) => schema.from("test_modules").select<IeltsModule>("id, test_id, module_type, title, duration_minutes, sort_order, raw_data").in("test_id", chunk).order("sort_order", { ascending: true }),
  ) : [];
  const sections = modules.length > 0 ? await runInChunks<IeltsSection>(
    ids(modules),
    (chunk) => schema.from("sections").select<IeltsSection>("id, module_id, section_number, title, instruction, passage_title, passage_text, sort_order, raw_data").in("module_id", chunk).order("sort_order", { ascending: true }),
  ) : [];
  const questions = sections.length > 0 ? await runInChunks<IeltsQuestion>(
    ids(sections),
    (chunk) => schema.from("questions").select<IeltsQuestion>("id, section_id, question_number_start, question_number_end, question_type, prompt, instruction, content, options, sort_order").in("section_id", chunk).order("sort_order", { ascending: true }),
  ) : [];
  const answers = questions.length > 0 ? await runInChunks<IeltsAnswer>(
    ids(questions),
    (chunk) => schema.from("answers").select<IeltsAnswer>("id, question_id, answer_data, explanation").in("question_id", chunk),
  ) : [];
  const assets = activeTests.length > 0 ? await runInChunks<IeltsAsset>(
    ids(activeTests),
    (chunk) => schema.from("assets").select<IeltsAsset>("id, book_id, test_id, module_id, section_id, question_id, asset_type, bucket, storage_path, public_url, mime_type, duration_seconds, metadata").in("test_id", chunk),
  ) : [];

  return { book, tests, modules, sections, questions, answers, assets };
}
