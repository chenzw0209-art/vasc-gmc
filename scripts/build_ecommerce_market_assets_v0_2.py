"""Build seven-country ecommerce market data asset registry v0.2.

This script creates the governed asset layer. It does not mutate raw Z: sources.

Master asset outputs:
- data_assets/registry/ecommerce_market_asset_registry.json
- data_assets/canonical_sources/ecommerce_market_canonical_sources.json
- data_assets/audit/ecommerce_market_source_audit.json

Portal-facing JSON under portal/data is a consumer cache, not the master asset.
"""

from __future__ import annotations

import json
import os
import re
from collections import Counter, defaultdict
from pathlib import Path

import pandas as pd

from shopee_resolution import (
    has_vn_raw_pages,
    list_processed_l1_files,
    resolve_processed_l1_workbook,
)


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DATA_ASSETS_DIR = PROJECT_ROOT / "data_assets"
PORTAL_DIR = PROJECT_ROOT / "portal"

CATEGORY_MAPPING_XLSX = Path(
    os.environ.get(
        "GIP_CATEGORY_MAPPING_XLSX",
        r"Z:\主线任务2-天眼计划\信息可视化\类目匹配表_0602.xlsx",
    )
)

AMAZON_ROOT = Path(r"Z:\外部数据库\Softtiem亚马逊月度数据\行业底表")
SHOPEE_ROOT = Path(r"Z:\外部数据库\虾皮月度数据（近半年）")
US_CANONICAL_PATH = PORTAL_DIR / "data" / "sources" / "us_amazon_canonical_sources.json"

GENERATED_AT = "2026-06-02"

COUNTRY_META = {
    "美国": {"code": "US", "region": "North America", "platform": "Amazon"},
    "墨西哥": {"code": "MX", "region": "Latin America", "platform": "Amazon"},
    "日本": {"code": "JP", "region": "Asia", "platform": "Amazon"},
    "巴西": {"code": "BR", "region": "Latin America", "platform": "Amazon"},
    "马来": {"code": "MY", "region": "Southeast Asia", "platform": "Shopee"},
    "印尼": {"code": "ID", "region": "Southeast Asia", "platform": "Shopee"},
    "越南": {"code": "VN", "region": "Southeast Asia", "platform": "Shopee"},
}

AMAZON_COUNTRY_DIRS = {
    "墨西哥": AMAZON_ROOT / "amazon墨西哥所有二级类目底表（已处理）",
    "日本": AMAZON_ROOT / "amazon日本所有二级类目底表（已处理）",
    "巴西": AMAZON_ROOT / "amazon巴西所有二级类目底表（已处理）",
}

SHOPEE_COUNTRY_DIRS = {
    "马来": SHOPEE_ROOT / "马来",
    "印尼": SHOPEE_ROOT / "印尼",
    "越南": SHOPEE_ROOT / "越南",
}

PUNCT_RE = re.compile(r"[\s\-_、，,()（）【】\[\]&？?·|/\\]+")
VERSION_RE = re.compile(r"v(?P<version>\d+(?:\.\d+)?)", re.IGNORECASE)


def normalize_name(value: str) -> str:
    text = str(value or "").lower().strip()
    for token in [
        "竞品分析底表",
        "市场分析报告",
        "产品市场分析报告",
        "底表",
        "市场大盘",
        ".xlsx",
        ".xls",
        ".csv",
    ]:
        text = text.replace(token.lower(), "")
    text = VERSION_RE.sub("", text)
    text = PUNCT_RE.sub("", text)
    return text.strip()


def slug(value: str) -> str:
    text = normalize_name(value)
    return re.sub(r"[^0-9a-zA-Z\u4e00-\u9fff]+", "_", text).strip("_")


