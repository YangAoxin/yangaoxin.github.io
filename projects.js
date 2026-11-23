'use strict';

const byId = (id) => document.getElementById(id);
const langButton = byId('language');
let chinese = new URL(location.href).searchParams.get('lang') === 'zh';
const t = (english, mandarin) => chinese ? mandarin : english;

const translations = [
  ['data-zh', null],
  ['data-placeholder-zh', 'placeholder'],
  ['data-aria-zh', 'aria-label'],
].flatMap(([key, attribute]) =>
  [...document.querySelectorAll('[' + key + ']')].map(node => ({
    node,
    attribute,
    english: attribute ? node.getAttribute(attribute) : node.textContent,
    mandarin: node.getAttribute(key),
  }))
);

function element(tag, text, className) {
  const node = document.createElement(tag);
  node.textContent = text;
  if (className) node.className = className;
  return node;
}

const sampleItems = [
  ['AK-47 | Slate Wave (Field-Tested)', 'AK-47 | 岩灰波纹（久经沙场）'],
  ['M4A1-S | Coastal Ink (Minimal Wear)', 'M4A1-S | 岸线墨影（略有磨损）'],
  ['AWP | Violet Current (Factory New)', 'AWP | 暮紫流光（崭新出厂）'],
  ['USP-S | Paper Signal (Field-Tested)', 'USP-S | 纸上信号（久经沙场）'],
  ['Glock-18 | Fogline (Factory New)', '格洛克 18 型 | 雾线（崭新出厂）'],
  ['MP9 | Harbor Glass (Minimal Wear)', 'MP9 | 港湾之镜（略有磨损）'],
  ['Sticker | Northline', '印花 | 北线'],
  ['Sticker | Atlas (Holo)', '印花 | 图集（全息）'],
  ['Sticker | Low Tide', '印花 | 低潮'],
  ['Canvas Case', '帆布武器箱'],
  ['Night Shift Case', '夜班武器箱'],
  ['Horizon Tag Charm', '地平线挂件'],
];
let fullCatalogue = false;
let items = sampleItems;
let searchIndex = [];
let matchingItems = [];
const search = byId('item-search');
const resultList = byId('item-results');
const previous = byId('page-prev'), next = byId('page-next');
const selectionList = byId('selected-items');
const selected = new Set();
const pageNumber = byId('page-number');
let pageCount = 1;
const pageSize = 4;
let cataloguePage = 0;

function updateSelection() {
  byId('selection-count').textContent = t(selected.size + ' selected', '已选 ' + selected.size + ' 件');
  byId('export-items').disabled = selected.size === 0;
  byId('clear-items').disabled = selected.size === 0;
  const rows = [...selected].map(index => {
    const name = t(...items[index]);
    const row = element('li','');
    const remove = element('button','×','remove-item');
    remove.type = 'button';
    remove.dataset.remove = String(index);
    remove.setAttribute('aria-label', t('Remove ' + name, '移除 ' + name));
    row.append(element('span',name),remove);
    return row;
  });
  selectionList.replaceChildren(...rows);
  renderTradeItems();
  if (!rows.length) selectionList.append(element('li',t('Select items from the catalogue.','从目录勾选饰品。'),'empty-selection'));
}

function searchCatalogue() {
  const keyword = search.value.trim().normalize('NFKC').toLowerCase();
  matchingItems = [];
  for (const [index, matchText] of searchIndex.entries()) {
    if (matchText.includes(keyword)) matchingItems.push(index);
  }
  pageCount = Math.max(1, Math.ceil(matchingItems.length / pageSize));
  cataloguePage = 0;
}

function formatNumber(value) {
  return value.toLocaleString(t('en','zh-CN'));
}

