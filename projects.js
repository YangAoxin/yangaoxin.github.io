const ui = document.querySelector('#collections');
const dialog = document.querySelector('#preview');
const demo = document.querySelector('#demo');
const language = document.querySelector('.language');
const locationUrl = new URL(location.href);
let isChinese = locationUrl.searchParams.get('lang') === 'zh';
let openProject = '';
let opener;

const t = (en, zh) => isChinese ? zh : en;
const sections = [
  { id: 'applications', title: ['Application interfaces', '应用界面'] },
  { id: 'research-prototypes', title: ['Research prototypes', '研究原型'] },
  { id: 'urban', title: ['Urban interaction designs', '城市交互设计'] },
  { id: 'data', title: ['Maps & data visualization', '地图与数据可视化'] },
];
const gallery = {
  live: 'https://yangaoxin.github.io/research-models-and-demos/',
  source: 'https://github.com/YangAoxin/research-models-and-demos',
};
const projects = [
  { id: 'cs2', section: 'applications', view: 'inventory', title: ['CS2 inventory tooling', 'CS2 饰品管理工具'], intro: ['Filter sample items by category and switch between a card grid and an inventory table.', '按类别筛选示例饰品，在卡片和库存表之间切换。'] },
  { id: 'wechat', section: 'applications', view: 'quote', title: ['WeChat mini program & admin dashboard', '微信小程序与管理后台'], intro: ['Create a sample quote request on the mobile interface, then move it through the admin workflow.', '从小程序示例提交询价，再到管理后台推进处理状态。'] },
  { id: 'ui-gallery', section: 'applications', view: 'gallery', title: ['Interactive UI gallery', '网页交互示例集'], intro: ['The original public gallery includes a spatial grid, replay, card sorting, and a searchable table.', '已公开的原版示例集含空间棋盘、场景回放、卡片排序和表格搜索。'] },
  { id: 'venue-egress', section: 'research-prototypes', view: 'egress', title: ['Venue egress & multimodal connections (IJTST project)', '场馆散场与多方式交通（IJTST 项目）'], intro: ['Step through a sample venue release and onward travel by shuttle, rail, and walking.', '切换示例时间切片，查看场馆放行、接驳车、轨道和步行去向。'] },
  { id: 'response-agent', section: 'research-prototypes', view: 'agent', title: ['Disaster response agent', '灾害应对智能体'], intro: ['Replay a fictional incident and review how the evidence and draft task list change across stages.', '查看虚构灾情的阶段更新，以及证据、待确认事项和方案草稿如何变化。'] },
  { id: 'risk-lab', section: 'urban', view: 'risk', title: ['Urban risk & value lab', '城市风险—价值实验室'], intro: ['Drag the pressure and investment sliders to explore comparison cards with sample values.', '拖动压力和投入滑块，查看示例方案的指标对比。'] },
  { id: 'urban-pathways', section: 'urban', view: 'timeline', title: ['Long-term urban pathways', '城市长期发展路径预览'], intro: ['Select a development pathway and inspect its milestones.', '切换发展路径，查看各阶段的示例节点。'] },
  { id: 'flood-evolution', section: 'urban', view: 'flood', title: ['Synthetic urban flood evolution', '合成城市洪水演化'], intro: ['Scrub through a synthetic flood timeline and inspect individual districts.', '拖动阶段滑块，查看示例城市积水变化和分区状态。'] },
  { id: 'flood-comparison', section: 'urban', view: 'compare', title: ['Flood scenario comparison', '城市洪水与路径比较'], intro: ['Compare two scenario maps at the same point on a shared timeline.', '用同一时间滑块并排对照两个示例场景。'] },
  { id: 'spatial-safety', section: 'urban', view: 'route', title: ['Dynamic spatial safety routes', '动态空间安全路径'], intro: ['Switch stages and compare example routes across a schematic city.', '切换阶段和线路，查看示意城市里的通行路径。'] },
  { id: 'district-board', section: 'urban', view: 'board', title: ['Nine-district spatial board', '九区域动态空间棋盘'], intro: ['Inspect a district while changing the stage and the visible map layer.', '调节时间阶段、切换图层，再点击九宫格查看分区状态。'] },
  { id: 'risk-explorer', section: 'urban', view: 'explorer', title: ['Urban risk model explorer', '城市风险模型探索器'], intro: ['Switch the chart view and adjust controls to compare illustrative indicators.', '切换图表视角并拖动滑块，观察示例指标的变化。'] },
  { id: 'tuanzhou-network', section: 'data', view: 'network', title: ['Evacuation case network', '团洲疏散案例网络界面'], intro: ['Inspect evacuation stages and their evidence links in a schematic network.', '用完全虚构的节点，展示团洲案例原型中分阶段查看网络与材料的方式。'] },
  { id: 'tuanzhou-map', section: 'data', view: 'map', title: ['Evacuation case map', '团洲疏散案例地图界面'], intro: ['Switch map layers to examine illustrative transfer locations and links.', '用虚构位置和连线演示团洲案例原型的地图图层切换。'] },
  { id: 'land-use', section: 'data', view: 'sankey', title: ['Land-use transitions', '土地利用变化桑基图'], intro: ['Switch periods to explore a Sankey chart adapted from a remote-sensing course project.', '切换时间段，查看由遥感课程作品改编的土地利用流向图。'] },
];

