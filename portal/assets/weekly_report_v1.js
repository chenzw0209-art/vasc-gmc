(function () {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const state = { tab: "overview", leads: [], market: [], players: [] };

  function safe(v, fallback = "待补充") {
    const s = String(v ?? "").trim();
    return s && s !== "0000-00-00" ? s : fallback;
  }

  function pct(n) {
    return Number(n || 0).toFixed(1) + "%";
  }

  function money(n) {
    n = Number(n || 0);
    if (!n) return "待补充";
    if (n >= 1e9) return "$" + (n / 1e9).toFixed(2) + "B";
    if (n >= 1e6) return "$" + (n / 1e6).toFixed(1) + "M";
    if (n >= 1e3) return "$" + (n / 1e3).toFixed(1) + "K";
    return "$" + n.toFixed(0);
  }

  function short(text, len = 68) {
    text = String(text || "").replace(/\s+/g, " ").trim();
    return text.length > len ? text.slice(0, len - 1) + "…" : text;
  }

  function quality(x) {
    const q = String(x.evidence_grade || x.priority || "").trim();
    if (/高|A/i.test(q)) return "A";
    if (/中|B/i.test(q)) return "B";
    if (/低|C/i.test(q)) return "C";
    return "待核验";
  }

  function eventType(x) {
    const s = [x.event_type, x.signal_type, x.summary].join(" ");
    if (/新品|发布|launch|release|unveil/i.test(s)) return "新品发布";
    if (/渠道|Amazon|TikTok|DTC|上线|店铺/i.test(s)) return "渠道合作";
    if (/展会|CES|IFA|Computex|Expo/i.test(s)) return "展会";
    if (/政策|合规|监管|标准/i.test(s)) return "行业政策";
    if (/PR|新闻|公告/i.test(s)) return "品牌PR";
    return "其他";
  }

  function validDate(x) {
    return /^\d{4}-\d{2}-\d{2}$/.test(String(x || "")) && x !== "0000-00-00";
  }

  function countBy(rows, fn) {
    return rows.reduce((acc, x) => {
      const k = fn(x) || "待补充";
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {});
  }

  function unique(rows, fn) {
    return [...new Set(rows.map(fn).filter(Boolean))];
  }

  function rows() {
    const country = $("#country-filter").value;
    const l1 = $("#l1-filter").value;
    const l2 = $("#l2-filter").value;
    const platform = $("#platform-filter").value;
    const qualityFilter = $("#quality-filter").value;
    const type = $("#type-filter").value;
    return state.leads.filter((x) => {
      if (country && x.country !== country) return false;
      if (l1 && x.standard_l1 !== l1) return false;
      if (l2 && x.standard_l2 !== l2) return false;
      if (platform && !String(x.platform || "").includes(platform)) return false;
      if (qualityFilter && quality(x) !== qualityFilter) return false;
      if (type && eventType(x) !== type) return false;
      return true;
    });
  }

  function fillFilters() {
    [
      ["country-filter", unique(state.leads, (x) => x.country).sort()],
      ["l1-filter", unique(state.leads, (x) => x.standard_l1).sort()],
      ["l2-filter", unique(state.leads, (x) => x.standard_l2).sort()],
    ].forEach(([id, values]) => values.forEach((v) => $("#" + id).insertAdjacentHTML("beforeend", `<option value="${v}">${v}</option>`)));
  }

  function renderKpis(list) {
    const high = list.filter((x) => quality(x) === "A").length;
    const industries = unique(list, (x) => x.standard_l2).length;
    const countries = unique(list, (x) => x.country).length;
    const brands = unique(list, (x) => x.company).length;
    const abnormal = marketChanges().filter((x) => Math.abs(x.change) >= 8).length;
    const cards = [
      ["本周新增情报数", list.length, "结构化公开信号", "tone-blue", "报"],
      ["高质量信源数", high, "A类 / 高质量", "tone-green", "A"],
      ["覆盖行业数", industries, "二级行业去重", "tone-purple", "业"],
      ["覆盖国家数", countries, "国家/地区去重", "tone-orange", "国"],
      ["重点品牌数", brands, "品牌/企业去重", "tone-red", "牌"],
      ["异常变化行业数", abnormal, "MoM超过阈值", "tone-blue", "↗"],
    ];
    $("#kpis").innerHTML = cards.map(([k, v, sub, tone, icon]) => `
      <article class="kpi-card"><div class="kpi-icon ${tone}">${icon}</div><div><div class="kpi-label">${k}</div><div class="kpi-value">${v.toLocaleString("en-US")}</div><div class="kpi-sub">${sub}</div></div></article>
    `).join("");
  }

  function marketChanges() {
    return state.market
      .filter((x) => x.country === "US" && x.platform === "Amazon")
      .map((x) => ({
        industry: x.standard_l2,
        l1: x.standard_l1,
        count: rows().filter((r) => r.standard_l2 === x.standard_l2).length,
        change: Number(x.growth_rate || 0),
        reason: `${safe(x.standard_l2)} GMV ${money(x.gmv)}，CN占比 ${pct(x.cn_share)}。`,
      }))
      .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
      .slice(0, 8);
  }

  function summaryItems(list) {
    const byIndustry = Object.entries(countBy(list, (x) => x.standard_l2)).sort((a, b) => b[1] - a[1]);
    const byEvent = Object.entries(countBy(list, eventType)).sort((a, b) => b[1] - a[1]);
    const brands = unique(list, (x) => x.company).slice(0, 3).join("、") || "重点品牌";
    const high = list.filter((x) => quality(x) === "A").length;
    return [
      ["行业变化", `${byIndustry[0]?.[0] || "Consumer Tech"} 本周公开信号较集中，高质量信源 ${high} 条。`, "tone-blue", "业"],
      ["类目变化", `${byIndustry.slice(0, 3).map(([k]) => k).join("、") || "核心类目"} 是本周主要信号来源。`, "tone-green", "类"],
      ["玩家变化", `${brands} 本周出现新品、PR或渠道相关公开事件。`, "tone-purple", "牌"],
      ["线索变化", `本周可验证情报信号 ${list.length} 条，主要类型为 ${byEvent[0]?.[0] || "客户动态"}。`, "tone-orange", "线"],
    ];
  }

  function renderSummary(list) {
    return summaryItems(list).map(([title, text, tone, icon]) => `
      <div class="summary-item"><div class="summary-icon ${tone}">${icon}</div><div><div class="summary-title">${title}</div><div class="summary-text">${text}</div></div></div>
    `).join("");
  }

  function renderIndustryTop(list) {
    const changes = marketChanges().slice(0, 5);
    return `<table class="data-table"><thead><tr><th style="width:44px">排名</th><th>行业</th><th style="width:92px" class="num">信号数量</th><th style="width:92px" class="num">较上期</th><th>主要变化</th></tr></thead><tbody>
      ${changes.map((x, i) => `<tr><td class="center">${i + 1}</td><td class="industry-cell">${x.industry}</td><td class="num">${x.count}</td><td class="num ${x.change >= 0 ? "positive" : "negative"}">${x.change >= 0 ? "+" : ""}${pct(x.change)}</td><td class="event-summary">${x.reason}</td></tr>`).join("")}
    </tbody></table>`;
  }

  function renderKeySignals(list) {
    const top = [...list].sort((a, b) => quality(a).localeCompare(quality(b))).slice(0, 10);
    return `<table class="data-table"><thead><tr><th style="width:42px">排名</th><th>品牌/企业</th><th>行业</th><th style="width:70px">国家</th><th style="width:90px">事件类型</th><th style="width:90px">事件时间</th><th style="width:70px">信源质量</th></tr></thead><tbody>
      ${top.map((x, i) => `<tr><td class="center">${i + 1}</td><td class="brand-cell">${safe(x.company, "未标注")}</td><td>${safe(x.standard_l2)}</td><td>${safe(x.country)}</td><td><span class="tag tag-b">${eventType(x)}</span></td><td>${safe(x.publish_date)}</td><td><span class="tag ${quality(x) === "A" ? "tag-a" : quality(x) === "B" ? "tag-b" : "tag-c"}">${quality(x)}</span></td></tr>`).join("")}
    </tbody></table>`;
  }

  function renderEventWindows(list) {
    const top = list.filter((x) => /展会|CES|IFA|Computex|Expo|招标|投标/i.test([x.event_type, x.summary].join(" "))).slice(0, 6);
    return `<table class="data-table"><thead><tr><th>名称</th><th style="width:82px">类型</th><th style="width:92px">时间</th><th style="width:80px">地点</th><th>相关行业</th></tr></thead><tbody>
      ${(top.length ? top : list.slice(0, 5)).map((x) => `<tr><td class="brand-cell">${safe(x.company)}</td><td><span class="tag tag-expo">${/招标|投标/i.test(x.summary) ? "招投标" : "展会"}</span></td><td>${safe(x.publish_date)}</td><td>${safe(x.country)}</td><td>${safe(x.standard_l2)}</td></tr>`).join("")}
    </tbody></table>`;
  }

  function renderQualityDonut(list) {
    const obj = countBy(list, quality);
    const keys = ["A", "B", "C", "待核验"];
    const total = Math.max(1, list.length);
    $("#quality-donut").innerHTML = `<div class="donut-shell">${svgDonut(keys.map((k) => obj[k] || 0), ["#2563eb", "#16a34a", "#f59e0b", "#94a3b8"], total)}<div class="donut-legend">${keys.map((k) => `<p><i></i><span>${k}</span><b>${obj[k] || 0} (${(((obj[k] || 0) / total) * 100).toFixed(1)}%)</b></p>`).join("")}</div></div>`;
  }

  function svgDonut(values, colors, total) {
    let acc = 0;
    const segs = values.map((v, i) => {
      if (!v) return "";
      const a0 = acc / total * Math.PI * 2;
      acc += v;
      const a1 = acc / total * Math.PI * 2;
      const large = a1 - a0 > Math.PI ? 1 : 0;
      const x0 = 75 + 58 * Math.cos(a0), y0 = 75 + 58 * Math.sin(a0);
      const x1 = 75 + 58 * Math.cos(a1), y1 = 75 + 58 * Math.sin(a1);
      return `<path d="M75,75 L${x0},${y0} A58,58 0 ${large},1 ${x1},${y1} Z" fill="${colors[i]}"></path>`;
    }).join("");
    return `<svg viewBox="0 0 150 150">${segs}<circle cx="75" cy="75" r="38" fill="#fff"/><text x="75" y="72" text-anchor="middle" style="font:800 20px system-ui">${total}</text><text x="75" y="92" text-anchor="middle" style="font:12px system-ui;fill:#64748b">总信号数</text></svg>`;
  }

  function renderHeatmap(list) {
    const countries = unique(list, (x) => x.country).slice(0, 6);
    const industries = Object.entries(countBy(list, (x) => x.standard_l2)).sort((a, b) => b[1] - a[1]).slice(0, 9).map(([k]) => k);
    const counts = {};
    list.forEach((x) => counts[`${x.country}|${x.standard_l2}`] = (counts[`${x.country}|${x.standard_l2}`] || 0) + 1);
    const max = Math.max(1, ...Object.values(counts));
    $("#heatmap").innerHTML = `<div class="heatmap-grid" style="grid-template-columns:120px repeat(${industries.length},1fr)"><div></div>${industries.map((i) => `<b title="${i}">${short(i, 8)}</b>`).join("")}${countries.map((c) => `<strong>${c}</strong>${industries.map((i) => { const v = counts[`${c}|${i}`] || 0; const a = v ? 0.16 + v / max * 0.72 : 0.04; return `<span style="background:rgba(37,99,235,${a})" title="${c} / ${i}: ${v}">${v || ""}</span>`; }).join("")}`).join("")}</div>`;
  }

  function renderOverview() {
    const list = rows();
    renderKpis(list);
    $("#tab-body").innerHTML = `
      <section class="report-main">
        <div class="report-row report-row-1">
          <article class="card summary-card"><h2>本周重点摘要</h2><div class="summary-list">${renderSummary(list)}</div></article>
          <article class="card summary-card"><h2>行业变化 Top5 <small>按信号量与GMV变化</small></h2><div class="table-wrap">${renderIndustryTop(list)}</div></article>
        </div>
        <div class="report-row report-row-2">
          <article class="card table-card-sm"><h2>重点线索 Top10</h2><div class="table-wrap">${renderKeySignals(list)}</div></article>
          <article class="card table-card-sm"><h2>展会 / 招投标窗口</h2><div class="table-wrap">${renderEventWindows(list)}</div></article>
          <article class="card table-card-sm"><h2>信源质量分布</h2><div id="quality-donut"></div></article>
        </div>
        <div class="report-row report-row-3">
          <article class="card heatmap-card"><h2>国家 × 行业热力图 <small>信号强度</small></h2><div id="heatmap"></div></article>
          <article class="card heatmap-card"><h2>本周事件类型分布</h2><div id="event-bars" class="mini-bars"></div></article>
        </div>
      </section>`;
    renderQualityDonut(list);
    renderHeatmap(list);
    renderBars("event-bars", countBy(list, eventType), Object.keys(countBy(list, eventType)).slice(0, 7));
  }

  function renderBars(id, obj, order) {
    const max = Math.max(1, ...Object.values(obj));
    $("#" + id).innerHTML = order.map((k) => `<div class="summary-bar"><span>${k}</span><i><b style="width:${(obj[k] || 0) / max * 100}%"></b></i><strong>${obj[k] || 0}</strong></div>`).join("");
  }

  function renderSimple(title, content) {
    renderKpis(rows());
    $("#tab-body").innerHTML = `<article class="card"><h2>${title}</h2>${content}</article>`;
  }

  function renderAll() {
    $$(".tab").forEach((x) => x.classList.toggle("active", x.dataset.tab === state.tab));
    if (state.tab === "industry") renderSimple("本周行业变化", `<div class="table-wrap">${renderIndustryTop(rows())}</div>`);
    else if (state.tab === "leads") renderSimple("本周线索动态", `<div class="table-wrap">${renderKeySignals(rows())}</div>`);
    else if (state.tab === "generate") renderSimple("周报生成", `<div class="placeholder">将基于结构化数据生成飞书/邮件格式周报，当前保留生成结构。</div>`);
    else if (state.tab === "history") renderSimple("历史周报", `<div class="placeholder">历史周报沉淀区，等待后续保存记录接入。</div>`);
    else renderOverview();
  }

  async function init() {
    const [leads, market, players] = await Promise.all([
      loadJson("./data/leads/lead_events.json"),
      loadJson("./data/market/amazon_market_facts_monthly.json"),
      loadJson("./data/players/amazon_players_monthly.json"),
    ]);
    state.leads = (leads.records || leads).filter((x) => x.standard_l1 === "Consumer Tech");
    state.market = market.records || market;
    state.players = players.records || players;
    fillFilters();
    $$(".tab").forEach((x) => x.addEventListener("click", () => { state.tab = x.dataset.tab; renderAll(); }));
    ["country-filter", "l1-filter", "l2-filter", "platform-filter", "type-filter", "quality-filter"].forEach((id) => $("#" + id).addEventListener("input", renderAll));
    $("#reset").addEventListener("click", () => {
      ["country-filter", "l1-filter", "l2-filter", "platform-filter", "type-filter", "quality-filter"].forEach((id) => $("#" + id).value = "");
      renderAll();
    });
    renderAll();
  }

  init().catch((e) => {
    $("#tab-body").innerHTML = `<div class="card"><h2>加载失败</h2><p>${e.message}</p></div>`;
  });
})();
