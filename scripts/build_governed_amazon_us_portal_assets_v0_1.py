# -*- coding: utf-8 -*-
"""
Build portal-facing Amazon US assets from the governed bottom-table layer.

Source of truth:
  Z:\\主线任务2-天眼计划\\行业专题研究\\底表治理\\聚合底表

The portal must not split Beauty/Consumer Tech in the browser. This script
materializes market, player and product-opportunity cache files at the same
paths the current pages already consume.
"""

from __future__ import annotations

import csv
import json
import math
import re
from pathlib import Path

import pandas as pd


ROOT = Path(__file__).resolve().parents[1]
GOVERNED_ROOT = Path(r"Z:\主线任务2-天眼计划\行业专题研究\底表治理\聚合底表")
DEEP_ANALYSIS_ROOT = Path(r"Z:\主线任务2-天眼计划\行业专题研究\深度分析")
AUDIT_CSV = GOVERNED_ROOT / "_聚合审计报告_v1.csv"
PERIOD = "2026-04"


def clean_num(value, default=0.0):
    if value is None:
        return default
    if isinstance(value, float) and math.isnan(value):
        return default
    text = str(value).replace(",", "").replace("$", "").replace("%", "").strip()
    if not text or text in {"--", "nan", "None"}:
        return default
    try:
        return float(text)
    except ValueError:
        return default


def read_excel(path: Path, sheet_name: str) -> pd.DataFrame:
    try:
        return pd.read_excel(path, sheet_name=sheet_name)
    except Exception:
        return pd.DataFrame()


def first_existing(row: pd.Series, names: list[str], default=""):
    for name in names:
        if name in row and pd.notna(row[name]):
            return row[name]
    return default


def sanitize(value):
    if isinstance(value, dict):
        return {k: sanitize(v) for k, v in value.items()}
    if isinstance(value, list):
        return [sanitize(v) for v in value]
    if isinstance(value, tuple):
        return [sanitize(v) for v in value]
    if isinstance(value, float):
        return value if math.isfinite(value) else 0
    if pd.isna(value) if not isinstance(value, (str, bytes, bool)) else False:
        return None
    return value


def json_dump(path: Path, payload):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(sanitize(payload), ensure_ascii=False, indent=2, allow_nan=False), encoding="utf-8")


def top_brands(players: pd.DataFrame, cn_only: bool | None = None, limit=8) -> list[str]:
    if players.empty:
        return []
    df = players.copy()
    if cn_only is True:
        df = df[df.get("是否中国品牌", "") == "是"]
    elif cn_only is False:
        df = df[df.get("是否中国品牌", "") != "是"]
    if df.empty:
        return []
    if "月销额($)" in df.columns:
        df = df.sort_values("月销额($)", ascending=False)
    return [str(x) for x in df["品牌"].dropna().head(limit).tolist()]


def trend_from_sheet(trend: pd.DataFrame) -> dict[str, float]:
    if trend.empty:
        return {}
    months = [c for c in trend.columns if re.fullmatch(r"\d{4}-\d{2}", str(c))]
    out = {}
    for month in sorted(months):
        out[month] = float(pd.to_numeric(trend[month], errors="coerce").fillna(0).sum())
    return out


def brand_trends(trend: pd.DataFrame) -> dict[str, dict]:
    if trend.empty or "品牌" not in trend.columns:
        return {}
    months = [c for c in trend.columns if re.fullmatch(r"\d{4}-\d{2}", str(c))]
    out = {}
    for _, row in trend.iterrows():
        brand = str(row.get("品牌", "") or "").strip()
        if not brand:
            continue
        values = {m: clean_num(row.get(m)) for m in sorted(months)}
        cur = values.get(PERIOD, 0)
        prev = values.get("2026-03", 0)
        mom = ((cur - prev) / prev * 100) if prev else 0
        out[brand] = {"monthly_trend": values, "mom_growth": mom}
    return out


