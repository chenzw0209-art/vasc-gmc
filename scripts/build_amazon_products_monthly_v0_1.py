"""Build Amazon four-country product (SKU-level) facts for the product page.

Scope: US / MX / JP / BR Amazon, raw product workbooks.

Methodology: follows
``Z:\\\\外部数据库\\\\Softtiem亚马逊月度数据\\\\行业底表\\\\Amazon行业底表处理方法论v8.0.md``

Inputs:
- Raw product workbooks under
  ``Z:\\\\外部数据库\\\\Softtiem亚马逊月度数据\\\\行业底表\\\\amazon{country}所有二级类目底表``
  (NOT the ``（已处理）`` siblings). Each workbook has sheet ``产品`` with
  pandas header=3.
- Governed market facts at
  ``data_assets/curated/market/amazon_market_facts_monthly.json`` provide the
  ``raw_l2 → standard_l2`` mapping per country. SKUs whose raw_l2 is missing
  fall back to ``standard_l2 = raw_l2`` with ``mapping_quality = "fallback_raw_l2"``.

Tonight's first-pass cap:
- ``TOP_PER_WORKBOOK = 200`` SKUs per workbook, ranked by
  ``Listing月销额`` (or ``Listing月销额($)`` for US).
- Currency converted to USD using the same FX as the market package.

Outputs:
- ``data_assets/curated/products/amazon_products_monthly.json``  (governed master, all SKUs sampled)
- ``portal/data/products/amazon_products_monthly.json``  (web cache; further trimmed for page perf)

The web payload is cut to ``WEB_TOP_PER_L2 = 40`` SKUs per
(country, standard_l2) bucket so the page stays responsive while still
showing every standard_l2 that has product evidence.

Run::

  & 'C:\\Users\\wale.chen\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\python\\python.exe' \\
    scripts\\build_amazon_products_monthly_v0_1.py
"""

from __future__ import annotations

import io
import json
import os
import re
import sys
import time
import warnings
from collections import Counter, defaultdict
from pathlib import Path
from typing import Optional

import pandas as pd

# ---------- I/O setup ----------
warnings.filterwarnings("ignore")
# Force utf-8 for prints so Chinese class/file names don't crash on Windows GBK.
try:
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")
except Exception:
    pass

PROJECT_ROOT = Path(__file__).resolve().parents[1]
RAW_BASE = Path(r"Z:\外部数据库\Softtiem亚马逊月度数据\行业底表")
COUNTRY_FOLDERS = {
    "US": RAW_BASE / "amazon美国所有二级类目底表",
    # MX/JP/BR deferred to Thu/Fri per user 2026-06-02 evening decision
    # "MX": RAW_BASE / "amazon墨西哥所有二级类目底表",
    # "JP": RAW_BASE / "amazon日本所有二级类目底表",
    # "BR": RAW_BASE / "amazon巴西所有二级类目底表",
}
COUNTRY_NAMES = {"US": "美国", "MX": "墨西哥", "JP": "日本", "BR": "巴西"}
COUNTRY_NATIVE_CCY = {"US": "USD", "MX": "MXN", "JP": "JPY", "BR": "BRL"}
FX_TO_USD = {
    "US": 1.0,
    "MX": 1.0 / 17.4433,
    "JP": 1.0 / 159.344,
    "BR": 1.0 / 5.0331,
}

MARKET_FACTS = PROJECT_ROOT / "data_assets" / "curated" / "market" / "amazon_market_facts_monthly.json"
OUT_CURATED = PROJECT_ROOT / "data_assets" / "curated" / "products" / "amazon_products_monthly.json"
OUT_PORTAL = PROJECT_ROOT / "portal" / "data" / "products" / "amazon_products_monthly.json"

PERIOD = "2026-04"

# Tonight's caps. Adjust without changing methodology.
TOP_PER_WORKBOOK = 200
WEB_TOP_PER_L2 = 40

CJK_RE = re.compile(r"[一-鿿]")
FNAME_RAW_L2_RE = re.compile(r"_不限产品_(?P<raw_l2>.+?)产品看板导出")


def has_cjk(s: str) -> bool:
    return bool(CJK_RE.search(s or ""))


# ---------- helpers ----------
def clean_number(value) -> Optional[float]:
    if value is None:
        return None
    if isinstance(value, (int, float)):
        if pd.isna(value):
            return None
        return float(value)
    text = str(value).strip()
    if not text or text in {"--", "-", "—", "N/A", "NA", "nan"}:
        return None
    text = text.replace(",", "").replace("+", "").replace("%", "").strip()
    if text.startswith("$"):
        text = text[1:]
    try:
        return float(text)
    except ValueError:
        return None


