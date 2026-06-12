#!/usr/bin/env python3
"""Build weekly portal JSON files from the lead-collection workbook."""

from __future__ import annotations

import argparse
import json
from collections import defaultdict
from datetime import date, datetime
from pathlib import Path

from openpyxl import load_workbook


CUSTOMER_MAP = {
    "候选ID": "candidate_id",
    "周次": "week",
    "检索日期": "search_date",
    "钛动分类": "titan_category",
    "一级行业": "standard_l1",
    "二级行业": "standard_l2",
    "三级品类": "standard_l3",
    "应用/商品名称": "application_product_name",
    "背后公司/发行方/品牌方": "owner_company_brand",
    "目标市场/渠道": "target_market_channel",
    "动态类型": "dynamic_type",
    "动态日期": "dynamic_date",
    "动态摘要": "dynamic_summary",
    "建议关注点": "attention_point",
    "信源等级": "source_grade",
    "来源层级": "source_layer",
    "主信源名称": "primary_source_name",
    "主信源链接": "primary_source_url",
    "链接状态": "link_status",
    "是否建议入库": "warehouse_suggestion",
    "复核备注": "review_note",
    "信源数": "source_count",
}

SOURCE_MAP = {
    "信源ID": "source_id",
    "候选ID": "candidate_id",
    "周次": "week",
    "动态日期": "dynamic_date",
    "发布日期/事件日期": "publish_event_date",
    "来源层级": "source_layer",
    "信源等级": "source_grade",
    "信源名称": "source_name",
    "URL": "url",
    "证据摘要": "evidence_summary",
    "链接状态/复核备注": "link_status_review_note",
}

EVENT_MAP = {
    "展会ID": "event_id",
    "周次": "week",
    "展会时间窗": "event_window",
    "行业": "industry",
    "展会/会议": "event_name",
    "地点": "location",
    "日期": "date",
    "展会窗口价值": "window_value",
    "信源等级": "source_grade",
    "链接": "url",
    "复核备注": "review_note",
}


def cell_value(value):
    if isinstance(value, datetime):
        return value.date().isoformat()
    if isinstance(value, date):
        return value.isoformat()
    if value is None:
        return ""
    return str(value).strip()


def read_sheet(wb, sheet_name, mapping):
    if sheet_name not in wb.sheetnames:
        return []
    ws = wb[sheet_name]
    headers = [cell_value(c.value) for c in ws[1]]
    rows = []
    for values in ws.iter_rows(min_row=2, values_only=True):
        raw = {headers[i]: cell_value(values[i]) for i in range(min(len(headers), len(values)))}
        if not any(raw.values()):
            continue
        row = {target: raw.get(source, "") for source, target in mapping.items()}
        rows.append(row)
    return rows


def mmdd(value):
    text = str(value or "")
    try:
        return datetime.fromisoformat(text).strftime("%m-%d")
    except ValueError:
        return text[:5] if text else ""


