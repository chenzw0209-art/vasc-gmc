const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const out = path.join(root, "docs", "market_module_preview_consumer_tech_2026_06_03.html");

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
}
function esc(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
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
function uniq(a) {
  return [...new Set(a.filter(Boolean))];
}
function n1(x) {
  return x === "Consumer Electronics" ? "Consumer Tech" : x;
}
function n2(l1, l2) {
  const a = n1(l1);
  if (a === "Consumer Tech") {
    if (l2 === "电子部件") return "电子配件/元器件";
    if (l2 === "微胶囊") return "游戏外设/电脑周边";
    if (l2 === "消费电子综合") return "待拆消费电子";
  }
  return l2;
}
function classify(s) {
  s = String(s || "");
  if (/打印|扫描|计算器|办公|POS|销售点/.test(s)) return "办公打印/商用电子";
  if (/电子书|Kindle|阅读/.test(s)) return "电子阅读器";
  if (/电视|投影|影院|视频/.test(s)) return "电视/投影/视听娱乐";
  if (/安全|监控|摄像|门铃|家庭安全/.test(s)) return "智能安防/监控";
  if (/DJ|卡拉|舞台|音响|扬声器|麦克风/.test(s)) return "音频/DJ/K歌";
  return "其他消费电子";
}
function expand(market, players) {
  const ps = players.map((x) => ({ ...x, l1: n1(x.standard_l1), l2: n2(x.standard_l1, x.standard_l2) }));
  const legacy = ps.filter((x) => x.l2 === "待拆消费电子");
  const weights = {};
  for (const p of legacy) weights[classify(p.main_l3)] = (weights[classify(p.main_l3)] || 0) + Number(p.estimated_gmv || 0);
  const total = Object.values(weights).reduce((s, v) => s + v, 0) || 1;
  const rows = [];
  for (const r of market.map((x) => ({ ...x, l1: n1(x.standard_l1), l2: n2(x.standard_l1, x.standard_l2) }))) {
    if (r.l1 !== "Consumer Tech") continue;
    if (r.l2 !== "待拆消费电子") {
      rows.push(r);
      continue;
    }
    for (const [k, w] of Object.entries(weights)) {
      if (k === "其他消费电子") continue;
      const share = w / total;
      const nr = { ...r, l2: k, monthly_gmv: r.monthly_gmv * share, gmv: r.gmv * share, prev_monthly_gmv: r.prev_monthly_gmv * share, cn_monthly_gmv: r.cn_monthly_gmv * share, top_brands: legacy.filter((p) => classify(p.main_l3) === k).sort((a, b) => b.estimated_gmv - a.estimated_gmv).slice(0, 6).map((p) => p.brand) };
      rows.push(nr);
    }
  }
  return rows;
}
function group(rows) {
  const map = new Map();
  for (const r of rows) {
    if (!map.has(r.l2)) map.set(r.l2, { l2: r.l2, monthly: 0, annual: 0, prev: 0, cn: 0, brands: [], raw: [], trend: {} });
    const g = map.get(r.l2);
    g.monthly += Number(r.monthly_gmv || 0);
    g.annual += Number(r.gmv || 0);
    g.prev += Number(r.prev_monthly_gmv || 0);
    g.cn += Number(r.cn_monthly_gmv || 0);
    g.brands.push(...(r.top_brands || []));
    g.raw.push(...(r.raw_l2_values || [r.standard_l2]));
    for (const [m, v] of Object.entries(r.monthly_trend || {})) g.trend[m] = (g.trend[m] || 0) + Number(v || 0);
  }
  return [...map.values()].map((x) => ({ ...x, growth: x.prev ? (x.monthly - x.prev) / x.prev * 100 : 0, cnShare: x.monthly ? x.cn / x.monthly * 100 : 0, brands: uniq(x.brands).slice(0, 8), raw: uniq(x.raw) })).sort((a, b) => b.monthly - a.monthly);
}
function spark(row) {
  const vals = Object.entries(row.trend).sort().slice(-12).map(([, v]) => v);
  const min = Math.min(...vals), max = Math.max(...vals), w = 320, h = 116;
  const pts = vals.map((v, i) => `${i * (w / Math.max(1, vals.length - 1))},${h - ((v - min) / (max - min || 1)) * (h - 12) - 6}`).join(" ");
  return `<svg viewBox="0 0 ${w} ${h}" class="chart"><polyline points="${pts}" fill="none" stroke="#2878ff" stroke-width="3"/><line x1="0" x2="${w}" y1="${h - 8}" y2="${h - 8}" stroke="#e6edf7"/></svg>`;
}

const market = readJson("portal/data/market/amazon_market_facts_monthly.json").records;
const players = readJson("portal/data/players/amazon_players_monthly.json").records;
const rows = group(expand(market, players));
const totalMonthly = rows.reduce((s, x) => s + x.monthly, 0);
const totalAnnual = rows.reduce((s, x) => s + x.annual, 0);
const cnShare = rows.reduce((s, x) => s + x.cn, 0) / totalMonthly * 100;
const top = rows[0];
const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>市场模块预览 - Consumer Tech</title><style>
body{margin:0;background:#f6f9ff;color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Microsoft YaHei",Arial,sans-serif}.wrap{display:grid;grid-template-columns:190px 1fr;min-height:100vh}.side{background:#fff;border-right:1px solid #dbe4f0;padding:22px}.brand{font-weight:850;font-size:18px;margin-bottom:34px}.nav div{padding:12px;border-radius:8px;margin:6px 0;color:#334155}.nav .on{background:#eaf2ff;color:#1d4ed8;font-weight:800}.main{padding:22px 26px}.top{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px}.title{font-size:22px;font-weight:850}.tags{display:flex;gap:10px}.tag{background:#fff;border:1px solid #cfe0ff;border-radius:8px;padding:9px 14px;font-size:13px}.hero{display:grid;grid-template-columns:1.55fr repeat(5,1fr);gap:12px;margin-bottom:16px}.card,.panel{background:#fff;border:1px solid #dbe4f0;border-radius:12px;box-shadow:0 8px 22px rgba(15,23,42,.045)}.card{padding:15px}.core{grid-row:span 1}.core h3{margin:0 0 10px;font-size:15px}.core li{font-size:13px;line-height:1.75}.label{font-size:12px;color:#64748b;font-weight:700}.value{font-size:24px;font-weight:900;margin:12px 0}.note{font-size:12px;color:#64748b}.spark{height:25px}.grid{display:grid;grid-template-columns:1.68fr .9fr;gap:16px}.panel{padding:16px}.panel h2{font-size:16px;margin:0 0 14px}.tablewrap{max-height:560px;overflow:hidden}table{width:100%;border-collapse:collapse;font-size:12px}th{text-align:left;color:#64748b;background:#f8fbff;padding:12px;border-bottom:1px solid #e2e8f0}td{padding:13px 10px;border-bottom:1px solid #edf2f7}td:first-child{color:#64748b;font-weight:800}.blue{color:#2563eb;font-weight:850}.logos{display:flex;gap:6px;flex-wrap:wrap}.logo{border:1px solid #e2e8f0;background:#f8fafc;border-radius:6px;padding:3px 6px;font-weight:850}.tabs{display:flex;gap:18px;border-bottom:1px solid #e2e8f0;margin-bottom:14px}.tabs span{padding-bottom:10px;font-size:13px;font-weight:750}.tabs .on{color:#2563eb;border-bottom:2px solid #2563eb}.metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.metric{background:#f8fafc;border-radius:8px;padding:10px}.metric b{display:block;font-size:18px;margin-top:5px}.chart{width:100%;height:145px;border:1px solid #e2e8f0;border-radius:8px;margin:10px 0}.mini{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px}.insight{background:#f8fafc;border-left:4px solid #2563eb;border-radius:8px;padding:10px;margin:8px 0;font-size:12px;line-height:1.6}@media(max-width:1200px){.hero,.grid{grid-template-columns:1fr}.wrap{grid-template-columns:1fr}.side{display:none}}
</style></head><body><div class="wrap"><aside class="side"><div class="brand">增长情报门户</div><div class="nav"><div>周报</div><div>线索</div><div class="on">市场</div><div>玩家</div><div>产品</div><div>创意</div></div></aside><main class="main"><div class="top"><div class="title">市场中心 / Consumer Tech（消费电子）</div><div class="tags"><span class="tag">平台：Amazon</span><span class="tag">国家：美国站</span><span class="tag">一级行业：Consumer Tech</span></div></div><section class="hero"><article class="card core"><h3>核心观点</h3><ul><li>Consumer Tech 已合并 Consumer Electronics，并拆掉“消费电子综合”。</li><li>电源/储能/充电的异动来自户外与家庭备用电两条需求叠加。</li><li>影像/无人机/创作者工具增长由新品节奏和创作者工具链推动。</li></ul></article>${[["年GMV", money(totalAnnual), "Amazon US"], ["月销售额", money(totalMonthly), "当前月"], ["品牌数", "1,644", "Top品牌估算"], ["中国品牌GMV占比", pct(cnShare), "GMV加权"], ["二级行业", rows.length, "拆分后"]].map((x, i) => `<article class="card"><div class="label">${x[0]}</div><div class="value">${x[1]}</div><div class="note">${x[2]}</div><svg class="spark" viewBox="0 0 100 28"><path d="M3 22 L18 19 L32 21 L48 13 L64 16 L82 8 L97 11" fill="none" stroke="${["#2563eb","#10b981","#f59e0b","#8b5cf6","#ef4444"][i]}" stroke-width="2"/></svg></article>`).join("")}</section><section class="grid"><section class="panel"><h2>类目机会排行（标准二级行业）</h2><div class="tablewrap"><table><thead><tr><th></th><th>二级行业</th><th>年GMV</th><th>月销售额</th><th>中国品牌GMV占比</th><th>MoM</th><th>TOP 3 品牌</th></tr></thead><tbody>${rows.map((r, i) => `<tr><td>${i + 1}</td><td class="blue">${esc(r.l2)}</td><td>${money(r.annual)}</td><td>${money(r.monthly)}</td><td>${pct(r.cnShare)}</td><td>${pct(r.growth)}</td><td><span class="logos">${r.brands.slice(0, 3).map((b) => `<span class="logo">${esc(b)}</span>`).join("")}</span></td></tr>`).join("")}</tbody></table></div></section><aside class="panel"><h2>${esc(top.l2)}</h2><div class="tabs"><span class="on">类目概览</span><span>玩家格局</span><span>产品机会</span><span>增长信号</span></div><div class="metrics">${[["年GMV", money(top.annual)], ["月销售额", money(top.monthly)], ["CN占比", pct(top.cnShare)], ["MoM", pct(top.growth)], ["品牌数", "411"], ["产品数", "166,775"]].map((m) => `<div class="metric"><span class="label">${m[0]}</span><b>${m[1]}</b></div>`).join("")}</div>${spark(top)}<div class="mini"><div>${top.brands.slice(0, 5).map((b, i) => `<div class="insight"><b>${i + 1}. ${esc(b)}</b><br>代表品牌</div>`).join("")}</div><div><div class="insight"><b>机会判断</b><br>规模锚点是 ${esc(top.l2)}，但需要继续看原始细类、品牌集中度和真实 SKU。</div><div class="insight"><b>口径提示</b><br>${esc(top.raw.slice(0, 5).join(" / "))}</div></div></div></aside></section></main></div></body></html>`;

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, html, "utf8");
console.log(out);