function renderCatalogue() {
  const rows = matchingItems.slice(cataloguePage * pageSize,(cataloguePage + 1) * pageSize);
  resultList.replaceChildren(...rows.map(index => {
    const names = items[index];
    const row = element('label','','item-row');
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.value = index;
    box.checked = selected.has(index);
    const name = element('span','');
    name.append(element('strong',t(...names)),element('small',t(names[1],names[0])));
    row.append(box,name);
    return row;
  }));
  if (!rows.length) {
    resultList.append(element('p',t('No items match this search.','目录没有匹配项。'),'empty-results'));
  }
  const total = formatNumber(items.length);
  byId('catalogue-source').textContent = fullCatalogue
    ? t('Local catalogue · ' + total + ' entries', '本地完整目录 · ' + total + ' 项')
    : t('Sample catalogue', '示例目录');
  const matches = formatNumber(matchingItems.length);
  byId('item-count').textContent = t(matches + ' matches','找到 ' + matches + ' 件');
  pageNumber.max = pageCount;
  pageNumber.value = cataloguePage + 1;
  byId('page-total').textContent = '/ ' + formatNumber(pageCount);
  previous.disabled = cataloguePage === 0;
  next.disabled = cataloguePage + 1 >= pageCount;
  updateSelection();
}

search.addEventListener('input', () => {
  searchCatalogue();
  renderCatalogue();
});
byId('page-form').addEventListener('submit', event => {
  event.preventDefault();
  cataloguePage = pageNumber.valueAsNumber - 1;
  renderCatalogue();
});
previous.addEventListener('click', () => {
  cataloguePage -= 1;
  renderCatalogue();
});
next.addEventListener('click', () => {
  cataloguePage += 1;
  renderCatalogue();
});
resultList.addEventListener('change', event => {
  const index = Number(event.target.value);
  if (event.target.checked) selected.add(index);
  else selected.delete(index);
  updateSelection();
});
selectionList.addEventListener('click', event => {
  const button = event.target.closest('[data-remove]');
  if (!button) return;
  selected.delete(Number(button.dataset.remove));
  renderCatalogue();
  (selectionList.querySelector('button') || search).focus();
});
byId('clear-items').addEventListener('click', () => {
  selected.clear();
  renderCatalogue();
  search.focus();
});
byId('export-items').addEventListener('click', () => {
  const content = JSON.stringify([...selected].map(index => items[index][0]), null, 2) + '\n';
  const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }));
  const download = document.createElement('a');
  download.href = url;
  download.download = 'selected_items.json';
  document.body.append(download);
  download.click();
  download.remove();
  setTimeout(() => URL.revokeObjectURL(url),1000);
});

const quoteResult = byId('quote-result');
const nextStatus = byId('next-status');
const steps = [...byId('workflow-steps').children];
const statusLabels = [
  ['Received','待处理'], ['Quoted','已报价'], ['Confirmed','已确认'], ['Fulfilled','已履约'],
];
const advanceLabels = [
  ['Mark as quoted','标记已报价'], ['Confirm quote','确认报价'], ['Mark fulfilled','标记已履约'],
];
let request = null;

function renderQuote() {
  steps.forEach((step,index) => {
    const current = request && index === request.status;
    if (current) step.setAttribute('aria-current','step');
    else step.removeAttribute('aria-current');
    step.classList.toggle('is-past', Boolean(request && index < request.status));
  });
  if (!request) {
    quoteResult.replaceChildren(element('p',t('Submit a request to start.','提交示例询价，后台会显示记录。'),'quote-empty'));
    nextStatus.hidden = true;
    return;
  }
  const stock = request.stock - (request.status === 3 ? request.quantity : 0);
  quoteResult.replaceChildren(
    element('p',request.product + ' × ' + request.quantity),
    element('p',t(...statusLabels[request.status]),'quote-status'),
    element('p',t('Sample stock','示例可用库存') + ' · ' + stock)
  );
  nextStatus.hidden = request.status === 3;
  if (!nextStatus.hidden) nextStatus.textContent = t(...advanceLabels[request.status]);
}
byId('quote-form').addEventListener('submit', event => {
  event.preventDefault();
  const product = byId('product');
  request = {
    product: product.value,
    quantity: byId('quantity').valueAsNumber,
    stock: [24, 36, 48][product.selectedIndex],
    status: 0,
  };
  renderQuote();
});
nextStatus.addEventListener('click', () => {
  if (!request || request.status === 3) return;
  request.status += 1;
  renderQuote();
  if (request.status === 3) {
    quoteResult.tabIndex = -1;
    quoteResult.focus();
  }
});