def build_weekly(content_rows, source_rows, event_rows, week, generated_at, workbook):
    records = [row for row in content_rows if row.get("warehouse_suggestion", "是") != "否"]
    for row in records:
        row["dynamic_date_display"] = mmdd(row.get("dynamic_date"))

    by_l3 = defaultdict(list)
    by_l2 = defaultdict(list)
    for row in records:
        by_l3[row.get("standard_l3", "待补")].append(row)
        by_l2[(row.get("standard_l1", "待补"), row.get("standard_l2", "待补"))].append(row)

    industry_brief_by_industry = {}
    for key, rows in by_l3.items():
        first = rows[0]
        industry_brief_by_industry[key] = {
            "industry": key,
            "lead_count": len(rows),
            "headline": f"{first.get('standard_l2', '行业')}本周新增{len(rows)}条可复核信号",
            "signals": [r.get("dynamic_summary", "") for r in rows[:4]],
            "recommended_focus": [r.get("attention_point", "") for r in rows[:4]],
        }

    similar = {}
    for row in records:
        peers = [
            peer for peer in by_l2[(row.get("standard_l1", ""), row.get("standard_l2", ""))]
            if peer.get("candidate_id") != row.get("candidate_id")
        ][:4]
        similar[row.get("candidate_id", "")] = peers

    evidence = defaultdict(list)
    for source in source_rows:
        evidence[source.get("candidate_id", "")].append(source)

    product_count = sum(1 for row in records if row.get("titan_category") == "EC")
    app_count = len(records) - product_count
    grade_a_count = sum(1 for row in records if row.get("source_grade") == "A")
    by_l1 = defaultdict(list)
    for row in records:
        by_l1[row.get("standard_l1", "待补")].append(row)
    top_l1 = sorted(by_l1.items(), key=lambda item: (-len(item[1]), item[0]))[:5]
    top_summary = "；".join(f"{l1}{len(rows)}条" for l1, rows in top_l1) or "本周情报待补充"

    return {
        "generated_at": generated_at,
        "source_workbook": str(workbook),
        "weekly_module_content": {
            "week": f"2026-{week}",
            "top_summary": f"{week}更新：{top_summary}。本周新增出海媒体补扫，重点补强Beauty、Fashion、FMCG等非3C类目。",
            "kpis": {
                "focus_customer_count": len(records),
                "new_customer_signal_count": len(records),
                "product_candidate_count": product_count,
                "app_candidate_count": app_count,
                "grade_a_count": grade_a_count,
                "exhibition_count": len(event_rows),
            },
            "focus_customers": records,
            "industry_brief_by_industry": industry_brief_by_industry,
            "similar_customers_by_candidate": similar,
        },
        "leads_module_content": {
            "week": f"2026-{week}",
            "records": records,
        },
        "exhibition_window_content": event_rows,
        "evidence_chain_detail_mapping": dict(evidence),
        "data_quality_check_result": {
            "sheet_source": "售前情报库周更新工作簿",
            "customer_rows": len(content_rows),
            "event_rows": len(event_rows),
            "source_rows": len(source_rows),
            "customer_rows_note": "仅筛除是否建议入库=否的记录；页面只消费本JSON，不读取Excel。",
        },
    }


def verification_metrics(l1):
    if l1 == "Gaming":
        return ["预约/测试转化", "Steam愿望单", "Discord/社媒增速", "上线地区榜单"]
    if l1 == "Consumer Tech":
        return ["Amazon排名变化", "测评内容声量", "官网活动转化", "零售价格带"]
    if l1 == "Fintech":
        return ["覆盖商户数", "钱包/银行伙伴数", "新增国家", "交易成功率"]
    if l1 == "Fashion":
        return ["卖家参与数", "校园/达人内容量", "商品合规节奏", "美国市场活动转化"]
    return ["官方更新频率", "海外渠道信号", "社媒声量", "转化数据"]


