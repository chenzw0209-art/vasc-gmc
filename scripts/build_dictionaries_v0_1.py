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


def clean_mojibake(value: str) -> str:
    text = str(value or "").strip()
    try:
        return text.encode("gbk").decode("utf-8")
    except UnicodeError:
        return text


def normalize_ecommerce_pair(standard_l1: str, standard_l2: str) -> tuple[str, str] | None:
    standard_l1 = clean_mojibake(standard_l1)
    standard_l2 = clean_mojibake(standard_l2)

    if standard_l1 == "Auto & Mobility":
        return "Lifestyle", standard_l2

    # Ecommerce Gaming in the source mapping is physical game discs/cards.
    # Consoles and game hardware should map to Consumer Tech upstream; cards/discs
    # are not a target customer category for presales lead discovery.
    if standard_l1 == "Gaming":
        return None

    return standard_l1, standard_l2


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
    pairs = set()
    for r in category_mapping:
        if not r["standard_l1"] or not r["standard_l2"]:
            continue
        pair = normalize_ecommerce_pair(r["standard_l1"], r["standard_l2"])
        if pair:
            pairs.add(pair)
    pairs = sorted(pairs)
    return [
        {
            "standard_l1": standard_l1,
            "standard_l2": standard_l2,
            "definition": "",
            "examples": "",
            "remark": "Generated from category_mapping_ecommerce.json v0.1; Auto & Mobility folded into Lifestyle; ecommerce Gaming excluded.",
        }
        for standard_l1, standard_l2 in pairs
    ]


def build_app_dictionary() -> list[dict]:
    app_tree = {
        "Gaming": [
            ("主机/PC游戏", "面向海外PC或主机玩家的游戏产品，含Steam/PS/Xbox/Nintendo页面、Demo、实机、预约、上线窗口。"),
            ("移动游戏", "面向海外App Store/Google Play或区域发行的手游。"),
            ("二次元/开放世界", "二次元、开放世界、都市幻想等高内容投入游戏。"),
            ("休闲/派对/社交游戏", "休闲、派对、社交、UGC或轻度多人玩法游戏。"),
            ("独立游戏/买断制", "独立工作室、买断制、Steam Next Fest等适合提前触达的游戏。"),
        ],
        "AI应用": [
            ("AI聊天/助手", "AI聊天、陪伴、智能助手、搜索问答等AI原生应用。"),
            ("AI图像/设计", "AI图像生成、修图、设计、商品图、视觉创作应用。"),
            ("AI视频/音频", "AI视频生成、剪辑、配音、音乐、语音等多媒体AI应用。"),
            ("AI办公/生产力", "AI文档、会议、邮件、知识库、办公自动化应用。"),
            ("AI开发者/模型工具", "API、模型工具、智能体构建、开发者平台类AI应用。"),
        ],
        "Fintech": [
            ("跨境支付/收单", "跨境支付、收单、商户支付、钱包互联。"),
            ("钱包/账户", "电子钱包、账户体系、储值、银行卡连接。"),
            ("汇款/换汇", "跨境汇款、换汇、外币账户。"),
            ("数字银行/信贷/BNPL", "数字银行、信贷、分期、BNPL。"),
            ("投资/券商/Web3金融", "券商、投资、加密金融、Web3金融服务。"),
        ],
        "工具": [
            ("视频剪辑/创作工具", "剪辑、模板、字幕、素材、创作者工具。"),
            ("设计/PDF/办公", "设计、PDF、演示、办公编辑和生产力工具。"),
            ("翻译/语言", "翻译、语言学习、写作、语音转写。"),
            ("笔记/知识管理", "笔记、知识库、阅读、信息整理。"),
            ("VPN/安全", "VPN、隐私、安全、防护工具。"),
            ("开发者工具", "IDE、代码、测试、API、运维工具。"),
        ],
        "平台": [
            ("跨境电商平台", "连接卖家、品牌和消费者的跨境电商平台。"),
            ("本地生活/外卖/到店", "本地生活、外卖、到店、服务履约平台。"),
            ("酒旅/票务/出行", "酒旅、票务、出行和预订平台。"),
            ("商家经营/卖家工具", "商家经营、卖家工具、SaaS化平台。"),
            ("服务撮合/招聘/任务", "服务撮合、招聘、任务、B2B撮合平台。"),
        ],
        "泛娱乐": [
            ("短视频/直播", "短视频、直播、直播互动、内容分发平台。"),
            ("社交/社区", "社交、社区、兴趣小组、互动平台。"),
            ("音乐/音频", "音乐、播客、音频、K歌应用。"),
            ("短剧/阅读", "短剧、网文、漫画、阅读内容应用。"),
            ("创作者生态/内容平台", "创作者工具与内容生态平台，核心价值在内容消费或分发。"),
        ],
    }
    return [
        {
            "standard_l1": standard_l1,
            "standard_l2": standard_l2,
            "definition": definition,
            "examples": "",
            "remark": "Curated app dictionary v0.1 from presales lead rules.",
        }
        for standard_l1, items in app_tree.items()
        for standard_l2, definition in items
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
    write_json(dictionary_dir / "industry_dictionary_app.json", build_app_dictionary())
    write_json(sources_dir / "source_registry.json", build_source_registry())

    print(f"category_mapping_ecommerce.json: {len(category_mapping)} records")
    print("industry_dictionary_ecommerce.json: generated")
    print("industry_dictionary_app.json: generated")
    print("source_registry.json: generated")


if __name__ == "__main__":
    main()