const districtNames = [
  ['North Hill','北岭'], ['Station','车站'], ['East Park','东园'],
  ['West Bank','西岸'], ['Town Centre','城心'], ['East Bank','东岸'],
  ['Depot','仓库'], ['South Gate','南门'], ['School','学校'],
];
const frameHighlights = [[4],[4,5],[1,4,5],[1,4,5,8],[4,8],[8]];
const services = [1,4,6,8];
const stage = byId('stage'), layer = byId('layer'), zoom = byId('zoom'), play = byId('play-timeline');
const board = byId('districts');
let activeDistrict = 4;
let timer = null;
const tiles = districtNames.map((_,index) => {
  const button = element('button','','tile');
  button.type = 'button';
  button.addEventListener('click', () => {
    activeDistrict = index;
    renderSpatial();
  });
  return button;
});
board.append(...tiles);

function renderSpatial() {
  const frame = Number(stage.value);
  const marks = layer.value === 'services' ? services : frameHighlights[frame - 1];
  tiles.forEach((tile,index) => {
    tile.textContent = t(...districtNames[index]);
    tile.classList.toggle('is-marked',marks.includes(index));
    tile.setAttribute('aria-pressed',String(index === activeDistrict));
  });
  byId('district-name').textContent = t(...districtNames[activeDistrict]);
  byId('district-detail').textContent = marks.includes(activeDistrict)
    ? t('Highlighted in this layer.','此分区在当前图层中高亮。')
    : t('Unmarked in this layer.','此分区在当前图层中未标记。');
  byId('stage-label').textContent = t('Frame ','画面 ') + frame + ' / ' + frameHighlights.length;
  byId('zoom-value').textContent = zoom.value + '%';
  board.style.setProperty('--board-scale',String(Number(zoom.value) / 100));
  play.textContent = timer ? t('Pause','暂停') : t('Play','播放');
}

function stopPlayback() {
  if (timer) clearInterval(timer);
  timer = null;
  renderSpatial();
}
play.addEventListener('click', () => {
  if (timer) {
    stopPlayback();
    return;
  }
  timer = setInterval(() => {
    stage.value = String(Number(stage.value) % frameHighlights.length + 1);
    renderSpatial();
  },900);
  renderSpatial();
});
byId('reset-timeline').addEventListener('click', () => {
  stage.value = '1';
  zoom.value = '100';
  stopPlayback();
});
stage.addEventListener('input',renderSpatial);
zoom.addEventListener('input',renderSpatial);
layer.addEventListener('change',renderSpatial);
byId('district-board').addEventListener('wheel',event => {
  if (!(event.ctrlKey || event.metaKey)) return;
  event.preventDefault();
  zoom.value = String(Number(zoom.value) + (event.deltaY < 0 ? 5 : -5));
  renderSpatial();
}, { passive: false });
document.addEventListener('visibilitychange',() => {
  if (document.hidden && timer) stopPlayback();
});

const period = byId('period');
for (let year = 1985; year < 2015; year += 5) {
  period.append(element('option',year + '–' + (year + 5)));
}
function renderFlows() {
  const labels = t(['Built-up','Cropland','Vegetation'],['建设用地','耕地','植被']);
  const index = period.selectedIndex;
  const matrix = [[26,1,1],[6+index,25-index,3],[2,3,29]];
  const values = matrix.flatMap((row,i) => row.map((value,j) => element('span',labels[i] + ' → ' + labels[j] + ' · ' + value)));
  byId('flow-labels').replaceChildren(...values);
  const canvas = byId('flow-chart');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const sum = numbers => numbers.reduce((total,value) => total + value,0);
  const start = matrix.map(sum);
  const end = labels.map((_,column) => sum(matrix.map(row => row[column])));
  const scale = 1.55;
  const positions = values => values.map((_,i) => 57 + sum(values.slice(0,i)) * scale + i * 17);
  const left = positions(start), right = positions(end);
  const nextRight = [...right];
  const colours = ['#9e6c96','#a47b36','#45816a'];
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.font = '17px system-ui';
  ctx.fillStyle = '#182622';
  ctx.fillText(t('From','期初'),152,28);
  ctx.fillText(t('To','期末'),611,28);
  matrix.forEach((row,i) => {
    let y = left[i];
    row.forEach((value,j) => {
      const weight = value * scale;
      const destination = nextRight[j];
      ctx.fillStyle = colours[i] + '9c';
      ctx.beginPath();
      ctx.moveTo(177,y);
      ctx.bezierCurveTo(325,y,450,destination,609,destination);
      ctx.lineTo(609,destination + weight);
      ctx.bezierCurveTo(450,destination + weight,325,y + weight,177,y + weight);
      ctx.closePath();
      ctx.fill();
      y += weight;
      nextRight[j] += weight;
    });
    ctx.fillStyle = colours[i];
    ctx.fillRect(165,left[i],12,start[i]*scale);
    ctx.fillRect(609,right[i],12,end[i]*scale);
    ctx.fillStyle = '#182622';
    ctx.fillText(labels[i],18,left[i] + 21);
    ctx.fillText(labels[i],642,right[i] + 21);
  });
}
period.addEventListener('change',renderFlows);