const translated = [...document.querySelectorAll('[data-zh]')].map(node => ({
  node, label: [node.textContent, node.dataset.zh],
}));

function thumbnail(view) {
  const tiled = ['flood', 'compare', 'route', 'board', 'map'].includes(view);
  const bars = (values, grid = false) => values.map(size =>
    '<i style="--size:' + (grid ? size : Math.round(size * 100) + '%') + '"></i>').join('');
  const details = {
    inventory: '<div class="mini-inventory">' + ['S', 'V', 'N', 'A', 'C', 'L'].map(mark => '<span>' + mark + '</span>').join('') + '</div>',
    quote: '<div class="mini-phone"><b>' + t('Quote', '询价') + '</b><i></i><i></i><i></i></div><div class="mini-console"><b>' + t('Quote inbox', '询价管理') + '</b><i></i><i></i><span>' + t('Confirmed', '已确认') + '</span></div>',
    gallery: '<div class="mini-gallery"><i></i><i></i><i></i><i></i></div>',
    egress: '<div class="mini-egress">' + t(['Venue', 'Shuttle', 'Rail', 'Walk'], ['场馆', '接驳', '轨道', '步行']).map((name, index) => '<span>' + name + '<i style="--length:' + [93, 59, 47, 34][index] + '%"></i></span>').join('') + '</div>',
    agent: '<div class="mini-agent">' + t(['Report', 'Review', 'Update'], ['接报', '核对', '修订']).map(name => '<span>' + name + '</span>').join('') + '<i></i><i></i></div>',
    timeline: '<div class="mini-timeline"><i></i><i></i><i></i></div>',
    network: '<div class="mini-timeline"><i></i><i></i><i></i></div>',
    sankey: '<div class="mini-stream"><i></i><i></i><i></i></div>',
  };
  const sample = details[view] || '<div class="mini-plot' + (tiled ? ' tiled' : '') + '">' +
    (tiled ? bars([.3, .8, .42, .95, .63, .48, .88, .36, .65], true) : bars([.4, .65, .48, .8, .58, .94])) + '</div>';
  return '<div class="thumb ' + view + '" aria-hidden="true"><div class="thumb-window"><div class="window-bar"></div>' +
    sample + '</div></div>';
}

function renderCatalog() {
  document.documentElement.lang = t('en', 'zh-CN');
  document.title = t('Interface portfolio · Aoxin Yang', '界面作品集 · 杨奥新');
  document.querySelector('.section-nav').setAttribute('aria-label', t('Portfolio sections', '作品栏目'));
  for (const { node, label } of translated) node.textContent = t(...label);
  language.textContent = t('中文', 'English');
  language.lang = t('zh-CN', 'en');
  for (const link of document.querySelectorAll('.site-header a')) {
    link.href = t('./#projects', './?lang=zh#projects');
  }
  ui.innerHTML = sections.map(section => {
    const cards = projects.filter(project => project.section === section.id).map(project => {
      const actions = project.view === 'gallery'
        ? '<a href="' + gallery.live + '">' + t('Open original gallery', '打开原版演示') + '</a><a href="' + gallery.source + '">' + t('Source code', '源码') + '</a>'
        : '<a href="#' + project.id + '" data-preview="' + project.id + '">' + t('Open interactive preview', '打开交互预览') + '</a>';
      return '<article class="card">' + thumbnail(project.view) + '<div class="card-content"><h3>' +
        t(...project.title) + '</h3><p>' + t(...project.intro) + '</p><div class="card-links">' +
        actions + '</div></div></article>';
    }).join('');
    return '<section class="collection" id="' + section.id + '" aria-labelledby="' + section.id +
      '-title"><h2 id="' + section.id + '-title">' + t(...section.title) + '</h2><div class="cards">' +
      cards + '</div></section>';
  }).join('');
}

