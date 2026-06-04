"""Audit US Amazon market assets under historical report folders v0.1.

Purpose:
- inventory too many exported versions
- detect duplicated category files
- prepare canonical source decisions
"""

from __future__ import annotations

import json
import os
import re
from collections import defaultdict
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
PORTAL_DIR = Path(os.environ.get("GIP_PORTAL_DIR", PROJECT_ROOT / "portal"))
REPORT_ROOT = Path(
    os.environ.get(
        "GIP_REPORT_ROOT",
        r"Z:\主线任务2-天眼计划\行业专题研究\行研报告",
    )
)


VERSION_RE = re.compile(r"v(?P<version>\d+(?:\.\d+)?)", re.IGNORECASE)
PUNCT_RE = re.compile(r"[\s\-_、，,()（）【】\[\]&＋+·|/\\]+")


def infer_category_name(path: Path) -> str:
    name = path.stem
    for marker in ["竞品分析底表", "市场分析报告", "底表"]:
        if marker in name:
            return name.split(marker)[0].strip()
    return name


def infer_version(path: Path) -> str:
    match = VERSION_RE.search(path.stem)
    return match.group("version") if match else ""


def normalize_category_name(name: str) -> str:
    text = str(name or "").lower()
    for token in ["竞品分析底表", "市场分析报告", "产品市场分析报告", "底表", "市场大盘"]:
        text = text.replace(token.lower(), "")
    text = VERSION_RE.sub("", text)
    text = PUNCT_RE.sub("", text)
    return text.strip()


def infer_asset_type(path: Path) -> str:
    suffix = path.suffix.lower()
    if suffix == ".json":
        return "intermediate_json"
    if suffix == ".csv":
        return "intermediate_csv"
    if suffix == ".xlsx":
        return "processed_xlsx"
    return suffix.lstrip(".")


def infer_report_area(path: Path) -> str:
    rel = path.relative_to(REPORT_ROOT)
    return rel.parts[0] if rel.parts else ""


def is_us_amazon_candidate(path: Path) -> bool:
    text = str(path)
    if path.suffix.lower() in {".xlsx", ".json", ".csv"}:
        pass
    else:
        return False

    include_keywords = [
        "US",
        "美国",
        "健康与家庭",
        "美容和个人护理",
        "3C",
        "市场大盘",
        "aggregated_data",
        "report_data",
        "l1_summary",
    ]
    exclude_keywords = ["DE", "德国", "日本", "墨西哥", "巴西", "TikTok", "tiktok", "Shopee", "虾皮"]
    return any(k in text for k in include_keywords) and not any(k in text for k in exclude_keywords)


def collect_assets() -> list[dict]:
    assets = []
    patterns = ["*.xlsx", "*.json", "*.csv"]
    for pattern in patterns:
        for path in REPORT_ROOT.rglob(pattern):
            if not is_us_amazon_candidate(path):
                continue
            rel = path.relative_to(REPORT_ROOT)
            category = infer_category_name(path) if path.suffix.lower() == ".xlsx" else ""
            assets.append(
                {
                    "asset_id": f"asset_{len(assets) + 1:05d}",
                    "asset_type": infer_asset_type(path),
                    "report_area": infer_report_area(path),
                    "category_name": category,
                    "category_key": normalize_category_name(category),
                    "version": infer_version(path),
                    "path": str(path),
                    "relative_path": str(rel),
                    "file_name": path.name,
                    "size_bytes": path.stat().st_size,
                    "last_write_time": path.stat().st_mtime,
                }
            )
    return assets


def build_duplicate_groups(assets: list[dict]) -> list[dict]:
    groups = defaultdict(list)
    for asset in assets:
        if asset["asset_type"] != "processed_xlsx":
            continue
        key = asset["category_key"]
        groups[key].append(asset)

    duplicates = []
    for category_key, items in groups.items():
        if len(items) <= 1:
            continue
        sorted_items = sorted(items, key=lambda x: (x["version"], x["last_write_time"]), reverse=True)
        duplicates.append(
            {
                "category_key": category_key,
                "category_names": sorted({x["category_name"] for x in items}),
                "report_areas": sorted({x["report_area"] for x in items}),
                "count": len(items),
                "candidate_canonical": sorted_items[0]["path"],
                "versions": sorted({x["version"] for x in items if x["version"]}),
                "paths": [x["path"] for x in sorted_items],
            }
        )
    return sorted(duplicates, key=lambda x: x["count"], reverse=True)


def write_json(path: Path, payload) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def main() -> None:
    assets = collect_assets()
    payload = {
        "generated_at": "2026-06-02",
        "scope": "US Amazon / North America candidates under historical report folders",
        "report_root": str(REPORT_ROOT),
        "asset_count": len(assets),
        "asset_type_counts": {
            asset_type: sum(1 for x in assets if x["asset_type"] == asset_type)
            for asset_type in sorted({x["asset_type"] for x in assets})
        },
        "report_area_counts": {
            area: sum(1 for x in assets if x["report_area"] == area)
            for area in sorted({x["report_area"] for x in assets})
        },
        "duplicate_groups": build_duplicate_groups(assets),
        "assets": assets,
    }
    out = PORTAL_DIR / "data" / "sources" / "us_amazon_asset_audit.json"
    write_json(out, payload)
    print(f"us_amazon_asset_audit.json: {len(assets)} assets")
    print(f"duplicate_groups: {len(payload['duplicate_groups'])}")
    print(f"output: {out}")


if __name__ == "__main__":
    main()
