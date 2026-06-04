"""Inspect Amazon product source folders and sample workbook schemas."""

from __future__ import annotations

import json
from pathlib import Path

import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parents[1]
BASE = Path(r"Z:\外部数据库\Softtiem亚马逊月度数据\行业底表")
FOLDERS = {
    "US_raw_product": BASE / "amazon美国所有二级类目底表",
    "US_processed": BASE / "amazon美国所有二级类目底表（已处理）",
    "MX_raw_product": BASE / "amazon墨西哥所有二级类目底表",
    "MX_processed": BASE / "amazon墨西哥所有二级类目底表（已处理）",
    "JP_raw_product": BASE / "amazon日本所有二级类目底表",
    "JP_processed": BASE / "amazon日本所有二级类目底表（已处理）",
    "BR_raw_product": BASE / "amazon巴西所有二级类目底表",
    "BR_processed": BASE / "amazon巴西所有二级类目底表（已处理）",
}
OUT = PROJECT_ROOT / "data_assets" / "audit" / "amazon_product_source_inventory.json"


def workbook_meta(path: Path) -> dict:
    meta = {"path": str(path), "sheets": [], "error": None}
    try:
        xl = pd.ExcelFile(path)
        for sheet in xl.sheet_names[:5]:
            try:
                df = pd.read_excel(path, sheet_name=sheet, nrows=5)
                meta["sheets"].append(
                    {
                        "sheet": sheet,
                        "columns": [str(c) for c in df.columns[:80]],
                        "sample": df.head(2).astype(str).to_dict("records"),
                    }
                )
            except Exception as exc:
                meta["sheets"].append({"sheet": sheet, "error": str(exc)[:300]})
    except Exception as exc:
        meta["error"] = str(exc)[:300]
    return meta


def main() -> None:
    payload = {"generated_at": "2026-06-02", "folders": {}}
    for key, folder in FOLDERS.items():
        files = sorted(folder.glob("*.xlsx")) if folder.exists() else []
        sample_files = files[:2]
        if "Wearable" in key:
            sample_files = []
        wearable = [x for x in files if "Wearable" in x.name or "穿戴" in x.name]
        if wearable:
            sample_files = wearable[:1] + sample_files[:1]
        payload["folders"][key] = {
            "path": str(folder),
            "exists": folder.exists(),
            "file_count": len(files),
            "first_files": [
                {"name": x.name, "size_bytes": x.stat().st_size, "last_modified": x.stat().st_mtime}
                for x in files[:20]
            ],
            "sample_workbooks": [workbook_meta(x) for x in sample_files],
        }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"outputs: {OUT}")
    for key, data in payload["folders"].items():
        print(f"{key}: exists={data['exists']} files={data['file_count']}")


if __name__ == "__main__":
    main()
