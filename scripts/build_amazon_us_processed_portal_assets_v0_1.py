"""Build Amazon US portal assets from processed research bottom tables.

This script intentionally uses the processed report workbooks under
Z:\主线任务2-天眼计划\行业专题研究\行研报告, not the raw four-country export folders
from the previous handoff. Scope is Amazon US only.
"""

from __future__ import annotations

import json
import re
import time
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any

import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parents[1]
SOURCE_ROOT = Path(r"Z:\主线任务2-天眼计划\行业专题研究\行研报告")
MATCH_TABLE_GLOB = Path(r"Z:\主线任务2-天眼计划\信息可视化").glob("*0602.xlsx")
EXCLUDE_DIR_NAMES = {"AI-行业研究", "Fintech-行业研究", "3C-行业报告", "tiktok市场研究"}

OUT_MARKET = PROJECT_ROOT / "data_assets" / "curated" / "market" / "amazon_market_facts_monthly.json"
OUT_MARKET_STORY = PROJECT_ROOT / "data_assets" / "curated" / "market" / "amazon_market_story_v0_1.json"
OUT_PLAYERS = PROJECT_ROOT / "data_assets" / "curated" / "players" / "amazon_players_monthly.json"
OUT_PRODUCTS = PROJECT_ROOT / "data_assets" / "curated" / "products" / "amazon_products_monthly.json"

PORTAL_MARKET = PROJECT_ROOT / "portal" / "data" / "market" / "amazon_market_facts_monthly.json"
PORTAL_MARKET_STORY = PROJECT_ROOT / "portal" / "data" / "market" / "amazon_market_story_v0_1.json"
PORTAL_PLAYERS = PROJECT_ROOT / "portal" / "data" / "players" / "amazon_players_monthly.json"
PORTAL_PRODUCTS = PROJECT_ROOT / "portal" / "data" / "products" / "amazon_products_monthly.json"

PERIOD = "2026-04"
COUNTRY = "US"
PLATFORM = "Amazon"


def clean_number(value: Any) -> float | None:
    if value is None or pd.isna(value):
        return None
    if isinstance(value, (int, float)):
        return float(value)
    text = str(value).strip()
    if not text or text in {"--", "-", "nan", "None"}:
        return None
    text = (
        text.replace(",", "")
        .replace("$", "")
        .replace("%", "")
        .replace("+", "")
        .strip()
    )
    try:
        return float(text)
    except ValueError:
        return None


def first_col(columns: list[Any], *candidates: str) -> Any | None:
    names = [(c, str(c).strip()) for c in columns]
    for cand in candidates:
        for original, name in names:
            if name == cand:
                return original
        for original, name in names:
            if name.startswith(cand):
                return original
    return None


def norm(text: Any) -> str:
    return re.sub(r"[\s_、/|｜·・（）()［\]\[\]-]+", "", str(text or "").lower())


def source_l1_from_path(path: Path) -> str:
    rel = path.relative_to(SOURCE_ROOT)
    return rel.parts[0].replace("-行业研究", "").replace("-行业报告 V2.0", "")


def raw_l2_from_file(path: Path) -> str:
    return path.name.replace("竞品分析底表-市场大盘v1.xlsx", "")


def find_workbooks() -> list[Path]:
    files = []
    for path in SOURCE_ROOT.rglob("*竞品分析底表-市场大盘v1.xlsx"):
        try:
            top = path.relative_to(SOURCE_ROOT).parts[0]
        except ValueError:
            continue
        if top in EXCLUDE_DIR_NAMES:
            continue
        files.append(path)
    return sorted(files, key=lambda p: str(p))


