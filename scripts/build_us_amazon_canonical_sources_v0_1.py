"""Build canonical US Amazon source list v0.1.

Gold standard:
Z:\\主线任务2-天眼计划\\信息可视化\\类目匹配表_0602.xlsx

Rule:
- Category mapping workbook decides standard industry/category.
- Historical report folders are reusable blocks.
- Specialized topic folders have priority over 3C comprehensive folder.
- 3C comprehensive folder is fallback.
"""

from __future__ import annotations

import json
import os
import re
from pathlib import Path

import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parents[1]
PORTAL_DIR = Path(os.environ.get("GIP_PORTAL_DIR", PROJECT_ROOT / "portal"))
CATEGORY_MAPPING_XLSX = Path(
    os.environ.get(
        "GIP_CATEGORY_MAPPING_XLSX",
        r"Z:\主线任务2-天眼计划\信息可视化\类目匹配表_0602.xlsx",
    )
)
AUDIT_PATH = PORTAL_DIR / "data" / "sources" / "us_amazon_asset_audit.json"

PUNCT_RE = re.compile(r"[\s\-_、，,()（）【】\[\]&＋+·|/\\]+")
VERSION_RE = re.compile(r"v(?P<version>\d+(?:\.\d+)?)", re.IGNORECASE)


AREA_PRIORITY = {
    "3C-行业报告": 20,
}

DEFAULT_TOPIC_PRIORITY = 80


def normalize_name(name: str) -> str:
    text = str(name or "").lower()
    for token in ["竞品分析底表", "市场分析报告", "产品市场分析报告", "底表", "市场大盘"]:
        text = text.replace(token.lower(), "")
    text = VERSION_RE.sub("", text)
    text = PUNCT_RE.sub("", text)
    return text.strip()


def version_number(version: str) -> float:
    if not version:
        return 0.0
    try:
        return float(version)
    except ValueError:
        return 0.0


def load_gold_mapping() -> dict[str, dict]:
    df = pd.read_excel(CATEGORY_MAPPING_XLSX, sheet_name="电商类目映射表").fillna("")
    df = df[df["国家/地区"].astype(str).str.strip().eq("美国")]
    mapping = {}
    for _, row in df.iterrows():
        raw_l2 = str(row.get("原始二级类目", "")).strip()
        if not raw_l2:
            continue
        key = normalize_name(raw_l2)
        mapping[key] = {
            "country": "US",
            "raw_l1": str(row.get("原始一级类目", "")).strip(),
            "raw_l2": raw_l2,
            "standard_l1": str(row.get("标准一级行业", "")).strip(),
            "standard_l2": str(row.get("标准二级行业", "")).strip(),
            "include_flag": str(row.get("纳入口径", "")).strip(),
            "confidence": str(row.get("置信度", "")).strip(),
            "mapping_note": str(row.get("映射说明", "")).strip(),
        }
    return mapping


def load_audit() -> dict:
    return json.loads(AUDIT_PATH.read_text(encoding="utf-8"))


def asset_score(asset: dict) -> tuple:
    area = asset.get("report_area", "")
    area_priority = AREA_PRIORITY.get(area, DEFAULT_TOPIC_PRIORITY)
    return (
        area_priority,
        version_number(asset.get("version", "")),
        float(asset.get("last_write_time", 0)),
        int(asset.get("size_bytes", 0)),
    )


def match_asset_to_gold(asset: dict, gold: dict[str, dict]) -> tuple[str, dict | None, str]:
    category_key = asset.get("category_key") or normalize_name(asset.get("category_name", ""))
    if category_key in gold:
        return category_key, gold[category_key], "matched_exact"

    for key, item in gold.items():
        if category_key and (category_key in key or key in category_key):
            return key, item, "matched_fuzzy"

    return category_key, None, "unmapped"


