(function () {
  const state = {
    content: null,
    industrySupply: null,
    selected: null,
    marketLoaded: false,
    activeWeek: "W30",
  };
  const $ = (selector) => document.querySelector(selector);
  const WEEK_FILES = {
    W30: {
      leads: "./data/weekly/weekly_leads_content_2026_W30.json?v=20260720-weekly-w30",
      industry: null,
    },
    W29: {
      leads: "./data/weekly/weekly_leads_content_2026_W29.json?v=20260713-weekly-w29",
      industry: "./data/weekly/industry_brief_supply_2026_W29.json?v=20260713-weekly-w29",
    },
    W28: {
      leads: "./data/weekly/weekly_leads_content_2026_W28.json?v=20260706-weekly-w28-copyfix2",
      industry: "./data/weekly/industry_brief_supply_2026_W28.json?v=20260706-weekly-w28-copyfix2",
    },
    W27: {
      leads: "./data/weekly/weekly_leads_content_2026_W27.json?v=20260629-weekly-w27",
      industry: "./data/weekly/industry_brief_supply_2026_W27.json?v=20260629-weekly-w27",
    },
    W26: {
      leads: "./data/weekly/weekly_leads_content_2026_W26.json?v=20260622-weekly-w26",
      industry: "./data/weekly/industry_brief_supply_2026_W26.json?v=20260622-weekly-w26",
    },
    W25: {
      leads: "./data/weekly/weekly_leads_content_2026_W25.json?v=20260616-weekly-i",
      industry: "./data/weekly/industry_brief_supply_2026_W25.json?v=20260616-weekly-i",
    },
    W24: {
      leads: "./data/weekly/weekly_leads_content_2026_W24.json?v=20260608-weekly-h",
      industry: "./data/weekly/industry_brief_supply_2026_W24.json?v=20260608-weekly-h",
    },
  };

  function safe(value, fallback = "待补") {
    const text = String(value ?? "").trim();
    return text || fallback;
  }

  function shortText(value, max = 80) {
    const text = safe(value, "").replace(/\s+/g, " ");
    return text.length > max ? `${text.slice(0, max - 1)}…` : text;
  }

  const supplierAlias = {
    "Alibaba International Digital Commerce Group": "Alibaba",
    "Dreame Technology": "Dreame",
    "Manjuu / Yostar": "Manjuu/Yostar",
    "ANTGAMER / HKC": "ANTGAMER/HKC",
  };

  function ownerName(row) {
    const raw = safe(row.owner_company_brand, "-");
    if (/Dreame/i.test(raw)) return "Dreame";
    if (/Roborock/i.test(raw)) return "Roborock";
    if (/Tineco/i.test(raw)) return "Tineco";
    if (/AliExpress|Alibaba/i.test(raw)) return "AliExpress";
    if (/Manjuu|Yostar/i.test(raw)) return "Manjuu/Yostar";
    if (/ANTGAMER|HKC/i.test(raw)) return "ANTGAMER/HKC";
    return supplierAlias[raw] || shortText(raw, 24);
  }

  function dateShort(value) {
    const text = safe(value, "");
    const match = text.match(/(\d{4})-(\d{2})-(\d{2})/);
    return match ? `${match[2]}-${match[3]}` : shortText(text, 12);
  }

  function externalLink(value) {
    const text = safe(value, "");
    return /^https?:\/\//i.test(text) ? text : "";
  }

  function allRows() {
    return state.content.leads_module_content?.records || state.content.weekly_module_content.focus_customers || [];
  }

  function industryKey(row) {
    return `${safe(row.standard_l1)}|${safe(row.standard_l2)}`;
  }

  function industryBrief(row) {
    const key = industryKey(row || {});
    return (state.industrySupply?.industries || []).find((item) => item.industry_key === key)
      || (state.industrySupply?.industries || []).find((item) => item.secondary_industry === row?.standard_l2)
      || null;
  }

  function industryLabel(row) {
    return safe(row.standard_l2);
  }

  function renderSalesFocus() {
    const weekly = state.content.weekly_module_content;
    const rows = allRows();
    const exhibitions = state.content.exhibition_window_content || [];
    const tenders = state.content.tender_opportunity_content || [];
    const productCount = rows.filter((row) => row.titan_category === "EC").length;
    const appCount = rows.length - productCount;
    const gradeACount = rows.filter((row) => row.source_grade === "A").length;
    const cards = [
      ["本周关注客户数", rows.length, "本周检索客户", "客", "tone-blue"],
      ["本周新增客户信号", weekly.kpis.new_customer_signal_count || rows.length, "候选情报记录", "新", "tone-green"],
      ["商品候选", productCount, "实物商品方向", "商", "tone-orange"],
      ["应用候选", appCount, "App / 游戏 / 平台", "应", "tone-purple"],
      ["A级信源", gradeACount, "官方/硬证据", "A", "tone-green"],
      ["重点展会", exhibitions.length, `${state.activeWeek}窗口`, "展", "tone-blue"],
      ["招投标线索", tenders.length, "海外营销相关项目", "标", "tone-orange"],
    ];

    $("#sales-focus").innerHTML = `
      <article class="sales-focus-card">
        <h2 class="sales-focus-title">本周销售重点</h2>
        <div class="sales-focus-grid">
          ${cards.map(([label, value, sub, icon, tone]) => `
            <div class="focus-metric">
              <span class="focus-icon ${tone}">${icon}</span>
              <div class="focus-copy">
                <div class="focus-label">${label}</div>
                <div class="focus-value">${value}</div>
                <div class="focus-sub">${sub}</div>
              </div>
            </div>
          `).join("")}
          <div class="week-summary-box">
            <div class="week-summary-title">本周摘要</div>
            <div class="week-summary-text" title="${safe(weekly.top_summary)}">${safe(weekly.top_summary)}</div>
          </div>
        </div>
      </article>`;
  }

  function syncIndustrySelect() {
    const select = $("#industry-filter");
    if (!select) return;
    const options = [];
    const seen = new Set();
    for (const row of allRows()) {
      const value = industryKey(row);
      if (seen.has(value)) continue;
      seen.add(value);
      options.push({ value, label: `${safe(row.standard_l1)} / ${safe(row.standard_l2, "-")}` });
    }
    select.innerHTML = options.map((item) => `<option value="${item.value}">${item.label}</option>`).join("");
    select.value = industryKey(state.selected || allRows()[0] || {});
    select.onchange = () => {
      const match = allRows().find((row) => industryKey(row) === select.value);
      state.selected = match || state.selected;
      renderIndustryBrief();
      renderSimilarCustomers();
    };
  }

  function renderCustomerTable() {
    const rows = allRows();
    $("#customer-table").innerHTML = `
      <div class="table-fit">
        <table class="data-table weekly-customer-table">
          <thead>
            <tr>
              <th class="col-rank">#</th>
              <th class="col-titan">钛动分类</th>
              <th class="col-industry">一级行业</th>
              <th class="col-category">二级行业</th>
              <th class="col-l3">三级品类</th>
              <th class="col-company">背后公司</th>
              <th class="col-type">动态类型</th>
              <th class="col-summary">动态摘要</th>
              <th class="col-date">动态日期</th>
              <th class="col-attention">建议关注点</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map((row, index) => `
              <tr data-index="${index}">
                <td class="num">${index + 1}</td>
                <td><span class="l1-pill">${safe(row.titan_category)}</span></td>
                <td><button class="industry-link" data-index="${index}" title="${safe(row.standard_l1)}">${safe(row.standard_l1)}</button></td>
                <td title="${safe(row.standard_l2, "-")}">${safe(row.standard_l2, "-")}</td>
                <td title="${safe(row.standard_l3)}">${safe(row.standard_l3)}</td>
                <td title="${safe(row.owner_company_brand)}">${ownerName(row)}</td>
                <td title="${safe(row.dynamic_type)}">${safe(row.dynamic_type)}</td>
                <td title="${safe(row.dynamic_summary)}">${safe(row.dynamic_summary)}</td>
                <td>${dateShort(row.dynamic_date)}</td>
                <td title="${safe(row.attention_point)}">${safe(row.attention_point)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>`;

    $("#customer-table").querySelectorAll("tbody tr, .industry-link").forEach((element) => {
      element.addEventListener("click", () => {
        const index = Number(element.dataset.index ?? element.closest("tr")?.dataset.index);
        state.selected = rows[index] || state.selected;
        syncIndustrySelect();
        renderIndustryBrief();
        renderSimilarCustomers();
      });
    });
  }

  function renderIndustryBrief() {
    const selected = state.selected || allRows()[0] || {};
    const brief = industryBrief(selected);
    const metrics = brief?.metrics || {};
    const signals = (brief?.growth_signals_short || ["待录入"]).slice(0, 5);
    const verifications = (brief?.verification_metrics || []).slice(0, 4);
    const visual = brief?.visual_summary || {};
    const conclusion = brief?.industry_conclusion || (brief ? "行业结论待补充" : "待录入");
    const stage = brief?.current_stage || brief?.coverage_status || "待录入";
    const variable = brief?.main_variable || visual.signal_line || conclusion;

    $("#industry-brief-title").textContent = "本周关注行业";
    $("#industry-brief").innerHTML = `
      <div class="industry-brief-grid">
        <section class="brief-panel">
          <div class="brief-title">${safe(visual.title, industryLabel(selected))}</div>
          <div class="brief-metric-label">行业GMV</div>
          <div class="brief-metric-value">${safe(metrics.gmv)}</div>
          <div class="brief-metric-label">YoY增长率</div>
          <div class="brief-metric-value small">${safe(metrics.yoy_growth)}</div>
          <div class="brief-metric-label">CN品牌GMV占比</div>
          <div class="brief-metric-value small">${safe(metrics.cn_gmv_share)}</div>
          <div class="brief-metric-label">Top中国玩家</div>
          <div class="brief-metric-value small">${safe(metrics.top_cn_player)}</div>
        </section>
        <section class="brief-panel">
          <div class="brief-title">核心判断</div>
          <div class="brief-kv"><span>阶段</span><b>${shortText(stage, 24)}</b></div>
          <div class="brief-kv brief-kv-variable"><span>变量</span><b>${shortText(variable, 78)}</b></div>
          <div class="brief-conclusion">${shortText(conclusion, 96)}</div>
          <div class="brief-list">
            ${signals.map((item) => `<div class="brief-list-item">${shortText(item, 30)}</div>`).join("")}
          </div>
        </section>
        <section class="brief-panel">
          <div class="brief-title">验证信号</div>
          <div class="brief-conclusion">${shortText(visual.risk_line || brief?.counter_signals?.[0] || "持续跟踪公开数据与客户动作。", 72)}</div>
          <div class="brief-list">
            ${(verifications.length ? verifications : ["待录入验证指标"]).map((item) => `<div class="brief-list-item">${shortText(item, 32)}</div>`).join("")}
          </div>
        </section>
      </div>`;
  }

  function renderEventWindows() {
    const rows = state.content.exhibition_window_content || [];
    $("#event-windows").innerHTML = `
      <div class="table-fit event-table-fit">
        <table class="data-table event-table">
          <thead>
            <tr>
              <th class="col-window">展会时间窗</th>
              <th class="col-event-industry">行业</th>
              <th class="col-event-date">日期</th>
              <th class="col-location">地点</th>
              <th class="col-link">报名</th>
              <th class="col-event-name">展会名称（展会/会议）</th>
              <th class="col-event-value">参加这个展会能获得什么</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map((row) => `
              <tr>
                <td>${safe(row.event_window)}</td>
                <td title="${safe(row.industry)}">${safe(row.industry)}</td>
                <td>${safe(row.date)}</td>
                <td>${safe(row.location)}</td>
                <td><a class="inline-link" href="${safe(row.url, "#")}" target="_blank" rel="noreferrer">打开</a></td>
                <td title="${safe(row.event_name)}">${safe(row.event_name)}</td>
                <td title="${safe(row.event_value, "")}">${safe(row.event_value, "待补充")}</td>
              </tr>
            `).join("") || "<tr><td colspan=\"7\">暂无展会记录</td></tr>"}
          </tbody>
        </table>
      </div>`;
  }

  function renderTenderOpportunities() {
    const rows = state.content.tender_opportunity_content || [];
    $("#tender-opportunities").innerHTML = `
      <div class="table-fit tender-table-fit">
        <table class="data-table tender-table">
          <thead>
            <tr>
              <th class="col-tender-id">#</th>
              <th class="col-tender-project">项目名</th>
              <th class="col-tender-publisher">发布方</th>
              <th class="col-tender-scope">业务范畴</th>
              <th class="col-tender-period">投标周期</th>
              <th class="col-tender-budget">预算规模</th>
              <th class="col-tender-link">原始链接</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map((row) => `
              <tr>
                <td>${safe(row.tender_id)}</td>
                <td title="${safe(row.project_name)}">${safe(row.project_name)}</td>
                <td title="${safe(row.publisher)}">${safe(row.publisher)}</td>
                <td title="${safe(row.business_scope)}">${safe(row.business_scope)}</td>
                <td title="${safe(row.bid_period)}">${safe(row.bid_period)}</td>
                <td>${safe(row.budget, "没披露")}</td>
                <td>${externalLink(row.url) ? `<a class="inline-link" href="${externalLink(row.url)}" target="_blank" rel="noreferrer">打开</a>` : "没披露"}</td>
              </tr>
            `).join("") || "<tr><td colspan=\"7\">暂无招投标记录</td></tr>"}
          </tbody>
        </table>
      </div>`;
  }

  function similarRows(candidateId) {
    return state.content.weekly_module_content.similar_customers_by_candidate[candidateId] || [];
  }

  function renderSimilarCustomers() {
    const selected = state.selected || allRows()[0] || {};
    const rows = similarRows(selected.candidate_id).slice(0, 4);
    $("#similar-title").textContent = `同类客户（${industryLabel(selected)}）`;
    $("#similar-customers").innerHTML = `
      <div class="similar-lite-list">
        ${rows.map((row) => `
          <div class="similar-lite-item">
            <div class="similar-lite-top">
              <b title="${safe(row.owner_company_brand)}">${ownerName(row)}</b>
              <span class="tag tag-a">${safe(row.source_grade)}</span>
            </div>
            <div class="similar-lite-event" title="${safe(row.dynamic_summary)}">${shortText(row.dynamic_summary, 42)}</div>
            <div class="similar-lite-meta">${dateShort(row.dynamic_date)} · ${shortText(row.standard_l2, 12)}</div>
          </div>
        `).join("") || "<div class=\"similar-empty\">暂无同类客户，待补充</div>"}
      </div>`;
  }

  function wireWeekSelector() {
    const selector = $(".week-selector");
    if (!selector || selector.dataset.bound === "true") return;
    selector.dataset.bound = "true";
    selector.addEventListener("change", () => {
      loadWeek(selector.value || "W27").catch((error) => {
        $(".weekly-content").insertAdjacentHTML("beforeend", `<article class="data-card"><h2 class="card-title">加载失败</h2><p>${error.message}</p></article>`);
      });
    });
  }

  function renderAll() {
    state.selected = state.selected || allRows()[0] || null;
    renderSalesFocus();
    syncIndustrySelect();
    renderCustomerTable();
    renderIndustryBrief();
    renderEventWindows();
    renderTenderOpportunities();
    renderSimilarCustomers();
  }

  async function loadWeek(week) {
    const files = WEEK_FILES[week] || WEEK_FILES.W29;
    const [content, industrySupply] = await Promise.all([
      loadJson(files.leads),
      files.industry ? loadJson(files.industry) : Promise.resolve({ industries: [] }),
    ]);
    state.content = content;
    state.industrySupply = industrySupply;
    state.selected = null;
    state.activeWeek = week;
    renderAll();
  }

  async function init() {
    wireWeekSelector();
    const selector = $(".week-selector");
    await loadWeek(selector?.value || state.activeWeek);
  }

  init().catch((error) => {
    $(".weekly-content").insertAdjacentHTML("beforeend", `<article class="data-card"><h2 class="card-title">加载失败</h2><p>${error.message}</p></article>`);
  });
})();
