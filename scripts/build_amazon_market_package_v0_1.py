"""Build Amazon-only market package for the first web design sprint.

Input:
- data_assets/curated/market/ecommerce_market_facts_monthly.json

Outputs:
- data_assets/curated/market/amazon_market_facts_monthly.json
- data_assets/curated/market/amazon_market_story_v0_1.json
- portal/data/market/amazon_market_facts_monthly.json
- portal/data/market/amazon_market_story_v0_1.json

Rationale:
Shopee raw Excel volume is too large for the current sprint. We keep Shopee in
governance records, but the presentable web scope is US/MX/JP/BR Amazon.
"""

from __future__ import annotations

import json
from collections import Counter, defaultdict
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DATA_ASSETS = PROJECT_ROOT / "data_assets"
INPUT_FACTS = DATA_ASSETS / "curated" / "market" / "ecommerce_market_facts_monthly.json"
OUT_CURATED_FACTS = DATA_ASSETS / "curated" / "market" / "amazon_market_facts_monthly.json"
OUT_CURATED_STORY = DATA_ASSETS / "curated" / "market" / "amazon_market_story_v0_1.json"
OUT_PORTAL_FACTS = PROJECT_ROOT / "portal" / "data" / "market" / "amazon_market_facts_monthly.json"
OUT_PORTAL_STORY = PROJECT_ROOT / "portal" / "data" / "market" / "amazon_market_story_v0_1.json"

COUNTRY_NAMES = {
    "US": "美国",
    "MX": "墨西哥",
    "JP": "日本",
    "BR": "巴西",
}

AMAZON_FX_TO_USD = {
    "US": 1.0,
    "MX": 1.0 / 17.4433,
    "JP": 1.0 / 159.344,
    "BR": 1.0 / 5.0331,
}

MONEY_FIELDS = [
    "gmv",
    "monthly_gmv",
    "prev_monthly_gmv",
    "cn_monthly_gmv",
    "cn_annual_gmv",
]


def money_b(value: float) -> str:
    return f"${value / 1e9:.2f}B"


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def amazon_records(payload: dict) -> tuple[list[dict], list[dict]]:
    records = [apply_amazon_fx(x) for x in payload["records"] if x.get("platform") == "Amazon"]
    raw = [apply_amazon_fx(x) for x in payload["raw_source_records"] if x.get("platform") == "Amazon"]
    return records, raw


def apply_amazon_fx(row: dict) -> dict:
    item = dict(row)
    country = item.get("country")
    target_fx = AMAZON_FX_TO_USD.get(country)
    if not target_fx:
        return item

    old_fx = item.get("fx_to_usd")
    native_monthly = item.get("native_monthly_gmv")
    native_annual = item.get("native_annual_gmv")
    if native_monthly is not None:
        item["monthly_gmv"] = native_monthly * target_fx
    elif old_fx:
        item["monthly_gmv"] = item.get("monthly_gmv", 0.0) / old_fx * target_fx

    if native_annual is not None:
        item["gmv"] = native_annual * target_fx
    elif old_fx:
        item["gmv"] = item.get("gmv", 0.0) / old_fx * target_fx

    if old_fx:
        for field in MONEY_FIELDS:
            if field in {"monthly_gmv", "gmv"}:
                continue
            item[field] = item.get(field, 0.0) / old_fx * target_fx
    item["fx_to_usd"] = target_fx
    return item


def summarize(records: list[dict], raw_records: list[dict], source_summary: dict) -> dict:
    total_gmv = sum(x.get("gmv", 0.0) for x in records)
    total_monthly_gmv = sum(x.get("monthly_gmv", 0.0) for x in records)
    cn_monthly_gmv = sum(x.get("cn_monthly_gmv", 0.0) for x in records)

    market_monthly_gmv = defaultdict(float)
    market_annual_gmv = defaultdict(float)
    market_l2_counts = Counter()
    raw_source_counts = Counter()
    read_ok_counts = Counter()
    for row in records:
        key = f"{row['country']}_Amazon"
        market_monthly_gmv[key] += row.get("monthly_gmv", 0.0)
        market_annual_gmv[key] += row.get("gmv", 0.0)
        market_l2_counts[key] += 1
    for row in raw_records:
        key = f"{row['country']}_Amazon"
        raw_source_counts[key] += 1
        if row.get("read_status") == "ok":
            read_ok_counts[key] += 1

    return {
        "generated_at": "2026-06-02",
        "scope": "Amazon market facts for web design sprint",
        "decision": "Shopee is deferred to phase 2 because raw Excel scale slows the data loop.",
        "grain": "country/platform/standard_l2",
        "period": "2026-04",
        "period_type": "month",
        "currency": "USD",
        "gold_standard": source_summary.get("gold_standard", ""),
        "fx_to_usd": AMAZON_FX_TO_USD,
        "fx_note": "Amazon MX/JP/BR converted from native currency using 2026-04 reference rates: 1 USD = 17.4433 MXN, 159.344 JPY, 5.0331 BRL.",
        "country_scope": ["US", "MX", "JP", "BR"],
        "standard_l2_record_count": len(records),
        "raw_source_count": len(raw_records),
        "read_ok_count": sum(1 for x in raw_records if x.get("read_status") == "ok"),
        "read_failed_count": sum(1 for x in raw_records if x.get("read_status") != "ok"),
        "total_gmv": total_gmv,
        "total_monthly_gmv": total_monthly_gmv,
        "cn_share_weighted": (cn_monthly_gmv / total_monthly_gmv * 100) if total_monthly_gmv else 0.0,
        "market_monthly_gmv": {k: round(v, 2) for k, v in sorted(market_monthly_gmv.items())},
        "market_annual_gmv": {k: round(v, 2) for k, v in sorted(market_annual_gmv.items())},
        "market_l2_counts": dict(sorted(market_l2_counts.items())),
        "raw_source_counts": dict(sorted(raw_source_counts.items())),
        "read_ok_counts": dict(sorted(read_ok_counts.items())),
    }