def first_col(columns: list[str], *prefixes: str) -> Optional[str]:
    """Return first column whose stripped name starts with any of the prefixes.

    Used because Sorftime exports differ between countries:
      - US uses ``Listing月销额($)``
      - MX/JP/BR use ``Listing月销额`` (no currency suffix)
    Both should resolve via prefix ``Listing月销额``.
    """
    norm = [(c, str(c).strip()) for c in columns]
    for pref in prefixes:
        for original, name in norm:
            if name == pref:
                return original
        for original, name in norm:
            if name.startswith(pref):
                return original
    return None


def split_path_pairs(path: str) -> list[tuple[str, str]]:
    """Pair (english_line, chinese_line) using CJK detection per v8.0."""
    if not path:
        return []
    lines = [ln.strip() for ln in str(path).split("\n") if ln.strip()]
    pairs: list[tuple[str, str]] = []
    i = 0
    while i < len(lines):
        line = lines[i]
        is_en = not has_cjk(line)
        if is_en and i + 1 < len(lines) and has_cjk(lines[i + 1]):
            pairs.append((line, lines[i + 1]))
            i += 2
        elif is_en:
            pairs.append((line, ""))
            i += 1
        else:
            pairs.append(("", line))
            i += 1
    return pairs


def extract_chinese_l2(path: str) -> str:
    """Best-effort Chinese second-level category extracted from path."""
    pairs = split_path_pairs(path)
    for _, zh in pairs:
        zh_parts = [x.strip() for x in zh.split("->")] if zh else []
        if len(zh_parts) >= 2 and zh_parts[1]:
            return zh_parts[1]
    return ""


def extract_chinese_l3(path: str) -> str:
    pairs = split_path_pairs(path)
    for _, zh in pairs:
        zh_parts = [x.strip() for x in zh.split("->")] if zh else []
        if len(zh_parts) >= 3 and zh_parts[2]:
            return zh_parts[2]
    return ""


def extract_leaf_segment(path: str) -> str:
    """Take the deepest Chinese segment for buying-point / fine sub-category."""
    pairs = split_path_pairs(path)
    for _, zh in pairs:
        zh_parts = [x.strip() for x in zh.split("->")] if zh else []
        if zh_parts:
            return zh_parts[-1]
    return ""


# ---------- raw_l2 to standard_l2 mapping ----------
def load_market_mapping() -> tuple[dict[tuple[str, str], str], dict[tuple[str, str], dict]]:
    """Load (country, raw_l2) -> standard_l2 mapping plus the level-2 fact row.

    The raw_l2 set comes from ``amazon_market_facts_monthly.json``'s
    ``raw_l2_values`` and the per-source list ``raw_source_records``.
    """
    payload = json.loads(MARKET_FACTS.read_text(encoding="utf-8"))
    mapping: dict[tuple[str, str], str] = {}
    fact_index: dict[tuple[str, str], dict] = {}
    for row in payload.get("records", []):
        country = row.get("country")
        std = row.get("standard_l2")
        if not country or not std:
            continue
        fact_index[(country, std)] = row
        for raw_l2 in row.get("raw_l2_values", []) or []:
            if raw_l2:
                mapping[(country, str(raw_l2).strip())] = std
    for raw in payload.get("raw_source_records", []) or []:
        country = raw.get("country")
        raw_l2 = (raw.get("raw_l2") or "").strip()
        std = raw.get("standard_l2")
        if country and raw_l2 and std:
            mapping.setdefault((country, raw_l2), std)
    return mapping, fact_index


# ---------- workbook ingestion ----------
def parse_raw_l2_from_filename(name: str) -> str:
    m = FNAME_RAW_L2_RE.search(name)
    return m.group("raw_l2").strip() if m else name


