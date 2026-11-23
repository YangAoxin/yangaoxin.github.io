// An illustrated fictional town. Coordinates and construction dates are authored examples.
const cityAtlas = (() => {
  const columns = [0, 3.45, 7.85], rows = [0, 3.45, 6.9];
  const ground = ['#a9c69c','#e6d7b5','#98bc91','#cecfac','#dbc9a6','#c9d0b0','#d3c3a2','#c6d1ac','#c4d3a8'];
  const roofs = ['#d78061','#658492','#d2ac70','#789390'];
  const point = (x,y,h=0) => [395+(x-y)*34,42+(x+y)*16.8-h];
  const coords = p => p.map(v=>v.toFixed(1)).join(',');
  const poly = (pts,fill,extra='') => '<polygon points="'+pts.map(coords).join(' ')+'" fill="'+fill+'" '+extra+'/>';
  function floor(x,y,w,d,h,color,extra='') {
    return poly([point(x,y,h),point(x+w,y,h),point(x+w,y+d,h),point(x,y+d,h)],color,extra);
  }
  function box(x,y,w,d,h,top,front='#d6c7ac',side='#abac98',base=0) {
    const a=point(x+w,y,base+h), b=point(x+w,y+d,base+h), c=point(x,y+d,base+h);
    return poly([a,b,point(x+w,y+d,base),point(x+w,y,base)],side)
      +poly([b,c,point(x,y+d,base),point(x+w,y+d,base)],front)+floor(x,y,w,d,base+h,top);
  }
  function line(a,b,color,width) {
    return '<path d="M'+coords(a)+' L'+coords(b)+'" fill="none" stroke="'+color+'" stroke-width="'+width+'" stroke-linecap="round"/>';
  }
  function tree(x,y,size,tone) {
    const [u,v]=point(x,y); const r=size;
    return '<g transform="translate('+coords([u,v])+')"><ellipse cx="3" cy="1" rx="'+r+'" ry="3.2" fill="#596c60" opacity=".22"/><path d="M0,0 v-'+(r*1.8)+'" stroke="#6d6850" stroke-width="2.5"/><ellipse cy="-'+(r*1.65)+'" rx="'+r+'" ry="'+(r*1.32)+'" fill="'+tone+'"/><ellipse cx="-'+r*.27+'" cy="-'+(r*1.95)+'" rx="'+r*.59+'" ry="'+r*.85+'" fill="#ddedb6" opacity=".38"/></g>';
  }
  function house(x,y,w,d,h,roof,flat=false) {
    let s=floor(x+.12,y-.05,w+.12,d,0,'#566c58','opacity=".22"')+box(x,y,w,d,h,'#ede2c9');
    for(let row=0;row<Math.max(1,Math.floor(h/11));row++) {
      for(let i=1;i<=3;i++) s+=line(point(x+w*i/4,y+d,h-4-row*10),point(x+w*i/4,y+d,h-7-row*10),'#62777b',2.6);
      for(let i=1;i<=2;i++) s+=line(point(x+w,y+d*i/3,h-4-row*10),point(x+w,y+d*i/3,h-7-row*10),'#566f73',2.2);
    }
    if(flat) return s+box(x-.04,y-.04,w+.08,d+.08,2,roof,'#b3b5a3','#9fa69e',h)+box(x+.2,y+.12,w*.4,d*.4,3,'#ece6cc','#bac3b4','#a9b7ac',h+2);
    const ridge=[point(x,y+d/2,h+8),point(x+w,y+d/2,h+8)];
    return s+poly([point(x,y,h),point(x+w,y,h),ridge[1],ridge[0]],'#f1b08a')
      +poly([ridge[0],ridge[1],point(x+w,y+d,h),point(x,y+d,h)],roof)
      +poly([point(x+w,y,h),ridge[1],point(x+w,y+d,h)],'#ba8d73');
  }
  // Per district: local footprints and the first frame in which they appear.
  const plots=[
    [[.55,1.8,1.05,.7,13,2]], [[.35,.5,2.15,.65,17,2],[1.45,1.8,1,.7,15,4]],
    [], [[.35,.45,1.1,.8,13,1],[1.55,1.6,.95,.8,17,3]],
    [[.35,.45,.8,.85,16,1],[1.62,.45,.75,.9,25,2],[1.2,1.8,.95,.76,32,4]],
    [[.4,.4,1,.75,16,3],[1.6,1.5,.94,.9,23,4],[.4,1.8,.75,.7,16,5]],
    [[.38,.5,1.05,1.85,15,1],[1.7,.5,.8,1.6,14,3]],
    [[.35,.35,.8,.75,13,2],[1.5,.55,.9,.78,17,4],[.55,1.8,.92,.78,16,6]],
    [[.36,.38,2,.76,17,5]]
  ];
  function origin(i) {return [columns[i%3],rows[Math.floor(i/3)]];}
  const pin = i => {const [x,y]=origin(i); return point(x+1.55,y+2.6,0);};
  function scene(frame, active=-1, hubs=[]) {
    let s=box(-.34,-.34,11.48,10.58,10,'#d9d5bd','#827d68','#696f66',-10);
    s+=floor(6.53,-.34,1.17,10.58,0,'#62a9b0');
    for(let i=0;i<23;i++){
      const x=6.64+(i%3)*.32,y=-.2+(i*.71)%10;
      s+=line(point(x,y),point(x+.03,y+.34),'#b4ded4',1.35);
    }
    for(let i=0;i<9;i++){
      const [x,y]=origin(i);
      s+=floor(x,y,2.99,3.0,0,ground[i],i===active?'stroke="#fff8c9" stroke-width="4"':'stroke="#a0a594" stroke-width="1"');
    }
    for(const y of [3.2,6.65]) {
      s+=line(point(-.2,y),point(6.48,y),'#fff0cd',1.2)+line(point(7.76,y),point(10.93,y),'#fff0cd',1.2);
    }
    if(frame>=6) {
      s+=floor(7.7,-.25,.14,10.38,0,'#d9a56e');
      for(let k=0;k<10;k++) s+=floor(7.72,k+.18,.08,.32,.2,'#fff3cf');
    }
    let objects=[];
    function add(x,y,markup) {objects.push({depth:x+y,markup});}
    for(let i=0;i<9;i++) {
      const [x,y]=origin(i);
      const garden=i===0 || i===2;
      for(let k=0;k<(garden?12:3);k++){
        const dx=garden?.3+(k%4)*.69:2.73, dy=garden?.34+Math.floor(k/4)*1.05:.42+k*.94;
        if(i===0 && frame>=2 && dx<1.75 && dy>1.4) continue;
        add(x+dx,y+dy,tree(x+dx,y+dy,garden?6+(k%3):4.5,['#608c70','#82a879','#5e947c'][k%3]));
      }
      for(const [dx,dy,w,d,h,born] of plots[i]){
        if(born<=frame) add(x+dx+w*.5,y+dy+d*.5,house(x+dx,y+dy,w,d,h,roofs[(i+born)%4],i===4||i===8));
      }
      if(i===8 && frame>=5) {
        s+=floor(x+.46,y+1.52,1.7,.92,.1,'#72a88c','stroke="#f5efd5" stroke-width="1"');
        s+=line(point(x+1.31,y+1.52),point(x+1.31,y+2.44),'#f5efd5',1);
      }
    }
    for(const y of [3.19,...(frame>=3?[6.65]:[])]) {
      add(7.23,y,box(6.42,y-.2,1.52,.42,3,'#d7b68b','#a18466','#837963')+line(point(6.42,y+.21,6),point(7.94,y+.21,6),'#806851',2));
    }
    s+=objects.sort((a,b)=>a.depth-b.depth).map(o=>o.markup).join('');
    for(const [i,dx,dy] of hubs) {
      const [x,y]=origin(i),[u,v]=point(x+dx,y+dy);
      s+='<g transform="translate('+coords([u,v])+')"><path d="M0 0v-16" stroke="#653b23" stroke-width="2"/><circle cy="-20" r="9" fill="#cf632b" stroke="#fff6d9" stroke-width="2"/><path d="M-4 -20h8m-4 -4v8" stroke="white" stroke-width="2"/></g>';
    }
    return '<svg viewBox="0 0 800 437" aria-hidden="true" focusable="false">'+s+'</svg>';
  }
  // Chapter buttons use the same drawing primitives as their map landmarks.
  function landmark(chapter) {
    const lawn = floor(0,0,2.3,1.6,0,'#b6c99f');
    const water = floor(0,0,2.3,1.6,0,'#82b5b8');
    const drawings = [
      () => lawn+tree(.35,.4,6,'#759d73')+house(.72,.55,1.25,.65,14,roofs[0]),
      () => lawn+house(.14,.44,1.9,.63,16,roofs[1]),
      () => water+box(.1,.54,2.06,.5,7,'#d6ab78','#aa8464','#8a715a')+line(point(.1,1.04,11),point(2.16,1.04,11),'#795a45',2),
      () => lawn+house(.3,.25,.8,.75,29,roofs[1],true)+house(1.15,.75,.78,.62,17,roofs[2],true),
      () => lawn+house(.14,.18,1.84,.58,16,roofs[0],true)+floor(.65,.98,1.2,.45,.1,'#74a587','stroke="#fff4d7" stroke-width="1"'),
      () => water+floor(.55,0,1.75,1.6,0,'#abc59c')+floor(.65,0,.23,1.6,.1,'#d5ab79')+tree(1.2,.38,6,'#649579')+tree(1.84,1.06,6,'#7fa378')
    ];
    return '<svg viewBox="333 24 152 96" aria-hidden="true" focusable="false">'+drawings[chapter]()+'</svg>';
  }
  return {scene,pin,landmark};
})();
