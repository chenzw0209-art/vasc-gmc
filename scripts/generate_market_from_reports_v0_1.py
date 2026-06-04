"""Generate market module data from historical industry report assets v0.1.

Primary target:
Z:\\主线任务2-天眼计划\\行业专题研究\\行研报告

This script normalizes existing report intermediate data into a portal-friendly
market JSON. It does not treat historical HTML as source of truth.
"""

from __future__ import annotations

import json
import os
from pathlib import Path

import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parents[1]
PORTAL_DIR = Path(os.environ.get("GIP_PORTAL_DIR", PROJECT_ROOT / "portal"))
REPORT_ROOT = Path(
    os.environ.get(
        "GIP_REPORT_ROOT",
        r"Z:\主线任务2-天眼计划\行业专题研究\行研报告",
    )
)
CATEGORY_MAPPING_XLSX = Path(
    os.environ.get(
        "GIP_CATEGORY_MAPPING_XLSX",
        r"Z:\主线任务2-天眼计划\信息可视化\类目匹配表_0602.xlsx",
    )
)


REPORT_SOURCES = [
    {
        "report_id": "3c_us_2026_04",
        "report_name": "3C 行业报告 US",
        "path": REPORT_ROOT / "3C-行业报告" / "中间数据" / "report_data_2026_04.json",
        "format": "categories_l1",
        "fallback_l1": "Consumer Tech",
        "period": "2026-04",
    },
    {
        "report_id": "beauty_us_2026_04",
        "report_name": "美容和个人护理 US",
        "path": REPORT_ROOT / "美容和个人护理-行业研究" / "中间数据" / "aggregated_data.json",
        "format": "categories_l1",
        "fallback_l1": "Beauty",
        "period": "2026-04",
    },
    {
        "report_id": "health_family_us_2026_04",
        "report_name": "健康与家庭 US",
        "path": REPORT_ROOT / "健康与家庭-行业报告 V2.0" / "中间数据" / "aggregated_data.json",
        "format": "health_l1_categories",
        "fallback_l1": "Health",
        "period": "2026-04",
    },
]


def clean_number(value) -> float:
    if value is None or pd.isna(value):
        return 0.0
    text = str(value).replace(",", "").replace("$", "").replace("%", "").strip()
    if text in {"", "--", "nan"}:
        return 0.0
    try:
        return float(text)
    except ValueError:
        return 0.0


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8-sig"))


def load_us_mapping() -> dict[str, dict]:
    df = pd.read_excel(CATEGORY_MAPPING_XLSX, sheet_name="电商类目映射表").fillna("")
    df = df[df["国家/地区"].astype(str).str.strip().eq("美国")]
    mapping: dict[str, dict] = {}
    for _, row in df.iterrows():
        raw_l2 = str(row.get("原始二级类目", "")).strip()
        if not raw_l2:
            continue
        mapping[raw_l2] = {
            "raw_l1": str(row.get("原始一级类目", "")).strip(),
            "raw_l2": raw_l2,
            "standard_l1": str(row.get("标准一级行业", "")).strip(),
            "standard_l2": str(row.get("标准二级行业", "")).strip(),
            "include_flag": str(row.get("纳入口径", "")).strip(),
            "mapping_confidence": str(row.get("置信度", "")).strip(),
            "mapping_note": str(row.get("映射说明", "")).strip(),
        }
    return mapping


def resolve_mapping(raw_l2: str, mapping: dict[str, dict], fallback_l1: str) -> dict:
    raw_l2 = str(raw_l2 or "").strip()
    if raw_l2 in mapping:
        out = dict(mapping[raw_l2])
        out["mapping_status"] = "matched_exact"
        return out

    for key, value in mapping.items():
        if raw_l2 and (raw_l2 in key or key in raw_l2):
            out = dict(value)
            out["mapping_status"] = "matched_fuzzy"
            out["raw_l2"] = raw_l2
            return out

    return {
        "raw_l1": "",
        "raw_l2": raw_l2,
        "standard_l1": fallback_l1,
        "standard_l2": raw_l2 or "未分类",
        "include_flag": "纳入",
        "mapping_confidence": "中",
        "mapping_note": "Fallback from historical report category.",
        "mapping_status": "fallback_report",
    }


