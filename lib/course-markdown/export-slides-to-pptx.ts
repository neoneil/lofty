import { captureSlideAsPng, prepareSlideExport, sanitizeSlideExportFileName } from "./slide-export-utils";

type ExportSlidesToPptxOptions = {
  elements: HTMLElement[];
  fileName: string;
  onProgress?: (completed: number, total: number) => void;
};

export async function exportSlidesToPptx({ elements, fileName, onProgress }: ExportSlidesToPptxOptions) {
  if (elements.length === 0) throw new Error("没有可导出的幻灯片。");

  const { default: PptxGenJS } = await import("pptxgenjs");
  await prepareSlideExport(elements);

  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "Lofty Education";
  pptx.company = "Lofty Education";
  pptx.subject = "Lofty course slides";
  pptx.title = fileName;

  for (let index = 0; index < elements.length; index += 1) {
    const imageData = await captureSlideAsPng(elements[index]);
    const slide = pptx.addSlide();
    slide.addImage({ data: imageData, x: 0, y: 0, w: 13.333, h: 7.5 });
    onProgress?.(index + 1, elements.length);
  }

  await pptx.writeFile({ fileName: `${sanitizeSlideExportFileName(fileName)}.pptx` });
}
