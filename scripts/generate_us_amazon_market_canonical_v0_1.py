"""Generate deduplicated US Amazon market data from canonical sources v0.1."""

from __future__ import annotations

import json
import re
from pathlib import Path

import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parents[1]
PORTAL_DIR = PROJECT_ROOT / "portal"
CANONICAL_PATH = PORTAL_DIR / "data" / "sources" / "us_amazon_canonical_sources.json"
OUT_PATH = PORTAL_DIR / "data" / "amazon" / "us_amazon_market_canonical_monthly.json"

MARKET_SHEETS = ["1_类目细分市场分析", "1_品类大盘"]
BRAND_SHEETS = ["3_品牌竞争格局", "①品牌竞争格局"]

MONTH_RE = re.compile(r"^\d{4}-\d{2}$")


def clean_number(value) -> float:
    if value is None or pd.isna(value):
        return 0.0
    text = str(value).replace(",", "").replace("$", "").replace("%", "").strip()
    if text in {"", "--", "nan"}:
        return 0.0
    try:
        return float(text)
    except ValueError:
        return 0.0


def first_existing(row, names: list[str]) -> float:
    for name in names:
        if name in row:
            return clean_number(row.get(name))
    return 0.0


def read_sheet_with_header_search(path: Path, sheet_name: str, required_any: list[str]) -> pd.DataFrame | None:
    for header in range(0, 6):
        try:
            df = pd.read_excel(path, sheet_name=sheet_name, header=header).fillna("")
        except Exception:
            continue
        columns = {str(c) for c in df.columns}
        if any(col in columns for col in required_any):
            return df
    return None


def read_market_sheet(path: Path) -> tuple[pd.DataFrame | None, str]:
    try:
        xl = pd.ExcelFile(path)
    except Exception:
        return None, "excel_open_failed"

    for sheet in MARKET_SHEETS:
        if sheet not in xl.sheet_names:
            continue
        df = read_sheet_with_header_search(path, sheet, ["三级类目", "月销总额($)", "总月销额($)"])
        if df is not None:
            return df, f"market_sheet:{sheet}"

    for sheet in BRAND_SHEETS:
        if sheet not in xl.sheet_names:
            continue
        df = read_sheet_with_header_search(path, sheet, ["品牌", "月销额($)", "年估算GMV($)", "年估算销额($)"])
        if df is not None:
            return df, f"brand_sheet_fallback:{sheet}"

    return None, "no_supported_sheet"


def aggregate_market_df(df: pd.DataFrame) -> dict:
    monthly_gmv = 0.0
    annual_gmv = 0.0
    prev_monthly_gmv = 0.0
    cn_monthly_gmv = 0.0
    cn_annual_gmv = 0.0
    sub_count = 0
    top_brands = []

    month_cols = sorted([str(c) for c in df.columns if MONTH_RE.match(str(c))], reverse=True)
    latest_month = month_cols[0] if month_cols else ""
    prev_month = month_cols[1] if len(month_cols) > 1 else ""

    for _, row in df.iterrows():
        row_dict = row.to_dict()
        row_monthly = first_existing(row_dict, ["总月销额($)", "月销总额($)", "月销额($)", "当月销售额($)"])
        row_annual = first_existing(row_dict, ["总年GMV($)", "年估算销售额($)", "年GMV($)", "年估算GMV($)", "年估算销额($)"])

        if not row_monthly and latest_month:
            row_monthly = clean_number(row_dict.get(latest_month))
        if not row_annual and month_cols:
            row_annual = sum(clean_number(row_dict.get(m)) for m in month_cols[:12])

        monthly_gmv += row_monthly
        annual_gmv += row_annual
        if prev_month:
            prev_monthly_gmv += clean_number(row_dict.get(prev_month))

        is_cn = str(row_dict.get("是否中国品牌", "")).strip() == "是"
        cn_share = first_existing(row_dict, ["中国品牌GMV占比(%)"])
        if cn_share and row_monthly:
            cn_monthly_gmv += row_monthly * cn_share / 100
        elif is_cn:
            cn_monthly_gmv += row_monthly
            cn_annual_gmv += row_annual

        top3 = str(row_dict.get("TOP3品牌", row_dict.get("Top3品牌", ""))).strip()
        if top3:
            top_brands.extend([x.strip() for x in re.split(r"[/、]", top3) if x.strip()])

        if row_monthly or row_annual:
            sub_count += 1

    if not cn_annual_gmv and annual_gmv and monthly_gmv and cn_monthly_gmv:
        cn_annual_gmv = annual_gmv * cn_monthly_gmv / monthly_gmv

    return {
        "gmv": annual_gmv,
        "monthly_gmv": monthly_gmv,
        "prev_monthly_gmv": prev_monthly_gmv,
        "cn_monthly_gmv": cn_monthly_gmv,
        "cn_annual_gmv": cn_annual_gmv,
        "cn_share": (cn_monthly_gmv / monthly_gmv * 100) if monthly_gmv else 0.0,
        "sub_count": sub_count,
        "top_brands": list(dict.fromkeys(top_brands))[:10],
    }