def convert_categories_l1(source: dict, mapping: dict[str, dict]) -> list[dict]:
    data = load_json(source["path"])
    rows = []
    for item in data.get("categories_l1", []):
        raw_l2 = item.get("name", "")
        map_info = resolve_mapping(raw_l2, mapping, source["fallback_l1"])
        monthly_series = [clean_number(x) for x in item.get("monthly", [])]
        monthly_gmv = clean_number(item.get("gmv_curr"))
        annual_gmv = sum(monthly_series[-12:]) if monthly_series else monthly_gmv
        rows.append(
            {
                "record_id": f"{source['report_id']}_{raw_l2}".replace(" ", "_"),
                "country": "US",
                "region": "North America",
                "platform": "Amazon",
                "period": data.get("meta", {}).get("compare_curr", source["period"]),
                "period_type": "month",
                "source_id": "historical_industry_reports",
                "source_report_id": source["report_id"],
                "source_report_name": source["report_name"],
                "source_file": str(source["path"]),
                "raw_l1": map_info["raw_l1"],
                "raw_l2": raw_l2,
                "raw_l3": "",
                "standard_l1": map_info["standard_l1"],
                "standard_l2": map_info["standard_l2"],
                "standard_l3": "",
                "include_flag": map_info["include_flag"],
                "mapping_status": map_info["mapping_status"],
                "mapping_confidence": map_info["mapping_confidence"],
                "gmv": annual_gmv,
                "monthly_gmv": monthly_gmv,
                "gmv_prev": clean_number(item.get("gmv_prev")),
                "growth_rate": clean_number(item.get("mom")),
                "cn_share": clean_number(item.get("cn_share_curr")),
                "cn_share_prev": clean_number(item.get("cn_share_prev")),
                "cn_share_change": clean_number(item.get("cn_share_change")),
                "sub_count": len(data.get("subcategories", {}).get(raw_l2, [])),
                "brand_count": len(data.get("top_brands", {}).get(raw_l2, [])),
                "top3_brands": " / ".join(
                    [x.get("brand", "") for x in data.get("top_brands", {}).get(raw_l2, [])[:3]]
                ),
            }
        )
    return rows


def convert_health_l1_categories(source: dict, mapping: dict[str, dict]) -> list[dict]:
    data = load_json(source["path"])
    rows = []
    for item in data.get("l1_categories", []):
        raw_l2 = item.get("一级类目", "")
        raw_l3 = item.get("三级类目", "")
        map_info = resolve_mapping(raw_l2, mapping, source["fallback_l1"])
        rows.append(
            {
                "record_id": f"{source['report_id']}_{raw_l2}_{raw_l3}".replace(" ", "_"),
                "country": "US",
                "region": "North America",
                "platform": "Amazon",
                "period": source["period"],
                "period_type": "month",
                "source_id": "historical_industry_reports",
                "source_report_id": source["report_id"],
                "source_report_name": source["report_name"],
                "source_file": str(source["path"]),
                "raw_l1": map_info["raw_l1"],
                "raw_l2": raw_l2,
                "raw_l3": raw_l3,
                "standard_l1": map_info["standard_l1"],
                "standard_l2": map_info["standard_l2"],
                "standard_l3": raw_l3,
                "include_flag": map_info["include_flag"],
                "mapping_status": map_info["mapping_status"],
                "mapping_confidence": map_info["mapping_confidence"],
                "gmv": clean_number(item.get("总年GMV")),
                "monthly_gmv": clean_number(item.get("总月销额")),
                "gmv_prev": 0.0,
                "growth_rate": 0.0,
                "cn_share": clean_number(item.get("中国品牌GMV占比(%)")),
                "cn_share_prev": 0.0,
                "cn_share_change": 0.0,
                "sub_count": 1,
                "brand_count": int(clean_number(item.get("品牌总数"))),
                "listing_count": int(clean_number(item.get("产品数量"))),
                "top3_brands": str(item.get("TOP3品牌", "")),
            }
        )
    return rows


