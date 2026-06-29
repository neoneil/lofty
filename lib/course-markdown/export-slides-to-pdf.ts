import { captureSlideAsPng, prepareSlideExport, sanitizeSlideExportFileName } from "./slide-export-utils";

type ExportSlidesToPdfOptions = {
  elements: HTMLElement[];
  fileName: string;
  onProgress?: (completed: number, total: number) => void;
};

export async function exportSlidesToPdf({ elements, fileName, onProgress }: ExportSlidesToPdfOptions) {
  if (elements.length === 0) throw new Error("没有可导出的幻灯片。");

  const { PDFDocument } = await import("pdf-lib");
  await prepareSlideExport(elements);

  const pdf = await PDFDocument.create();
  pdf.setAuthor("Lofty Education");
  pdf.setCreator("Lofty Education");
  pdf.setSubject("Lofty course slides");
  pdf.setTitle(fileName);

  for (let index = 0; index < elements.length; index += 1) {
    const imageData = await captureSlideAsPng(elements[index]);
    const image = await pdf.embedPng(imageData);
    const page = pdf.addPage([1280, 720]);
    page.drawImage(image, { x: 0, y: 0, width: 1280, height: 720 });
    onProgress?.(index + 1, elements.length);
  }

  const bytes = await pdf.save();
  const blob = new Blob([Uint8Array.from(bytes).buffer], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${sanitizeSlideExportFileName(fileName)}.pdf`;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