function choose(id, label, options) {
  return '<label class="control">' + label + '<select id="' + id + '">' +
    options.map((name, index) => '<option value="' + index + '">' + name + '</option>').join('') +
    '</select></label>';
}

function slider(id, label, min, max, value) {
  return '<label class="control"><span>' + label + ' <output id="' + id + '-value" for="' + id +
    '">' + value + '</output></span><input id="' + id + '" type="range" min="' + min +
    '" max="' + max + '" value="' + value + '"></label>';
}

function bindControl(id, event, update) {
  demo.querySelector('#' + id).addEventListener(event, update);
}

function read(id) {
  return Number(demo.querySelector('#' + id).value);
}

function readSlider(id) {
  const value = read(id);
  demo.querySelector('#' + id + '-value').textContent = value;
  return value;
}

const views = {};

views.inventory = () => {
  const groups = t(['All categories', 'Finish samples', 'Sticker samples', 'Container samples'], ['全部类别', '涂装样例', '贴纸样例', '容器样例']);
  const items = [
    [1, 'S', ['Slate', '岩灰'], 4], [1, 'V', ['Violet', '暮紫'], 2],
    [2, 'N', ['Northline', '北线'], 6], [2, 'S', ['Signal', '信号'], 3],
    [3, 'A', ['Archive', '档案'], 5], [3, 'C', ['Canvas', '帆布'], 1],
  ];
  demo.innerHTML = '<div class="controls">' + choose('category', t('Category', '饰品类别'), groups) +
    choose('layout', t('Layout', '展示方式'), t(['Cards', 'Table'], ['卡片', '列表'])) +
    '</div><p class="legend" id="inventory-count" aria-live="polite"></p><div id="inventory-items"></div>';
  const update = () => {
    const category = read('category');
    const filtered = items.filter(item => category === 0 || item[0] === category);
    demo.querySelector('#inventory-count').textContent = t(filtered.length + ' sample items', filtered.length + ' 个示例条目');
    const content = demo.querySelector('#inventory-items');
    if (read('layout') === 0) {
      content.innerHTML = '<div class="inventory-grid">' + filtered.map(([group, mark, name, quantity]) =>
        '<div class="inventory-item"><div class="inventory-mark" aria-hidden="true">' + mark +
        '</div><div class="inventory-label"><strong>' + t(...name) + '</strong><span>' +
        groups[group] + ' · ' + t('Qty ', '数量 ') + quantity + '</span></div></div>').join('') + '</div>';
    } else {
      content.innerHTML = '<div class="table-wrap"><table class="data-table"><thead><tr><th scope="col">' +
        t('Item', '饰品') + '</th><th scope="col">' + t('Category', '类别') + '</th><th scope="col">' +
        t('Quantity', '数量') + '</th></tr></thead><tbody>' +
        filtered.map(([group, , name, quantity]) => '<tr><td>' + t(...name) + '</td><td>' +
          groups[group] + '</td><td>' + quantity + '</td></tr>').join('') + '</tbody></table></div>';
    }
  };
  bindControl('category', 'change', update);
  bindControl('layout', 'change', update);
  update();
};