def summarize(rows: list[dict]) -> dict:
    included = [r for r in rows if r["include_flag"] == "纳入"]
    total_gmv = sum(r["gmv"] for r in included)
    total_monthly_gmv = sum(r["monthly_gmv"] for r in included)
    cn_weighted = sum(r["monthly_gmv"] * r["cn_share"] / 100 for r in included)
    by_l1: dict[str, dict] = {}
    by_l2: dict[str, dict] = {}

    for row in included:
        l1 = row["standard_l1"]
        l2_key = f"{row['standard_l1']}|{row['standard_l2']}"
        by_l1.setdefault(l1, {"standard_l1": l1, "gmv": 0.0, "monthly_gmv": 0.0, "records": 0})
        by_l2.setdefault(
            l2_key,
            {
                "standard_l1": row["standard_l1"],
                "standard_l2": row["standard_l2"],
                "gmv": 0.0,
                "monthly_gmv": 0.0,
                "records": 0,
            },
        )
        by_l1[l1]["gmv"] += row["gmv"]
        by_l1[l1]["monthly_gmv"] += row["monthly_gmv"]
        by_l1[l1]["records"] += 1
        by_l2[l2_key]["gmv"] += row["gmv"]
        by_l2[l2_key]["monthly_gmv"] += row["monthly_gmv"]
        by_l2[l2_key]["records"] += 1

    return {
        "generated_at": "2026-06-02",
        "platform": "Amazon",
        "country": "US",
        "period": "2026-04",
        "period_type": "month",
        "source_id": "historical_industry_reports",
        "source_root": str(REPORT_ROOT),
        "records": len(rows),
        "included_records": len(included),
        "mapping_status_counts": {
            status: sum(1 for r in rows if r["mapping_status"] == status)
            for status in sorted({r["mapping_status"] for r in rows})
        },
        "total_gmv": total_gmv,
        "total_monthly_gmv": total_monthly_gmv,
        "cn_share_weighted": (cn_weighted / total_monthly_gmv * 100) if total_monthly_gmv else 0,
        "by_standard_l1": sorted(by_l1.values(), key=lambda x: x["gmv"], reverse=True),
        "by_standard_l2": sorted(by_l2.values(), key=lambda x: x["gmv"], reverse=True),
        "report_sources": [
            {
                "report_id": src["report_id"],
                "report_name": src["report_name"],
                "path": str(src["path"]),
                "format": src["format"],
            }
            for src in REPORT_SOURCES
        ],
    }


def weighted_rate(rows: list[dict], value_key: str, weight_key: str = "monthly_gmv") -> float:
    numerator = sum(clean_number(r.get(value_key)) * clean_number(r.get(weight_key)) for r in rows)
    denominator = sum(clean_number(r.get(weight_key)) for r in rows)
    return numerator / denominator if denominator else 0.0


def aggregate_to_standard_l2(rows: list[dict]) -> list[dict]:
    groups: dict[tuple, list[dict]] = {}
    for row in rows:
        if row.get("include_flag") != "纳入":
            continue
        key = (
            row.get("platform", ""),
            row.get("country", ""),
            row.get("period", ""),
            row.get("period_type", ""),
            row.get("standard_l2", ""),
        )
        groups.setdefault(key, []).append(row)

    aggregated: list[dict] = []
    for key, items in groups.items():
        platform, country, period, period_type, standard_l2 = key
        gmv = sum(clean_number(x.get("gmv")) for x in items)
        monthly_gmv = sum(clean_number(x.get("monthly_gmv")) for x in items)
        gmv_prev = sum(clean_number(x.get("gmv_prev")) for x in items)
        source_reports = sorted({x.get("source_report_id", "") for x in items if x.get("source_report_id")})
        raw_l2_values = sorted({x.get("raw_l2", "") for x in items if x.get("raw_l2")})

        aggregated.append(
            {
                "record_id": f"{platform}_{country}_{period}_{standard_l2}".replace(" ", "_"),
                "country": country,
                "region": items[0].get("region", ""),
                "platform": platform,
                "period": period,
                "period_type": period_type,
                "source_id": "historical_industry_reports",
                "source_report_ids": source_reports,
                "source_report_names": sorted(
                    {x.get("source_report_name", "") for x in items if x.get("source_report_name")}
                ),
                "raw_l2_values": raw_l2_values,
                "standard_l1": items[0].get("standard_l1", ""),
                "standard_l2": standard_l2,
                "include_flag": "纳入",
                "mapping_status": "aggregated",
                "mapping_confidence": "",
                "gmv": gmv,
                "monthly_gmv": monthly_gmv,
                "gmv_prev": gmv_prev,
                "growth_rate": ((monthly_gmv - gmv_prev) / gmv_prev * 100) if gmv_prev else 0.0,
                "cn_share": weighted_rate(items, "cn_share"),
                "cn_share_prev": weighted_rate(items, "cn_share_prev"),
                "cn_share_change": weighted_rate(items, "cn_share_change"),
                "sub_count": sum(int(clean_number(x.get("sub_count", 1))) for x in items),
                "raw_record_count": len(items),
            }
        )

    return sorted(aggregated, key=lambda x: x["gmv"], reverse=True)