def read_gold_mapping() -> list[dict]:
    df = pd.read_excel(CATEGORY_MAPPING_XLSX, sheet_name="电商类目映射表").fillna("")
    records = []
    for _, row in df.iterrows():
        country_name = str(row.get("国家/地区", "")).strip()
        if country_name not in COUNTRY_META:
            continue
        raw_l1 = str(row.get("原始一级类目", "")).strip()
        raw_l2 = str(row.get("原始二级类目", "")).strip()
        if not raw_l1 or not raw_l2:
            continue
        meta = COUNTRY_META[country_name]
        records.append(
            {
                "country_name": country_name,
                "country": meta["code"],
                "region": meta["region"],
                "platform": meta["platform"],
                "raw_l1": raw_l1,
                "raw_l2": raw_l2,
                "standard_l1": str(row.get("标准一级行业", "")).strip(),
                "standard_l2": str(row.get("标准二级行业", "")).strip(),
                "include_flag": str(row.get("纳入口径", "")).strip(),
                "gold_confidence": str(row.get("置信度", "")).strip(),
                "gold_mapping_note": str(row.get("映射说明", "")).strip(),
                "raw_l1_key": normalize_name(raw_l1),
                "raw_l2_key": normalize_name(raw_l2),
                "raw_l1_l2_key": f"{normalize_name(raw_l1)}::{normalize_name(raw_l2)}",
            }
        )
    return records


def gold_indexes(records: list[dict]) -> dict:
    by_country_l2 = defaultdict(list)
    by_country_l1_l2 = defaultdict(list)
    by_country_l1 = defaultdict(list)
    for item in records:
        by_country_l2[(item["country_name"], item["raw_l2_key"])].append(item)
        by_country_l1_l2[(item["country_name"], item["raw_l1_l2_key"])].append(item)
        by_country_l1[(item["country_name"], item["raw_l1_key"])].append(item)
    return {
        "by_country_l2": by_country_l2,
        "by_country_l1_l2": by_country_l1_l2,
        "by_country_l1": by_country_l1,
    }


def choose_mapping(matches: list[dict], raw_l1_key: str = "") -> tuple[dict | None, str]:
    if not matches:
        return None, "unmapped"
    if len(matches) == 1:
        return matches[0], "matched_exact"
    same_l1 = [m for m in matches if raw_l1_key and m["raw_l1_key"] == raw_l1_key]
    if len(same_l1) == 1:
        return same_l1[0], "matched_l1_l2"
    return matches[0], "matched_ambiguous_l2"


def load_us_amazon_sources() -> tuple[list[dict], list[dict]]:
    if not US_CANONICAL_PATH.exists():
        return [], [{"country": "US", "platform": "Amazon", "reason": "missing_us_canonical_source", "path": str(US_CANONICAL_PATH)}]

    payload = json.loads(US_CANONICAL_PATH.read_text(encoding="utf-8"))
    records = []
    for item in payload.get("canonical_sources", []):
        records.append(
            {
                "canonical_id": item["canonical_id"],
                "country": "US",
                "country_name": "美国",
                "region": "North America",
                "platform": "Amazon",
                "asset_grain": "raw_l2_bottom_table",
                "raw_l1": item.get("raw_l1", ""),
                "raw_l2": item.get("raw_l2", ""),
                "standard_l1": item.get("standard_l1", ""),
                "standard_l2": item.get("standard_l2", ""),
                "include_flag": item.get("include_flag", ""),
                "gold_confidence": item.get("gold_confidence", ""),
                "gold_mapping_note": item.get("gold_mapping_note", ""),
                "source_path": item.get("source_path", ""),
                "source_zone": "historical_report_specialized_first",
                "source_report_area": item.get("source_report_area", ""),
                "source_file_name": item.get("source_file_name", ""),
                "gold_match_status": item.get("gold_match_status", ""),
                "selection_rule": item.get("selection_rule", ""),
                "candidate_count": item.get("candidate_count", 1),
                "all_candidate_paths": item.get("all_candidate_paths", []),
                "data_refresh_instruction": item.get("data_refresh_instruction", {}),
            }
        )
    audit = [
        {
            "country": "US",
            "platform": "Amazon",
            "canonical_count": len(records),
            "duplicate_discarded_count": payload.get("duplicate_discarded_count", 0),
            "unmapped_count": payload.get("unmapped_count", 0),
            "source": str(US_CANONICAL_PATH),
        }
    ]
    return records, audit


