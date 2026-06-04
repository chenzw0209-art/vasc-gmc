"""Build research-enrichment data from historical industry research reports."""

from __future__ import annotations

import json
import math
import re
from pathlib import Path

import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parents[1]
SOURCE_ROOT = Path(r"Z:\主线任务2-天眼计划\行业专题研究")
SOURCE_FILE = SOURCE_ROOT / "全行业-值得做的行业和客户_行研视角_v1.2_new.xlsx"
OUT_CURATED = PROJECT_ROOT / "data_assets" / "curated" / "research" / "market_research_enrichment.json"
OUT_PORTAL = PROJECT_ROOT / "portal" / "data" / "research" / "market_research_enrichment.json"


SITE_MAP = {
    "US": {"country": "US", "platform": "Amazon"},
    "美国": {"country": "US", "platform": "Amazon"},
    "Amazon-US": {"country": "US", "platform": "Amazon"},
    "巴西": {"country": "BR", "platform": "Amazon"},
    "Amazon-BR": {"country": "BR", "platform": "Amazon"},
    "墨西哥": {"country": "MX", "platform": "Amazon"},
    "Amazon-MX": {"country": "MX", "platform": "Amazon"},
    "印尼": {"country": "ID", "platform": "Shopee"},
    "Shopee-印尼": {"country": "ID", "platform": "Shopee"},
    "马来": {"country": "MY", "platform": "Shopee"},
    "Shopee-马来": {"country": "MY", "platform": "Shopee"},
}


def clean_value(value):
    if value is None:
        return None
    if isinstance(value, float) and math.isnan(value):
        return None
    if isinstance(value, str):
        text = value.strip()
        return text or None
    return value


def number(value) -> float:
    value = clean_value(value)
    if value is None:
        return 0.0
    if isinstance(value, (int, float)):
        return float(value)
    text = str(value).replace(",", "").replace("$", "").replace("%", "").strip()
    if not text:
        return 0.0
    try:
        return float(text)
    except ValueError:
        return 0.0


def pct(value) -> float:
    value = clean_value(value)
    if value is None:
        return 0.0
    if isinstance(value, (int, float)):
        n = float(value)
        return n * 100 if abs(n) <= 1 else n
    text = str(value).strip()
    return number(text)


def norm(text: str | None) -> str:
    if not text:
        return ""
    text = str(text).lower()
    return re.sub(r"[\s_、/\\|｜,，;；:：()（）\[\]【】\-]+", "", text)


def infer_site(row: dict) -> tuple[str, str, str]:
    site = clean_value(row.get("站点")) or "US"
    mapped = SITE_MAP.get(site, {})
    return site, mapped.get("country", site), mapped.get("platform", "Amazon" if "Amazon" in site or site == "US" else "Unknown")


def action_hint(row: dict) -> str:
    heat = number(row.get("热度值"))
    gmv = number(row.get("年GMV"))
    cn = pct(row.get("CN品牌GMV占比"))
    mom = pct(row.get("月环比MoM") or row.get("MoM"))
    if heat >= 0.7 and gmv >= 1_000_000_000:
        return "优先建专题并下钻玩家"
    if cn >= 40 and gmv >= 200_000_000:
        return "优先筛中国玩家"
    if mom >= 10:
        return "跟踪增长异动"
    return "纳入观察池"


