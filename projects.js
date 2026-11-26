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
const chapters = [
  ['Riverside settlement','沿河而居','The first houses stand by the water. The timber depot shares the west bank with them.','最初的房屋沿河岸分布，木料仓也落在了西岸。',[3,4,6]],
  ['The station opens','车站落成','A station opens north of the centre. A few houses appear on the hill and near the southern approach.','车站在城心以北落成，北岭和南侧进城的路旁也出现了人家。',[0,1,4,7]],
  ['A second crossing','两岸相连','A bridge downstream gives the east bank a second crossing as the first homes appear there.','下游架起第二座桥，东岸也出现了第一排住宅。',[3,5,6]],
  ['A denser centre','街区长高','A taller building changes the skyline in the centre. More homes fill in around the station and on the east bank.','城心的新楼改变了天际线，车站周边和东岸的空地也渐渐填上了住宅。',[1,4,5,7]],
  ['A school by the river','河畔开学','A school and playing field open on the east bank, just south of the new houses.','东岸住宅以南建起了学校，旁边留出了一块球场。',[5,8]],
  ['A riverside walk','沿河漫步','A footpath follows the east bank past both bridges. A final row of houses completes the southern approach.','一条步道沿东岸串起两座桥，南门街边也添了一排房屋。',[2,5,7,8]],
];
// Each entry describes the selected district as it appears in that chapter.
const districtHistory = [
  [[1,'The hill is covered in trees.','北岭还是一片树林。'],[2,'A house now stands at the southern edge of the grove.','林地南侧多了一间屋子，其余树木仍围在屋后。']],
  [[1,'This plot north of the centre is still open.','城心以北的地块还是空地。'],[2,'The long roof belongs to the new station.','长屋顶下是新落成的车站。'],[4,'A second building now stands beside the station.','车站旁又添了一栋楼，两栋建筑围出一小片空地。']],
  [[1,'Trees fill this plot on the east bank.','东岸这块地上长满了树。'],[6,'The riverside walk passes the western edge of the grove.','林地保留了下来，西边多出一条沿河步道。']],
  [[1,'One of the first houses has a yard facing the street.','最早的一批住宅中，有一户的院子朝着街道。'],[3,'Two houses now share this block near the new crossing.','街区里有了两栋住宅，去下游也多了一处过河的选择。']],
  [[1,'A low building occupies one corner of a mostly open block.','一栋小楼占着街角，周围还留有大片空地。'],[2,'A taller neighbour changes the roofline.','街角小楼有了更高的邻居，两栋楼的屋顶错落开来。'],[4,'Three different roof heights now mark the town centre.','三栋楼高低错落，从河对岸也能认出城心。']],
  [[1,'Across the river, the residential plots are still empty.','隔河望去，东岸的住宅地块还是空的。'],[3,'The first house appears on this bank.','东岸出现了第一栋住宅。'],[4,'A second house fills part of the open ground.','第二栋住宅落成，两栋房屋之间还留着空隙。'],[5,'Three homes now stand just north of the new school.','三栋住宅聚在新学校以北，东岸渐渐有了街区的样子。']],
  [[1,'A long, low shed marks the timber depot.','低矮的长屋顶标出了木料仓。'],[3,'Two parallel sheds occupy the depot plot.','旁边添了一座库房，两条长屋顶并排展开。']],
  [[1,'The southern entrance is still an open plot.','进城的南侧路口还留着一块空地。'],[2,'One house stands by the southern approach.','进城路旁出现了第一栋住宅。'],[4,'Two houses now face the approach.','第二栋房子落在路旁，街区轮廓开始显现。'],[6,'A third house completes the small southern block.','第三栋房子填进了南门街区。']],
  [[1,'This open plot will become the school grounds.','这片空地留给了后来的学校。'],[5,'The school is open. Look for the white halfway line on the green playing field.','学校已经落成。校舍旁的小球场上，可以找到一条白色中线。']]
];
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
    stopPlayback();
  });
  return button;
});
const picker = byId('district-picker');
districtNames.forEach((_,index) => picker.add(new Option('',String(index))));
picker.addEventListener('change', () => {
  activeDistrict = Number(picker.value);
  stopPlayback();
});
const chapterButtons = chapters.map((_,index) => {
  const button = element('button','','chapter-stop');
  button.type = 'button';
  const artwork = element('span','','landmark');
  artwork.innerHTML = cityAtlas.landmark(index);
  button.append(artwork,element('span','','chapter-caption'));
  button.addEventListener('click', () => {
    stage.value = String(index + 1);
    stopPlayback();
  });
  return button;
});
byId('chapter-strip').append(...chapterButtons);
const cityDrawing = element('div','','city-drawing');
board.append(cityDrawing,...tiles);
tiles.forEach((tile,index) => {
  const [x,y]=cityAtlas.pin(index);
  tile.style.left=x/800*100+'%';
  tile.style.top=y/437*100+'%';
});
let previousScene = '';
function renderSpatial() {
  const frame = Number(stage.value);
  const chapter = chapters[frame-1];
  const marks = layer.value === 'services' ? services : chapter[4];
  const sceneKey = [frame, activeDistrict, layer.value].join('/');
  if(sceneKey !== previousScene) {
    const hubs=layer.value==='services' ? services.map(i=>[i,1,.7]) : [];
    cityDrawing.innerHTML=cityAtlas.scene(frame,activeDistrict,hubs);
    previousScene=sceneKey;
  }
  tiles.forEach((tile,index) => {
    const name=t(...districtNames[index]);
    tile.textContent = String(index+1).padStart(2,'0');
    tile.title=name;
    tile.setAttribute('aria-label',name);
    tile.classList.toggle('is-marked',marks.includes(index));
    tile.setAttribute('aria-pressed',String(index === activeDistrict));
  });
  byId('chapter-title').textContent = t(chapter[0],chapter[1]);
  byId('chapter-copy').textContent = t(chapter[2],chapter[3]);
  byId('district-name').textContent = tiles[activeDistrict].textContent+' · '+t(...districtNames[activeDistrict]);
  const [,en,zh] = districtHistory[activeDistrict].filter(([since]) => since<=frame).at(-1);
  byId('district-detail').textContent = t(en,zh);
  districtNames.forEach((name,index) => {
    picker.options[index].textContent = tiles[index].textContent+' · '+t(...name);
  });
  picker.value = String(activeDistrict);
  byId('chapter-count').textContent = t('Chapter ','第 ') + frame + t(' of 6',' 幕');
  chapterButtons.forEach((button,index) => {
    button.lastElementChild.textContent = t(chapters[index][0],chapters[index][1]);
    button.setAttribute('aria-pressed',String(index===frame-1));
  });
  byId('stage-label').textContent = t('Chapter ','场景 ') + frame + ' / ' + chapters.length;
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
    stage.value = String(Number(stage.value) % chapters.length + 1);
    renderSpatial();
  },2800);
  renderSpatial();
});
byId('reset-timeline').addEventListener('click', () => {
  stage.value = '1';
  zoom.value = '100';
  activeDistrict = 4;
  layer.value = 'changes';
  stopPlayback();
});
stage.addEventListener('input',stopPlayback);
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

