from __future__ import annotations

from pathlib import Path

import pandas as pd


SAMPLE = Path(r"Z:\外部数据库\Softtiem亚马逊月度数据\行业底表\amazon美国所有二级类目底表\20260513_不限产品_Wearable Technology产品看板导出.xlsx")


def main() -> None:
    for sheet in ["产品", "子体", "销量趋势", "销售额趋势"]:
        print("\nSHEET", sheet)
        df = pd.read_excel(SAMPLE, sheet_name=sheet, header=None, nrows=18)
        for idx, row in df.iterrows():
            vals = [str(x) for x in row.tolist()[:18] if str(x) != "nan"]
            print(idx, vals)


if __name__ == "__main__":
    main()
