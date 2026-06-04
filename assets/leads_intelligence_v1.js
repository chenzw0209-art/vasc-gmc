(function () {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const state = { tab: "overview", records: [], selectedId: null };
  const VALID_DATE = /^\d{4}-\d{2}-\d{2}$/;

  function safe(v, fallback = "待补充") {
    const s = String(v ?? "").trim();
    return s && s !== "0000-00-00" ? s : fallback;
  }

  function money(n) {
    n = Number(n || 0);
    if (!n) return "待补充";
    if (n >= 1e9) return "$" + (n / 1e9).toFixed(2) + "B";
    if (n >= 1e6) return "$" + (n / 1e6).toFixed(1) + "M";
    if (n >= 1e3) return "$" + (n / 1e3).toFixed(1) + "K";
    return "$" + n.toFixed(0);
  }

  function short(text, len = 72) {
    text = String(text || "").replace(/\s+/g, " ").trim();
    return text.length > len ? text.slice(0, len - 1) + "…" : text;
  }

  function validDate(x) {
    return VALID_DATE.test(String(x || "")) && x !== "0000-00-00";
  }

  function daysAgo(x) {
    if (!validDate(x)) return Infinity;
    return (new Date("2026-06-04") - new Date(x)) / 86400000;
  }

  function eventType(x) {
    const s = [x.event_type, x.signal_type, x.summary, x.product_action].join(" ");
    if (/展会|CES|IFA|Computex|Expo|exhibition/i.test(s)) return "展会亮相";
    if (/新品|发布|launch|release|unveil/i.test(s)) return "新品发布";
    if (/渠道|Amazon|TikTok|DTC|上线|店铺/i.test(s)) return "渠道扩张";
    if (/政策|合规|监管|标准/i.test(s)) return "行业政策";
    if (/报告|研究|白皮书|market report/i.test(s)) return "市场报告";
    if (/PR|新闻|公告|官宣/i.test(s)) return "品牌PR";
    return "其他";
  }

  function signalType(x) {
    const s = [x.event_type, x.signal_type, x.summary].join(" ");
    if (/展会|CES|IFA|Computex|Expo/i.test(s)) return "展会动态";
    if (/招标|投标|tender|bid/i.test(s)) return "招投标动态";
    if (/政策|监管|合规|标准/i.test(s)) return "行业政策";
    return "客户动态";
  }

  function quality(x) {
    const q = String(x.evidence_grade || x.priority || "").trim();
    if (/高|A/i.test(q)) return "A";
    if (/中|B/i.test(q)) return "B";
    if (/低|C/i.test(q)) return "C";
    return "待判断";
  }

  function typeClass(type) {
    if (type === "客户动态") return "tag-customer";
    if (type === "展会动态") return "tag-expo";
    if (type === "招投标动态") return "tag-tender";
    return "tag-policy";
  }

  function qualityClass(q) {
    if (q === "A") return "tag-a";
    if (q === "B") return "tag-b";
    if (q === "C") return "tag-c";
    return "tag-pending";
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

  function baseRows() {
    const q = ($("#search")?.value || "").toLowerCase().trim();
    const country = $("#country-filter")?.value || "";
    const industry = $("#industry-filter")?.value || "";
    const brand = $("#brand-filter")?.value || "";
    const type = $("#type-filter")?.value || "";
    const ev = $("#event-filter")?.value || "";
    const ql = $("#quality-filter")?.value || "";
    return state.records.filter((x) => {
      if (country && x.country !== country) return false;
      if (industry && x.standard_l2 !== industry) return false;
      if (brand && x.company !== brand) return false;
      if (type && signalType(x) !== type) return false;
      if (ev && eventType(x) !== ev) return false;
      if (ql && quality(x) !== ql) return false;
      if (q && !JSON.stringify(x).toLowerCase().includes(q)) return false;
      return true;
    });
  }

  function tabRows() {
    const rows = baseRows();
    if (state.tab === "customers") return rows.filter((x) => signalType(x) === "客户动态" && x.company);
    if (state.tab === "events") return [];
    if (state.tab === "tenders") return [];
    return rows;
  }

  function fillFilters() {
    const rows = state.records;
    const opts = [
      ["country-filter", unique(rows, (x) => x.country).sort()],
      ["industry-filter", unique(rows, (x) => x.standard_l2).sort()],
      ["brand-filter", unique(rows, (x) => x.company).sort()],
    ];
    opts.forEach(([id, values]) => {
      const el = $("#" + id);
      values.forEach((v) => el.insertAdjacentHTML("beforeend", `<option value="${v}">${v}</option>`));
    });
  }

  function renderKpis(rows) {
    const high = rows.filter((x) => quality(x) === "A").length;
    const recent = rows.filter((x) => daysAgo(x.publish_date) <= 30).length;
    const industries = unique(rows, (x) => x.standard_l2).length;
    const brands = unique(rows, (x) => x.company).length;
    const keyBrands = rows.filter((x) => quality(x) === "A" && x.company).length;
    const cards = [
      ["信号总数", rows.length, "公开情报记录", "tone-blue", "Σ"],
      ["近30日新增信号", recent, "有效事件日期", "tone-green", "+"],
      ["高质量信源", high, "PR质量 A / 高", "tone-purple", "A"],
      ["覆盖行业数", industries, "二级行业去重", "tone-orange", "业"],
      ["覆盖品牌数", brands, "品牌/企业去重", "tone-red", "牌"],
      ["重点关注品牌", keyBrands, "A类品牌信号", "tone-blue", "★"],
    ];
    $("#kpis").innerHTML = cards.map(([k, v, note, tone, icon]) => `
      <article class="kpi-card">
        <div class="kpi-icon ${tone}">${icon}</div>
        <div><div class="kpi-label">${k}</div><div class="kpi-value">${v.toLocaleString("en-US")}</div><div class="kpi-sub">${note}</div></div>
      </article>`).join("");
  }

  function renderTable(rows, target = "signal-table") {
    if (!rows.length) {
      $("#" + target).innerHTML = `<tr><td colspan="11" class="center">当前筛选下暂无可展示情报信号</td></tr>`;
      return;
    }
    $("#" + target).innerHTML = rows.slice(0, 80).map((x) => {
      const st = signalType(x);
      const q = quality(x);
      return `<tr data-id="${x.lead_id}">
        <td><span class="tag ${typeClass(st)}">${st}</span></td>
        <td>${safe(x.country)}</td>
        <td class="industry-cell" title="${safe(x.standard_l2)}">${safe(x.standard_l2)}</td>
        <td class="brand-cell" title="${safe(x.company)}">${safe(x.company, "-")}</td>
        <td class="industry-cell" title="${safe(x.product_action)}">${safe(x.product_action)}</td>
        <td>${safe(x.publish_date)}</td>
        <td><span class="tag tag-b">${eventType(x)}</span></td>
        <td class="event-summary" title="${safe(x.summary)}">${safe(short(x.summary, 110))}</td>
        <td><span class="tag ${qualityClass(q)}">${q}</span></td>
        <td class="num">${money(x.tiktok_13w_gmv)}</td>
        <td>${x.source_url ? `<a href="${x.source_url}" target="_blank" class="link-button">查看信源</a>` : "待补充"}</td>
      </tr>`;
    }).join("");
    $$("#" + target + " tr[data-id]").forEach((tr) => tr.addEventListener("click", () => {
      state.selectedId = tr.dataset.id;
      renderDetail(rows.find((x) => x.lead_id === state.selectedId));
    }));
  }

  function renderDetail(x) {
    x = x || tabRows()[0];
    if (!x) {
      $("#detail").innerHTML = `<div class="placeholder">暂无情报详情</div>`;
      return;
    }
    const st = signalType(x);
    const q = quality(x);
    $("#detail").innerHTML = `
      <div class="intel-detail">
        <div class="detail-section">
          <b>${safe(x.company, "未标注品牌")}</b>
          <p><span class="tag ${typeClass(st)}">${st}</span> <span class="tag ${qualityClass(q)}">${q}</span></p>
        </div>
        <div class="detail-section"><b>一、事件摘要</b><p>事件日期：${safe(x.publish_date)}<br>事件类型：${eventType(x)}<br>${safe(x.summary)}<br>主营品类：${safe(x.product_action)}</p></div>
        <div class="detail-section"><b>二、市场相关性</b><p>一级行业：${safe(x.standard_l1)}<br>二级行业：${safe(x.standard_l2)}<br>国家/地区：${safe(x.country)}<br>底表GMV：${money(x.tiktok_13w_gmv)}</p></div>
        <div class="detail-section"><b>三、证据链</b><p>主信源：${safe(x.source_name)}<br>PR质量：${q}<br>${x.source_url ? `<a href="${x.source_url}" target="_blank" class="link-button">查看原始信源</a>` : "信源链接待补充"}</p></div>
        <div class="detail-section"><b>四、原始记录</b><p>${safe(short([x.event_type, x.signal_type, x.parent_company].filter(Boolean).join(" / "), 150))}</p></div>
      </div>`;
  }

  function renderStats(rows) {
    renderMiniBars("type-bars", countBy(rows, signalType), ["客户动态", "行业政策", "展会动态", "招投标动态"]);
    renderMiniBars("quality-bars", countBy(rows, quality), ["A", "B", "C", "待判断"]);
    const top = Object.entries(countBy(rows, (x) => x.standard_l2)).sort((a, b) => b[1] - a[1]).slice(0, 5);
    renderMiniBars("industry-bars", Object.fromEntries(top), top.map(([k]) => k));
  }

  function renderMiniBars(id, obj, order) {
    const max = Math.max(1, ...Object.values(obj));
    $("#" + id).innerHTML = order.map((k) => {
      const v = obj[k] || 0;
      return `<div class="summary-bar"><span>${k}</span><i><b style="width:${v / max * 100}%"></b></i><strong>${v}</strong></div>`;
    }).join("");
  }

  function renderCharts(rows) {
    renderTrend(rows);
    renderHeatmap(rows);
    const top = Object.entries(countBy(rows, (x) => x.standard_l2)).sort((a, b) => b[1] - a[1]).slice(0, 10);
    renderMiniBars("industry-top10", Object.fromEntries(top), top.map(([k]) => k));
  }

  function renderTrend(rows) {
    const by = countBy(rows.filter((x) => validDate(x.publish_date)), (x) => x.publish_date.slice(5));
    const keys = Object.keys(by).sort().slice(-30);
    const max = Math.max(1, ...keys.map((k) => by[k]));
    $("#signal-trend").innerHTML = keys.map((k) => `<div class="trend-bar" title="${k}: ${by[k]}"><i style="height:${Math.max(6, by[k] / max * 100)}%"></i><span>${k.slice(3)}</span></div>`).join("");
  }

  function renderHeatmap(rows) {
    const countries = unique(rows, (x) => x.country).slice(0, 6);
    const industries = Object.entries(countBy(rows, (x) => x.standard_l2)).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k]) => k);
    const counts = {};
    rows.forEach((x) => {
      const key = `${x.country}|${x.standard_l2}`;
      counts[key] = (counts[key] || 0) + 1;
    });
    const max = Math.max(1, ...Object.values(counts));
    $("#heatmap").innerHTML = `
      <div class="heatmap-grid" style="grid-template-columns:120px repeat(${industries.length},1fr)">
        <div></div>${industries.map((i) => `<b title="${i}">${short(i, 8)}</b>`).join("")}
        ${countries.map((c) => `<strong>${c}</strong>${industries.map((i) => {
          const v = counts[`${c}|${i}`] || 0;
          const a = v ? 0.18 + v / max * 0.72 : 0.04;
          return `<span style="background:rgba(37,99,235,${a})" title="${c} / ${i}: ${v}">${v || ""}</span>`;
        }).join("")}`).join("")}
      </div>`;
  }

  function renderOverview() {
    const rows = tabRows();
    renderKpis(rows);
    const topRows = [...rows].sort((a, b) => quality(a).localeCompare(quality(b))).slice(0, 10);
    $("#tab-body").innerHTML = `
      <section class="leads-main">
        <div class="leads-row leads-row-1">
          <article class="card table-card-md"><h2>情报线索列表 <small>公开可验证信号</small></h2><div class="table-scroll"><table class="data-table intel-table"><thead>${tableHead()}</thead><tbody id="signal-table"></tbody></table></div></article>
          <article class="card detail-card"><h2>情报详情</h2><div id="detail"></div></article>
        </div>
        <div class="leads-row leads-row-2">
          <article class="card chart-card-sm"><h2>信号类型分布</h2><div id="type-bars" class="mini-bars"></div></article>
          <article class="card chart-card-sm"><h2>PR质量分布</h2><div id="quality-bars" class="mini-bars"></div></article>
          <article class="card chart-card-sm"><h2>行业分布Top5</h2><div id="industry-bars" class="mini-bars"></div></article>
        </div>
        <div class="leads-row leads-row-2">
          <article class="card chart-card-sm"><h2>近30日信号趋势</h2><div id="signal-trend" class="trend-bars"></div></article>
          <article class="card chart-card-sm"><h2>行业分布Top10</h2><div id="industry-top10" class="mini-bars"></div></article>
          <article class="card chart-card-sm"><h2>国家 × 行业热力图</h2><div id="heatmap"></div></article>
        </div>
      </section>`;
    renderTable(topRows);
    renderDetail(topRows[0]);
    renderStats(rows);
    renderCharts(rows);
  }

  function tableHead() {
    return `<tr>
      <th style="width:82px">信号类型</th><th style="width:72px">国家/地区</th><th style="width:130px">二级行业</th><th style="width:150px">品牌/企业</th><th style="width:160px">主营品类</th><th style="width:92px">事件日期</th><th style="width:88px">事件类型</th><th>事件摘要</th><th style="width:72px">PR质量</th><th style="width:96px" class="num">底表GMV</th><th style="width:86px">信源</th>
    </tr>`;
  }

  function renderCustomers() {
    const rows = tabRows();
    renderKpis(rows);
    $("#tab-body").innerHTML = `
      <section class="leads-main">
        <div class="leads-row leads-row-1">
          <article class="card table-card-md"><h2>重点关注品牌列表</h2><div class="table-scroll"><table class="data-table intel-table"><thead>${tableHead()}</thead><tbody id="signal-table"></tbody></table></div></article>
          <article class="card detail-card"><h2>品牌事件详情</h2><div id="detail"></div></article>
        </div>
        <div class="leads-row leads-row-2">
          <article class="card chart-card-sm"><h2>品牌GMV分布</h2><div id="signal-trend" class="trend-bars"></div></article>
          <article class="card chart-card-sm"><h2>行业分布Top10</h2><div id="industry-top10" class="mini-bars"></div></article>
          <article class="card chart-card-sm"><h2>PR质量分布</h2><div id="quality-bars" class="mini-bars"></div></article>
        </div>
      </section>`;
    renderTable(rows);
    renderDetail(rows[0]);
    renderCharts(rows);
    renderMiniBars("quality-bars", countBy(rows, quality), ["A", "B", "C", "待判断"]);
  }

  function renderEmpty(label) {
    renderKpis(baseRows());
    $("#tab-body").innerHTML = `<div class="card"><h2>${label}</h2><div class="placeholder">当前阶段保留结构，等待公域${label}数据接入。</div></div>`;
  }

  function renderAll() {
    $$(".tab").forEach((b) => b.classList.toggle("active", b.dataset.tab === state.tab));
    if (state.tab === "customers") renderCustomers();
    else if (state.tab === "events") renderEmpty("展会动态");
    else if (state.tab === "tenders") renderEmpty("招投标动态");
    else renderOverview();
  }

  async function init() {
    const json = await loadJson("../../data/leads/lead_events.json");
    state.records = (json.records || json).filter((x) => x.standard_l1 === "Consumer Tech");
    fillFilters();
    $$(".tab").forEach((b) => b.addEventListener("click", () => { state.tab = b.dataset.tab; renderAll(); }));
    ["search", "country-filter", "industry-filter", "brand-filter", "type-filter", "event-filter", "quality-filter"].forEach((id) => $("#" + id).addEventListener("input", renderAll));
    $("#reset").addEventListener("click", () => {
      ["search", "country-filter", "industry-filter", "brand-filter", "type-filter", "event-filter", "quality-filter"].forEach((id) => $("#" + id).value = "");
      renderAll();
    });
    renderAll();
  }

  init().catch((e) => {
    $("#tab-body").innerHTML = `<div class="card"><h2>加载失败</h2><p>${e.message}</p></div>`;
  });
})();