def load_mapping() -> dict[str, dict[str, str]]:
    paths = list(MATCH_TABLE_GLOB)
    if not paths:
        return {}
    df = pd.read_excel(paths[0], sheet_name=0)
    mapping: dict[str, dict[str, str]] = {}
    for _, row in df.iterrows():
        country = str(row.get("国家/地区", "")).strip()
        if country and country not in {"美国", "US", "美区", "Amazon US"}:
            continue
        raw_l2 = str(row.get("原始二级类目", "")).strip()
        raw_l1 = str(row.get("原始一级类目", "")).strip()
        if not raw_l2:
            continue
        mapping[norm(raw_l2)] = {
            "standard_l1": str(row.get("标准一级行业", "")).strip() or "Unmapped",
            "standard_l2": str(row.get("标准二级行业", "")).strip() or raw_l2,
            "inclusion": str(row.get("纳入口径", "")).strip(),
            "confidence": str(row.get("置信度", "")).strip(),
            "note": str(row.get("映射说明", "")).strip(),
            "raw_l1": raw_l1,
            "raw_l2": raw_l2,
        }
    return mapping


def resolve_mapping(raw_l1: str, raw_l2: str, mapping: dict[str, dict[str, str]]) -> dict[str, str]:
    hit = mapping.get(norm(raw_l2))
    if hit:
        fixed = dict(hit)
        fixed["standard_l2"] = postprocess_standard_l2(raw_l1, raw_l2, fixed["standard_l1"], fixed["standard_l2"])
        return {**fixed, "mapping_quality": "matched_category_mapping_0602"}
    fallback_l1 = infer_l1(raw_l1, raw_l2)
    return {
        "standard_l1": fallback_l1,
        "standard_l2": postprocess_standard_l2(raw_l1, raw_l2, fallback_l1, raw_l2),
        "inclusion": "纳入",
        "confidence": "低",
        "note": "未命中类目匹配表，暂按处理后底表类目回退",
        "raw_l1": raw_l1,
        "raw_l2": raw_l2,
        "mapping_quality": "fallback_processed_l2",
    }


def postprocess_standard_l2(raw_l1: str, raw_l2: str, standard_l1: str, standard_l2: str) -> str:
    """Small guardrail for broad Fashion mappings in the 0602 workbook."""
    text = f"{raw_l1} {raw_l2}"
    if standard_l1 == "Fashion" or "服装、鞋和珠宝" in raw_l1:
        if any(k in text for k in ["时装", "服装", "女式", "男式", "制服"]):
            return "服饰/时装"
        if "鞋" in text:
            return "鞋履"
        if any(k in text for k in ["珠宝", "手表", "首饰"]):
            return "珠宝配饰"
        if any(k in text for k in ["包", "箱包", "行李"]):
            return "箱包配饰"
    return standard_l2


def infer_l1(raw_l1: str, raw_l2: str) -> str:
    text = f"{raw_l1} {raw_l2}"
    rules = [
        ("Fashion", ["服装", "鞋", "珠宝", "箱包"]),
        ("Beauty", ["美容", "个人护理", "护肤", "化妆"]),
        ("Lifestyle", ["厨房", "家庭", "宠物", "玩具", "运动", "户外", "乐器", "手工", "艺术", "杂货"]),
        ("Consumer Electronics", ["电子", "手机", "相机", "计算机", "电子游戏"]),
        ("Home Improvement", ["工具", "家庭改善", "工业", "科学", "汽车", "花园", "草坪"]),
        ("Health", ["健康", "保健", "医疗", "婴儿", "宝贝"]),
    ]
    for label, keywords in rules:
        if any(k in text for k in keywords):
            return label
    return "Lifestyle"


def read_sheet(path: Path, sheet_index: int) -> pd.DataFrame:
    try:
        return pd.read_excel(path, sheet_name=sheet_index)
    except Exception:
        return pd.DataFrame()


def latest_month(cols: list[Any]) -> str | None:
    months = sorted([str(c) for c in cols if re.fullmatch(r"\d{4}-\d{2}", str(c))], reverse=True)
    return months[0] if months else None


def row_text(value: Any) -> str:
    if value is None or pd.isna(value):
        return ""
    return str(value).strip()


