from __future__ import annotations

import sys
from pathlib import Path

import fitz
from PIL import Image, ImageDraw, ImageFont


SOURCE_ROOT = Path("/mnt/c/Users/adela/Downloads/剑桥雅思")
OUT_ROOT = Path("tmp/pdfs/ielts-writing-contact-sheets")


def render_contact_sheet(book: int) -> None:
    pdf_path = SOURCE_ROOT / f"Cambridge-IELTS-{book:02d}.pdf"
    doc = fitz.open(pdf_path)
    thumb_width = 250
    thumb_height = 354
    padding = 14
    label_height = 26
    columns = 4
    pages_per_sheet = 40

    for start in range(0, doc.page_count, pages_per_sheet):
        page_indexes = list(range(start, min(start + pages_per_sheet, doc.page_count)))
        rows = (len(page_indexes) + columns - 1) // columns
        sheet = Image.new("RGB", (columns * (thumb_width + padding) + padding, rows * (thumb_height + label_height + padding) + padding), "white")
        draw = ImageDraw.Draw(sheet)
        font = ImageFont.load_default()

        for offset, page_index in enumerate(page_indexes):
            page = doc[page_index]
            pixmap = page.get_pixmap(matrix=fitz.Matrix(0.42, 0.42), alpha=False)
            image = Image.frombytes("RGB", (pixmap.width, pixmap.height), pixmap.samples)
            image.thumbnail((thumb_width, thumb_height), Image.Resampling.LANCZOS)
            col = offset % columns
            row = offset // columns
            x = padding + col * (thumb_width + padding)
            y = padding + row * (thumb_height + label_height + padding)
            sheet.paste(image, (x + (thumb_width - image.width) // 2, y + label_height))
            draw.text((x, y), f"p{page_index + 1}", fill=(20, 90, 80), font=font)

        OUT_ROOT.mkdir(parents=True, exist_ok=True)
        output_path = OUT_ROOT / f"cambridge-{book:02d}-contact-{start + 1:03d}-{page_indexes[-1] + 1:03d}.png"
        sheet.save(output_path)
        print(output_path)


def main() -> int:
    books = [int(arg) for arg in sys.argv[1:]] or list(range(5, 22))
    for book in books:
        render_contact_sheet(book)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
