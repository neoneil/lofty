"use client";

type Props = {
  pdfUrl: string;
};

export default function PdfPanel({ pdfUrl }: Props) {
  return (
    <iframe
      src={pdfUrl}
      title="PDF Reader"
      className="h-full w-full border-0"
    />
  );
}