const planExercises = {
  rain: {
    area: ['Riverside Square', '河畔广场'],
    note: ['The information desk has received a note about water on the square.', '服务台收到一条关于广场积水的留言。'],
    steps: [
      {
        report: ['A volunteer logs the first message. The note gives a place name but no observation time.', '志愿者登记了第一条留言。记录有地点名称，缺少观察时间。'],
        check: ['Check the place name on the first message.', '核对第一条留言里的地点名称。'],
        task: ['Create a record for the first message and mark the observation time as missing.', '建立首条留言记录，把观察时间标为缺失。'],
      },
      {
        report: ['A second example message includes a photo caption with an observation time.', '第二条示例消息附有照片说明，补充了观察时间。'],
        check: ['Compare the time in the photo caption with the message log.', '对照照片说明与留言登记的时间。'],
        task: ['Add the photo caption and its time to the record.', '把照片说明和对应时间补进记录。'],
      },
      {
        report: ['The desk sends a revised list of reports. One place is written two different ways.', '服务台发来更新后的留言清单，其中一个地点有两种写法。'],
        check: ['Flag the two names that could refer to the same place.', '标出可能指向同一地点的两种名称。'],
        task: ['Prepare a short handover note with the confirmed entries and the naming question.', '整理一条简短交接说明，写清已核对条目和地点名称疑问。'],
      },
    ],
  },
  earthquake: {
    area: ['Maple Community Room', '枫林社区活动室'],
    note: ['The community room has received two example messages that use different location names.', '社区活动室收到两条示例留言，使用了不同的地点名称。'],
    steps: [
      {
        report: ['The desk opens a record for both messages and keeps the original wording.', '服务台为两条消息建立记录，并保留原始表述。'],
        check: ['Find the location named in each message.', '找出两条消息各自提到的地点。'],
        task: ['Record both descriptions and leave the location field open for checking.', '登记两条描述，把地点保留为待核实。'],
      },
      {
        report: ['The sender of one message supplies an observation time and a room number.', '其中一条消息的发送者补充了观察时间和房间号。'],
        check: ['Check which message the room number belongs to.', '核对房间号对应的是哪条消息。'],
        task: ['Update that message with the additional details while keeping the other entry separate.', '补充该条消息的细节，另一条仍单独记录。'],
      },
      {
        report: ['The practice desk combines the messages into one list for the next shift.', '演练服务台把两条消息整理成一张清单，准备交给下一班。'],
        check: ['Review which entry still needs a location check.', '查看哪条记录仍需要核实地点。'],
        task: ['Write a handover note showing which details were added and which are still missing.', '在交接说明中列出已补充的信息和仍缺的内容。'],
      },
    ],
  },
  heat: {
    area: ['Maple Community Centre', '枫林社区中心'],
    note: ['An example public notice mentions revised opening times for the community centre.', '一则示例公告提到社区中心调整了开放时间。'],
    steps: [
      {
        report: ['The desk receives a draft opening-hours notice, but it has no effective date.', '服务台收到一份开放时间公告草稿，尚无生效日期。'],
        check: ['Look for an effective date in the draft notice.', '查看公告草稿是否包含生效日期。'],
        task: ['Record the advertised hours and note that the effective date needs checking.', '记录公告上的时间，把生效日期标为待核实。'],
      },
      {
        report: ['A revised notice arrives with an effective date and a different closing time.', '修订版公告补充了生效日期，结束时间也有变化。'],
        check: ['Compare the dates and closing times in the two notices.', '对照两版公告的日期和结束时间。'],
        task: ['Keep a copy of both versions in the exercise record.', '在演练记录里保留两版公告。'],
      },
      {
        report: ['The centre sends a final example notice and identifies which earlier copy it replaces.', '中心发来示例公告的最终版，并注明替代哪个旧版本。'],
        check: ['Confirm which notice is the latest one in the record.', '核对记录中哪一版公告是最新版。'],
        task: ['Mark the current notice in the handover record and retain the earlier versions.', '在交接记录中标明当前版本，留存旧版。'],
      },
    ],
  },
};
const areaInput = byId('area');
const hazardInput = byId('hazard');
const planNoteInput = byId('incident-note');
const planStageButtons = [...document.querySelectorAll('#plan-workspace [data-plan-step]')];
let planFormUsesExample = true;
let plan = { hazard: 'rain', step: 0, checked: new Set(), example: true };