def build_industry_supply(records, week, generated_at, workbook):
    grouped = defaultdict(list)
    for row in records:
        grouped[(row.get("standard_l1", "待补"), row.get("standard_l2", "待补"))].append(row)

    industries = []
    for (l1, l2), rows in sorted(grouped.items()):
        top_owner = rows[0].get("owner_company_brand", "待补")
        signals = [r.get("dynamic_summary", "") for r in rows[:5]]
        industries.append({
            "source_lead_industry_key": f"{l1}|{l2}",
            "primary_industry": l1,
            "secondary_industry": l2,
            "mapped_research_industry": l2,
            "industry_key": f"{l1}|{l2}",
            "metrics": {
                "gmv": "W25线索侧预备口径",
                "yoy_growth": "待行研底表补齐",
                "cn_gmv_share": "待行研底表补齐",
                "top_cn_player": top_owner,
            },
            "current_stage": "周度信号预备扫描",
            "main_variable": f"{l2}本周变量来自{len(rows)}条客户动态，需用后续底表验证强度。",
            "main_tension": "当前是线索侧硬信源扫描，行业规模和份额仍需行研供给补全。",
            "market_misread": "不要把单条发布误读为行业趋势，先看同类主体是否连续出现。",
            "growth_signals_short": signals,
            "verification_metrics": verification_metrics(l1),
            "counter_signals": ["硬信源后续没有渠道/榜单数据承接", "海外市场动作停留在传播层"],
            "sales_translation": "优先围绕新品、测试、区域发布、线下活动和渠道合作切入，做客户名单补全与复核。",
            "similar_customers": [{"brand": r.get("owner_company_brand", ""), "grade": r.get("source_grade", "")} for r in rows[:4]],
            "this_week_leads": [{
                "candidate_id": r.get("candidate_id", ""),
                "lead_category": r.get("titan_category", ""),
                "primary_industry": r.get("standard_l1", ""),
                "secondary_industry": r.get("standard_l2", ""),
                "tertiary_category": r.get("standard_l3", ""),
                "product_name": r.get("application_product_name", ""),
                "owner": r.get("owner_company_brand", ""),
                "dynamic_type": r.get("dynamic_type", ""),
                "dynamic_summary": r.get("dynamic_summary", ""),
                "suggested_focus": r.get("attention_point", ""),
                "source_grade": r.get("source_grade", ""),
            } for r in rows],
            "research_source_path": "线索侧W25预备扫描；待行研洞察-agent深度供给",
            "bottom_table_path": "待行研底表补齐",
            "coverage_status": "线索侧预备覆盖",
            "industry_conclusion": f"{l1}/{l2}本周有{len(rows)}条可复核客户动态，适合先进入销售扫描池。",
            "visual_summary": {
                "title": f"{l1}/{l2}：W25预备信号",
                "metric_line": f"{len(rows)}条线索 / Top主体：{top_owner}",
                "signal_line": "；".join(signals[:2]),
                "risk_line": "行业深度结论待行研供给补齐。",
            },
            "this_week_lead_count": len(rows),
        })

    return {
        "week": f"2026-{week}",
        "generated_at": generated_at,
        "source_files": {
            "lead_workbook": str(workbook),
            "research_root": "Z:\\增长分析中台\\行研洞察",
        },
        "industries": industries,
        "quality_check": {
            "lead_rows": len(records),
            "industry_group_count": len(industries),
            "covered_industry_count": 0,
            "desktop_research_count": len(industries),
            "gap_industry_count": 0,
            "missing_required_fields": [],
            "notes": [
                f"{week}为线索侧预备更新，行业深度供给待行研洞察-agent后续补齐。",
                "页面只读取portal/data/weekly下JSON，不读取Excel。",
            ],
        },
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--workbook", required=True)
    parser.add_argument("--week", required=True)
    parser.add_argument("--out-dir", default="portal/data/weekly")
    parser.add_argument("--generated-at", default=date.today().isoformat())
    args = parser.parse_args()

    workbook = Path(args.workbook)
    wb = load_workbook(workbook, read_only=True, data_only=True)
    customers = read_sheet(wb, "客户候选名单", CUSTOMER_MAP)
    sources = read_sheet(wb, "信源明细", SOURCE_MAP)
    events = read_sheet(wb, "展会线索", EVENT_MAP)
    customers = [row for row in customers if row.get("week") == args.week]
    sources = [row for row in sources if row.get("week") == args.week]
    events = [row for row in events if row.get("week") == args.week]

    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    weekly = build_weekly(customers, sources, events, args.week, args.generated_at, workbook)
    industry = build_industry_supply(weekly["leads_module_content"]["records"], args.week, args.generated_at, workbook)

    weekly_path = out_dir / f"weekly_leads_content_2026_{args.week}.json"
    industry_path = out_dir / f"industry_brief_supply_2026_{args.week}.json"
    weekly_path.write_text(json.dumps(weekly, ensure_ascii=False, indent=2), encoding="utf-8")
    industry_path.write_text(json.dumps(industry, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"wrote {weekly_path}")
    print(f"wrote {industry_path}")


if __name__ == "__main__":
    main()
