"use client";

import { useMemo, useState } from "react";
import IELTSSubnav from "@/components/site/ielts-subnav";
import ReadingWorkspace from "@/components/reading/pdf-workspace";

export default function ReadingPage() {
  const [selectedBook, setSelectedBook] = useState(10);

  const pdfUrl = useMemo(() => {
    return `/cambridge_ielts/${selectedBook}.pdf`;
  }, [selectedBook]);

  const books = Array.from({ length: 11 }, (_, i) => i + 10); // 10 - 20

  return (
    <main className="h-[calc(100vh-72px)] w-full bg-(--bg) mt-20">
      <IELTSSubnav current="reading" />
      <div className="flex items-center gap-3 px-4 py-3">
        <label htmlFor="cambridge-book" className="text-sm font-medium">
          Choose Cambridge:
        </label>

        <select
          id="cambridge-book"
          value={selectedBook}
          onChange={(e) => setSelectedBook(Number(e.target.value))}
          className="round border border-gray-300 bg-white px-3 py-2 text-sm"
        >
          {books.map((book) => (
            <option key={book} value={book}>
              Cambridge {book}
            </option>
          ))}
        </select>
      </div>

      <div className="h-[calc(100%-56px)]">
        <ReadingWorkspace
          leftPdfUrl={pdfUrl}
          rightPdfUrl={pdfUrl}
        />
      </div>
    </main>
  );
}