from __future__ import annotations

import json
import math
from pathlib import Path

import pandas as pd


ROOT = Path(__file__).resolve().parents[1]
BEAUTY_XLSX = ROOT / "tmp_inputs" / "beauty_leads.xlsx"
TECH_XLSX = ROOT / "tmp_inputs" / "consumer_tech_leads.xlsx"
EXHIBITIONS_XLSX = ROOT / "tmp_inputs" / "exhibitions_v2.xlsx"
OUTS = [
    ROOT / "portal" / "data" / "leads" / "lead_events.json",
    ROOT / "data_assets" / "curated" / "leads" / "lead_events.json",
]


def clean(value):
    if value is None:
        return ""
    if isinstance(value, float) and math.isnan(value):
        return ""
    return str(value).strip()


def number(value):
    if value is None or (isinstance(value, float) and math.isnan(value)):
        return None
    if isinstance(value, (int, float)):
        return float(value)
    text = str(value).replace("$", "").replace(",", "").replace("M", "").strip()
    try:
        n = float(text)
        if "M" in str(value):
            return n * 1_000_000
        return n
    except ValueError:
        return None


def priority_from_grade(grade: str, current: str = "") -> str:
    grade = clean(grade)
    current = clean(current)
    if grade in {"A", "高"}:
        return "A"
    if "是" in current or grade in {"B", "中"}:
        return "B"
    return "C"


def map_beauty_l2(category: str, product: str, hook: str) -> str:
    text = f"{category} {product} {hook}"
    if any(k in text for k in ["IPL", "脱毛", "美容仪", "电动牙刷", "冲牙器", "吹风", "造型", "美发", "LED面罩"]):
        return "美容个护电器"
    if any(k in text for k in ["口腔", "牙刷", "水牙线", "冲牙器"]):
        return "口腔护理"
    if any(k in text for k in ["彩妆", "化妆品", "SHEGLAM", "Focallure", "ZEESEA", "Florasis"]):
        return "彩妆"
    if any(k in text for k in ["护肤", "面膜", "精华", "防晒", "身体护理"]):
        return "护肤与个人护理"
    if any(k in text for k in ["头发", "美发", "Hair", "吹风"]):
        return "头发护理/造型"
    return "Beauty 其他"


def build_beauty() -> list[dict]:
    if not BEAUTY_XLSX.exists():
        return []
    df = pd.read_excel(BEAUTY_XLSX, sheet_name=1)
    rows = []
    for idx, row in df.iterrows():
        country = clean(row.get("覆盖国家"))
        brand = clean(row.get("品牌名"))
        if not brand:
            continue
        hook = clean(row.get("事件钩子（线性）"))
        product = clean(row.get("产品/渠道/动作"))
        service = clean(row.get("可切服务点"))
        tiktok = clean(row.get("TikTok校验状态"))
        rows.append(
            {
                "lead_id": f"beauty_{idx+1}",
                "standard_l1": "Beauty",
                "standard_l2": map_beauty_l2(clean(row.get("标准品类")), product, hook),
                "company": brand,
                "parent_company": clean(row.get("企业名/母公司")),
                "country": country or "US",
                "platform": "Amazon/TikTok/DTC",
                "event_type": clean(row.get("事件类型")) or "渠道/内容信号",
                "signal_type": clean(row.get("客户类型标签")) or "增长信号",
                "summary": hook,
                "action": service,
                "product_action": product,
                "priority": priority_from_grade(clean(row.get("信源等级")), clean(row.get("是否近90天/当前信号"))),
                "publish_date": clean(row.get("事件时间")),
                "source_name": "美妆个护大区拓客线索 v1.5",
                "source_url": clean(row.get("信源链接")),
                "status": clean(row.get("存量/触达状态")) or "待核验",
                "evidence_grade": clean(row.get("信源等级")),
                "tiktok_status": tiktok,
                "tiktok_shop": clean(row.get("TikTok匹配店铺")),
                "tiktok_13w_gmv": number(row.get("TikTok近13周GMV")),
                "tiktok_13w_mom": number(row.get("TikTok近13周环比")),
                "source_workbook": str(BEAUTY_XLSX),
            }
        )
    return rows


def map_tech_l2(category: str, product: str, event: str) -> str:
    text = f"{category} {product} {event}".lower()
    if any(k in text for k in ["手机", "充电", "电源", "power", "anker", "tessan", "电气"]):
        return "手机配件/电源充电"
    if any(k in text for k in ["dji", "相机", "视频", "creator", "mic", "osmo", "无人机"]):
        return "影像/无人机/创作者工具"
    if any(k in text for k in ["安防", "监控", "security", "aosu", "reolink", "eufy"]):
        return "智能安防/摄像头"
    if any(k in text for k in ["吸尘", "地板", "roborock", "tineco", "dreame", "mova", "narwal"]):
        return "智能清洁/家用机器人"
    if any(k in text for k in ["穿戴", "ringconn", "智能手表", "手表"]):
        return "智能穿戴/健康硬件"
    if any(k in text for k in ["耳机", "音频", "soundcore", "speaker"]):
        return "音频与视听设备"
    return "Consumer Tech 其他"


