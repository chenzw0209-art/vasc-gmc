"""Validate the Amazon-only market package and page data invariants."""

from __future__ import annotations

import json
import re
from collections import defaultdict
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
CURATED_FACTS = PROJECT_ROOT / "data_assets" / "curated" / "market" / "amazon_market_facts_monthly.json"
CURATED_STORY = PROJECT_ROOT / "data_assets" / "curated" / "market" / "amazon_market_story_v0_1.json"
PORTAL_FACTS = PROJECT_ROOT / "portal" / "data" / "market" / "amazon_market_facts_monthly.json"
PORTAL_STORY = PROJECT_ROOT / "portal" / "data" / "market" / "amazon_market_story_v0_1.json"
PORTAL_RESEARCH = PROJECT_ROOT / "portal" / "data" / "research" / "market_research_enrichment.json"


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def assert_same(left: dict, right: dict, label: str) -> None:
    if left != right:
        raise AssertionError(f"{label} differs between curated asset and portal cache")


def norm_text(value: str | None) -> str:
    return re.sub(r"[和与及、/\\|｜,，;；:：()（）\[\]【】\-\s_]+", "", str(value or "").lower())


def useful_match_term(value: str) -> bool:
    return len(value) >= 3 and value not in {"配件", "用品", "产品", "其他", "综合", "设备", "工具", "套装", "组件"}


def main() -> None:
    curated_facts = load_json(CURATED_FACTS)
    curated_story = load_json(CURATED_STORY)
    portal_facts = load_json(PORTAL_FACTS)
    portal_story = load_json(PORTAL_STORY)
    portal_research = load_json(PORTAL_RESEARCH)

    assert_same(curated_facts, portal_facts, "facts")
    assert_same(curated_story, portal_story, "story")

    summary = curated_facts["summary"]
    records = curated_facts["records"]
    raw_records = curated_facts["raw_source_records"]

    if summary["currency"] != "USD":
        raise AssertionError("summary.currency must be USD")
    if summary["period"] != "2026-04":
        raise AssertionError("summary.period must be 2026-04")
    if summary["read_failed_count"] != 0:
        raise AssertionError("Amazon active sprint should have zero read failures")
    if len(records) != summary["standard_l2_record_count"]:
        raise AssertionError("record count does not match summary.standard_l2_record_count")
    if len(raw_records) != summary["raw_source_count"]:
        raise AssertionError("raw record count does not match summary.raw_source_count")

    countries = sorted({x["country"] for x in records})
    if countries != ["BR", "JP", "MX", "US"]:
        raise AssertionError(f"unexpected country scope: {countries}")
    if {x["platform"] for x in records} != {"Amazon"}:
        raise AssertionError("active sprint should contain Amazon records only")

    grouped = defaultdict(list)
    for row in records:
        grouped[row["standard_l2"]].append(row)
    display_rows = len(grouped)
    if display_rows < 40:
        raise AssertionError(f"display standard_l2 row count looks too small: {display_rows}")

    research_records = [
        x for x in portal_research.get("records", []) if x.get("platform") == "Amazon"
    ]
    matched_l2 = 0
    for standard_l2, rows in grouped.items():
        countries = {x["country"] for x in rows}
        raw_terms = []
        for row in rows:
            raw_terms.extend(row.get("raw_l2_values") or [])
        targets = [
            norm_text(x)
            for x in [standard_l2, *raw_terms]
            if useful_match_term(norm_text(x))
        ]
        has_match = False
        for research in research_records:
            if research.get("country") not in countries:
                continue
            category = norm_text(research.get("research_category"))
            segments = norm_text(research.get("major_segments"))
            if any(
                category == target
                or category in target
                or target in category
                or target in segments
                for target in targets
            ):
                has_match = True
                break
        if has_match:
            matched_l2 += 1
    if matched_l2 < 20:
        raise AssertionError(f"research enrichment coverage looks too low: {matched_l2}/{display_rows}")

    total_monthly = sum(float(x.get("monthly_gmv", 0.0)) for x in records)
    total_annual = sum(float(x.get("gmv", 0.0)) for x in records)
    if abs(total_monthly - summary["total_monthly_gmv"]) > 1:
        raise AssertionError("monthly GMV sum does not match summary")
    if abs(total_annual - summary["total_gmv"]) > 1:
        raise AssertionError("annual GMV sum does not match summary")

    print("amazon_market_package_ok")
    print(f"fact_records: {len(records)}")
    print(f"display_standard_l2_rows: {display_rows}")
    print(f"research_matched_l2_rows: {matched_l2}")
    print(f"raw_sources: {len(raw_records)}")
    print(f"read_ok/read_failed: {summary['read_ok_count']}/{summary['read_failed_count']}")
    print(f"monthly_gmv: {summary['total_monthly_gmv']:,.2f}")
    print(f"annual_gmv: {summary['total_gmv']:,.2f}")


if __name__ == "__main__":
    main()