def build_records() -> list[dict]:
    records: list[dict] = []
    source_sheets = ["精选Top30", "子品类Top200"]
    for sheet in source_sheets:
        df = pd.read_excel(SOURCE_FILE, sheet_name=sheet)
        for idx, row in df.iterrows():
            raw = {str(k): clean_value(v) for k, v in row.to_dict().items()}
            category = clean_value(raw.get("子品类"))
            if not category:
                continue
            site, country, platform = infer_site(raw)
            record = {
                "research_id": f"research_{sheet}_{idx + 1}",
                "source_file": str(SOURCE_FILE),
                "source_sheet": sheet,
                "site": site,
                "country": country,
                "platform": platform,
                "industry_class": clean_value(raw.get("行业分类")),
                "research_category": category,
                "research_category_norm": norm(category),
                "source_heat_score": number(raw.get("热度值")),
                "heat_score": 0.0,
                "revenue_norm": 0.0,
                "growth_norm": 0.0,
                "annual_gmv": number(raw.get("年GMV")),
                "mom": pct(raw.get("月环比MoM") or raw.get("MoM")),
                "cagr": pct(raw.get("年复合增长率") or raw.get("半年增长率")),
                "cn_share": pct(raw.get("CN品牌GMV占比")),
                "major_segments": clean_value(raw.get("主要细分")),
                "representative_players": clean_value(raw.get("代表性玩家")),
                "action_hint": action_hint(raw),
                "evidence": [
                    f"热度值 {number(raw.get('热度值')):.2f}",
                    f"年GMV ${number(raw.get('年GMV')) / 1e9:.2f}B",
                    f"MoM {pct(raw.get('月环比MoM') or raw.get('MoM')):.1f}%",
                    f"CN品牌GMV占比 {pct(raw.get('CN品牌GMV占比')):.1f}%",
                ],
            }
            records.append(record)
    return dedupe_and_score(records)


def dedupe_and_score(records: list[dict]) -> list[dict]:
    deduped: dict[tuple[str, str, str], dict] = {}
    for row in records:
        key = (row["site"], row["source_sheet"], row["research_category_norm"])
        if key not in deduped or row["annual_gmv"] > deduped[key]["annual_gmv"]:
            deduped[key] = row
    rows = list(deduped.values())

    by_site: dict[str, list[dict]] = {}
    for row in rows:
        by_site.setdefault(row["site"], []).append(row)

    for site_rows in by_site.values():
        max_gmv = max((x["annual_gmv"] for x in site_rows), default=0.0)
        growth_values = [x["mom"] for x in site_rows]
        min_growth = min(growth_values, default=0.0)
        max_growth = max(growth_values, default=0.0)
        growth_span = max_growth - min_growth
        for row in site_rows:
            revenue_norm = row["annual_gmv"] / max_gmv if max_gmv else 0.0
            growth_norm = (row["mom"] - min_growth) / growth_span if growth_span else 0.0
            row["revenue_norm"] = revenue_norm
            row["growth_norm"] = growth_norm
            row["heat_score"] = revenue_norm * 0.6 + growth_norm * 0.4
            row["heat_formula"] = "revenue_norm * 0.6 + mom_norm * 0.4, normalized within the same site"
            row["evidence"] = [
                f"年GMV ${row['annual_gmv'] / 1e9:.2f}B，站点内规模归一 {revenue_norm:.2f}",
                f"MoM {row['mom']:.1f}%，站点内增速归一 {growth_norm:.2f}",
                f"热度 {row['heat_score']:.2f} = 规模0.6 + 增速0.4",
                f"CN品牌GMV占比 {row['cn_share']:.1f}%",
            ]
    return sorted(rows, key=lambda x: (x["site"], -x["heat_score"]))


def summarize(records: list[dict]) -> dict:
    amazon = [x for x in records if x["platform"] == "Amazon"]
    return {
        "generated_at": "2026-06-02",
        "source_file": str(SOURCE_FILE),
        "grain": "site/research_category",
        "record_count": len(records),
        "amazon_record_count": len(amazon),
        "countries": sorted({x["country"] for x in records}),
        "platforms": sorted({x["platform"] for x in records}),
        "sheets": sorted({x["source_sheet"] for x in records}),
        "note": "Historical research enrichment is supporting evidence. It should not replace governed Amazon market facts.",
    }


def write_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def main() -> None:
    records = build_records()
    payload = {"summary": summarize(records), "records": records}
    write_json(OUT_CURATED, payload)
    write_json(OUT_PORTAL, payload)
    print(f"records: {len(records)}")
    print(f"amazon_records: {payload['summary']['amazon_record_count']}")
    print(f"outputs: {OUT_CURATED}; {OUT_PORTAL}")


if __name__ == "__main__":
    main()