def build_canonical() -> dict:
    gold = load_gold_mapping()
    audit = load_audit()
    processed_assets = [a for a in audit["assets"] if a.get("asset_type") == "processed_xlsx"]

    candidates_by_gold_key: dict[str, list[dict]] = {}
    unmapped_assets = []

    for asset in processed_assets:
        gold_key, mapping, status = match_asset_to_gold(asset, gold)
        enriched = dict(asset)
        enriched["gold_key"] = gold_key
        enriched["gold_match_status"] = status
        if mapping:
            enriched.update(
                {
                    "raw_l1": mapping["raw_l1"],
                    "raw_l2": mapping["raw_l2"],
                    "standard_l1": mapping["standard_l1"],
                    "standard_l2": mapping["standard_l2"],
                    "include_flag": mapping["include_flag"],
                    "gold_confidence": mapping["confidence"],
                    "gold_mapping_note": mapping["mapping_note"],
                }
            )
            candidates_by_gold_key.setdefault(gold_key, []).append(enriched)
        else:
            unmapped_assets.append(enriched)

    canonical_sources = []
    duplicate_sources = []

    for gold_key, candidates in sorted(candidates_by_gold_key.items()):
        # tuple sort ascending; choose highest by reverse=True.
        chosen = sorted(candidates, key=asset_score, reverse=True)[0]
        canonical_sources.append(
            {
                "canonical_id": f"us_amazon_{gold_key}",
                "country": "US",
                "platform": "Amazon",
                "data_refresh_instruction": {
                    "platform_source": "Sorftime / Amazon US",
                    "raw_l1_to_export": chosen["raw_l1"],
                    "raw_l2_to_export": chosen["raw_l2"],
                    "standard_l1": chosen["standard_l1"],
                    "standard_l2": chosen["standard_l2"],
                    "current_canonical_bottom_table": chosen["path"],
                    "recommended_output_folder": f"Z:\\主线任务2-天眼计划\\行业专题研究\\行研报告\\_canonical_us_amazon\\{chosen['standard_l2']}",
                    "recommended_file_pattern": f"{chosen['raw_l2']}竞品分析底表-市场大盘v{{version}}.xlsx",
                },
                "raw_l1": chosen["raw_l1"],
                "raw_l2": chosen["raw_l2"],
                "standard_l1": chosen["standard_l1"],
                "standard_l2": chosen["standard_l2"],
                "include_flag": chosen["include_flag"],
                "source_path": chosen["path"],
                "source_report_area": chosen["report_area"],
                "source_file_name": chosen["file_name"],
                "source_category_name": chosen["category_name"],
                "version": chosen.get("version", ""),
                "gold_match_status": chosen["gold_match_status"],
                "selection_rule": "topic_folder_priority_then_version_then_mtime; 3C comprehensive is fallback",
                "candidate_count": len(candidates),
                "all_candidate_paths": [
                    {
                        "path": item["path"],
                        "report_area": item["report_area"],
                        "file_name": item["file_name"],
                        "version": item.get("version", ""),
                    }
                    for item in sorted(candidates, key=asset_score, reverse=True)
                ],
            }
        )

        for item in candidates:
            if item["path"] == chosen["path"]:
                continue
            duplicate_sources.append(
                {
                    "gold_key": gold_key,
                    "raw_l2": chosen["raw_l2"],
                    "standard_l2": chosen["standard_l2"],
                    "discarded_path": item["path"],
                    "discarded_report_area": item["report_area"],
                    "discarded_version": item.get("version", ""),
                    "canonical_path": chosen["path"],
                    "reason": "duplicate_lower_priority_source",
                }
            )

    return {
        "generated_at": "2026-06-02",
        "gold_standard": str(CATEGORY_MAPPING_XLSX),
        "rule": "category mapping workbook decides standard industry; topic folders beat 3C comprehensive; 3C is fallback",
        "canonical_count": len(canonical_sources),
        "duplicate_discarded_count": len(duplicate_sources),
        "unmapped_count": len(unmapped_assets),
        "canonical_sources": sorted(canonical_sources, key=lambda x: (x["standard_l1"], x["standard_l2"], x["raw_l2"])),
        "duplicate_sources": sorted(duplicate_sources, key=lambda x: (x["standard_l2"], x["raw_l2"])),
        "unmapped_assets": sorted(unmapped_assets, key=lambda x: x["path"]),
    }


def write_json(path: Path, payload) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def main() -> None:
    payload = build_canonical()
    out = PORTAL_DIR / "data" / "sources" / "us_amazon_canonical_sources.json"
    write_json(out, payload)
    print(f"canonical_count: {payload['canonical_count']}")
    print(f"duplicate_discarded_count: {payload['duplicate_discarded_count']}")
    print(f"unmapped_count: {payload['unmapped_count']}")
    print(f"output: {out}")


if __name__ == "__main__":
    main()