def parse_amazon_raw_l2(path: Path) -> str:
    name = path.stem
    name = re.sub(r"竞品分析底表.*$", "", name)
    return name.strip()


def scan_amazon_country(country_name: str, root: Path, indexes: dict) -> tuple[list[dict], list[dict]]:
    records = []
    audit = []
    files = sorted(root.rglob("*.xlsx")) if root.exists() else []
    seen_paths = set()
    for path in files:
        if path.name.startswith("~$"):
            continue
        raw_l1 = path.parent.name
        raw_l2 = parse_amazon_raw_l2(path)
        raw_l1_key = normalize_name(raw_l1)
        raw_l2_key = normalize_name(raw_l2)
        mapping, status = choose_mapping(indexes["by_country_l1_l2"].get((country_name, f"{raw_l1_key}::{raw_l2_key}"), []), raw_l1_key)
        if mapping is None:
            mapping, status = choose_mapping(indexes["by_country_l2"].get((country_name, raw_l2_key), []), raw_l1_key)

        meta = COUNTRY_META[country_name]
        source_path = str(path)
        if source_path in seen_paths:
            continue
        seen_paths.add(source_path)

        if mapping is None:
            audit.append(
                {
                    "country": meta["code"],
                    "country_name": country_name,
                    "platform": "Amazon",
                    "issue_type": "unmapped_processed_bottom_table",
                    "raw_l1": raw_l1,
                    "raw_l2": raw_l2,
                    "source_path": source_path,
                }
            )
            standard_l1 = ""
            standard_l2 = ""
            include_flag = ""
            confidence = ""
            note = ""
        else:
            standard_l1 = mapping["standard_l1"]
            standard_l2 = mapping["standard_l2"]
            include_flag = mapping["include_flag"]
            confidence = mapping["gold_confidence"]
            note = mapping["gold_mapping_note"]

        records.append(
            {
                "canonical_id": f"{meta['code'].lower()}_amazon_{slug(raw_l1)}_{slug(raw_l2)}",
                "country": meta["code"],
                "country_name": country_name,
                "region": meta["region"],
                "platform": "Amazon",
                "asset_grain": "raw_l2_bottom_table",
                "raw_l1": raw_l1,
                "raw_l2": raw_l2,
                "standard_l1": standard_l1,
                "standard_l2": standard_l2,
                "include_flag": include_flag,
                "gold_confidence": confidence,
                "gold_mapping_note": note,
                "source_path": source_path,
                "source_zone": "external_database_processed_bottom_table",
                "source_report_area": root.name,
                "source_file_name": path.name,
                "gold_match_status": status,
                "selection_rule": "one processed raw-l2 workbook under country/raw-l1 folder; gold mapping decides standard_l2",
                "candidate_count": 1,
                "all_candidate_paths": [{"path": source_path, "report_area": root.name, "file_name": path.name, "version": "v1"}],
                "data_refresh_instruction": {
                    "platform_source": f"Sorftime / Amazon {meta['code']}",
                    "raw_l1_to_export": raw_l1,
                    "raw_l2_to_export": raw_l2,
                    "standard_l1": standard_l1,
                    "standard_l2": standard_l2,
                    "raw_export_root": str(root),
                    "current_canonical_bottom_table": source_path,
                    "recommended_output_folder": str(root / raw_l1),
                    "recommended_file_pattern": f"{raw_l2}竞品分析底表-市场大盘v{{version}}.xlsx",
                },
            }
        )
    audit.append(
        {
            "country": meta["code"],
            "country_name": country_name,
            "platform": "Amazon",
            "source_root": str(root),
            "processed_xlsx_count": len(files),
            "canonical_records_created": len(records),
            "unmapped_count": sum(1 for x in records if x["gold_match_status"] == "unmapped"),
        }
    )
    return records, audit


