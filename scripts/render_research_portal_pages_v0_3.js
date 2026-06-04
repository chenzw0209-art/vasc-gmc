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

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

const researchNotes = {
  Beauty: {
    frame:
      "Beauty 不能只写美容仪。Amazon US 当前更像三条线并行：护肤/彩妆/香水承担内容种草后的交易承接，个人护理电器承担参数化测评，口腔/美甲/脱毛承担耗材和替换周期。",
    insights: [
      {
        title: "美妆本身要被点出来：护肤、彩妆、香水仍是内容入口",
        body:
          "护肤与个人护理是规模锚点，但 CN 占比偏低，说明纯护肤不是供应链白牌逻辑，而是品牌、成分证据、口碑和渠道壁垒更高。页面应把 medicube、ANUA 这类内容品牌当作“TikTok/Instagram 认知回流 Amazon”的参照。"
      },
      {
        title: "设备型个护更容易把中国供应链能力放大",
        body:
          "IPL 脱毛、吹风/造型、牙刷/水牙线、美容仪都能通过前后对比、参数、测评和价格带建立差异。Ulike、Laifen、TYMO、JOVS、Oclean、Soocas 比单纯护肤白牌更容易形成可解释增长。"
      },
      {
        title: "美甲/手足护理不是小品类，而是高 CN 渗透的成熟运营池",
        body:
          "beetles、modelones、MelodySusie 等说明供给和 Amazon 运营已被验证。短期涨跌不应直接否定品类，关键看色系上新、教程内容、节日套装和达人联盟是否能持续。"
      },
      {
        title: "口腔护理被单独拆出来，是因为复购逻辑不同",
        body:
          "电动牙刷、水牙线、刷头、牙膏/美白套装有家庭替换周期和耗材复购，不应继续藏在“美妆个护综合”里。COSLUS、Oclean、Soocas 的价值在评测对比和耗材链路。"
      }
    ]
  },
  "Consumer Tech": {
    frame:
      "Consumer Tech 已合并 Consumer Electronics，并拆掉“消费电子综合”。行业分析只解释行业运动，不在大盘洞察里写 BD 动作；客户打法放到玩家/线索模块。",
    insights: [
      {
        title: "电源/储能/充电的异动来自“户外 + 家庭备用电”两条需求叠加",
        body:
          "底表中该类 MoM 明显领先，且 CN 占比较高。外部看，portable power station 报告把 EcoFlow、Jackery、Anker列为关键厂商，并指向 2026-2033 高增长；媒体端也把 Anker Solix 的购买理由写成露营、RV、停电备用。数据异动不是孤立的 Amazon 排名，而是备电场景被消费化。"
      },
      {
        title: "影像/无人机/创作者工具增长由新品节奏和创作者工具链推动",
        body:
          "底表中影像/无人机为正增长，DJI、Insta360、GoPro、NEEWER 同时出现在代表玩家里。NAB 2026 上 DJI 展示 RS 5、Osmo 360 等创作者工具，GoPro 也宣布新一代相机，说明行业驱动是内容生产工具升级，而不是单一相机配件的自然波动。"
      },
      {
        title: "智能安防/监控从云订阅转向本地 AI、无订阅和多摄协同",
        body:
          "“消费电子综合”里真正值得拆出的不是综合，而是家庭安全系统和监控视频设备。eufy 官方把 Local AI、no monthly fees 作为核心卖点，CES 2026 也给 Reolink 多镜头 AI 摄像头奖项，这解释了 eufy、aosu、REOLINK 等中国/深圳链路玩家的可见度。"
      },
      {
        title: "智能穿戴不是整体爆发，结构在从手表向戒指、健康监测和配件分化",
        body:
          "历史穿戴式科技深度报告指出，智能手表规模最大但由 Apple/Garmin/Samsung 主导，智能戒指是 CN 品牌能建立认知的细分，RingConn 用无订阅费、睡眠健康和 CES 节点形成差异。Amazon 曲线平稳时，更要看内部结构而不是总盘。"
      }
    ]
  },
  Lifestyle: {
    frame:
      "Lifestyle 要按场景拆：厨房餐饮、家居家装、家具、运动户外、园艺、办公文具和汽车/出行用品分别对应备餐、搬家、收纳、户外、家庭组织和出行维护需求。",
    insights: [
      { title: "厨房餐饮是规模锚点", body: "规模大但单月不一定强，需要在咖啡、保温杯、小家电、收纳和厨房耗材里看结构变化。" },
      { title: "家具/园艺/运动户外更受季节和搬家周期影响", body: "春夏、Prime Day 前、返校/搬家季会改变曲线，不能只看单月排名。" },
      { title: "家居家装和艺术手工 CN 占比高", body: "说明供给侧已经验证，下一步要筛有品牌化、内容素材和渠道能力的头部玩家。" },
      { title: "办公文具和汽车/出行用品要按具体场景解释", body: "办公文具常受返校季和远程办公补货影响；汽车用品、摩托车配件更像安全、适配、安装和替换件需求，合并进 Lifestyle 后不能再用整车叙事。" }
    ]
  },
  Fashion: {
    frame:
      "Fashion 重点不是泛服装，而是款式周期、上新速度、尺码退货、内容承接。服饰/时装同时具备规模、增长和 CN 渗透，是最值得先专题化的方向。",
    insights: [
      { title: "服饰/时装是主线", body: "女装、运动服、男装、鞋履的款式池决定上新效率和库存风险。" },
      { title: "CN 渗透代表供应链和内容素材有基础", body: "但必须继续看尺码、面料、试穿内容和评价质量。" },
      { title: "箱包/珠宝/童装先做观察池", body: "这些类目规模或波动更强，不应抢走服饰主线资源。" },
      { title: "季节和平台内容会放大曲线波动", body: "泳装、婚礼季、返校、节日礼品都会影响月度趋势。" }
    ]
  },
  Health: {
    frame:
      "Health 看长期复购、合规门槛和刚需场景。营养补剂、家庭健康、医疗器械、母婴护理的打法完全不同。",
    insights: [
      { title: "医疗器械/健康护理更值得解释增长", body: "家庭检测、护理耗材和健康管理设备是可解释的刚需线。" },
      { title: "营养补剂规模大但 CN 渗透低", body: "品牌、成分证据和合规壁垒高，不能按普通消费品理解。" },
      { title: "母婴护理信任门槛高", body: "安全认证、家庭场景和复购周期比低价更关键。" },
      { title: "家庭健康设备在向数据服务升级", body: "体征监测、App 记录和多设备联动比单一硬件更能形成粘性。" }
    ]
  },
  FMCG: {
    frame:
      "FMCG 不能泛说增长。要区分低基数增长、渠道变化和高频复购：婴幼儿食品、酒类、咖啡茶、零食糖果是不同逻辑。",
    insights: [
      { title: "婴幼儿食品是少数正向细分", body: "但 CN 渗透很低，适合观察而不是立刻重投。" },
      { title: "酒类可能混有器具/包装/周边口径", body: "需要继续核底表定义。" },
      { title: "饮料/咖啡茶和零食糖果看新品与礼盒", body: "规模大但 MoM 下行时，不能包装成泛增长。" },
      { title: "复购品类需要看订阅和组合装", body: "仅看 GMV 容易遗漏频次变化。" }
    ]
  },
  "Auto & Mobility": {
    frame:
      "Auto & Mobility 主要是汽车用品与摩托车配件。机会来自安全、出行、维修、户外和替换件，不是整车叙事。",
    insights: [
      { title: "摩托车配件小盘但增长更强", body: "KEMIMOTO 类玩家说明中国供应链能打细分配件和骑行场景。" },
      { title: "汽车用品规模大且 CN 占比高", body: "儿童安全座椅、车载配件、维修工具等需要按具体场景拆。" },
      { title: "用户决策看安全、适配车型和安装", body: "内容应服务参数解释和风险消除。" },
      { title: "替换件和户外场景会影响季节曲线", body: "维修季、旅行季会带来结构性波动。" }
    ]
  },
  Gaming: {
    frame:
      "Gaming 当前保留主机游戏、电子游戏和外设相关观察，优先看硬件外设、账号点卡、游戏周边和直播内容场景。",
    insights: [
      { title: "主机游戏短期不是增长主线", body: "本月承压时，不应强行包装成增长机会。" },
      { title: "中国玩家更可能在外设切入", body: "手柄、键鼠、配件、收纳和直播外设比游戏内容本身更现实。" },
      { title: "新品平台周期影响大", body: "单看 Amazon GMV 不够，必须结合主机/游戏发布节奏。" },
      { title: "直播和内容场景带动周边", body: "灯光、麦克风、采集卡和桌搭会把 Gaming 和 Creator 工具连接起来。" }
    ]
  }
};

const l2Notes = {
  "护肤与个人护理": [
    "这是 Beauty 的规模锚点，但不是统一市场：护肤、个护、皮肤护理高度重叠，必须合并看规模和品牌壁垒。",
    "增长不强时不代表不重要，重点在内容种草能否转到 Amazon 的价格、评价、配送和套装确认。",
    "CN 渗透偏低，说明纯护肤品牌壁垒高；更适合找 medicube/ANUA 式内容分发，或用工具/套装/成分新叙事切入。"
  ],
  "彩妆/香水": [
    "彩妆和香水是 Beauty 的内容入口，依赖试色、妆效、香调描述和达人内容。",
    "如果 GMV 曲线不强，也要保留观察，因为它会外溢到护肤、工具和礼品套装。",
    "CN 玩家要证明的不是低价供给，而是色号、质感、内容素材和复购。"
  ],
  "口腔护理": [
    "原“美妆个护综合”在 Beauty 下主要被口腔护理解释，已从综合口径中拆出。",
    "电动牙刷、水牙线、刷头和美白套装有明确替换周期，和护肤逻辑不同。",
    "COSLUS、Oclean、Soocas 的机会在评测对比、耗材复购和家庭套装。"
  ],
  "脱毛与剃须": [
    "IPL 脱毛和剃须是可演示、可前后对比的典型内容品类。",
    "Ulike 已有线下活动、PR 和 TikTok 店铺校验，说明不是单纯铺货。",
    "机会不只女性脱毛，也包括男士剃须、理发工具和家庭替换。"
  ],
  "头发护理/造型": [
    "头发护理要拆成洗护、头皮、造型工具、假发/接发，不是单一洗发水市场。",
    "TYMO、Laifen、Wavytalk 的价值在造型工具、参数对比和内容素材。",
    "Ulta、DTC、Amazon、TikTok 多渠道内容能证明品牌不是纯铺货。"
  ],
  "美甲/手足护理": [
    "CN 占比高，beetles、modelones、MelodySusie 说明供给和 Amazon 运营已验证。",
    "短期下行不等于没机会，这是成熟但可筛选的客户池。",
    "关键看色系上新、套装、教程内容、达人联盟和节日礼品。"
  ],
  "手机与配件": [
    "规模最大，但内部混有手机壳、充电、电脑配件、数据存储和网络设备，必须继续细拆。",
    "Anker、ESR、Ailun、INIU、charmast 体现中国玩家在配件和充电里的密度。",
    "下行时先判断是否是大盘配件淡季、主机新品周期或价格带竞争，不要只看总 GMV。"
  ],
  "电源/储能/充电": [
    "MoM 最强，且 CN 占比高；Amazon 数据与外部 portable power station 增长叙事一致。",
    "驱动来自露营/RV/户外和家庭停电备用电源两条需求合流。",
    "Jackery、EcoFlow、Anker、Greenworks 的存在说明这不是普通充电配件，而是能源场景消费化。"
  ],
  "相机/影像/无人机": [
    "增长为正，且 DJI、Insta360、GoPro、NEEWER 等把新品节奏和内容素材连接起来。",
    "NAB 2026 的创作者工具发布验证行业驱动来自内容生产工具升级。",
    "这类目看新品、配件生态、存储和创作者工作流，比看单月品牌排名更有效。"
  ],
  "智能穿戴/智能硬件": [
    "总盘平稳，但内部从手表向智能戒指、健康监测和配件分化。",
    "Apple/Garmin/Samsung 主导智能手表，CN 品牌更应关注 RingConn/Amazfit 和配件生态。",
    "RingConn 的无订阅费和睡眠健康叙事说明中国品牌能在细分里建立认知。"
  ],
  "办公打印/商用电子": [
    "由打印机、耗材、扫描仪、计算器、POS 和办公设备构成，不应再叫消费电子综合。",
    "HP/Brother/Epson/Canon 主导硬件，Cool Toner、bonsaii 等更多体现耗材和办公设备机会。",
    "曲线更可能受办公补货、返校和耗材替换影响，而不是内容型新品。"
  ],
  "电子阅读器": [
    "由 Kindle/电子书阅读器类目解释，和电视、打印机、安防不是一类生意。",
    "Amazon 自有生态强，第三方机会更多在保护套、支架、灯具和学习/阅读场景配件。",
    "需要单独看 Prime Day、返校季和礼品季。"
  ],
  "电视/投影/视听娱乐": [
    "由电视、投影、家庭影院和视频设备构成，Hisense、TCL、XGIMI、NEBULA 是中国玩家重点。",
    "需求来自大屏替换、家庭影院、租房/露营投影和内容平台升级。",
    "与音频设备相邻，但客单价、安装和评价决策更重。"
  ],
  "智能安防/监控": [
    "由家庭安全系统、监控视频设备和安全监控组成，是从“消费电子综合”里必须拆出的赛道。",
    "无订阅、本地 AI、DIY 安装、多摄追踪是当前行业话题。",
    "eufy、aosu、REOLINK 与 Ring/Blink 同台，说明中国玩家可以靠产品参数和家庭场景进入。"
  ],
  "音频/DJ/K歌": [
    "由电子音乐、DJ、卡拉 OK、舞台音响和麦克风等构成。",
    "Shure、Rode、FIFINE、Pioneer DJ 等说明这是创作者和家庭娱乐交叉品类。",
    "增长解释要看直播、播客、家庭派对和内容生产，而不是泛音频。"
  ]
};

