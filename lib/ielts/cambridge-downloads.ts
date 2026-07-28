import { normalizePublicStorageUrl } from "@/lib/storage/public-url";

export type CambridgeIeltsAudioPart = {
  partNumber: number;
  label: string;
  url: string | null;
  fileName: string | null;
  sizeBytes: number | null;
};

export type CambridgeIeltsAudioTest = {
  testNumber: number;
  parts: CambridgeIeltsAudioPart[];
};

export type CambridgeIeltsDownloadBook = {
  bookNumber: number;
  displayNumber: string;
  title: string;
  pdf: {
    fileName: string;
    url: string;
    sizeBytes: number | null;
  };
  audioTests: CambridgeIeltsAudioTest[];
};

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

type CambridgeBookRow = {
  id: string;
  book_number: number;
  title: string | null;
};

type CambridgeTestRow = {
  id: string;
  book_id: string;
  test_number: number;
  title: string | null;
};

type CambridgeAssetRow = {
  id: string;
  book_id: string | null;
  test_id: string | null;
  asset_type: "audio" | "image" | "pdf" | "json" | "other";
  bucket: string;
  storage_path: string;
  public_url: string | null;
  mime_type: string | null;
  metadata: Record<string, unknown> | null;
};

const CAMBRIDGE_BOOK_NUMBERS = Array.from({ length: 18 }, (_, index) => 21 - index);
const AUDIO_BOOK_NUMBERS = new Set([21, 20, 19, 18, 17, 16]);
const PDF_PREFIX = "cambridge_ielts";
const PUBLIC_R2_BASE_URL = (process.env.NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL || "https://pub-b96989cc617f460facb9c254b7d2c5db.r2.dev").replace(/\/+$/, "");

async function runQuery<T>(query: QueryResult<T>) {
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

function displayBookNumber(bookNumber: number) {
  return String(bookNumber).padStart(2, "0");
}

function getPdfFileName(bookNumber: number) {
  return `Cambridge-IELTS-${displayBookNumber(bookNumber)}.pdf`;
}

function getPdfUrl(bookNumber: number) {
  return `${PUBLIC_R2_BASE_URL}/${encodeURIComponent(`ielts/${PDF_PREFIX}/${getPdfFileName(bookNumber)}`)}`;
}

function getNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function getAssetBytes(asset: CambridgeAssetRow) {
  return getNumber(asset.metadata?.bytes);
}

function assetUrl(asset: CambridgeAssetRow) {
  return normalizePublicStorageUrl(asset.public_url || asset.storage_path, asset.bucket || "ielts");
}

function isListeningAudioAsset(asset: CambridgeAssetRow) {
  return asset.asset_type === "audio" && asset.storage_path.includes("/listening/audio/");
}

function selectPartAssets(assets: CambridgeAssetRow[]) {
  const listeningAssets = assets.filter(isListeningAudioAsset);
  if (listeningAssets.length <= 4) return listeningAssets;

  const largestAsset = listeningAssets.reduce((largest, asset) => {
    const largestBytes = getAssetBytes(largest) ?? 0;
    const assetBytes = getAssetBytes(asset) ?? 0;
    return assetBytes > largestBytes ? asset : largest;
  }, listeningAssets[0]);

  return listeningAssets.filter((asset) => asset.id !== largestAsset.id).slice(0, 4);
}

function buildAudioTests(bookNumber: number, tests: CambridgeTestRow[], assets: CambridgeAssetRow[]) {
  if (!AUDIO_BOOK_NUMBERS.has(bookNumber)) return [];

  return tests
    .filter((test) => test.test_number >= 1 && test.test_number <= 4)
    .sort((first, second) => first.test_number - second.test_number)
    .map<CambridgeIeltsAudioTest>((test) => {
      const testAssets = selectPartAssets(assets.filter((asset) => asset.test_id === test.id));

      return {
        testNumber: test.test_number,
        parts: Array.from({ length: 4 }, (_, index) => {
          const asset = testAssets[index];
          const partNumber = index + 1;

          return {
            partNumber,
            label: `Test ${test.test_number} Part ${partNumber}`,
            url: asset ? assetUrl(asset) : null,
            fileName: asset ? `Cambridge-IELTS-${displayBookNumber(bookNumber)}-Test-${test.test_number}-Part-${partNumber}.mp3` : null,
            sizeBytes: asset ? getAssetBytes(asset) : null,
          };
        }),
      };
    });
}

export async function getCambridgeIeltsDownloadBooks(client: unknown): Promise<CambridgeIeltsDownloadBook[]> {
  const schema = (client as SupabaseLike).schema("ielts");
  const databaseBooks = await runQuery<CambridgeBookRow>(
    schema.from("cambridge_books").select<CambridgeBookRow>("id, book_number, title").in("book_number", CAMBRIDGE_BOOK_NUMBERS).order("book_number", { ascending: false }),
  );
  const tests = databaseBooks.length > 0 ? await runQuery<CambridgeTestRow>(
    schema.from("tests").select<CambridgeTestRow>("id, book_id, test_number, title").in("book_id", databaseBooks.map((book) => book.id)).order("test_number", { ascending: true }),
  ) : [];
  const assets = tests.length > 0 ? await runQuery<CambridgeAssetRow>(
    schema.from("assets").select<CambridgeAssetRow>("id, book_id, test_id, asset_type, bucket, storage_path, public_url, mime_type, metadata").in("test_id", tests.map((test) => test.id)),
  ) : [];
  const databaseBookByNumber = new Map(databaseBooks.map((book) => [book.book_number, book]));

  return CAMBRIDGE_BOOK_NUMBERS.map((bookNumber) => {
    const databaseBook = databaseBookByNumber.get(bookNumber);
    const bookTests = databaseBook ? tests.filter((test) => test.book_id === databaseBook.id) : [];
    const bookAssets = databaseBook ? assets.filter((asset) => asset.book_id === databaseBook.id || bookTests.some((test) => test.id === asset.test_id)) : [];
    const pdfFileName = getPdfFileName(bookNumber);

    return {
      bookNumber,
      displayNumber: displayBookNumber(bookNumber),
      title: databaseBook?.title || `Cambridge IELTS ${displayBookNumber(bookNumber)}`,
      pdf: {
        fileName: pdfFileName,
        url: getPdfUrl(bookNumber),
        sizeBytes: null,
      },
      audioTests: buildAudioTests(bookNumber, bookTests, bookAssets),
    };
  });
}