def brief_from_markdown(industry: str, label: str) -> dict:
    path = DEEP_ANALYSIS_ROOT / industry / f"{label}_深度分析v1.md"
    if not path.exists():
        return {
            "status": "pending",
            "category_judgment": "",
            "players": None,
            "products": None,
            "signals": None,
            "actions": None,
            "source_path": "",
        }
    text = path.read_text(encoding="utf-8", errors="ignore")
    headings = re.findall(r"^#+\s+(.+)$", text, flags=re.MULTILINE)
    bullets = re.findall(r"^-+\s+\*\*(.+?)\*\*[:：]?\s*(.*)$", text, flags=re.MULTILINE)
    tables = re.findall(r"^\|(.+)\|$", text, flags=re.MULTILINE)
    judgment = ""
    m = re.search(r"\*\*核心洞察\*\*[:：]\s*(.+)", text)
    if m:
        judgment = m.group(1).strip()
    elif headings:
        judgment = " / ".join(headings[:3])

    signal_rows = []
    for title, body in bullets[:5]:
        signal_rows.append(
            {
                "signal_type": "深度分析",
                "brand_or_category": label,
                "signal_content": f"{title}: {body}".strip(),
                "metric_or_evidence": "深度分析文档",
                "pending_proof": "见源文档",
            }
        )

    return {
        "status": "ready",
        "category_judgment": judgment[:260],
        "players": {
            "top_overseas_brands": [],
            "top_china_brands": [],
            "china_brand_opportunity_position": "",
            "not_recommended_entry": "",
        },
        "products": {
            "high_potential_l3": [],
            "representative_products": [],
            "price_band_buying_points": "",
            "service_entry_points": [],
        },
        "signals": signal_rows,
        "actions": {
            "bd_followup_targets": [],
            "recommended_services": [],
            "pitch_direction": "",
            "external_evidence_needed": "深度分析文档已生成，页面仅展示摘要；结论仍以治理底表和源文档为准。",
        },
        "source_path": str(path),
        "section_count": len(headings),
        "table_row_count": len(tables),
    }


def load_audit_rows() -> list[dict]:
    with AUDIT_CSV.open("r", encoding="utf-8-sig", newline="") as fp:
        return list(csv.DictReader(fp))


