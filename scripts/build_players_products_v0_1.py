"""Build Amazon players and product-opportunity assets for the portal V1."""

from __future__ import annotations

import json
import re
from collections import defaultdict
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
FACTS = PROJECT_ROOT / "data_assets" / "curated" / "market" / "amazon_market_facts_monthly.json"
RESEARCH = PROJECT_ROOT / "data_assets" / "curated" / "research" / "market_research_enrichment.json"
SIGNALS = PROJECT_ROOT / "data_assets" / "curated" / "research" / "market_growth_signals.json"

OUT_PLAYERS = PROJECT_ROOT / "data_assets" / "curated" / "players" / "amazon_players_monthly.json"
OUT_PRODUCTS = PROJECT_ROOT / "data_assets" / "curated" / "products" / "amazon_product_opportunities_monthly.json"
PORTAL_PLAYERS = PROJECT_ROOT / "portal" / "data" / "players" / "amazon_players_monthly.json"
PORTAL_PRODUCTS = PROJECT_ROOT / "portal" / "data" / "products" / "amazon_product_opportunities_monthly.json"

CN_HINTS = (
    "anker",
    "ugreen",
    "baseus",
    "ringconn",
    "amazfit",
    "roborock",
    "dreame",
    "tineco",
    "laifen",
    "tymo",
    "cosori",
    "reolink",
    "olight",
    "creality",
    "bambu",
    "xreal",
    "rokid",
    "rayneo",
    "dji",
    "insta360",
    "ecovacs",
    "eufy",
    "soundcore",
    "shokz",
    "vevor",
    "midea",
    "hifiman",
    "moondrop",
)