def build_diagnostics(raw_rows: list[dict], aggregated_rows: list[dict]) -> dict:
    raw_l2_groups: dict[tuple, list[dict]] = {}
    for row in raw_rows:
        key = (
            row.get("platform", ""),
            row.get("country", ""),
            row.get("period", ""),
            row.get("raw_l2", ""),
            row.get("standard_l2", ""),
        )
        raw_l2_groups.setdefault(key, []).append(row)

    duplicate_candidates = []
    for key, items in raw_l2_groups.items():
        source_reports = sorted({x.get("source_report_id", "") for x in items if x.get("source_report_id")})
        if len(items) > 1 and len(source_reports) > 1:
            duplicate_candidates.append(
                {
                    "platform": key[0],
                    "country": key[1],
                    "period": key[2],
                    "raw_l2": key[3],
                    "standard_l2": key[4],
                    "raw_record_count": len(items),
                    "source_report_ids": source_reports,
                    "gmv": sum(clean_number(x.get("gmv")) for x in items),
                    "monthly_gmv": sum(clean_number(x.get("monthly_gmv")) for x in items),
                }
            )

    multi_source_standard_l2 = [
        {
            "standard_l2": row["standard_l2"],
            "source_report_ids": row.get("source_report_ids", []),
            "raw_l2_values": row.get("raw_l2_values", []),
            "raw_record_count": row.get("raw_record_count", 0),
            "gmv": row.get("gmv", 0),
            "monthly_gmv": row.get("monthly_gmv", 0),
        }
        for row in aggregated_rows
        if len(row.get("source_report_ids", [])) > 1
    ]

    return {
        "raw_record_count": len(raw_rows),
        "aggregated_record_count": len(aggregated_rows),
        "duplicate_candidates": sorted(duplicate_candidates, key=lambda x: x["gmv"], reverse=True),
        "multi_source_standard_l2": sorted(multi_source_standard_l2, key=lambda x: x["gmv"], reverse=True),
    }


def write_json(path: Path, payload) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def main() -> None:
    mapping = load_us_mapping()
    rows: list[dict] = []
    for source in REPORT_SOURCES:
        if source["format"] == "categories_l1":
            rows.extend(convert_categories_l1(source, mapping))
        elif source["format"] == "health_l1_categories":
            rows.extend(convert_health_l1_categories(source, mapping))
        else:
            raise ValueError(f"Unsupported source format: {source['format']}")

    aggregated_records = aggregate_to_standard_l2(rows)
    payload = {
        "summary": summarize(aggregated_records),
        "aggregation_grain": "platform + country + period + standard_l2",
        "records": aggregated_records,
        "raw_records": rows,
        "diagnostics": build_diagnostics(rows, aggregated_records),
    }
    out = PORTAL_DIR / "data" / "amazon" / "amazon_market_reports_monthly.json"
    write_json(out, payload)
    print(f"amazon_market_reports_monthly.json: {len(aggregated_records)} aggregated records")
    print(f"raw_records: {len(rows)}")
    print(f"output: {out}")


if __name__ == "__main__":
    main()
