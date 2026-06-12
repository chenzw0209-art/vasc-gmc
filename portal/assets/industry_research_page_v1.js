(function () {
  const PERIOD = "2026-04";
  const L1_LABELS = {
    Beauty: "Beauty",
    "Consumer Tech": "3C",
    FMCG: "FMCG",
    Fashion: "Fashion",
    Health: "Health",
    Lifestyle: "Life",
    Gaming: "Gaming",
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
  let industryDictionary = [];
  let gamingCalendar = null;
  let gamingCalendarBlueprint = null;
  let gamingMonthOffset = 0;
  let gamingSelectedGameId = "";
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
    if (l1 === "Gaming") return [gamingRow()];
    const rows = market.filter((r) => r.country === "US" && r.platform === "Amazon" && r.standard_l1 === l1)
      .sort((a, b) => Number(b.gmv || 0) - Number(a.gmv || 0));
    return rows.length ? rows : dictionaryRowsFor(l1);
  }

  function activeRow() {
    if (selectedL1 === "Gaming") return gamingRow();
    return market.find((r) => r.standard_l1 === selectedL1 && r.standard_l2 === selectedL2) || l1Rows()[0];
  }

  function dictionaryRowsFor(l1) {
    return industryDictionary
      .filter((r) => r.standard_l1 === l1)
      .sort((a, b) => safe(a.standard_l2).localeCompare(safe(b.standard_l2), "zh-Hans-CN"))
      .map((r) => ({
        country: "US",
        country_name: "美国",
        platform: "Amazon",
        period: PERIOD,
        period_type: "month",
        standard_l1: r.standard_l1,
        standard_l2: r.standard_l2,
        gmv: 0,
        monthly_gmv: 0,
        prev_monthly_gmv: 0,
        growth_rate: 0,
        cn_share: 0,
        cn_monthly_gmv: 0,
        cn_annual_gmv: 0,
        product_count: 0,
        brand_count: 0,
        cn_brand_count: 0,
        canonical_source_count: 0,
        raw_l2_count: 0,
        raw_l2_values: [],
        raw_l3_values: [],
        top_brands: [],
        major_segments: [],
        monthly_trend: {},
        read_status: "pending_governed_market_data",
        source_layer: "industry_dictionary_only",
        source_file: "portal/data/dictionary/industry_dictionary_ecommerce.json",
      }));
  }

  function isDictionaryOnly(row) {
    return row?.source_layer === "industry_dictionary_only";
  }

  function dictionaryOnlyMetricCards(row) {
    const l2Count = dictionaryRowsFor(row.standard_l1).length;
    const cards = [
      ["行业状态", "待治理", "字典已收录，市场事实未接入"],
      ["一级行业", row.standard_l1, "来自行业字典"],
      ["二级行业", num(l2Count), "字典口径"],
      ["当前类目", row.standard_l2, "等待 governed 底表"],
      ["GMV", "待生成", "不使用 0 伪装"],
      ["玩家数据", "待生成", "不恢复旧玩家页"],
      ["产品结构", "待生成", "不恢复旧产品页"],
      ["信源", "dictionary", "portal/data/dictionary"],
    ];
    return cards.map(([k, v, note]) => `
      <article class="metric-card">
        <b>${k}</b>
        <strong>${v}</strong>
        <span>${note}</span>
      </article>`).join("");
  }

  function dictionaryOnlyViewpointCards(row) {
    const cards = [
      ["规则已更正", `${row.standard_l1} 已作为独立一级行业进入行业树`, ["不折叠到 Lifestyle", "不在前端临时拆分类目", "等待治理后市场事实"]],
      ["缺口位置", "当前前台市场主表缺少该行业 governed 行", ["amazon_market_facts_monthly.json 未覆盖", "玩家/产品表需同步生成", "校验已加 Fashion 护栏"]],
      ["下一步", "补齐 governed 聚合底表并重新生成页面 JSON", ["市场事实", "玩家格局", "产品结构"]],
      ["边界", "当前仅展示字典事实，不展示临时 GMV 或临时玩家结论", ["避免新旧模块混用", "避免用旧 report_pages 填充当前页"]],
    ];
    return cards.map(([title, point, facts], i) => `
      <article class="view-card view-${i + 1}">
        <h3><span>${i + 1}</span>${title}</h3>
        <p title="${point}">${cleanDisplay(point, 44)}</p>
        <ul>${facts.slice(0, 3).map((f) => `<li title="${f}">${cleanDisplay(f, 24)}</li>`).join("")}</ul>
      </article>`).join("");
  }

  function gamingRow() {
    const s = gamingCalendar?.summary || {};
    return {
      country: "Global",
      platform: "Multi-platform",
      standard_l1: "Gaming",
      standard_l2: "主版面",
      gmv: 0,
      monthly_gmv: 0,
      brand_count: s.effective_targets || 0,
      cn_brand_count: s.p0_items || 0,
      cn_share: 0,
      growth_rate: 0,
    };
  }

  function isGaming(row) {
    return row?.standard_l1 === "Gaming";
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
      <a class="active" href="./">行业研究</a>
    `;
  }

  function renderIndustryTree() {
    const q = ($("#industry-search")?.value || "").trim().toLowerCase();
    const l1s = uniq([...industryDictionary.map((r) => r.standard_l1), ...market.map((r) => r.standard_l1), "Gaming"]);
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
    if (isGaming(row)) {
      $(".page-heading").innerHTML = `
        <div>
          <h1>Gaming <span>（游戏出海）</span></h1>
          <p>行业研究 · 新游日历 · 2026-06-08</p>
        </div>`;
      return;
    }
    const en = EN_NAMES[row.standard_l2] || "";
    $(".page-heading").innerHTML = `
      <div>
        <h1>${row.standard_l2}${en ? ` <span>(${en})</span>` : ""}</h1>
        <p>行业研究 · Amazon 美国站 · ${PERIOD}</p>
      </div>`;
  }

  function metricCards(row) {
    if (isGaming(row)) return gamingMetricCards();
    if (isDictionaryOnly(row)) return dictionaryOnlyMetricCards(row);
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
    if (isGaming(row)) return gamingViewpointCards();
    if (isDictionaryOnly(row)) return dictionaryOnlyViewpointCards(row);
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
    const tabs = selectedL1 === "Gaming" ? [
      ["overview", "新游日历"],
      ["calendar", "项目全表"],
    ] : [
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

  function gamingItems() {
    return gamingCalendar?.calendar_items || [];
  }

  function gamingFocusCards() {
    return gamingCalendarBlueprint?.modules?.focus_cards || [];
  }

  function gamingP0Cards() {
    return gamingCalendarBlueprint?.modules?.p0_cards || [];
  }

  function gamingBlueprintSummaryCards() {
    return gamingCalendarBlueprint?.modules?.summary_cards || [];
  }

  function gamingCoreThesis() {
    return gamingCalendarBlueprint?.modules?.core_thesis || null;
  }

  function gamingAllCards() {
    const cards = gamingFocusCards();
    return cards.length ? cards : gamingItems();
  }

  function gamingSummary() {
    return gamingCalendar?.summary || {};
  }

  function gamingMetricCards() {
    const s = gamingSummary();
    const cards = [
      ["日历项目", num(s.calendar_items), "进入新游日历视图"],
      ["有效目标", num(s.effective_targets), "已二次校验/可跟进"],
      ["观察待补证", num(s.watchlist), "保留但需补证"],
      ["P0项目", num(s.p0_items), "优先销售窗口"],
      ["高置信项目", num(s.high_confidence_items), "高/中高置信度"],
      ["A级信源", num(s.a_grade_sources), "官方/强证据"],
      ["信源明细", num(s.source_count), "证据链条数"],
      ["PC项目", num(s.platform_counts?.PC), "主力平台"],
    ];
    return cards.map(([k, v, note]) => `
      <article class="metric-card">
        <b>${k}</b>
        <strong>${v}</strong>
        <span>${note}</span>
      </article>`).join("");
  }

  function gamingViewpointCards() {
    const s = gamingSummary();
    const buckets = s.calendar_bucket_counts || {};
    const priorities = s.priority_counts || {};
    const cards = [
      ["日历定位", `当前纳入 ${num(s.calendar_items)} 个未上线/待跟踪项目`, [`有效目标 ${num(s.effective_targets)}`, `观察池 ${num(s.watchlist)}`, `信源 ${num(s.source_count)}`]],
      ["销售窗口", `P0项目 ${num(priorities.P0)} 个，P1项目 ${num(priorities.P1)} 个`, [`测试Demo ${num(buckets["测试Demo日历"])}`, `预热建联 ${num(buckets["预热建联日历"])}`, `正式上线 ${num(buckets["正式上线日历"])}`]],
      ["平台结构", `PC仍是新游日历主平台，主机/移动并行`, Object.entries(s.platform_counts || {}).slice(0, 3).map(([k, v]) => `${k} ${v}`)],
      ["证据口径", `以实机/Demo、海外信号、未上线校验作为入表门槛`, [`A级信源 ${num(s.a_grade_sources)}`, `高置信 ${num(s.high_confidence_items)}`, "排除已上线防误入"]],
    ];
    return cards.map(([title, point, facts], i) => `
      <article class="view-card view-${i + 1}">
        <h3><span>${i + 1}</span>${title}</h3>
        <p title="${point}">${cleanDisplay(point, 42)}</p>
        <ul>${facts.slice(0, 3).map((f) => `<li title="${f}">${cleanDisplay(f, 24)}</li>`).join("")}</ul>
      </article>`).join("");
  }

  function priorityClass(priority) {
    return priority === "P0" ? "priority-p0" : priority === "P1" ? "priority-p1" : "priority-p2";
  }

  function sourceLink(url) {
    return url ? `<a class="inline-link" href="${url}" target="_blank" rel="noreferrer">打开</a>` : "-";
  }

  function gamingCalendarRows(items, limit = 18) {
    return items.slice(0, limit).map((item) => `
      <tr>
        <td class="brand-cell" title="${item.game_name}">${item.game_name}</td>
        <td title="${item.owner}">${textEllipsis(item.owner, 18)}</td>
        <td title="${item.platform}">${textEllipsis(item.platform, 18)}</td>
        <td><span class="bucket-pill">${textEllipsis(item.calendar_bucket, 10)}</span></td>
        <td title="${item.stage}">${textEllipsis(item.stage, 18)}</td>
        <td>${item.estimated_window || item.estimated_date || "-"}</td>
        <td><span class="priority-pill ${priorityClass(item.bd_priority)}">${item.bd_priority || "-"}</span></td>
        <td>${item.confidence || "-"}</td>
        <td title="${item.dynamic_summary}">${textEllipsis(item.dynamic_summary, 30)}</td>
        <td>${sourceLink(item.primary_source_url)}</td>
      </tr>`);
  }

  function gamingCalendarPreviewRows(items, limit = 10) {
    return items.slice(0, limit).map((item) => `
      <tr>
        <td class="brand-cell" title="${item.game_name}">${item.game_name}</td>
        <td title="${item.owner}">${textEllipsis(item.owner, 16)}</td>
        <td><span class="bucket-pill">${textEllipsis(item.calendar_bucket, 9)}</span></td>
        <td>${item.estimated_window || item.estimated_date || "-"}</td>
        <td><span class="priority-pill ${priorityClass(item.bd_priority)}">${item.bd_priority || "-"}</span></td>
        <td title="${item.attention_point || item.bd_reason || item.dynamic_summary}">${textEllipsis(item.attention_point || item.bd_reason || item.dynamic_summary, 34)}</td>
        <td>${sourceLink(item.primary_source_url)}</td>
      </tr>`);
  }

  function gamingTimeline(items) {
    const byWindow = Object.entries(items.reduce((acc, item) => {
      const key = item.estimated_window || item.estimated_date || "TBA";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {})).sort((a, b) => a[0].localeCompare(b[0])).slice(0, 8);
    const max = Math.max(1, ...byWindow.map(([, v]) => v));
    return `<div class="gaming-timeline">
      ${byWindow.map(([label, value]) => `
        <div class="timeline-row">
          <span>${label}</span>
          <i style="--w:${Math.max(8, value / max * 100)}%"></i>
          <b>${value}</b>
        </div>`).join("")}
    </div>`;
  }

  function gamingBucketCards(items) {
    const s = gamingSummary();
    return Object.entries(s.calendar_bucket_counts || {}).map(([bucket, value]) => `
      <div class="gaming-bucket">
        <b>${bucket}</b>
        <strong>${value}</strong>
        <span>${cleanDisplay(items.find((x) => x.calendar_bucket === bucket)?.dynamic_summary || "待补充", 34)}</span>
      </div>`).join("");
  }

  function formatMonthLabel(year, month) {
    return `${year}-${String(month + 1).padStart(2, "0")}`;
  }

  function gamingAvailableMonths(cards) {
    const byMonth = cards.filter((item) => item.estimated_date).reduce((acc, item) => {
      const month = item.estimated_date.slice(0, 7);
      acc[month] = acc[month] || [];
      acc[month].push(item);
      return acc;
    }, {});
    return {
      byMonth,
      months: Object.keys(byMonth).sort(),
    };
  }

  function activeGamingMonth(cards) {
    const { months } = gamingAvailableMonths(cards);
    if (!months.length) return "";
    gamingMonthOffset = Math.max(0, Math.min(gamingMonthOffset, months.length - 1));
    return months[gamingMonthOffset];
  }

  function gamingCardsForActiveMonth(cards) {
    const month = activeGamingMonth(cards);
    return month ? cards.filter((item) => (item.estimated_date || "").startsWith(month)) : cards;
  }

  function gamingMonthCalendar(cards) {
    const { byMonth, months } = gamingAvailableMonths(cards);
    if (!months.length) return `<div class="empty-note">暂无可落到具体日期的项目</div>`;
    gamingMonthOffset = Math.max(0, Math.min(gamingMonthOffset, months.length - 1));
    const visibleMonths = months.slice(gamingMonthOffset, gamingMonthOffset + 6);
    const monthKey = visibleMonths[0] || months[gamingMonthOffset];
    const currentItems = byMonth[monthKey] || [];
    return `<div class="gaming-calendar-toolbar">
      <label>月份窗口</label>
      <select data-gaming-month-select>
        ${months.map((m, i) => `<option value="${i}" ${i === gamingMonthOffset ? "selected" : ""}>从 ${m} 开始</option>`).join("")}
      </select>
      <span>默认展示 ${visibleMonths.length} 个月 · 月份窗口不代表确定上线日</span>
    </div>
    <section class="gaming-month-window">
      ${visibleMonths.map((month) => {
        const items = byMonth[month] || [];
        const p0 = items.filter((item) => item.bd_priority === "P0").length;
        const p1 = items.filter((item) => item.bd_priority === "P1").length;
        const top = items.slice().sort((a, b) => priorityClass(a.bd_priority).localeCompare(priorityClass(b.bd_priority))).slice(0, 4);
        const buckets = uniq(items.map((item) => item.calendar_bucket)).slice(0, 2);
        return `<article class="gaming-month-card">
          <strong>${month}</strong>
          <span>${items.length} 个项目 · P0 ${p0} · P1 ${p1}</span>
          <p>${buckets.join(" / ") || "待补充窗口"}</p>
          <ul>${top.map((item) => `
            <li>
              <button type="button" class="${gamingSelectedGameId === item.id ? "is-selected" : ""}" data-gaming-select="${item.id}">
                ${textEllipsis(item.game_name, 20)}
              </button>
            </li>`).join("")}</ul>
          ${items.length > 4 ? `<em>还有 ${items.length - 4} 个项目，见下方列表</em>` : ""}
        </article>`;
      }).join("")}
    </section>`;
  }

  function gamingWeeklyNewsPanel(cards) {
    const news = cards.slice()
      .sort((a, b) => (b.bd_priority || "").localeCompare(a.bd_priority || "") || (b.estimated_date || "").localeCompare(a.estimated_date || ""))
      .slice(0, 4);
    return `<article class="module-card gaming-thesis-card">
      <h2>本周要闻 <small>新游窗口</small></h2>
      <div class="gaming-news-list">
        ${news.map((item) => `
          <button type="button" data-gaming-select="${item.id}" class="${gamingSelectedGameId === item.id ? "is-selected" : ""}">
            <b>${textEllipsis(item.game_name, 20)}</b>
            <span>${textEllipsis(item.dynamic_summary || item.action_copy || item.bd_reason, 46)}</span>
          </button>`).join("")}
      </div>
    </article>`;
  }

  function gamingFocusListHtml(cards) {
    const month = cards.find((x) => x.id === gamingSelectedGameId)?.estimated_date?.slice(0, 7) || activeGamingMonth(cards);
    const rows = month ? cards.filter((item) => (item.estimated_date || "").startsWith(month)) : cards;
    return `<div class="gaming-list-table">
      <div class="gaming-list-head">
        <b>游戏</b><b>归属方</b><b>阶段/窗口</b><b>优先级</b><b>行动理由</b><b>信源</b>
      </div>
      ${rows.map((item) => `
        <div class="gaming-list-row ${gamingSelectedGameId === item.id ? "is-selected" : ""}" data-gaming-select="${item.id}" role="button" tabindex="0">
          <b>${textEllipsis(item.game_name, 22)}</b>
          <span>${textEllipsis(item.publisher || item.owner, 18)}</span>
          <span>${textEllipsis(item.current_stage || item.stage || item.estimated_window, 22)}</span>
          <span><i class="priority-pill ${priorityClass(item.bd_priority)}">${item.bd_priority || "-"}</i></span>
          <p>${cleanDisplay(item.action_copy || item.bd_reason || item.dynamic_summary, 64)}</p>
          <span>${sourceLink(item.evidence_refs?.[0]?.url || item.primary_source_url)}</span>
        </div>`).join("")}
    </div>`;
  }

  function gamingInfoPanel(cards) {
    const monthCards = gamingCardsForActiveMonth(cards);
    const item = cards.find((x) => x.id === gamingSelectedGameId)
      || monthCards[0]
      || cards[0]
      || {};
    if (item.id && gamingSelectedGameId !== item.id) gamingSelectedGameId = item.id;
    const refs = item.evidence_refs || [];
    return `<article class="module-card gaming-info-card">
      <h2>日历信息 <small>点击游戏查看</small></h2>
      <div class="gaming-info-body">
        <div class="gaming-info-head">
          <b>${item.game_name || "暂无项目"}</b>
          <span class="priority-pill ${priorityClass(item.bd_priority)}">${item.bd_priority || "-"}</span>
        </div>
        <p>${cleanDisplay(item.action_copy || item.bd_reason || item.dynamic_summary || "选择日历或列表中的游戏查看资料。", 118)}</p>
        <dl>
          <dt>归属方</dt><dd>${item.publisher || item.owner || "待补充"}</dd>
          <dt>阶段</dt><dd>${item.current_stage || item.stage || "待补充"}</dd>
          <dt>窗口</dt><dd>${item.estimated_window || item.estimated_date || "TBA"}</dd>
          <dt>类型</dt><dd>${item.calendar_bucket || "待补充"}</dd>
          <dt>信源</dt><dd>${refs.length || (item.primary_source_url ? 1 : 0)} 条 · ${sourceLink(refs[0]?.url || item.primary_source_url)}</dd>
        </dl>
      </div>
    </article>`;
  }

  function renderGamingOverview() {
    const items = gamingItems().slice().sort((a, b) => (a.estimated_date || "9999").localeCompare(b.estimated_date || "9999"));
    const cards = gamingFocusCards();
    const p0 = gamingP0Cards();
    const calendarCards = cards.length ? cards : items;
    return `
      <section class="gaming-layout">
        ${gamingWeeklyNewsPanel(calendarCards)}
        ${gamingInfoPanel(calendarCards)}
        <article class="module-card gaming-calendar-main">
          <h2>日历视图 <small>点击游戏查看信息</small></h2>
          ${gamingMonthCalendar(calendarCards)}
        </article>
      </section>`;
  }

  function renderGamingCalendar() {
    const items = gamingItems().slice().sort((a, b) => {
      const pa = { P0: 0, P1: 1, P2: 2 }[a.bd_priority] ?? 3;
      const pb = { P0: 0, P1: 1, P2: 2 }[b.bd_priority] ?? 3;
      return pa - pb || (a.estimated_date || "9999").localeCompare(b.estimated_date || "9999");
    });
    return `
      <section class="gaming-calendar-full">
        <article class="module-card gaming-full-table">
          <h2>新游日历全表 <small>${items.length} 个项目</small></h2>
          ${compactTable(["游戏", "归属方", "平台", "日历归属", "阶段", "预计窗口", "优先级", "置信度", "最近事件", "信源"], gamingCalendarRows(items, 62), "gaming-calendar-table full")}
        </article>
      </section>`;
  }

  function renderGamingPlayers() {
    const items = gamingItems();
    const owners = Object.entries(items.reduce((acc, item) => {
      const key = item.owner || "待补充";
      acc[key] = acc[key] || { count: 0, p0: 0, titles: [] };
      acc[key].count += 1;
      if (item.bd_priority === "P0") acc[key].p0 += 1;
      acc[key].titles.push(item.game_name);
      return acc;
    }, {})).sort((a, b) => b[1].count - a[1].count).slice(0, 14);
    return `
      <section class="gaming-players-layout">
        <article class="module-card gaming-owner-card">
          <h2>发行/工作室项目池</h2>
          ${compactTable(["归属方", "项目数", "P0", "代表项目"], owners.map(([owner, v]) => `
            <tr>
              <td class="brand-cell" title="${owner}">${owner}</td>
              <td class="num">${v.count}</td>
              <td class="num">${v.p0}</td>
              <td title="${v.titles.join(" / ")}">${textEllipsis(v.titles.slice(0, 3).join(" / "), 42)}</td>
            </tr>`), "gaming-owner-table")}
        </article>
        <article class="module-card gaming-stage-card">
          <h2>阶段字典</h2>
          ${compactTable(["代码", "标签", "入主日历规则", "判断标准"], (gamingCalendar?.stage_dictionary || []).slice(0, 12).map((r) => `
            <tr>
              <td>${r["代码"] || "-"}</td>
              <td>${r["标签"] || "-"}</td>
              <td title="${r["入主日历规则"] || ""}">${textEllipsis(r["入主日历规则"], 18)}</td>
              <td title="${r["判断标准"] || ""}">${textEllipsis(r["判断标准"], 30)}</td>
            </tr>`), "gaming-stage-table")}
        </article>
      </section>`;
  }

  function renderDictionaryOnly(row) {
    const rows = dictionaryRowsFor(row.standard_l1);
    return `
      <section class="market-grid overview-workbench">
        <article class="module-card span-7">
          <h2>市场数据待治理 <small>${row.standard_l1}</small></h2>
          <div class="empty-note">
            ${row.standard_l1} 已按最新行业映射规则作为独立一级行业进入行研 Web。当前只展示行业字典事实，市场规模、玩家格局、产品结构需要等待 governed 聚合底表补齐后生成。
          </div>
        </article>
        <article class="module-card span-5">
          <h2>当前二级行业字典</h2>
          ${compactTable(["二级行业", "状态", "数据源"], rows.map((item) => `
            <tr>
              <td class="brand-cell">${item.standard_l2}</td>
              <td>待接入市场事实</td>
              <td>industry_dictionary_ecommerce</td>
            </tr>`), "dictionary-only-table")}
        </article>
        <article class="module-card span-12">
          <h2>下一步数据动作</h2>
          <div class="event-list">
            <div class="event-row"><b>1</b><span>补齐 Fashion governed 聚合底表源清单</span><em>source layer</em></div>
            <div class="event-row"><b>2</b><span>重生成 amazon_market_facts_monthly / players / products</span><em>portal/data</em></div>
            <div class="event-row"><b>3</b><span>行研 Web 自动从真实市场事实切换为完整页面</span><em>current entry</em></div>
          </div>
        </article>
      </section>`;
  }

  function renderOverview(row) {
    if (isGaming(row)) return renderGamingOverview();
    if (isDictionaryOnly(row)) return renderDictionaryOnly(row);
    const l3 = productsFor(row);
    return `
      <section class="market-grid overview-workbench">
        <article class="module-card card-overview-trend span-5">
          <h2>市场规模趋势 <small>24个月 GMV</small></h2>
          <div class="chart-fixed trend-chart">${lineChart(row, { small: true })}</div>
        </article>
        <article class="module-card card-overview-analysis span-4">
          <h2>市场规模解析</h2>
          ${marketAnalysisCards(row)}
        </article>
        <article class="module-card overview-structure span-3">
          <h2>行业结构摘要</h2>
          ${structureSummary(row, l3)}
        </article>
        <article class="module-card card-seasonal span-7">
          <h2>季节性趋势 <small>2023 / 2024 / 2025</small></h2>
          <div class="chart-fixed">${seasonalChart(row)}</div>
        </article>
        <article class="module-card card-events span-5">
          <h2>行业事件</h2>
          <div class="event-list">${eventRows(row)}</div>
        </article>
      </section>`;
  }

  function renderPlayers(row) {
    if (isGaming(row)) return renderGamingPlayers();
    if (isDictionaryOnly(row)) return renderDictionaryOnly(row);
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
    if (isGaming(row)) return renderGamingCalendar();
    if (isDictionaryOnly(row)) return renderDictionaryOnly(row);
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
    const html = isGaming(row) && currentTab === "calendar" ? renderGamingCalendar()
      : currentTab === "overview" ? renderOverview(row)
      : currentTab === "structure" ? renderStructure(row)
      : renderPlayers(row);
    $(".tab-body").innerHTML = html;
    bindGamingCalendarControls(row);
    requestAnimationFrame(() => renderEcharts(row));
  }

  function bindGamingCalendarControls(row) {
    if (!isGaming(row)) return;
    const monthSelect = $("[data-gaming-month-select]");
    if (monthSelect) monthSelect.addEventListener("change", () => {
      gamingMonthOffset = Number(monthSelect.value || 0);
      gamingSelectedGameId = "";
      renderRight(activeRow());
    });
    $$("[data-gaming-select]").forEach((btn) => btn.addEventListener("click", (event) => {
      if (event.target.closest("a")) return;
      gamingSelectedGameId = btn.dataset.gamingSelect || "";
      renderRight(activeRow());
    }));
    $$("[data-gaming-select][role='button']").forEach((btn) => btn.addEventListener("keydown", (event) => {
      if (!["Enter", " "].includes(event.key)) return;
      event.preventDefault();
      gamingSelectedGameId = btn.dataset.gamingSelect || "";
      renderRight(activeRow());
    }));
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
    $(".data-source").innerHTML = isGaming(row)
      ? "数据来源：<br>新游日历 v0.2<br>portal/data/gaming"
      : isDictionaryOnly(row)
        ? "数据来源：<br>行业字典<br>portal/data/dictionary"
        : `数据来源：<br>Softtime Amazon数据<br>美国站 · ${PERIOD}`;
  }

  async function init() {
    const [m, p, pr, e, d, g, gb] = await Promise.all([
      loadJson("../../data/market/amazon_market_facts_monthly.json"),
      loadJson("../../data/players/amazon_players_monthly.json"),
      loadJson("../../data/products/amazon_products_monthly.json"),
      loadJson("../../data/research/beauty_l2_content_enrichment_v0_1.json"),
      loadJson("../../data/dictionary/industry_dictionary_ecommerce.json"),
      loadJson("../../data/gaming/new_game_calendar_2026_06_08.json"),
      loadJson("../../data/gaming/gaming_calendar_targets_2026_06_09.json"),
    ]);
    market = m.records || [];
    players = p.records || [];
    products = pr.records || [];
    enrichment = e.records || [];
    industryDictionary = Array.isArray(d) ? d : d.records || [];
    gamingCalendar = g || null;
    gamingCalendarBlueprint = gb || null;
    const url = new URLSearchParams(location.search);
    selectedL1 = url.get("l1") || "Beauty";
    selectedL2 = selectedL1 === "Gaming" ? "主版面" : url.get("l2") || l1Rows(selectedL1).find((r) => r.standard_l2 === "面部护理")?.standard_l2 || l1Rows(selectedL1)[0]?.standard_l2 || "面部护理";
    const allowedTabs = selectedL1 === "Gaming" ? ["overview", "calendar"] : ["overview", "structure", "players"];
    currentTab = allowedTabs.includes(url.get("tab")) ? url.get("tab") : "overview";
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