const tradeItem = byId('trade-item');
const tradePrice = byId('trade-price');
const tradeStages = [...byId('trade-stages').children];
const sampleOffer = 120;
let trade = null;

function renderTradeItems() {
  const previousItem = tradeItem.value;
  const sample = new Option(t('Sample item', '示例饰品'), '');
  const options = [...selected].map(index => new Option(t(...items[index]), index));
  tradeItem.replaceChildren(sample, ...options);
  if (selected.has(Number(previousItem)) && previousItem !== '') tradeItem.value = previousItem;
}

function renderTrade() {
  const action = byId('trade-action');
  const log = byId('trade-log');
  const priceField = byId('trade-price-field');
  const nextAction = byId('trade-next');
  action.hidden = !trade;
  log.replaceChildren();
  for (const [index, stage] of tradeStages.entries()) {
    const current = trade?.step === index;
    stage.classList.toggle('is-complete', Boolean(trade && (index < trade.step || trade.finished)));
    if (current) stage.setAttribute('aria-current', 'step');
    else stage.removeAttribute('aria-current');
  }
  if (!trade) {
    log.append(element('li', t('Load a sample quote to get started.', '载入一笔示例报价，开始演示。'), 'empty-log'));
    return;
  }

  const listing = trade.step === 2;
  const hasPrice = !trade.finished && (listing || trade.step === 3);
  priceField.hidden = !hasPrice;
  tradePrice.disabled = !hasPrice;
  tradePrice.required = hasPrice;
  nextAction.hidden = trade.finished;
  byId('trade-price-label').textContent = listing
    ? t('Sample listing price', '示例上架价')
    : t('New sample price', '示例新价');
  const names = t(...trade.names);
  const steps = [
    [t('Sample quote', '示例报价'), '¥' + sampleOffer.toFixed(2), t('Simulate purchase', '模拟购买')],
    [t('Purchase recorded', '已记录模拟购买'), '¥' + sampleOffer.toFixed(2), t('Receive into inventory', '确认入库')],
    [t('Received into sample inventory', '已进入示例库存'), names, t('Create sample listing', '确认上架')],
    [t('Sample listing created', '已建立示例挂单'), trade.listingPrice, t('Update listing price', '确认改价')],
    [t('Sample listing repriced', '示例挂单已改价'), trade.revisedPrice, ''],
  ];
  const [status, detail, button] = steps[trade.finished ? 4 : trade.step];
  byId('trade-current').replaceChildren(element('strong', names), element('span', status + ' · ' + detail));
  nextAction.textContent = button;
  for (const [label, value] of steps.slice(0, trade.finished ? 5 : trade.step + 1)) {
    const line = element('li', '');
    line.append(element('strong', label), element('span', value));
    log.append(line);
  }
}

byId('trade-start').addEventListener('submit', event => {
  event.preventDefault();
  trade = {
    names: tradeItem.value === '' ? ['Sample item', '示例饰品'] : items[Number(tradeItem.value)].slice(0, 2),
    step: 0,
    listingPrice: null,
    revisedPrice: null,
    finished: false,
  };
  renderTrade();
});