function planArea() {
  return plan.example ? t(...planExercises[plan.hazard].area) : plan.area;
}

function planNote() {
  return plan.example ? t(...planExercises[plan.hazard].note) : plan.note;
}

function planHazardLabel() {
  return [...hazardInput.options].find(option => option.value === plan.hazard).textContent;
}

function updatePlanProgress() {
  const visible = plan.step + 1;
  const checked = [...plan.checked].filter(index => index < visible).length;
  const progress = byId('plan-progress-bar');
  progress.max = visible;
  progress.value = checked;
  byId('plan-progress').textContent = t(
    `${checked} of ${visible} checked`,
    `已核实 ${checked} / ${visible} 项`,
  );
}

function renderPlan() {
  const steps = planExercises[plan.hazard].steps;
  if (planFormUsesExample) {
    areaInput.value = planArea();
    planNoteInput.value = planNote();
  }
  byId('plan-summary').textContent = planHazardLabel() + ' · ' + planArea();
  const note = planNote();
  byId('plan-note').textContent = note;
  byId('plan-note').hidden = !note;
  planStageButtons.forEach((button, index) => {
    button.setAttribute('aria-pressed', String(index === plan.step));
  });
  byId('plan-result').textContent = t(...steps[plan.step].report);
  byId('plan-task').textContent = t(...steps[plan.step].task);
  byId('next-plan-step').disabled = plan.step + 1 === steps.length;

  byId('plan-checks').replaceChildren(...steps.slice(0, plan.step + 1).map((step, index) => {
    const label = element('label', '', 'plan-check-row');
    const checkbox = element('input');
    checkbox.type = 'checkbox';
    checkbox.checked = plan.checked.has(index);
    checkbox.addEventListener('change', () => {
      if (checkbox.checked) plan.checked.add(index);
      else plan.checked.delete(index);
      updatePlanProgress();
    });
    label.append(checkbox, element('span', t(...step.check)));
    return label;
  }));
  updatePlanProgress();
}

