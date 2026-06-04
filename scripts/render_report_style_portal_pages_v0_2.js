const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

const l1Aliases = {
  "Consumer Electronics": "Consumer Tech"
};

const l2Aliases = {
  Beauty: {
    "护肤与个护": "护肤与个人护理",
    "个人护理": "护肤与个人护理",
    "皮肤护理": "护肤与个人护理",
    "美妆个护综合": "口腔护理",
    "剃须和脱毛": "脱毛与剃须",
    "头发护理": "头发护理/造型",
    "足部、手部和指甲护理": "美甲/手足护理"
  },
  "Consumer Tech": {
    "电子部件": "电子配件/元器件",
    "微胶囊": "游戏外设/电脑周边"
  }
};

const l1Playbooks = {
  Beauty: {
    frame: "Beauty 不能只写“美容仪”。先拆三条主线：护肤/彩妆的内容种草和货架承接，个护电器的参数化测评，口腔/美甲/脱毛的替换周期与高频复购。当前 Amazon US 数据里，护肤与个人护理是规模锚点；美甲、造型工具、脱毛、口腔护理是更容易放大中国供应链和内容投放能力的机会带。",
    signals: [
      "美妆本身要点出来：护肤、彩妆、香水是内容种草最强的入口，medicube、La Roche-Posay、CeraVe 说明 TikTok/Instagram 认知会回到 Amazon 做价格、评价、配送和套装确认。",
      "个护电器不是泛趋势，而是可测评、可对比、可演示的产品带：Ulike/Laifen/TYMO/JOVS/Oclean/Soocas 对应 IPL 脱毛、美发造型、电动牙刷/水牙线，适合用达人测评和新品窗口切入。",
      "美甲/手足护理 CN 占比高，说明供给与运营打法已验证；护肤核心低 CN 渗透，说明品牌壁垒更高，适合找内容爆发或成分/渠道新变量，而不是泛打白牌。"
    ]
  },
  "Consumer Tech": {
    frame: "Consumer Tech 合并原 Consumer Electronics。核心不是 Apple/HP 这类非中国大牌，而是中国玩家在哪些赛道已经能用产品力和内容力开口：Anker/ESR/Ailun/INIU 在手机与充电，DJI 在创作者工具，eufy/aosu/REOLINK 在安防摄像头，Dreame/Roborock/Tineco 在智能清洁，RingConn/Amazfit 在穿戴健康。",
    signals: [
      "电源/储能/充电是当前最明确的增长异动，底表 MoM 高、CN 占比高，Anker、Jackery、EcoFlow、Greenworks 都能作为开场样本。",
      "影像/无人机/创作者工具看新品节奏和内容素材，DJI 的 NAB/新品发布比单纯大盘排名更有 BD 价值。",
      "安防摄像头和智能清洁延续 3C 报告逻辑：无订阅、本地 AI、DIY 安装、CES 新品扩散，是中国品牌从硬件参数走向家庭场景的典型窗口。"
    ]
  },
  Lifestyle: {
    frame: "Lifestyle 要按场景拆，不要泛称家居。厨房餐饮是规模锚点，家居家装、运动户外、家具、园艺和办公文具体现季节、搬家、收纳、户外和家庭组织需求。",
    signals: [
      "厨房餐饮规模大但 MoM 偏弱，适合找咖啡、保温杯、小家电、收纳和餐厨耗材里的结构性机会。",
      "家具、花园园艺/泳池、运动户外增长更明确，适合按春夏季、搬家季、Prime Day 和户外场景提前找客户。",
      "家居家装、家具、艺术手工等 CN 占比高，说明供给侧已经验证，下一步应筛有品牌化和内容素材能力的头部玩家。"
    ]
  },
  Fashion: {
    frame: "Fashion 重点不是泛服装，而是款式周期、上新速度、尺码/退货和内容承接。服饰/时装同时具备规模、增长和 CN 渗透，是比箱包、珠宝、童装更应该先做专题的方向。",
    signals: [
      "服饰/时装规模大且增长强，说明不是单月小盘异动，适合优先做女装、运动服、男装、鞋履的款式池。",
      "CN 渗透高代表上新、供应链和内容素材有验证，但必须看尺码、面料、试穿内容和评价质量。",
      "箱包/珠宝/童装目前规模小或波动更强，先做观察池，不应抢走服饰主线资源。"
    ]
  },
  Health: {
    frame: "Health 看长期复购、合规门槛和刚需场景。营养补剂、家庭健康、医疗器械、母婴护理的打法差异很大，不能只用 GMV 排序。",
    signals: [
      "医疗器械/健康护理增长和 CN 占比都更值得看，家庭健康管理、护理耗材、家用检测设备是可解释的增长线。",
      "营养补剂规模大但 CN 渗透低，说明品牌、成分证据和合规壁垒高，适合找有认证、配方叙事和复购内容的客户。",
      "母婴护理规模稳定但信任壁垒高，适合用安全认证、家庭场景和复购周期，而不是简单价格战。"
    ]
  },
  FMCG: {
    frame: "FMCG 多数细分本月承压，不能泛说增长。要抓低基数增长、渠道变化和高频复购：婴幼儿食品、酒类、咖啡茶、零食糖果分别是不同逻辑。",
    signals: [
      "婴幼儿食品是当前少数正增长细分，但 CN 渗透几乎没有，适合观察而非立刻重投。",
      "酒类 CN 占比较高但规模较小，可能来自器具/包装/周边口径，需要继续核底表定义。",
      "饮料/咖啡茶、零食糖果规模较大但 MoM 下行，适合找新品、订阅、礼盒和渠道变化。"
    ]
  },
  "Auto & Mobility": {
    frame: "Auto & Mobility 目前主要是汽车用品与摩托车配件。机会来自安全、出行、维修、户外和替换件，不是整车叙事。",
    signals: [
      "摩托车及配件规模小但增长更强，KEMIMOTO 这类玩家说明中国供应链可以打细分配件和户外骑行场景。",
      "汽车用品与配件规模大、CN 占比高，适合筛儿童安全座椅、车载配件、维修工具等具体场景。",
      "用户决策更看安全、适配车型、安装和评价，内容要服务参数解释和风险消除。"
    ]
  },
  Gaming: {
    frame: "Gaming 当前只保留主机游戏/电子游戏和外设相关观察，优先看硬件外设、账号/点卡、游戏周边和直播内容场景。",
    signals: [
      "主机游戏本月下行，短期不是大盘增长型机会。",
      "中国玩家更可能在键鼠、手柄、配件、收纳和直播外设切入，而非游戏内容本体。",
      "需要结合新品平台周期和内容社区热度，单看 Amazon GMV 不够。"
    ]
  }
};