def build_assets() -> tuple[dict, dict, dict, dict]:
    mapping = load_mapping()
    files = find_workbooks()
    diagnostics = []

    market_rows = []
    player_rows = []
    product_rows = []
    trend_rows = []

    for path in files:
        raw_l1 = source_l1_from_path(path)
        raw_l2 = raw_l2_from_file(path)
        mapped = resolve_mapping(raw_l1, raw_l2, mapping)

        sheet1 = read_sheet(path, 0)
        sheet2 = read_sheet(path, 1)
        sheet3 = read_sheet(path, 2)
        sheet4 = read_sheet(path, 3)
        sheet5 = read_sheet(path, 4)

        if sheet1.empty:
            diagnostics.append({"source_file": str(path), "status": "missing_sheet1"})
            continue

        l3_col = first_col(list(sheet1.columns), "三级类目", "四级类目", "品类")
        sub_col = first_col(list(sheet1.columns), "主要细分类目")
        product_count_col = first_col(list(sheet1.columns), "产品数量")
        monthly_sales_col = first_col(list(sheet1.columns), "总月销量")
        monthly_gmv_col = first_col(list(sheet1.columns), "总月销额", "总月销额($)")
        annual_gmv_col = first_col(list(sheet1.columns), "总年GMV", "总年GMV($)")
        brand_count_col = first_col(list(sheet1.columns), "品牌总数")
        cn_brand_col = first_col(list(sheet1.columns), "中国品牌数")
        cn_share_col = first_col(list(sheet1.columns), "中国品牌GMV占比")
        ad_col = first_col(list(sheet1.columns), "加权广告花费指数")
        traffic_col = first_col(list(sheet1.columns), "营销强度", "流量依赖比")
        top_brand_col = first_col(list(sheet1.columns), "TOP3品牌")

        gmv = 0.0
        monthly = 0.0
        cn_weight = 0.0
        product_count = 0.0
        brand_count = 0.0
        raw_l3_values = []
        top_brands = []
        sub_segments = []
        weighted_ad_num = weighted_traffic_num = 0.0

        for _, row in sheet1.iterrows():
            row_gmv = clean_number(row.get(annual_gmv_col)) or 0.0
            row_monthly = clean_number(row.get(monthly_gmv_col)) or 0.0
            row_products = clean_number(row.get(product_count_col)) or 0.0
            row_brand_count = clean_number(row.get(brand_count_col)) or 0.0
            row_cn_share = clean_number(row.get(cn_share_col))
            gmv += row_gmv
            monthly += row_monthly
            product_count += row_products
            brand_count += row_brand_count
            if row_cn_share is not None:
                cn_weight += row_monthly * row_cn_share / 100
            ad_value = clean_number(row.get(ad_col))
            traffic_value = clean_number(row.get(traffic_col))
            if ad_value is not None:
                weighted_ad_num += row_monthly * ad_value
            if traffic_value is not None:
                weighted_traffic_num += row_monthly * traffic_value
            l3 = row_text(row.get(l3_col))
            if l3:
                raw_l3_values.append(l3)
            sub = row_text(row.get(sub_col))
            if sub:
                sub_segments.extend([x.strip() for x in re.split(r"[/、,，]", sub) if x.strip()])
            brands = row_text(row.get(top_brand_col))
            if brands:
                top_brands.extend([x.strip() for x in re.split(r"[/、,，]", brands) if x.strip()])

            if l3 and row_monthly > 0:
                product_rows.append(
                    {
                        "product_id": f"us_amazon_{norm(raw_l2)}_{norm(l3)}",
                        "product_opportunity_id": f"us_amazon_{norm(raw_l2)}_{norm(l3)}",
                        "product_name": l3,
                        "standard_l1": mapped["standard_l1"],
                        "standard_l2": mapped["standard_l2"],
                        "standard_l3": l3,
                        "raw_l1": raw_l1,
                        "raw_l2": raw_l2,
                        "country": COUNTRY,
                        "country_name": "美国",
                        "platform": PLATFORM,
                        "period": PERIOD,
                        "monthly_gmv_usd": row_monthly,
                        "gmv": row_gmv,
                        "annual_gmv_usd": row_gmv,
                        "monthly_sales": clean_number(row.get(monthly_sales_col)),
                        "listing_monthly_sales": clean_number(row.get(monthly_sales_col)),
                        "product_count": row_products,
                        "brand_count": row_brand_count,
                        "cn_share": row_cn_share or 0.0,
                        "growth_rate": 0.0,
                        "brand": "",
                        "asin": "",
                        "price_usd": None,
                        "major_segments": sub,
                        "representative_players": brands,
                        "source_quality": "processed category bottom table; product opportunity, not SKU",
                        "source_file": str(path),
                        "mapping_quality": mapped["mapping_quality"],
                    }
                )

        # Month-on-month growth from brand trend sheet.
        growth = 0.0
        monthly_trend: dict[str, float] = {}
        trend_month = latest_month(list(sheet4.columns)) if not sheet4.empty else None
        if trend_month:
            months = sorted([str(c) for c in sheet4.columns if re.fullmatch(r"\d{4}-\d{2}", str(c))], reverse=True)
            for month in months:
                monthly_trend[month] = sum(clean_number(x) or 0.0 for x in sheet4[month].tolist())
            if len(months) >= 2:
                now = monthly_trend[months[0]]
                prev = monthly_trend[months[1]]
                growth = ((now - prev) / prev * 100) if prev else 0.0
                trend_rows.append({"raw_l2": raw_l2, "current_month": months[0], "previous_month": months[1], "current_gmv": now, "previous_gmv": prev})

        cn_share = (cn_weight / monthly * 100) if monthly else 0.0
        market_rows.append(
            {
                "country": COUNTRY,
                "country_name": "美国",
                "platform": PLATFORM,
                "period": PERIOD,
                "standard_l1": mapped["standard_l1"],
                "standard_l2": mapped["standard_l2"],
                "raw_l1_values": [raw_l1],
                "raw_l2_values": [raw_l2],
                "gmv": gmv,
                "monthly_gmv": monthly,
                "prev_monthly_gmv": monthly / (1 + growth / 100) if growth > -99 else 0.0,
                "growth_rate": growth,
                "cn_share": cn_share,
                "cn_monthly_gmv": cn_weight,
                "cn_annual_gmv": gmv * cn_share / 100,
                "product_count": product_count,
                "brand_count": brand_count,
                "canonical_source_count": 1,
                "raw_l2_count": 1,
                "top_brands": list(dict.fromkeys(top_brands))[:8],
                "major_segments": " / ".join(list(dict.fromkeys(sub_segments))[:8]),
                "monthly_trend": monthly_trend,
                "raw_l3_values": list(dict.fromkeys(raw_l3_values))[:30],
                "ad_spend_index": (weighted_ad_num / monthly) if monthly else None,
                "traffic_dependency": (weighted_traffic_num / monthly) if monthly else None,
                "mapping_quality": mapped["mapping_quality"],
                "mapping_confidence": mapped["confidence"],
                "mapping_note": mapped["note"],
                "source_file": str(path),
                "read_status": "ok",
            }
        )

        if not sheet3.empty:
            brand_col = first_col(list(sheet3.columns), "品牌")
            cn_col = first_col(list(sheet3.columns), "是否中国品牌")
            nation_col = first_col(list(sheet3.columns), "国籍", "卖家国籍")
            l3_brand_col = first_col(list(sheet3.columns), "主要三级类目", "主要四级类目")
            desc_col = first_col(list(sheet3.columns), "品牌产品简述")
            listing_col = first_col(list(sheet3.columns), "Listing数")
            b_monthly_sales_col = first_col(list(sheet3.columns), "月销量")
            b_monthly_gmv_col = first_col(list(sheet3.columns), "月销额", "月销额($)")
            b_annual_gmv_col = first_col(list(sheet3.columns), "年估算GMV", "年GMV")
            price_col = first_col(list(sheet3.columns), "加权均价", "加权价格")
            traffic_b_col = first_col(list(sheet3.columns), "流量依赖比")
            for _, row in sheet3.iterrows():
                brand = row_text(row.get(brand_col))
                if not brand:
                    continue
                b_monthly = clean_number(row.get(b_monthly_gmv_col)) or 0.0
                if b_monthly <= 0:
                    continue
                is_cn = row_text(row.get(cn_col)) == "是"
                player_rows.append(
                    {
                        "player_id": f"us_amazon_{norm(raw_l2)}_{norm(brand)}",
                        "brand": brand,
                        "company": "",
                        "country": COUNTRY,
                        "platform": PLATFORM,
                        "period": PERIOD,
                        "standard_l1": mapped["standard_l1"],
                        "standard_l2": mapped["standard_l2"],
                        "main_l3": row_text(row.get(l3_brand_col)),
                        "estimated_gmv": clean_number(row.get(b_annual_gmv_col)) or b_monthly * 12,
                        "estimated_monthly_gmv": b_monthly,
                        "monthly_sales": clean_number(row.get(b_monthly_sales_col)),
                        "listing_count": clean_number(row.get(listing_col)),
                        "weighted_price": clean_number(row.get(price_col)),
                        "traffic_dependency": clean_number(row.get(traffic_b_col)),
                        "cn_flag": is_cn,
                        "nationality": "中国" if is_cn else row_text(row.get(nation_col)),
                        "industry_count": 1,
                        "evidence_count": 1,
                        "growth_reason": "",
                        "signal_keyword": "",
                        "action_hint": "头部品牌且有处理后底表证据，优先核公司主体、近期新品和PR事件",
                        "brand_product_summary": row_text(row.get(desc_col)),
                        "source_quality": "processed brand competition sheet",
                        "source_file": str(path),
                    }
                )

        if not sheet5.empty:
            tag_col = first_col(list(sheet5.columns), "标签(中文)", "标签（中文）")
            dim_col = first_col(list(sheet5.columns), "维度")
            count_col = first_col(list(sheet5.columns), "出现次数")
            share_col = first_col(list(sheet5.columns), "Listing占比")
            for _, row in sheet5.head(80).iterrows():
                tag = row_text(row.get(tag_col))
                if not tag:
                    continue
                product_rows.append(
                    {
                        "product_id": f"us_amazon_tag_{norm(raw_l2)}_{norm(tag)}",
                        "product_opportunity_id": f"us_amazon_tag_{norm(raw_l2)}_{norm(tag)}",
                        "product_name": tag,
                        "standard_l1": mapped["standard_l1"],
                        "standard_l2": mapped["standard_l2"],
                        "standard_l3": row_text(row.get(dim_col)) or "买点话术",
                        "raw_l1": raw_l1,
                        "raw_l2": raw_l2,
                        "country": COUNTRY,
                        "country_name": "美国",
                        "platform": PLATFORM,
                        "period": PERIOD,
                        "monthly_gmv_usd": 0,
                        "gmv": 0,
                        "annual_gmv_usd": 0,
                        "monthly_sales": None,
                        "listing_monthly_sales": None,
                        "product_count": clean_number(row.get(count_col)),
                        "brand_count": None,
                        "cn_share": 0,
                        "growth_rate": 0,
                        "brand": "",
                        "asin": "",
                        "price_usd": None,
                        "major_segments": f"{row_text(row.get(dim_col))}: {tag}",
                        "representative_players": "",
                        "source_quality": "processed buying-point sheet",
                        "source_file": str(path),
                        "mapping_quality": mapped["mapping_quality"],
                        "listing_share": clean_number(row.get(share_col)),
                    }
                )

        diagnostics.append({"source_file": str(path), "status": "ok", "raw_l1": raw_l1, "raw_l2": raw_l2})

    market_records = aggregate_market(market_rows)
    player_records = aggregate_players(player_rows)
    product_records = sorted(product_rows, key=lambda x: x.get("monthly_gmv_usd") or x.get("product_count") or 0, reverse=True)
    enrich_growth(market_records, player_records, product_records)

    summary = {
        "generated_at": time.strftime("%Y-%m-%d"),
        "scope": "Amazon US processed research bottom tables",
        "period": PERIOD,
        "country_scope": [COUNTRY],
        "platform_scope": [PLATFORM],
        "source_root": str(SOURCE_ROOT),
        "category_mapping": str(next(Path(r"Z:\主线任务2-天眼计划\信息可视化").glob("*0602.xlsx"))),
        "excluded_source_dirs": sorted(EXCLUDE_DIR_NAMES),
        "raw_workbooks_scanned": len(files),
        "read_ok_count": sum(1 for d in diagnostics if d["status"] == "ok"),
        "read_failed_count": sum(1 for d in diagnostics if d["status"] != "ok"),
        "currency": "USD",
        "grain": "US Amazon / standard_l1 / standard_l2",
        "limitations": [
            "当前读取已处理底表 Sheet 1-5，不读取原始 SKU 产品表；产品页展示的是三级类目与买点机会，不是 SKU。",
            "排除 AI、Fintech、3C、TikTok 四个目录；3C 后续可单独按同口径接回。",
            "一级行业优先使用类目匹配表_0602.xlsx；未命中时按目录和类目关键词回退。",
        ],
    }

    market_payload = {
        "summary": {
            **summary,
            "standard_l2_record_count": len(market_records),
            "raw_source_count": len(files),
            "total_gmv": sum(x["gmv"] for x in market_records),
            "total_monthly_gmv": sum(x["monthly_gmv"] for x in market_records),
            "cn_share_weighted": weighted_cn_share(market_records),
        },
        "records": market_records,
        "raw_source_records": market_rows,
        "read_diagnostics": diagnostics,
    }
    story_payload = build_story(market_payload)
    players_payload = {
        "summary": {**summary, "grain": "US Amazon / standard_l2 / brand", "record_count": len(player_records)},
        "records": player_records,
    }
    products_payload = {
        "summary": {**summary, "grain": "US Amazon / standard_l2 / product opportunity", "record_count": len(product_records)},
        "records": product_records[:12000],
    }
    return market_payload, story_payload, players_payload, products_payload


