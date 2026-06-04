"""Scan industry research assets and emit a machine-readable inventory."""

from __future__ import annotations

import json
import re
from collections import Counter, defaultdict
from pathlib import Path

import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parents[1]
SOURCE_ROOT = Path(r"Z:\主线任务2-天眼计划\行业专题研究")
REPORT_ROOT = SOURCE_ROOT / "行研报告"
OUT_JSON = PROJECT_ROOT / "data_assets" / "research" / "industry_research_asset_inventory.json"
OUT_MD = PROJECT_ROOT / "docs" / "industry_research_content_integration_plan.md"

EXTENSIONS = {".md", ".xlsx", ".xls", ".csv", ".html", ".json", ".py", ".docx", ".pdf"}
REPORT_KEYWORDS = ("报告", "研究", "洞察", "简报", "分析", "迭代日志", "模板", "方法论", "信号")


def rel(path: Path) -> str:
    try:
        return str(path.relative_to(SOURCE_ROOT))
    except ValueError:
        return str(path)


def classify(path: Path) -> str:
    name = path.name
    suffix = path.suffix.lower()
    parts = path.parts
    if "中间数据" in parts:
        return "intermediate_data"
    if "底表" in name or "竞品分析底表" in name:
        return "bottom_table"
    if suffix in {".md", ".docx", ".pdf", ".html"} and any(k in name for k in REPORT_KEYWORDS):
        return "narrative_report"
    if suffix in {".xlsx", ".xls", ".csv"} and ("全行业" in name or "优先级" in name or "拓客" in name):
        return "cross_industry_decision_table"
    if suffix == ".py":
        return "script"
    return "supporting_asset"


def read_md_headings(path: Path, limit: int = 12) -> list[str]:
    try:
        text = path.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        return []
    headings = []
    for line in text.splitlines():
        if line.startswith("#"):
            clean = re.sub(r"^#+\s*", "", line).strip()
            if clean:
                headings.append(clean)
        if len(headings) >= limit:
            break
    return headings


def should_read_excel_meta(path: Path, item_class: str) -> bool:
    if item_class == "cross_industry_decision_table":
        return True
    if item_class == "intermediate_data" and path.name in {
        "l1_summary.json",
        "report_data.json",
        "report_data_2026_04.json",
    }:
        return True
    return False


def read_excel_meta(path: Path, max_sheets: int = 5) -> dict:
    meta: dict = {"sheets": [], "error": None}
    try:
        xl = pd.ExcelFile(path)
        for sheet in xl.sheet_names[:max_sheets]:
            try:
                df = pd.read_excel(path, sheet_name=sheet, nrows=3)
                meta["sheets"].append(
                    {
                        "sheet": sheet,
                        "columns": [str(c) for c in df.columns[:30]],
                        "sample_rows": len(df),
                    }
                )
            except Exception as exc:
                meta["sheets"].append({"sheet": sheet, "columns": [], "error": str(exc)[:300]})
    except Exception as exc:
        meta["error"] = str(exc)[:300]
    return meta


def scan_assets() -> dict:
    assets = []
    folder_counts: Counter[str] = Counter()
    class_counts: Counter[str] = Counter()
    ext_counts: Counter[str] = Counter()
    report_folders = []

    if REPORT_ROOT.exists():
        for p in sorted(REPORT_ROOT.iterdir(), key=lambda x: x.name):
            if p.is_dir():
                report_folders.append(
                    {
                        "name": p.name,
                        "path": str(p),
                        "file_count": sum(1 for x in p.rglob("*") if x.is_file()),
                        "has_intermediate_data": any(x.name == "中间数据" for x in p.rglob("*") if x.is_dir()),
                    }
                )

    for path in SOURCE_ROOT.rglob("*"):
        if not path.is_file():
            continue
        suffix = path.suffix.lower()
        if suffix not in EXTENSIONS:
            continue
        item_class = classify(path)
        top = rel(path).split("\\")[0]
        item = {
            "path": str(path),
            "relative_path": rel(path),
            "name": path.name,
            "extension": suffix,
            "size_bytes": path.stat().st_size,
            "last_modified": path.stat().st_mtime,
            "top_folder": top,
            "asset_class": item_class,
        }
        if suffix == ".md":
            item["headings"] = read_md_headings(path)
        if suffix in {".xlsx", ".xls"} and should_read_excel_meta(path, item_class):
            item["excel_meta"] = read_excel_meta(path)
        assets.append(item)
        folder_counts[top] += 1
        class_counts[item_class] += 1
        ext_counts[suffix] += 1

    return {
        "generated_at": "2026-06-02",
        "source_root": str(SOURCE_ROOT),
        "report_root": str(REPORT_ROOT),
        "asset_count": len(assets),
        "folder_counts": dict(folder_counts.most_common()),
        "class_counts": dict(class_counts.most_common()),
        "extension_counts": dict(ext_counts.most_common()),
        "report_folders": report_folders,
        "assets": sorted(assets, key=lambda x: (x["asset_class"], x["relative_path"])),
    }


