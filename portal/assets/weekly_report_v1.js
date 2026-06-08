(function () {
  const state = {
    content: null,
    industrySupply: null,
    selected: null,
    marketLoaded: false,
  };
  const $ = (selector) => document.querySelector(selector);

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
    const productCount = rows.filter((row) => row.titan_category === "EC").length;
    const appCount = rows.length - productCount;
    const gradeACount = rows.filter((row) => row.source_grade === "A").length;
    const cards = [
      ["本周关注客户数", rows.length, "本周检索客户", "客", "tone-blue"],
      ["本周新增客户信号", weekly.kpis.new_customer_signal_count || rows.length, "候选情报记录", "新", "tone-green"],
      ["商品候选", productCount, "实物商品方向", "商", "tone-orange"],
      ["应用候选", appCount, "App / 游戏 / 平台", "应", "tone-purple"],
      ["A级信源", gradeACount, "官方/硬证据", "A", "tone-green"],
      ["重点展会", exhibitions.length, "W24/W25窗口", "展", "tone-blue"],
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
    const industries = [...new Set(allRows().map((row) => safe(row.standard_l2, "")).filter(Boolean))];
    select.innerHTML = industries.map((name) => `<option value="${name}">${name}</option>`).join("");
    select.value = safe(state.selected?.standard_l2, industries[0] || "");
    select.onchange = () => {
      const match = allRows().find((row) => row.standard_l2 === select.value);
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
                <td><span class="l1-pill">${safe(row.standard_l1)}</span></td>
                <td><button class="industry-link" data-index="${index}" title="${safe(row.standard_l2)}">${safe(row.standard_l2)}</button></td>
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
    const signals = (brief?.growth_signals_short || ["待录入"]).slice(0, 4);
    const conclusion = brief?.industry_conclusion || (brief ? "行业结论待补充" : "待录入");

    $("#industry-brief-title").textContent = "本周关注行业";
    $("#industry-brief").innerHTML = `
      <div class="industry-brief-grid">
        <section class="brief-panel">
          <div class="brief-title">${industryLabel(selected)}</div>
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
          <div class="brief-title">增长信号（近90天）</div>
          <div class="brief-conclusion">${shortText(conclusion, 72)}</div>
          <div class="brief-list">
            ${signals.map((item) => `<div class="brief-list-item">${shortText(item, 30)}</div>`).join("")}
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
              <th class="col-event-name">展会名称（展会/会议）</th>
              <th class="col-location">地点</th>
              <th class="col-event-date">日期</th>
              <th class="col-event-value">展会窗口价值</th>
              <th class="col-link">报名通道</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map((row) => `
              <tr>
                <td>${safe(row.event_window)}</td>
                <td title="${safe(row.industry)}">${safe(row.industry)}</td>
                <td title="${safe(row.event_name)}">${safe(row.event_name)}</td>
                <td>${safe(row.location)}</td>
                <td>${safe(row.date)}</td>
                <td title="${safe(row.window_value)}">${safe(row.window_value)}</td>
                <td><a class="inline-link" href="${safe(row.url, "#")}" target="_blank" rel="noreferrer">跳转</a></td>
              </tr>
            `).join("") || "<tr><td colspan=\"7\">暂无展会记录</td></tr>"}
          </tbody>
        </table>
      </div>`;
  }

  function similarRows(candidateId) {
    return state.content.weekly_module_content.similar_customers_by_candidate[candidateId] || [];
  }

  function renderSimilarCustomers() {
    const selected = state.selected || allRows()[0] || {};
    const rows = similarRows(selected.candidate_id).slice(0, 5);
    $("#similar-title").textContent = `同类客户（${industryLabel(selected)}）`;
    $("#similar-customers").innerHTML = `
      <div class="table-fit">
        <table class="data-table similar-table">
          <thead>
            <tr><th>品牌/企业</th><th>国家</th><th>主营品类</th><th>最近事件</th><th>事件时间</th><th>信源</th></tr>
          </thead>
          <tbody>
            ${rows.map((row) => `
              <tr>
                <td title="${safe(row.owner_company_brand)}">${ownerName(row)}</td>
                <td>${/美国|US|Amazon/i.test(row.target_market_channel || "") ? "美国" : "全球"}</td>
                <td title="${safe(row.standard_l2)}">${shortText(row.standard_l2, 10)}</td>
                <td title="${safe(row.dynamic_summary)}">${safe(row.dynamic_summary)}</td>
                <td>${dateShort(row.dynamic_date)}</td>
                <td><span class="tag tag-a">${safe(row.source_grade)}</span></td>
              </tr>
            `).join("") || "<tr><td colspan=\"6\">暂无同类客户</td></tr>"}
          </tbody>
        </table>
      </div>`;
  }

  function activateView(view) {
    document.querySelectorAll(".portal-view").forEach((panel) => panel.classList.toggle("active", panel.id === `${view}-view`));
    document.querySelectorAll("[data-view-link]").forEach((link) => link.classList.toggle("active", link.dataset.viewLink === view));
    if (view === "market") loadMarketView();
  }

  function loadMarketView() {
    if (state.marketLoaded) return;
    state.marketLoaded = true;
    $("#market-view").innerHTML = `<div class="market-loading">行业研究加载中…</div>`;
    fetch("./pages/market/")
      .then((response) => response.text())
      .then((html) => {
        const doc = new DOMParser().parseFromString(html, "text/html");
        const inlineStyle = [...doc.querySelectorAll("style")].map((style) => style.textContent).join("\n");
        if (!document.querySelector("#embedded-market-style")) {
          const style = document.createElement("style");
          style.id = "embedded-market-style";
          style.textContent = inlineStyle.replace(/body\s*\{[\s\S]*?\}/g, "");
          document.head.appendChild(style);
        }
        const shell = doc.querySelector(".research-shell");
        $("#market-view").innerHTML = shell ? shell.outerHTML : `<div class="market-loading">行业研究加载失败</div>`;
        window.PAGE_TYPE = "industry-research";
        patchEmbeddedMarketPaths();
        return loadScriptOnce("./assets/vendor/echarts.min.js", "embedded-echarts")
          .then(() => loadScriptOnce("./assets/industry_research_page_v1.js", "embedded-industry-script"))
          .then(() => initEmbeddedMarketSelectors());
      })
      .catch((error) => {
        $("#market-view").innerHTML = `<div class="market-loading">行业研究加载失败：${error.message}</div>`;
      });
  }

  function loadScriptOnce(src, id) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`#${id}`);
      if (existing) {
        resolve();
        return;
      }
      const script = document.createElement("script");
      script.id = id;
      script.src = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`无法加载 ${src}`));
      document.body.appendChild(script);
    });
  }

  function patchEmbeddedMarketPaths() {
    if (window.__marketLoadJsonPatched || typeof window.loadJson !== "function") return;
    const originalLoadJson = window.loadJson;
    window.loadJson = (path) => {
      const rewritten = String(path)
        .replace(/^\.\.\/\.\.\/data\//, "./data/")
        .replace(/^\.\.\/data\//, "./data/");
      return originalLoadJson(rewritten);
    };
    window.__marketLoadJsonPatched = true;
  }

  function initEmbeddedMarketSelectors() {
    const root = $("#market-view");
    if (!root) return;
    waitForMarketTree().then(() => {
      if (root.querySelector(".market-select-bar")) return;
      const main = root.querySelector(".research-main");
      if (!main) return;
      main.insertAdjacentHTML("afterbegin", `
        <div class="market-select-bar">
          <select id="embedded-market-l1" class="market-select" aria-label="一级行业"></select>
          <select id="embedded-market-l2" class="market-select wide" aria-label="二级行业"></select>
        </div>
      `);
      const l1Select = root.querySelector("#embedded-market-l1");
      const l2Select = root.querySelector("#embedded-market-l2");

      const l1Label = {
        Beauty: "Beauty",
        "Consumer Tech": "3C",
        FMCG: "FMCG",
        Health: "Health",
        Lifestyle: "Life",
      };

      const refreshOptions = () => {
        const l1Buttons = [...root.querySelectorAll(".tree-l1")];
        const activeL2 = root.querySelector(".tree-l2.active");
        const activeL1 = activeL2?.dataset.l1 || root.querySelector(".tree-group.open .tree-l1")?.dataset.l1 || l1Buttons[0]?.dataset.l1 || "";
        l1Select.innerHTML = l1Buttons.map((button) => `<option value="${button.dataset.l1}">${l1Label[button.dataset.l1] || button.dataset.l1}</option>`).join("");
        l1Select.value = activeL1;
        const l2Buttons = [...root.querySelectorAll(`.tree-l2[data-l1="${cssEscape(activeL1)}"]`)];
        l2Select.innerHTML = l2Buttons.map((button) => `<option value="${button.dataset.l2}">${button.textContent.trim()}</option>`).join("");
        l2Select.value = activeL2?.dataset.l2 || l2Buttons[0]?.dataset.l2 || "";
      };

      l1Select.addEventListener("change", () => {
        root.querySelector(`.tree-l1[data-l1="${cssEscape(l1Select.value)}"]`)?.click();
        setTimeout(refreshOptions, 0);
      });
      l2Select.addEventListener("change", () => {
        root.querySelector(`.tree-l2[data-l1="${cssEscape(l1Select.value)}"][data-l2="${cssEscape(l2Select.value)}"]`)?.click();
        setTimeout(refreshOptions, 0);
      });
      root.addEventListener("click", (event) => {
        if (event.target.closest(".tree-l1, .tree-l2")) setTimeout(refreshOptions, 0);
      });
      refreshOptions();
    });
  }

  function waitForMarketTree() {
    return new Promise((resolve) => {
      let tries = 0;
      const tick = () => {
        if ($("#market-view .tree-l1") && $("#market-view .tree-l2")) {
          resolve();
          return;
        }
        tries += 1;
        if (tries > 80) {
          resolve();
          return;
        }
        setTimeout(tick, 100);
      };
      tick();
    });
  }

  function cssEscape(value) {
    if (window.CSS?.escape) return CSS.escape(value);
    return String(value).replace(/["\\]/g, "\\$&");
  }

  function wireViewNavigation() {
    document.querySelectorAll("[data-view-link]").forEach((link) => {
      link.addEventListener("click", (event) => {
        event.preventDefault();
        activateView(link.dataset.viewLink);
        history.replaceState(null, "", link.getAttribute("href"));
      });
    });
    activateView(location.hash === "#market" ? "market" : "weekly");
  }

  function renderAll() {
    state.selected = state.selected || allRows()[0] || null;
    renderSalesFocus();
    syncIndustrySelect();
    renderCustomerTable();
    renderIndustryBrief();
    renderEventWindows();
    renderSimilarCustomers();
    wireViewNavigation();
  }

  async function init() {
    const [content, industrySupply] = await Promise.all([
      loadJson("./data/weekly/weekly_leads_content_2026_W24.json"),
      loadJson("./data/weekly/industry_brief_supply_2026_W24.json"),
    ]);
    state.content = content;
    state.industrySupply = industrySupply;
    renderAll();
  }

  init().catch((error) => {
    $(".weekly-content").insertAdjacentHTML("beforeend", `<article class="data-card"><h2 class="card-title">加载失败</h2><p>${error.message}</p></article>`);
  });
})();