def aggregate_market(rows: list[dict]) -> list[dict]:
    groups: dict[tuple[str, str], list[dict]] = defaultdict(list)
    for row in rows:
        groups[(row["standard_l1"], row["standard_l2"])].append(row)
    records = []
    for (l1, l2), items in groups.items():
        monthly = sum(x["monthly_gmv"] for x in items)
        gmv = sum(x["gmv"] for x in items)
        cn_monthly = sum(x["cn_monthly_gmv"] for x in items)
        top_brands = []
        raw_l2_values = []
        raw_l3_values = []
        segments = []
        monthly_trend = defaultdict(float)
        for item in items:
            top_brands.extend(item.get("top_brands") or [])
            raw_l2_values.extend(item.get("raw_l2_values") or [])
            raw_l3_values.extend(item.get("raw_l3_values") or [])
            if item.get("major_segments"):
                segments.extend([x.strip() for x in item["major_segments"].split("/") if x.strip()])
            for month, value in (item.get("monthly_trend") or {}).items():
                monthly_trend[month] += value
        growth = weighted_growth(items)
        records.append(
            {
                "country": COUNTRY,
                "country_name": "美国",
                "platform": PLATFORM,
                "period": PERIOD,
                "standard_l1": l1,
                "standard_l2": l2,
                "gmv": gmv,
                "monthly_gmv": monthly,
                "prev_monthly_gmv": monthly / (1 + growth / 100) if growth > -99 else 0,
                "growth_rate": growth,
                "cn_share": (cn_monthly / monthly * 100) if monthly else 0,
                "cn_monthly_gmv": cn_monthly,
                "cn_annual_gmv": gmv * ((cn_monthly / monthly) if monthly else 0),
                "product_count": sum(x.get("product_count") or 0 for x in items),
                "brand_count": sum(x.get("brand_count") or 0 for x in items),
                "canonical_source_count": len(items),
                "raw_l2_count": len(set(raw_l2_values)),
                "raw_l2_values": list(dict.fromkeys(raw_l2_values)),
                "raw_l3_values": list(dict.fromkeys(raw_l3_values))[:60],
                "top_brands": list(dict.fromkeys(top_brands))[:12],
                "major_segments": " / ".join(list(dict.fromkeys(segments))[:10]),
                "monthly_trend": dict(sorted(monthly_trend.items())),
                "traffic_dependency": weighted_average(items, "traffic_dependency", "monthly_gmv"),
                "ad_spend_index": weighted_average(items, "ad_spend_index", "monthly_gmv"),
                "read_status": "ok",
            }
        )
    return sorted(records, key=lambda x: x["gmv"], reverse=True)