def read_workbook_top(path: Path, country: str, top_n: int) -> tuple[list[dict], dict]:
    """Read one workbook, return up to top_n SKU dicts + per-file diag."""
    diag: dict = {
        "file": path.name,
        "country": country,
        "raw_l2": parse_raw_l2_from_filename(path.name),
        "rows_total": 0,
        "rows_kept": 0,
        "money_col": None,
        "price_col": None,
        "annual_sales_col": None,
        "monthly_sales_col": None,
        "status": "ok",
        "error": None,
    }
    try:
        df = pd.read_excel(path, sheet_name="产品", header=3, dtype=object)
    except Exception as exc:  # noqa: BLE001
        diag["status"] = "read_failed"
        diag["error"] = str(exc)[:400]
        return [], diag

    diag["rows_total"] = len(df)
    cols = list(df.columns)

    money_col = first_col(cols, "Listing月销额")
    price_col = first_col(cols, "实际价格")
    annual_sales_col = first_col(cols, "Listing年销量")
    monthly_sales_col = first_col(cols, "Listing月销量")
    asin_col = first_col(cols, "ASIN")
    parent_col = first_col(cols, "ParentASIN", "Parent ASIN")
    name_col = first_col(cols, "产品名称")
    brand_col = first_col(cols, "品牌")
    url_col = first_col(cols, "URL")
    cat_col = first_col(cols, "类目路径")
    fulfill_col = first_col(cols, "物流方式", "物流")
    nationality_col = first_col(cols, "国籍/地区", "国籍")
    is_cn_col = first_col(cols, "是否中国品牌")
    growth_col = first_col(cols, "销量变化率")
    rating_col = first_col(cols, "评分")
    review_col = first_col(cols, "评论数")
    flagship_col = first_col(cols, "是否做品牌旗舰店", "品牌旗舰店")
    aplus_col = first_col(cols, "A+")
    ad_idx_col = first_col(cols, "广告花费指数")
    nat_ad_col = first_col(cols, "前3页自然词数")
    paid_ad_col = first_col(cols, "前3页广告词数")
    margin_col = first_col(cols, "毛利率")

    diag["money_col"] = money_col
    diag["price_col"] = price_col
    diag["annual_sales_col"] = annual_sales_col
    diag["monthly_sales_col"] = monthly_sales_col

    if money_col is None or asin_col is None:
        diag["status"] = "schema_missing"
        diag["error"] = f"missing money_col or asin_col (cols={len(cols)})"
        return [], diag

    df["__money"] = df[money_col].map(clean_number)
    df = df[df["__money"].notna() & (df["__money"] > 0)].copy()
    if not len(df):
        diag["status"] = "no_sku_with_sales"
        return [], diag

    df = df.sort_values("__money", ascending=False).head(top_n)

    fx = FX_TO_USD[country]
    raw_l2 = diag["raw_l2"]
    rows: list[dict] = []
    for _, r in df.iterrows():
        money_native = clean_number(r[money_col])
        price_native = clean_number(r[price_col]) if price_col else None
        annual_sales = clean_number(r[annual_sales_col]) if annual_sales_col else None
        monthly_sales = clean_number(r[monthly_sales_col]) if monthly_sales_col else None
        if monthly_sales is None and price_native and money_native:
            monthly_sales = money_native / price_native if price_native > 0 else None
        annual_gmv_native = (
            annual_sales * price_native
            if (annual_sales is not None and price_native is not None)
            else None
        )
        cat_path = str(r[cat_col]).strip() if cat_col else ""
        l2_zh = extract_chinese_l2(cat_path)
        l3_zh = extract_chinese_l3(cat_path)
        leaf_zh = extract_leaf_segment(cat_path)
        is_cn_raw = str(r[is_cn_col]).strip() if is_cn_col and pd.notna(r[is_cn_col]) else ""
        nationality_raw = (
            str(r[nationality_col]).strip()
            if nationality_col and pd.notna(r[nationality_col])
            else ""
        )
        is_cn_brand = is_cn_raw == "是" or nationality_raw in {"中国", "中国香港", "中国台湾", "中国澳门"}
        nationality_resolved = "中国" if is_cn_brand else (nationality_raw or "")

        rows.append(
            {
                "asin": str(r[asin_col]).strip() if pd.notna(r[asin_col]) else "",
                "parent_asin": str(r[parent_col]).strip() if parent_col and pd.notna(r[parent_col]) else "",
                "product_name": str(r[name_col]).strip() if name_col and pd.notna(r[name_col]) else "",
                "brand": str(r[brand_col]).strip() if brand_col and pd.notna(r[brand_col]) else "",
                "product_url": str(r[url_col]).strip() if url_col and pd.notna(r[url_col]) else "",
                "category_path": cat_path,
                "raw_l2": raw_l2,
                "category_l2_chinese": l2_zh,
                "category_l3_chinese": l3_zh,
                "leaf_segment": leaf_zh,
                "fulfillment": str(r[fulfill_col]).strip() if fulfill_col and pd.notna(r[fulfill_col]) else "",
                "is_chinese_brand": is_cn_brand,
                "nationality": nationality_resolved,
                "raw_nationality": nationality_raw,
                "listing_monthly_sales": monthly_sales,
                "listing_annual_sales": annual_sales,
                "native_currency": COUNTRY_NATIVE_CCY[country],
                "native_monthly_gmv": money_native,
                "native_annual_gmv": annual_gmv_native,
                "native_price": price_native,
                "monthly_gmv_usd": money_native * fx if money_native is not None else None,
                "annual_gmv_usd": annual_gmv_native * fx if annual_gmv_native is not None else None,
                "price_usd": price_native * fx if price_native is not None else None,
                "growth_rate": clean_number(r[growth_col]) if growth_col else None,
                "rating": clean_number(r[rating_col]) if rating_col else None,
                "review_count": clean_number(r[review_col]) if review_col else None,
                "has_flagship_store": (
                    str(r[flagship_col]).strip() == "是" if flagship_col and pd.notna(r[flagship_col]) else None
                ),
                "has_a_plus": (
                    str(r[aplus_col]).strip() == "是" if aplus_col and pd.notna(r[aplus_col]) else None
                ),
                "ad_spend_index": clean_number(r[ad_idx_col]) if ad_idx_col else None,
                "natural_top3_keywords": clean_number(r[nat_ad_col]) if nat_ad_col else None,
                "paid_top3_keywords": clean_number(r[paid_ad_col]) if paid_ad_col else None,
                "gross_margin": clean_number(r[margin_col]) if margin_col else None,
            }
        )

    diag["rows_kept"] = len(rows)
    return rows, diag