def top_records(records: list[dict], limit: int = 12) -> list[dict]:
    return [
        {
            "rank": idx + 1,
            "country": row["country"],
            "country_name": COUNTRY_NAMES.get(row["country"], row["country"]),
            "standard_l2": row["standard_l2"],
            "gmv": row.get("gmv", 0.0),
            "monthly_gmv": row.get("monthly_gmv", 0.0),
            "cn_share": row.get("cn_share", 0.0),
            "growth_rate": row.get("growth_rate", 0.0),
            "raw_l2_count": row.get("raw_l2_count", 0),
            "top_brands": row.get("top_brands", [])[:5],
        }
        for idx, row in enumerate(sorted(records, key=lambda x: x.get("gmv", 0.0), reverse=True)[:limit])
    ]


def country_cards(records: list[dict]) -> list[dict]:
    groups: dict[str, list[dict]] = defaultdict(list)
    for row in records:
        groups[row["country"]].append(row)

    cards = []
    for country, items in sorted(groups.items()):
        monthly = sum(x.get("monthly_gmv", 0.0) for x in items)
        annual = sum(x.get("gmv", 0.0) for x in items)
        cn_monthly = sum(x.get("cn_monthly_gmv", 0.0) for x in items)
        top = sorted(items, key=lambda x: x.get("gmv", 0.0), reverse=True)[:5]
        cards.append(
            {
                "country": country,
                "country_name": COUNTRY_NAMES.get(country, country),
                "monthly_gmv": monthly,
                "gmv": annual,
                "cn_share": (cn_monthly / monthly * 100) if monthly else 0.0,
                "standard_l2_count": len(items),
                "top_standard_l2": [
                    {
                        "standard_l2": x["standard_l2"],
                        "gmv": x.get("gmv", 0.0),
                        "monthly_gmv": x.get("monthly_gmv", 0.0),
                    }
                    for x in top
                ],
            }
        )
    return sorted(cards, key=lambda x: x["monthly_gmv"], reverse=True)


def category_matrix(records: list[dict]) -> list[dict]:
    matrix: dict[str, dict] = defaultdict(dict)
    for row in records:
        matrix[row["standard_l2"]][row["country"]] = row.get("monthly_gmv", 0.0)

    rows = []
    for standard_l2, values in matrix.items():
        total = sum(values.values())
        rows.append(
            {
                "standard_l2": standard_l2,
                "total_monthly_gmv": total,
                "countries_present": sorted(values.keys()),
                "values": {country: round(values.get(country, 0.0), 2) for country in COUNTRY_NAMES},
            }
        )
    return sorted(rows, key=lambda x: x["total_monthly_gmv"], reverse=True)


def insights(summary: dict, records: list[dict], matrix: list[dict]) -> list[dict]:
    country_sorted = sorted(summary["market_monthly_gmv"].items(), key=lambda x: x[1], reverse=True)
    top_country, top_country_gmv = country_sorted[0]
    top_l2 = top_records(records, 1)[0]
    cross_country = [x for x in matrix if len(x["countries_present"]) >= 3][:5]
    high_cn = sorted(records, key=lambda x: x.get("cn_share", 0.0), reverse=True)[:5]

    return [
        {
            "insight_id": "amazon_market_scale",
            "title": "Amazon 四国市场先具备完整呈现条件",
            "severity": "core",
            "summary": f"本阶段 Amazon 四国读取成功 {summary['read_ok_count']}/{summary['raw_source_count']} 个源，月 GMV {money_b(summary['total_monthly_gmv'])}，年化 GMV {money_b(summary['total_gmv'])}。",
            "evidence": ["US/MX/JP/BR 均已形成 standard_l2 粒度事实表", "Shopee 暂缓，不进入当前展示口径"],
        },
        {
            "insight_id": "us_anchor",
            "title": "美国是当前 Amazon 版本的绝对主市场",
            "severity": "core",
            "summary": f"{top_country} 月 GMV {money_b(top_country_gmv)}，显著高于其他 Amazon 国家，是页面叙事的主锚点。",
            "evidence": [f"四国总月 GMV {money_b(summary['total_monthly_gmv'])}", f"{top_country} 月 GMV {money_b(top_country_gmv)}"],
        },
        {
            "insight_id": "top_category",
            "title": "头部行业决定首屏排序",
            "severity": "core",
            "summary": f"当前最大 standard_l2 是 {top_l2['country']} / {top_l2['standard_l2']}，年化 GMV {money_b(top_l2['gmv'])}。",
            "evidence": ["建议网页首屏展示国家-行业 Top 排名", "表格和条形图默认按年 GMV 排序"],
        },
        {
            "insight_id": "cross_country_categories",
            "title": "跨国可比行业适合作为第二层可视化",
            "severity": "support",
            "summary": f"{len(cross_country)} 个头部行业在至少三个 Amazon 国家均有数据，可用于做四国矩阵对比。",
            "evidence": [x["standard_l2"] for x in cross_country],
        },
        {
            "insight_id": "cn_brand_position",
            "title": "CN GMV 占比可作为行业机会筛选器",
            "severity": "support",
            "summary": f"Amazon 四国加权 CN GMV 占比为 {summary['cn_share_weighted']:.1f}%，可用于区分中国品牌优势区与突破区。",
            "evidence": [f"{x['country']} {x['standard_l2']}: {x.get('cn_share', 0):.1f}%" for x in high_cn],
        },
    ]