def write_outputs(payload: dict) -> None:
    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUT_JSON.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")

    report_ready = [x for x in payload["report_folders"] if x["has_intermediate_data"]]
    cross_tables = [x for x in payload["assets"] if x["asset_class"] == "cross_industry_decision_table"]
    narrative = [x for x in payload["assets"] if x["asset_class"] == "narrative_report"]
    bottom_tables = [x for x in payload["assets"] if x["asset_class"] == "bottom_table"]

    lines = [
        "# Industry Research Content Integration Plan",
        "",
        "## Source Scope",
        "",
        f"- Source root: `{payload['source_root']}`",
        f"- Scanned assets: {payload['asset_count']}",
        "",
        "## Asset Classes",
        "",
    ]
    for key, value in payload["class_counts"].items():
        lines.append(f"- `{key}`: {value}")

    lines += [
        "",
        "## Report Folders",
        "",
        "| Folder | Files | Intermediate Data |",
        "|---|---:|---|",
    ]
    for folder in payload["report_folders"]:
        lines.append(
            f"| {folder['name']} | {folder['file_count']} | {'yes' if folder['has_intermediate_data'] else 'no'} |"
        )

    lines += [
        "",
        "## Highest-Value Inputs For The Portal",
        "",
        "1. Cross-industry decision tables: feed market priority, heat, target customers, and action hints.",
        "2. Standardized report intermediate data: feed trend charts, category drilldowns, CN share explanations, and top brands.",
        "3. Narrative reports and methodology docs: feed insight templates, evidence wording, and BD action logic.",
        "4. Signal tracking docs: feed leads/player timing hooks after the market page is stable.",
        "",
        "## Cross-Industry Tables",
        "",
    ]
    for item in cross_tables[:20]:
        lines.append(f"- `{item['relative_path']}`")

    lines += [
        "",
        "## Narrative Reports To Mine",
        "",
    ]
    for item in narrative[:40]:
        heading = " / ".join(item.get("headings", [])[:3])
        lines.append(f"- `{item['relative_path']}`" + (f" - {heading}" if heading else ""))

    lines += [
        "",
        "## Bottom Tables",
        "",
        f"- Bottom table assets detected: {len(bottom_tables)}",
        "- These should not be rendered directly in the market UI. Use them to enrich `standard_l2` with trends, CN share, player count, and top brands.",
        "",
        "## Proposed Portal Data Layers",
        "",
        "| Layer | New Asset | Purpose |",
        "|---|---|---|",
        "| research inventory | `data_assets/research/industry_research_asset_inventory.json` | What historical research exists and where it lives. |",
        "| market enrichment | `data_assets/curated/research/market_research_enrichment.json` | Standardized insights, evidence, and action hints by industry/category. |",
        "| player hooks | `data_assets/curated/research/player_signal_hooks.json` | PR/event/search hooks for player outreach. |",
        "| product hooks | `data_assets/curated/research/product_opportunity_hooks.json` | Product-level opportunity evidence from deep reports. |",
        "",
        "## Integration Rule",
        "",
        "Historical reports should enrich the system, not replace governed facts. The market module should keep `standard_l2` as the display grain and attach research evidence as supporting context.",
    ]
    OUT_MD.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> None:
    payload = scan_assets()
    write_outputs(payload)
    print(f"asset_count: {payload['asset_count']}")
    print(f"class_counts: {payload['class_counts']}")
    print(f"report_folders: {len(payload['report_folders'])}")
    print(f"outputs: {OUT_JSON}; {OUT_MD}")


if __name__ == "__main__":
    main()