def build():
    audit_rows = load_audit_rows()
    market_records = []
    player_records = []
    product_records = []
    enrichment_records = []
    source_records = []

    for audit in audit_rows:
        industry = audit["一级行业"]
        label = audit["二级标签"]
        excel_path = Path(audit["聚合底表路径"])
        if not excel_path.exists():
            continue

        market = read_excel(excel_path, "1_市场_类目细分")
        players = read_excel(excel_path, "2_玩家_品牌竞争")
        trend = read_excel(excel_path, "3_玩家_品牌趋势")
        monthly_trend = trend_from_sheet(trend)
        player_trends = brand_trends(trend)
        current_monthly = monthly_trend.get(PERIOD)
        if not current_monthly:
            current_monthly = float(pd.to_numeric(market.get("总月销额", pd.Series(dtype=float)), errors="coerce").fillna(0).sum())
        prev_monthly = monthly_trend.get("2026-03", 0.0)
        growth = ((current_monthly - prev_monthly) / prev_monthly * 100) if prev_monthly else 0.0
        annual_gmv = clean_num(audit.get("年GMV($)")) or float(pd.to_numeric(market.get("总年GMV", pd.Series(dtype=float)), errors="coerce").fillna(0).sum())
        cn_monthly = 0.0
        cn_annual = 0.0
        cn_brand_count = 0
        if not players.empty:
            monthly_col = pd.to_numeric(players.get("月销额($)", pd.Series(dtype=float)), errors="coerce").fillna(0)
            annual_col = pd.to_numeric(players.get("年估算GMV($)", pd.Series(dtype=float)), errors="coerce").fillna(0)
            cn_mask = players.get("是否中国品牌", pd.Series(dtype=str)).astype(str) == "是"
            cn_monthly = float(monthly_col[cn_mask].sum())
            cn_annual = float(annual_col[cn_mask].sum())
            cn_brand_count = int(cn_mask.sum())
        cn_share = (cn_monthly / current_monthly * 100) if current_monthly else clean_num(audit.get("CN_GMV占比(%)"))

        l3_values = [str(x) for x in market.get("三级类目", pd.Series(dtype=str)).dropna().tolist()]
        market_records.append(
            {
                "country": "US",
                "country_name": "美国",
                "platform": "Amazon",
                "period": PERIOD,
                "period_type": "month",
                "standard_l1": industry,
                "standard_l2": label,
                "gmv": annual_gmv,
                "monthly_gmv": current_monthly,
                "prev_monthly_gmv": prev_monthly,
                "growth_rate": growth,
                "cn_share": cn_share,
                "cn_monthly_gmv": cn_monthly,
                "cn_annual_gmv": cn_annual,
                "product_count": float(pd.to_numeric(market.get("产品数量", pd.Series(dtype=float)), errors="coerce").fillna(0).sum()) if not market.empty else 0,
                "brand_count": clean_num(audit.get("品牌数")),
                "cn_brand_count": cn_brand_count,
                "canonical_source_count": 1,
                "raw_l2_count": 1,
                "raw_l2_values": [label],
                "raw_l3_values": l3_values,
                "top_brands": top_brands(players, None, 8),
                "major_segments": l3_values[:8],
                "monthly_trend": monthly_trend,
                "traffic_dependency": float(pd.to_numeric(market.get("营销强度(流量依赖比%)", pd.Series(dtype=float)), errors="coerce").mean()) if not market.empty else 0,
                "ad_spend_index": float(pd.to_numeric(market.get("加权广告花费指数", pd.Series(dtype=float)), errors="coerce").mean()) if not market.empty else 0,
                "read_status": "ok",
                "growth_reason": "来自底表治理聚合底表，不再由页面按权重拆分。",
                "signal_keyword": "governed_bottom_table",
                "action_hint": "先看标准二级事实表，再进入深度分析。",
                "source_file": str(excel_path),
                "source_layer": "governed_bottom_table",
            }
        )

        if not players.empty:
            for idx, row in players.head(220).iterrows():
                brand = str(row.get("品牌", "")).strip()
                if not brand:
                    continue
                monthly = clean_num(row.get("月销额($)"))
                annual = clean_num(row.get("年估算GMV($)"))
                brand_trend = player_trends.get(brand, {"monthly_trend": {}, "mom_growth": 0})
                player_records.append(
                    {
                        "player_id": f"us_amazon_{industry}_{label}_{idx}_{brand}",
                        "brand": brand,
                        "company": brand,
                        "country": "US",
                        "platform": "Amazon",
                        "period": PERIOD,
                        "standard_l1": industry,
                        "standard_l2": label,
                        "main_l3": str(row.get("主要三级类目", "") or ""),
                        "estimated_gmv": annual,
                        "estimated_monthly_gmv": monthly,
                        "monthly_sales": clean_num(row.get("月销量")),
                        "listing_count": clean_num(row.get("Listing数")),
                        "weighted_price": clean_num(row.get("加权均价($)")),
                        "traffic_dependency": clean_num(row.get("流量依赖比(%)")),
                        "ad_spend_index": clean_num(row.get("广告花费指数")),
                        "price_range": str(row.get("价格区间", "") or ""),
                        "monthly_trend": brand_trend["monthly_trend"],
                        "mom_growth": brand_trend["mom_growth"],
                        "cn_flag": str(row.get("是否中国品牌", "")) == "是",
                        "nationality": str(row.get("国籍", "") or ""),
                        "industry_count": 1,
                        "evidence_count": 1,
                        "growth_reason": str(row.get("品牌产品简述", "") or ""),
                        "signal_keyword": "governed_player_row",
                        "action_hint": "按治理底表品牌行筛选玩家，不再从旧页面权重推断。",
                        "brand_product_summary": str(row.get("品牌产品简述", "") or ""),
                        "source_quality": "governed_bottom_table",
                        "source_file": str(excel_path),
                    }
                )

        if not market.empty:
            for idx, row in market.iterrows():
                l3 = str(row.get("三级类目", "") or "").strip()
                if not l3:
                    continue
                product_records.append(
                    {
                        "product_id": f"us_amazon_{industry}_{label}_{idx}_{l3}",
                        "product_opportunity_id": f"us_amazon_{industry}_{label}_{l3}",
                        "product_name": l3,
                        "standard_l1": industry,
                        "standard_l2": label,
                        "standard_l3": l3,
                        "raw_l1": industry,
                        "raw_l2": label,
                        "country": "US",
                        "country_name": "美国",
                        "platform": "Amazon",
                        "period": PERIOD,
                        "monthly_gmv_usd": clean_num(row.get("总月销额")),
                        "gmv": clean_num(row.get("总年GMV")),
                        "annual_gmv_usd": clean_num(row.get("总年GMV")),
                        "monthly_sales": clean_num(row.get("总月销量")),
                        "listing_monthly_sales": clean_num(row.get("总月销量")),
                        "product_count": clean_num(row.get("产品数量")),
                        "brand_count": clean_num(row.get("品牌总数")),
                        "cn_share": clean_num(row.get("中国品牌GMV占比(%)")),
                        "growth_rate": 0,
                        "brand": "",
                        "asin": "",
                        "price_usd": 0,
                        "major_segments": str(row.get("主要细分类目", "") or ""),
                        "representative_players": str(row.get("TOP3品牌", "") or ""),
                        "source_quality": "governed_l3_opportunity",
                        "source_file": str(excel_path),
                        "mapping_quality": "governed",
                        "growth_reason": "三级类目机会来自治理聚合底表 Sheet1。",
                        "signal_keyword": "l3_opportunity",
                        "tracking_focus": str(row.get("主要细分类目", "") or l3),
                        "action_hint": "继续下钻真实 ASIN、价格带、评论和内容素材。",
                    }
                )

        brief = brief_from_markdown(industry, label)
        if brief.get("players"):
            brief["players"]["top_overseas_brands"] = top_brands(players, False, 5)
            brief["players"]["top_china_brands"] = top_brands(players, True, 5)
            brief["players"]["china_brand_opportunity_position"] = f"CN GMV占比 {cn_share:.1f}%，优先看可参数化、可复购或可内容化的细分。"
            brief["players"]["not_recommended_entry"] = "不要用旧 Beauty 总盘或玩家权重分摊判断进入价值；必须回到三级类目和品牌行。"
        if brief.get("products"):
            top_l3 = sorted(
                [
                    (str(r.get("三级类目", "")), clean_num(r.get("总年GMV")), clean_num(r.get("中国品牌GMV占比(%)")))
                    for _, r in market.iterrows()
                ],
                key=lambda x: x[1],
                reverse=True,
            )[:5] if not market.empty else []
            brief["products"]["high_potential_l3"] = [x[0] for x in top_l3 if x[0]]
            brief["products"]["representative_products"] = [f"{x[0]} (${x[1]/1e9:.2f}B, CN {x[2]:.1f}%)" for x in top_l3 if x[0]]
            brief["products"]["price_band_buying_points"] = "价格带需从真实 ASIN/Listing 层继续下钻；当前为类目机会层。"
            brief["products"]["service_entry_points"] = ["类目深挖", "玩家筛选", "内容素材审计", "价格带/评论壁垒分析"]

        enrichment_records.append({"l1": industry, "l2": label, **brief})
        source_records.append(
            {
                "country": "US",
                "platform": "Amazon",
                "standard_l1": industry,
                "standard_l2": label,
                "source_path": str(excel_path),
                "deep_analysis_path": brief.get("source_path", ""),
                "source_layer": "governed_bottom_table",
            }
        )

    summary = {
        "generated_at": pd.Timestamp.now().isoformat(),
        "scope": "Amazon US governed standard L2 bottom tables",
        "period": PERIOD,
        "source_root": str(GOVERNED_ROOT),
        "audit_csv": str(AUDIT_CSV),
        "standard_l2_record_count": len(market_records),
        "player_record_count": len(player_records),
        "product_opportunity_record_count": len(product_records),
        "total_gmv": sum(r["gmv"] for r in market_records),
        "total_monthly_gmv": sum(r["monthly_gmv"] for r in market_records),
        "currency": "USD",
        "grain": "US Amazon / standard_l1 / standard_l2",
        "source_note": "Generated from governed aggregate Excel workbooks; browser-side category expansion is prohibited.",
    }

    market_payload = {"summary": summary, "records": market_records}
    player_payload = {"summary": summary, "records": player_records}
    product_payload = {"summary": summary, "records": product_records}
    enrichment_payload = {
        "version": "v0.2_governed",
        "generated_at": summary["generated_at"],
        "source_root": str(DEEP_ANALYSIS_ROOT),
        "status_note": "Ready records come from local deep-analysis markdown; pending records still need manual research.",
        "records": enrichment_records,
    }
    sources_payload = {
        "generated_at": summary["generated_at"],
        "source_root": str(GOVERNED_ROOT),
        "records": source_records,
    }

    targets = [
        ("portal/data/market/amazon_market_facts_monthly.json", market_payload),
        ("data_assets/curated/market/amazon_market_facts_monthly.json", market_payload),
        ("portal/data/players/amazon_players_monthly.json", player_payload),
        ("data_assets/curated/players/amazon_players_monthly.json", player_payload),
        ("portal/data/products/amazon_products_monthly.json", product_payload),
        ("data_assets/curated/products/amazon_products_monthly.json", product_payload),
        ("portal/data/research/beauty_l2_content_enrichment_v0_1.json", enrichment_payload),
        ("portal/data/sources/governed_amazon_us_l2_sources.json", sources_payload),
    ]
    for rel, payload in targets:
        json_dump(ROOT / rel, payload)

    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    build()
