from __future__ import annotations

from pathlib import Path

import fitz


SOURCE_ROOT = Path("/mnt/c/Users/adela/Downloads/剑桥雅思")


for book in range(5, 22):
    doc = fitz.open(SOURCE_ROOT / f"Cambridge-IELTS-{book:02d}.pdf")
    toc = doc.get_toc(simple=True)
    print(f"Cambridge {book}: pages={doc.page_count}, toc={len(toc)}")
    for level, title, page in toc[:80]:
        title_lower = title.lower()
        if "writing" in title_lower or "test" in title_lower:
            print(f"  {level} p{page}: {title}")
    doc.close()