def build_story(records: list[dict], summary: dict) -> dict:
    matrix = category_matrix(records)
    cards = country_cards(records)
    top = top_records(records, 20)
    return {
        "generated_at": "2026-06-02",
        "scope": "Amazon four-country market narrative package",
        "summary": summary,
        "page_brief": {
            "title": "Amazon 四国市场中心",
            "subtitle": "先以 US / MX / JP / BR Amazon 完成数据治理、行业呈现、分析观点与可视化闭环；Shopee 进入二期治理。",
            "primary_grain": "standard_l2",
            "recommended_first_screen": ["KPI cards", "country comparison", "top standard_l2 bars", "insight strip"],
        },
        "kpis": [
            {"label": "年化 GMV", "value": summary["total_gmv"], "display": money_b(summary["total_gmv"])},
            {"label": "月 GMV", "value": summary["total_monthly_gmv"], "display": money_b(summary["total_monthly_gmv"])},
            {"label": "CN GMV 占比", "value": summary["cn_share_weighted"], "display": f"{summary['cn_share_weighted']:.1f}%"},
            {"label": "标准二级行业", "value": summary["standard_l2_record_count"], "display": str(summary["standard_l2_record_count"])},
            {"label": "读取成功源", "value": summary["read_ok_count"], "display": f"{summary['read_ok_count']}/{summary['raw_source_count']}"},
        ],
        "country_cards": cards,
        "top_standard_l2": top,
        "category_matrix": matrix[:50],
        "chart_specs": {
            "country_monthly_gmv_bar": [
                {"country": x["country"], "country_name": x["country_name"], "monthly_gmv": x["monthly_gmv"]}
                for x in cards
            ],
            "top_l2_annual_gmv_bar": top[:12],
            "cn_share_scatter": [
                {
                    "country": x["country"],
                    "standard_l2": x["standard_l2"],
                    "gmv": x.get("gmv", 0.0),
                    "monthly_gmv": x.get("monthly_gmv", 0.0),
                    "cn_share": x.get("cn_share", 0.0),
                }
                for x in records
                if x.get("monthly_gmv", 0.0) > 0
            ],
            "category_country_heatmap": matrix[:30],
        },
        "insights": insights(summary, records, matrix),
        "phase_2_deferred": {
            "platform": "Shopee",
            "reason": "raw Excel volume is large; defer to a dedicated preprocessing layer before web visualization.",
            "recommended_next_asset": "data_assets/intermediate/shopee/*_processed_l1_workbooks",
        },
    }


def main() -> None:
    source = load_json(INPUT_FACTS)
    records, raw_records = amazon_records(source)
    summary = summarize(records, raw_records, source["summary"])
    facts = {
        "summary": summary,
        "records": sorted(records, key=lambda x: (x["country"], -x.get("gmv", 0.0))),
        "raw_source_records": raw_records,
        "read_failures": [x for x in raw_records if x.get("read_status") != "ok"],
    }
    story = build_story(records, summary)

    write_json(OUT_CURATED_FACTS, facts)
    write_json(OUT_CURATED_STORY, story)
    write_json(OUT_PORTAL_FACTS, facts)
    write_json(OUT_PORTAL_STORY, story)

    print(f"amazon_records: {len(records)}")
    print(f"amazon_raw_sources: {len(raw_records)}")
    print(f"read_ok/read_failed: {summary['read_ok_count']}/{summary['read_failed_count']}")
    print(f"monthly_gmv: {summary['total_monthly_gmv']:,.2f}")
    print(f"annual_gmv: {summary['total_gmv']:,.2f}")
    print(f"outputs: {OUT_CURATED_FACTS}; {OUT_CURATED_STORY}")


if __name__ == "__main__":
    main()