def aggregate_players(rows: list[dict]) -> list[dict]:
    groups: dict[tuple[str, str], list[dict]] = defaultdict(list)
    for row in rows:
        groups[(row["standard_l2"], norm(row["brand"]))].append(row)
    records = []
    for (_, _), items in groups.items():
        top = max(items, key=lambda x: x.get("estimated_monthly_gmv") or 0)
        records.append(
            {
                **top,
                "estimated_gmv": sum(x.get("estimated_gmv") or 0 for x in items),
                "estimated_monthly_gmv": sum(x.get("estimated_monthly_gmv") or 0 for x in items),
                "industry_count": len(set(x["standard_l2"] for x in items)),
                "evidence_count": len(items),
            }
        )
    return sorted(records, key=lambda x: x["estimated_gmv"], reverse=True)[:5000]


def weighted_growth(items: list[dict]) -> float:
    prev = sum(x.get("prev_monthly_gmv") or 0 for x in items)
    now = sum(x.get("monthly_gmv") or 0 for x in items)
    return ((now - prev) / prev * 100) if prev else 0.0


def weighted_average(items: list[dict], value_key: str, weight_key: str) -> float | None:
    num = den = 0.0
    for item in items:
        value = item.get(value_key)
        weight = item.get(weight_key) or 0
        if value is None:
            continue
        num += value * weight
        den += weight
    return num / den if den else None