def scan_shopee_country(country_name: str, root: Path, indexes: dict) -> tuple[list[dict], list[dict]]:
    meta = COUNTRY_META[country_name]
    processed_root = root / "数据处理表"
    raw_root = root / "数据底表"
    if not raw_root.exists():
        raw_root = root
    processed_files = list_processed_l1_files(processed_root)

    records: list[dict] = []
    audit: list[dict] = []
    country_l1_keys = sorted({key for (c, key), _ in indexes["by_country_l1"].items() if c == country_name})
    used_files: set[str] = set()

    # Per-l1 cache so each raw_l1 only resolves once (not once per raw_l2).
    l1_resolution_cache: dict[str, tuple[Path | None, str]] = {}

    for raw_l1_key in country_l1_keys:
        mappings = indexes["by_country_l1"].get((country_name, raw_l1_key), [])
        if not mappings:
            continue
        sample_raw_l1 = mappings[0]["raw_l1"]
        if raw_l1_key not in l1_resolution_cache:
            l1_resolution_cache[raw_l1_key] = resolve_processed_l1_workbook(sample_raw_l1, processed_root)
        path, resolution_method = l1_resolution_cache[raw_l1_key]

        for mapping in mappings:
            source_path = ""
            asset_grain = "raw_l2_slice_in_l1_processed_workbook"
            status = resolution_method
            candidate_paths: list[dict] = []
            issue: dict | None = None

            if path is not None:
                source_path = str(path)
                used_files.add(source_path)
                status = f"matched_l1_processed_workbook:{resolution_method}"
                candidate_paths = [{
                    "path": source_path,
                    "report_area": str(processed_root),
                    "file_name": path.name,
                    "version": "",
                }]
            else:
                # No processed L1 workbook resolved. For VN, raw monthly pages are the canonical source.
                vn_has_pages, page_count, period_labels = (False, 0, [])
                if meta["code"] == "VN":
                    vn_has_pages, page_count, period_labels = has_vn_raw_pages(
                        raw_root, mapping["raw_l1"], mapping["raw_l2"]
                    )

                if vn_has_pages:
                    asset_grain = "raw_l2_monthly_pages"
                    status = "resolved_via_raw_pages"
                    candidate_paths = [{
                        "path": str(raw_root),
                        "report_area": str(raw_root),
                        "file_name": f"{mapping['raw_l1']}_{mapping['raw_l2']}_*月_第*页.xlsx",
                        "page_count": page_count,
                        "period_labels": period_labels,
                    }]
                else:
                    status = "missing_source_workbook"
                    issue = {
                        "country": meta["code"],
                        "country_name": country_name,
                        "platform": "Shopee",
                        "issue_type": "missing_source_workbook",
                        "raw_l1": mapping["raw_l1"],
                        "raw_l2": mapping["raw_l2"],
                        "expected_processed_workbook": str(processed_root / f"{mapping['raw_l1']}.xlsx"),
                        "expected_raw_page_pattern": str(raw_root / f"{mapping['raw_l1']}_{mapping['raw_l2']}_*月_第*页.xlsx"),
                    }

            if issue is not None:
                audit.append(issue)

            records.append(
                {
                    "canonical_id": f"{meta['code'].lower()}_shopee_{slug(mapping['raw_l1'])}_{slug(mapping['raw_l2'])}",
                    "country": meta["code"],
                    "country_name": country_name,
                    "region": meta["region"],
                    "platform": "Shopee",
                    "asset_grain": asset_grain,
                    "raw_l1": mapping["raw_l1"],
                    "raw_l2": mapping["raw_l2"],
                    "standard_l1": mapping["standard_l1"],
                    "standard_l2": mapping["standard_l2"],
                    "include_flag": mapping["include_flag"],
                    "gold_confidence": mapping["gold_confidence"],
                    "gold_mapping_note": mapping["gold_mapping_note"],
                    "source_path": source_path,
                    "source_zone": (
                        "external_database_processed_l1_workbook" if path is not None
                        else "external_database_raw_monthly_pages" if asset_grain == "raw_l2_monthly_pages"
                        else "external_database_unresolved"
                    ),
                    "source_report_area": str(processed_root) if path is not None else str(raw_root),
                    "source_file_name": path.name if path is not None else "",
                    "gold_match_status": status,
                    "selection_rule": (
                        "gold raw_l1/raw_l2 mapping; processed l1 workbook is canonical source; filter rows by 二级类目"
                        if path is not None else
                        "gold raw_l1/raw_l2 mapping; aggregate raw monthly pages under raw_export_root"
                        if asset_grain == "raw_l2_monthly_pages" else
                        "gold raw_l1/raw_l2 mapping; no resolvable source workbook or raw pages"
                    ),
                    "candidate_count": len(candidate_paths),
                    "all_candidate_paths": candidate_paths,
                    "data_refresh_instruction": {
                        "platform_source": f"Shopee {meta['code']}",
                        "raw_l1_to_export": mapping["raw_l1"],
                        "raw_l2_to_export": mapping["raw_l2"],
                        "standard_l1": mapping["standard_l1"],
                        "standard_l2": mapping["standard_l2"],
                        "raw_export_root": str(raw_root),
                        "raw_file_pattern": f"{mapping['raw_l1']}_{mapping['raw_l2']}_{{month}}月_第{{page}}页.xlsx",
                        "processed_workbook": source_path,
                        "processed_file_pattern": f"{mapping['raw_l1']}.xlsx",
                        "processing_rule": "append monthly raw pages, rebuild country/l1 workbook, keep 国家/一级类目/二级类目/年份/月分/店铺ID/销售额USD/销量 fields",
                    },
                }
            )

    for path in processed_files:
        if str(path) not in used_files:
            audit.append(
                {
                    "country": meta["code"],
                    "country_name": country_name,
                    "platform": "Shopee",
                    "issue_type": "processed_l1_workbook_not_in_gold_mapping",
                    "raw_l1": path.stem,
                    "source_path": str(path),
                }
            )

    audit.append(
        {
            "country": meta["code"],
            "country_name": country_name,
            "platform": "Shopee",
            "source_root": str(root),
            "processed_l1_workbook_count": len(processed_files),
            "canonical_records_created": len(records),
            "missing_source_workbook_count": sum(1 for x in records if x["gold_match_status"] == "missing_source_workbook"),
            "raw_export_root": str(raw_root),
        }
    )
    return records, audit


