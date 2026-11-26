"use strict";

(() => {
  const groups = [
    ["data", "Data & maps", "数据与地图"],
    ["workflows", "Workflow & information", "流程与信息"],
    ["visual", "Sliders & charts", "滑块与图表"],
    ["creative", "Creative tools", "创作工具"],
  ];
  const projects = [
    {
      key:"csv", group:"data", file:"demo-data-map-tools.html",
      title:["CSV workbench","CSV 工作台"],
      description:["Open a CSV, narrow the records with search or group filters, and export the selection as JSON.","打开本地 CSV，按关键词或分组筛选，并将结果导出为 JSON。"],
      preview:["A data table beside group filters","分组筛选和数据表格的界面"],
    },
    {
      key:"route", group:"data", file:"demo-data-map-tools.html",
      title:["Riverwalk route sketch","滨河路线画板"],
      description:["Place waypoints on a fictional town map and see the route length change as you edit the path.","在虚构小城的地图上点选途经点，边画边看路线长度。"],
      preview:["A marked route across a fictional riverside map","虚构滨河地图上的路线与途经点"],
    },
    {
      key:"schedule", group:"workflows", file:"demo-workflows.html",
      title:["Community programme","社区活动日程"],
      description:["Filter activities by day and room, then select an event to see its details alongside the timetable.","按日期和场地筛选，再点击时间表上的活动查看详情。"],
      preview:["A room timetable with the selected activity shown beside it","不同场地的时间表和选中的活动详情"],
    },
    {
      key:"routes", group:"workflows", file:"demo-workflows.html",
      title:["Gallery guide","展馆导览"],
      description:["Choose a themed visit and step through its numbered stops on an illustrated floor plan.","选择主题路线，在展馆平面图上逐站查看。"],
      preview:["A gallery floor plan with numbered stops","带编号站点的展馆平面图"],
    },
    {
      key:"handover", group:"workflows", file:"demo-workflows.html",
      title:["Room handover board","场地交接看板"],
      description:["Move an example task between status columns and see the counts update.","给示例任务更换状态，观察卡片移列和数量变化。"],
      preview:["Task cards spread across three status columns","分别摆在三个状态栏里的交接卡片"],
    },
    {
      key:"compare", group:"workflows", file:"demo-workflows.html",
      title:["Event notice comparison","活动公告对照"],
      description:["Read fictional event notices side by side and filter down to the fields that changed.","并排查看两版虚构活动公告，也可以只显示变更的字段。"],
      preview:["A two-column notice comparison with highlighted changes","并排显示两版公告并高亮变更"],
    },
    {
      key:"light", group:"visual", file:"demo-visual-controls.html",
      title:["Stage lighting palette","舞台灯光配色"],
      description:["Adjust brightness and warmth to move the chart marker and update the colour swatch.","调整亮度和暖色比例，查看定位点、色样和色值联动。"],
      preview:["Two lighting sliders and a colour plane","两个灯光滑块和带定位点的色彩图"],
    },
    {
      key:"format", group:"visual", file:"demo-visual-controls.html",
      title:["Image format comparison","图像画幅对比"],
      description:["Change the export width and compare three aspect ratios on a chart with a shared reference line.","调整导出宽度，在同一基准线上比较三种画幅的高度。"],
      preview:["Bars comparing three image formats around a reference line","三种画幅相对同一基准线的差值横条"],
    },
    {
      key:"map", group:"creative", file:"demo-creative-workbench.html",
      title:["Neighbourhood builder","街区拼搭"],
      description:["Place houses, trees and paths on a small editable map, with undo for each change.","在可编辑的小地图上铺设房屋、树木和步道，支持撤销。"],
      preview:["A small illustrated neighbourhood with tools for placing tiles","带地块工具栏的街区拼搭地图"],
    },
    {
      key:"poster", group:"creative", file:"demo-creative-workbench.html",
      title:["Exhibition label","展签设计"],
      description:["Edit a label, switch palettes and export a PNG of the finished design.","编辑展签文字和配色，再导出设计成品。"],
      preview:["An exhibition label preview and editing form","展签预览和文字编辑表单"],
    },
    {
      key:"annotation", group:"creative", file:"demo-image-annotation.html",
      title:["Image annotation","图片标注"],
      description:["Draw and name boxes on an image, then export an annotated PNG from the browser.","在本地图片上框选并命名区域，再从浏览器导出标注图。"],
      preview:["An example image with two named boxes","带两个命名标注框的虚构展板"],
    },
  ];
  const chinese = () => document.documentElement.lang.toLowerCase().startsWith("zh");
  const t = (english, mandarin) => chinese() ? mandarin : english;
  const local = pair => t(...pair);
  const make = (tag, content, className) => {
    const item = document.createElement(tag);
    if (content) item.textContent = content;
    if (className) item.className = className;
    return item;
  };
  const normalize = value => value.normalize("NFKC").toLocaleLowerCase();
  const page = filename => new URL(filename, location.href);
  function demoURL(item) {
    const url = page(item.file);
    if (item.key !== "annotation") url.searchParams.set("demo", item.key);
    if (chinese()) url.searchParams.set("lang", "zh");
    return url.href;
  }
  function observeLocale(render) {
    new MutationObserver(render).observe(document.documentElement,{attributes:true,attributeFilter:["lang"]});
  }

  for (const root of document.querySelectorAll("[data-demo-showcase]")) {
    let activeGroup = "all";
    const groupLevel = root.closest("section[aria-labelledby]") ? 3 : 2;
    root.classList.add("demo-library");
    const tools = make("div", "", "demo-library-tools");
    const filters = make("div", "", "demo-library-filters");
    filters.setAttribute("role","group");
    const searchLabel = make("label","","demo-library-search");
    const searchText = make("span");
    const search = make("input");
    search.type = "search";
    searchLabel.append(searchText,search);
    tools.append(filters,searchLabel);
    const count = make("p","","demo-library-count");
    count.setAttribute("role","status");
    const content = make("div");
    const groupsList = groups.map(([key,english,mandarin]) => {
      const group = make("section","","demo-library-group");
      group.id = "demo-group-" + key;
      const name = make("h" + groupLevel,"","demo-library-group-title");
      name.id = group.id + "-title";
      group.setAttribute("aria-labelledby",name.id);
      group.append(name);
      const rows = projects.filter(item => item.group === key).map(item => {
        const article = make("article","","demo-library-item");
        article.id = "demo-entry-" + item.key;
        const preview = make("a","","demo-library-preview");
        const image = make("img");
        image.src = "demo-preview-" + item.key + ".webp";
        image.loading = "lazy";
        image.decoding = "async";
        preview.append(image);
        const info = make("div");
        const title = make("h" + (groupLevel + 1),"","demo-library-title");
        const description = make("p");
        const open = make("a","","demo-library-open");
        info.append(title,description,open);
        article.append(preview,info);
        group.append(article);
        return {item,article,preview,image,title,description,open};
      });
      content.append(group);
      return {key,english,mandarin,group,name,rows};
    });
    const empty = make("p","","demo-library-empty");
    root.replaceChildren(tools,count,content,empty);

    const options = [["all","All","全部"],...groups];
    const buttons = options.map(([key]) => {
      const button = make("button");
      button.type = "button";
      button.addEventListener("click", () => { activeGroup = key; filter(); });
      filters.append(button);
      return button;
    });
    function filter() {
      const words = normalize(search.value).trim().split(/\s+/).filter(Boolean);
      let total = 0;
      for (const entry of groupsList) {
        let visible = 0;
        for (const {item,article} of entry.rows) {
          const haystack = normalize([...item.title,...item.description,entry.english,entry.mandarin].join(" "));
          const show = (activeGroup === "all" || activeGroup === entry.key) && words.every(word => haystack.includes(word));
          article.hidden = !show;
          if (show) visible += 1;
        }
        entry.group.hidden = visible === 0;
        total += visible;
      }
      buttons.forEach((button,index) => button.setAttribute("aria-pressed",String(activeGroup === options[index][0])));
      count.textContent = t(`${total} of ${projects.length} demos`,`${total} / ${projects.length} 个作品`);
      empty.hidden = total !== 0;
    }
    function renderLanguage() {
      filters.setAttribute("aria-label",t("Filter demos by category","按类别筛选"));
      searchText.textContent = t("Find a demo","搜索小作品");
      search.placeholder = t("Try CSV, sliders or map","例如 CSV、滑块、地图");
      empty.textContent = t("No matching demos.","没有找到符合条件的作品。");
      buttons.forEach((button,index) => { button.textContent = t(options[index][1],options[index][2]); });
      for (const entry of groupsList) {
        entry.name.textContent = t(entry.english,entry.mandarin);
        for (const {item,preview,image,title,description,open} of entry.rows) {
          preview.href = demoURL(item);
          preview.setAttribute("aria-label", t("Open ","打开") + local(item.title));
          image.alt = local(item.preview);
          title.textContent = local(item.title);
          description.textContent = local(item.description);
          open.href = preview.href;
          open.textContent = t("Open demo ↗","打开演示 ↗");
          open.setAttribute("aria-label",t("Open ","打开") + local(item.title));
        }
      }
      filter();
    }
    search.addEventListener("input",filter);
    renderLanguage();
    observeLocale(renderLanguage);
  }

  const selectedKey = new URLSearchParams(location.search).get("demo");
  const selected = [...document.querySelectorAll("[data-focus-demo]")].find(section => section.dataset.focusDemo === selectedKey);
  if (selected) {
    document.body.classList.add("demo-focused");
    for (const section of document.querySelectorAll("[data-focus-demo]")) section.hidden = section !== selected;
    const heading = document.getElementById(selected.getAttribute("aria-labelledby"));
    heading.setAttribute("aria-level","1");
    const back = document.querySelector("body > header a");
    if (back) {
      back.removeAttribute("data-en");
      back.removeAttribute("data-zh");
    }
    function focusLanguage() {
      document.title = heading.textContent + " · " + t("Aoxin Yang","杨奥新");
      if (!back) return;
      const url = page("interface-demos.html");
      if (chinese()) url.searchParams.set("lang","zh");
      back.href = url.href;
      back.textContent = t("← All demos","← 全部交互作品");
    }
    focusLanguage();
    observeLocale(focusLanguage);
  }
})();