views.quote = () => {
  const products = ['205/55 R16', '215/60 R17', '225/50 R18'];
  const statuses = t(['New request', 'Quoted', 'Confirmed', 'Fulfilled'], ['待处理', '已报价', '已确认', '已履约']);
  const next = t(['Mark as quoted', 'Confirm quote', 'Mark fulfilled'], ['标记已报价', '确认报价', '标记已履约']);
  let request;
  demo.innerHTML = '<div class="split quote-layout"><form class="panel phone" id="quote-form"><h3>' +
    t('Mini program · new quote', '小程序 · 发起询价') + '</h3>' +
    choose('product', t('Sample tire size', '示例轮胎规格'), products) + '<label class="control">' +
    t('Quantity', '数量') + '<input type="number" id="quantity" value="2" min="1" max="20" required></label>' +
    '<button class="action" type="submit">' + t('Submit sample request', '提交示例询价') + '</button></form>' +
    '<section class="panel"><h3>' + t('Admin dashboard · quotes', '管理后台 · 询价单') +
    '</h3><div id="quote-result" aria-live="polite"></div>' +
    '<button class="action next-action" type="button" id="next-status" hidden></button></section></div>';
  const advance = demo.querySelector('#next-status');
  const update = () => {
    const result = demo.querySelector('#quote-result');
    if (!request) {
      result.textContent = t('Submit a request to see it here.', '提交询价后，后台会在这里显示。');
      return;
    }
    result.innerHTML = '<p>' + t('Sample request', '示例询价单') + ' · ' +
      products[request.product] + ' × ' + request.quantity + '</p><p class="quote-status">' +
      statuses[request.status] + '</p><p class="note">' + t('Sample stock', '示例可用库存') +
      ' · ' + ((request.product + 1) * 12 - (request.status === 3 ? request.quantity : 0)) + '</p>';
    advance.hidden = request.status === 3;
    advance.textContent = next[request.status] || '';
    if (request.status === 3) {
      result.tabIndex = -1;
      result.focus();
    }
  };
  bindControl('quote-form', 'submit', event => {
    event.preventDefault();
    request = { product: read('product'), quantity: read('quantity'), status: 0 };
    update();
  });
  bindControl('next-status', 'click', () => {
    request.status += 1;
    update();
  });
  update();
};

function metricBars(names, values) {
  return '<div class="metrics">' + names.map((name, index) => '<label class="metric"><span>' +
    name + '</span><meter min="0" max="100" value="' + values[index] + '">' + values[index] +
    '</meter><b>' + values[index] + '</b></label>').join('') + '</div>';
}

function riskPanel(explorer) {
  const labels = t(['Service continuity', 'Travel access', 'Public space'], ['服务连续性', '出行可达性', '公共空间']);
  demo.innerHTML = '<div class="controls">' +
    slider('pressure', t('Scenario pressure', '场景压力'), 0, 10, 4) +
    slider('investment', t('Illustrative investment', '示例投入'), 0, 10, 4) +
    (explorer ? choose('lens', t('Perspective', '查看视角'), t(['Resident', 'Operator'], ['居民侧', '运行侧'])) : '') +
    '</div><div class="split"><section class="panel"><h3>' + t('Sample plan A', '示例方案 A') +
    '</h3><div id="risk-a"></div></section><section class="panel"><h3>' + t('Sample plan B', '示例方案 B') +
    '</h3><div id="risk-b"></div></section></div>' +
    '<p class="legend">' + t('Illustrative comparison on a 0–100 scale.', '0–100 的界面示例刻度。') + '</p>';
  const update = () => {
    const p = readSlider('pressure');
    const i = readSlider('investment');
    const lens = explorer ? read('lens') * 4 : 0;
    demo.querySelector('#risk-a').innerHTML = metricBars(labels, [64 - 3*p + 2*i + lens, 67 - 2*p + i, 56 - p + lens]);
    demo.querySelector('#risk-b').innerHTML = metricBars(labels, [64 - 2*p + i, 61 - p + 2*i + lens, 50 - p + 3*i]);
  };
  bindControl('pressure', 'input', update);
  bindControl('investment', 'input', update);
  if (explorer) bindControl('lens', 'change', update);
  update();
}
views.risk = () => riskPanel(false);
views.explorer = () => riskPanel(true);