def build_registry(canonical_sources: list[dict], audits: list[dict]) -> dict:
    count_by_market = Counter((x["country"], x["platform"]) for x in canonical_sources)
    included_by_market = Counter((x["country"], x["platform"]) for x in canonical_sources if x.get("include_flag") == "纳入")
    standard_l2_by_market = defaultdict(set)
    for item in canonical_sources:
        if item.get("standard_l2"):
            standard_l2_by_market[(item["country"], item["platform"])].add(item["standard_l2"])

    markets = []
    for country_name, meta in COUNTRY_META.items():
        key = (meta["code"], meta["platform"])
        markets.append(
            {
                "country": meta["code"],
                "country_name": country_name,
                "region": meta["region"],
                "platform": meta["platform"],
                "canonical_source_count": count_by_market[key],
                "included_source_count": included_by_market[key],
                "standard_l2_count": len(standard_l2_by_market[key]),
            }
        )

    return {
        "generated_at": GENERATED_AT,
        "asset_layer": "data_assets",
        "gold_standard": str(CATEGORY_MAPPING_XLSX),
        "raw_source_zones": {
            "amazon_external": str(AMAZON_ROOT),
            "shopee_external": str(SHOPEE_ROOT),
            "us_amazon_historical_reports": r"Z:\主线任务2-天眼计划\行业专题研究\行研报告",
        },
        "master_outputs": {
            "registry": str(DATA_ASSETS_DIR / "registry" / "ecommerce_market_asset_registry.json"),
            "canonical_sources": str(DATA_ASSETS_DIR / "canonical_sources" / "ecommerce_market_canonical_sources.json"),
            "audit": str(DATA_ASSETS_DIR / "audit" / "ecommerce_market_source_audit.json"),
        },
        "portal_cache_note": "portal/data is generated consumer cache for the web app; data_assets is the governed master layer.",
        "markets": markets,
        "audit_summary": {
            "audit_item_count": len(audits),
            "issue_count": sum(1 for x in audits if "issue_type" in x),
            "issue_type_counts": Counter(x.get("issue_type", "summary") for x in audits),
        },
    }


