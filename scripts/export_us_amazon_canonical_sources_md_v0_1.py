"""Export US Amazon canonical source list to an operator-friendly Markdown table."""

from __future__ import annotations

import json
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
CANONICAL_JSON = PROJECT_ROOT / "portal" / "data" / "sources" / "us_amazon_canonical_sources.json"
OUTPUT_MD = PROJECT_ROOT / "docs" / "us_amazon_canonical_sources.md"


def md_escape(value) -> str:
    text = str(value or "").replace("\n", " ").replace("|", "\\|")
    return text


def main() -> None:
    data = json.loads(CANONICAL_JSON.read_text(encoding="utf-8"))
    lines = [
        "# US Amazon Canonical Sources",
        "",
        "Gold standard: `Z:\\主线任务2-天眼计划\\信息可视化\\类目匹配表_0602.xlsx`",
        "",
        "Use this document to know where to refresh each category next time.",
        "",
        f"- Canonical sources: {data['canonical_count']}",
        f"- Duplicate discarded sources: {data['duplicate_discarded_count']}",
        f"- Unmapped assets: {data['unmapped_count']}",
        "",
        "## Canonical Refresh Table",
        "",
        "| Standard L1 | Standard L2 | Amazon Raw L1 | Amazon Raw L2 | Current Bottom Table | Recommended Output Folder | Candidate Count |",
        "|---|---|---|---|---|---|---|",
    ]

    for item in data["canonical_sources"]:
        refresh = item["data_refresh_instruction"]
        lines.append(
            "| "
            + " | ".join(
                [
                    md_escape(item["standard_l1"]),
                    md_escape(item["standard_l2"]),
                    md_escape(refresh["raw_l1_to_export"]),
                    md_escape(refresh["raw_l2_to_export"]),
                    md_escape(refresh["current_canonical_bottom_table"]),
                    md_escape(refresh["recommended_output_folder"]),
                    md_escape(item["candidate_count"]),
                ]
            )
            + " |"
        )

    lines.extend(
        [
            "",
            "## Duplicate Discarded Sources",
            "",
            "| Standard L2 | Raw L2 | Discarded Path | Canonical Path | Reason |",
            "|---|---|---|---|---|",
        ]
    )
    for item in data["duplicate_sources"]:
        lines.append(
            "| "
            + " | ".join(
                [
                    md_escape(item["standard_l2"]),
                    md_escape(item["raw_l2"]),
                    md_escape(item["discarded_path"]),
                    md_escape(item["canonical_path"]),
                    md_escape(item["reason"]),
                ]
            )
            + " |"
        )

    lines.extend(
        [
            "",
            "## Unmapped Assets",
            "",
            "| Report Area | Category Name | Path |",
            "|---|---|---|",
        ]
    )
    for item in data["unmapped_assets"]:
        lines.append(
            "| "
            + " | ".join(
                [
                    md_escape(item.get("report_area", "")),
                    md_escape(item.get("category_name", "")),
                    md_escape(item.get("path", "")),
                ]
            )
            + " |"
        )

    OUTPUT_MD.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"output: {OUTPUT_MD}")


if __name__ == "__main__":
    main()