byId('plan-form').addEventListener('input', () => { planFormUsesExample = false; });
hazardInput.addEventListener('change', () => { planFormUsesExample = false; });
areaInput.addEventListener('input', () => areaInput.setCustomValidity(''));
byId('load-plan-example').addEventListener('click', () => {
  areaInput.setCustomValidity('');
  plan = { hazard: hazardInput.value, step: 0, checked: new Set(), example: true };
  planFormUsesExample = true;
  renderPlan();
});
byId('plan-form').addEventListener('submit', event => {
  event.preventDefault();
  const area = areaInput.value.trim();
  if (!area) {
    areaInput.setCustomValidity(t('Enter an example area.','请输入示例区域。'));
    areaInput.reportValidity();
    return;
  }
  const usesExample = planFormUsesExample && hazardInput.value === plan.hazard;
  plan = { area, hazard: hazardInput.value, note: planNoteInput.value.trim(), step: 0, checked: new Set(), example: usesExample };
  planFormUsesExample = usesExample;
  renderPlan();
});
planStageButtons.forEach((button, index) => button.addEventListener('click', () => {
  plan.step = index;
  renderPlan();
}));
byId('next-plan-step').addEventListener('click', () => {
  if (plan.step + 1 >= planStageButtons.length) return;
  plan.step += 1;
  renderPlan();
  if (byId('next-plan-step').disabled) planStageButtons[plan.step].focus({ preventScroll: true });
});
byId('export-plan').addEventListener('click', () => {
  const steps = planExercises[plan.hazard].steps;
  const lines = [
    t('Practice exercise record','模拟演练记录'),
    planHazardLabel() + ' · ' + planArea(),
  ];
  if (planNote()) lines.push('', t('Initial note','初始记录'), planNote());
  lines.push('', t('Timeline','时间线'));
  for (const [index, step] of steps.slice(0, plan.step + 1).entries()) {
    const button = planStageButtons[index];
    lines.push(button.querySelector('time').textContent + ' · ' + button.querySelector('span').textContent);
    lines.push(t(...step.report));
  }
  lines.push('', t('Verification checklist','核实清单'));
  steps.slice(0, plan.step + 1).forEach((step, index) => {
    lines.push((plan.checked.has(index) ? '[x] ' : '[ ] ') + t(...step.check));
  });
  lines.push('', t('Task draft for this step','本步任务草稿'), t(...steps[plan.step].task));
  const file = new Blob(['\uFEFF', lines.join('\r\n'), '\r\n'], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(file);
  const link = element('a');
  link.href = url;
  link.download = 'practice-record.txt';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
});

const comparison = byId('compare-board');
const divider = byId('compare-position');
const comparisonHubs = [
  [[4,.75,.35],[4,2.35,.55],[4,1.76,2.62]],
  [[1,1,.55],[3,1.5,1.8],[8,1.6,1.1]],
];
[...comparison.querySelectorAll('.compare-layer')].forEach((layer,index)=>{
  layer.innerHTML=cityAtlas.scene(6,-1,comparisonHubs[index]);
});

const layoutButtons = [...document.querySelectorAll('[data-position]')];
layoutButtons.forEach(button => button.addEventListener('click', () => {
  divider.value = button.dataset.position;
  renderComparison();
}));
function renderComparison() {
  const percentage = divider.valueAsNumber;
  layoutButtons.forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.position)===percentage)));
  comparison.querySelector('.tag-a').hidden=percentage < 25;
  comparison.querySelector('.tag-b').hidden=percentage > 75;
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
const systemChanges = byId('system-changes');
const systemStatusLabels = {
  available: ['Available', '可用'],
  verify: ['Needs review', '待核对'],
  paused: ['Paused', '暂停'],
};
const systemPlaces = [
  {
    key: 'lobby',
    name: ['Entrance lobby', '入口大厅'],
    source: ['Welcome desk sample', '迎宾台示例记录'],
    records: {
      normal: { status: 'available', time: '09:00', note: ['The lobby is open and the example welcome sign is in place.', '大厅开放，示例牌已摆到迎宾台。'] },
      disturbance: { status: 'available', time: '09:20', note: ['The welcome desk keeps the usual lobby opening hours.', '迎宾台登记大厅按原时段开放。'] },
      recovery: { status: 'available', time: '10:10', note: ['The lobby remains open in the latest example record.', '最新示例记录显示大厅继续开放。'] },
    },
  },
  {
    key: 'courtyard',
    name: ['Courtyard', '庭院'],
    source: ['Venue desk sample', '场地服务台示例记录'],
    records: {
      normal: { status: 'available', time: '09:02', note: ['The courtyard is listed as open in the sample schedule.', '示例日程将庭院列为开放。'] },
      disturbance: { status: 'paused', time: '09:27', note: ['The sample notices show the courtyard activity as paused.', '最新示例公告把庭院活动标为暂停。'] },
      recovery: { status: 'verify', time: '10:15', note: ['The draft lists a new activity time. The venue desk has yet to confirm it.', '草稿给出了新的活动时间，场地服务台尚待确认。'] },
    },
  },
  {
    key: 'activity',
    name: ['Activity room', '活动室'],
    source: ['Activities desk sample', '活动台示例记录'],
    records: {
      normal: { status: 'available', time: '09:05', note: ['The room is available during the hours listed on the sample notice.', '活动室按示例公告上的时段开放。'] },
      disturbance: { status: 'verify', time: '09:32', note: ['Two versions of the room notice give different opening times.', '活动室的两版公告列出了不同开放时间。'] },
      recovery: { status: 'available', time: '10:18', note: ['The activities desk has posted one current version of the room notice.', '活动台已张贴活动室公告的当前版本。'] },
    },
  },
  {
    key: 'reading',
    name: ['Reading room', '阅览室'],
    source: ['Reading room sample', '阅览室示例记录'],
    records: {
      normal: { status: 'available', time: '09:07', note: ['The reading room is ready in the example opening record.', '示例开放记录显示阅览室已准备就绪。'] },
      disturbance: { status: 'available', time: '09:35', note: ['The reading room record keeps the same opening hours.', '阅览室的开放记录沿用原时段。'] },
      recovery: { status: 'available', time: '10:20', note: ['The sample record still lists the room as open.', '示例记录仍将阅览室列为开放。'] },
    },
  },
  {
    key: 'desk',
    name: ['Service desk', '服务台'],
    source: ['Service desk sample', '服务台示例记录'],
    records: {
      normal: { status: 'available', time: '09:10', note: ['The service desk is listed as available for visitor enquiries.', '示例登记显示服务台可接受访客咨询。'] },
      disturbance: { status: 'available', time: '09:38', note: ['The service desk remains available in the current example.', '当前示例中，服务台继续开放。'] },
      recovery: { status: 'available', time: '10:22', note: ['The service desk has added a note marking the latest notice version.', '服务台在记录里补记了最新公告版本。'] },
    },
  },
  {
    key: 'board',
    name: ['Notice board', '公告栏'],
    source: ['Notice board sample', '公告栏示例记录'],
    records: {
      normal: { status: 'available', time: '09:12', note: ['The notice board displays the current example programme.', '公告栏展示当前示例活动安排。'] },
      disturbance: { status: 'verify', time: '09:41', note: ['Both old and revised notices are listed in the sample photo notes.', '示例照片记录同时提到了旧版和修订版公告。'] },
      recovery: { status: 'available', time: '10:25', note: ['The latest example record identifies the notice that is now displayed.', '最新示例记录已注明公告栏当前展示的版本。'] },
    },
  },
];
const systemFilterButtons = [...document.querySelectorAll('#systems [data-system-filter]')];
let systemFilter = 'all';
let systemSelected = 'courtyard';

