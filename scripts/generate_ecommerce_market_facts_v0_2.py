"""Generate seven-country ecommerce market facts from canonical sources v0.2.

Master output: data_assets/curated/market/ecommerce_market_facts_monthly.json
Portal cache:  portal/data/market/ecommerce_market_facts_monthly.json

Currency: all money fields are normalized to USD.
- Amazon MX/JP/BR source workbooks store GMV in native currency (MXN/JPY/BRL).
  They are converted to USD with FX_TO_USD below. ADJUST THESE RATES as needed;
  each record keeps its native value + native_currency for re-checking.
- Amazon US is already USD (FX = 1) and uses the original US matching path to
  preserve parity with the known-good US-only fact table.
- Shopee MY/ID 销售额USD is already USD.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

import pandas as pd

from shopee_resolution import (
    MONTH_LABELS,
    PUNCT_RE,
    SHOPEE_L1_ALIASES,
    normalize_name,
)


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DATA_ASSETS = PROJECT_ROOT / "data_assets"
CANONICAL_PATH = DATA_ASSETS / "canonical_sources" / "ecommerce_market_canonical_sources.json"
OUT_CURATED = DATA_ASSETS / "curated" / "market" / "ecommerce_market_facts_monthly.json"
OUT_PORTAL = PROJECT_ROOT / "portal" / "data" / "market" / "ecommerce_market_facts_monthly.json"

# --- FX: native currency -> USD multipliers (2026-04 reference rates). ---
# Keep these as explicit constants so finance/data users can audit the market fact table.
FX_TO_USD = {
    "US": 1.0,
    "MX": 1.0 / 17.4433,
    "JP": 1.0 / 159.344,
    "BR": 1.0 / 5.0331,
}
NATIVE_CURRENCY = {"US": "USD", "MX": "MXN", "JP": "JPY", "BR": "BRL"}

MONTH_RE = re.compile(r"^\d{4}-\d{2}$")

# Amazon sheet names
MARKET_SHEETS = ["1_类目细分市场分析", "1_品类大盘"]
BRAND_SHEETS = ["3_品牌竞争格局", "①品牌竞争格局"]

# Shopee processed L1 workbook cache: path -> DataFrame (one L1 file serves many L2)
_SHOPEE_CACHE: dict[str, pd.DataFrame | None] = {}

# PUNCT_RE, SHOPEE_L1_ALIASES, MONTH_LABELS, normalize_name are imported from
# shopee_resolution so the fact layer and the governance/audit layer never drift.


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
            val = clean_number(row.get(name))
            if val:
                return val
    return 0.0


def value_by_prefix(row: dict, prefixes: list[str]) -> float:
    """Return first non-zero value whose column starts with any prefix.

    Handles currency-suffixed columns: 总月销额, 总月销额($), 总月销额(Mex $),
    总月销额(JPY), 总月销额(R$) all match prefix '总月销额'.
    """
    for prefix in prefixes:
        for col, val in row.items():
            if str(col).startswith(prefix):
                num = clean_number(val)
                if num:
                    return num
    return 0.0


# =========================== Amazon ===========================

def read_sheet_with_header_search(path: Path, sheet_name: str, required_any: list[str]) -> pd.DataFrame | None:
    """Read Excel sheet searching for header row in first 6 rows."""
    for header in range(0, 6):
        try:
            df = pd.read_excel(path, sheet_name=sheet_name, header=header).fillna("")
        except Exception:
            continue
        columns = {str(c) for c in df.columns}
        if any(col in columns for col in required_any):
            return df
    return None


def read_amazon_market_sheet(path: Path) -> tuple[pd.DataFrame | None, str]:
    """Read Amazon market sheet from workbook."""
    try:
        xl = pd.ExcelFile(path)
    except Exception:
        return None, "excel_open_failed"

    for sheet in MARKET_SHEETS:
        if sheet not in xl.sheet_names:
            continue
        df = read_sheet_with_header_search(path, sheet, ["三级类目", "月销总额($)", "总月销额($)", "总月销额"])
        if df is not None:
            return df, f"market_sheet:{sheet}"

    for sheet in BRAND_SHEETS:
        if sheet not in xl.sheet_names:
            continue
        df = read_sheet_with_header_search(path, sheet, ["品牌", "月销额($)", "年估算GMV($)", "年估算销额($)"])
        if df is not None:
            return df, f"brand_sheet_fallback:{sheet}"

    return None, "no_supported_sheet"


def aggregate_amazon_market_df(df: pd.DataFrame, fx: float) -> dict:
    """Aggregate Amazon market metrics from DataFrame, converting native -> USD via fx."""
    monthly_native = 0.0
    annual_native = 0.0
    prev_monthly_native = 0.0
    cn_monthly_native = 0.0
    cn_annual_native = 0.0
    sub_count = 0
    top_brands = []

    month_cols = sorted([str(c) for c in df.columns if MONTH_RE.match(str(c))], reverse=True)
    latest_month = month_cols[0] if month_cols else ""
    prev_month = month_cols[1] if len(month_cols) > 1 else ""

    for _, row in df.iterrows():
        row_dict = row.to_dict()
        # Match by prefix so currency-suffixed columns are picked up for every country.
        row_monthly = value_by_prefix(row_dict, ["总月销额", "月销总额", "月销额", "当月销售额"])
        row_annual = value_by_prefix(row_dict, ["总年GMV", "年估算销售额", "年GMV", "年估算GMV", "年估算销额"])

        if not row_monthly and latest_month:
            row_monthly = clean_number(row_dict.get(latest_month))
        if not row_annual and month_cols:
            row_annual = sum(clean_number(row_dict.get(m)) for m in month_cols[:12])

        monthly_native += row_monthly
        annual_native += row_annual
        if prev_month:
            prev_monthly_native += clean_number(row_dict.get(prev_month))

        is_cn = str(row_dict.get("是否中国品牌", "")).strip() == "是"
        cn_share = first_existing(row_dict, ["中国品牌GMV占比(%)"])
        if cn_share and row_monthly:
            cn_monthly_native += row_monthly * cn_share / 100
        elif is_cn:
            cn_monthly_native += row_monthly
            cn_annual_native += row_annual

        top3 = str(row_dict.get("TOP3品牌", row_dict.get("Top3品牌", ""))).strip()
        if top3:
            top_brands.extend([x.strip() for x in re.split(r"[/、]", top3) if x.strip()])

        if row_monthly or row_annual:
            sub_count += 1

    if not cn_annual_native and annual_native and monthly_native and cn_monthly_native:
        cn_annual_native = annual_native * cn_monthly_native / monthly_native

    return {
        # USD-normalized money fields
        "gmv": annual_native * fx,
        "monthly_gmv": monthly_native * fx,
        "prev_monthly_gmv": prev_monthly_native * fx,
        "cn_monthly_gmv": cn_monthly_native * fx,
        "cn_annual_gmv": cn_annual_native * fx,
        "cn_share": (cn_monthly_native / monthly_native * 100) if monthly_native else 0.0,
        # native reference for re-checking FX
        "native_monthly_gmv": monthly_native,
        "native_annual_gmv": annual_native,
        "sub_count": sub_count,
        "top_brands": list(dict.fromkeys(top_brands))[:10],
    }


def process_amazon_source(item: dict) -> dict:
    """Process single Amazon canonical source."""
    country = item["country"]
    fx = FX_TO_USD.get(country, 1.0)
    base = {
        "canonical_id": item["canonical_id"],
        "country": country,
        "region": item.get("region", ""),
        "platform": item["platform"],
        "raw_l1": item["raw_l1"],
        "raw_l2": item["raw_l2"],
        "standard_l1": item["standard_l1"],
        "standard_l2": item["standard_l2"],
        "native_currency": NATIVE_CURRENCY.get(country, "USD"),
        "fx_to_usd": fx,
    }

    source_path = item.get("source_path", "")
    if not source_path:
        return {**base, "read_status": "missing_source_workbook", "read_method": "no_source_path",
                "monthly_gmv": 0.0, "gmv": 0.0}

    path = Path(source_path)
    df, read_method = read_amazon_market_sheet(path)
    base["read_method"] = read_method
    if df is None:
        return {**base, "read_status": "failed", "monthly_gmv": 0.0, "gmv": 0.0}

    metrics = aggregate_amazon_market_df(df, fx)
    return {**base, "read_status": "ok", **metrics}


# =========================== Shopee ===========================

def load_shopee_workbook(path: Path) -> pd.DataFrame | None:
    """Load and cache a Shopee processed L1 workbook (one file serves many raw_l2)."""
    key = str(path)
    if key in _SHOPEE_CACHE:
        return _SHOPEE_CACHE[key]
    try:
        df = pd.read_excel(path).fillna("")
    except Exception:
        df = None
    _SHOPEE_CACHE[key] = df
    return df


def find_column(df: pd.DataFrame, names: list[str]) -> str | None:
    for name in names:
        if name in df.columns:
            return name
    return None


def resolve_shopee_processed_path(item: dict) -> tuple[Path | None, str]:
    source_path = item.get("source_path", "")
    if source_path and Path(source_path).exists():
        return Path(source_path), "canonical_source_path"

    raw_root_text = item.get("data_refresh_instruction", {}).get("raw_export_root", "")
    if not raw_root_text:
        return None, "missing_raw_export_root"

    raw_root = Path(raw_root_text)
    processed_root = raw_root.parent / "数据处理表" if raw_root.name == "数据底表" else raw_root / "数据处理表"
    if not processed_root.exists():
        return None, "missing_processed_folder"

    files = [p for p in processed_root.glob("*.xlsx") if not p.name.startswith("~$")]
    if not files:
        return None, "missing_processed_files"

    raw_l1_key = normalize_name(item.get("raw_l1", ""))
    alias = SHOPEE_L1_ALIASES.get(raw_l1_key)
    for path in files:
        file_key = normalize_name(path.stem)
        if file_key == raw_l1_key or file_key in raw_l1_key or raw_l1_key in file_key:
            return path, "resolved_processed_l1_by_name"
        if alias and file_key == normalize_name(alias):
            return path, "resolved_processed_l1_by_alias"

    return None, "missing_source_workbook"


def matched_shopee_l2_values(df: pd.DataFrame, raw_l2: str) -> tuple[list[str], str]:
    l2_col = find_column(df, ["二级类目"])
    if not l2_col:
        return [], "missing_l2_column"

    raw_key = normalize_name(raw_l2)
    values = sorted({str(v).strip() for v in df[l2_col].dropna() if str(v).strip()})
    exact = [v for v in values if str(v).strip() == str(raw_l2).strip()]
    if exact:
        return exact, "exact_l2"

    normalized = [v for v in values if normalize_name(v) == raw_key]
    if normalized:
        return normalized, "normalized_l2"

    contained = [v for v in values if normalize_name(v) and normalize_name(v) in raw_key]
    if contained:
        # Prefer the longest existing category when a gold category is a combined label.
        return sorted(contained, key=lambda x: len(normalize_name(x)), reverse=True)[:1], "contained_l2"

    reverse_contained = [v for v in values if raw_key and raw_key in normalize_name(v)]
    if reverse_contained:
        return sorted(reverse_contained, key=lambda x: len(normalize_name(x)), reverse=True)[:1], "reverse_contained_l2"

    return [], "no_matching_l2"


def aggregate_shopee_slice(df: pd.DataFrame, raw_l2: str) -> dict:
    """Aggregate one raw_l2 slice of a Shopee workbook.

    Grain in file is shop x month. 销售额USD is already USD.
    monthly_gmv = sum of 销售额USD in the latest (年份, 月份) period.
    prev_monthly_gmv = sum in the previous period (for MoM).
    annual_gmv = run-rate (latest month x 12) as a comparable annual proxy.
    """
    l2_col = find_column(df, ["二级类目"])
    sales_col = find_column(df, ["销售额USD"])
    year_col = find_column(df, ["年份"])
    month_col = find_column(df, ["月份"])
    if not all([l2_col, sales_col, year_col, month_col]):
        return {"read_status": "missing_expected_columns", "monthly_gmv": 0.0, "gmv": 0.0}

    matched_values, match_method = matched_shopee_l2_values(df, raw_l2)
    if not matched_values:
        return {"read_status": match_method, "monthly_gmv": 0.0, "gmv": 0.0}

    sub = df[df[l2_col].astype(str).str.strip().isin(matched_values)]
    if sub.empty:
        return {"read_status": "no_matching_l2", "monthly_gmv": 0.0, "gmv": 0.0}

    # Build sortable period key from 年份 + 月份
    def period_key(row) -> tuple[int, int]:
        y = int(clean_number(row.get(year_col)))
        m = int(clean_number(row.get(month_col)))
        return (y, m)

    periods = sorted({period_key(r) for _, r in sub.iterrows()}, reverse=True)
    latest = periods[0] if periods else None
    prev = periods[1] if len(periods) > 1 else None

    def period_sum(target: tuple[int, int] | None) -> float:
        if target is None:
            return 0.0
        total = 0.0
        for _, r in sub.iterrows():
            if period_key(r) == target:
                total += clean_number(r.get(sales_col))
        return total

    monthly_gmv = period_sum(latest)
    prev_monthly_gmv = period_sum(prev)
    period_label = f"{latest[0]}-{latest[1]:02d}" if latest else ""

    return {
        "read_status": "ok",
        "monthly_gmv": monthly_gmv,
        "prev_monthly_gmv": prev_monthly_gmv,
        "gmv": monthly_gmv * 12,  # run-rate annual proxy
        "cn_monthly_gmv": 0.0,    # Shopee processed table has no CN-brand flag
        "cn_annual_gmv": 0.0,
        "cn_share": 0.0,
        "native_monthly_gmv": monthly_gmv,
        "native_annual_gmv": monthly_gmv * 12,
        "shop_count": len(sub),
        "period": period_label,
        "l2_match_method": match_method,
        "matched_l2_values": matched_values,
        "top_brands": [],
    }


def shopee_raw_files(item: dict) -> list[Path]:
    raw_root_text = item.get("data_refresh_instruction", {}).get("raw_export_root", "")
    if not raw_root_text:
        return []
    raw_root = Path(raw_root_text)
    if not raw_root.exists():
        return []
    prefix = f"{item['raw_l1']}_{item['raw_l2']}_"
    return sorted(
        p for p in raw_root.glob("*.xlsx")
        if not p.name.startswith("~$") and p.name.startswith(prefix)
    )


def raw_file_period(path: Path) -> tuple[str, tuple[int, int]]:
    match = re.search(r"_(\d{1,2})月_第\d+页\.xlsx$", path.name)
    if not match:
        return "", (0, 0)
    label = MONTH_LABELS.get(match.group(1), "")
    if not label:
        return "", (0, 0)
    year, month = label.split("-")
    return label, (int(year), int(month))


def read_shopee_raw_page(path: Path) -> pd.DataFrame | None:
    for header in range(0, 12):
        try:
            df = pd.read_excel(path, header=header).fillna("")
        except Exception:
            continue
        if "销售额USD" in df.columns and "销量" in df.columns:
            return df
    return None


def aggregate_shopee_raw_pages(item: dict) -> dict:
    files = shopee_raw_files(item)
    if not files:
        return {"read_status": "missing_source_workbook", "monthly_gmv": 0.0, "gmv": 0.0}

    by_period: dict[tuple[int, int], list[Path]] = {}
    label_by_period = {}
    for path in files:
        label, key = raw_file_period(path)
        if not label:
            continue
        by_period.setdefault(key, []).append(path)
        label_by_period[key] = label

    periods = sorted(by_period.keys(), reverse=True)
    if not periods:
        return {"read_status": "missing_period_in_raw_files", "monthly_gmv": 0.0, "gmv": 0.0}

    def period_sum(period: tuple[int, int] | None) -> tuple[float, int, int]:
        if period is None:
            return 0.0, 0, 0
        total = 0.0
        shop_count = 0
        page_count = 0
        for path in by_period.get(period, []):
            df = read_shopee_raw_page(path)
            if df is None:
                continue
            page_count += 1
            shop_count += len(df)
            total += sum(clean_number(v) for v in df["销售额USD"])
        return total, shop_count, page_count

    latest = periods[0]
    prev = periods[1] if len(periods) > 1 else None
    monthly_gmv, shop_count, page_count = period_sum(latest)
    prev_monthly_gmv, _, _ = period_sum(prev)

    return {
        "read_status": "ok",
        "monthly_gmv": monthly_gmv,
        "prev_monthly_gmv": prev_monthly_gmv,
        "gmv": monthly_gmv * 12,
        "cn_monthly_gmv": 0.0,
        "cn_annual_gmv": 0.0,
        "cn_share": 0.0,
        "native_monthly_gmv": monthly_gmv,
        "native_annual_gmv": monthly_gmv * 12,
        "shop_count": shop_count,
        "raw_page_count": page_count,
        "period": label_by_period[latest],
        "read_method": "raw_monthly_pages",
        "top_brands": [],
    }


def process_shopee_source(item: dict) -> dict:
    """Process single Shopee canonical source."""
    base = {
        "canonical_id": item["canonical_id"],
        "country": item["country"],
        "region": item.get("region", ""),
        "platform": item["platform"],
        "raw_l1": item["raw_l1"],
        "raw_l2": item["raw_l2"],
        "standard_l1": item["standard_l1"],
        "standard_l2": item["standard_l2"],
        "native_currency": "USD",
        "fx_to_usd": 1.0,
    }

    source_path, source_method = resolve_shopee_processed_path(item)
    base["source_resolution_method"] = source_method

    if source_path is None:
        metrics = aggregate_shopee_raw_pages(item)
        return {**base, **metrics}

    df = load_shopee_workbook(source_path)
    if df is None:
        return {**base, "read_status": "excel_open_failed", "monthly_gmv": 0.0, "gmv": 0.0}

    metrics = aggregate_shopee_slice(df, item["raw_l2"])
    if metrics.get("read_status") in {"no_matching_l2", "missing_l2_column", "missing_expected_columns"}:
        raw_metrics = aggregate_shopee_raw_pages(item)
        if raw_metrics.get("read_status") == "ok":
            return {
                **base,
                "processed_l1_workbook": str(source_path),
                "processed_l1_read_status": metrics.get("read_status"),
                **raw_metrics,
            }

    return {**base, "read_method": "processed_l1_workbook", "resolved_source_path": str(source_path), **metrics}


# =========================== Aggregation ===========================

REGION_BY_COUNTRY = {
    "US": "North America",
    "MX": "Latin America",
    "BR": "Latin America",
    "JP": "Asia",
    "MY": "Southeast Asia",
    "ID": "Southeast Asia",
    "VN": "Southeast Asia",
}


def aggregate_by_market_l2(raw_records: list[dict]) -> list[dict]:
    """Aggregate raw records by country/platform/standard_l2. All money in USD."""
    groups: dict[tuple, list[dict]] = {}
    for row in raw_records:
        if row.get("read_status") != "ok":
            continue
        key = (row["country"], row["platform"], row["standard_l2"])
        groups.setdefault(key, []).append(row)

    records = []
    for (country, platform, standard_l2), items in groups.items():
        gmv = sum(x.get("gmv", 0.0) for x in items)
        monthly_gmv = sum(x.get("monthly_gmv", 0.0) for x in items)
        prev_monthly_gmv = sum(x.get("prev_monthly_gmv", 0.0) for x in items)
        cn_monthly_gmv = sum(x.get("cn_monthly_gmv", 0.0) for x in items)
        cn_annual_gmv = sum(x.get("cn_annual_gmv", 0.0) for x in items)
        raw_l2_values = sorted({x["raw_l2"] for x in items})
        region = items[0].get("region") or REGION_BY_COUNTRY.get(country, "")
        top_brands = []
        for x in items:
            top_brands.extend(x.get("top_brands", []))

        records.append({
            "record_id": f"{country.lower()}_{platform.lower()}_{standard_l2}",
            "country": country,
            "region": region,
            "platform": platform,
            "period": "2026-04",
            "period_type": "month",
            "currency": "USD",
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
            "top_brands": list(dict.fromkeys(top_brands))[:10],
        })

    return sorted(records, key=lambda x: (x["country"], x["platform"], -x["gmv"]))


def generate_summary(records: list[dict], raw_records: list[dict], canonical_data: dict) -> dict:
    """Generate summary statistics (USD)."""
    total_gmv = sum(x["gmv"] for x in records)
    total_monthly_gmv = sum(x["monthly_gmv"] for x in records)
    cn_monthly_gmv = sum(x["cn_monthly_gmv"] for x in records)

    market_l2_counts: dict[str, int] = {}
    market_gmv: dict[str, float] = {}
    for rec in records:
        key = f"{rec['country']}_{rec['platform']}"
        market_l2_counts[key] = market_l2_counts.get(key, 0) + 1
        market_gmv[key] = market_gmv.get(key, 0.0) + rec["monthly_gmv"]

    from collections import Counter
    fail_breakdown = Counter(
        (x["country"], x["platform"], x.get("read_status"))
        for x in raw_records if x.get("read_status") != "ok"
    )

    return {
        "generated_at": "2026-06-02",
        "scope": "seven-country ecommerce market facts",
        "grain": "country/platform/standard_l2",
        "currency": "USD",
        "fx_to_usd": FX_TO_USD,
        "fx_note": "Amazon MX/JP/BR converted from native currency using 2026-04 reference rates: 1 USD = 17.4433 MXN, 159.344 JPY, 5.0331 BRL. Rates are configurable in scripts/generate_ecommerce_market_facts_v0_2.py.",
        "gold_standard": canonical_data.get("gold_standard", ""),
        "canonical_source_count": canonical_data.get("canonical_count", 0),
        "included_source_count": canonical_data.get("included_count", 0),
        "processed_source_count": len(raw_records),
        "read_ok_count": sum(1 for x in raw_records if x.get("read_status") == "ok"),
        "read_failed_count": sum(1 for x in raw_records if x.get("read_status") != "ok"),
        "standard_l2_record_count": len(records),
        "total_gmv": total_gmv,
        "total_monthly_gmv": total_monthly_gmv,
        "cn_share_weighted": (cn_monthly_gmv / total_monthly_gmv * 100) if total_monthly_gmv else 0.0,
        "market_l2_counts": market_l2_counts,
        "market_monthly_gmv": {k: round(v, 2) for k, v in market_gmv.items()},
        "read_failure_breakdown": {f"{c}_{p}_{s}": n for (c, p, s), n in sorted(fail_breakdown.items())},
    }


def write_json(path: Path, payload) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def main() -> None:
    print("Loading canonical sources...")
    canonical_data = json.loads(CANONICAL_PATH.read_text(encoding="utf-8"))
    sources = [x for x in canonical_data["canonical_sources"] if x.get("include_flag") == "纳入"]

    print(f"Processing {len(sources)} canonical sources...")
    raw_records = []
    for i, item in enumerate(sources, 1):
        if i % 200 == 0:
            print(f"  Processed {i}/{len(sources)}...")
        platform = item["platform"]
        if platform == "Amazon":
            raw_records.append(process_amazon_source(item))
        elif platform == "Shopee":
            raw_records.append(process_shopee_source(item))
        else:
            print(f"  Warning: unknown platform {platform} for {item['canonical_id']}")

    print("Aggregating by country/platform/standard_l2...")
    records = aggregate_by_market_l2(raw_records)
    summary = generate_summary(records, raw_records, canonical_data)

    payload = {
        "summary": summary,
        "records": records,
        "raw_source_records": raw_records,
        "read_failures": [x for x in raw_records if x.get("read_status") != "ok"],
    }

    print(f"Writing curated output: {OUT_CURATED}")
    write_json(OUT_CURATED, payload)
    print(f"Writing portal cache: {OUT_PORTAL}")
    write_json(OUT_PORTAL, payload)

    print("\n=== Summary (USD) ===")
    print(f"standard_l2 records: {len(records)}")
    print(f"raw source records: {len(raw_records)}")
    print(f"read ok / failed: {summary['read_ok_count']} / {summary['read_failed_count']}")
    print(f"total annual GMV:  ${summary['total_gmv']:,.0f}")
    print(f"total monthly GMV: ${summary['total_monthly_gmv']:,.0f}")
    print(f"CN share weighted: {summary['cn_share_weighted']:.1f}%")
    print("\nmonthly GMV by market (USD):")
    for market, gmv in sorted(summary["market_monthly_gmv"].items()):
        n = summary["market_l2_counts"].get(market, 0)
        print(f"  {market:12s} ${gmv:>16,.0f}   ({n} standard_l2)")
    print("\nread failures:")
    for key, n in sorted(summary["read_failure_breakdown"].items()):
        print(f"  {key}: {n}")


if __name__ == "__main__":
    main()
