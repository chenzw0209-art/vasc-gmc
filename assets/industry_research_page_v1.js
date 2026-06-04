(function () {
  const PERIOD = "2026-04";
  const L1_LABELS = {
    Beauty: "Beauty",
    "Consumer Tech": "3C",
    FMCG: "FMCG",
    Health: "Health",
    Lifestyle: "Life",
  };
  const EN_NAMES = {
    "面部护理": "Facial Skin Care",
    "身体与防晒护理": "Body & Sun Care",
    "头发护理": "Hair Care",
    "彩妆": "Makeup",
    "口腔护理": "Oral Care",
    "香水": "Fragrance",
    "剃须脱毛产品": "Shaving & Hair Removal",
    "指甲与足部护理": "Nail & Foot Care",
    "美容工具与配件": "Beauty Tools & Accessories",
    "除臭与个护小品": "Deodorant & Personal Care",
  };

  let market = [];
  let players = [];
  let products = [];
  let enrichment = [];
  let selectedL1 = "Beauty";
  let selectedL2 = "面部护理";
  let currentTab = "overview";

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => [...document.querySelectorAll(sel)];
  const safe = (v) => String(v ?? "");

  function money(n) {
    n = Number(n || 0);
    if (n >= 1e9) return "$" + (n / 1e9).toFixed(2) + "B";
    if (n >= 1e6) return "$" + (n / 1e6).toFixed(1) + "M";
    if (n >= 1e3) return "$" + (n / 1e3).toFixed(1) + "K";
    return "$" + n.toFixed(0);
  }

  function pct(n) {
    return Number(n || 0).toFixed(1) + "%";
  }

  function num(n) {
    return Number(n || 0).toLocaleString("en-US");
  }

  function uniq(xs) {
    return [...new Set(xs.filter(Boolean))];
  }

  function textEllipsis(text, limit = 56) {
    text = safe(text).replace(/\s+/g, " ").trim();
    return text.length > limit ? text.slice(0, limit - 1) + "…" : text;
  }

  function cleanDisplay(text, limit = 48) {
    text = safe(text)
      .replace(/\*\*/g, "")
      .replace(/来源[:：].*$/g, "")
      .replace(/字段来自.*$/g, "")
      .replace(/品牌行来自.*$/g, "")
      .replace(/\$0(?:\.0+)?[BMK]?/g, "")
      .replace(/\b(?:NaN|undefined|null)\b/g, "")
      .replace(/\s+/g, " ")
      .trim();
    return text ? textEllipsis(text, limit) : "暂无数据";
  }

  function displayMoney(n) {
    n = Number(n || 0);
    return n > 0 ? money(n) : "暂无数据";
  }

  function displayPct(n) {
    n = Number(n);
    return Number.isFinite(n) ? pct(n) : "暂无数据";
  }

  function l1Rows(l1 = selectedL1) {
    return market.filter((r) => r.country === "US" && r.platform === "Amazon" && r.standard_l1 === l1)
      .sort((a, b) => Number(b.gmv || 0) - Number(a.gmv || 0));
  }

  function activeRow() {
    return market.find((r) => r.standard_l1 === selectedL1 && r.standard_l2 === selectedL2) || l1Rows()[0];
  }

  function playersFor(row) {
    return players.filter((p) => p.standard_l1 === row.standard_l1 && p.standard_l2 === row.standard_l2)
      .sort((a, b) => Number(b.estimated_monthly_gmv || 0) - Number(a.estimated_monthly_gmv || 0));
  }

  function productsFor(row) {
    return products.filter((p) => p.standard_l1 === row.standard_l1 && p.standard_l2 === row.standard_l2)
      .sort((a, b) => Number(b.annual_gmv_usd || 0) - Number(a.annual_gmv_usd || 0));
  }

  function docFor(row) {
    return enrichment.find((d) => d.l1 === row.standard_l1 && d.l2 === row.standard_l2) || {};
  }

  function l1Total(l1) {
    return l1Rows(l1).reduce((s, r) => s + Number(r.gmv || 0), 0);
  }

  function topShare(ps, count) {
    const total = ps.reduce((s, p) => s + Number(p.estimated_monthly_gmv || 0), 0);
    const top = ps.slice(0, count).reduce((s, p) => s + Number(p.estimated_monthly_gmv || 0), 0);
    return total ? top / total * 100 : 0;
  }

  function monthlySales(l3) {
    return l3.reduce((s, p) => s + Number(p.monthly_sales || 0), 0);
  }

  function newProductShare(l3) {
    const total = l3.reduce((s, p) => s + Number(p.product_count || 0), 0);
    const fresh = l3.reduce((s, p) => s + Number(p.new_product_count || p.new_count || 0), 0);
    return total ? fresh / total * 100 : 0;
  }

  function renderShellNav() {
    $(".app-nav").innerHTML = `
      <a href="../../index.html">周报</a>
      <a href="../leads/">线索</a>
      <a class="active" href="./">行业研究</a>
    `;
  }

  function renderIndustryTree() {
    const q = ($("#industry-search")?.value || "").trim().toLowerCase();
    const l1s = uniq(market.map((r) => r.standard_l1));
    $(".industry-tree").innerHTML = l1s.map((l1) => {
      const rows = l1Rows(l1).filter((r) => !q || JSON.stringify(r).toLowerCase().includes(q));
      if (!rows.length) return "";
      return `
        <section class="tree-group ${l1 === selectedL1 ? "open" : ""}">
          <button class="tree-l1" type="button" data-l1="${l1}">
            <span>${L1_LABELS[l1] || l1}</span><b>${rows.length}</b>
          </button>
          <div class="tree-l2-list">
            ${rows.map((r) => `
              <button class="tree-l2 ${r.standard_l1 === selectedL1 && r.standard_l2 === selectedL2 ? "active" : ""}" type="button" data-l1="${r.standard_l1}" data-l2="${r.standard_l2}" title="${r.standard_l2}">
                <span>${r.standard_l2}</span>
              </button>
            `).join("")}
          </div>
        </section>`;
    }).join("");
    $$(".tree-l1").forEach((btn) => btn.addEventListener("click", () => {
      selectedL1 = btn.dataset.l1;
      selectedL2 = l1Rows(selectedL1)[0]?.standard_l2 || selectedL2;
      currentTab = "overview";
      renderAll();
    }));
    $$(".tree-l2").forEach((btn) => btn.addEventListener("click", () => {
      selectedL1 = btn.dataset.l1;
      selectedL2 = btn.dataset.l2;
      currentTab = "overview";
      renderAll();
    }));
  }

  function renderHeader(row) {
    const en = EN_NAMES[row.standard_l2] || "";
    $(".page-heading").innerHTML = `
      <div>
        <h1>${row.standard_l2}${en ? ` <span>(${en})</span>` : ""}</h1>
        <p>行业研究 · Amazon 美国站 · ${PERIOD}</p>
      </div>`;
  }

  function metricCards(row) {
    const ps = playersFor(row);
    return [
      ["GMV", money(row.gmv), `占${row.standard_l1} ${pct(Number(row.gmv || 0) / Math.max(1, l1Total(row.standard_l1)) * 100)}`],
      ["月销售额", money(row.monthly_gmv), `同比 ${pct(row.growth_rate)}`],
      ["品牌数", num(row.brand_count), `同比 ${pct(row.brand_growth_rate || 0)}`],
      ["中国品牌数", num(row.cn_brand_count), `占品牌 ${pct(Number(row.cn_brand_count || 0) / Math.max(1, Number(row.brand_count || 0)) * 100)}`],
      ["中国品牌GMV占比", pct(row.cn_share), "GMV加权"],
      ["广告指数", Number(row.ad_spend_index || 0).toFixed(1), "品牌均值"],
      ["流量依赖度", pct(row.traffic_dependency), "中位参考"],
      ["Top3品牌占比", pct(topShare(ps, 3)), "头部集中度"],
    ].map(([k, v, note]) => `
      <article class="metric-card">
        <b>${k}</b>
        <strong>${v}</strong>
        <span>${note}</span>
      </article>`).join("");
  }

  function viewpointCards(row) {
    const ps = playersFor(row);
    const l3 = productsFor(row);
    const share = Number(row.gmv || 0) / Math.max(1, l1Total(row.standard_l1)) * 100;
    const topCn = ps.find((p) => p.cn_flag);
    const biggestL3 = l3[0];
    const secondL3 = l3[1];
    const thirdL3 = l3[2];
    const l3Total = l3.reduce((s, p) => s + Number(p.annual_gmv_usd || 0), 0);
    const biggestShare = Number(biggestL3?.annual_gmv_usd || 0) / Math.max(1, l3Total) * 100;
    const nextShare = (Number(secondL3?.annual_gmv_usd || 0) + Number(thirdL3?.annual_gmv_usd || 0)) / Math.max(1, l3Total) * 100;
    const cards = [
      ["规模位置", `${row.standard_l2}年GMV ${displayMoney(row.gmv)}，占${row.standard_l1} ${displayPct(share)}`, [`月销售额 ${displayMoney(row.monthly_gmv)}`, `品牌数 ${num(row.brand_count)}`, l3.length ? `三级类目 ${num(l3.length)}` : ""].filter(Boolean)],
      ["头部集中度", `Top3占比 ${displayPct(topShare(ps, 3))}，Top10占比 ${displayPct(topShare(ps, 10))}`, [`头部品牌 ${ps.slice(0, 3).map((p) => p.brand).join(" / ")}`, `海外Top ${ps.find((p) => !p.cn_flag)?.brand || "暂无数据"}`, `中国Top ${topCn?.brand || "暂无数据"}`]],
      ["中国品牌位置", `CN GMV占比 ${displayPct(row.cn_share)}，中国品牌数 ${num(row.cn_brand_count)}`, [`最高CN品牌 ${topCn?.brand || "暂无数据"}`, topCn ? `月GMV ${displayMoney(topCn.estimated_monthly_gmv)}` : "", `CN品牌占比 ${displayPct(Number(row.cn_brand_count || 0) / Math.max(1, Number(row.brand_count || 0)) * 100)}`].filter(Boolean)],
      ["结构观察", biggestL3 ? `${cleanDisplay(biggestL3.standard_l3, 16)}贡献 ${displayPct(biggestShare)}，为最大细分市场` : "三级结构数据待补充", [`第二、第三类目合计 ${displayPct(nextShare)}`, `最大类目CN占比 ${displayPct(biggestL3?.cn_share)}`, row.cn_share ? `整体CN占比 ${displayPct(row.cn_share)}` : ""].filter(Boolean)],
    ];
    return cards.map(([title, point, facts], i) => `
      <article class="view-card view-${i + 1}">
        <h3><span>${i + 1}</span>${title}</h3>
        <p title="${cleanDisplay(point, 80)}">${cleanDisplay(point, 36)}</p>
        <ul>${facts.slice(0, 3).map((f) => `<li title="${cleanDisplay(f, 80)}">${cleanDisplay(f, 24)}</li>`).join("")}</ul>
      </article>`).join("");
  }

  function tabButtons() {
    const tabs = [
      ["overview", "行业概览"],
      ["structure", "类目结构"],
      ["players", "玩家格局"],
    ];
    return tabs.map(([id, label]) => `<button type="button" class="${currentTab === id ? "active" : ""}" data-tab="${id}">${label}</button>`).join("");
  }

  function lineChart(row, options = {}) {
    return `<div class="echart" data-chart="${options.small ? "trend-small" : "trend"}"></div>`;
  }

  function seasonalChart(row) {
    return `<div class="echart" data-chart="seasonal"></div>`;
  }

  function scatter(ps) {
    return `<div class="echart" data-chart="scatter"></div>`;
  }

  function categoryDonut() {
    return `<div class="echart" data-chart="category-donut"></div>`;
  }

  function categoryGmvChart() {
    return `<div class="echart" data-chart="category-gmv"></div>`;
  }

  function categoryCnChart() {
    return `<div class="echart" data-chart="category-cn"></div>`;
  }

  function concentrationChart() {
    return `<div class="echart" data-chart="brand-concentration"></div>`;
  }

  function compactTable(headers, rows, cls = "") {
    const numeric = new Set(["GMV", "广告", "流量", "占比", "CN占比", "增长率", "月GMV"]);
    const thClass = (h) => h === "#" ? "center" : numeric.has(h) ? "num" : "";
    const colClass = (h) => h === "#" ? "col-rank"
      : h === "品牌" || h === "代表品牌" ? "col-brand"
      : h === "三级类目" || h === "类目" ? "col-category"
      : h === "国家" ? "col-country"
      : h === "GMV" || h === "月GMV" ? "col-gmv"
      : h === "广告" || h === "流量" || h === "增长率" || h === "占比" || h === "CN占比" ? "col-index"
      : "";
    return `<div class="table-scroll"><table class="research-table data-table ${cls}">
      <colgroup>${headers.map((h) => `<col class="${colClass(h)}">`).join("")}</colgroup>
      <thead><tr>${headers.map((h) => `<th class="${thClass(h)}">${h}</th>`).join("")}</tr></thead>
      <tbody>${rows.join("")}</tbody>
    </table></div>`;
  }

  function rankRows(ps, cnOnly, limit = 10) {
    return ps.filter((p) => cnOnly ? p.cn_flag : !p.cn_flag).slice(0, limit).map((p, i) => `<tr>
      <td class="rank center">${i + 1}</td>
      <td class="brand-cell" title="${p.brand}">${p.brand}</td>
      ${cnOnly ? "" : `<td>${p.nationality || "-"}</td>`}
      <td class="num">${money(p.estimated_monthly_gmv)}</td>
      <td class="num">${Number(p.ad_spend_index || 0).toFixed(1)}</td>
      ${cnOnly ? `<td class="num">${pct(p.traffic_dependency)}</td>` : ""}
    </tr>`);
  }

  function structureRows(l3, limit = 10) {
    const total = l3.reduce((s, p) => s + Number(p.annual_gmv_usd || 0), 0);
    return l3.slice(0, limit).map((p) => `<tr>
      <td class="category-cell" title="${p.standard_l3}">${p.standard_l3}</td>
      <td class="num">${money(p.annual_gmv_usd)}</td>
      <td class="num">${pct(Number(p.annual_gmv_usd || 0) / Math.max(1, total) * 100)}</td>
      <td class="num">${pct(p.cn_share)}</td>
    </tr>`);
  }

  function growthRows(ps, direction, limit = 5) {
    return ps.filter((p) => Object.keys(p.monthly_trend || {}).length > 1 && Math.abs(Number(p.mom_growth || 0)) < 2000)
      .sort((a, b) => direction * (Number(b.mom_growth || 0) - Number(a.mom_growth || 0)))
      .slice(0, limit);
  }

  function growthTable(title, rows, type, span = "span-2") {
    const cls = type === "up" ? "up" : "down";
    return `<article class="module-card ${span}">
      <h2>${title}</h2>
      ${compactTable(["#", "品牌", "增长率", "月GMV"], rows.map((p, i) => `<tr>
        <td class="rank center">${i + 1}</td><td class="brand-cell" title="${p.brand}">${p.brand}</td><td class="num ${cls}">${pct(p.mom_growth)}</td><td class="num">${money(p.estimated_monthly_gmv)}</td>
      </tr>`))}
    </article>`;
  }

  function eventRows(row) {
    const signals = (docFor(row).signals || []).slice(0, 5);
    if (!signals.length) {
      return `<div class="event-row"><b>${PERIOD}</b><span>暂无结构化行业事件</span><em>待补充</em></div>`;
    }
    return signals.map((s, i) => `<div class="event-row">
      <b>${s.date || `2026-04-${String(5 + i).padStart(2, "0")}`}</b>
      <span title="${s.signal_content || ""}">${textEllipsis(s.signal_content || s.metric_or_evidence || "", 52)}</span>
      <em>${s.signal_type || "深度分析"}</em>
    </div>`).join("");
  }

  function topCategoryBrandRows(l3) {
    return l3.slice(0, 5).map((p) => {
      const brand = safe(p.representative_players).split(/[、,，/]/).map((x) => x.trim()).filter(Boolean)[0] || "-";
      return `<tr><td class="category-cell" title="${p.standard_l3}">${p.standard_l3}</td><td class="brand-cell" title="${brand}">${brand}</td><td class="num">${money(p.annual_gmv_usd)}</td></tr>`;
    });
  }

  function trendEvents(row) {
    const entries = Object.entries(row.monthly_trend || {}).sort().slice(-24);
    const values = entries.map(([, v]) => Number(v || 0));
    if (!entries.length) return [];
    const max = Math.max(...values);
    const min = Math.min(...values);
    const avg = values.reduce((s, v) => s + v, 0) / values.length;
    const latestIndex = values.length - 1;
    return values.map((v, i) => {
      const prev = i > 0 ? values[i - 1] : null;
      const mom = prev ? (v - prev) / prev * 100 : 0;
      const type = v === max ? "大波峰" : v === min ? "低谷" : v >= avg * 1.08 ? "小波峰" : i === latestIndex ? "当前值" : "";
      return type ? { month: entries[i][0], value: v, mom, type } : null;
    }).filter(Boolean).slice(-5).reverse();
  }

  function marketAnalysisCards(row) {
    const events = trendEvents(row);
    if (!events.length) return `<div class="empty-state">暂无可识别波峰/波谷，原因解释待补充。</div>`;
    return `<div class="analysis-list">${events.map((e) => `
      <article class="analysis-item">
        <b>${e.month} · ${e.type}</b>
        <strong>GMV ${displayMoney(e.value)} · MoM ${e.mom >= 0 ? "+" : ""}${e.mom.toFixed(1)}%</strong>
        <p>外部事件：待补充</p>
        <p>原因解释：待补充</p>
        <em>证据状态：事件待验证</em>
      </article>`).join("")}</div>`;
  }

  function structureSummary(row, l3) {
    const total = l3.reduce((s, p) => s + Number(p.annual_gmv_usd || 0), 0);
    const top = l3.slice(0, 5);
    const first = top[0];
    const secondThirdShare = top.slice(1, 3).reduce((s, p) => s + Number(p.annual_gmv_usd || 0), 0) / Math.max(1, total) * 100;
    return `
      <div class="structure-summary">
        <div class="summary-bars">
          ${top.map((p) => {
            const share = Number(p.annual_gmv_usd || 0) / Math.max(1, total) * 100;
            return `<div class="summary-bar-row"><span title="${p.standard_l3}">${cleanDisplay(p.standard_l3, 18)}</span><b>${pct(share)}</b><i style="--w:${Math.min(100, share)}%"></i></div>`;
          }).join("")}
        </div>
        <div class="chart-fixed donut-chart">${categoryDonut()}</div>
        <div class="insight-stack">
          <p>${first ? `${cleanDisplay(first.standard_l3, 18)}贡献 ${displayPct(Number(first.annual_gmv_usd || 0) / Math.max(1, total) * 100)}，为核心细分市场。` : "三级类目结构待补充。"}</p>
          <p>第二、第三类目合计 ${displayPct(secondThirdShare)}。</p>
          <p>整体CN占比 ${displayPct(row.cn_share)}。</p>
        </div>
      </div>`;
  }

  function categoryInsight(row, l3) {
    const first = l3[0];
    const cnTop = [...l3].sort((a, b) => Number(b.cn_share || 0) - Number(a.cn_share || 0))[0];
    return `
      <div class="insight-stack">
        <p>${first ? `${cleanDisplay(first.standard_l3, 20)}是最大三级类目，GMV ${displayMoney(first.annual_gmv_usd)}。` : "三级类目数据待补充。"}</p>
        <p>${cnTop ? `${cleanDisplay(cnTop.standard_l3, 20)}的CN占比最高，为 ${displayPct(cnTop.cn_share)}。` : "CN占比数据待补充。"}</p>
        <p>类目增长原因默认待补充，不自动推断外部事件。</p>
      </div>`;
  }

  function playerInsight(row, ps) {
    const top = ps[0];
    const topCn = ps.find((p) => p.cn_flag);
    return `
      <div class="insight-stack">
        <p>${top ? `头部品牌 ${cleanDisplay(top.brand, 20)} 月GMV ${displayMoney(top.estimated_monthly_gmv)}。` : "品牌数据待补充。"}</p>
        <p>${topCn ? `中国Top品牌 ${cleanDisplay(topCn.brand, 20)} 月GMV ${displayMoney(topCn.estimated_monthly_gmv)}。` : "中国品牌数据待补充。"}</p>
        <p>Top3集中度 ${displayPct(topShare(ps, 3))}，Top10集中度 ${displayPct(topShare(ps, 10))}。</p>
      </div>`;
  }

  function chartTooltip(extra = "") {
    return {
      trigger: "axis",
      backgroundColor: "#FFFFFF",
      borderColor: "#E2E8F0",
      borderWidth: 1,
      padding: [8, 10],
      textStyle: { color: "#0F172A", fontSize: 12 },
      extraCssText: "border-radius:10px; box-shadow:0 8px 24px rgba(15,23,42,0.12);" + extra,
      axisPointer: { type: "line", lineStyle: { color: "#CBD5E1", width: 1, type: "dashed" } },
    };
  }

  function renderEcharts(row) {
    if (!window.echarts) return;
    const ps = playersFor(row);
    const l3 = productsFor(row);
    $$(".echart").forEach((el) => {
      const old = window.echarts.getInstanceByDom(el);
      if (old) old.dispose();
      const chart = window.echarts.init(el, null, { renderer: "canvas" });
      const type = el.dataset.chart;
      if (type === "trend" || type === "trend-small") chart.setOption(trendOption(row));
      if (type === "seasonal") chart.setOption(seasonalOption(row));
      if (type === "scatter") chart.setOption(scatterOption(ps));
      if (type === "category-donut") chart.setOption(categoryDonutOption(l3));
      if (type === "category-gmv") chart.setOption(categoryGmvOption(l3));
      if (type === "category-cn") chart.setOption(categoryCnOption(l3));
      if (type === "brand-concentration") chart.setOption(brandConcentrationOption(ps));
    });
  }

  function trendOption(row) {
    const entries = Object.entries(row.monthly_trend || {}).sort().slice(-24);
    const labels = entries.map(([m]) => m.slice(2));
    const data = entries.map(([, v]) => Number(v || 0));
    const maxIndex = data.indexOf(Math.max(...data));
    const minIndex = data.indexOf(Math.min(...data));
    const latestIndex = data.length - 1;
    return {
      animation: false,
      grid: { left: 56, right: 18, top: 26, bottom: 28 },
      tooltip: {
        ...chartTooltip(),
        formatter(params) {
          const p = params[0];
          const i = p.dataIndex;
          const prev = i > 0 ? data[i - 1] : null;
          const mom = prev ? ((p.value - prev) / prev * 100).toFixed(1) + "%" : "-";
          return `<b>${entries[i][0]}</b><br/>GMV：${money(p.value)}<br/>环比：${mom}`;
        },
      },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: labels,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: "#64748B", fontSize: 11 },
      },
      yAxis: {
        type: "value",
        splitNumber: 3,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: "#64748B", fontSize: 11, formatter: money },
        splitLine: { lineStyle: { color: "#E2E8F0", opacity: 0.7 } },
      },
      series: [{
        name: "GMV",
        type: "line",
        smooth: true,
        symbol: "circle",
        symbolSize: 6,
        showSymbol: false,
        lineStyle: { width: 3, color: "#2563EB", cap: "round", join: "round" },
        itemStyle: { color: "#2563EB", borderColor: "#FFFFFF", borderWidth: 2 },
        areaStyle: {
          color: {
            type: "linear", x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(37,99,235,0.22)" },
              { offset: 1, color: "rgba(37,99,235,0.02)" },
            ],
          },
        },
        markPoint: {
          symbol: "circle",
          symbolSize: 8,
          label: { color: "#334155", fontSize: 11 },
          data: [
            { coord: [labels[maxIndex], data[maxIndex]], name: "峰值", value: "峰值" },
            { coord: [labels[minIndex], data[minIndex]], name: "低谷", value: "低谷" },
            { coord: [labels[latestIndex], data[latestIndex]], name: "当前", value: "当前" },
          ],
        },
        data,
      }],
    };
  }

  function seasonalOption(row) {
    const colors = { "2025": "#2563EB", "2024": "#16A34A", "2023": "#F97316" };
    const months = Array.from({ length: 12 }, (_, i) => `${i + 1}月`);
    const byYear = { "2023": Array(12).fill(null), "2024": Array(12).fill(null), "2025": Array(12).fill(null) };
    Object.entries(row.monthly_trend || {}).forEach(([month, value]) => {
      const [year, m] = month.split("-");
      if (byYear[year]) byYear[year][Number(m) - 1] = Number(value || 0);
    });
    return {
      animation: false,
      color: ["#2563EB", "#16A34A", "#F97316"],
      grid: { left: 56, right: 18, top: 30, bottom: 30 },
      legend: { right: 8, top: 0, itemWidth: 8, itemHeight: 8, textStyle: { color: "#64748B", fontSize: 11 } },
      tooltip: { ...chartTooltip(), trigger: "axis" },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: months,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: "#64748B", fontSize: 11 },
      },
      yAxis: {
        type: "value",
        splitNumber: 3,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: "#64748B", fontSize: 11, formatter: money },
        splitLine: { lineStyle: { color: "#E2E8F0", opacity: 0.7 } },
      },
      series: ["2025", "2024", "2023"].map((year) => ({
        name: year,
        type: "line",
        smooth: true,
        showSymbol: false,
        symbol: "circle",
        symbolSize: 5,
        lineStyle: { width: year === "2025" ? 3 : 2, color: colors[year], opacity: year === "2025" ? 1 : 0.65 },
        itemStyle: { color: colors[year] },
        data: byYear[year],
      })),
    };
  }

  function scatterOption(ps) {
    const rows = ps.slice(0, 36);
    const data = rows.map((p, i) => ({
      value: [Number(p.estimated_monthly_gmv || 0), Number(p.ad_spend_index || 0), Math.max(4, Math.min(14, Math.sqrt(Number(p.listing_count || 0)) / 8))],
      brand: p.brand,
      country: p.nationality || "-",
      cn: !!p.cn_flag,
      isTop5: i < 5,
      traffic: p.traffic_dependency,
    }));
    return {
      animation: false,
      grid: { left: 42, right: 20, top: 18, bottom: 34 },
      tooltip: {
        trigger: "item",
        backgroundColor: "#FFFFFF",
        borderColor: "#E2E8F0",
        borderWidth: 1,
        padding: [8, 10],
        textStyle: { color: "#0F172A", fontSize: 12 },
        extraCssText: "border-radius:10px; box-shadow:0 8px 24px rgba(15,23,42,0.12);",
        formatter(p) {
          const d = p.data;
          return `<b>${d.brand}</b><br/>国家：${d.country}<br/>GMV：${money(d.value[0])}<br/>广告指数：${d.value[1].toFixed(1)}<br/>流量依赖度：${pct(d.traffic)}`;
        },
      },
      legend: { bottom: 0, left: 6, itemWidth: 8, itemHeight: 8, textStyle: { color: "#64748B", fontSize: 11 } },
      xAxis: {
        type: "log",
        name: "GMV",
        nameTextStyle: { color: "#64748B", fontSize: 11 },
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: "#64748B", fontSize: 11, formatter: money },
        splitLine: { lineStyle: { color: "#E2E8F0", opacity: 0.55 } },
      },
      yAxis: {
        type: "value",
        name: "广告",
        nameTextStyle: { color: "#64748B", fontSize: 11 },
        splitNumber: 3,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: "#64748B", fontSize: 11 },
        splitLine: { lineStyle: { color: "#E2E8F0", opacity: 0.55 } },
      },
      series: [
        {
          name: "海外品牌",
          type: "scatter",
          data: data.filter((d) => !d.cn),
          symbolSize: (v) => v[2],
          itemStyle: { color: "#2563EB", opacity: 0.78 },
          label: { show: true, formatter: (p) => p.data.isTop5 ? textEllipsis(p.data.brand, 11) : "", color: "#334155", fontSize: 11, position: "right" },
        },
        {
          name: "中国品牌",
          type: "scatter",
          data: data.filter((d) => d.cn),
          symbolSize: (v) => v[2],
          itemStyle: { color: "#F97316", opacity: 0.82 },
          label: { show: true, formatter: (p) => p.data.isTop5 ? textEllipsis(p.data.brand, 11) : "", color: "#334155", fontSize: 11, position: "right" },
        },
      ],
    };
  }

  function categoryDonutOption(l3) {
    const rows = l3.slice(0, 6);
    return {
      animation: false,
      tooltip: { ...chartTooltip(), trigger: "item" },
      legend: { show: false },
      series: [{
        type: "pie",
        radius: ["48%", "72%"],
        center: ["50%", "50%"],
        avoidLabelOverlap: true,
        label: { color: "#334155", fontSize: 11, formatter: (p) => textEllipsis(p.name, 10) },
        labelLine: { length: 8, length2: 6, lineStyle: { color: "#CBD5E1" } },
        itemStyle: { borderColor: "#FFFFFF", borderWidth: 2 },
        data: rows.map((p) => ({ name: p.standard_l3, value: Number(p.annual_gmv_usd || 0) })),
      }],
    };
  }

  function categoryGmvOption(l3) {
    const rows = l3.slice(0, 8).reverse();
    return {
      animation: false,
      grid: { left: 112, right: 24, top: 18, bottom: 24 },
      tooltip: { ...chartTooltip(), trigger: "axis" },
      xAxis: {
        type: "value",
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: "#64748B", fontSize: 11, formatter: money },
        splitLine: { lineStyle: { color: "#E2E8F0", opacity: 0.65 } },
      },
      yAxis: {
        type: "category",
        data: rows.map((p) => textEllipsis(p.standard_l3, 12)),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: "#334155", fontSize: 11 },
      },
      series: [{
        name: "GMV",
        type: "bar",
        barWidth: 10,
        itemStyle: { color: "#2563EB", borderRadius: [0, 6, 6, 0] },
        data: rows.map((p) => Number(p.annual_gmv_usd || 0)),
      }],
    };
  }

  function categoryCnOption(l3) {
    const rows = l3.slice(0, 8).reverse();
    return {
      animation: false,
      grid: { left: 112, right: 24, top: 18, bottom: 24 },
      tooltip: { ...chartTooltip(), trigger: "axis" },
      xAxis: {
        type: "value",
        max: 100,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: "#64748B", fontSize: 11, formatter: (v) => `${v}%` },
        splitLine: { lineStyle: { color: "#E2E8F0", opacity: 0.65 } },
      },
      yAxis: {
        type: "category",
        data: rows.map((p) => textEllipsis(p.standard_l3, 12)),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: "#334155", fontSize: 11 },
      },
      series: [{
        name: "CN占比",
        type: "bar",
        barWidth: 10,
        itemStyle: { color: "#16A34A", borderRadius: [0, 6, 6, 0] },
        data: rows.map((p) => Number(p.cn_share || 0)),
      }],
    };
  }

  function brandConcentrationOption(ps) {
    const values = [
      ["Top3", topShare(ps, 3)],
      ["Top5", topShare(ps, 5)],
      ["Top10", topShare(ps, 10)],
    ];
    return {
      animation: false,
      grid: { left: 54, right: 28, top: 18, bottom: 24 },
      tooltip: { ...chartTooltip(), trigger: "axis" },
      xAxis: {
        type: "value",
        max: 100,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: "#64748B", fontSize: 11, formatter: (v) => `${v}%` },
        splitLine: { lineStyle: { color: "#E2E8F0", opacity: 0.65 } },
      },
      yAxis: {
        type: "category",
        data: values.map(([k]) => k),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: "#334155", fontSize: 11 },
      },
      series: [{
        name: "集中度",
        type: "bar",
        barWidth: 12,
        label: { show: true, position: "right", color: "#334155", fontSize: 11, formatter: (p) => pct(p.value) },
        itemStyle: { color: "#7C3AED", borderRadius: [0, 6, 6, 0] },
        data: values.map(([, v]) => Number(v || 0)),
      }],
    };
  }

  function renderOverview(row) {
    const l3 = productsFor(row);
    return `
      <section class="overview-layout">
        <div class="overview-main">
          <article class="module-card card-overview-trend">
            <h2>市场规模趋势 <small>24个月 GMV</small></h2>
            <div class="chart-fixed trend-chart">${lineChart(row)}</div>
          </article>
          <article class="module-card card-overview-analysis">
            <h2>市场规模解析</h2>
            ${marketAnalysisCards(row)}
          </article>
        </div>
        <article class="module-card overview-structure">
          <h2>行业结构摘要</h2>
          ${structureSummary(row, l3)}
        </article>
      </section>`;
  }

  function renderPlayers(row) {
    const ps = playersFor(row);
    return `
      <section class="players-layout">
        <div class="players-row-1">
          <article class="module-card card-table-top10"><h2>海外Top10品牌</h2>${compactTable(["#", "品牌", "国家", "GMV", "广告"], rankRows(ps, false, 10))}</article>
          <article class="module-card card-table-top10"><h2>中国Top10品牌</h2>${compactTable(["#", "品牌", "GMV", "广告", "流量"], rankRows(ps, true, 10))}</article>
          <article class="module-card card-player-matrix matrix-card"><h2>品牌竞争矩阵 <small>GMV × 广告指数</small></h2><div class="scatter-chart">${scatter(ps)}</div></article>
        </div>
        <div class="players-row-2">
          <article class="module-card card-brand-concentration"><h2>品牌集中度</h2><div class="chart-fixed">${concentrationChart()}</div></article>
          <article class="module-card card-head-compare"><h2>头部品牌对比</h2>${compactTable(["#", "品牌", "GMV", "广告", "流量"], ps.slice(0, 8).map((p, i) => `<tr><td class="rank center">${i + 1}</td><td class="brand-cell" title="${p.brand}">${p.brand}</td><td class="num">${money(p.estimated_monthly_gmv)}</td><td class="num">${Number(p.ad_spend_index || 0).toFixed(1)}</td><td class="num">${pct(p.traffic_dependency)}</td></tr>`))}</article>
          <article class="module-card card-player-insight"><h2>玩家观察</h2>${playerInsight(row, ps)}</article>
        </div>
      </section>`;
  }

  function renderStructure(row) {
    const l3 = productsFor(row);
    return `
      <section class="category-layout">
        <div class="category-row-1">
          <article class="module-card card-category-structure">
            <h2>三级类目结构</h2>
            <div class="category-structure-split">
              <div class="chart-fixed donut-chart">${categoryDonut()}</div>
              ${compactTable(["三级类目", "GMV", "占比", "CN占比"], structureRows(l3, 18), "structure-table")}
            </div>
          </article>
          <article class="module-card card-category-gmv"><h2>类目GMV趋势</h2><div class="chart-fixed">${categoryGmvChart()}</div></article>
        </div>
        <div class="category-row-2">
          <article class="module-card card-category-cn"><h2>类目CN占比</h2><div class="chart-fixed">${categoryCnChart()}</div></article>
          <article class="module-card card-table-top5"><h2>Top类目品牌</h2>${compactTable(["三级类目", "代表品牌", "GMV"], topCategoryBrandRows(l3))}</article>
          <article class="module-card card-category-insight"><h2>类目结构洞察</h2>${categoryInsight(row, l3)}</article>
        </div>
      </section>`;
  }

  function renderTabContent(row) {
    const html = currentTab === "overview" ? renderOverview(row)
      : currentTab === "structure" ? renderStructure(row)
      : renderPlayers(row);
    $(".tab-body").innerHTML = html;
    requestAnimationFrame(() => renderEcharts(row));
  }

  function renderRight(row) {
    renderHeader(row);
    $(".metrics-grid").innerHTML = metricCards(row);
    $(".viewpoints-grid").innerHTML = viewpointCards(row);
    $(".tabs").innerHTML = tabButtons();
    $$(".tabs button").forEach((btn) => btn.addEventListener("click", () => {
      currentTab = btn.dataset.tab;
      renderRight(activeRow());
    }));
    renderTabContent(row);
  }

  function renderAll() {
    renderShellNav();
    renderIndustryTree();
    const row = activeRow();
    if (!row) return;
    selectedL1 = row.standard_l1;
    selectedL2 = row.standard_l2;
    renderRight(row);
    $(".data-source").innerHTML = `数据来源：<br>Softtime Amazon数据<br>美国站 · ${PERIOD}`;
  }

  async function init() {
    const [m, p, pr, e] = await Promise.all([
      loadJson("../../data/market/amazon_market_facts_monthly.json"),
      loadJson("../../data/players/amazon_players_monthly.json"),
      loadJson("../../data/products/amazon_products_monthly.json"),
      loadJson("../../data/research/beauty_l2_content_enrichment_v0_1.json"),
    ]);
    market = m.records || [];
    players = p.records || [];
    products = pr.records || [];
    enrichment = e.records || [];
    const url = new URLSearchParams(location.search);
    selectedL1 = url.get("l1") || "Beauty";
    selectedL2 = url.get("l2") || l1Rows(selectedL1).find((r) => r.standard_l2 === "面部护理")?.standard_l2 || l1Rows(selectedL1)[0]?.standard_l2 || "面部护理";
    currentTab = ["overview", "structure", "players"].includes(url.get("tab")) ? url.get("tab") : "overview";
    $("#industry-search").addEventListener("input", renderIndustryTree);
    window.addEventListener("resize", () => {
      $$(".echart").forEach((el) => window.echarts?.getInstanceByDom(el)?.resize());
    });
    renderAll();
  }

  init().catch((error) => {
    $(".research-main").innerHTML = `<div class="module-card"><h2>加载失败</h2><p>${error.message}</p></div>`;
  });
})();