# ---------- aggregation / output ----------
def attach_market_mapping(
    rows: list[dict], country: str, mapping: dict[tuple[str, str], str]
) -> None:
    """Mutate each row with ``standard_l2`` + ``mapping_quality``.

    Per-SKU lookup chain (a single workbook may straddle multiple standard_l2):
      1. (country, path_chinese_l2)          → matched_market_facts_path_l2
      2. (country, filename_raw_l2)          → matched_market_facts_filename
      3. path_chinese_l2 itself if non-empty → fallback_path_l2
      4. filename_raw_l2                     → fallback_raw_l2
    """
    for row in rows:
        path_l2 = row.get("category_l2_chinese") or ""
        file_raw = row.get("raw_l2") or ""
        std = ""
        quality = ""
        if path_l2 and (m := mapping.get((country, path_l2))):
            std = m
            quality = "matched_market_facts_path_l2"
        elif file_raw and (m := mapping.get((country, file_raw))):
            std = m
            quality = "matched_market_facts_filename"
        elif path_l2:
            std = path_l2
            quality = "fallback_path_l2"
        else:
            std = file_raw
            quality = "fallback_raw_l2"
        row["standard_l2"] = std
        row["mapping_quality"] = quality


def build_summary(records: list[dict], diags: list[dict]) -> dict:
    by_country = Counter(r["country"] for r in records)
    by_market_l2 = Counter((r["country"], r["standard_l2"]) for r in records)
    monthly_gmv_by_country = defaultdict(float)
    cn_monthly_gmv_by_country = defaultdict(float)
    for r in records:
        c = r["country"]
        m = r.get("monthly_gmv_usd") or 0.0
        monthly_gmv_by_country[c] += m
        if r.get("is_chinese_brand"):
            cn_monthly_gmv_by_country[c] += m

    read_ok = sum(1 for d in diags if d["status"] == "ok")
    read_failed = sum(1 for d in diags if d["status"] != "ok")

    return {
        "generated_at": time.strftime("%Y-%m-%d"),
        "scope": "Amazon four-country SKU-level product facts (first-pass top-200 per workbook)",
        "methodology": str(RAW_BASE / "Amazon行业底表处理方法论v8.0.md"),
        "raw_source_root": str(RAW_BASE),
        "country_scope": list(COUNTRY_FOLDERS.keys()),
        "period": PERIOD,
        "currency": "USD",
        "fx_to_usd": FX_TO_USD,
        "fx_note": (
            "USD conversion uses 2026-04 reference rates: "
            "1 USD = 17.4433 MXN, 159.344 JPY, 5.0331 BRL."
        ),
        "first_pass_caps": {
            "top_per_workbook": TOP_PER_WORKBOOK,
            "rank_field": "Listing月销额(_$_)",
            "web_top_per_l2": WEB_TOP_PER_L2,
        },
        "limitations": [
            "Annual GMV uses Listing年销量 × 实际价格 from the Sorftime product sheet; the 销量趋势 sheet is not parsed in this pass.",
            "Tonight's curated layer caps each raw workbook at top 200 SKUs by monthly GMV; long-tail SKUs are excluded until a paginated index is built.",
            "Mapping uses the existing market facts raw_l2 → standard_l2 dictionary; unresolved raw_l2 fall back to the path-derived Chinese L2 with mapping_quality = 'fallback_path_l2', or to raw_l2 with 'fallback_raw_l2'.",
        ],
        "totals": {
            "sku_records": len(records),
            "raw_workbooks_scanned": len(diags),
            "read_ok": read_ok,
            "read_failed": read_failed,
        },
        "sku_count_by_country": dict(sorted(by_country.items())),
        "monthly_gmv_by_country_usd": {k: round(v, 2) for k, v in sorted(monthly_gmv_by_country.items())},
        "cn_monthly_gmv_by_country_usd": {k: round(v, 2) for k, v in sorted(cn_monthly_gmv_by_country.items())},
        "standard_l2_count_by_country": {
            country: len({l2 for (c, l2) in by_market_l2 if c == country}) for country in COUNTRY_FOLDERS
        },
    }