views.timeline = () => {
  const paths = t([
    ['Audit public facilities', 'Upgrade existing service hubs', 'Review coverage gaps'],
    ['Identify redevelopment areas', 'Open a secondary service hub', 'Review access from both hubs'],
    ['Map relocation needs', 'Move selected functions in phases', 'Monitor access to the new hub'],
  ], [
    ['盘点公共设施', '改造现有服务点', '复查服务覆盖缺口'],
    ['识别更新片区', '开放第二服务点', '复查两个服务点的可达性'],
    ['梳理搬迁需求', '分阶段迁移部分功能', '跟踪新服务点的可达性'],
  ]);
  demo.innerHTML = '<div class="controls">' + choose('pathway', t('Development pathway', '发展路径'),
    t(['Maintain', 'Transform', 'Relocate'], ['维持更新', '调整转型', '分期迁移'])) +
    '</div><div class="panel"><ol class="steps" id="milestones" aria-live="polite"></ol></div>';
  const update = () => {
    demo.querySelector('#milestones').innerHTML = paths[read('pathway')].map(item => '<li>' + item + '</li>').join('');
  };
  bindControl('pathway', 'change', update);
  update();
};

function districtDemo(view) {
  const districts = t(['North Hill', 'Station', 'East Park', 'West Bank', 'Town Center', 'East Bank', 'Depot', 'South Gate', 'School'],
    ['北岭', '车站', '东园', '西岸', '城心', '东岸', '仓库', '南门', '学校']);
  const compare = view === 'compare';
  const route = view === 'route';
  const board = view === 'board';
  const map = view === 'map';
  let active = 4;
  const layers = map ? t(['Transfer points', 'Sample link'], ['转移点位', '示例联系']) :
    t(['Flood exposure', 'Service locations'], ['积水状态', '服务点']);
  demo.innerHTML = '<div class="controls">' +
    (map ? '' : slider('stage', t('Stage', '阶段'), 1, 6, 1)) +
    (board || map ? choose('layer', t('Layer', '图层'), layers) : '') +
    (route ? choose('route', t('Example route', '示例线路'), t(['Via station', 'Via east park'], ['经车站', '经东园'])) : '') +
    '</div><div class="' + (compare ? 'split' : '') + '" id="districts"></div><p class="note" id="district-detail" aria-live="polite"></p>';
  const grid = demo.querySelector('#districts');
  const update = () => {
    const stage = map ? 1 : readSlider('stage');
    const alternate = (board || map) && read('layer') === 1;
    const routeTiles = route && read('route') === 0 ? [0, 1, stage > 3 ? 2 : 4, 5, 8] : [0, 1, 2, 5, 8];
    const tileClass = (n, scenario) => {
      if (route) return routeTiles.includes(n) ? 'route' : '';
      if (map) return (alternate ? [0, 1, 4, 5, 8] : [1, 4, 8]).includes(n) ? 'route' : '';
      if (alternate) return [1, 4, 6, 8].includes(n) ? 'route' : '';
      const level = [0, 2, 1, 4, 3, 5, 2, 1, 0][n] + stage - (scenario ? 2 : 0);
      if (level >= 8) return 'deep';
      return level >= 5 ? 'wet' : '';
    };
    const panel = (scenario, title) => '<section class="panel">' + (title ? '<h3>' + title + '</h3>' : '') +
      '<div class="tile-board">' + districts.map((name, n) => {
        const state = tileClass(n, scenario);
        const element = compare ? 'div' : 'button';
        const selected = compare ? '' : ' type="button" data-district="' + n + '" aria-pressed="' + (n === active) + '"';
        return '<' + element + ' class="tile ' + state + '"' + selected + '>' + name + '</' + element + '>';
      }).join('') + '</div></section>';
    grid.innerHTML = panel(false, compare ? t('Scenario A', '方案 A') : '') +
      (compare ? panel(true, t('Scenario B', '方案 B')) : '');
    const state = tileClass(active, false);
    const descriptions = {
      deep: t('High water in this example', '示例积水较深'),
      wet: t('Shallow water in this example', '示例浅积水'),
      route: t('Highlighted in this layer', '当前图层中的高亮节点'),
      '': t('No highlight in this view', '当前视图无标记'),
    };
    demo.querySelector('#district-detail').textContent = compare
      ? t('Light and dark blue show two illustrative water levels.', '浅蓝和深蓝代表两档示例积水状态。')
      : districts[active] + ' · ' + descriptions[state];
  };
  if (!map) bindControl('stage', 'input', update);
  if (board || map) bindControl('layer', 'change', update);
  if (route) bindControl('route', 'change', update);
  grid.addEventListener('click', event => {
    const button = event.target.closest('[data-district]');
    if (!button) return;
    active = Number(button.dataset.district);
    update();
    grid.querySelector('[data-district="' + active + '"]').focus({ preventScroll: true });
  });
  update();
}
for (const view of ['flood', 'compare', 'route', 'board', 'map']) {
  views[view] = () => districtDemo(view);
}

