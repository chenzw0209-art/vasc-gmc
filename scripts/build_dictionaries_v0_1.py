"""Build dictionary JSON files for Growth Intelligence Portal v0.1.

Inputs default to the current local Z: drive assets. Override with env vars:

GIP_CATEGORY_MAPPING_XLSX
GIP_PORTAL_DIR
"""

from __future__ import annotations

import json
import os
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


def write_json(path: Path, payload) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def build_category_mapping() -> list[dict]:
    df = pd.read_excel(CATEGORY_MAPPING_XLSX, sheet_name="电商类目映射表")
    df = df.fillna("")

    records: list[dict] = []
    for idx, row in df.iterrows():
        records.append(
            {
                "mapping_id": f"ecmap_{idx + 1:05d}",
                "country": str(row.get("国家/地区", "")).strip(),
                "platform": "",
                "raw_l1": str(row.get("原始一级类目", "")).strip(),
                "raw_l2": str(row.get("原始二级类目", "")).strip(),
                "raw_l3": "",
                "standard_l1": str(row.get("标准一级行业", "")).strip(),
                "standard_l2": str(row.get("标准二级行业", "")).strip(),
                "standard_l3": "",
                "include_flag": str(row.get("纳入口径", "")).strip(),
                "confidence": str(row.get("置信度", "")).strip(),
                "mapping_note": str(row.get("映射说明", "")).strip(),
                "source_file": str(CATEGORY_MAPPING_XLSX),
            }
        )
    return records


def build_industry_dictionary(category_mapping: list[dict]) -> list[dict]:
    pairs = sorted(
        {
            (r["standard_l1"], r["standard_l2"])
            for r in category_mapping
            if r["standard_l1"] and r["standard_l2"]
        }
    )
    return [
        {
            "standard_l1": standard_l1,
            "standard_l2": standard_l2,
            "definition": "",
            "examples": "",
            "remark": "Generated from category_mapping_ecommerce.json v0.1",
        }
        for standard_l1, standard_l2 in pairs
    ]


def build_source_registry() -> list[dict]:
    return [
        {
            "source_id": "amazon_softtime_monthly",
            "source_name": "Softtiem Amazon monthly data",
            "source_path": r"Z:\外部数据库\Softtiem亚马逊月度数据",
            "platform": "Amazon",
            "system": "ecommerce",
            "country_scope": "US / DE / JP / MX / BR and processed industry folders",
            "period_type": "month",
            "grain": "category / brand / product",
            "target_modules": ["market", "players", "products"],
            "update_frequency": "monthly",
            "note": "Primary Amazon source for ecommerce V1.",
        },
        {
            "source_id": "shopee_monthly_recent_half_year",
            "source_name": "Shopee monthly recent half-year data",
            "source_path": r"Z:\外部数据库\虾皮月度数据（近半年）",
            "platform": "Shopee",
            "system": "ecommerce",
            "country_scope": "ID / MY / VN observed",
            "period_type": "month",
            "grain": "category / store",
            "target_modules": ["market", "players"],
            "update_frequency": "monthly",
            "note": "Country folders and aggregation scripts exist.",
        },
        {
            "source_id": "shopee_zhixia_monthly",
            "source_name": "Zhixia Shopee data",
            "source_path": r"Z:\外部数据库\知虾shopee数据",
            "platform": "Shopee",
            "system": "ecommerce",
            "country_scope": "mixed",
            "period_type": "month",
            "grain": "category / store / product-like",
            "target_modules": ["market", "players"],
            "update_frequency": "ad hoc",
            "note": "Many category-month-page files. Needs normalization before portal use.",
        },
        {
            "source_id": "tiktok_shop_kalodata_weekly",
            "source_name": "KaloData TikTok Shop weekly data",
            "source_path": r"Z:\外部数据库\kalodata周度数据",
            "platform": "TikTok Shop",
            "system": "ecommerce",
            "country_scope": "US / MY / TH / ID observed",
            "period_type": "week",
            "grain": "store / category / content",
            "target_modules": ["weekly", "market", "players", "creatives"],
            "update_frequency": "weekly",
            "note": "Useful for weekly changes and creative intelligence.",
        },
        {
            "source_id": "insight_application_data",
            "source_name": "Insight application data",
            "source_path": r"Z:\外部数据库\insight应用数据",
            "platform": "Insight",
            "system": "application",
            "country_scope": "mixed",
            "period_type": "month",
            "grain": "app / publisher / country / platform",
            "target_modules": [],
            "update_frequency": "monthly",
            "note": "Excluded from ecommerce V1. Reserve for application system.",
        },
        {
            "source_id": "historical_industry_reports",
            "source_name": "Historical industry report assets",
            "source_path": r"Z:\主线任务2-天眼计划\行业专题研究\行研报告",
            "platform": "Historical",
            "system": "historical",
            "country_scope": "mixed",
            "period_type": "mixed",
            "grain": "report / processed data",
            "target_modules": ["reference"],
            "update_frequency": "ad hoc",
            "note": "Reference only. Do not treat report HTML as source of truth.",
        },
    ]


def main() -> None:
    dictionary_dir = PORTAL_DIR / "data" / "dictionary"
    sources_dir = PORTAL_DIR / "data" / "sources"

    category_mapping = build_category_mapping()
    write_json(dictionary_dir / "category_mapping_ecommerce.json", category_mapping)
    write_json(
        dictionary_dir / "industry_dictionary_ecommerce.json",
        build_industry_dictionary(category_mapping),
    )
    write_json(sources_dir / "source_registry.json", build_source_registry())

    print(f"category_mapping_ecommerce.json: {len(category_mapping)} records")
    print("industry_dictionary_ecommerce.json: generated")
    print("source_registry.json: generated")


if __name__ == "__main__":
    main()

