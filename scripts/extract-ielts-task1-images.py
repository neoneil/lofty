from __future__ import annotations

import json
import re
import sys
from pathlib import Path

import fitz


TASK1_PAGE_MAP = {
    5: [30, 53, 76, 99],
    6: [31, 53, 76, 99],
    7: [34, 57, 82, 105],
    8: [29, 52, 77, 100],
    9: [24, 53, 80, 111],
    10: [22, 46, 69, 93],
    11: [28, 52, 75, 98],
    12: [27, 50, 71, 92],
    13: [30, 52, 72, 93],
    14: [29, 50, 72, 94],
    15: [30, 51, 73, 95],
    16: [31, 54, 75, 97],
    17: [21, 43, 65, 86],
    18: [31, 54, 77, 98],
    19: [29, 51, 74, 95],
    20: [28, 64, 103, 138],
    21: [30, 52, 73, 95],
}
BOOKS = sorted(TASK1_PAGE_MAP)
SOURCE_ROOT = Path("/mnt/c/Users/adela/Downloads/剑桥雅思")
PUBLIC_ROOT = Path("public/ielts/writing/task1")
CONTENT_PATH = Path("content/ielts/writing-task1-bank.json")
FULL_PAGE_ITEMS = {(14, 4)}


def normalize_text(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def text_instances(page: fitz.Page, needle: str):
    matches = page.search_for(needle)
    if matches:
        return matches
    return page.search_for(needle.title())


def find_task1_pages(doc: fitz.Document):
    pages = []
    for index in range(doc.page_count):
        page = doc[index]
        text = normalize_text(page.get_text("text"))
        if re.search(r"WRITING\s+TASK\s+1", text, re.IGNORECASE):
            pages.append(index)
    return pages


def detect_test_number(doc: fitz.Document, page_index: int, fallback: int) -> int:
    start = max(0, page_index - 8)
    chunks = []
    for index in range(start, page_index + 1):
        chunks.append(normalize_text(doc[index].get_text("text")))
    text = " ".join(chunks)
    matches = [int(value) for value in re.findall(r"TEST\s+([1-4])", text, flags=re.IGNORECASE)]
    return matches[-1] if matches else fallback


def task1_title(page: fitz.Page) -> str:
    text = normalize_text(page.get_text("text"))
    if "academic" in text.lower() and "writing task 1" in text.lower():
        return "Academic Writing Task 1"
    return "Writing Task 1"


def crop_task1(page: fitz.Page) -> fitz.Rect:
    rect = page.rect
    task1_matches = page.search_for("WRITING TASK 1") or page.search_for("Writing Task 1")
    task2_matches = page.search_for("WRITING TASK 2") or page.search_for("Writing Task 2")
    if not task1_matches:
        return fitz.Rect(rect.x0, rect.y0 + 12, rect.x1, rect.y1 - 12)
    top = max(0, min((match.y0 for match in task1_matches), default=rect.y0) - 36)
    bottom_candidates = [match.y0 for match in task2_matches if match.y0 > top + 80]
    bottom = min(bottom_candidates) - 20 if bottom_candidates else rect.y1 - 28
    if bottom <= top + 220:
        bottom = rect.y1 - 28
    return fitz.Rect(rect.x0, top, rect.x1, min(rect.y1 - 24, bottom))


def crop_full_page(page: fitz.Page) -> fitz.Rect:
    rect = page.rect
    return fitz.Rect(rect.x0, rect.y0 + 12, rect.x1, rect.y1 - 12)


def extract_prompt(page: fitz.Page, crop: fitz.Rect) -> str:
    words = page.get_text("words", clip=crop)
    words.sort(key=lambda item: (round(item[1] / 3) * 3, item[0]))
    lines: list[list[tuple]] = []
    for word in words:
        if not lines or abs(lines[-1][0][1] - word[1]) > 5:
            lines.append([word])
        else:
            lines[-1].append(word)
    text_lines = [" ".join(item[4] for item in line).strip() for line in lines]
    text = normalize_text(" ".join(text_lines))
    text = re.sub(r"^.*?WRITING TASK 1", "WRITING TASK 1", text, flags=re.IGNORECASE)
    text = re.sub(r"WRITING TASK 2.*$", "", text, flags=re.IGNORECASE)
    return text[:1200]


def render_crop(page: fitz.Page, crop: fitz.Rect, output_path: Path) -> None:
    matrix = fitz.Matrix(2.2, 2.2)
    pixmap = page.get_pixmap(matrix=matrix, clip=crop, alpha=False)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    pixmap.save(output_path)


def main() -> int:
    items = []
    missing = []

    for book in BOOKS:
        pdf_path = SOURCE_ROOT / f"Cambridge-IELTS-{book:02d}.pdf"
        if not pdf_path.exists():
            missing.append({"book": book, "reason": "pdf missing", "path": str(pdf_path)})
            continue

        doc = fitz.open(pdf_path)
        task_pages = [page_number - 1 for page_number in TASK1_PAGE_MAP[book]]
        out_of_range = [page + 1 for page in task_pages if page < 0 or page >= doc.page_count]
        if out_of_range:
            missing.append({"book": book, "reason": "page out of range", "pages": out_of_range})
            doc.close()
            continue

        for index, page_index in enumerate(task_pages[:4], start=1):
            page = doc[page_index]
            test_number = index
            use_full_page = (book, index) in FULL_PAGE_ITEMS
            crop = crop_full_page(page) if use_full_page else crop_task1(page)
            image_rel = f"/ielts/writing/task1/cambridge-{book:02d}-test-{test_number}-task-1.png"
            image_path = Path("public") / image_rel.lstrip("/")
            render_crop(page, crop, image_path)
            items.append(
                {
                    "id": f"cambridge-{book:02d}-test-{test_number}-task-1",
                    "bookNumber": book,
                    "testNumber": test_number,
                    "title": f"Cambridge IELTS {book} Test {test_number} Writing Task 1",
                    "taskType": "Writing Task 1",
                    "sourcePdf": f"Cambridge-IELTS-{book:02d}.pdf",
                    "sourcePage": page_index + 1,
                    "image": image_rel,
                    "promptPreview": "" if use_full_page else extract_prompt(page, crop),
                    "sortOrder": book * 10 + test_number,
                }
            )

        doc.close()

    items.sort(key=lambda item: (item["bookNumber"], item["testNumber"]))
    CONTENT_PATH.parent.mkdir(parents=True, exist_ok=True)
    CONTENT_PATH.write_text(
        json.dumps(
            {
                "title": "雅思小作文题库",
                "subtitle": "Cambridge IELTS 5-21 Academic Writing Task 1 题目截图，包含题目描述和图形。",
                "updatedAt": "2026-08-05T00:00:00.000Z",
                "count": len(items),
                "items": items,
                "missing": missing,
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )

    print(f"Extracted {len(items)} Task 1 images")
    if missing:
        print(json.dumps(missing, ensure_ascii=False, indent=2))
    return 0 if len(items) == 68 else 1


if __name__ == "__main__":
    raise SystemExit(main())