def write_json(path: Path, payload) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def main() -> None:
    gold_records = read_gold_mapping()
    indexes = gold_indexes(gold_records)

    canonical_sources = []
    audits = [
        {
            "generated_at": GENERATED_AT,
            "gold_standard": str(CATEGORY_MAPPING_XLSX),
            "gold_mapping_rows": len(gold_records),
            "country_mapping_counts": Counter(x["country_name"] for x in gold_records),
        }
    ]

    us_records, us_audit = load_us_amazon_sources()
    canonical_sources.extend(us_records)
    audits.extend(us_audit)

    for country_name, root in AMAZON_COUNTRY_DIRS.items():
        records, audit = scan_amazon_country(country_name, root, indexes)
        canonical_sources.extend(records)
        audits.extend(audit)

    for country_name, root in SHOPEE_COUNTRY_DIRS.items():
        records, audit = scan_shopee_country(country_name, root, indexes)
        canonical_sources.extend(records)
        audits.extend(audit)

    canonical_payload = {
        "generated_at": GENERATED_AT,
        "scope": "seven-country ecommerce market canonical sources",
        "gold_standard": str(CATEGORY_MAPPING_XLSX),
        "grain": "market raw category source; Amazon raw_l2 workbook, Shopee raw_l2 slice in processed raw_l1 workbook",
        "canonical_count": len(canonical_sources),
        "included_count": sum(1 for x in canonical_sources if x.get("include_flag") == "纳入"),
        "canonical_sources": sorted(canonical_sources, key=lambda x: (x["platform"], x["country"], x["raw_l1"], x["raw_l2"])),
    }

    audit_payload = {
        "generated_at": GENERATED_AT,
        "scope": "seven-country ecommerce market source audit",
        "audit_items": audits,
    }
    registry_payload = build_registry(canonical_sources, audits)

    write_json(DATA_ASSETS_DIR / "canonical_sources" / "ecommerce_market_canonical_sources.json", canonical_payload)
    write_json(DATA_ASSETS_DIR / "audit" / "ecommerce_market_source_audit.json", audit_payload)
    write_json(DATA_ASSETS_DIR / "registry" / "ecommerce_market_asset_registry.json", registry_payload)

    print(f"canonical_count: {canonical_payload['canonical_count']}")
    print(f"included_count: {canonical_payload['included_count']}")
    for market in registry_payload["markets"]:
        print(
            f"{market['country']} {market['platform']}: "
            f"{market['canonical_source_count']} sources, "
            f"{market['included_source_count']} included, "
            f"{market['standard_l2_count']} standard_l2"
        )
    print(f"issue_count: {registry_payload['audit_summary']['issue_count']}")
    print(f"output: {DATA_ASSETS_DIR}")


if __name__ == "__main__":
    main()
