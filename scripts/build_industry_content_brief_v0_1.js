const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
}

function write(file, text) {
  const full = path.join(root, file);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, text, "utf8");
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function money(n) {
  n = Number(n || 0);
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function pct(n) {
  return `${Number(n || 0).toFixed(1)}%`;
}

function uniq(items) {
  return [...new Set(items.filter(Boolean))];
}

function normL1(x) {
  return x === "Consumer Electronics" ? "Consumer Tech" : x || "未命名";
}

function normL2(l1, l2) {
  const n1 = normL1(l1);
  if (n1 === "Beauty") {
    if (["护肤与个护", "个人护理", "皮肤护理"].includes(l2)) return "护肤与个人护理";
    if (l2 === "美妆个护综合") return "口腔护理";
    if (l2 === "剃须和脱毛") return "脱毛与剃须";
    if (l2 === "头发护理") return "头发护理/造型";
    if (l2 === "足部、手部和指甲护理") return "美甲/手足护理";
    if (["彩妆", "香水"].includes(l2)) return "彩妆/香水";
  }
  if (n1 === "Consumer Tech") {
    if (l2 === "电子部件") return "电子配件/元器件";
    if (l2 === "微胶囊") return "游戏外设/电脑周边";
    if (l2 === "消费电子综合") return "待拆消费电子";
  }
  return l2 || "未命名";
}

function classifyLegacyConsumerTech(mainL3) {
  const s = String(mainL3 || "");
  if (/打印|扫描|计算器|办公|POS|销售点/.test(s)) return "办公打印/商用电子";
  if (/电子书|Kindle|阅读/.test(s)) return "电子阅读器";
  if (/电视|投影|影院|视频/.test(s)) return "电视/投影/视听娱乐";
  if (/安全|监控|摄像|门铃|家庭安全/.test(s)) return "智能安防/监控";
  if (/DJ|卡拉|舞台|音响|扬声器|麦克风/.test(s)) return "音频/DJ/K歌";
  return "其他消费电子";
}

function normalizePlayers(players) {
  return players.map((x) => ({
    ...x,
    normalized_l1: normL1(x.standard_l1),
    normalized_l2: normL2(x.standard_l1, x.standard_l2),
  }));
}

function expandLegacyMarket(rows, players) {
  const normalized = rows.map((x) => ({
    ...x,
    normalized_l1: normL1(x.standard_l1),
    normalized_l2: normL2(x.standard_l1, x.standard_l2),
  }));
  const legacyPlayers = players.filter((x) => x.normalized_l2 === "待拆消费电子");
  const weights = {};
  for (const p of legacyPlayers) {
    const k = classifyLegacyConsumerTech(p.main_l3 || p.product_focus || p.brand);
    weights[k] = (weights[k] || 0) + Number(p.estimated_gmv || 0);
  }
  const total = Object.values(weights).reduce((s, v) => s + v, 0) || 1;
  const out = [];
  for (const r of normalized) {
    if (r.normalized_l2 !== "待拆消费电子") {
      out.push(r);
      continue;
    }
    for (const [k, w] of Object.entries(weights)) {
      if (k === "其他消费电子") continue;
      const share = w / total;
      const nr = {
        ...r,
        normalized_l2: k,
        monthly_gmv: Number(r.monthly_gmv || 0) * share,
        gmv: Number(r.gmv || 0) * share,
        prev_monthly_gmv: Number(r.prev_monthly_gmv || 0) * share,
        cn_monthly_gmv: Number(r.cn_monthly_gmv || 0) * share,
        top_brands: legacyPlayers
          .filter((p) => classifyLegacyConsumerTech(p.main_l3) === k)
          .sort((a, b) => Number(b.estimated_gmv || 0) - Number(a.estimated_gmv || 0))
          .slice(0, 8)
          .map((p) => p.brand),
        raw_l2_values: [...(r.raw_l2_values || []), "由消费电子综合按玩家主类目拆分"],
        monthly_trend: {},
      };
      for (const [m, v] of Object.entries(r.monthly_trend || {})) {
        nr.monthly_trend[m] = Number(v || 0) * share;
      }
      out.push(nr);
    }
  }
  return out;
}

function groupMarket(rows) {
  const map = new Map();
  for (const r of rows) {
    const key = `${r.normalized_l1}|${r.normalized_l2}`;
    if (!map.has(key)) {
      map.set(key, {
        normalized_l1: r.normalized_l1,
        normalized_l2: r.normalized_l2,
        monthly_gmv: 0,
        gmv: 0,
        prev_monthly_gmv: 0,
        cn_monthly_gmv: 0,
        brands: [],
        raw_l2: [],
        source_files: [],
        monthly_trend: {},
      });
    }
    const g = map.get(key);
    g.monthly_gmv += Number(r.monthly_gmv || 0);
    g.gmv += Number(r.gmv || 0);
    g.prev_monthly_gmv += Number(r.prev_monthly_gmv || 0);
    g.cn_monthly_gmv += Number(r.cn_monthly_gmv || 0);
    g.brands.push(...(r.top_brands || []));
    g.raw_l2.push(...(r.raw_l2_values || [r.standard_l2]));
    if (r.source_file) g.source_files.push(r.source_file);
    for (const [m, v] of Object.entries(r.monthly_trend || {})) {
      g.monthly_trend[m] = (g.monthly_trend[m] || 0) + Number(v || 0);
    }
  }
  return [...map.values()].map((x) => {
    const growth = x.prev_monthly_gmv ? ((x.monthly_gmv - x.prev_monthly_gmv) / x.prev_monthly_gmv) * 100 : 0;
    const cnShare = x.monthly_gmv ? (x.cn_monthly_gmv / x.monthly_gmv) * 100 : 0;
    const trend = Object.entries(x.monthly_trend).sort();
    const last6 = trend.slice(-6).map(([m, v]) => `${m}:${money(v)}`).join(" / ");
    return {
      ...x,
      growth_rate: growth,
      cn_share: cnShare,
      brands: uniq(x.brands).slice(0, 12),
      raw_l2: uniq(x.raw_l2),
      source_files: uniq(x.source_files).slice(0, 5),
      last6,
    };
  }).sort((a, b) => {
    if (a.normalized_l1 !== b.normalized_l1) return a.normalized_l1.localeCompare(b.normalized_l1);
    return b.monthly_gmv - a.monthly_gmv;
  });
}

function rowLine(r) {
  return [
    `| ${r.normalized_l2}`,
    money(r.gmv),
    money(r.monthly_gmv),
    pct(r.growth_rate),
    pct(r.cn_share),
    r.brands.slice(0, 6).join("、") || "-",
    r.raw_l2.slice(0, 8).join(" / ") || "-",
    r.last6 || "-",
    "|",
  ].join(" | ");
}

function main() {
  const market = readJson("portal/data/market/amazon_market_facts_monthly.json").records || [];
  const playersRaw = readJson("portal/data/players/amazon_players_monthly.json").records || [];
  const players = normalizePlayers(playersRaw);
  const rows = groupMarket(expandLegacyMarket(market, players));
  const byL1 = new Map();
  for (const r of rows) {
    if (!byL1.has(r.normalized_l1)) byL1.set(r.normalized_l1, []);
    byL1.get(r.normalized_l1).push(r);
  }

  const lines = [];
  lines.push("# Amazon US 一级/二级行业内容生成交接文档");
  lines.push("");
  lines.push("生成日期：2026-06-03");
  lines.push("");
  lines.push("## 使用说明");
  lines.push("");
  lines.push("这个文档给下一个 AI 或研究员使用，用来逐条生成市场页里的行业内容，不再处理页面 UI。");
  lines.push("");
  lines.push("内容目标：每个一级行业、每个二级行业都要回答“为什么做行业”，坚持实证、对比、抓大放小。不要写泛泛的 BD 建议；BD 动作放到线索/玩家页。");
  lines.push("");
  lines.push("输出格式建议：");
  lines.push("");
  lines.push("1. 一级行业：输出 4 条大盘洞察，每条包含「论点」「证据」「解释」。证据可以来自 PR 稿、展会/新品/监管/母行业趋势、历史报告、Amazon 数据。");
  lines.push("2. 二级行业：输出 3 条增长信号，每条包含「现象」「原因假设」「需要补证的外部事实」。");
  lines.push("3. 语气：精准、有信息量、不浮夸。不写“机会巨大”这类空话。");
  lines.push("4. 对 Consumer Tech：不要再使用“消费电子综合”这个概念。");
  lines.push("");
  lines.push("## 数据口径");
  lines.push("");
  lines.push("- 平台：Amazon");
  lines.push("- 国家：美国站 / US");
  lines.push("- 数据来源：处理后的 Amazon US 行业底表与玩家底表。");
  lines.push("- 时间：当前底表 period 为 2026-04，趋势字段通常覆盖 2024-05 至 2026-04。");
  lines.push("- 注意：`消费电子综合` 当前在市场底表里仍是聚合口径；本文档按玩家主类目权重临时拆为 `办公打印/商用电子`、`电子阅读器`、`电视/投影/视听娱乐`、`智能安防/监控`、`音频/DJ/K歌`。后续最好回 raw_l2/ASIN 层重算。");
  lines.push("");
  lines.push("## 内容生成 Prompt 模板");
  lines.push("");
  lines.push("```text");
  lines.push("你是行业研究员。请基于下面的 Amazon US 数据，为【{一级行业}】生成市场页内容。");
  lines.push("要求：");
  lines.push("1. 先给一级行业 4 条大盘洞察，每条包含论点、证据、解释。");
  lines.push("2. 再逐个二级行业给 3 条增长信号，每条包含现象、原因假设、需要补证的外部事实。");
  lines.push("3. 不要写 BD 指引，不要泛泛而谈，不要只复述 GMV/MoM。");
  lines.push("4. 要解释涨跌背后的原因：新品节奏、展会、监管、季节、渠道、内容平台、母行业需求、品牌格局变化等。");
  lines.push("5. 如果证据不足，明确写“待补证”，不要编。");
  lines.push("```");
  lines.push("");

  for (const [l1, items] of [...byL1.entries()].sort()) {
    const totalMonthly = items.reduce((s, x) => s + x.monthly_gmv, 0);
    const totalAnnual = items.reduce((s, x) => s + x.gmv, 0);
    const prev = items.reduce((s, x) => s + x.prev_monthly_gmv, 0);
    const cn = items.reduce((s, x) => s + x.cn_monthly_gmv, 0);
    const growth = prev ? ((totalMonthly - prev) / prev) * 100 : 0;
    const cnShare = totalMonthly ? (cn / totalMonthly) * 100 : 0;
    lines.push(`## ${l1}`);
    lines.push("");
    lines.push(`一级行业数据摘要：年化 GMV ${money(totalAnnual)}，月 GMV ${money(totalMonthly)}，MoM ${pct(growth)}，CN GMV 占比 ${pct(cnShare)}，二级行业数 ${items.length}。`);
    lines.push("");
    lines.push("### 一级行业待生成内容");
    lines.push("");
    lines.push("- 洞察 1：");
    lines.push("- 洞察 2：");
    lines.push("- 洞察 3：");
    lines.push("- 洞察 4：");
    lines.push("");
    lines.push("### 二级行业数据表");
    lines.push("");
    lines.push("| 二级行业 | 年化GMV | 月GMV | MoM | CN占比 | 代表品牌 | 原始/拆分口径 | 近6个月趋势 |");
    lines.push("|---|---:|---:|---:|---:|---|---|---|");
    for (const r of items) lines.push(rowLine(r));
    lines.push("");
    lines.push("### 二级行业逐条内容模板");
    lines.push("");
    for (const r of items) {
      lines.push(`#### ${r.normalized_l2}`);
      lines.push("");
      lines.push(`- 数据锚点：年化 GMV ${money(r.gmv)}；月 GMV ${money(r.monthly_gmv)}；MoM ${pct(r.growth_rate)}；CN 占比 ${pct(r.cn_share)}。`);
      lines.push(`- 代表品牌：${r.brands.slice(0, 8).join("、") || "-"}。`);
      lines.push(`- 原始/拆分口径：${r.raw_l2.join(" / ") || "-"}。`);
      lines.push("- 增长信号 1：");
      lines.push("- 增长信号 2：");
      lines.push("- 增长信号 3：");
      lines.push("- 需要外部补证：");
      lines.push("");
    }
  }

  lines.push("## 已知可用外部事实线索");
  lines.push("");
  lines.push("- Consumer Tech / 电源储能：portable power station、backup power、camping/RV、Anker Solix、Jackery、EcoFlow。");
  lines.push("- Consumer Tech / 影像无人机：NAB 2026、DJI creator tools、Osmo、RS、GoPro 新品。");
  lines.push("- Consumer Tech / 智能安防：local AI、no monthly fees、eufy、Reolink、aosu、多摄协同。");
  lines.push("- Consumer Tech / 智能穿戴：RingConn、OURA、Samsung、Amazfit、智能戒指、睡眠监测、无订阅费。");
  lines.push("- Beauty：medicube/ANUA 内容回流 Amazon、Ulike IPL、Laifen/TYMO/Wavytalk 造型工具、Oclean/Soocas/COSLUS 口腔护理、beetles/modelones 美甲。");
  lines.push("");

  const markdown = lines.join("\n");
  write("docs/industry_content_brief_for_next_ai_2026_06_03.md", markdown);
  const html = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Amazon US 行业内容生成交接文档</title>
  <style>
    body{margin:0;background:#f7f9fc;color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Microsoft YaHei",Arial,sans-serif}
    header{position:sticky;top:0;background:#fff;border-bottom:1px solid #dbe3ef;padding:18px 28px;z-index:2}
    h1{font-size:22px;margin:0 0 6px}
    .meta{font-size:13px;color:#64748b}
    main{max-width:1180px;margin:0 auto;padding:24px}
    .note{background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:14px 16px;margin-bottom:16px;line-height:1.7}
    pre{white-space:pre-wrap;word-break:break-word;background:#fff;border:1px solid #dbe3ef;border-radius:12px;padding:22px;line-height:1.65;font-size:13px;box-shadow:0 8px 24px rgba(15,23,42,.04)}
    .hint{font-size:12px;color:#64748b;margin-top:12px}
  </style>
</head>
<body>
  <header>
    <h1>Amazon US 一级/二级行业内容生成交接文档</h1>
    <div class="meta">自包含 HTML，可直接上传给另一个对话 AI。生成日期：2026-06-03</div>
  </header>
  <main>
    <section class="note">
      <strong>给下一个 AI 的任务：</strong>基于本文档的数据表和模板，为每个一级行业生成 4 条大盘洞察，并为每个二级行业生成 3 条增长信号。要求实证、对比、抓大放小，不写空泛 BD 建议。
    </section>
    <pre>${escapeHtml(markdown)}</pre>
    <div class="hint">文件由 scripts/build_industry_content_brief_v0_1.js 生成；页面不依赖本地服务或外部资源。</div>
  </main>
</body>
</html>`;
  write("docs/industry_content_brief_for_next_ai_2026_06_03.html", html);
  console.log("wrote docs/industry_content_brief_for_next_ai_2026_06_03.md");
  console.log("wrote docs/industry_content_brief_for_next_ai_2026_06_03.html");
}

main();
