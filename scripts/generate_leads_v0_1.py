"""Generate Leads Center MVP data for Growth Intelligence Portal v0.1."""

from __future__ import annotations

import json
import os
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
PORTAL_DIR = Path(os.environ.get("GIP_PORTAL_DIR", PROJECT_ROOT / "portal"))


LEADS = [
    {
        "lead_id": "lead_20260602_001",
        "publish_date": "2025-06-01",
        "company": "RingConn",
        "parent_company": "",
        "country": "US",
        "region": "North America",
        "platform": "",
        "standard_l1": "Consumer Tech",
        "standard_l2": "智能穿戴",
        "event_type": "新品发布",
        "signal_type": "营销窗口",
        "priority": "A",
        "action": "售前打标",
        "source_id": "historical_industry_reports",
        "source_name": "UI sketch sample",
        "source_url": "",
        "summary": "Gen3 新品发布形成短期营销窗口。",
        "evidence": "来自系统 UI 草图样例，待替换为真实 PR 信源。",
        "status": "未处理",
    },
    {
        "lead_id": "lead_20260602_002",
        "publish_date": "2025-05-30",
        "company": "TCL",
        "parent_company": "",
        "country": "SEA",
        "region": "SEA",
        "platform": "",
        "standard_l1": "Consumer Tech",
        "standard_l2": "电视/显示/视听设备",
        "event_type": "招投标",
        "signal_type": "预算释放",
        "priority": "A",
        "action": "BD跟进",
        "source_id": "historical_industry_reports",
        "source_name": "UI sketch sample",
        "source_url": "",
        "summary": "海外招标事件提示预算释放窗口。",
        "evidence": "来自系统 UI 草图样例，待替换为真实招投标信源。",
        "status": "未处理",
    },
    {
        "lead_id": "lead_20260602_003",
        "publish_date": "2025-05-28",
        "company": "Ulike",
        "parent_company": "",
        "country": "DE",
        "region": "Europe",
        "platform": "",
        "standard_l1": "Beauty",
        "standard_l2": "美容仪/个护设备",
        "event_type": "展会参展",
        "signal_type": "市场扩张",
        "priority": "B",
        "action": "展会前触达",
        "source_id": "historical_industry_reports",
        "source_name": "UI sketch sample",
        "source_url": "",
        "summary": "BEAUTY WORLD 参展，适合展会前触达。",
        "evidence": "来自系统 UI 草图样例，待替换为官网/展会信源。",
        "status": "已分发",
    },
    {
        "lead_id": "lead_20260602_004",
        "publish_date": "2025-05-27",
        "company": "Anker",
        "parent_company": "",
        "country": "US",
        "region": "North America",
        "platform": "",
        "standard_l1": "Consumer Tech",
        "standard_l2": "储能/充电/电源",
        "event_type": "融资",
        "signal_type": "扩大量产",
        "priority": "B",
        "action": "BD跟进",
        "source_id": "historical_industry_reports",
        "source_name": "UI sketch sample",
        "source_url": "",
        "summary": "融资动态提示产能与市场投入可能扩大。",
        "evidence": "来自系统 UI 草图样例，待替换为融资新闻信源。",
        "status": "未处理",
    },
    {
        "lead_id": "lead_20260602_005",
        "publish_date": "2025-05-26",
        "company": "EcoFlow",
        "parent_company": "",
        "country": "JP",
        "region": "APAC",
        "platform": "",
        "standard_l1": "Consumer Tech",
        "standard_l2": "户外储能",
        "event_type": "新品发布",
        "signal_type": "渠道扩张",
        "priority": "B",
        "action": "售前打标",
        "source_id": "historical_industry_reports",
        "source_name": "UI sketch sample",
        "source_url": "",
        "summary": "日本新品发布与渠道扩张动作可进入观察池。",
        "evidence": "来自系统 UI 草图样例，待替换为官网/PR 信源。",
        "status": "未处理",
    },
]


def write_json(path: Path, payload) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def main() -> None:
    lead_path = PORTAL_DIR / "data" / "leads" / "lead_events.json"
    write_json(lead_path, LEADS)
    print(f"lead_events.json: {len(LEADS)} records")


if __name__ == "__main__":
    main()