def weighted_cn_share(records: list[dict]) -> float:
    total = sum(x["monthly_gmv"] for x in records)
    cn = sum(x["cn_monthly_gmv"] for x in records)
    return cn / total * 100 if total else 0


def enrich_growth(market: list[dict], players: list[dict], products: list[dict]) -> None:
    for row in market:
        row["growth_reason"] = growth_reason(row)
        row["signal_keyword"] = signal_keyword(row)
        row["action_hint"] = market_action(row)
    reason_by_l2 = {x["standard_l2"]: x["growth_reason"] for x in market}
    signal_by_l2 = {x["standard_l2"]: x["signal_keyword"] for x in market}
    for row in players:
        row["growth_reason"] = reason_by_l2.get(row["standard_l2"], "")
        row["signal_keyword"] = signal_by_l2.get(row["standard_l2"], "")
    for row in products:
        row["growth_reason"] = reason_by_l2.get(row["standard_l2"], "")
        row["signal_keyword"] = signal_by_l2.get(row["standard_l2"], "")
        row["tracking_focus"] = product_action(row)
        row["action_hint"] = product_action(row)


def growth_reason(row: dict) -> str:
    parts = []
    if row["growth_rate"] >= 8:
        parts.append(f"近月 GMV 环比增长 {row['growth_rate']:.1f}%，说明需求或季节窗口正在释放。")
    elif row["growth_rate"] <= -8:
        parts.append(f"近月 GMV 环比 {row['growth_rate']:.1f}%，短期更适合看结构性修复和低基数反弹。")
    else:
        parts.append("近月 GMV 相对平稳，更适合从头部品牌集中度、买点升级和中国品牌渗透看机会。")
    if row["cn_share"] >= 35:
        parts.append(f"中国品牌 GMV 占比 {row['cn_share']:.1f}%，已有出海品牌验证。")
    elif row["cn_share"] <= 10:
        parts.append(f"中国品牌 GMV 占比仅 {row['cn_share']:.1f}%，若供应链有优势，存在低渗透切入空间。")
    if row.get("traffic_dependency") is not None and row["traffic_dependency"] >= 45:
        parts.append("流量依赖较高，PR、测评、达人内容和站外种草更可能影响竞争格局。")
    return "".join(parts)