const l2Notes = {
  "护肤与个人护理": [
    "这不是三个并列市场：原始口径里的护肤与个护/个人护理/皮肤护理高度重叠，页面统一合并看规模和品牌。",
    "增长不强但规模最大，重点不是追单月增速，而是找内容种草能否转化到 Amazon 货架。",
    "CN 渗透偏低，说明纯护肤品牌壁垒高；可打 medicube/ANUA 式内容爆发，或用工具/套装/成分新叙事切入。"
  ],
  "口腔护理": [
    "原“美妆个护综合”主要由口腔护理产品构成，代表品牌 Philips Sonicare、Oral-B、Aquasonic、Crest，已改为口腔护理。",
    "口腔护理适合讲替换周期：刷头、水牙线、电动牙刷、牙膏/美白形成耗材和家庭套装。",
    "中国玩家 COSLUS、Oclean、Soocas 有产品力窗口，打法应是评测、对比和耗材复购，而不是泛美妆。"
  ],
  "脱毛与剃须": [
    "IPL 脱毛和剃须是可演示、可前后对比的典型内容品类。",
    "Ulike 已有线下活动/PR 和 TikTok 店铺校验，适合作为 Beauty 中国玩家的强开场。",
    "机会不只是女性脱毛，也包括男士剃须、理发工具和家庭替换。"
  ],
  "头发护理/造型": [
    "头发护理要拆成洗护、头皮、造型工具、假发/接发，不是单一洗发水市场。",
    "TYMO、Laifen、Wavytalk 这类中国玩家的价值在造型工具和内容素材，而非洗护低价。",
    "Ulta/DTC/Amazon/TikTok 多渠道内容能证明品牌不是纯铺货。"
  ],
  "美甲/手足护理": [
    "CN 占比高，beetles Gel Polish、modelones、MelodySusie 等说明中国供给和运营已验证。",
    "增长短期偏弱，但这是成熟可筛选的客户池，不是无机会。",
    "适合打新品色系、套装、教程内容、达人联盟和节日礼品。"
  ],
  "手机配件/电源充电": [
    "规模和中国玩家密度都高，Anker、ESR、Ailun、INIU、charmast 是核心样本。",
    "电源/储能/充电 MoM 强，是当前 Consumer Tech 的优先增长线。",
    "决策看协议、功率、安全认证、设备兼容和新品节奏。"
  ],
  "影像/无人机/创作者工具": [
    "DJI 的价值不只是 GMV，而是新品发布和创作者工具内容天然适合传播。",
    "相机/影像/无人机 MoM 为正，CN 占比不低，适合找新品期内容和评测矩阵。",
    "应优先围绕 Osmo、Mic、Action、存储和配件生态找开场。"
  ],
  "智能安防/摄像头": [
    "3C 报告已验证无订阅、本地 AI、4K 夜视、DIY 安装是安防摄像头的核心叙事。",
    "aosu、eufy、REOLINK 是比 Ring/Blink 更适合 BD 的中国/出海玩家。",
    "这个赛道的营销价值在解释技术、TCO 对比和家庭场景，而不是单纯低价。"
  ],
  "智能清洁/家用机器人": [
    "Roborock、Dreame、Tineco、Narwal 的新品节奏和 CES 扩散信号强。",
    "智能清洁从吸尘器向全屋清洁机器人迁移，内容要讲痛点、对比和家庭场景。",
    "适合打新品期、区域上市、媒体背书和高客单测评。"
  ]
};

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
}

function write(file, text) {
  fs.writeFileSync(path.join(root, file), text, "utf8");
}

function normL1(x) {
  return l1Aliases[x] || x || "未命名";
}

function normL2(l1, l2) {
  const n1 = normL1(l1);
  return (l2Aliases[n1] && l2Aliases[n1][l2]) || l2 || "未命名";
}