function stageCards(names, values) {
  demo.innerHTML = '<div class="panel"><div class="flow-list" id="stages">' +
    names.map((name, index) => '<button type="button" data-stage="' + index +
      '" aria-pressed="false">' + name + '</button>').join('') +
    '</div><div class="note" id="stage-info" aria-live="polite"></div></div>';
  const stages = demo.querySelector('#stages');
  const select = index => {
    for (const button of stages.children) button.setAttribute('aria-pressed', Number(button.dataset.stage) === index);
    demo.querySelector('#stage-info').innerHTML = values[index];
  };
  stages.addEventListener('click', event => {
    const button = event.target.closest('[data-stage]');
    if (button) select(Number(button.dataset.stage));
  });
  select(0);
}

function entries(labels, values) {
  return '<ul class="steps">' + labels.map((label, index) => '<li><strong>' + label + '</strong> · ' +
    values[index] + '</li>').join('') + '</ul>';
}

views.network = () => {
  const labels = t(['Node', 'Example link', 'Evidence type'], ['节点', '示例联系', '材料类型']);
  stageCards(t(['Depart', 'Transfer', 'Arrive'], ['出发', '中转', '到达']), [
    entries(labels, t(['Origin A', 'Origin A to Transfer B', 'Illustrative travel record'], ['出发点 A', '出发点 A 至中转点 B', '示例转移记录'])),
    entries(labels, t(['Transfer B', 'Transfer B to Reception C', 'Illustrative route note'], ['中转点 B', '中转点 B 至接收点 C', '示例路线记录'])),
    entries(labels, t(['Reception C', 'Reception C to Service D', 'Illustrative reception record'], ['接收点 C', '接收点 C 至服务点 D', '示例接收记录'])),
  ]);
};

views.egress = () => {
  const cumulative = [
    [15, 0, 0, 5], [36, 6, 11, 15], [55, 15, 18, 22],
    [78, 26, 26, 26], [92, 33, 31, 28], [100, 37, 34, 29],
  ];
  demo.innerHTML = '<div class="controls">' + slider('period', t('Time slice', '时间切片'), 1, 6, 1) +
    '</div><div class="panel" id="egress-readout"></div><p class="legend">' +
    t('Fictional cumulative counts out of 100 attendees.', '虚构的 100 人场景，显示累计人数。') + '</p>';
  const update = () => {
    const period = readSlider('period');
    demo.querySelector('#egress-readout').innerHTML = metricBars(
      t(['Released at venue', 'Shuttle arrivals', 'Rail arrivals', 'Arrived on foot'], ['场馆已放行', '接驳已到达', '轨道已到达', '步行已到达']),
      cumulative[period - 1]
    );
  };
  bindControl('period', 'input', update);
  update();
};

views.agent = () => {
  const labels = t(['New report', 'Evidence to check', 'Draft task'], ['新增情况', '待核对材料', '任务草稿']);
  stageCards(t(['Initial report', 'New information', 'Plan update'], ['接报', '信息更新', '方案修订']), [
    entries(labels, t(['Two reports of access issues', 'Check the timestamps and locations', 'Prepare an access-status list'],
      ['收到两条通行异常报告', '对照上报时间和位置', '整理待核实路段清单'])),
    entries(labels, t(['A second route is reported open', 'Confirm the report with a second source', 'Flag the alternative route for review'],
      ['有消息称第二条路线可用', '用另一来源交叉核对', '标注待复核的备选路线'])),
    entries(labels, t(['The second source confirms access', 'Keep the conflicting earlier record visible', 'Update the draft and note the reason'],
      ['第二来源确认该路线可用', '保留早先冲突记录供复查', '更新草稿并注明修订原因'])),
  ]);
  demo.insertAdjacentHTML('beforeend', '<p class="legend">' +
    t('Scripted replay of a fictional event.', '虚构事件的预设回放。') + '</p>');
};

