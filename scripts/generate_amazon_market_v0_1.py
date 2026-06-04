"""Generate Amazon market monthly data for Growth Intelligence Portal v0.1.

This first adapter targets the smaller processed US Amazon folder to establish
the market module pipeline.
"""

from __future__ import annotations

import json
import os
from pathlib import Path

import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parents[1]
PORTAL_DIR = Path(os.environ.get("GIP_PORTAL_DIR", PROJECT_ROOT / "portal"))
AMAZON_DIR = Path(
    os.environ.get(
        "GIP_AMAZON_US_PROCESSED_DIR",
        r"Z:\外部数据库\Softtiem亚马逊月度数据\行业底表\amazon-US底表（已处理）",
    )
)
CATEGORY_MAPPING_XLSX = Path(
    os.environ.get(
        "GIP_CATEGORY_MAPPING_XLSX",
        r"Z:\主线任务2-天眼计划\信息可视化\类目匹配表_0602.xlsx",
    )
)
PERIOD = os.environ.get("GIP_MARKET_PERIOD", "2026-04")


def clean_number(value) -> float:
    if pd.isna(value):
        return 0.0
    text = str(value).replace(",", "").replace("%", "").replace("$", "").strip()
    if text in {"", "--", "nan"}:
        return 0.0
    try:
        return float(text)
    except ValueError:
        return 0.0


def category_name_from_file(path: Path) -> str:
    name = path.stem
    for marker in ["竞品分析底表", "市场分析报告"]:
        if marker in name:
            return name.split(marker)[0]
    return name


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


def resolve_mapping(raw_l2: str, mapping: dict[str, dict]) -> dict:
    if raw_l2 in mapping:
        out = dict(mapping[raw_l2])
        out["mapping_status"] = "matched_exact"
        return out

    for key, value in mapping.items():
        if raw_l2 in key or key in raw_l2:
            out = dict(value)
            out["mapping_status"] = "matched_fuzzy"
            out["raw_l2"] = raw_l2
            note = out.get("mapping_note", "")
            out["mapping_note"] = f"Fuzzy matched to {key}. {note}".strip()
            return out

    return {
        "raw_l1": "",
        "raw_l2": raw_l2,
        "standard_l1": "UNMAPPED",
        "standard_l2": "UNMAPPED",
        "include_flag": "观察",
        "mapping_confidence": "低",
        "mapping_note": "No mapping found in category mapping source.",
        "mapping_status": "unmapped",
    }


def read_market_sheet(path: Path) -> pd.DataFrame:
    for sheet_name in ["1_品类大盘", "1_类目细分市场分析"]:
        try:
            return pd.read_excel(path, sheet_name=sheet_name).fillna("")
        except ValueError:
            continue
    raise ValueError(f"No supported market sheet found: {path}")


def read_market_file(path: Path, mapping: dict[str, dict]) -> list[dict]:
    raw_l2 = category_name_from_file(path)
    map_info = resolve_mapping(raw_l2, mapping)
    df = read_market_sheet(path)

    rows: list[dict] = []
    for _, row in df.iterrows():
        standard_l3 = str(row.get("三级类目", "")).strip()
        if not standard_l3:
            continue

        gmv = clean_number(row.get("年估算销售额($)", row.get("总年GMV($)", 0)))
        monthly_gmv = clean_number(row.get("月销总额($)", row.get("总月销额($)", 0)))
        sales = clean_number(row.get("月总销量", row.get("总月销量", 0)))
        safe_id = f"amazon_us_{path.stem}_{standard_l3}".replace(" ", "_")

        rows.append(
            {
                "record_id": safe_id,
                "country": "US",
                "region": "North America",
                "platform": "Amazon",
                "period": PERIOD,
                "period_type": "month",
                "raw_l1": map_info["raw_l1"],
                "raw_l2": raw_l2,
                "raw_l3": standard_l3,
                "standard_l1": map_info["standard_l1"],
                "standard_l2": map_info["standard_l2"],
                "standard_l3": standard_l3,
                "include_flag": map_info["include_flag"],
                "mapping_status": map_info["mapping_status"],
                "mapping_confidence": map_info["mapping_confidence"],
                "gmv": gmv,
                "monthly_gmv": monthly_gmv,
                "sales": sales,
                "listing_count": int(clean_number(row.get("Listing数", row.get("产品数量", 0)))),
                "brand_count": int(clean_number(row.get("品牌总数", 0))),
                "cn_brand_count": int(clean_number(row.get("中国品牌数", 0))),
                "cn_brand_share": clean_number(row.get("中国品牌占比(%)", 0)),
                "cn_share": clean_number(row.get("中国品牌GMV占比(%)", 0)),
                "ad_spend_index": clean_number(row.get("加权广告花费指数", 0)),
                "marketing_intensity": clean_number(row.get("营销强度(流量依赖比%)", 0)),
                "top3_brands": str(row.get("Top3品牌", "")).strip(),
                "source_id": "amazon_softtime_monthly",
                "source_file": str(path),
            }
        )
    return rows


def summarize(rows: list[dict]) -> dict:
    included = [r for r in rows if r["include_flag"] == "纳入" and r["standard_l1"] != "UNMAPPED"]
    total_gmv = sum(r["gmv"] for r in included)
    total_monthly_gmv = sum(r["monthly_gmv"] for r in included)
    cn_gmv_weighted = sum(r["monthly_gmv"] * r["cn_share"] / 100 for r in included)

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
        "period": PERIOD,
        "period_type": "month",
        "source_id": "amazon_softtime_monthly",
        "records": len(rows),
        "included_records": len(included),
        "unmapped_records": sum(1 for r in rows if r["standard_l1"] == "UNMAPPED"),
        "total_gmv": total_gmv,
        "total_monthly_gmv": total_monthly_gmv,
        "cn_share_weighted": (cn_gmv_weighted / total_monthly_gmv * 100) if total_monthly_gmv else 0,
        "by_standard_l1": sorted(by_l1.values(), key=lambda x: x["gmv"], reverse=True),
        "by_standard_l2": sorted(by_l2.values(), key=lambda x: x["gmv"], reverse=True),
    }


def write_json(path: Path, payload) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def main() -> None:
    mapping = load_us_mapping()
    files = sorted(AMAZON_DIR.glob("*.xlsx"))
    rows: list[dict] = []
    for path in files:
        rows.extend(read_market_file(path, mapping))

    payload = {"summary": summarize(rows), "records": rows}
    out = PORTAL_DIR / "data" / "amazon" / "amazon_market_monthly.json"
    write_json(out, payload)
    print(f"amazon_market_monthly.json: {len(rows)} records from {len(files)} files")
    print(f"output: {out}")


if __name__ == "__main__":
    main()