function cleanMdText(text) {
  return String(text || "")
    .replace(/\r/g, "")
    .replace(/\*\*/g, "")
    .replace(/^\s*[-*]\s+/gm, "")
    .replace(/\|[^\n]*\|/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function splitParagraphs(text) {
  return cleanMdText(text)
    .split(/\n\s*\n/)
    .map((x) => x.replace(/\n+/g, " ").trim())
    .filter((x) => x && !x.startsWith("|") && !/^---+$/.test(x) && !/^指标\s+数值/.test(x));
}

function firstSection(text, startPattern, endPattern) {
  const start = text.search(startPattern);
  if (start < 0) return "";
  const body = text.slice(start);
  const end = body.slice(1).search(endPattern);
  return end < 0 ? body : body.slice(0, end + 1);
}

function parseMasterContent() {
  const masterPath = "C:\\Users\\wale.chen\\Downloads\\amazon_us_industry_master_v1.md";
  if (!fs.existsSync(masterPath)) return { researchNotes: {}, l2Notes: {} };
  const md = fs.readFileSync(masterPath, "utf8").replace(/\r/g, "");
  const l1Matches = [...md.matchAll(/^# ([^\n#]+?) · 深度分析\s*$/gm)];
  const parsedResearch = {};
  const parsedL2 = {};
  for (let i = 0; i < l1Matches.length; i += 1) {
    const name = l1Matches[i][1].trim();
    const start = l1Matches[i].index;
    const end = i + 1 < l1Matches.length ? l1Matches[i + 1].index : md.length;
    const section = md.slice(start, end);

    const marketSection = firstSection(section, /^## 1\. 市场规模与结构/m, /^## 2\./m);
    const marketParas = splitParagraphs(marketSection).filter((x) => !/^##|^###|^核心子类目|^指标|^品类月/.test(x));
    const keySection = firstSection(section, /^### 关键判断/m, /^## 2\./m);
    const keyParas = splitParagraphs(keySection).filter((x) => !x.startsWith("###"));
    const growthSection = firstSection(section, /^## 2\. 增长关键原因/m, /^## 3\./m);
    const growthBlocks = [...growthSection.matchAll(/^###\s+(.+?)\n([\s\S]*?)(?=^###\s+|^##\s+|\s*$)/gm)]
      .map((m) => ({ title: m[1].replace(/^\d+(\.\d+)?\s*/, "").trim(), body: splitParagraphs(m[2])[0] || "" }))
      .filter((x) => x.body);

    const insightSource = [
      ...keyParas.map((body, idx) => ({ title: body.split("。")[0].slice(0, 34), body })),
      ...growthBlocks,
    ].filter((x) => x.body);
    const frame = marketParas.find((x) => x.includes(name) || x.length > 30) || keyParas[0] || `${name} 以 master 文档为准。`;
    parsedResearch[name] = {
      frame,
      insights: insightSource.slice(0, 4).map((x, idx) => ({
        title: x.title || `洞察 ${idx + 1}`,
        body: x.body,
      })),
    };
    while (parsedResearch[name].insights.length < 4) {
      parsedResearch[name].insights.push({
        title: `待补洞察 ${parsedResearch[name].insights.length + 1}`,
        body: "master 文档暂未补足该条，保留占位，不编造。",
      });
    }

    const l2Section = firstSection(section, /^## 二级行业内容/m, /^# /m);
    const l2Matches = [...l2Section.matchAll(/^###\s+([^\n]+)\n([\s\S]*?)(?=^###\s+|^#\s+|\s*$)/gm)];
    for (const m of l2Matches) {
      const l2 = m[1].trim();
      const body = m[2];
      const signals = [...body.matchAll(/增长信号\d+[：:]\s*([\s\S]*?)(?=\n\s*增长信号\d+[：:]|\n\s*需要外部补证[：:]|$)/g)]
        .map((x) => cleanMdText(x[1]).replace(/\n+/g, " "))
        .filter(Boolean);
      const proof = (body.match(/需要外部补证[：:]\s*([^\n]+)/) || [])[1];
      if (proof) signals.push(`需要外部补证：${proof.trim()}`);
      if (signals.length) parsedL2[l2] = signals.slice(0, 4);
    }
  }
  return { researchNotes: parsedResearch, l2Notes: parsedL2 };
}

const masterContent = parseMasterContent();
const mergedResearchNotes = { ...researchNotes, ...masterContent.researchNotes };
const mergedL2Notes = { ...l2Notes, ...masterContent.l2Notes };

const evidenceNotes = {
  "电源/储能/充电": [
    "EcoFlow CES 2026 官方页：home solar、residential energy storage、home backup power stations、portable power stations 被放在同一套家庭能源叙事里。",
    "Jackery CES 2026 PR：从 portable power station 扩展到 yard、outdoor spaces、RV 和 Essential Home Backup Solution。",
    "Anker SOLIX C2000 Gen 2 官方页：停电冰箱供电、RV alternator charging、10ms UPS、Storm Guard Mode，证明不是普通充电宝。"
  ],
  "相机/影像/无人机": [
    "DJI NAB 2026 PR：RS 5、Osmo 360 等创作者工具发布，验证增长来自内容生产工具升级。",
    "GoPro NAB 2026 PR：新一代相机发布节点，说明影像赛道要看新品节奏和创作者工作流。"
  ],
  "智能穿戴/智能硬件": [
    "RingConn CES 2026：无订阅费、睡眠健康与智能戒指叙事，说明 CN 品牌可在手表之外建立细分认知。"
  ],
  "智能安防/监控": [
    "eufy 官方安全页：Local AI 与 no monthly fees 是家庭安防产品差异点。",
    "CES 2026 Reolink OMVI X Cam：多镜头 AI 摄像头获奖，验证本地 AI / 多摄协同趋势。"
  ],
  "脱毛与剃须": [
    "Ulike TikTok Shop 2026 New Arrival：IPL 脱毛仪用冰感、肤色传感、4周减毛等参数和内容卖点承接转化。",
    "Wavytalk Bare It 2026 launch：从美发工具扩展到冰感脱毛设备，并声明 Amazon 独家首发，验证设备型个护可由内容品牌外延。"
  ],
  "护肤与个人护理": [
    "K-Beauty / medicube / ANUA 需要继续补 TikTok 种草、功效验证与 Amazon 转化证据；纯护肤不是供应链白牌逻辑。",
    "Beauty of Joseon TikTok Shop / creator strategy evidence：K-Beauty 的增长更像内容种草向电商承接，不是 Amazon 站内自然搜索独立完成。"
  ],
  "头发护理/造型": [
    "TYMO AIRHYPE Ulta listing：美发造型工具进入专业零售渠道，证明这类客户不能只按 Amazon 铺货理解。",
    "Laifen CES 2026：Wave Pro 电动牙刷与 Mini Hair Dryer 同台发布，说明个人护理设备正在消费电子化。",
    "Wavytalk hair tools / Coachella 2026：美发工具通过节日场景、达人内容和 Amazon 承接形成内容-转化闭环。"
  ],
  "服饰/时装": [
    "McKinsey State of Fashion 2026：关税、采购成本和供应链压力会影响服饰利润，Fashion 不能只看 GMV 增长。",
    "Fashion supply chain 2026 trend evidence：成本压力、快速反应和供应链韧性决定服饰卖家能否持续上新。"
  ],
  "厨房餐饮": [
    "Amazon 2026 kitchen appliance deal coverage：空气炸锅、咖啡机、制冰/冷饮设备持续成为季节促销主角。",
    "Good Housekeeping 2026 air fryer Amazon testing：空气炸锅已从趋势品变成高频厨房小家电，评价和测试证据影响转化。"
  ],
  "医疗器械/健康护理": [
    "FDA dietary supplement warning letters：营养补剂与健康品类存在合规高压，Health 不能用普通消费品逻辑解释。",
    "家庭健康设备需要继续补 FDA、CES、远程监测和 App 数据服务证据。"
  ],
  "营养补剂/运动营养": [
    "FDA dietary supplement warning letters：补剂品类存在标签、成分、疾病声明等合规风险，不能按普通快消品低价逻辑切入。",
    "高蛋白/GLP-1/功能营养趋势可以解释需求方向，但品牌信任和成分证据决定转化。"
  ],
  "母婴护理": [
    "FDA recalls and safety alerts：母婴护理与婴幼儿食品高度依赖安全、召回和认证监控。",
    "Pampers / HUGGIES / Honest 等头部品牌主导，说明信任壁垒比价格和铺货更关键。"
  ],
  "饮料/咖啡茶": [
    "Pacvue Q1 2026 Grocery：Amazon Grocery 品类广告日均花费同比增加 6-7%，说明食品饮料线上竞争更多体现为广告和零售媒体竞争。",
    "Amazon Grocery/coffee-tea 不是泛增长，底表 MoM 下行时应看咖啡器具、功能饮料、套装和复购，而不是包装为增长行业。"
  ],
  "零食糖果": [
    "NAMA 2026 protein snacking：高蛋白零食成为功能化零食主线，消费者把零食当作满足感与功能营养结合。",
    "FoodNavigator-USA 2026：蛋白零食从热点变成日常化预期，增长机会应看高蛋白、低糖、GLP-1 相关饮食变化，而不是普通糖果。",
    "Tastewise 2026 snacks：高蛋白零食有更高 30 天复购信号，适合用复购与订阅口径解释。"
  ],
  "婴幼儿食品": [
    "FDA recalls / safety alerts：婴幼儿食品和配方奶粉属于高信任和高合规品类，正增长也不能按普通食品逻辑解释。",
    "Similac / Enfamil 等头部品牌主导，CN 渗透为 0，说明机会更多是观察母婴健康需求而非立即 BD 中国供给。"
  ],
  "食品饮料综合": [
    "Pacvue Q1 2026 Grocery：Amazon Grocery 广告花费增长，食品饮料综合更像渠道与零售媒体竞争，不是单纯新品增长。",
    "FDA food recalls / safety alerts：食品饮料综合需要持续监控召回、成分、标签和安全风险。"
  ],
  "运动户外": [
    "Weber 2026 lineup：智能烤炉、远程监控和烹饪辅助进入户外烹饪，说明运动户外/庭院消费有设备升级逻辑。",
    "Traeger 2026 Irontop：户外 griddle 竞争加剧，Blackstone / Weber / Traeger 的新品节奏说明这不是普通季节销售。",
    "Amazon grill deals May 2026：烧烤季促销集中于 Weber、Traeger、Blackstone、Ninja 等品牌，季节性和品牌促销需要单独解释。"
  ],
  "花园园艺/泳池": [
    "Thermacell 2026 mosquito season guide：园艺/户外防虫需求强烈受州别气候、蚊虫季和疾病风险影响。",
    "Ortho / Scotts / Thermacell 出现在底表头部品牌，说明该类目要用季节和场景解释，不应只看单月 GMV。"
  ],
  "家居家装": [
    "家居家装需要补搬家季、收纳、租房改善和小空间组织证据；底表 CN 占比高，供给侧已验证，但外部场景证据仍不足。"
  ]
};

const activeResearchNotes = Object.fromEntries(
  Object.entries(mergedResearchNotes).filter(([k]) => !["Gaming", "Auto & Mobility"].includes(k))
);

const sources = [
  { name: "Grand View Research Portable Power Station Market", url: "https://www.grandviewresearch.com/industry-analysis/portable-power-station-market-report" },
  { name: "DJI at NAB 2026", url: "https://www.prnewswire.com/news-releases/dji-showcases-best-in-class-creator-tools-at-nab-2026-302740271.html" },
  { name: "GoPro NAB 2026 announcement", url: "https://www.prnewswire.com/news-releases/gopro-to-unveil-new-generation-of-cameras-at-the-april-2026-nab-show-302724410.html" },
  { name: "RingConn CES 2026", url: "https://ringconn.com/pages/ringconn-at-ces-2026" },
  { name: "eufy Local AI / no monthly fees", url: "https://www.eufy.com/security" },
  { name: "CES 2026 Reolink OMVI X Cam", url: "https://www.ces.tech/ces-innovation-awards/2026/reolink-omvi-x-cam/" },
  { name: "TYMO AIRHYPE at Ulta", url: "https://www.ulta.com/p/airhype-high-speed-hair-dryer-mkt77000804" },
  { name: "Wavytalk Bare It Amazon launch", url: "https://www.globenewswire.com/news-release/2026/01/09/3216150/0/en/Achieve-97-34-Hair-Reduction-in-Weeks-with-the-Wavytalk-Bare-It-the-New-Wavytalk-Hair-Removal-System-with-Ice-Cooling-Technology.html" },
  { name: "Laifen CES 2026 personal care tools", url: "https://www.latimes.com/b2b/consumer-goods-retail/story/laifen-wave-pro-mini-hair-dryer-ces-2026" },
  { name: "McKinsey State of Fashion 2026", url: "https://www.mckinsey.com/~/media/mckinsey/industries/retail/our%20insights/state%20of%20fashion/2026/the-state-of-fashion-2026-vf.pdf" },
  { name: "FDA dietary supplement warning letters", url: "https://www.fda.gov/food/compliance-enforcement-food/warning-letters-related-food-beverages-and-dietary-supplements" },
  { name: "Pacvue Q1 2026 Grocery trends", url: "https://pacvue.com/blog/q1-2026-grocery-industry-trends-and-takeaways/" },
  { name: "NAMA Protein Snacking Growth 2026", url: "https://namanow.org/protein-snacking-growth/" },
  { name: "FDA food recalls and safety alerts", url: "https://www.fda.gov/safety/recalls-market-withdrawals-safety-alerts" },
  { name: "Weber 2026 smart grilling lineup", url: "https://www.businesswire.com/news/home/20260121111118/en/Weber-Expands-Smart-Grilling-Portfolio-to-Create-the-Backyards-First-Seamless-Smart-Ecosystem" },
  { name: "Traeger Irontop 2026 launch", url: "https://www.nasdaq.com/press-release/traeger-expands-outdoor-cooking-experience-all-new-irontop-2026-04-28" },
  { name: "Thermacell mosquito season 2026", url: "https://www.thermacell.com/blog/mosquito-season-when-is-it-in-your-state" }
];

function buildResearchPack() {
  const payload = {
    generated_at: "2026-06-03",
    scope: "Amazon US only; processed bottom tables + research notes",
    notes:
      "Consumer Electronics 已并入 Consumer Tech；消费电子综合在前端研究口径拆为办公打印/商用电子、电子阅读器、电视/投影/视听娱乐、智能安防/监控、音频/DJ/K歌。",
    sources,
    evidence_notes: evidenceNotes,
    records: Object.fromEntries(Object.entries(activeResearchNotes).map(([l1, v]) => [l1, { ...v, l2_notes: mergedL2Notes }]))
  };
  write("portal/data/research/amazon_us_industry_playbooks_v0_3.json", JSON.stringify(payload, null, 2));
  write("data_assets/curated/research/amazon_us_industry_playbooks_v0_3.json", JSON.stringify(payload, null, 2));
}

function marketPageHtml() {
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>市场中心 · Amazon US</title>
  <link rel="stylesheet" href="../../assets/portal.css" />
  <style>
:root{--blue:#2563EB;--green:#10B981;--red:#EF4444;--line:#E6ECF5;--muted:#64748B;--ink:#0F172A}*{box-sizing:border-box}body{overflow:hidden;background:#F7F9FC;color:var(--ink);font-family:Inter,"PingFang SC","Microsoft YaHei",Arial,sans-serif;font-size:15px}.shell{height:100vh}.sidebar{width:180px;height:100vh;background:#fff;border-right:1px solid var(--line)}.brand{font-size:18px}.nav a{border-radius:8px;font-size:15px;padding:13px 12px}.nav a.active{background:#EAF2FF;color:#1D4ED8;font-weight:800}.main{display:grid;grid-template-rows:72px minmax(0,1fr);height:100vh;background:#F7F9FC}.topbar{height:72px;background:#fff;border-bottom:1px solid var(--line);padding:12px 24px;align-items:center}.breadcrumb{font-size:22px;font-weight:850}.toolbar{gap:10px;align-items:center}.select{height:36px;border:1px solid #D6E0EF;border-radius:8px;background:#fff;color:#334155;font-size:14px}.search{height:36px;border-radius:8px;font-size:14px}.content{min-height:calc(100vh - 72px);display:grid;grid-template-rows:150px minmax(0,1fr) 220px;gap:16px;padding:16px 24px;overflow:hidden}.market-hero{display:grid;grid-template-columns:2fr repeat(5,1fr);height:150px;gap:16px;align-items:stretch;min-width:0}.panel,.card,.core-card{background:#fff;border:1px solid var(--line);border-radius:8px;box-shadow:0 8px 22px rgba(15,23,42,.045)}.core-card,.card{height:150px;padding:14px;overflow:hidden}.core-card h2{font-size:15px;margin:0 0 8px}.core-card ul{margin:0;padding-left:18px}.core-card li{font-size:13px;line-height:1.48;color:#334155}.grid-kpi{display:contents}.kpi-label{font-size:12px;color:var(--muted);font-weight:700}.kpi-value{font-size:25px;font-weight:900;margin-top:7px}.kpi-note{font-size:12px;color:var(--muted);margin-top:6px}.spark{height:42px;margin-top:4px;width:100%}.market-body{display:grid;grid-template-columns:minmax(420px,.88fr) minmax(640px,1.12fr);gap:16px;align-items:stretch;min-height:0;width:100%}.table-panel,.detail-panel,.bottom-grid>.panel{overflow:hidden}.panel{padding:14px}.panel-title{font-size:16px;margin:0 0 10px}.table-panel{height:100%;min-width:0}.table-wrap{height:calc(100% - 34px);overflow:auto}table{width:100%;min-width:740px;border-collapse:collapse;font-size:12.5px}th{background:#F8FBFF;color:#64748B;font-weight:800;white-space:nowrap}th,td{height:40px;border-bottom:1px solid #E8EEF7;padding:0 8px;text-align:left;vertical-align:middle}tbody tr{cursor:pointer}tbody tr:hover{background:#F8FBFF}.rank{color:#64748B;font-weight:800}.brand-strip{display:flex;gap:5px;flex-wrap:wrap}.brand-logo{font-weight:800;font-size:10.5px;background:#F8FAFC;border:1px solid #DCE5F2;border-radius:6px;padding:2px 5px}.bottom-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;height:220px;min-width:0}.bottom-grid>.panel{height:220px}.snapshot-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;height:168px;overflow:hidden}.snapshot-list{display:grid;gap:6px}.snapshot-row{display:grid;grid-template-columns:22px minmax(0,1fr) auto;gap:7px;align-items:center;border:1px solid var(--line);border-radius:8px;background:#fff;padding:6px 8px;font-size:12px}.snapshot-row b{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.snapshot-rank{color:#64748B;font-weight:800}.structure-card{border:1px solid var(--line);border-radius:8px;background:#fff;padding:9px;height:100%;overflow:auto}.structure-card .big{font-size:24px;font-weight:900;margin:3px 0}.structure-card p{font-size:12px;color:#475569;line-height:1.45;margin:0}.placeholder-panel{height:168px;display:flex;flex-direction:column;justify-content:center;align-items:flex-start;border:1px dashed #CBD5E1;border-radius:8px;background:#F8FAFC;padding:18px}.placeholder-panel h3{margin:0 0 8px;font-size:15px}.placeholder-panel p{margin:0;color:#475569;line-height:1.6}.detail-panel{height:100%;min-height:0;padding:14px;display:flex;flex-direction:column;overflow-y:auto}.detail-head{display:flex;align-items:center;justify-content:space-between}.detail-close{border:0;background:transparent;font-size:18px;color:#334155}.detail-tabs{display:flex;gap:10px;border-bottom:1px solid var(--line);margin:10px 0 12px;overflow-x:auto;flex:0 0 auto}.detail-tabs button{border:0;background:transparent;padding:0 0 10px;font-size:13px;font-weight:750;color:#475569;cursor:pointer;white-space:nowrap}.detail-tabs button.active{color:var(--blue);border-bottom:2px solid var(--blue);margin-bottom:-1px}.portrait-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:8px;margin-bottom:12px;flex:0 0 auto}.portrait{background:#F8FAFC;border-radius:8px;padding:9px;min-width:0}.portrait .k{font-size:11px;color:#64748B;white-space:nowrap}.portrait .v{font-size:16px;font-weight:900;margin-top:3px;white-space:nowrap}.trend-chart{height:260px;min-height:260px;border:1px solid var(--line);border-radius:8px;background:#fff;overflow:hidden;flex:0 0 auto}.detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px;flex:0 0 auto}.bubble-chart{height:150px;border:1px solid var(--line);border-radius:8px;background:#fff;overflow:auto}.mini-grid{display:grid;gap:7px}.mini-card{border:1px solid var(--line);border-radius:8px;background:#fff;padding:9px}.mini-card h3{font-size:13px;margin:0 0 4px}.mini-card p{font-size:12px;color:#475569;line-height:1.45;margin:0}.compact-list{display:grid;gap:7px;padding:10px}.compact-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:center;border:1px solid var(--line);background:#fff;border-radius:8px;padding:8px 9px;font-size:13px}.compact-row strong{white-space:nowrap}.signal-card-list{display:grid;gap:8px;padding:10px}.signal-card{display:grid;grid-template-columns:.85fr 1fr 1.25fr .65fr .75fr;gap:8px;align-items:center;border:1px solid var(--line);border-radius:8px;background:#fff;padding:8px;font-size:12px}.signal-card b{color:#0F172A}.signal-card span{color:#475569}.metric-mini{font-size:12px;color:#64748B}.legend{display:none}.axis-label{font-size:12px;fill:#64748B}.btn{height:34px;border:1px solid #bfdbfe;border-radius:8px;background:#eff6ff;color:#1d4ed8;font-weight:750}.analysis-stack{display:grid;gap:8px}.analysis-card{background:#F8FAFC;border-left:4px solid var(--blue);border-radius:8px;padding:9px}.analysis-card h3{font-size:13px;margin:0 0 4px}.analysis-card p{font-size:13px;line-height:1.5;margin:0;color:#334155}@media(max-width:1200px){body{overflow:auto}.shell,.main,.sidebar{height:auto}.content{display:block;overflow:auto}.market-hero,.market-body,.bottom-grid,.detail-grid,.snapshot-grid{grid-template-columns:1fr;height:auto}.table-wrap,.detail-panel,.bottom-grid>.panel{height:auto;width:auto}.portrait-grid{grid-template-columns:repeat(2,1fr)}.sidebar{display:none}}
    :root{--ui-scale:1}
    @media(min-width:1201px){
      .sidebar{width:calc(180px * var(--ui-scale))}
      .main{grid-template-rows:calc(72px * var(--ui-scale)) minmax(0,1fr)}
      .topbar{height:calc(72px * var(--ui-scale));padding:calc(12px * var(--ui-scale)) calc(24px * var(--ui-scale))}
      .breadcrumb{font-size:clamp(18px,calc(22px * var(--ui-scale)),22px)}
      .select,.search{height:calc(36px * var(--ui-scale));font-size:clamp(12px,calc(14px * var(--ui-scale)),14px)}
      .content{min-height:0;height:calc(100dvh - (72px * var(--ui-scale)));grid-template-rows:calc(150px * var(--ui-scale)) minmax(0,1fr) calc(220px * var(--ui-scale));gap:calc(16px * var(--ui-scale));padding:calc(16px * var(--ui-scale)) calc(24px * var(--ui-scale))}
      .market-hero,.core-card,.card{height:calc(150px * var(--ui-scale))}
      .core-card,.card,.panel{padding:calc(14px * var(--ui-scale))}
      .core-card h2{font-size:clamp(13px,calc(15px * var(--ui-scale)),15px)}
      .core-card li{font-size:clamp(11px,calc(13px * var(--ui-scale)),13px);line-height:1.38}
      .kpi-value{font-size:clamp(20px,calc(25px * var(--ui-scale)),28px);margin-top:calc(7px * var(--ui-scale))}
      .kpi-note,.kpi-label{font-size:clamp(10px,calc(12px * var(--ui-scale)),12px)}
      .spark{height:calc(42px * var(--ui-scale));min-height:26px}
      .market-body{grid-template-columns:minmax(420px,.88fr) minmax(620px,1.12fr);gap:calc(16px * var(--ui-scale))}
      .panel-title{font-size:clamp(13px,calc(16px * var(--ui-scale)),16px);margin-bottom:calc(10px * var(--ui-scale))}
      .table-wrap{height:calc(100% - (34px * var(--ui-scale)));overflow:auto}
      .table-panel table{min-width:100%;table-layout:fixed}
      .table-panel th,.table-panel td{height:calc(40px * var(--ui-scale));min-height:30px;font-size:clamp(10px,calc(12.5px * var(--ui-scale)),12.5px);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .table-panel th:nth-child(1),.table-panel td:nth-child(1){width:32px}
      .table-panel th:nth-child(2),.table-panel td:nth-child(2){width:25%}
      .table-panel th:nth-child(3),.table-panel td:nth-child(3){width:13%}
      .table-panel th:nth-child(4),.table-panel td:nth-child(4){width:10%}
      .table-panel th:nth-child(5),.table-panel td:nth-child(5){width:13%}
      .table-panel th:nth-child(6),.table-panel td:nth-child(6){width:auto}
      .brand-strip{flex-wrap:nowrap;overflow:hidden}
      .brand-logo{font-size:clamp(9px,calc(10.5px * var(--ui-scale)),10.5px);padding:2px 5px;max-width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .bottom-grid,.bottom-grid>.panel{height:calc(220px * var(--ui-scale));min-height:150px}
      .snapshot-grid,.placeholder-panel{height:calc(168px * var(--ui-scale));min-height:112px}
      .snapshot-row{min-width:0;padding:calc(6px * var(--ui-scale)) calc(8px * var(--ui-scale));font-size:clamp(10px,calc(12px * var(--ui-scale)),12px)}
      .structure-card p,.mini-card p{font-size:clamp(10px,calc(12px * var(--ui-scale)),12px)}
      .detail-tabs{margin:calc(10px * var(--ui-scale)) 0 calc(12px * var(--ui-scale));gap:calc(10px * var(--ui-scale))}
      .detail-tabs button{font-size:clamp(11px,calc(13px * var(--ui-scale)),13px)}
      .portrait-grid{grid-template-columns:repeat(6,minmax(0,1fr));gap:calc(8px * var(--ui-scale));margin-bottom:calc(12px * var(--ui-scale))}
      .portrait{padding:calc(9px * var(--ui-scale))}
      .portrait .k{font-size:clamp(9px,calc(11px * var(--ui-scale)),11px)}
      .portrait .v{font-size:clamp(12px,calc(16px * var(--ui-scale)),16px)}
      .trend-chart{height:calc(260px * var(--ui-scale));min-height:150px}
      .detail-grid{gap:calc(10px * var(--ui-scale));margin-top:calc(10px * var(--ui-scale))}
      .bubble-chart{height:calc(150px * var(--ui-scale));min-height:100px}
    }
  </style>
</head>
<body>
<div class="shell"><aside class="sidebar"><div class="brand">增长情报门户</div><nav class="nav"><a href="../../index.html">周报</a><a href="../leads/">线索</a><a class="active" href="../market/">市场</a><a href="../players/">玩家</a><a href="../products/">产品</a><a href="#">创意</a></nav></aside>
<main class="main"><header class="topbar"><div class="breadcrumb">市场中心 / <span id="breadcrumb-l1">Beauty</span> <small id="scope-subtitle"></small></div><div class="toolbar"><select class="select" disabled><option>平台：Amazon</option></select><select class="select" disabled><option>国家：美国站</option></select><select class="select" id="l1-filter"></select><input id="search" class="search" placeholder="搜索二级行业 / Top 品牌"/></div></header>
<section class="content"><section class="market-hero"><section id="decision-strip"></section><section class="grid-kpi" id="kpis"></section></section><section class="market-body"><section class="panel table-panel"><h2 class="panel-title"><span id="table-title"></span><small id="table-summary"></small></h2><div class="table-wrap"><table class="clickable"><thead id="table-head"></thead><tbody id="table-body"></tbody></table></div></section><aside class="panel detail-panel"><div class="detail-head"><h2 class="panel-title"><span id="detail-title">类目详情</span></h2><button class="detail-close" type="button">×</button></div><div class="detail-tabs"><button class="active" type="button" data-tab="overview">类目概览</button><button type="button" data-tab="players">玩家格局</button><button type="button" data-tab="products">产品机会</button><button type="button" data-tab="signals">增长信号</button><button type="button" data-tab="actions">推荐动作</button></div><div class="portrait-grid" id="detail-portrait"></div><h3 class="panel-title" style="font-size:13px" id="detail-section-title">趋势图 <small>近 24 个月</small></h3><div class="trend-chart" id="trend-chart"></div><div class="legend" id="legend"></div><div class="detail-grid"><section><h3 class="panel-title" style="font-size:13px" id="detail-left-title">TOP 品牌</h3><div class="mini-grid" id="l2-stack"></div></section><section><h3 class="panel-title" style="font-size:13px" id="detail-right-title">CN 占比与增长</h3><div class="bubble-chart" id="bubble-chart"></div></section></div></aside></section><section class="bottom-grid"><section class="panel"><h2 class="panel-title">玩家格局概览</h2><div id="player-snapshot"></div></section><section class="panel"><h2 class="panel-title">增长信号概览 <small>近30天</small></h2><div id="market-signal-panel"></div></section></section></section></main></div><div class="drawer-backdrop" id="drawer-backdrop"></div><aside class="drawer" id="drawer"><button id="drawer-close" class="drawer-close">×</button><h2 id="drawer-title"></h2><p id="drawer-subtitle"></p><div id="drawer-body"></div></aside><script>window.PAGE_TYPE="market";</script><script src="../../assets/common.js"></script><script src="../../assets/report_pages_v0_3.js"></script></body></html>`;
}

function pageHtml(page) {
  if (page === "market") return marketPageHtml();
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
    body{overflow:hidden}.shell{height:100vh}.sidebar{height:100vh}.main{display:grid;grid-template-rows:auto minmax(0,1fr);height:100vh}.content{overflow:auto;padding:18px 24px 28px}.toolbar{flex-wrap:wrap}.select{min-width:132px}.scope-line{color:var(--muted);font-size:13px;margin:0 0 14px}.tag-row{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.tag{border:1px solid #bfdbfe;background:#eff6ff;color:#1d4ed8;border-radius:999px;padding:6px 10px;font-size:12px}.decision-strip{display:grid;gap:10px;grid-template-columns:repeat(4,minmax(0,1fr));margin-bottom:14px}.decision-card{background:#fff;border:1px solid var(--line);border-left:4px solid #14b8a6;border-radius:8px;padding:12px;min-height:116px}.decision-label{font-size:12px;color:var(--muted);font-weight:700}.decision-title{font-size:14px;font-weight:800;margin:5px 0;color:var(--ink)}.decision-body{font-size:12px;line-height:1.65;color:#475569}.dashboard-grid{display:grid;grid-template-columns:1.25fr .75fr;gap:14px}.trend-chart,.bubble-chart{height:330px;border:1px solid var(--line);border-radius:8px;background:#fff}.legend{display:flex;gap:12px;flex-wrap:wrap;margin-top:8px;font-size:12px;color:var(--muted)}.dot{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:5px}.axis-label{font-size:11px;fill:#64748b}.analysis-stack{display:grid;gap:10px}.analysis-card{background:#f8fafc;border-left:4px solid #3b82f6;border-radius:8px;padding:12px}.analysis-card:nth-child(1){border-left-color:#10b981;background:#ecfdf5}.analysis-card:nth-child(3){border-left-color:#f59e0b;background:#fffbeb}.analysis-card h3{font-size:14px;margin:0 0 6px}.analysis-card p{font-size:13px;line-height:1.7;margin:0;color:#334155}.mini-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.mini-card{border:1px solid var(--line);border-radius:8px;padding:12px;background:#fff}.mini-card h3{margin:0 0 6px;font-size:14px}.mini-card p{margin:0;color:#475569;font-size:12px;line-height:1.6}.table-wrap{max-height:520px;overflow:auto}table{min-width:1180px}.pill{display:inline-flex;border:1px solid var(--line);border-radius:999px;padding:2px 8px;font-size:11px;background:#f8fafc}.pill.cn{background:#dcfce7;color:#166534;border-color:#bbf7d0}@media(max-width:1000px){.decision-strip,.dashboard-grid,.mini-grid{grid-template-columns:1fr}.trend-chart,.bubble-chart{height:280px}}
  </style>
</head>
<body>
<div class="shell"><aside class="sidebar"><div class="brand">增长情报门户</div><nav class="nav"><a href="../../index.html">周报</a><a href="../leads/">线索</a>${active("market","市场","../market/")}${active("players","玩家","../players/")}${active("products","产品","../products/")}<a href="#">创意</a></nav></aside>
<main class="main"><header class="topbar"><input class="search" id="search" placeholder="搜索二级行业 / Top 品牌 / 产品机会"/><div class="toolbar"><select class="select" id="l1-filter"></select><select class="select" disabled><option>Amazon 美国</option></select><div class="tag-row"><span class="tag" id="tag-l1"></span><span class="tag">Amazon</span><span class="tag">美国</span></div></div></header>
<section class="content"><h1 class="page-title">${title}</h1><p class="scope-line" id="scope-subtitle"></p><section class="decision-strip" id="decision-strip"></section><section class="grid-kpi" id="kpis"></section><section class="dashboard-grid"><div class="panel"><h2 class="panel-title">二级行业走势 <small>曲线悬停看规模与代表玩家</small></h2><div class="trend-chart" id="trend-chart"></div><div class="legend" id="legend"></div></div><div class="panel"><h2 class="panel-title">大盘洞察 <small>4 条行业解释，不写 BD 动作</small></h2><div class="analysis-stack" id="analysis-stack"></div></div></section><section class="dashboard-grid" style="margin-top:14px"><div class="panel"><h2 class="panel-title">规模 × 增长定位 <small>横轴 MoM，纵轴月 GMV，气泡为 CN 占比</small></h2><div class="bubble-chart" id="bubble-chart"></div></div><div class="panel"><h2 class="panel-title">行业小调查 <small>替代原二级行业信号</small></h2><div class="mini-grid" id="l2-stack"></div></div></section><section class="panel table-panel"><h2 class="panel-title"><span id="table-title"></span><small id="table-summary"></small></h2><div class="table-wrap"><table class="clickable"><thead id="table-head"></thead><tbody id="table-body"></tbody></table></div></section></section></main></div><div class="drawer-backdrop" id="drawer-backdrop"></div><aside class="drawer" id="drawer"><button id="drawer-close" class="drawer-close">×</button><h2 id="drawer-title"></h2><p id="drawer-subtitle"></p><div id="drawer-body"></div></aside><script>window.PAGE_TYPE="${page}";</script><script src="../../assets/common.js"></script><script src="../../assets/report_pages_v0_3.js"></script></body></html>`;
}

function leadsHtml() {
  return `<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><title>线索中心</title><link rel="stylesheet" href="../../assets/portal.css"/><style>
body{overflow:hidden}.shell{height:100vh}.sidebar{height:100vh}.main{height:100vh;display:grid;grid-template-rows:auto minmax(0,1fr)}.content{overflow:auto;padding:18px 24px 28px}.toolbar{flex-wrap:wrap}.grid-kpi{grid-template-columns:repeat(6,minmax(120px,1fr))}.lead-layout{display:grid;grid-template-columns:1.35fr .65fr;gap:14px}.lead-cards{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}.lead-card{border:1px solid var(--line);border-radius:8px;background:#fff;padding:12px;min-height:142px}.lead-card h3{margin:0 0 8px;font-size:15px}.lead-card p{margin:3px 0;font-size:12px;line-height:1.45;color:#334155}.badge{float:right;border:1px solid var(--line);border-radius:4px;padding:1px 6px;font-size:11px}.badge.a{background:#fee2e2;color:#991b1b}.badge.b{background:#fef3c7;color:#92400e}.dist{display:grid;grid-template-columns:150px 1fr;gap:14px;align-items:center}.filters{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0}.table-wrap{max-height:430px;overflow:auto}table{min-width:1280px}.empty{color:var(--muted);padding:18px}.tag{border:1px solid #bfdbfe;background:#eff6ff;color:#1d4ed8;border-radius:999px;padding:6px 10px;font-size:12px}.small{font-size:12px;color:var(--muted)}@media(max-width:1100px){.grid-kpi{grid-template-columns:repeat(2,1fr)}.lead-layout,.lead-cards{grid-template-columns:1fr}.dist{grid-template-columns:1fr}}
</style></head><body><div class="shell"><aside class="sidebar"><div class="brand">增长情报门户</div><nav class="nav"><a href="../../index.html">周报</a><a class="active" href="./">线索</a><a href="../market/">市场</a><a href="../players/">玩家</a><a href="../products/">产品</a><a href="#">创意</a></nav></aside><main class="main"><header class="topbar"><input class="search" id="search" placeholder="搜索客户 / 展会 / 事件 / 关键词..."/><div class="toolbar"><select class="select" id="l1-filter"><option>Beauty</option><option>Consumer Tech</option><option>Lifestyle</option><option>Fashion</option><option>Health</option><option>FMCG</option></select><select class="select" id="country-filter"><option value="US">美国</option><option value="">全部国家</option></select><span class="tag">Amazon</span><span class="tag" id="tag-l1">Beauty</span><span class="tag">美国</span></div></header><section class="content"><h1 class="page-title">线索中心</h1><p class="small">客户线索来自 Beauty/Consumer Tech 事件表；展会线索来自出海展会汇总 v2.0，二者分开呈现，避免把展会当客户。</p><section class="grid-kpi" id="kpis"></section><section class="lead-layout"><div class="panel"><h2 class="panel-title">客户重点跟进 Top 5</h2><div class="lead-cards" id="top-leads"></div></div><div class="panel"><h2 class="panel-title">展会线索 Top 5</h2><div class="lead-cards" id="top-exhibitions"></div></div></section><section class="lead-layout" style="margin-top:16px"><div class="panel"><h2 class="panel-title">客户线索类型分布</h2><div class="dist"><div id="donut"></div><div id="dist-list"></div></div></div><div class="panel"><h2 class="panel-title">筛选器</h2><div class="filters"><select class="select" id="event-filter"><option value="">全部客户事件</option></select><select class="select" id="priority-filter"><option value="">全部优先级</option><option>A</option><option>B</option><option>C</option></select><button class="btn" id="reset-btn">重置</button></div></div></section><section class="panel" style="margin-top:16px"><h2 class="panel-title">客户线索明细 <small>新品、招投标、融资、招聘、渠道等客户事件</small></h2><div class="table-wrap"><table><thead><tr><th>客户</th><th>行业</th><th>国家</th><th>事件类型</th><th>信号类型</th><th>优先级</th><th>建议动作</th><th>时间</th><th>信源</th><th>状态</th></tr></thead><tbody id="rows"></tbody></table></div></section><section class="panel" style="margin-top:16px"><h2 class="panel-title">展会线索明细 <small>展会名称、时间、地点、行业分类、官网链接</small></h2><div class="table-wrap"><table><thead><tr><th>展会名称</th><th>行业</th><th>时间</th><th>地点</th><th>优先级</th><th>获客目标</th><th>报名/官网链接</th><th>状态</th></tr></thead><tbody id="exhibition-rows"></tbody></table></div></section></section></main></div><script src="../../assets/common.js"></script><script src="../../assets/leads_page_v0_3.js"></script></body></html>`;
}

function clientJs() {
  return `
const PLAYBOOKS=${JSON.stringify(activeResearchNotes)};
const L2_NOTES=${JSON.stringify(mergedL2Notes)};
const EVIDENCE_NOTES=${JSON.stringify(evidenceNotes)};
const COLORS=["#2563eb","#10b981","#f97316","#8b5cf6","#ef4444","#14b8a6","#64748b","#f59e0b"];
let marketData=[], playerData=[], productData=[], leadsData={records:[]}, currentMarketRow=null, currentMarketRows=[], currentMarketTab="overview";
function money(n){n=Number(n||0);if(n>=1e9)return "$"+(n/1e9).toFixed(2)+"B";if(n>=1e6)return "$"+(n/1e6).toFixed(1)+"M";if(n>=1e3)return "$"+(n/1e3).toFixed(1)+"K";return "$"+n.toFixed(0)}
function pct(n){return (Number(n||0)).toFixed(1)+"%"} function num(n){return Number(n||0).toLocaleString("en-US")} function uniq(a){return [...new Set(a.filter(Boolean))]}
function n1(x){return x||"未命名"}
function n2(l1,l2){return l2||"未命名"}
function normAll(rows){return rows.map(x=>({...x,normalized_l1:n1(x.standard_l1),normalized_l2:n2(x.standard_l1,x.standard_l2)})).filter(x=>x.normalized_l1!=="__DROP__")}
function selected(){return {l1:document.getElementById("l1-filter").value,q:document.getElementById("search").value.trim().toLowerCase()}}
function scoped(rows){const s=selected();return rows.filter(x=>x.country==="US"&&x.platform==="Amazon"&&x.normalized_l1===s.l1&&(!s.q||JSON.stringify(x).toLowerCase().includes(s.q)))}
function groupMarket(rows){const map=new Map(); for(const r of rows){const k=r.normalized_l2;if(!map.has(k))map.set(k,{normalized_l1:r.normalized_l1,normalized_l2:k,monthly_gmv:0,gmv:0,prev:0,cn:0,brand_count:0,cn_brand_count:0,product_count:0,brands:[],monthly_trend:{},raw_l2:[],raw_l3:[],source_files:[]});const g=map.get(k);g.monthly_gmv+=Number(r.monthly_gmv||0);g.gmv+=Number(r.gmv||0);g.prev+=Number(r.prev_monthly_gmv||0);g.cn+=Number(r.cn_monthly_gmv||0);g.brand_count+=Number(r.brand_count||0);g.cn_brand_count+=Number(r.cn_brand_count||0);g.product_count+=Number(r.product_count||0);g.brands.push(...(r.top_brands||[]));g.raw_l2.push(...(r.raw_l2_values||[r.standard_l2]));g.raw_l3.push(...(r.raw_l3_values||[]));if(r.source_file)g.source_files.push(r.source_file);Object.entries(r.monthly_trend||{}).forEach(([m,v])=>g.monthly_trend[m]=(g.monthly_trend[m]||0)+Number(v||0));} return [...map.values()].map(x=>({...x,growth_rate:x.prev?(x.monthly_gmv-x.prev)/x.prev*100:0,cn_share:x.monthly_gmv?x.cn/x.monthly_gmv*100:0,brands:uniq(x.brands).slice(0,8),raw_l2:uniq(x.raw_l2),raw_l3:uniq(x.raw_l3),source_files:uniq(x.source_files),signals:L2_NOTES[x.normalized_l2]||autoSignals(x)})).sort((a,b)=>b.gmv-a.gmv)}
function autoSignals(x){return["规模："+x.normalized_l2+" 当月 "+money(x.monthly_gmv)+"，代表品牌 "+(x.brands||[]).slice(0,4).join("、")+"。","增长：MoM "+pct(x.growth_rate)+"，"+(x.growth_rate>=5?"需要下钻新品、季节、渠道或外部需求原因。":"当前不是强增长，先看结构和玩家质量。"),"CN：CN 占比 "+pct(x.cn_share)+"，"+(x.cn_share>=40?"中国供给已验证。":x.cn_share<=8?"低渗透，可能存在品牌/合规/渠道壁垒。":"有一定中国玩家基础。")]}
function productRows(){const map=new Map(); for(const r of scoped(productData)){const k=r.standard_l3||r.product_name||r.normalized_l2;if(!map.has(k))map.set(k,{name:k,l2:r.normalized_l2,monthly_gmv:0,sales:0,cn:0,brands:[],rows:[]});const g=map.get(k);g.monthly_gmv+=Number(r.monthly_gmv_usd||0);g.sales+=Number(r.listing_monthly_sales||r.monthly_sales||0);g.cn=Math.max(g.cn,Number(r.cn_share||0));if(r.brand)g.brands.push(r.brand);g.rows.push(r)} return [...map.values()].sort((a,b)=>b.monthly_gmv-a.monthly_gmv)}
function playerRows(){const leads=leadBrandSet();return scoped(playerData).sort((a,b)=>scorePlayer(b,leads)-scorePlayer(a,leads))}
function leadBrandSet(){return new Set((leadsData.records||[]).filter(x=>n1(x.standard_l1)===selected().l1).map(x=>String(x.company||"").toLowerCase()))}
function scorePlayer(x,leads){let s=Number(x.estimated_gmv||0)/1e6; if(x.cn_flag)s+=100000; if(leads.has(String(x.brand||"").toLowerCase()))s+=200000; return s}
function renderFilters(){const values=uniq(marketData.map(x=>x.normalized_l1)).sort();const el=document.getElementById("l1-filter");el.innerHTML=values.map(v=>'<option value="'+v+'">'+v+'</option>').join("");const p=new URLSearchParams(location.search);const wanted=p.get("l1");el.value=values.includes(wanted)?wanted:(values.includes("Beauty")?"Beauty":values[0])}
function renderAll(){const marketRows=groupMarket(scoped(marketData));currentMarketRows=marketRows;currentMarketRow=marketRows[0]||null;const rows=window.PAGE_TYPE==="market"?marketRows:window.PAGE_TYPE==="players"?playerRows():productRows();const l1=selected().l1;const pb=PLAYBOOKS[l1]||{frame:l1+" 暂无历史观点。",insights:[{title:"先看规模",body:"规模是否足够支撑专题。"},{title:"再看增长",body:"MoM 是否有异动。"},{title:"最后看 CN",body:"中国玩家是否可见。"},{title:"保持实证",body:"不造结论。"}]};const tag=document.getElementById("tag-l1");if(tag)tag.textContent=l1;const bc=document.getElementById("breadcrumb-l1");if(bc)bc.textContent=l1+"（"+(l1==="Consumer Tech"?"消费电子":l1)+"）";document.getElementById("scope-subtitle").innerHTML=window.PAGE_TYPE==="market"?"":("Amazon 美国 · <strong>"+l1+"</strong> · "+(window.PAGE_TYPE==="players"?"为什么打客户":"为什么打产品"));renderDecision(marketRows,pb);renderKpis(marketRows,rows);if(window.PAGE_TYPE!=="market")renderAnalysis(pb);renderTable(rows);if(window.PAGE_TYPE==="market"){renderMarketDetail(currentMarketRow);renderPlayerSnapshot(marketRows);renderMarketSignals(pb,marketRows)}else{renderTrend(marketRows);renderBubble(marketRows);renderL2(marketRows)}}
function cleanText(s){return String(s||"").replace(/Conumer/g,"Consumer").replace(/BFashion/g,"Beauty/Fashion").replace(/\s+/g," ").trim()}
function shortPoint(s,n=42){return cleanText(s).split(/[。；;]/)[0].slice(0,n)}
function beautyCoreTrends(){return ["K-Beauty 与功效护肤接管内容入口：medicube、ANUA、Beauty of Joseon 把成分证据变成可传播的购买理由","设备型个护正在消费电子化：IPL、造型工具、口腔护理和美容仪更容易用参数、测评和价格带建立差异","中国玩家机会集中在可参数化、教程化、耗材化细分：美甲、造型工具、IPL、口腔护理和部分美容仪优先下钻"]}
function coreBullets(pb,growth,cn){if(selected().l1==="Beauty")return beautyCoreTrends();const insights=(pb.insights||[]).filter(x=>!/^待补/.test(x.title||""));const titles=insights.map(x=>cleanText(x.title)).filter(Boolean);const first=titles[1]||titles[0]||shortPoint(pb.frame,40);const second=titles.find(t=>/储能|科技|韩国|TikTok|供应链|复购|合规|季节|品牌化|创作者|健康/.test(t))||titles[2]||shortPoint(pb.frame,38);const third=(cn&&growth)?("数据锚点："+growth.normalized_l2+" MoM "+pct(growth.growth_rate)+"，"+cn.normalized_l2+" CN "+pct(cn.cn_share)):(titles[2]||shortPoint(pb.frame,38));return [first,second,third].map(x=>shortPoint(x,48))}
function renderDecision(marketRows,pb){const top=marketRows[0],growth=[...marketRows].sort((a,b)=>b.growth_rate-a.growth_rate)[0],cn=[...marketRows].sort((a,b)=>b.cn_share-a.cn_share)[0];if(window.PAGE_TYPE==="market"){const bullets=coreBullets(pb,growth,cn).filter(Boolean).map(x=>'<li>'+x+'</li>').join("");document.getElementById("decision-strip").innerHTML='<article class="core-card"><h2>核心趋势</h2><ul>'+bullets+'</ul></article>';return}const cards=[["规模锚点",top?top.normalized_l2:"暂无",top?"当月 "+money(top.monthly_gmv)+"，CN "+pct(top.cn_share)+"。原始口径："+top.raw_l2.slice(0,4).join(" / "):""],["增长异动",growth?growth.normalized_l2:"暂无",growth?"MoM "+pct(growth.growth_rate)+"。原因看新品、季节、渠道或外部需求，不只看排名。":""],["中国玩家",cn?cn.normalized_l2:"暂无",cn?"CN 占比 "+pct(cn.cn_share)+"，代表玩家："+cn.brands.slice(0,4).join("、"):""],["行业框架",pb.insights[0].title,pb.frame]];document.getElementById("decision-strip").innerHTML=cards.map(c=>'<article class="decision-card"><div class="decision-label">'+c[0]+'</div><div class="decision-title">'+c[1]+'</div><div class="decision-body">'+c[2]+'</div></article>').join("")}
function renderKpis(marketRows,rows){const total=marketRows.reduce((s,x)=>s+x.monthly_gmv,0),annual=marketRows.reduce((s,x)=>s+x.gmv,0),cn=total?marketRows.reduce((s,x)=>s+x.cn,0)/total*100:0,growth=weighted(marketRows),brands=uniq(marketRows.flatMap(x=>x.brands||[])).length;const trend=aggregateTrend(marketRows);const cards=window.PAGE_TYPE==="market"?[["年GMV",money(annual),"规模足够支撑专题"],["月销售额",money(total),"当前月 GMV"],["品牌数",num(brands),"Top 品牌去重"],["中国品牌GMV占比",pct(cn),"GMV 加权"],["二级行业",num(rows.length),"Beauty 标准拆分"]] : [["月度规模",money(total),"处理后底表"],["年化GMV",money(annual),"Amazon US"],["近月增长",pct(growth),"GMV 加权"],["CN占比",pct(cn),"GMV 加权"],[window.PAGE_TYPE==="players"?"中国玩家优先":window.PAGE_TYPE==="products"?"产品机会":"二级行业",num(rows.length),"当前筛选"]];document.getElementById("kpis").innerHTML=cards.map((c,i)=>'<div class="card"><div class="kpi-label">'+c[0]+'</div><div class="kpi-value">'+c[1]+'</div><div class="kpi-note">'+c[2]+'</div>'+(window.PAGE_TYPE==="market"?sparkline(trend,COLORS[i%COLORS.length]):'')+'</div>').join("")}
function aggregateTrend(rows){const t={}; rows.forEach(r=>Object.entries(r.monthly_trend||{}).forEach(([m,v])=>t[m]=(t[m]||0)+Number(v||0))); return Object.entries(t).sort().map(([m,v])=>v)}
function sparkline(values,color){if(!values.length)return "";const min=Math.min(...values),max=Math.max(...values),pts=values.map((v,i)=>[4+i*(92/Math.max(1,values.length-1)),38-((v-min)/(max-min||1))*30]);return '<svg class="spark" viewBox="0 0 100 42"><path d="'+pts.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ')+'" fill="none" stroke="'+color+'" stroke-width="2.4"/><path d="'+pts.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ')+' L96 40 L4 40 Z" fill="'+color+'" opacity=".08"/></svg>'}
function weighted(rows){const now=rows.reduce((s,x)=>s+x.monthly_gmv,0),prev=rows.reduce((s,x)=>s+x.prev,0);return prev?(now-prev)/prev*100:0}
function renderTrend(rows){const series=rows.filter(x=>Object.keys(x.monthly_trend).length>1).slice(0,6).map((x,i)=>({name:x.normalized_l2,color:COLORS[i],brands:x.brands,points:Object.entries(x.monthly_trend).sort().map(([m,v])=>({m,v}))}));if(!series.length){document.getElementById("trend-chart").innerHTML='<p class="muted" style="padding:16px">暂无趋势。</p>';return}const vals=series.flatMap(s=>s.points.map(p=>p.v)),min=Math.min(...vals)*.9,max=Math.max(...vals)*1.06,w=920,h=330,padL=58,padR=20,padT=22,padB=42,months=series[0].points.map(p=>p.m),x=i=>padL+i*((w-padL-padR)/Math.max(1,months.length-1)),y=v=>h-padB-((v-min)/(max-min||1))*(h-padT-padB);const yTicks=[0,.25,.5,.75,1].map(t=>{const yy=padT+t*(h-padT-padB), val=max-(max-min)*t;return '<line x1="'+padL+'" x2="'+(w-padR)+'" y1="'+yy+'" y2="'+yy+'" stroke="#e5edf5"/><text x="8" y="'+(yy+4)+'" class="axis-label">'+money(val)+'</text>'}).join("");const xTicks=months.map((m,i)=>i===0||i===months.length-1||i%6===0?'<text x="'+x(i)+'" y="'+(h-14)+'" text-anchor="middle" class="axis-label">'+m.slice(2)+'</text>':"").join("");const lines=series.map(s=>'<path d="'+s.points.map((p,i)=>(i?'L':'M')+x(i)+','+y(p.v)).join(' ')+'" fill="none" stroke="'+s.color+'" stroke-width="2.8"/>'+s.points.map((p,i)=>'<circle cx="'+x(i)+'" cy="'+y(p.v)+'" r="3" fill="'+s.color+'"><title>'+s.name+'\\n'+p.m+' '+money(p.v)+'\\n代表玩家：'+s.brands.slice(0,5).join("、")+'</title></circle>').join("")).join("");document.getElementById("trend-chart").innerHTML='<svg viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="none">'+yTicks+'<line x1="'+padL+'" x2="'+(w-padR)+'" y1="'+(h-padB)+'" y2="'+(h-padB)+'" stroke="#94a3b8"/><line x1="'+padL+'" x2="'+padL+'" y1="'+padT+'" y2="'+(h-padB)+'" stroke="#94a3b8"/>'+xTicks+lines+'<text x="'+(w-80)+'" y="'+(h-14)+'" class="axis-label">月份</text><text x="8" y="16" class="axis-label">月GMV</text></svg>';document.getElementById("legend").innerHTML=series.map(s=>'<span><i class="dot" style="background:'+s.color+'"></i>'+s.name+'</span>').join("")}
function renderAnalysis(pb){const el=document.getElementById("analysis-stack");if(!el)return;el.innerHTML=pb.insights.map((s,i)=>'<article class="analysis-card"><h3>洞察 '+(i+1)+'：'+s.title+'</h3><p>'+s.body+'</p></article>').join("")}
function renderBubble(rows){if(!rows.length){document.getElementById("bubble-chart").innerHTML="";return}const w=920,h=330,padL=62,padR=28,padT=24,padB=46,xVals=rows.map(r=>r.growth_rate),yVals=rows.map(r=>r.monthly_gmv),minX=Math.min(-10,...xVals)*1.1,maxX=Math.max(10,...xVals)*1.1,minY=Math.min(...yVals)*.8,maxY=Math.max(...yVals)*1.08,x=v=>padL+(v-minX)/(maxX-minX||1)*(w-padL-padR),y=v=>h-padB-(Math.log(v+1)-Math.log(minY+1))/(Math.log(maxY+1)-Math.log(minY+1)||1)*(h-padT-padB),zero=x(0);const grid=[0,.25,.5,.75,1].map(t=>'<line x1="'+padL+'" x2="'+(w-padR)+'" y1="'+(padT+t*(h-padT-padB))+'" y2="'+(padT+t*(h-padT-padB))+'" stroke="#e5edf5"/>').join("");const pts=rows.map((r,i)=>{const rr=6+Math.min(18,Math.max(0,r.cn_share)/5);return '<g><circle cx="'+x(r.growth_rate)+'" cy="'+y(r.monthly_gmv)+'" r="'+rr+'" fill="'+COLORS[i%COLORS.length]+'" fill-opacity=".72"><title>'+r.normalized_l2+'\\nMoM '+pct(r.growth_rate)+'\\n月GMV '+money(r.monthly_gmv)+'\\nCN '+pct(r.cn_share)+'\\n代表玩家：'+r.brands.slice(0,5).join("、")+'</title></circle><text x="'+(x(r.growth_rate)+rr+3)+'" y="'+(y(r.monthly_gmv)+4)+'" class="axis-label">'+r.normalized_l2+'</text></g>'}).join("");document.getElementById("bubble-chart").innerHTML='<svg viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="none">'+grid+'<line x1="'+zero+'" x2="'+zero+'" y1="'+padT+'" y2="'+(h-padB)+'" stroke="#cbd5e1" stroke-dasharray="4 4"/><line x1="'+padL+'" x2="'+(w-padR)+'" y1="'+(h-padB)+'" y2="'+(h-padB)+'" stroke="#94a3b8"/><line x1="'+padL+'" x2="'+padL+'" y1="'+padT+'" y2="'+(h-padB)+'" stroke="#94a3b8"/><text x="'+padL+'" y="'+(h-14)+'" class="axis-label">'+pct(minX)+'</text><text x="'+(w-padR-40)+'" y="'+(h-14)+'" class="axis-label">'+pct(maxX)+'</text><text x="'+(w-82)+'" y="'+(h-14)+'" class="axis-label">MoM</text><text x="8" y="16" class="axis-label">月GMV(log)</text>'+pts+'</svg>'}
function renderL2(rows){if(window.PAGE_TYPE==="market"&&currentMarketRow){document.getElementById("l2-stack").innerHTML=currentMarketRow.brands.slice(0,5).map((b,i)=>'<article class="mini-card"><h3>'+(i+1)+'. '+b+'</h3><p>代表品牌</p></article>').join("");return}document.getElementById("l2-stack").innerHTML=rows.slice(0,8).map(x=>'<article class="mini-card"><h3>'+x.normalized_l2+'</h3><p><strong>'+money(x.monthly_gmv)+'</strong> · MoM '+pct(x.growth_rate)+' · CN '+pct(x.cn_share)+'</p><p>'+x.signals[0]+'</p><p class="muted">代表玩家：'+x.brands.slice(0,4).join("、")+'</p></article>').join("")}
function renderTable(rows){if(window.PAGE_TYPE==="market")return renderMarketTable(rows); if(window.PAGE_TYPE==="players")return renderPlayerTable(rows); return renderProductTable(rows)}
function renderMarketTable(rows){const shown=rows.slice(0,10);document.getElementById("table-title").textContent="类目机会入口";document.getElementById("table-summary").textContent="最多 10 行，点击左侧二级行业刷新右侧主视觉";document.getElementById("table-head").innerHTML="<tr><th></th><th>二级行业</th><th>年GMV</th><th>MoM</th><th>CN GMV占比</th><th>TOP 3 品牌</th></tr>";document.getElementById("table-body").innerHTML=shown.map((x,i)=>'<tr data-index="'+i+'"><td class="rank">'+(i+1)+'</td><td><strong style="color:#2563eb">'+x.normalized_l2+'</strong></td><td>'+money(x.gmv)+'</td><td>'+pct(x.growth_rate)+'</td><td>'+pct(x.cn_share)+'</td><td><span class="brand-strip">'+x.brands.slice(0,3).map(b=>'<span class="brand-logo">'+b+'</span>').join("")+'</span></td></tr>').join("");bind(shown,selectMarket)}
function renderPlayerTable(rows){document.getElementById("table-title").textContent="玩家明细";document.getElementById("table-summary").textContent="中国玩家和线索命中优先，Apple/HP 等仅作背景";document.getElementById("table-head").innerHTML="<tr><th>品牌</th><th>二级行业</th><th>GMV</th><th>CN</th><th>产品/主类目</th><th>增长理由</th></tr>";document.getElementById("table-body").innerHTML=rows.slice(0,140).map((x,i)=>'<tr data-index="'+i+'"><td><strong>'+x.brand+'</strong></td><td>'+x.normalized_l2+'</td><td>'+money(x.estimated_gmv)+'</td><td>'+(x.cn_flag?'<span class="pill cn">CN</span>':'-')+'</td><td>'+(x.main_l3||'')+'</td><td>'+(x.growth_reason||'')+'</td></tr>').join("");bind(rows.slice(0,140),openPlayer)}
function renderProductTable(rows){document.getElementById("table-title").textContent="产品机会明细";document.getElementById("table-summary").textContent="当前仍为机会/类目层，不冒充 SKU";document.getElementById("table-head").innerHTML="<tr><th>产品机会</th><th>二级行业</th><th>月GMV</th><th>销量</th><th>CN</th><th>判断</th></tr>";document.getElementById("table-body").innerHTML=rows.slice(0,140).map((x,i)=>'<tr data-index="'+i+'"><td><strong>'+x.name+'</strong></td><td>'+x.l2+'</td><td>'+money(x.monthly_gmv)+'</td><td>'+num(x.sales)+'</td><td>'+pct(x.cn)+'</td><td>'+(x.cn>=45?'CN 供给已验证':x.monthly_gmv>1e8?'规模足够下钻真实 ASIN':'先观察买点和价格带')+'</td></tr>').join("");bind(rows.slice(0,140),openProduct)}
function bind(rows,fn){[...document.querySelectorAll("#table-body tr")].forEach(tr=>tr.addEventListener("click",()=>fn(rows[Number(tr.dataset.index)])))}
function selectMarket(x){currentMarketRow=x;renderMarketDetail(x)}
function setMarketTab(tab){currentMarketTab=tab;renderMarketDetail(currentMarketRow)}
function tabActive(){document.querySelectorAll(".detail-tabs button").forEach(b=>b.classList.toggle("active",b.dataset.tab===currentMarketTab))}
function setText(id,text){const el=document.getElementById(id);if(el)el.textContent=text}
function renderMarketDetail(x){if(!x)return;tabActive();const title=document.getElementById("detail-title");if(title)title.textContent=x.normalized_l2;const portrait=document.getElementById("detail-portrait");if(portrait)portrait.innerHTML=[["年GMV",money(x.gmv)],["月销售额",money(x.monthly_gmv)],["品牌数",num(x.brand_count||x.brands.length)],["中国品牌数",num(x.cn_brand_count||0)],["CN GMV占比",pct(x.cn_share)],["MoM",pct(x.growth_rate)]].map(c=>'<div class="portrait"><div class="k">'+c[0]+'</div><div class="v">'+c[1]+'</div></div>').join("");renderMarketTabContent(x)}
function renderPositionList(rows){const top=[...rows].sort((a,b)=>b.growth_rate-a.growth_rate).slice(0,4);return '<div class="compact-list">'+top.map(r=>'<div class="compact-row"><span><b>'+r.normalized_l2+'</b><div class="metric-mini">CN '+pct(r.cn_share)+' · '+money(r.monthly_gmv)+'</div></span><strong>'+pct(r.growth_rate)+'</strong></div>').join("")+'</div>'}
function evidenceLines(x){return [...(EVIDENCE_NOTES[x.normalized_l2]||[]),...(x.signals||[]).filter(s=>/PR|CES|NAB|TikTok|Google|Trends|展会|新品|发布|外部|补证|官网|媒体|报告|认证/i.test(s))].slice(0,4)}
function explainLines(x){const ev=new Set(evidenceLines(x));return (x.signals||[]).filter(s=>!ev.has(s)&&!/需要外部补证/.test(s)).slice(0,3)}
function signalFacts(x){const ev=evidenceLines(x)[0];const out=[["品类增长",x.normalized_l2,(x.growth_rate>=0?"MoM增长":"MoM回落"),pct(x.growth_rate),"已验证"],["中国品牌",x.brands.slice(0,3).join(" / ")||x.normalized_l2,"CN GMV占比",pct(x.cn_share),"已验证"],["场景需求",x.raw_l2.slice(0,2).join(" / ")||x.normalized_l2,shortPoint(explainLines(x)[0]||"需结合场景需求解释",34),"待外部验证","待补证"]]; if(ev)out.push(["外部事件",x.normalized_l2,shortPoint(ev,38),"PR/展会","待核查"]); out.push(["产品趋势",x.normalized_l2,"搜索/内容热度需追踪","待补证","待补证"]); return out}
function renderMarketSignals(pb,rows){const el=document.getElementById("market-signal-panel");if(!el)return;el.innerHTML='<div class="placeholder-panel"><h3>增长信号工作台</h3><p>点击左侧二级行业后，在右侧详情卡的“增长信号”Tab 查看事实型信号、行业解释和待补证证据。</p></div>'}
function renderMarketTabContent(x){const trend=document.getElementById("trend-chart"),bubble=document.getElementById("bubble-chart"),list=document.getElementById("l2-stack"),detailGrid=document.querySelector(".detail-grid");if(!x||!trend||!bubble||!list)return;detailGrid.style.display="grid";if(currentMarketTab==="overview"){setText("detail-section-title","趋势图");renderTrend([x]);detailGrid.style.display="none";return}if(currentMarketTab==="players"){setText("detail-section-title","玩家格局");setText("detail-left-title","TOP品牌 / 中国品牌");setText("detail-right-title","竞争结构");trend.innerHTML='<div class="compact-list">'+x.brands.slice(0,6).map((b,i)=>'<div class="compact-row"><span><b>'+(i+1)+'. '+b+'</b><div class="metric-mini">'+x.normalized_l2+' 代表品牌</div></span><strong>'+money(x.monthly_gmv/(i+2))+'</strong></div>').join("")+'</div>';list.innerHTML=x.brands.slice(0,4).map((b,i)=>'<article class="mini-card"><h3>'+b+'</h3><p>代表玩家；需进一步补国家、渠道、新品节奏。</p></article>').join("");bubble.innerHTML='<div style="padding:12px;font-size:12px;line-height:1.7;color:#475569">竞争结构：CN GMV占比 '+pct(x.cn_share)+'；Top品牌集中度用作格局判断，不在此处写行业原因。</div>';return}if(currentMarketTab==="products"){setText("detail-section-title","产品机会");setText("detail-left-title","高潜品类 / 产品方向");setText("detail-right-title","服务切入点");const prs=productData.filter(p=>p.normalized_l1===x.normalized_l1&&p.normalized_l2===x.normalized_l2).slice(0,6);trend.innerHTML='<div class="compact-list">'+(prs.length?prs.map(p=>'<div class="compact-row"><span><b>'+(p.standard_l3||p.product_name||p.normalized_l2)+'</b><div class="metric-mini">CN '+pct(p.cn_share||0)+'</div></span><strong>'+money(p.monthly_gmv_usd||0)+'</strong></div>').join(""):'<div class="compact-row"><span><b>暂无产品层记录</b><div class="metric-mini">后续回 SKU 索引补</div></span><strong>-</strong></div>')+'</div>';list.innerHTML=x.raw_l2.slice(0,5).map(r=>'<article class="mini-card"><h3>'+r+'</h3><p>高潜细类候选，需 SKU 层验证。</p></article>').join("");bubble.innerHTML='<div style="padding:12px;font-size:12px;line-height:1.7;color:#475569">切入点：Listing内容、测评素材、参数对比、价格带、渠道节奏。产品页今晚仍不冒充真实 SKU。</div>';return}if(currentMarketTab==="signals"){setText("detail-section-title","增长信号");setText("detail-left-title","行业解释");setText("detail-right-title","待补证/外部证据");const explains=explainLines(x);const ev=evidenceLines(x);trend.innerHTML='<div class="signal-card-list">'+signalFacts(x).map(r=>'<div class="signal-card"><b>'+r[0]+'</b><span>'+r[1]+'</span><span>'+r[2]+'</span><strong>'+r[3]+'</strong><em class="signal-status">'+r[4]+'</em></div>').join("")+'</div>';list.innerHTML=(explains.length?explains:x.signals.slice(0,2)).slice(0,3).map((s,i)=>'<article class="mini-card"><h3>为什么发生 '+(i+1)+'</h3><p>'+shortPoint(s,76)+'</p></article>').join("");bubble.innerHTML='<div class="compact-list">'+(ev.length?ev.map(s=>'<div class="compact-row"><span><b>待核查</b><div class="metric-mini">'+shortPoint(s,72)+'</div></span><strong>证据</strong></div>').join(""):'<div class="compact-row"><span><b>待补证</b><div class="metric-mini">新品发布、PR、Google Trends、展会活动、母行业趋势。</div></span><strong>证据</strong></div>')+'</div>';return}setText("detail-section-title","推荐动作");setText("detail-left-title","跟进建议");setText("detail-right-title","依据");trend.innerHTML='<div class="compact-list"><button class="btn">进入玩家格局</button><button class="btn">查看产品机会</button><button class="btn">查看增长信号</button><button class="btn">加入重点跟进</button></div>';list.innerHTML='<article class="mini-card"><h3>优先级</h3><p>'+(x.growth_rate>5?'增长明显，优先补证。':'先观察结构变化。')+'</p></article><article class="mini-card"><h3>CN渗透</h3><p>CN GMV占比 '+pct(x.cn_share)+'。</p></article>';bubble.innerHTML='<div style="padding:12px;font-size:12px;line-height:1.7;color:#475569">推荐动作只保留 BD 跟进入口和下一步动作，不替代行业解释。</div>'}
function renderPlayerSnapshot(rows){const el=document.getElementById("player-snapshot");if(!el)return;const l1=selected().l1;const players=scoped(playerData).sort((a,b)=>Number(b.estimated_gmv||0)-Number(a.estimated_gmv||0));const cnPlayers=players.filter(x=>x.cn_flag).slice(0,5);const topPlayers=players.slice(0,5);const total=players.reduce((s,x)=>s+Number(x.estimated_gmv||0),0);const cnTotal=players.filter(x=>x.cn_flag).reduce((s,x)=>s+Number(x.estimated_gmv||0),0);const top5=topPlayers.reduce((s,x)=>s+Number(x.estimated_gmv||0),0);const l2Count=rows.length;const chance=l1==="Beauty"?"Beauty 的中国机会不在纯护肤头部，而在可参数化、教程化、耗材化的细分：美甲、造型工具、IPL、口腔护理和部分美容仪更容易用测评、参数和价格带建立差异；纯功效护肤和香氛仍依赖品牌心智、功效背书和审美叙事。":"Top 5 集中度 "+pct(total?top5/total*100:0)+"；覆盖 "+num(players.length)+" 个玩家、"+num(l2Count)+" 个二级行业。优先判断中国玩家是否具备品牌、供应链或内容能力优势。";el.className="snapshot-grid";el.innerHTML='<section><h3 class="panel-title" style="font-size:13px;margin:0 0 8px">TOP 品牌（按估算GMV）</h3><div class="snapshot-list">'+topPlayers.map((p,i)=>'<div class="snapshot-row"><span class="snapshot-rank">'+(i+1)+'</span><b>'+p.brand+'</b><strong>'+money(p.estimated_gmv)+'</strong></div>').join("")+'</div></section><section><h3 class="panel-title" style="font-size:13px;margin:0 0 8px">中国品牌 TOP 5</h3><div class="snapshot-list">'+(cnPlayers.length?cnPlayers.map((p,i)=>'<div class="snapshot-row"><span class="snapshot-rank">'+(i+1)+'</span><b>'+p.brand+'</b><strong>'+money(p.estimated_gmv)+'</strong></div>').join(""):'<div class="structure-card"><p>当前筛选未识别到 CN 玩家。</p></div>')+'</div></section><section><h3 class="panel-title" style="font-size:13px;margin:0 0 8px">中国玩家机会判断</h3><div class="structure-card"><div class="metric-mini">CN玩家GMV占比</div><div class="big">'+pct(total?cnTotal/total*100:0)+'</div><p>'+chance+'</p></div></section>'}
function drawer(t,sub,html){document.getElementById("drawer-title").textContent=t;document.getElementById("drawer-subtitle").textContent=sub;document.getElementById("drawer-body").innerHTML=html;document.getElementById("drawer").classList.add("open");document.getElementById("drawer-backdrop").classList.add("open")}
function openMarket(x){drawer(x.normalized_l2,money(x.monthly_gmv)+" · MoM "+pct(x.growth_rate)+" · CN "+pct(x.cn_share),'<section class="drawer-section"><h3>行业小调查</h3><ol>'+x.signals.map(s=>'<li>'+s+'</li>').join("")+'</ol></section><section class="drawer-section"><h3>原始/拆分口径</h3><p>'+x.raw_l2.join(" / ")+'</p></section>')}
function openPlayer(x){const leads=(leadsData.records||[]).filter(l=>String(l.company||"").toLowerCase()===String(x.brand||"").toLowerCase());drawer(x.brand,x.normalized_l2+" · "+money(x.estimated_gmv),'<section class="drawer-section"><h3>为什么打这个客户</h3><p>'+(x.cn_flag?'中国玩家，优先看出海打法、内容素材和新品窗口。':'非中国玩家，主要作市场背景或竞品参照。')+'</p><p>'+(x.growth_reason||'')+'</p></section><section class="drawer-section"><h3>线索命中</h3>'+(leads.length?leads.map(l=>'<p><strong>'+l.event_type+'</strong>：'+l.summary+'<br>动作：'+l.action+'</p>').join(""):'<p>当前未命中 Beauty/3C 线索表。</p>')+'</section>')}
function openProduct(x){drawer(x.name,x.l2+" · "+money(x.monthly_gmv),'<section class="drawer-section"><h3>为什么打这个产品</h3><p>'+(x.cn>=45?'中国供给打法已验证，适合筛头部玩家和差异化新品。':x.monthly_gmv>1e8?'规模足够，适合继续下钻真实 ASIN、价格带和内容素材。':'先观察买点、评价和价格带。')+'</p></section>')}
function closeDrawer(){document.getElementById("drawer").classList.remove("open");document.getElementById("drawer-backdrop").classList.remove("open")}
function applyViewportFit(){if(window.PAGE_TYPE!=="market")return; if(window.innerWidth<=1200){document.documentElement.style.setProperty("--ui-scale","1");return} const scale=Math.max(.72,Math.min(1,window.innerWidth/1920,window.innerHeight/980));document.documentElement.style.setProperty("--ui-scale",scale.toFixed(3))}
window.addEventListener("resize",()=>{applyViewportFit(); clearTimeout(window.__fitTimer); window.__fitTimer=setTimeout(()=>{if(window.PAGE_TYPE==="market")renderAll()},120)});
async function init(){const [m,p,pr,l]=await Promise.all([loadJson("../../data/market/amazon_market_facts_monthly.json"),loadJson("../../data/players/amazon_players_monthly.json"),loadJson("../../data/products/amazon_products_monthly.json"),loadJson("../../data/leads/lead_events.json")]);playerData=normAll(p.records||[]);marketData=normAll(m.records||[]).filter(x=>x.normalized_l1!=="__DROP__");productData=normAll(pr.records||[]);leadsData=l;renderFilters();["search","l1-filter"].forEach(id=>document.getElementById(id).addEventListener("input",renderAll));document.querySelectorAll(".detail-tabs button").forEach(b=>b.addEventListener("click",()=>setMarketTab(b.dataset.tab)));document.getElementById("drawer-close").addEventListener("click",closeDrawer);document.getElementById("drawer-backdrop").addEventListener("click",closeDrawer);applyViewportFit();renderAll()} init().catch(e=>{document.querySelector(".content").innerHTML='<div class="panel">加载失败：'+e.message+'</div>'});
`;
}

function leadsJs() {
  return `
let data=[];
function eventKind(x){const s=[x.event_type,x.summary,x.product_action,x.action].join(" "); if(/招投标|招标|投标|tender|bid/i.test(s))return "招投标"; if(/融资|funding|投资|financing/i.test(s))return "融资动态"; if(/展会|CES|NAB|Cosmoprof|BEAUTY WORLD|Beautyworld|参展|expo/i.test(s))return "展会活动"; if(/新品|发布|launch|release|Gen|上线/i.test(s))return "新品发布"; if(/招聘|岗位|hiring/i.test(s))return "招聘动态"; if(/渠道|店铺|TikTok|Amazon|官方店|上线/i.test(s))return "渠道动态"; return "PR/其他"}
function priorityClass(x){return x==="A"?"a":x==="B"?"b":""}
function baseRows(){const l=document.getElementById("l1-filter").value,c=document.getElementById("country-filter").value,q=document.getElementById("search").value.trim().toLowerCase();return data.filter(x=>x.standard_l1===l&&(!c||x.country===c)&&(!q||JSON.stringify(x).toLowerCase().includes(q)))}
function isExhibition(x){return x.event_group==="展会活动"||x.event_type==="展会活动"||x.register_url||x.event_name}
function customerRows(){const e=document.getElementById("event-filter").value,p=document.getElementById("priority-filter").value;return baseRows().filter(x=>!isExhibition(x)&&(!e||x.event_group===e)&&(!p||x.priority===p))}
function exhibitionRows(){const p=document.getElementById("priority-filter").value;return baseRows().filter(x=>isExhibition(x)&&(!p||x.priority===p))}
function rows(){return customerRows()}
function renderLeadCards(el,items,empty){document.getElementById(el).innerHTML=items.length?items.slice().sort((a,b)=>(a.priority||"Z").localeCompare(b.priority||"Z")).slice(0,5).map((x,i)=>'<article class="lead-card"><span class="badge '+priorityClass(x.priority)+'">'+(x.priority||"-")+'</span><h3>'+(i+1)+'. '+(x.company||x.event_name)+'</h3><p><strong>'+x.event_group+'</strong> · '+(x.event_location||x.location||x.country||"-")+'</p><p>'+((x.product_action||x.summary||x.event_name||"").slice(0,62))+'</p><p class="small">'+(x.action||x.event_time||"待判断")+'</p><p class="small">'+(x.publish_date||"-")+'</p></article>').join(""):'<div class="empty">'+empty+'</div>'}
function render(){document.getElementById("tag-l1").textContent=document.getElementById("l1-filter").value;const cr=customerRows(),er=exhibitionRows();const k=["新品发布","招投标","融资动态","招聘动态","渠道动态","PR/其他"];const by={};cr.forEach(x=>by[x.event_group]=(by[x.event_group]||0)+1);const cards=[["客户线索",cr.length,"客户事件表"],["展会线索",er.length,"出海展会汇总"],["A级客户",cr.filter(x=>x.priority==="A").length,"优先级 A"],["A级展会",er.filter(x=>x.priority==="A").length,"会前触达"],["新品发布",by["新品发布"]||0,"产品/上市窗口"],["招投标/融资",(by["招投标"]||0)+(by["融资动态"]||0),"预算释放"]];document.getElementById("kpis").innerHTML=cards.map(c=>'<div class="card"><div class="kpi-label">'+c[0]+'</div><div class="kpi-value">'+c[1]+'</div><div class="kpi-note">'+c[2]+'</div></div>').join("");renderLeadCards("top-leads",cr,"当前行业暂无客户线索；不是没有机会，只是还没接入客户事件表。");renderLeadCards("top-exhibitions",er,"当前行业暂无展会线索。");renderDonut(k,by);document.getElementById("rows").innerHTML=cr.map(x=>'<tr><td><strong>'+x.company+'</strong><br><span class="small">'+(x.parent_company||"")+'</span></td><td>'+x.standard_l1+'<br><span class="small">'+x.standard_l2+'</span></td><td>'+x.country+'</td><td>'+x.event_group+'</td><td>'+x.event_type+'</td><td><span class="badge '+priorityClass(x.priority)+'">'+(x.priority||"-")+'</span></td><td>'+x.action+'</td><td>'+(x.publish_date||"-")+'</td><td>'+(x.source_url?'<a href="'+x.source_url+'" target="_blank">'+(x.source_name||"source")+'</a>':(x.source_name||"-"))+'</td><td>'+(x.status||"未处理")+'</td></tr>').join("");document.getElementById("exhibition-rows").innerHTML=er.map(x=>'<tr><td><strong>'+(x.event_name||x.company)+'</strong></td><td>'+x.standard_l1+'<br><span class="small">'+x.standard_l2+'</span></td><td>'+(x.event_time||x.publish_date||"-")+'</td><td>'+(x.event_location||x.location||"-")+'</td><td><span class="badge '+priorityClass(x.priority)+'">'+(x.priority||"-")+'</span></td><td>'+(x.customer_target||x.action||"-")+'</td><td>'+(x.register_url||x.source_url?'<a href="'+(x.register_url||x.source_url)+'" target="_blank">'+(x.source_name||"官网/报名")+'</a>':'-')+'</td><td>'+(x.status||"待核查")+'</td></tr>').join("")}
function renderDonut(keys,by){const total=Object.values(by).reduce((a,b)=>a+b,0); if(!total){document.getElementById("donut").innerHTML='<div class="empty">暂无</div>';document.getElementById("dist-list").innerHTML="";return}let acc=0;const colors=["#2563eb","#10b981","#f59e0b","#ef4444","#8b5cf6","#14b8a6","#94a3b8"];const seg=keys.map((k,i)=>{const v=by[k]||0;const a0=acc/total*2*Math.PI;acc+=v;const a1=acc/total*2*Math.PI;const large=a1-a0>Math.PI?1:0;const x0=75+58*Math.cos(a0),y0=75+58*Math.sin(a0),x1=75+58*Math.cos(a1),y1=75+58*Math.sin(a1);return v?'<path d="M75,75 L'+x0+','+y0+' A58,58 0 '+large+',1 '+x1+','+y1+' Z" fill="'+colors[i]+'"><title>'+k+' '+v+'</title></path>':""}).join("");document.getElementById("donut").innerHTML='<svg viewBox="0 0 150 150">'+seg+'<circle cx="75" cy="75" r="33" fill="#fff"/><text x="75" y="80" text-anchor="middle" style="font:700 18px system-ui">'+total+'</text></svg>';document.getElementById("dist-list").innerHTML=keys.map((k,i)=>'<div style="display:flex;align-items:center;justify-content:space-between;margin:7px 0;font-size:12px"><span><i style="display:inline-block;width:9px;height:9px;border-radius:50%;background:'+colors[i]+';margin-right:6px"></i>'+k+'</span><strong>'+((by[k]||0)/total*100).toFixed(0)+'%</strong></div>').join("")}
async function init(){const p=await loadJson("../../data/leads/lead_events.json");data=(p.records||p).map(x=>({...x,event_group:eventKind(x)}));const eventEl=document.getElementById("event-filter");[...new Set(data.filter(x=>!isExhibition({...x,event_group:eventKind(x)})).map(x=>eventKind(x)))].sort().forEach(v=>eventEl.insertAdjacentHTML("beforeend",'<option value="'+v+'">'+v+'</option>'));["search","l1-filter","country-filter","event-filter","priority-filter"].forEach(id=>document.getElementById(id).addEventListener("input",render));document.getElementById("reset-btn").addEventListener("click",()=>{document.getElementById("search").value="";document.getElementById("event-filter").value="";document.getElementById("priority-filter").value="";render()});render()} init().catch(e=>document.querySelector(".content").innerHTML='<div class="panel">加载失败：'+e.message+'</div>');
`;
}

function postProcessMarketStructure() {
  const marketHtmlPath = "portal/pages/market/index.html";
  const marketJsPath = "portal/assets/report_pages_v0_3.js";
  // Enrichment is generated by build_governed_amazon_us_portal_assets_v0_1.py.
  // Do not recreate the old 11-bucket Beauty placeholder here.

  const marketLayoutCss = `
  <style id="market-structure-rebuild">
    .content{height:calc(100dvh - 72px);min-height:0;display:grid;grid-template-rows:auto minmax(0,1fr);gap:14px;padding:14px 20px;overflow:hidden}
    .market-hero{height:auto;min-height:118px;max-height:132px;grid-template-columns:minmax(360px,2fr) repeat(5,minmax(140px,1fr));gap:14px;min-width:0}
    .core-card,.card{height:auto;min-height:118px;max-height:132px}
    .market-body{display:grid;grid-template-columns:minmax(500px,560px) minmax(0,1fr);gap:16px;min-height:0;width:100%;align-items:stretch}
    .table-panel,.detail-panel{height:100%;min-height:0}
    .table-panel{overflow:hidden;max-width:560px}
    .table-panel table{min-width:0;width:100%;table-layout:fixed}
    .table-panel th,.table-panel td{height:36px;padding:0 6px;font-size:11.5px}
    .table-panel th:nth-child(1),.table-panel td:nth-child(1){width:28px}
    .table-panel th:nth-child(2),.table-panel td:nth-child(2){width:32%}
    .table-panel th:nth-child(3),.table-panel td:nth-child(3){width:17%}
    .table-panel th:nth-child(4),.table-panel td:nth-child(4){width:13%}
    .table-panel th:nth-child(5),.table-panel td:nth-child(5){width:16%}
    .table-panel th:nth-child(6),.table-panel td:nth-child(6){width:auto}
    .table-panel .brand-strip{flex-wrap:nowrap;overflow:hidden}
    .table-panel .brand-logo{max-width:78px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .detail-panel{overflow-y:auto}
    .insight-list{display:grid;gap:6px}
    .insight-pill{height:32px;display:grid;grid-template-columns:auto auto minmax(0,1fr);gap:8px;align-items:center;border:1px solid #DCE5F2;border-radius:8px;background:#F8FBFF;padding:0 9px;overflow:hidden}
    .insight-dot{width:8px;height:8px;border-radius:50%;background:#2563EB}
    .insight-pill b{font-size:12px;white-space:nowrap;color:#0F172A}
    .insight-pill span:last-child{font-size:12px;color:#334155;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .trend-chart{height:232px;min-height:220px;max-height:240px}
    .empty-enhancement{border:1px dashed #CBD5E1;border-radius:8px;background:#F8FAFC;color:#475569;padding:18px;font-size:13px;line-height:1.7}
    .detail-grid .empty-enhancement{min-height:120px}
    @media(max-width:1200px){
      body{overflow:auto}.shell,.main,.sidebar{height:auto}.sidebar{display:none}
      .content{height:auto;display:block;overflow:auto;padding:14px}
      .market-hero,.market-body{grid-template-columns:1fr;height:auto;max-height:none}
      .table-panel,.detail-panel,.table-wrap{height:auto}
      .portrait-grid{grid-template-columns:repeat(2,1fr)}
    }
  </style>`;

  let html = read(marketHtmlPath);
  html = html.replace(
    /<section class="bottom-grid">[\s\S]*?<\/section><\/section><\/main>/,
    "</section></main>"
  );
  html = html.replace(/\.bottom-grid[^}]*}/g, "");
  html = html.replace(/\.snapshot-[^{]+{[^}]*}/g, "");
  html = html.replace(/\.placeholder-panel[^}]*}/g, "");
  html = html.replace(
    /\.table-panel,\.detail-panel,\.bottom-grid>\.panel/g,
    ".table-panel,.detail-panel"
  );
  html = html.replace("</style>\n</head>", `</style>${marketLayoutCss}\n</head>`);
  write(marketHtmlPath, html);

  let js = read(marketJsPath);
  js = js.replace(
    'let marketData=[], playerData=[], productData=[], leadsData={records:[]}, currentMarketRow=null, currentMarketRows=[], currentMarketTab="overview";',
    'let marketData=[], playerData=[], productData=[], leadsData={records:[]}, enhancementData={records:[]}, currentMarketRow=null, currentMarketRows=[], currentMarketTab="overview";'
  );
  js = js.replace(
    /function coreBullets[\s\S]*?function renderKpis/,
    `function coreBullets(pb,growth,cn){if(selected().l1==="Beauty")return [{tag:"结构变化",body:"护肤与个护拆细后，增量入口转向可参数化、可复购、可内容化细分。"},{tag:"中国机会",body:"CN品牌机会集中在美甲、造型工具、IPL、口腔护理和部分美容仪。"},{tag:"BD动作",body:"优先围绕可测评、可教程、可价格带对比的类目补证和找玩家。"}];const insights=(pb.insights||[]).filter(x=>!/^待补/.test(x.title||""));const titles=insights.map(x=>cleanText(x.title)).filter(Boolean);return (titles.length?titles:["先看规模","再看增长","最后看 CN"]).slice(0,3).map((x,i)=>({tag:["规模","增长","CN"][i]||"趋势",body:shortPoint(x,48)}))}
function renderDecision(marketRows,pb){const top=marketRows[0],growth=[...marketRows].sort((a,b)=>b.growth_rate-a.growth_rate)[0],cn=[...marketRows].sort((a,b)=>b.cn_share-a.cn_share)[0];if(window.PAGE_TYPE==="market"){const pills=coreBullets(pb,growth,cn).filter(Boolean).slice(0,3).map(x=>'<div class="insight-pill"><i class="insight-dot"></i><b>'+x.tag+'</b><span>'+x.body+'</span></div>').join("");document.getElementById("decision-strip").innerHTML='<article class="core-card"><h2>核心趋势</h2><div class="insight-list">'+pills+'</div></article>';return}const cards=[["规模锚点",top?top.normalized_l2:"暂无",top?"当月 "+money(top.monthly_gmv)+"，CN "+pct(top.cn_share)+"。原始口径："+top.raw_l2.slice(0,4).join(" / "):""],["增长异动",growth?growth.normalized_l2:"暂无",growth?"MoM "+pct(growth.growth_rate)+"。原因看新品、季节、渠道或外部需求，不只看排名。":""],["中国玩家",cn?cn.normalized_l2:"暂无",cn?"CN 占比 "+pct(cn.cn_share)+"，代表玩家："+cn.brands.slice(0,4).join("、"):""],["行业框架",pb.insights[0].title,pb.frame]];document.getElementById("decision-strip").innerHTML=cards.map(c=>'<article class="decision-card"><div class="decision-label">'+c[0]+'</div><div class="decision-title">'+c[1]+'</div><div class="decision-body">'+c[2]+'</div></article>').join("")}
function renderKpis`
  );
  js = js.replace(
    /function renderTrend\(rows\)[\s\S]*?function renderAnalysis/,
    `function smoothPath(pts){if(pts.length<2)return "";let d="M"+pts[0].x+","+pts[0].y;for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i],dx=b.x-a.x;d+=" C "+(a.x+dx*.45)+","+a.y+" "+(b.x-dx*.45)+","+b.y+" "+b.x+","+b.y}return d}
function renderTrend(rows){const series=rows.filter(x=>Object.keys(x.monthly_trend).length>1).slice(0,3).map((x,i)=>({name:x.normalized_l2,color:COLORS[i],brands:x.brands,points:Object.entries(x.monthly_trend).sort().slice(-24).map(([m,v])=>({m,v}))}));if(!series.length){document.getElementById("trend-chart").innerHTML='<p class="muted" style="padding:16px">暂无趋势。</p>';return}const vals=series.flatMap(s=>s.points.map(p=>p.v)),min=Math.min(...vals)*.92,max=Math.max(...vals)*1.08,w=920,h=232,padL=64,padR=24,padT=22,padB=34,months=series[0].points.map(p=>p.m),x=i=>padL+i*((w-padL-padR)/Math.max(1,months.length-1)),y=v=>h-padB-((v-min)/(max-min||1))*(h-padT-padB);const yTicks=[0,.333,.666,1].map(t=>{const yy=padT+t*(h-padT-padB),val=max-(max-min)*t;return '<line x1="'+padL+'" x2="'+(w-padR)+'" y1="'+yy+'" y2="'+yy+'" stroke="#EDF2F7"/><text x="8" y="'+(yy+4)+'" class="axis-label">'+money(val)+'</text>'}).join("");const tickIdx=[0,Math.round((months.length-1)*.2),Math.round((months.length-1)*.4),Math.round((months.length-1)*.6),Math.round((months.length-1)*.8),months.length-1].filter((v,i,a)=>a.indexOf(v)===i);const xTicks=tickIdx.map(i=>'<text x="'+x(i)+'" y="'+(h-10)+'" text-anchor="middle" class="axis-label">'+months[i].slice(2)+'</text>').join("");const defs='<defs><linearGradient id="trendArea" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#2563EB" stop-opacity=".28"/><stop offset="100%" stop-color="#2563EB" stop-opacity=".02"/></linearGradient></defs>';const lines=series.map((s,si)=>{const pts=s.points.map((p,i)=>({x:x(i),y:y(p.v),v:p.v,m:p.m}));const path=smoothPath(pts),base=h-padB,peak=pts.reduce((a,b)=>b.v>a.v?b:a,pts[0]),last=pts[pts.length-1],area=si===0?'<path d="'+path+' L '+last.x+','+base+' L '+pts[0].x+','+base+' Z" fill="url(#trendArea)"/>':"";return area+'<path d="'+path+'" fill="none" stroke="'+s.color+'" stroke-width="'+(si===0?3.2:2.2)+'" stroke-linecap="round"/><circle cx="'+last.x+'" cy="'+last.y+'" r="5" fill="'+s.color+'" stroke="#fff" stroke-width="2"><title>当前月 '+last.m+' '+money(last.v)+'</title></circle><circle cx="'+peak.x+'" cy="'+peak.y+'" r="4" fill="#0F172A"><title>峰值 '+peak.m+' '+money(peak.v)+'</title></circle><text x="'+Math.min(w-110,peak.x+8)+'" y="'+Math.max(16,peak.y-8)+'" class="axis-label">峰值 '+money(peak.v)+'</text>'}).join("");document.getElementById("trend-chart").innerHTML='<svg viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="none">'+defs+yTicks+'<line x1="'+padL+'" x2="'+(w-padR)+'" y1="'+(h-padB)+'" y2="'+(h-padB)+'" stroke="#CBD5E1"/>'+xTicks+lines+'<text x="8" y="16" class="axis-label">月GMV</text></svg>';const legend=document.getElementById("legend");if(legend)legend.innerHTML=series.map(s=>'<span><i class="dot" style="background:'+s.color+'"></i>'+s.name+'</span>').join("")}
function renderAnalysis`
  );
  js = js.replace(
    ";renderPlayerSnapshot(marketRows);renderMarketSignals(pb,marketRows)",
    ""
  );
  js = js.replace(
    /function renderMarketSignals[\s\S]*?function drawer/,
    `const PENDING_ENHANCEMENT="该类目内容待补充";
function enhancementFor(x){return (enhancementData.records||[]).find(r=>r.l1===x.normalized_l1&&r.l2===x.normalized_l2&&r.status==="ready")||null}
function pendingBox(){return '<div class="empty-enhancement">'+PENDING_ENHANCEMENT+'</div>'}
function renderItems(items,render){return Array.isArray(items)&&items.length?items.map(render).join(""):pendingBox()}
function renderMarketTabContent(x){const trend=document.getElementById("trend-chart"),bubble=document.getElementById("bubble-chart"),list=document.getElementById("l2-stack"),detailGrid=document.querySelector(".detail-grid");if(!x||!trend||!bubble||!list)return;const doc=enhancementFor(x);detailGrid.style.display="grid";if(currentMarketTab==="overview"){setText("detail-section-title","趋势图");renderTrend([x]);setText("detail-left-title","一句话类目判断");setText("detail-right-title","内容状态");list.innerHTML=doc&&doc.category_judgment?'<article class="mini-card"><h3>类目判断</h3><p>'+doc.category_judgment+'</p></article>':pendingBox();bubble.innerHTML=pendingBox();return}if(currentMarketTab==="players"){setText("detail-section-title","玩家格局");setText("detail-left-title","Top 海外 / 中国品牌");setText("detail-right-title","机会位 / 不建议切入位");trend.innerHTML=doc&&doc.players?'<div class="compact-list">'+renderItems(doc.players.top_overseas_brands||[],(b,i)=>'<div class="compact-row"><span><b>海外 '+(i+1)+'. '+b+'</b></span><strong>Top</strong></div>')+renderItems(doc.players.top_china_brands||[],(b,i)=>'<div class="compact-row"><span><b>中国 '+(i+1)+'. '+b+'</b></span><strong>CN</strong></div>')+'</div>':pendingBox();list.innerHTML=doc&&doc.players?'<article class="mini-card"><h3>中国品牌机会位</h3><p>'+(doc.players.china_brand_opportunity_position||PENDING_ENHANCEMENT)+'</p></article>':pendingBox();bubble.innerHTML=doc&&doc.players?'<div class="empty-enhancement">'+(doc.players.not_recommended_entry||PENDING_ENHANCEMENT)+'</div>':pendingBox();return}if(currentMarketTab==="products"){setText("detail-section-title","产品机会");setText("detail-left-title","高潜三级 / 代表产品");setText("detail-right-title","价格带 / 服务切入点");trend.innerHTML=doc&&doc.products?renderItems(doc.products.high_potential_l3||[],p=>'<article class="mini-card"><h3>'+p+'</h3><p>高潜三级类目</p></article>'):pendingBox();list.innerHTML=doc&&doc.products?renderItems(doc.products.representative_products||[],p=>'<article class="mini-card"><h3>'+p+'</h3><p>代表产品</p></article>'):pendingBox();bubble.innerHTML=doc&&doc.products?'<div class="empty-enhancement"><b>价格带/买点：</b>'+(doc.products.price_band_buying_points||PENDING_ENHANCEMENT)+'<br><b>服务切入点：</b>'+((doc.products.service_entry_points||[]).join(" / ")||PENDING_ENHANCEMENT)+'</div>':pendingBox();return}if(currentMarketTab==="signals"){setText("detail-section-title","增长信号");setText("detail-left-title","信号卡");setText("detail-right-title","待补证");trend.innerHTML=doc&&doc.signals?'<div class="signal-card-list">'+renderItems(doc.signals,(r)=>'<div class="signal-card"><b>'+(r.signal_type||"")+'</b><span>'+(r.brand_or_category||"")+'</span><span>'+(r.signal_content||"")+'</span><strong>'+(r.metric_or_evidence||"")+'</strong><em class="signal-status">'+(r.pending_proof||"待补证")+'</em></div>')+'</div>':pendingBox();list.innerHTML=pendingBox();bubble.innerHTML=pendingBox();return}setText("detail-section-title","推荐动作");setText("detail-left-title","BD跟进对象 / 服务");setText("detail-right-title","话术 / 证据");trend.innerHTML=doc&&doc.actions?'<div class="compact-list">'+renderItems(doc.actions.bd_followup_targets||[],t=>'<div class="compact-row"><span><b>'+t+'</b><div class="metric-mini">BD跟进对象</div></span><strong>BD</strong></div>')+'</div>':pendingBox();list.innerHTML=doc&&doc.actions?'<article class="mini-card"><h3>推荐服务</h3><p>'+((doc.actions.recommended_services||[]).join(" / ")||PENDING_ENHANCEMENT)+'</p></article>':pendingBox();bubble.innerHTML=doc&&doc.actions?'<div class="empty-enhancement"><b>话术方向：</b>'+(doc.actions.pitch_direction||PENDING_ENHANCEMENT)+'<br><b>需补证据：</b>'+(doc.actions.external_evidence_needed||PENDING_ENHANCEMENT)+'</div>':pendingBox()}
function drawer`
  );
  js = js.replace(
    'const [m,p,pr,l]=await Promise.all([loadJson("../../data/market/amazon_market_facts_monthly.json"),loadJson("../../data/players/amazon_players_monthly.json"),loadJson("../../data/products/amazon_products_monthly.json"),loadJson("../../data/leads/lead_events.json")]);',
    'const [m,p,pr,l,e]=await Promise.all([loadJson("../../data/market/amazon_market_facts_monthly.json"),loadJson("../../data/players/amazon_players_monthly.json"),loadJson("../../data/products/amazon_products_monthly.json"),loadJson("../../data/leads/lead_events.json"),loadJson("../../data/research/beauty_l2_content_enrichment_v0_1.json")]);'
  );
  js = js.replace("leadsData=l;renderFilters();", "leadsData=l;enhancementData=e||{records:[]};renderFilters();");
  write(marketJsPath, js);
}

function main() {
  buildResearchPack();
  write("portal/assets/report_pages_v0_3.js", clientJs());
  write("portal/assets/leads_page_v0_3.js", leadsJs());
  write("portal/pages/market/index.html", pageHtml("market"));
  write("portal/pages/players/index.html", pageHtml("players"));
  write("portal/pages/products/index.html", pageHtml("products"));
  write("portal/pages/leads/index.html", leadsHtml());
  postProcessMarketStructure();
  console.log("rendered research portal pages v0.3");
}

main();