views.sankey = () => {
  const groups = t(['Built-up', 'Cropland', 'Vegetation'], ['建设用地', '耕地', '植被']);
  const colors = ['#9b6998', '#9b762f', '#39816d'];
  const periods = Array.from({ length: 6 }, (_, i) => (1985 + i*5) + '–' + (1990 + i*5));
  demo.innerHTML = '<div class="controls">' + choose('period', t('Example period', '示例时段'), periods) +
    '</div><div class="panel"><canvas class="chart" id="flow-chart" width="740" height="260" aria-hidden="true"></canvas>' +
    '<div class="chart-data" id="flow-labels"></div></div><p class="legend">' +
    t('Illustrative land-use flows in arbitrary units.', '界面示例流量，单位为示意值。') + '</p>';
  const canvas = demo.querySelector('#flow-chart');
  const context = canvas.getContext('2d');
  const update = () => {
    const index = read('period');
    const matrix = [[26, 1, 1], [6 + index, 25 - index, 3], [2, 3, 29]];
    const sum = row => row.reduce((total, value) => total + value, 0);
    const scale = 1.6;
    const positions = widths => widths.map((_, i) => 50 + sum(widths.slice(0, i)) * scale + i * 13);
    const left = positions(matrix.map(sum));
    const rightSums = groups.map((_, col) => sum(matrix.map(row => row[col])));
    const right = positions(rightSums);
    if (context) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      const nextRight = [...right];
      context.font = '18px system-ui';
      context.fillStyle = '#182923';
      context.fillText(t('From', '期初'), 135, 28);
      context.fillText(t('To', '期末'), 550, 28);
      matrix.forEach((row, i) => {
        let y = left[i];
        row.forEach((value, j) => {
          const thickness = value * scale;
          const endY = nextRight[j];
          context.fillStyle = colors[i] + '8a';
          context.beginPath();
          context.moveTo(171, y);
          context.bezierCurveTo(310, y, 395, endY, 550, endY);
          context.lineTo(550, endY + thickness);
          context.bezierCurveTo(395, endY + thickness, 310, y + thickness, 171, y + thickness);
          context.closePath();
          context.fill();
          y += thickness;
          nextRight[j] += thickness;
        });
        context.fillStyle = colors[i];
        context.fillRect(160, left[i], 11, sum(row)*scale);
        context.fillRect(550, right[i], 11, rightSums[i]*scale);
        context.fillStyle = '#182923';
        context.fillText(groups[i], 12, left[i] + 18);
        context.fillText(groups[i], 575, right[i] + 18);
      });
    }
    demo.querySelector('#flow-labels').innerHTML = matrix.flatMap((row, i) =>
      row.map((value, j) => '<span>' + groups[i] + ' → ' + groups[j] + ' · ' + value + '</span>')).join('');
  };
  bindControl('period', 'change', update);
  update();
};

function syncPreview() {
  const id = location.hash.slice(1);
  const project = projects.find(item => item.id === id && Object.hasOwn(views, item.view));
  if (!project) {
    if (dialog.open) dialog.close();
    return;
  }
  document.querySelector('#preview-title').textContent = t(...project.title);
  document.querySelector('#preview-lead').textContent = t(
    'Interface preview with sample data. No connection to the original system.',
    '此预览使用示例数据，独立于原系统运行。'
  );
  views[project.view]();
  openProject = id;
  if (!dialog.open) dialog.showModal();
}

ui.addEventListener('click', event => {
  const link = event.target.closest('[data-preview]');
  if (link) opener = link;
});
dialog.querySelector('.close').addEventListener('click', () => dialog.close());
dialog.addEventListener('close', () => {
  if (location.hash === '#' + openProject) {
    history.replaceState(null, '', location.pathname + location.search);
  }
  if (opener?.isConnected) opener.focus({ preventScroll: true });
  opener = null;
  openProject = '';
});
language.addEventListener('click', () => {
  isChinese = !isChinese;
  const destination = new URL(location.href);
  if (isChinese) destination.searchParams.set('lang', 'zh');
  else destination.searchParams.delete('lang');
  history.replaceState(null, '', destination);
  renderCatalog();
});
language.hidden = false;
window.addEventListener('hashchange', syncPreview);
renderCatalog();
syncPreview();