def read_canonical_source(item: dict) -> dict:
    path = Path(item["source_path"])
    df, read_method = read_market_sheet(path)
    base = {
        "canonical_id": item["canonical_id"],
        "country": item["country"],
        "platform": item["platform"],
        "period": "2026-04",
        "period_type": "month",
        "raw_l1": item["raw_l1"],
        "raw_l2": item["raw_l2"],
        "standard_l1": item["standard_l1"],
        "standard_l2": item["standard_l2"],
        "source_path": item["source_path"],
        "source_report_area": item["source_report_area"],
        "read_method": read_method,
    }
    if df is None:
        return {**base, "read_status": "failed", "gmv": 0.0, "monthly_gmv": 0.0}
    metrics = aggregate_market_df(df)
    return {**base, "read_status": "ok", **metrics}


def aggregate_standard_l2(raw_records: list[dict]) -> list[dict]:
    groups: dict[tuple[str, str], list[dict]] = {}
    for row in raw_records:
        if row.get("read_status") != "ok":
            continue
        groups.setdefault((row["standard_l1"], row["standard_l2"]), []).append(row)

    records = []
    for (standard_l1, standard_l2), items in groups.items():
        gmv = sum(x["gmv"] for x in items)
        monthly_gmv = sum(x["monthly_gmv"] for x in items)
        prev_monthly_gmv = sum(x.get("prev_monthly_gmv", 0.0) for x in items)
        cn_monthly_gmv = sum(x.get("cn_monthly_gmv", 0.0) for x in items)
        cn_annual_gmv = sum(x.get("cn_annual_gmv", 0.0) for x in items)
        raw_l2_values = sorted({x["raw_l2"] for x in items})
        top_brands = []
        for x in items:
            top_brands.extend(x.get("top_brands", []))

        records.append(
            {
                "record_id": f"us_amazon_{standard_l1}_{standard_l2}",
                "country": "US",
                "region": "North America",
                "platform": "Amazon",
                "period": "2026-04",
                "period_type": "month",
                "standard_l1": standard_l1,
                "standard_l2": standard_l2,
                "gmv": gmv,
                "monthly_gmv": monthly_gmv,
                "prev_monthly_gmv": prev_monthly_gmv,
                "growth_rate": ((monthly_gmv - prev_monthly_gmv) / prev_monthly_gmv * 100) if prev_monthly_gmv else 0.0,
                "cn_monthly_gmv": cn_monthly_gmv,
                "cn_annual_gmv": cn_annual_gmv,
                "cn_share": (cn_monthly_gmv / monthly_gmv * 100) if monthly_gmv else 0.0,
                "raw_l2_count": len(raw_l2_values),
                "raw_l2_values": raw_l2_values,
                "canonical_source_count": len(items),
                "canonical_source_paths": [x["source_path"] for x in items],
                "top_brands": list(dict.fromkeys(top_brands))[:10],
            }
        )
    return sorted(records, key=lambda x: x["gmv"], reverse=True)


def summarize(records: list[dict], raw_records: list[dict]) -> dict:
    total_gmv = sum(x["gmv"] for x in records)
    total_monthly_gmv = sum(x["monthly_gmv"] for x in records)
    cn_monthly_gmv = sum(x["cn_monthly_gmv"] for x in records)
    return {
        "generated_at": "2026-06-02",
        "scope": "US Amazon North America canonical market",
        "grain": "standard_l1 / standard_l2",
        "gold_standard": "Z:\\主线任务2-天眼计划\\信息可视化\\类目匹配表_0602.xlsx",
        "canonical_source_count": len(raw_records),
        "read_ok_count": sum(1 for x in raw_records if x.get("read_status") == "ok"),
        "read_failed_count": sum(1 for x in raw_records if x.get("read_status") != "ok"),
        "standard_l1_count": len({x["standard_l1"] for x in records}),
        "standard_l2_count": len(records),
        "total_gmv": total_gmv,
        "total_monthly_gmv": total_monthly_gmv,
        "cn_share_weighted": (cn_monthly_gmv / total_monthly_gmv * 100) if total_monthly_gmv else 0.0,
        "read_method_counts": {
            method: sum(1 for x in raw_records if x.get("read_method") == method)
            for method in sorted({x.get("read_method") for x in raw_records})
        },
    }


def write_json(path: Path, payload) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def main() -> None:
    canonical = json.loads(CANONICAL_PATH.read_text(encoding="utf-8"))
    sources = [x for x in canonical["canonical_sources"] if x.get("include_flag") == "纳入"]
    raw_records = [read_canonical_source(item) for item in sources]
    records = aggregate_standard_l2(raw_records)
    payload = {
        "summary": summarize(records, raw_records),
        "records": records,
        "raw_source_records": raw_records,
        "read_failures": [x for x in raw_records if x.get("read_status") != "ok"],
    }
    write_json(OUT_PATH, payload)
    print(f"standard_l2 records: {len(records)}")
    print(f"raw source records: {len(raw_records)}")
    print(f"read failures: {len(payload['read_failures'])}")
    print(f"output: {OUT_PATH}")


if __name__ == "__main__":
    main()
