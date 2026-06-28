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

function nextFrame() {
  return new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

async function fitSlideContent(element: HTMLElement) {
  const viewport = element.querySelector<HTMLElement>('[data-course-export-viewport="true"]');
  const content = element.querySelector<HTMLElement>('[data-course-export-content="true"]');
  if (!viewport || !content) return;

  content.style.width = "100%";
  content.style.transform = "none";
  content.style.transformOrigin = "top left";
  await nextFrame();

  const viewportStyle = window.getComputedStyle(viewport);
  const availableHeight = viewport.clientHeight - Number.parseFloat(viewportStyle.paddingTop) - Number.parseFloat(viewportStyle.paddingBottom);
  let scale = 1;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const renderedHeight = content.scrollHeight * scale;
    if (renderedHeight <= availableHeight + 1) break;

    scale = Math.max(0.1, scale * (availableHeight / renderedHeight));
    content.style.width = `${100 / scale}%`;
    content.style.transform = `scale(${scale})`;
    await nextFrame();
  }
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
    await fitSlideContent(elements[index]);
    const imageData = await toPng(elements[index], { cacheBust: true, pixelRatio: 1.5, width: 1280, height: 720 });
    const slide = pptx.addSlide();
    slide.addImage({ data: imageData, x: 0, y: 0, w: 13.333, h: 7.5 });
    onProgress?.(index + 1, elements.length);
  }

  await pptx.writeFile({ fileName: `${sanitizeFileName(fileName)}.pptx` });
}
