"""Build growth-signal records from the historical signal tracking table."""

from __future__ import annotations

import json
import re
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
SOURCE_FILE = Path(r"Z:\主线任务2-天眼计划\行业专题研究\信号追踪表.md")
OUT_CURATED = PROJECT_ROOT / "data_assets" / "curated" / "research" / "market_growth_signals.json"
OUT_PORTAL = PROJECT_ROOT / "portal" / "data" / "research" / "market_growth_signals.json"


def norm(text: str | None) -> str:
    return re.sub(r"[\s_、/\\|｜,，;；:：()（）\[\]【】\-]+", "", str(text or "").lower())


def parse_markdown_table(text: str) -> list[dict]:
    records = []
    current_section = ""
    for line in text.splitlines():
        if line.startswith("## "):
            current_section = line.replace("#", "").strip()
        if not line.startswith("|"):
            continue
        cells = [x.strip() for x in line.strip().strip("|").split("|")]
        if len(cells) < 8:
            continue
        if cells[0] in {"#", "---"} or set(cells[0]) == {"-"}:
            continue
        if cells[0] == "#":
            continue
        if cells[1] == "大行业":
            continue
        if not cells[0].isdigit():
            continue
        records.append(
            {
                "signal_id": f"signal_{len(records) + 1:04d}",
                "section": current_section,
                "major_industry": cells[1],
                "primary_category": cells[2],
                "sub_track": cells[3],
                "scale": cells[4],
                "signal_keywords": cells[5],
                "tracking_focus": cells[6],
                "growth_reason": cells[7],
                "primary_category_norm": norm(cells[2]),
                "sub_track_norm": norm(cells[3]),
                "keywords_norm": norm(cells[5]),
                "source_file": str(SOURCE_FILE),
            }
        )
    return records


def main() -> None:
    text = SOURCE_FILE.read_text(encoding="utf-8", errors="ignore")
    records = parse_markdown_table(text)
    payload = {
        "summary": {
            "generated_at": "2026-06-02",
            "source_file": str(SOURCE_FILE),
            "record_count": len(records),
            "grain": "primary_category/sub_track",
            "purpose": "Explain why a category is growing and what signal should be tracked.",
        },
        "records": records,
    }
    for path in [OUT_CURATED, OUT_PORTAL]:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"records: {len(records)}")
    print(f"outputs: {OUT_CURATED}; {OUT_PORTAL}")


if __name__ == "__main__":
    main()
