export function sanitizeSlideExportFileName(value: string) {
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

export async function prepareSlideExport(elements: HTMLElement[]) {
  await document.fonts?.ready;
  await Promise.all(elements.map(waitForImages));
}

export async function captureSlideAsPng(element: HTMLElement) {
  const { toPng } = await import("html-to-image");
  await fitSlideContent(element);
  return toPng(element, { cacheBust: true, pixelRatio: 1.5, width: 1280, height: 720 });
}

