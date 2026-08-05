from __future__ import annotations

import re
import sys
from pathlib import Path

import fitz
import numpy as np
from PIL import Image
from rapidocr_onnxruntime import RapidOCR


SOURCE_ROOT = Path("/mnt/c/Users/adela/Downloads/剑桥雅思")


def normalize(value: str) -> str:
    return re.sub(r"[^A-Z0-9]+", " ", value.upper()).strip()


def render_page_image(page: fitz.Page) -> np.ndarray:
    rect = page.rect
    clip = fitz.Rect(rect.x0, rect.y0, rect.x1, rect.y0 + rect.height * 0.38)
    pixmap = page.get_pixmap(matrix=fitz.Matrix(0.85, 0.85), clip=clip, alpha=False)
    image = Image.frombytes("RGB", (pixmap.width, pixmap.height), pixmap.samples)
    return np.array(image)


def page_text_by_ocr(engine: RapidOCR, page: fitz.Page) -> str:
    result, _ = engine(render_page_image(page))
    if not result:
        return ""
    return normalize(" ".join(str(item[1]) for item in result if len(item) > 1))


def page_text_by_pdf(page: fitz.Page) -> str:
    return normalize(page.get_text("text"))


def is_task1_text(text: str) -> bool:
    return bool(re.search(r"WRITING\s+TASK\s+1", text))


def main() -> int:
    books = [int(arg) for arg in sys.argv[1:]] or list(range(5, 22))
    engine = RapidOCR()
    for book in books:
        pdf_path = SOURCE_ROOT / f"Cambridge-IELTS-{book:02d}.pdf"
        doc = fitz.open(pdf_path)
        pages: list[int] = []
        for page_index, page in enumerate(doc):
            text = page_text_by_pdf(page)
            if not is_task1_text(text):
                text = page_text_by_ocr(engine, page)
            if is_task1_text(text):
                pages.append(page_index + 1)
        print(f"{book}: {pages} ({len(pages)})")
        doc.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