def make_record_id(row: dict, idx: int) -> str:
    return f"{row['country'].lower()}_amazon_{row.get('asin') or idx:>06}_{idx:06d}"


def write_payload(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def trim_for_web(records: list[dict], top_per_l2: int) -> list[dict]:
    buckets: dict[tuple[str, str], list[dict]] = defaultdict(list)
    for r in records:
        buckets[(r["country"], r["standard_l2"])].append(r)
    web: list[dict] = []
    for key, rows in buckets.items():
        rows.sort(key=lambda x: (x.get("monthly_gmv_usd") or 0.0), reverse=True)
        web.extend(rows[:top_per_l2])
    web.sort(key=lambda x: (x["country"], -(x.get("monthly_gmv_usd") or 0.0)))
    return web


def main() -> None:
    print("== build_amazon_products_monthly_v0_1 ==")
    print(f"raw_source_root: {RAW_BASE}")
    print(f"top_per_workbook: {TOP_PER_WORKBOOK}; web_top_per_l2: {WEB_TOP_PER_L2}")

    mapping, _facts = load_market_mapping()
    print(f"market mapping pairs: {len(mapping)}")

    all_records: list[dict] = []
    diags: list[dict] = []
    started = time.time()

    for country, folder in COUNTRY_FOLDERS.items():
        if not folder.exists():
            print(f"[skip] missing folder for {country}: {folder}")
            continue
        files = sorted(folder.glob("*.xlsx"))
        print(f"[{country}] scanning {len(files)} workbooks under {folder}")
        for idx, f in enumerate(files, 1):
            rows, diag = read_workbook_top(f, country, TOP_PER_WORKBOOK)
            diag["country"] = country
            diags.append(diag)
            if rows:
                attach_market_mapping(rows, country, mapping)
                for r in rows:
                    r["country"] = country
                    r["country_name"] = COUNTRY_NAMES[country]
                    r["platform"] = "Amazon"
                    r["period"] = PERIOD
                    r["source_file"] = f.name
                all_records.extend(rows)
            if idx % 25 == 0 or idx == len(files):
                elapsed = time.time() - started
                print(
                    f"  [{country}] {idx}/{len(files)} workbooks done, "
                    f"records={len(all_records)}, elapsed={elapsed:,.1f}s"
                )

    # Stable record ids
    for i, r in enumerate(all_records, 1):
        r["product_id"] = make_record_id(r, i)

    # Sort: country then descending monthly GMV
    all_records.sort(key=lambda x: (x["country"], -(x.get("monthly_gmv_usd") or 0.0)))
    summary = build_summary(all_records, diags)

    curated_payload = {
        "summary": summary,
        "records": all_records,
        "read_diagnostics": diags,
    }
    write_payload(OUT_CURATED, curated_payload)

    web_records = trim_for_web(all_records, WEB_TOP_PER_L2)
    portal_summary = dict(summary)
    portal_summary["web_record_count"] = len(web_records)
    portal_summary["web_top_per_l2"] = WEB_TOP_PER_L2
    write_payload(
        OUT_PORTAL,
        {
            "summary": portal_summary,
            "records": web_records,
            "read_diagnostics": [d for d in diags if d["status"] != "ok"],
        },
    )

    print()
    print(f"sku_records: {len(all_records)}")
    print(f"web_records: {len(web_records)}")
    print(f"read_ok / read_failed: {summary['totals']['read_ok']} / {summary['totals']['read_failed']}")
    print(f"monthly_gmv_by_country: {summary['monthly_gmv_by_country_usd']}")
    print(f"curated_out: {OUT_CURATED}")
    print(f"portal_out:  {OUT_PORTAL}")


if __name__ == "__main__":
    main()