function renderSystemDetail(place, record) {
  byId('system-detail-empty').hidden = Boolean(place);
  byId('system-detail-content').hidden = !place;
  if (!place) return;
  byId('system-place-name').textContent = t(...place.name);
  byId('system-place-note').textContent = t(...record.note);
  byId('system-before').textContent = t(...systemStatusLabels[place.records.normal.status]);
  byId('system-current').textContent = t(...systemStatusLabels[record.status]);
  byId('system-time').textContent = record.time;
  byId('system-source').textContent = t(...place.source);
}

function renderSystem() {
  const mode = systemScenario.value;
  const records = systemPlaces.map(place => ({ place, record: place.records[mode] }));
  systemFilterButtons.forEach(button => {
    const filter = button.dataset.systemFilter;
    const count = filter === 'all' ? records.length : records.filter(({ record }) => record.status === filter).length;
    button.querySelector('strong').textContent = String(count);
    button.setAttribute('aria-pressed', String(systemFilter === filter));
  });

  const visible = records.filter(({ place, record }) => {
    const matchesStatus = systemFilter === 'all' || record.status === systemFilter;
    const changed = record.status !== place.records.normal.status;
    return matchesStatus && (!systemChanges.checked || changed);
  });
  const active = visible.find(({ place }) => place.key === systemSelected) || visible[0];
  byId('system-result-count').textContent = t(
    `${visible.length} of ${records.length} places`,
    `显示 ${visible.length} / ${records.length} 个场所`,
  );
  byId('system-empty').hidden = Boolean(visible.length);

  const list = byId('system-status');
  list.replaceChildren(...visible.map(({ place, record }) => {
    const button = element('button', '', 'system-place');
    button.type = 'button';
    button.dataset.systemPlace = place.key;
    button.setAttribute('aria-pressed', String(active?.place.key === place.key));
    const badge = element('span', t(...systemStatusLabels[record.status]), 'system-badge');
    badge.dataset.status = record.status;
    button.append(element('span', t(...place.name), 'system-place-name'), badge);
    button.addEventListener('click', () => {
      systemSelected = place.key;
      for (const item of list.children) item.setAttribute('aria-pressed', String(item === button));
      renderSystemDetail(place, record);
    });
    return button;
  }));
  renderSystemDetail(active?.place, active?.record);
}

systemScenario.addEventListener('change', renderSystem);
systemChanges.addEventListener('change', renderSystem);
systemFilterButtons.forEach(button => button.addEventListener('click', () => {
  systemFilter = button.dataset.systemFilter;
  renderSystem();
}));
byId('system-clear').addEventListener('click', () => {
  systemChanges.checked = false;
  systemFilter = 'all';
  renderSystem();
  systemFilterButtons[0].focus({ preventScroll: true });
});

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