byId('trade-action').addEventListener('submit', event => {
  event.preventDefault();
  if (!trade || trade.finished) return;
  if (trade.step === 2) trade.listingPrice = '¥' + tradePrice.valueAsNumber.toFixed(2);
  if (trade.step === 3) {
    trade.revisedPrice = '¥' + tradePrice.valueAsNumber.toFixed(2);
    trade.step = 4;
    trade.finished = true;
  } else {
    trade.step += 1;
  }
  if (trade.step === 2) tradePrice.value = '149.00';
  if (trade.step === 3) tradePrice.value = '139.00';
  renderTrade();
  if (trade.step === 2 || trade.step === 3) tradePrice.focus();
  if (trade.finished) byId('trade-current').focus();
});

const planExamples = {
  rain: [
    ['Confirm the time and coverage of the rainfall report and the source of reports about local ponding.', '核对降雨报告的时间、覆盖范围和积水信息来源。'],
    ['Summarise location reports and record which site conditions still need to be checked.', '汇总地点记录，注明哪些点位的情况还有待核实。'],
    ['Rainfall example · Section 2, incident records and status updates', '强降雨示例 · 第 2 节 灾情记录与动态更新'],
  ],
  earthquake: [
    ['Confirm the source and issue time of the event bulletin and the status of initial impact reports.', '核对地震速报来源、发布时间和初步影响信息的状态。'],
    ['Group submitted observations by area and flag locations with conflicting reports.', '分区整理已收到的情况记录，标注不同来源说法不一致的地点。'],
    ['Earthquake example · Section 3, initial impact reporting', '地震示例 · 第 3 节 初步影响信息归集'],
  ],
  heat: [
    ['Check the validity period of the heat notice and the date of public service updates.', '核对高温提示的有效时段及公共服务信息的更新时间。'],
    ['Summarise reported service availability and flag entries awaiting confirmation.', '汇总已有的服务开放记录，标出尚待确认的条目。'],
    ['Heat example · Section 2, service information updates', '高温示例 · 第 2 节 公共服务信息更新'],
  ],
};
const exampleNotes = {
  rain: ['Ponding was reported in two areas; the latest update is still pending.', '有两处报告积水，最新情况待更新。'],
  earthquake: ['Location reports have arrived from two sources and need to be compared.', '已收到两个来源的地点记录，有待交叉核对。'],
  heat: ['The opening hours of two public service sites are still being checked.', '有两处公共服务点的开放时段仍在核实。'],
};
const areaInput = byId('area');
const hazardInput = byId('hazard');
let plan = null;

function renderPlan() {
  const output = byId('plan-result');
  if (!plan) {
    output.replaceChildren(element('p', t('Choose an event type and enter an area to see an example.', '选择事件类型并填写示例区域，即可查看输出。'), 'plan-empty'));
    return;
  }

  const example = planExamples[plan.hazard];
  const hazard = [...hazardInput.options].find(option => option.value === plan.hazard).textContent;
  const sections = [
    [t('Scenario', '情景'), hazard + ' · ' + plan.area],
  ];
  if (plan.note) sections.push([t('Submitted note', '输入记录'), plan.note]);
  sections.push(
    [t('Items to verify', '待核实事项'), t(...example[0])],
    [t('Draft task', '任务草稿'), t(...example[1])],
    [t('Example plan entry', '示例预案条目'), t(...example[2])],
  );
  const details = element('dl', '');
  for (const [label, value] of sections) {
    const group = element('div', '');
    group.append(element('dt', label), element('dd', value));
    details.append(group);
  }
  output.replaceChildren(details);
}

areaInput.addEventListener('input', () => areaInput.setCustomValidity(''));
byId('load-plan-example').addEventListener('click', () => {
  areaInput.setCustomValidity('');
  areaInput.value = t('District A', 'A 区');
  byId('incident-note').value = t(...exampleNotes[hazardInput.value]);
  byId('plan-form').requestSubmit();
});
byId('plan-form').addEventListener('submit', event => {
  event.preventDefault();
  const area = areaInput.value.trim();
  if (!area) {
    areaInput.setCustomValidity(t('Enter an example area.', '请输入示例区域。'));
    areaInput.reportValidity();
    return;
  }
  plan = { area, hazard: hazardInput.value, note: byId('incident-note').value.trim() };
  renderPlan();
});

