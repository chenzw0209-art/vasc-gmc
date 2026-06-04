"""Shared Shopee L1 workbook resolution + VN raw-page recognition.

Both `build_ecommerce_market_assets_v0_2.py` (governance/audit/canonical) and
`generate_ecommerce_market_facts_v0_2.py` (fact aggregation) must agree on
which (raw_l1, raw_l2) combinations are *resolvable* and through which path.
Keeping the lookup logic in one place prevents the audit layer from contradicting
the fact layer (which is exactly what happened in v0.3).
"""

from __future__ import annotations

import re
from pathlib import Path

# Punctuation/separator characters stripped during fuzzy matching.
PUNCT_RE = re.compile(r"[\s\-_、，,()（）【】\[\]&？?·|/\\]+")

# Some processed L1 workbooks use a shorter label than the gold raw_l1 (e.g.
# gold "书籍 _ 杂志" vs file "书籍.xlsx"). Keep this list aligned with the
# observed processed workbooks under MY/ID `数据处理表`. Update when new
# workbooks land.
SHOPEE_L1_ALIASES: dict[str, str] = {
    "书籍杂志": "书籍",
    "旅行行李箱": "旅行",
    "游戏电玩": "游戏",
    "电脑配件": "电脑",
    "相机无人机": "相机",
    "车辆备件和配件": "汽车类",
}

# Used by VN raw-page filename parsing: the file pattern is
# "{raw_l1}_{raw_l2}_{month}月_第{page}页.xlsx" where {month} is a bare digit.
# Map that digit back to a YYYY-MM label rooted in the current snapshot window.
MONTH_LABELS: dict[str, str] = {
    "11": "2025-11",
    "12": "2025-12",
    "1": "2026-01",
    "2": "2026-02",
    "3": "2026-03",
    "4": "2026-04",
}

RAW_PAGE_RE = re.compile(r"_(\d{1,2})月_第\d+页\.xlsx$")


def normalize_name(value: str) -> str:
    """Lowercase + strip punctuation/separators for fuzzy name comparison."""
    return PUNCT_RE.sub("", str(value or "").lower()).strip()


def list_processed_l1_files(processed_root: Path) -> list[Path]:
    """Return processed L1 .xlsx files (excluding Excel lock files)."""
    if not processed_root.exists():
        return []
    return sorted(p for p in processed_root.glob("*.xlsx") if not p.name.startswith("~$"))


def resolve_processed_l1_workbook(
    raw_l1: str, processed_root: Path
) -> tuple[Path | None, str]:
    """Resolve a gold raw_l1 to a processed L1 workbook on disk.

    Returns (path, resolution_method). resolution_method is one of:
      - "resolved_by_name"   exact normalized stem match
      - "resolved_by_substring"   one side contains the other (legacy heuristic)
      - "resolved_by_alias"  alias from SHOPEE_L1_ALIASES matched
      - "missing_processed_folder" / "missing_processed_files" / "missing_source_workbook"
    """
    if not processed_root.exists():
        return None, "missing_processed_folder"
    files = list_processed_l1_files(processed_root)
    if not files:
        return None, "missing_processed_files"

    raw_key = normalize_name(raw_l1)

    # 1) exact normalized match
    for path in files:
        if normalize_name(path.stem) == raw_key:
            return path, "resolved_by_name"

    # 2) substring match (legacy heuristic — keep alongside name to mirror fact-layer behavior)
    for path in files:
        file_key = normalize_name(path.stem)
        if file_key and (file_key in raw_key or raw_key in file_key):
            return path, "resolved_by_substring"

    # 3) alias
    alias = SHOPEE_L1_ALIASES.get(raw_key)
    if alias:
        alias_key = normalize_name(alias)
        for path in files:
            if normalize_name(path.stem) == alias_key:
                return path, "resolved_by_alias"

    return None, "missing_source_workbook"


def has_vn_raw_pages(raw_root: Path, raw_l1: str, raw_l2: str) -> tuple[bool, int, list[str]]:
    """Check whether VN raw monthly pages cover the given (raw_l1, raw_l2).

    Returns (has_pages, page_count, period_labels_descending).
    """
    if not raw_root.exists():
        return False, 0, []
    prefix = f"{raw_l1}_{raw_l2}_"
    pages = [
        p for p in raw_root.glob("*.xlsx")
        if not p.name.startswith("~$") and p.name.startswith(prefix)
    ]
    if not pages:
        return False, 0, []
    periods: set[str] = set()
    for p in pages:
        m = RAW_PAGE_RE.search(p.name)
        if not m:
            continue
        label = MONTH_LABELS.get(m.group(1))
        if label:
            periods.add(label)
    return True, len(pages), sorted(periods, reverse=True)
