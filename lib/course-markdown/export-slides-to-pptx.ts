type ExportSlidesToPptxOptions = {
  elements: HTMLElement[];
  fileName: string;
  onProgress?: (completed: number, total: number) => void;
};

function sanitizeFileName(value: string) {
  const sanitized = value.replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-").replace(/\s+/g, " ").trim();
  return sanitized || "Lofty Course";
}

async function waitForImages(element: HTMLElement) {
  const images = Array.from(element.querySelectorAll("img"));
  await Promise.all(images.map((image) => image.complete ? Promise.resolve() : new Promise<void>((resolve) => {
    image.addEventListener("load", () => resolve(), { once: true });
    image.addEventListener("error", () => resolve(), { once: true });
  })));
}

export async function exportSlidesToPptx({ elements, fileName, onProgress }: ExportSlidesToPptxOptions) {
  if (elements.length === 0) throw new Error("没有可导出的幻灯片。");

  const [{ toPng }, { default: PptxGenJS }] = await Promise.all([import("html-to-image"), import("pptxgenjs")]);
  await document.fonts?.ready;
  await Promise.all(elements.map(waitForImages));

  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "Lofty Education";
  pptx.company = "Lofty Education";
  pptx.subject = "Lofty course slides";
  pptx.title = fileName;

  for (let index = 0; index < elements.length; index += 1) {
    const imageData = await toPng(elements[index], { cacheBust: true, pixelRatio: 1.5, width: 1280, height: 720 });
    const slide = pptx.addSlide();
    slide.addImage({ data: imageData, x: 0, y: 0, w: 13.333, h: 7.5 });
    onProgress?.(index + 1, elements.length);
  }

  await pptx.writeFile({ fileName: `${sanitizeFileName(fileName)}.pptx` });
}