const comparison = byId('compare-board');
const divider = byId('compare-position');
const layouts = [
  ['block', 'green', 'block', 'block', 'hub', 'hub', 'green', 'block', 'block', 'block', 'green', 'block'],
  ['block', 'green', 'hub', 'block', 'block', 'block', 'green', 'block', 'block', 'hub', 'green', 'block'],
];
for (const [index, layer] of [...comparison.querySelectorAll('.compare-layer')].entries()) {
  layer.replaceChildren(...layouts[index].map(use => element('span', '', 'parcel ' + use)));
}

function renderComparison() {
  const percentage = divider.valueAsNumber;
  comparison.style.setProperty('--split', percentage + '%');
  divider.setAttribute('aria-valuetext', t(
    percentage + '% layout A and ' + (100 - percentage) + '% layout B',
    '布局 A ' + percentage + '%，布局 B ' + (100 - percentage) + '%',
  ));
}

function dragDivider(event) {
  const area = comparison.getBoundingClientRect();
  const percent = Math.round((event.clientX - area.left) / area.width * 100);
  divider.value = Math.min(100, Math.max(0, percent));
  renderComparison();
}

divider.addEventListener('input', renderComparison);
comparison.addEventListener('pointerdown', event => {
  if (event.button !== 0) return;
  comparison.setPointerCapture(event.pointerId);
  dragDivider(event);
});
comparison.addEventListener('pointermove', event => {
  if (comparison.hasPointerCapture(event.pointerId)) dragDivider(event);
});

const systemScenario = byId('system-scenario');
const systemNames = [['Facilities', '基础设施'], ['Public services', '公共服务'], ['Information updates', '信息更新']];
const systemExamples = {
  normal: [['Operating', '正常运行'], ['Available', '正常提供'], ['Routine updates', '常态更新']],
  disturbance: [['Under review', '状态核查中'], ['Partially available', '部分可用'], ['Updates pending', '等待更新']],
  recovery: [['Restoring', '逐步恢复'], ['Resuming', '陆续恢复'], ['Updating', '持续更新']],
};
function renderSystem() {
  const status = byId('system-status');
  status.replaceChildren(...systemNames.map((name, index) => {
    const card = element('article', '', 'system-card');
    card.append(element('h3', t(...name)), element('p', t(...systemExamples[systemScenario.value][index])));
    return card;
  }));
}
systemScenario.addEventListener('change', renderSystem);

function applyLanguage() {
  document.documentElement.lang = t('en','zh-CN');
  document.title = t('Projects · Aoxin Yang','软件与交互作品 · 杨奥新');
  for (const {node,attribute,english,mandarin} of translations) {
    if (attribute) node.setAttribute(attribute,t(english,mandarin));
    else node.textContent = t(english,mandarin);
  }
  langButton.textContent = t('中文','English');
  langButton.lang = t('zh-CN','en');
  for (const link of document.querySelectorAll('[data-home]')) link.href = t('index.html','index.html?lang=zh');
  renderCatalogue();
  renderQuote();
  renderSpatial();
  renderFlows();
  renderTrade();
  renderPlan();
  renderComparison();
  renderSystem();
}
langButton.addEventListener('click', () => {
  chinese = !chinese;
  const current = new URL(location.href);
  if (chinese) current.searchParams.set('lang','zh');
  else current.searchParams.delete('lang');
  history.replaceState(null,'',current);
  applyLanguage();
});
function revealDeepLink() {
  if (location.hash === '#land-use') byId('land-use').open = true;
}
window.addEventListener('hashchange',revealDeepLink);
async function loadCatalogue() {
  if (!window.CS2_CATALOG_GZIP || !window.DecompressionStream) return sampleItems;
  try {
    const bytes = Uint8Array.from(atob(window.CS2_CATALOG_GZIP), character => character.charCodeAt(0));
    const json = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
    return await new Response(json).json();
  } catch {
    return sampleItems;
  }
}

async function startShowcase() {
  items = await loadCatalogue();
  fullCatalogue = items !== sampleItems;
  if (!fullCatalogue) {
    selected.add(0);
    selected.add(4);
  }
  searchIndex = items.map(names => names.join(' ').normalize('NFKC').toLowerCase());
  searchCatalogue();
  applyLanguage();
  revealDeepLink();
  langButton.hidden = false;
}

startShowcase();