function money(n) {
  n = Number(n || 0);
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function percent(n) {
  return `${Number(n || 0).toFixed(1)}%`;
}

function uniq(items) {
  return [...new Set(items.filter(Boolean))];
}

function weightedGrowth(rows) {
  const now = rows.reduce((s, x) => s + Number(x.monthly_gmv || 0), 0);
  const prev = rows.reduce((s, x) => s + Number(x.prev_monthly_gmv || x.prev || 0), 0);
  return prev ? ((now - prev) / prev) * 100 : 0;
}

function normalizeRecords() {
  const market = readJson("portal/data/market/amazon_market_facts_monthly.json").records;
  const players = readJson("portal/data/players/amazon_players_monthly.json").records;
  const products = readJson("portal/data/products/amazon_products_monthly.json").records;
  const leadsPayload = readJson("portal/data/leads/lead_events.json");
  const leads = leadsPayload.records || leadsPayload;

  market.forEach((x) => {
    x.normalized_l1 = normL1(x.standard_l1);
    x.normalized_l2 = normL2(x.standard_l1, x.standard_l2);
  });
  players.forEach((x) => {
    x.normalized_l1 = normL1(x.standard_l1);
    x.normalized_l2 = normL2(x.standard_l1, x.standard_l2);
  });
  products.forEach((x) => {
    x.normalized_l1 = normL1(x.standard_l1);
    x.normalized_l2 = normL2(x.standard_l1, x.standard_l2);
  });
  leads.forEach((x) => {
    x.normalized_l1 = normL1(x.standard_l1);
    x.normalized_l2 = normL2(x.standard_l1, x.standard_l2);
  });

  return { market, players, products, leads };
}

function buildResearchPack(data) {
  const l1s = uniq(data.market.map((x) => x.normalized_l1)).sort();
  const byL1 = {};
  for (const l1 of l1s) {
    const rows = data.market.filter((x) => x.normalized_l1 === l1);
    const grouped = groupMarket(rows);
    const pb = l1Playbooks[l1] || {
      frame: `${l1} 暂无历史报告观点，当前仅按规模、MoM、CN占比和代表品牌做事实排序。`,
      signals: [
        "先看规模是否足够支撑专题。",
        "再看 MoM 是否有异动。",
        "最后看 CN 占比和代表玩家判断是否有可拓客户。"
      ]
    };
    byL1[l1] = {
      l1,
      frame: pb.frame,
      signals: pb.signals,
      l2: grouped.map((x) => ({
        l2: x.normalized_l2,
        signals: l2Notes[x.normalized_l2] || autoL2Signals(x),
      }))
    };
  }
  const payload = { generated_at: "2026-06-03", scope: "Amazon US normalized industry research notes", l1_aliases: l1Aliases, l2_aliases: l2Aliases, records: byL1 };
  write("portal/data/research/amazon_us_industry_playbooks_v0_2.json", JSON.stringify(payload, null, 2));
  write("data_assets/curated/research/amazon_us_industry_playbooks_v0_2.json", JSON.stringify(payload, null, 2));
}

function autoL2Signals(row) {
  const signals = [];
  signals.push(`规模：${row.normalized_l2} 当月 GMV ${money(row.monthly_gmv)}，代表品牌 ${row.brands.slice(0, 4).join("、") || "待补"}。`);
  signals.push(`增长：近月 MoM ${percent(row.growth_rate)}，${row.growth_rate >= 5 ? "有明显增长异动，应优先下钻新品/季节/渠道原因" : "短期不是强增长，先看结构变化和客户质量"}。`);
  signals.push(`CN：CN GMV 占比 ${percent(row.cn_share)}，${row.cn_share >= 40 ? "供给侧已验证，适合筛中国头部玩家" : row.cn_share <= 8 ? "中国品牌低渗透，可能是品牌/合规/渠道壁垒，也可能有新切口" : "具备一定中国玩家基础，可继续看代表品牌"}。`);
  return signals;
}

function groupMarket(rows) {
  const map = new Map();
  for (const r of rows) {
    const key = `${r.normalized_l1}|${r.normalized_l2}`;
    if (!map.has(key)) {
      map.set(key, { normalized_l1: r.normalized_l1, normalized_l2: r.normalized_l2, monthly_gmv: 0, gmv: 0, prev_monthly_gmv: 0, cn_monthly_gmv: 0, brands: [], monthly_trend: {}, raw_l2: [] });
    }
    const g = map.get(key);
    g.monthly_gmv += Number(r.monthly_gmv || 0);
    g.gmv += Number(r.gmv || 0);
    g.prev_monthly_gmv += Number(r.prev_monthly_gmv || 0);
    g.cn_monthly_gmv += Number(r.cn_monthly_gmv || 0);
    g.brands.push(...(r.top_brands || []));
    g.raw_l2.push(r.standard_l2);
    Object.entries(r.monthly_trend || {}).forEach(([m, v]) => {
      g.monthly_trend[m] = (g.monthly_trend[m] || 0) + Number(v || 0);
    });
  }
  return [...map.values()].map((x) => ({
    ...x,
    growth_rate: x.prev_monthly_gmv ? ((x.monthly_gmv - x.prev_monthly_gmv) / x.prev_monthly_gmv) * 100 : 0,
    cn_share: x.monthly_gmv ? (x.cn_monthly_gmv / x.monthly_gmv) * 100 : 0,
    brands: uniq(x.brands).slice(0, 8),
    raw_l2: uniq(x.raw_l2),
    l2_signals: l2Notes[x.normalized_l2] || autoL2Signals(x)
  })).sort((a, b) => b.monthly_gmv - a.monthly_gmv);
}

function pageHtml(page) {
  const title = page === "market" ? "市场中心" : page === "players" ? "玩家中心" : "产品中心";
  const active = (id, text, href) => `<a class="${page === id ? "active" : ""}" href="${href}">${text}</a>`;
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} · Amazon US</title>
  <link rel="stylesheet" href="../../assets/portal.css" />
  <style>
    body{overflow:hidden}.shell{height:100vh}.sidebar{height:100vh}.main{display:grid;grid-template-rows:auto minmax(0,1fr);height:100vh}.content{overflow:auto;padding:18px 24px 28px}.toolbar{flex-wrap:wrap}.select{min-width:132px}.scope-line{color:var(--muted);font-size:13px;margin:0 0 14px}.scope-line strong{color:var(--ink)}.decision-strip{display:grid;gap:10px;grid-template-columns:repeat(4,minmax(0,1fr));margin-bottom:14px}.decision-card{background:#fff;border:1px solid var(--line);border-left:4px solid #10b981;border-radius:8px;box-shadow:var(--shadow);padding:13px 14px}.decision-card:nth-child(2){border-left-color:#3b82f6}.decision-card:nth-child(3){border-left-color:#f59e0b}.decision-card:nth-child(4){border-left-color:#8b5cf6}.decision-label{color:var(--brand-dark);font-size:12px;font-weight:800;margin-bottom:6px}.decision-title{font-size:14px;font-weight:760;line-height:1.35;margin-bottom:6px}.decision-body{color:#344054;font-size:12px;line-height:1.55}.grid-kpi{grid-template-columns:repeat(5,minmax(120px,1fr));margin-bottom:14px}.card{min-height:86px;padding:12px 14px}.kpi-value{font-size:22px}.dashboard-grid{display:grid;gap:14px;grid-template-columns:minmax(0,1.15fr) minmax(360px,.85fr)}.panel{padding:15px}.panel-title{align-items:center;display:flex;font-size:15px;justify-content:space-between;margin-bottom:10px}.panel-title small{color:var(--muted);font-size:12px;font-weight:500}.trend-chart{height:260px;border:1px solid var(--line);border-radius:8px;background:#fff;overflow:hidden}.trend-chart svg{display:block;height:100%;width:100%}.legend{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}.legend span{align-items:center;color:var(--muted);display:inline-flex;font-size:12px;gap:5px}.dot{border-radius:999px;height:8px;width:8px}.bar-row{align-items:center;display:grid;gap:9px;grid-template-columns:minmax(160px,260px) minmax(0,1fr) 78px 70px;color:#475467;font-size:12px;padding:5px 0}.bar-row .name{font-weight:650;color:var(--ink);line-height:1.25}.bar-track{background:#edf2f7;border-radius:999px;height:10px;overflow:hidden}.bar-fill{background:linear-gradient(90deg,#14b8a6,#2563eb);display:block;height:100%}.bar-row strong{text-align:right;color:var(--ink);font-variant-numeric:tabular-nums}.analysis-stack{display:grid;gap:10px}.analysis-card{background:#f8fbff;border:1px solid #dbe7ff;border-left:4px solid #3b82f6;border-radius:8px;padding:12px 13px}.analysis-card:nth-child(1){background:#ecfdf5;border-color:#bbf7d0;border-left-color:#10b981}.analysis-card:nth-child(3){background:#fffbeb;border-color:#fde68a;border-left-color:#f59e0b}.analysis-card h3{font-size:13px;margin:0 0 6px}.analysis-card p{color:#344054;font-size:12px;line-height:1.55;margin:0}.table-panel{display:grid;grid-template-rows:auto minmax(0,1fr);height:380px;margin-top:14px}.table-wrap{overflow:auto}table{min-width:1180px}th{white-space:nowrap}td{vertical-align:top}.pill{background:#f1f5f4;border:1px solid var(--line);border-radius:999px;color:var(--ink);display:inline-block;font-size:11px;line-height:1.4;padding:1px 8px}.pill.cn{background:#fef3c7;border-color:#fbbf24;color:#92400e}.clickable tbody tr{cursor:pointer}.clickable tbody tr:hover{background:#f7fbfa}.drawer-backdrop{background:rgba(15,23,42,.22);inset:0;opacity:0;pointer-events:none;position:fixed;transition:opacity .16s ease;z-index:10}.drawer{background:#fff;border-left:1px solid var(--line);bottom:0;box-shadow:-10px 0 24px rgba(15,23,42,.14);display:grid;grid-template-rows:auto minmax(0,1fr);position:fixed;right:0;top:0;transform:translateX(100%);transition:transform .18s ease;width:560px;z-index:11}.drawer.open{transform:translateX(0)}.drawer-backdrop.open{opacity:1;pointer-events:auto}.drawer-head{border-bottom:1px solid var(--line);padding:18px}.drawer-body{overflow:auto;padding:18px}.drawer-section{border-bottom:1px solid var(--line);padding-bottom:15px;margin-bottom:15px}.drawer-section h3{font-size:13px;margin:0 0 8px;color:var(--muted)}.drawer-section p,.drawer-section li{font-size:13px;line-height:1.58}.close-button{float:right}@media(max-width:1180px){body{overflow:auto}.shell,.main,.sidebar{height:auto}.content{overflow:visible}.decision-strip{grid-template-columns:1fr 1fr}.dashboard-grid{grid-template-columns:1fr}.grid-kpi{grid-template-columns:repeat(2,minmax(0,1fr))}.table-panel{height:auto}.drawer{width:min(100vw,560px)}}@media(max-width:760px){.shell{grid-template-columns:1fr}.sidebar{display:none}.topbar{align-items:stretch;flex-direction:column}.decision-strip{grid-template-columns:1fr}}
  </style>
</head>
<body>
  <div class="shell"><aside class="sidebar"><div class="brand">增长情报门户</div><nav class="nav"><a href="../../index.html">周报</a><a href="../leads/">线索</a>${active("market","市场","../market/")}${active("players","玩家","../players/")}${active("products","产品","../products/")}<a href="#">创意</a></nav></aside>
  <main class="main"><header class="topbar"><input class="search" id="search" placeholder="搜索行业 / 品牌 / 产品机会" /><div class="toolbar"><select class="select" id="l1-filter"></select><select class="select" id="platform-filter"><option value="Amazon">Amazon</option></select><select class="select" id="country-filter"><option value="US">美国</option></select></div></header>
  <section class="content"><h1 class="page-title">${title}</h1><p class="scope-line" id="scope-subtitle"></p><section class="decision-strip" id="decision-strip"></section><section class="grid-kpi" id="kpis"></section><section class="dashboard-grid"><div class="panel"><h2 class="panel-title">行业增长曲线 <small>按规范化二级行业聚合</small></h2><div class="trend-chart" id="trend-chart"></div><div class="legend" id="legend"></div></div><div class="panel"><h2 class="panel-title">大盘洞察 <small>一级行业 3 条增长信号</small></h2><div class="analysis-stack" id="analysis-stack"></div></div></section><section class="dashboard-grid" style="margin-top:14px"><div class="panel"><h2 class="panel-title" id="bars-title"></h2><div class="fallback-bars" id="bars"></div></div><div class="panel"><h2 class="panel-title">二级行业信号 <small>当前一级行业逐条解释</small></h2><div class="analysis-stack" id="l2-stack"></div></div></section><section class="panel table-panel"><h2 class="panel-title"><span id="table-title"></span><small id="table-summary"></small></h2><div class="table-wrap"><table class="clickable"><thead id="table-head"></thead><tbody id="table-body"></tbody></table></div></section></section></main></div>
  <div class="drawer-backdrop" id="drawer-backdrop"></div><aside class="drawer" id="drawer"><div class="drawer-head"><button class="button close-button" id="drawer-close">关闭</button><h2 id="drawer-title"></h2><div class="muted" id="drawer-subtitle"></div></div><div class="drawer-body" id="drawer-body"></div></aside>
  <script src="../../assets/common.js"></script>
  <script>window.PAGE_TYPE=${JSON.stringify(page)}; window.L1_ALIASES=${JSON.stringify(l1Aliases)}; window.L2_ALIASES=${JSON.stringify(l2Aliases)}; window.L1_PLAYBOOKS=${JSON.stringify(l1Playbooks)}; window.L2_NOTES=${JSON.stringify(l2Notes)};</script>
  <script src="../../assets/report_pages_v0_2.js"></script>
</body></html>`;
}

function clientJs() {
  return `
let marketData, playerData, productData, leadsData;
const colors=["#0f766e","#2563eb","#f59e0b","#8b5cf6","#ef4444"];
function n1(x){return window.L1_ALIASES[x]||x||"未命名"} function n2(l1,l2){const a=n1(l1);return (window.L2_ALIASES[a]&&window.L2_ALIASES[a][l2])||l2||"未命名"}
function money(v){v=Number(v||0);if(v>=1e9)return "$"+(v/1e9).toFixed(2)+"B";if(v>=1e6)return "$"+(v/1e6).toFixed(1)+"M";if(v>=1e3)return "$"+(v/1e3).toFixed(1)+"K";return "$"+v.toFixed(0)}
function pct(v){return Number(v||0).toFixed(1)+"%"} function num(v){return Number(v||0).toLocaleString("en-US",{maximumFractionDigits:0})} function uniq(a){return [...new Set(a.filter(Boolean))]}
function normAll(rows){return rows.map(x=>({...x,normalized_l1:n1(x.standard_l1),normalized_l2:n2(x.standard_l1,x.standard_l2)}))}
function selected(){return{l1:document.getElementById("l1-filter").value, q:document.getElementById("search").value.trim().toLowerCase()}}
function scoped(rows){const s=selected();return rows.filter(x=>x.country==="US"&&x.platform==="Amazon"&&x.normalized_l1===s.l1&&(!s.q||JSON.stringify(x).toLowerCase().includes(s.q)))}
function groupMarket(rows){const map=new Map(); for(const r of rows){const k=r.normalized_l2;if(!map.has(k))map.set(k,{normalized_l1:r.normalized_l1,normalized_l2:k,monthly_gmv:0,gmv:0,prev:0,cn:0,brands:[],monthly_trend:{},raw_l2:[]});const g=map.get(k);g.monthly_gmv+=Number(r.monthly_gmv||0);g.gmv+=Number(r.gmv||0);g.prev+=Number(r.prev_monthly_gmv||0);g.cn+=Number(r.cn_monthly_gmv||0);g.brands.push(...(r.top_brands||[]));g.raw_l2.push(r.standard_l2);Object.entries(r.monthly_trend||{}).forEach(([m,v])=>g.monthly_trend[m]=(g.monthly_trend[m]||0)+Number(v||0));} return [...map.values()].map(x=>({...x,growth_rate:x.prev?(x.monthly_gmv-x.prev)/x.prev*100:0,cn_share:x.monthly_gmv?x.cn/x.monthly_gmv*100:0,brands:uniq(x.brands).slice(0,8),raw_l2:uniq(x.raw_l2),signals:window.L2_NOTES[x.normalized_l2]||autoSignals(x)})).sort((a,b)=>b.monthly_gmv-a.monthly_gmv)}
function autoSignals(x){return["规模："+x.normalized_l2+" 当月 "+money(x.monthly_gmv)+"，代表品牌 "+(x.brands||[]).slice(0,4).join("、")+"。","增长：MoM "+pct(x.growth_rate)+"，"+(x.growth_rate>=5?"优先下钻增长原因。":"先看结构和客户质量，不直接包装成增长。"),"CN：CN占比 "+pct(x.cn_share)+"，"+(x.cn_share>=40?"中国供给已验证。":x.cn_share<=8?"低渗透，可能存在品牌/合规壁垒。":"有一定中国玩家基础。")]}
function productRows(){const map=new Map(); for(const r of scoped(productData)){const k=r.standard_l3||r.product_name||r.normalized_l2;if(!map.has(k))map.set(k,{name:k,l2:r.normalized_l2,monthly_gmv:0,sales:0,cn:0,brands:[],rows:[]});const g=map.get(k);g.monthly_gmv+=Number(r.monthly_gmv_usd||0);g.sales+=Number(r.listing_monthly_sales||r.monthly_sales||0);g.cn=Math.max(g.cn,Number(r.cn_share||0));if(r.brand)g.brands.push(r.brand);g.rows.push(r);}return[...map.values()].sort((a,b)=>b.monthly_gmv-a.monthly_gmv)}
function playerRows(){const leads=leadBrandSet();return scoped(playerData).sort((a,b)=>scorePlayer(b,leads)-scorePlayer(a,leads))}
function leadBrandSet(){return new Set((leadsData.records||[]).filter(x=>x.normalized_l1===selected().l1).map(x=>String(x.company||"").toLowerCase()))}
function scorePlayer(x,leads){let s=Number(x.estimated_gmv||0)/1e6; if(x.cn_flag)s+=100000; if(leads.has(String(x.brand||"").toLowerCase()))s+=200000; return s}
function renderFilters(){const values=uniq(marketData.map(x=>x.normalized_l1)).sort();const el=document.getElementById("l1-filter");el.innerHTML=values.map(v=>'<option value="'+v+'">'+v+'</option>').join("");el.value=values.includes("Beauty")?"Beauty":values[0]}
function renderAll(){const marketRows=groupMarket(scoped(marketData));const rows=window.PAGE_TYPE==="market"?marketRows:window.PAGE_TYPE==="players"?playerRows():productRows();const l1=selected().l1;const pb=window.L1_PLAYBOOKS[l1]||{frame:l1+" 暂无历史观点。",signals:["先看规模。","再看增长。","最后看CN玩家。"]};document.getElementById("scope-subtitle").innerHTML="Amazon 美国 · <strong>"+l1+"</strong> · "+(window.PAGE_TYPE==="market"?"为什么做行业":window.PAGE_TYPE==="players"?"为什么打客户":"为什么打产品")+"。";renderDecision(marketRows,rows,pb);renderKpis(marketRows,rows);renderTrend(marketRows);renderAnalysis(pb,marketRows);renderBars(rows);renderL2(marketRows);renderTable(rows)}
function renderDecision(marketRows,rows,pb){const top=marketRows[0],growth=[...marketRows].sort((a,b)=>b.growth_rate-a.growth_rate)[0],cn=[...marketRows].sort((a,b)=>b.cn_share-a.cn_share)[0];const cards=[["证据",top?top.normalized_l2+" 是规模锚点":"暂无数据",top?"当月 "+money(top.monthly_gmv)+"，CN "+pct(top.cn_share)+"，原始口径："+top.raw_l2.join(" / "):""],["增长",growth?growth.normalized_l2+" 增长最强":"暂无增长",growth?"MoM "+pct(growth.growth_rate)+"。"+(growth.growth_rate>0?"先找新品、渠道或季节原因。":"当前多数细分承压，不能硬写增长。"):""],["CN",cn?cn.normalized_l2+" CN渗透最高":"暂无CN信号",cn?"CN占比 "+pct(cn.cn_share)+"，代表打法是否可复制要继续看玩家。":""],["判断",pb.signals[0],pb.frame]];document.getElementById("decision-strip").innerHTML=cards.map(c=>'<article class="decision-card"><div class="decision-label">'+c[0]+'</div><div class="decision-title">'+c[1]+'</div><div class="decision-body">'+c[2]+'</div></article>').join("")}
function renderKpis(marketRows,rows){const total=marketRows.reduce((s,x)=>s+x.monthly_gmv,0),annual=marketRows.reduce((s,x)=>s+x.gmv,0),cn=total?marketRows.reduce((s,x)=>s+x.cn,0)/total*100:0,growth=weighted(marketRows);const cards=[["月度规模",money(total),"规范化口径聚合"],["年化GMV",money(annual),"处理后底表"],["近月增长",pct(growth),"Sheet 4趋势"],["CN占比",pct(cn),"GMV加权"],[window.PAGE_TYPE==="players"?"中国玩家优先":window.PAGE_TYPE==="products"?"产品机会":"二级行业",num(rows.length),"当前筛选"]];document.getElementById("kpis").innerHTML=cards.map(c=>'<div class="card"><div class="kpi-label">'+c[0]+'</div><div class="kpi-value">'+c[1]+'</div><div class="kpi-note">'+c[2]+'</div></div>').join("")}
function weighted(rows){const now=rows.reduce((s,x)=>s+x.monthly_gmv,0),prev=rows.reduce((s,x)=>s+x.prev,0);return prev?(now-prev)/prev*100:0}
function renderTrend(rows){const series=rows.filter(x=>Object.keys(x.monthly_trend).length>1).slice(0,5).map((x,i)=>({name:x.normalized_l2,color:colors[i],points:Object.entries(x.monthly_trend).sort().map(([m,v])=>({m,v}))}));if(!series.length){document.getElementById("trend-chart").innerHTML='<p class="muted" style="padding:16px">暂无趋势。</p>';return}const vals=series.flatMap(s=>s.points.map(p=>p.v)),min=Math.min(...vals)*.92,max=Math.max(...vals)*1.04,w=900,h=260,pad=34,months=series[0].points.map(p=>p.m),x=i=>pad+i*((w-pad*2)/Math.max(1,months.length-1)),y=v=>h-pad-((v-min)/(max-min||1))*(h-pad*2);const grid=[0,.25,.5,.75,1].map(t=>'<line x1="'+pad+'" x2="'+(w-pad)+'" y1="'+(pad+t*(h-pad*2))+'" y2="'+(pad+t*(h-pad*2))+'" stroke="#e5edf5"/>').join("");const lines=series.map(s=>'<path d="'+s.points.map((p,i)=>(i?'L':'M')+x(i)+','+y(p.v)).join(' ')+'" fill="none" stroke="'+s.color+'" stroke-width="3"/>').join("");document.getElementById("trend-chart").innerHTML='<svg viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="none">'+grid+lines+'</svg>';document.getElementById("legend").innerHTML=series.map(s=>'<span><i class="dot" style="background:'+s.color+'"></i>'+s.name+'</span>').join("")}
function renderAnalysis(pb){document.getElementById("analysis-stack").innerHTML=pb.signals.map((s,i)=>'<article class="analysis-card"><h3>增长信号 '+(i+1)+'</h3><p>'+s+'</p></article>').join("")}
function renderL2(rows){document.getElementById("l2-stack").innerHTML=rows.slice(0,6).map(x=>'<article class="analysis-card"><h3>'+x.normalized_l2+'</h3><p>'+x.signals.join('<br>')+'</p></article>').join("")}
function renderBars(rows){const title=window.PAGE_TYPE==="market"?"规范化二级行业规模":window.PAGE_TYPE==="players"?"中国/有线索玩家优先": "产品机会 Top";document.getElementById("bars-title").innerHTML=title+" <small>按当前筛选排序</small>";const top=rows.slice(0,12),max=Math.max(...top.map(x=>Number(x.monthly_gmv||x.estimated_gmv||0)),1);document.getElementById("bars").innerHTML=top.map(x=>{const name=window.PAGE_TYPE==="players"?x.brand:(window.PAGE_TYPE==="products"?x.name:x.normalized_l2),val=Number(x.monthly_gmv||x.estimated_gmv||0),meta=x.cn_flag?'CN':x.cn_share!=null?'CN '+pct(x.cn_share):x.cn!=null?'CN '+pct(x.cn):'';return '<div class="bar-row"><span class="name">'+name+'</span><span class="bar-track"><span class="bar-fill" style="width:'+(val/max*100)+'%"></span></span><strong>'+money(val)+'</strong><span>'+meta+'</span></div>'}).join("")}
function renderTable(rows){if(window.PAGE_TYPE==="market")return renderMarketTable(rows);if(window.PAGE_TYPE==="players")return renderPlayerTable(rows);return renderProductTable(rows)}
function renderMarketTable(rows){document.getElementById("table-title").textContent="市场明细";document.getElementById("table-summary").textContent="点击看二级行业三条增长信号";document.getElementById("table-head").innerHTML="<tr><th>二级行业</th><th>原始口径</th><th>月GMV</th><th>MoM</th><th>CN</th><th>代表品牌</th><th>信号</th></tr>";document.getElementById("table-body").innerHTML=rows.map((x,i)=>'<tr data-index="'+i+'"><td><strong>'+x.normalized_l2+'</strong></td><td>'+x.raw_l2.join(" / ")+'</td><td>'+money(x.monthly_gmv)+'</td><td>'+pct(x.growth_rate)+'</td><td>'+pct(x.cn_share)+'</td><td>'+x.brands.slice(0,5).join("、")+'</td><td>'+x.signals[0]+'</td></tr>').join("");bind(rows,openMarket)}
function renderPlayerTable(rows){document.getElementById("table-title").textContent="玩家明细";document.getElementById("table-summary").textContent="中国玩家和线索命中优先，Apple/HP等仅作背景";document.getElementById("table-head").innerHTML="<tr><th>品牌</th><th>二级行业</th><th>GMV</th><th>CN</th><th>产品/主类目</th><th>增长理由</th></tr>";document.getElementById("table-body").innerHTML=rows.slice(0,120).map((x,i)=>'<tr data-index="'+i+'"><td><strong>'+x.brand+'</strong></td><td>'+x.normalized_l2+'</td><td>'+money(x.estimated_gmv)+'</td><td>'+(x.cn_flag?'<span class="pill cn">CN</span>':'-')+'</td><td>'+(x.main_l3||'')+'</td><td>'+(x.growth_reason||'')+'</td></tr>').join("");bind(rows.slice(0,120),openPlayer)}
function renderProductTable(rows){document.getElementById("table-title").textContent="产品机会明细";document.getElementById("table-summary").textContent="机会/类目层，不冒充SKU";document.getElementById("table-head").innerHTML="<tr><th>产品机会</th><th>二级行业</th><th>月GMV</th><th>销量</th><th>CN</th><th>判断</th></tr>";document.getElementById("table-body").innerHTML=rows.slice(0,140).map((x,i)=>'<tr data-index="'+i+'"><td><strong>'+x.name+'</strong></td><td>'+x.l2+'</td><td>'+money(x.monthly_gmv)+'</td><td>'+num(x.sales)+'</td><td>'+pct(x.cn)+'</td><td>'+(x.cn>=45?'CN供给已验证':x.monthly_gmv>1e8?'规模足够下钻':'观察买点和价格带')+'</td></tr>').join("");bind(rows.slice(0,140),openProduct)}
function bind(rows,fn){[...document.querySelectorAll("#table-body tr")].forEach(tr=>tr.addEventListener("click",()=>fn(rows[Number(tr.dataset.index)])))}
function drawer(t,sub,html){document.getElementById("drawer-title").textContent=t;document.getElementById("drawer-subtitle").textContent=sub;document.getElementById("drawer-body").innerHTML=html;document.getElementById("drawer").classList.add("open");document.getElementById("drawer-backdrop").classList.add("open")}
function openMarket(x){drawer(x.normalized_l2,money(x.monthly_gmv)+" · MoM "+pct(x.growth_rate)+" · CN "+pct(x.cn_share),'<section class="drawer-section"><h3>三条增长信号</h3><ol>'+x.signals.map(s=>'<li>'+s+'</li>').join("")+'</ol></section><section class="drawer-section"><h3>原始口径</h3><p>'+x.raw_l2.join(" / ")+'</p></section>')}
function openPlayer(x){const leads=(leadsData.records||[]).filter(l=>String(l.company||"").toLowerCase()===String(x.brand||"").toLowerCase());drawer(x.brand,x.normalized_l2+" · "+money(x.estimated_gmv),'<section class="drawer-section"><h3>为什么打这个客户</h3><p>'+(x.cn_flag?'中国玩家，优先看出海打法、内容素材和新品窗口。':'非中国玩家，主要作市场背景或竞品参照。')+'</p><p>'+(x.growth_reason||'')+'</p></section><section class="drawer-section"><h3>线索命中</h3>'+(leads.length?leads.map(l=>'<p><strong>'+l.event_type+'</strong>：'+l.summary+'<br>动作：'+l.action+'</p>').join(""):'<p>当前未命中 Beauty/3C 线索表。</p>')+'</section>')}
function openProduct(x){drawer(x.name,x.l2+" · "+money(x.monthly_gmv),'<section class="drawer-section"><h3>为什么打这个产品</h3><p>'+(x.cn>=45?'中国供给打法已验证，适合筛头部玩家和差异化新品。':x.monthly_gmv>1e8?'规模足够，适合继续下钻真实ASIN、价格带和内容素材。':'先观察买点、评价和价格带。')+'</p></section>')}
function closeDrawer(){document.getElementById("drawer").classList.remove("open");document.getElementById("drawer-backdrop").classList.remove("open")}
async function init(){const [m,p,pr,l]=await Promise.all([loadJson("../../data/market/amazon_market_facts_monthly.json"),loadJson("../../data/players/amazon_players_monthly.json"),loadJson("../../data/products/amazon_products_monthly.json"),loadJson("../../data/leads/lead_events.json")]);marketData=normAll(m.records||[]);playerData=normAll(p.records||[]);productData=normAll(pr.records||[]);leadsData=l;(leadsData.records||[]).forEach(x=>{x.normalized_l1=n1(x.standard_l1);x.normalized_l2=n2(x.standard_l1,x.standard_l2)});renderFilters();["search","l1-filter"].forEach(id=>document.getElementById(id).addEventListener("input",renderAll));document.getElementById("drawer-close").addEventListener("click",closeDrawer);document.getElementById("drawer-backdrop").addEventListener("click",closeDrawer);renderAll()} init().catch(e=>{document.querySelector(".content").innerHTML='<div class="panel">加载失败：'+e.message+'</div>'});
`;
}

function leadsHtml() {
  return `<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><title>线索中心</title><link rel="stylesheet" href="../../assets/portal.css"/><style>.content{padding:18px 24px}.grid-kpi{grid-template-columns:repeat(4,minmax(120px,1fr))}.filters{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px}.lead-card{cursor:pointer}.empty{color:var(--muted);padding:18px}.table-wrap{max-height:460px;overflow:auto}table{min-width:1180px}.pill{background:#f1f5f4;border:1px solid var(--line);border-radius:999px;font-size:11px;padding:1px 8px}.pill.a{background:#fee2e2;color:#991b1b}.pill.b{background:#fef3c7;color:#92400e}</style></head><body><div class="shell"><aside class="sidebar"><div class="brand">增长情报门户</div><nav class="nav"><a href="../../index.html">周报</a><a class="active" href="./">线索</a><a href="../market/">市场</a><a href="../players/">玩家</a><a href="../products/">产品</a><a href="#">创意</a></nav></aside><main class="main"><header class="topbar"><input class="search" id="search" placeholder="搜索客户 / 事件 / 产品"/><div class="toolbar"><select class="select" id="l1-filter"><option>Beauty</option><option>Consumer Tech</option><option>Lifestyle</option><option>Fashion</option><option>Health</option></select><select class="select" id="country-filter"><option value="US">美国</option><option value="">全部国家</option></select></div></header><section class="content"><h1 class="page-title">线索中心</h1><p class="page-subtitle">当前只接入 Beauty 和 Consumer Tech 线索；其他行业先空缺，不造线索。</p><section class="grid-kpi" id="kpis"></section><section class="grid-main"><div class="panel"><h2 class="panel-title">重点跟进</h2><div class="lead-list" id="top-leads"></div></div><div class="panel"><h2 class="panel-title">线索类型</h2><div class="fallback-bars" id="bars"></div></div></section><section class="panel" style="margin-top:16px"><h2 class="panel-title">线索明细</h2><div class="table-wrap"><table><thead><tr><th>优先级</th><th>客户</th><th>行业</th><th>国家</th><th>事件</th><th>产品/动作</th><th>可切服务点</th><th>TikTok校验</th><th>信源</th></tr></thead><tbody id="rows"></tbody></table></div></section></section></main></div><script src="../../assets/common.js"></script><script>
let data=[];function pr(x){return x==="A"?"a":x==="B"?"b":""}function filt(){const l=document.getElementById("l1-filter").value,c=document.getElementById("country-filter").value,q=document.getElementById("search").value.trim().toLowerCase();return data.filter(x=>x.standard_l1===l&&(!c||x.country===c)&&(!q||JSON.stringify(x).toLowerCase().includes(q)))}function render(){const rows=filt();document.getElementById("kpis").innerHTML=[["线索数",rows.length],["A/B级",rows.filter(x=>x.priority==="A"||x.priority==="B").length],["TikTok已匹配",rows.filter(x=>String(x.tiktok_status||"").includes("已匹配")).length],["当前行业",document.getElementById("l1-filter").value]].map(x=>'<div class="card"><div class="kpi-label">'+x[0]+'</div><div class="kpi-value">'+x[1]+'</div></div>').join("");document.getElementById("top-leads").innerHTML=rows.length?rows.slice(0,6).map((x,i)=>'<article class="lead-card"><div class="lead-card-header"><h3>'+(i+1)+'. '+x.company+'</h3><span class="pill '+pr(x.priority)+'">'+x.priority+'</span></div><div class="lead-meta">'+x.standard_l2+' · '+x.event_type+' · '+x.country+'<br>'+x.summary+'<br>动作：'+x.action+'</div></article>').join(""):'<div class="empty">当前行业暂无线索；不是没有机会，只是还没接入线索表。</div>';const by={};rows.forEach(x=>by[x.event_type]=(by[x.event_type]||0)+1);const max=Math.max(...Object.values(by),1);document.getElementById("bars").innerHTML=Object.entries(by).map(([k,v])=>'<div class="fallback-bar-row"><span>'+k+'</span><span class="fallback-bar-track"><span class="fallback-bar-fill" style="width:'+(v/max*100)+'%"></span></span><strong>'+v+'</strong></div>').join("")||'<div class="empty">暂无</div>';document.getElementById("rows").innerHTML=rows.map(x=>'<tr><td><span class="pill '+pr(x.priority)+'">'+x.priority+'</span></td><td><strong>'+x.company+'</strong><br><span class="muted">'+(x.parent_company||"")+'</span></td><td>'+x.standard_l1+'<br><span class="muted">'+x.standard_l2+'</span></td><td>'+x.country+'</td><td>'+x.event_type+'<br><span class="muted">'+x.publish_date+'</span></td><td>'+x.product_action+'</td><td>'+x.action+'</td><td>'+(x.tiktok_status||"-")+'</td><td>'+(x.source_url?'<a href="'+x.source_url+'" target="_blank">'+x.source_name+'</a>':x.source_name)+'</td></tr>').join("")}
async function init(){const p=await loadJson("../../data/leads/lead_events.json");data=p.records||p;["search","l1-filter","country-filter"].forEach(id=>document.getElementById(id).addEventListener("input",render));render()}init();
</script></body></html>`;
}

function main() {
  const data = normalizeRecords();
  buildResearchPack(data);
  write("portal/assets/report_pages_v0_2.js", clientJs());
  write("portal/pages/market/index.html", pageHtml("market"));
  write("portal/pages/players/index.html", pageHtml("players"));
  write("portal/pages/products/index.html", pageHtml("products"));
  write("portal/pages/leads/index.html", leadsHtml());
  console.log("rendered normalized report pages and leads page");
}

main();