def signal_keyword(row: dict) -> str:
    tags = []
    if row["growth_rate"] >= 8:
        tags.append("环比增长")
    if row["cn_share"] >= 35:
        tags.append("中国品牌渗透")
    if row.get("traffic_dependency") is not None and row["traffic_dependency"] >= 45:
        tags.append("内容/广告驱动")
    if row.get("ad_spend_index") is not None and row["ad_spend_index"] >= 50:
        tags.append("广告竞争")
    tags.extend((row.get("raw_l3_values") or [])[:3])
    return " / ".join(list(dict.fromkeys(tags))[:6])


def market_action(row: dict) -> str:
    if row["gmv"] >= 1e9 and row["growth_rate"] >= 5:
        return "优先建专题：规模和增长同时成立"
    if row["cn_share"] >= 35:
        return "优先找客户：已有中国品牌验证"
    if row["traffic_dependency"] and row["traffic_dependency"] >= 45:
        return "优先找打法：内容和广告杠杆明显"
    return "继续观察：补事件和SKU证据"


def product_action(row: dict) -> str:
    if row.get("monthly_gmv_usd", 0) > 0:
        return "先看该细分类目的 Top 品牌、价格带、买点和评价口径，再决定是否下钻 SKU。"
    return "作为买点/话术信号，回到对应细分类目里找承载 SKU。"