def load(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def write(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def norm(text: str | None) -> str:
    return re.sub(r"[\s_、/\\|｜,，;；:：()（）\[\]【】\-]+", "", str(text or "").lower())


def is_cn_brand(brand: str) -> bool:
    low = brand.lower()
    return any(x in low for x in CN_HINTS)


def split_players(text: str | None) -> list[str]:
    if not text:
        return []
    cleaned = (
        text.replace("全球Top3：", "")
        .replace("中国Top3：", "")
        .replace("Top3：", "")
        .replace("全球", "")
        .replace("中国", "")
    )
    parts = re.split(r"[、/|｜,，;；]+", cleaned)
    return [x.strip() for x in parts if x.strip() and len(x.strip()) <= 60]


def useful_terms(*values: str | None) -> list[str]:
    generic = {"配件", "用品", "产品", "其他", "综合", "设备", "工具", "套装", "组件"}
    terms = []
    for value in values:
        t = norm(value)
        if len(t) >= 3 and t not in generic:
            terms.append(t)
    return terms


def match_research(row: dict, research_records: list[dict]) -> list[dict]:
    terms = useful_terms(row.get("standard_l2"), *(row.get("raw_l2_values") or []))
    matches = []
    for item in research_records:
        if item.get("platform") != "Amazon" or item.get("country") != row.get("country"):
            continue
        category = norm(item.get("research_category"))
        segments = norm(item.get("major_segments"))
        if any(category == term or category in term or term in category or term in segments for term in terms):
            matches.append(item)
    return sorted(matches, key=lambda x: float(x.get("heat_score") or 0), reverse=True)[:5]


def match_signals(row: dict, research_matches: list[dict], signal_records: list[dict]) -> list[dict]:
    research_terms = []
    for item in research_matches:
        research_terms.extend([item.get("research_category"), item.get("major_segments")])
    terms = useful_terms(row.get("standard_l2"), *(row.get("raw_l2_values") or []), *research_terms)
    matches = []
    for item in signal_records:
        primary = norm(item.get("primary_category"))
        sub = norm(item.get("sub_track"))
        keywords = norm(item.get("signal_keywords"))
        if any(
            primary == term
            or primary in term
            or term in primary
            or sub in term
            or term in sub
            or keywords in term
            or term in keywords
            for term in terms
        ):
            matches.append(item)
    return matches[:5]


def build_players(facts: dict, research: dict, signals: dict) -> dict:
    research_records = research["records"]
    signal_records = signals["records"]
    grouped: dict[tuple[str, str, str, str], dict] = {}

    for row in facts["records"]:
        research_matches = match_research(row, research_records)
        signal_matches = match_signals(row, research_matches, signal_records)
        candidate_brands = list(row.get("top_brands") or [])
        for item in research_matches:
            candidate_brands.extend(split_players(item.get("representative_players")))
        candidate_brands = [x for x in dict.fromkeys(candidate_brands) if x and x != "-"]
        if not candidate_brands:
            continue
        share_unit = float(row.get("gmv") or 0) / max(len(candidate_brands), 1)
        monthly_unit = float(row.get("monthly_gmv") or 0) / max(len(candidate_brands), 1)
        for rank, brand in enumerate(candidate_brands[:12], start=1):
            key = (row["country"], row["platform"], row["standard_l2"], brand)
            item = grouped.setdefault(
                key,
                {
                    "player_id": f"{row['country'].lower()}_amazon_{norm(row['standard_l2'])}_{norm(brand)}",
                    "brand": brand,
                    "company": "",
                    "country": row["country"],
                    "platform": row["platform"],
                    "period": row["period"],
                    "standard_l2": row["standard_l2"],
                    "estimated_gmv": 0.0,
                    "estimated_monthly_gmv": 0.0,
                    "growth_rate": 0.0,
                    "cn_flag": is_cn_brand(brand),
                    "industry_count": 0,
                    "evidence_count": 0,
                    "growth_reason": "",
                    "signal_keyword": "",
                    "action_hint": "",
                    "source_quality": "brand/ranking proxy",
                },
            )
            weight = max(13 - rank, 1) / 12
            item["estimated_gmv"] += share_unit * weight
            item["estimated_monthly_gmv"] += monthly_unit * weight
            item["growth_rate"] = max(item["growth_rate"], float(row.get("growth_rate") or 0))
            item["industry_count"] += 1
            item["evidence_count"] += len(research_matches) + len(signal_matches)
            if signal_matches and not item["growth_reason"]:
                item["growth_reason"] = signal_matches[0].get("growth_reason", "")
                item["signal_keyword"] = signal_matches[0].get("signal_keywords", "")
            if not item["action_hint"]:
                if item["cn_flag"] and signal_matches:
                    item["action_hint"] = "优先拓客：已有增长信号且疑似中国品牌"
                elif signal_matches:
                    item["action_hint"] = "跟踪竞品动作，找同赛道中国玩家"
                else:
                    item["action_hint"] = "补充公司与事件信号"

    records = sorted(grouped.values(), key=lambda x: x["estimated_gmv"], reverse=True)
    return {
        "summary": {
            "generated_at": "2026-06-02",
            "scope": "Amazon player MVP",
            "grain": "country/platform/standard_l2/brand",
            "record_count": len(records),
            "note": "Estimated GMV is allocated from market/category facts and top-brand/research rankings. Replace with product-level brand facts when full SKU tables are ingested.",
        },
        "records": records,
    }


def product_opportunity_name(row: dict, research_match: dict | None, signal_match: dict | None) -> str:
    if signal_match:
        return signal_match.get("sub_track") or row["standard_l2"]
    if research_match and research_match.get("major_segments"):
        return str(research_match["major_segments"]).split("/")[0].strip()
    return row["standard_l2"]


def build_products(facts: dict, research: dict, signals: dict) -> dict:
    research_records = research["records"]
    signal_records = signals["records"]
    records = []
    for row in facts["records"]:
        research_matches = match_research(row, research_records)
        signal_matches = match_signals(row, research_matches, signal_records)
        pairs = []
        for idx, signal in enumerate(signal_matches[:3]):
            pairs.append((research_matches[idx] if idx < len(research_matches) else None, signal))
        if not pairs:
            pairs = [(research_matches[0], None)] if research_matches else [(None, None)]
        for idx, (research_match, signal_match) in enumerate(pairs[:3], start=1):
            name = product_opportunity_name(row, research_match, signal_match)
            heat = float(research_match.get("heat_score") or 0) if research_match else 0.0
            records.append(
                {
                    "product_opportunity_id": f"{row['country'].lower()}_amazon_{norm(row['standard_l2'])}_{idx}",
                    "product_name": name,
                    "brand": "",
                    "company": "",
                    "country": row["country"],
                    "platform": row["platform"],
                    "period": row["period"],
                    "standard_l2": row["standard_l2"],
                    "standard_l3": name,
                    "price": None,
                    "rating": None,
                    "review_count": None,
                    "monthly_sales": None,
                    "monthly_gmv": float(row.get("monthly_gmv") or 0) * max(heat, 0.2),
                    "gmv": float(row.get("gmv") or 0) * max(heat, 0.2),
                    "growth_rate": float(research_match.get("mom") or row.get("growth_rate") or 0)
                    if research_match
                    else float(row.get("growth_rate") or 0),
                    "product_score": heat,
                    "marketing_score": None,
                    "growth_reason": signal_match.get("growth_reason", "") if signal_match else "",
                    "signal_keyword": signal_match.get("signal_keywords", "") if signal_match else "",
                    "tracking_focus": signal_match.get("tracking_focus", "") if signal_match else "",
                    "representative_players": research_match.get("representative_players", "") if research_match else "",
                    "action_hint": "下钻 SKU 明细并验证品牌/价格/评论" if signal_match else "补充产品明细表",
                    "source_quality": "opportunity cluster from research/signal; not SKU-level yet",
                }
            )
    records = sorted(records, key=lambda x: x["gmv"], reverse=True)
    return {
        "summary": {
            "generated_at": "2026-06-02",
            "scope": "Amazon product opportunity MVP",
            "grain": "country/platform/standard_l2/product_opportunity",
            "record_count": len(records),
            "note": "This is a product-opportunity layer, not final SKU-level product facts. Ingest raw Amazon product tables next.",
        },
        "records": records,
    }


def main() -> None:
    facts = load(FACTS)
    research = load(RESEARCH)
    signals = load(SIGNALS)
    players = build_players(facts, research, signals)
    products = build_products(facts, research, signals)
    for path, payload in [
        (OUT_PLAYERS, players),
        (PORTAL_PLAYERS, players),
        (OUT_PRODUCTS, products),
        (PORTAL_PRODUCTS, products),
    ]:
        write(path, payload)
    print(f"players: {players['summary']['record_count']}")
    print(f"products: {products['summary']['record_count']}")
    print(f"outputs: {OUT_PLAYERS}; {OUT_PRODUCTS}")


if __name__ == "__main__":
    main()