def build_tech() -> list[dict]:
    if not TECH_XLSX.exists():
        return []
    df = pd.read_excel(TECH_XLSX, sheet_name=3)
    rows = []
    for idx, row in df.iterrows():
        brand = clean(row.get("品牌名称"))
        if not brand:
            continue
        category = clean(row.get("一级行业"))
        product = clean(row.get("主营品类"))
        event = clean(row.get("关键事件"))
        rows.append(
            {
                "lead_id": f"consumer_tech_{idx+1}",
                "standard_l1": "Consumer Tech",
                "standard_l2": map_tech_l2(category, product, event),
                "company": brand,
                "parent_company": "",
                "country": "US",
                "platform": "Amazon",
                "event_type": "新品/PR/渠道信号",
                "signal_type": category,
                "summary": event,
                "action": "用新品、展会、渠道或产品线扩张作为开场，优先核主体、官网、Amazon/DTC店铺和内容投放窗口。",
                "product_action": product,
                "priority": priority_from_grade(clean(row.get("PR等级"))),
                "publish_date": clean(row.get("事件日期")),
                "source_name": "3C值得做的行业和客户_行研视角",
                "source_url": clean(row.get("信源链接")),
                "status": "待核验",
                "evidence_grade": clean(row.get("PR等级")),
                "bottom_table_gmv": clean(row.get("底表GMV")),
                "source_workbook": str(TECH_XLSX),
            }
        )
    return rows


def map_exhibition_l1_l2(industry: str, name: str) -> tuple[str, str]:
    text = f"{industry} {name}".lower()
    if any(k in text for k in ["美妆", "美容", "beauty", "cosmoprof", "个护"]):
        return "Beauty", "Beauty 展会/活动"
    if any(k in text for k in ["3c", "消费电子", "电子", "光伏", "太阳能", "储能", "照明", "智能", "meta", "amazon", "亚马逊", "跨境电商", "coupang", "速卖通", "美客多"]):
        return "Consumer Tech", "出海平台/消费电子展会"
    if any(k in text for k in ["服装", "服饰", "fashion", "鞋", "箱包", "纺织"]):
        return "Fashion", "Fashion 展会/活动"
    if any(k in text for k in ["医疗", "健康", "口腔", "制药", "医药", "康复"]):
        return "Health", "Health 展会/活动"
    if any(k in text for k in ["食品", "饮料", "咖啡", "茶", "酒", "母婴"]):
        return "FMCG", "FMCG 展会/活动"
    return "Lifestyle", "Lifestyle/综合出海展会"


def priority_from_exhibition(row) -> str:
    priority = clean(row.get("展会优先级"))
    target = clean(row.get("获客目标"))
    if priority.upper() in {"A", "S"} or "重点" in target or "品牌" in target:
        return "A"
    if priority.upper() in {"B", "TO"} or target:
        return "B"
    return "C"


def build_exhibitions() -> list[dict]:
    if not EXHIBITIONS_XLSX.exists():
        return []
    df = pd.read_excel(EXHIBITIONS_XLSX, sheet_name=0)
    rows = []
    for idx, row in df.iterrows():
        name = clean(row.get("展会名称"))
        if not name or name == "展会名称":
            continue
        industry = clean(row.get("行业分类"))
        l1, l2 = map_exhibition_l1_l2(industry, name)
        date = clean(row.get("核查后真实日期")) or clean(row.get("时间"))
        location = clean(row.get("地点"))
        url = clean(row.get("报名/官网链接"))
        source_platform = clean(row.get("信源平台"))
        bd = clean(row.get("跟进BD"))
        target = clean(row.get("获客目标"))
        potential = clean(row.get("潜在客户清单")) or clean(row.get("客户列表"))
        rows.append(
            {
                "lead_id": f"exhibition_{clean(row.get('序号')) or idx + 1}",
                "standard_l1": l1,
                "standard_l2": l2,
                "company": name,
                "parent_company": "",
                "country": "US",
                "location": location,
                "platform": "Exhibition/Outbound",
                "event_type": "展会活动",
                "signal_type": industry or "出海展会",
                "summary": f"{name}｜{date}｜{location}",
                "action": bd or target or "会前筛选参展/报名品牌，按行业匹配潜在客户并做会前触达。",
                "product_action": potential or industry or "展会/活动线索",
                "priority": priority_from_exhibition(row),
                "publish_date": date,
                "source_name": source_platform or "出海展会汇总 v2.0",
                "source_url": url,
                "status": clean(row.get("核查状态")) or "待处理",
                "evidence_grade": clean(row.get("链接状态")),
                "event_name": name,
                "event_time": clean(row.get("时间")),
                "event_location": location,
                "register_url": url,
                "source_workbook": str(EXHIBITIONS_XLSX),
            }
        )
    return rows


def main():
    rows = build_beauty() + build_tech() + build_exhibitions()
    payload = {
        "summary": {
            "generated_at": "2026-06-03",
            "scope": "Beauty/Consumer Tech workbook leads plus outbound exhibition events v2.0 mapped to active industries.",
            "record_count": len(rows),
            "beauty_count": sum(1 for x in rows if x["standard_l1"] == "Beauty"),
            "consumer_tech_count": sum(1 for x in rows if x["standard_l1"] == "Consumer Tech"),
            "exhibition_count": sum(1 for x in rows if str(x.get("lead_id", "")).startswith("exhibition_")),
        },
        "records": rows,
    }
    for out in OUTS:
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(payload["summary"], ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