def build_story(market_payload: dict) -> dict:
    records = market_payload["records"]
    top = records[:12]
    l1 = defaultdict(float)
    for row in records:
        l1[row["standard_l1"]] += row["monthly_gmv"]
    return {
        "generated_at": time.strftime("%Y-%m-%d"),
        "scope": "Amazon US processed research story package",
        "summary": market_payload["summary"],
        "kpis": [
            {"label": "年 GMV", "value": market_payload["summary"]["total_gmv"]},
            {"label": "月 GMV", "value": market_payload["summary"]["total_monthly_gmv"]},
            {"label": "CN GMV 占比", "value": market_payload["summary"]["cn_share_weighted"]},
            {"label": "标准二级行业", "value": len(records)},
        ],
        "chart_specs": {
            "top_l2_annual_gmv_bar": top,
            "standard_l1_monthly_gmv": [{"standard_l1": k, "monthly_gmv": v} for k, v in sorted(l1.items(), key=lambda x: x[1], reverse=True)],
            "growth_signal_curve_candidates": [x for x in records if abs(x["growth_rate"]) >= 5][:30],
        },
        "insights": [
            {
                "title": f"{top[0]['standard_l2']} 是当前 Amazon US 已处理底表里的最大机会池" if top else "暂无数据",
                "summary": f"年 GMV ${top[0]['gmv']/1e9:.2f}B，月 GMV ${top[0]['monthly_gmv']/1e6:.1f}M，CN 占比 {top[0]['cn_share']:.1f}%。" if top else "",
                "action": "先看行业，再看头部品牌，再落到细分类目和买点。",
            }
        ],
    }


def write_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def main() -> None:
    market, story, players, products = build_assets()
    for path, payload in [
        (OUT_MARKET, market),
        (PORTAL_MARKET, market),
        (OUT_MARKET_STORY, story),
        (PORTAL_MARKET_STORY, story),
        (OUT_PLAYERS, players),
        (PORTAL_PLAYERS, players),
        (OUT_PRODUCTS, products),
        (PORTAL_PRODUCTS, products),
    ]:
        write_json(path, payload)
    print(f"market records: {len(market['records'])}")
    print(f"player records: {len(players['records'])}")
    print(f"product records: {len(products['records'])}")
    print(f"workbooks: {market['summary']['raw_workbooks_scanned']}, ok: {market['summary']['read_ok_count']}")
    print(f"monthly GMV: {market['summary']['total_monthly_gmv']:,.2f}")


if __name__ == "__main__":
    main()
