// --- Template images (same as before) ---
const TEMPLATES={blank:'',basketball_half:`url('data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="#ffffff"/><rect x="10" y="10" width="380" height="280" fill="none" stroke="#d0d0d0" stroke-width="2"/><line x1="200" y1="10" x2="200" y2="290" stroke="#ff7f7f" stroke-width="2"/><circle cx="200" cy="150" r="45" fill="none" stroke="#ff7f7f" stroke-width="2"/><rect x="10" y="80" width="120" height="140" fill="none" stroke="#ff7f7f" stroke-width="2"/><circle cx="100" cy="150" r="7" fill="#ff7f7f"/><rect x="30" y="110" width="80" height="80" fill="none" stroke="#ff7f7f" stroke-width="2"/></svg>`)}')`,basketball_full:`url('data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="#ffffff"/><rect x="10" y="10" width="380" height="280" fill="none" stroke="#d0d0d0" stroke-width="2"/><line x1="200" y1="10" x2="200" y2="290" stroke="#ff7f7f" stroke-width="2"/><circle cx="200" cy="150" r="45" fill="none" stroke="#ff7f7f" stroke-width="2"/><rect x="10" y="80" width="120" height="140" fill="none" stroke="#ff7f7f" stroke-width="2"/><rect x="270" y="80" width="120" height="140" fill="none" stroke="#ff7f7f" stroke-width="2"/><circle cx="100" cy="150" r="7" fill="#ff7f7f"/><circle cx="300" cy="150" r="7" fill="#ff7f7f"/><rect x="30" y="110" width="80" height="80" fill="none" stroke="#ff7f7f" stroke-width="2"/><rect x="290" y="110" width="80" height="80" fill="none" stroke="#ff7f7f" stroke-width="2"/></svg>`)}')`,soccer_field:`url('data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="#f3fff3"/><rect x="10" y="10" width="380" height="280" fill="none" stroke="#7fbf7f" stroke-width="2"/><line x1="200" y1="10" x2="200" y2="290" stroke="#7fbf7f" stroke-width="2"/><circle cx="200" cy="150" r="35" fill="none" stroke="#7fbf7f" stroke-width="2"/><rect x="10" y="100" width="60" height="100" fill="none" stroke="#7fbf7f" stroke-width="2"/><rect x="330" y="100" width="60" height="100" fill="none" stroke="#7fbf7f" stroke-width="2"/><rect x="10" y="125" width="20" height="50" fill="none" stroke="#7fbf7f" stroke-width="2"/><rect x="370" y="125" width="20" height="50" fill="none" stroke="#7fbf7f" stroke-width="2"/></svg>`)}')`,volleyball_court:`url('data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="#fff5f0"/><rect x="40" y="40" width="320" height="220" fill="none" stroke="#ff9f5f" stroke-width="2"/><line x1="200" y1="40" x2="200" y2="260" stroke="#ff9f5f" stroke-width="2"/><rect x="40" y="40" width="320" height="110" fill="none" stroke="#ff9f5f" stroke-width="1" opacity="0.6"/><rect x="40" y="150" width="320" height="110" fill="none" stroke="#ff9f5f" stroke-width="1" opacity="0.6"/></svg>`)}')`};

// --- Elements ---
const court=document.getElementById('canvas-wrapper');
const gridOverlay=document.getElementById('grid-overlay');
const marquee=document.getElementById('marquee');
const templateLayer=document.getElementById('template-bg');
const chooseCourt=document.getElementById('choose-court');

let snapEnabled=false, gridSize=20, history=[], historyPtr=-1, courtTemplate='blank';

function setGridSize(px){gridSize=px;gridOverlay.style.backgroundSize=`${px}px ${px}px`;}
function setCourtTemplate(name){courtTemplate=(name in TEMPLATES)?name:'blank';templateLayer.style.backgroundImage=TEMPLATES[courtTemplate]||'none';}

// Map icon IDs to their SVG file paths for the placed items
const ICON_SVGS={
  Player:'assets/svg/player_icon.svg',
  Cone:'assets/svg/low_profile_cone.svg',
  Circle:'assets/svg/circle_icon.svg',
  Square:'assets/svg/square_icon.svg',
  ArrowUp:'assets/svg/arrow_sm_up_icon.svg',
  ArrowDown:'assets/svg/arrow_sm_down_icon.svg',
  ArrowLeft:'assets/svg/arrow_sm_left_icon.svg',
  ArrowRight:'assets/svg/arrow_sm_right_icon.svg',
  Frisbee:'assets/svg/frisbee_icon.svg',
  Tennis:'assets/svg/tennis_ball_icon.svg',
  Badminton:'assets/svg/badminton_icon.svg',
  Volleyball:'assets/svg/volleyball_icon.svg',
  Baseball:'assets/svg/baseball_icon.svg',
  Football:'assets/svg/american_football_icon.svg',
  Soccer:'assets/svg/football_icon.svg',
  Basketball:'assets/svg/basketball_icon.svg'
};

// --- Utilities ---
function getSelected(){return Array.from(court.querySelectorAll('.item.selected'));}
function clearSelection(){getSelected().forEach(el=>el.classList.remove('selected'));}

// --- History ---
function serialize(){
  return{
    gridSize,snapEnabled,courtTemplate,
    items:[...court.querySelectorAll('.item')].map(el=>({
      id:el.id,type:el.dataset.type,left:el.style.left,top:el.style.top,
      rotate:el.dataset.rotate||'0',width:el.style.width||null,height:el.style.height||null,
      text:el.dataset.type==='label'?el.textContent:null
    }))
  };
}
function deserialize(state){
  if(!state)return;
  setGridSize(state.gridSize||20);
  snapEnabled=!!state.snapEnabled;
  setCourtTemplate(state.courtTemplate||'blank');
  document.getElementById('toggle-grid-btn').textContent=snapEnabled?'Disable Grid Snap':'Enable Grid Snap';
  // Clear and rebuild
  court.querySelectorAll('.item').forEach(n=>n.remove());
  (state.items||[]).forEach(it=>{
    const el=createItem(it.type, parseFloat(it.left)||40, parseFloat(it.top)||40);
    el.id=it.id||el.id; el.dataset.rotate=it.rotate||'0'; el.style.width=it.width||el.style.width; el.style.height=it.height||el.style.height;
    if(it.text && it.type==='label'){ el.textContent=it.text; }
    applyRotation(el);
  });
}
function pushHistory(){const cur=serialize();history.splice(historyPtr+1);history.push(cur);historyPtr=history.length-1;updateUndoRedo();localStorage.setItem('peplanner_autosave',JSON.stringify(cur));}
function updateUndoRedo(){/* buttons optional here */}
function undo(){if(historyPtr<=0)return;historyPtr--;deserialize(history[historyPtr]);}
function redo(){if(historyPtr>=history.length-1)return;historyPtr++;deserialize(history[historyPtr]);}

// --- Drag / Snap ---
let idCounter=0; function nextId(){return 'item_'+(++idCounter);}
function applyRotation(el){const d=parseFloat(el.dataset.rotate||'0'); el.style.transform=`rotate(${d}deg)`;}

function enableDrag(el){
  let sx=0,sy=0, offsets=[];
  el.addEventListener('pointerdown',e=>{
    el.setPointerCapture(e.pointerId);
    if(!e.shiftKey && !el.classList.contains('selected')) clearSelection();
    el.classList.add('selected');
    const sel=getSelected();
    offsets=sel.map(n=>({node:n,left:parseFloat(n.style.left||0),top:parseFloat(n.style.top||0)}));
    sx=e.clientX; sy=e.clientY;
  });
  el.addEventListener('pointermove',e=>{
    if(!el.hasPointerCapture(e.pointerId))return;
    const dx=e.clientX-sx, dy=e.clientY-sy;
    offsets.forEach(p=>{p.node.style.left=(p.left+dx)+'px'; p.node.style.top=(p.top+dy)+'px';});
  });
  el.addEventListener('pointerup',e=>{
    if(!el.hasPointerCapture(e.pointerId))return;
    el.releasePointerCapture(e.pointerId);
    if(snapEnabled) getSelected().forEach(snapToGrid);
    pushHistory();
  });
  el.addEventListener('click',e=>{ if(!e.shiftKey && !el.classList.contains('selected')) clearSelection(); el.classList.toggle('selected'); e.stopPropagation(); });
}
function snapToGrid(el){
  const left=Math.round(parseFloat(el.style.left||0)/gridSize)*gridSize;
  const top=Math.round(parseFloat(el.style.top||0)/gridSize)*gridSize;
  el.style.left=left+'px'; el.style.top=top+'px';
}

// --- Create item NOW renders an <img> for icon types ---
function createItem(type,x=40,y=40){
  const el=document.createElement('div');
  el.className='item';
  el.dataset.type=type;
  el.dataset.rotate='0';
  el.id=nextId();
  el.style.left=x+'px'; el.style.top=y+'px';

  if(type==='zone'){
    el.classList.add('zone');
    el.style.width='160px'; el.style.height='100px';
    el.textContent=''; // zone could be visual only
  } else if(type==='label'){
    el.textContent='Label';
  } else {
    const src=ICON_SVGS[type];
    if(src){
      const img=document.createElement('img');
      img.src=src; img.alt=type; img.width=40; img.height=40;
      el.appendChild(img);
    } else {
      el.textContent=type; // fallback
    }
  }
  applyRotation(el);
  court.appendChild(el);
  enableDrag(el);
  return el;
}

// --- Palette wiring ---
const iconMap={'icon-player':'Player','icon-cone':'Cone','icon-circle':'Circle','icon-square':'Square','icon-arrow-up':'ArrowUp','icon-arrow-down':'ArrowDown','icon-arrow-left':'ArrowLeft','icon-arrow-right':'ArrowRight','icon-frisbee':'Frisbee','icon-tennis':'Tennis','icon-badminton':'Badminton','icon-volleyball':'Volleyball','icon-baseball':'Baseball','icon-football':'Football','icon-soccer':'Soccer','icon-basketball':'Basketball'};
Object.keys(iconMap).forEach(id=>{const b=document.getElementById(id); if(b){ b.addEventListener('click',()=>{const n=createItem(iconMap[id],40+Math.random()*60,40+Math.random()*60); if(snapEnabled)snapToGrid(n); pushHistory();});}});

// --- Grid controls & choose court ---
document.getElementById('toggle-grid-btn').addEventListener('click',e=>{snapEnabled=!snapEnabled; e.target.textContent=snapEnabled?'Disable Grid Snap':'Enable Grid Snap';});
document.getElementById('grid-size').addEventListener('change',e=>{setGridSize(parseInt(e.target.value,10)); pushHistory();});
chooseCourt.addEventListener('change',e=>{setCourtTemplate(e.target.value); pushHistory();});

// --- Marquee select (optional minimal) ---
let marqueeStart=null;
court.addEventListener('pointerdown',e=>{if(e.target!==court)return;clearSelection();const r=court.getBoundingClientRect();marqueeStart={x:e.clientX-r.left,y:e.clientY-r.top};const m=document.getElementById('marquee');m.classList.remove('hidden');m.style.left=marqueeStart.x+'px';m.style.top=marqueeStart.y+'px';m.style.width='0px';m.style.height='0px';court.setPointerCapture(e.pointerId);});
court.addEventListener('pointermove',e=>{if(!marqueeStart||!court.hasPointerCapture?.(e.pointerId))return;const r=court.getBoundingClientRect();const x=e.clientX-r.left,y=e.clientY-r.top,left=Math.min(x,marqueeStart.x),top=Math.min(y,marqueeStart.y),w=Math.abs(x-marqueeStart.x),h=Math.abs(y-marqueeStart.y);const m=document.getElementById('marquee');m.style.left=left+'px';m.style.top=top+'px';m.style.width=w+'px';m.style.height=h+'px';const box=new DOMRect(left+r.left,top+r.top,w,h);court.querySelectorAll('.item').forEach(el=>{const rr=el.getBoundingClientRect();const overlap=!(rr.right<box.x||rr.left>box.x+box.width||rr.bottom<box.y||rr.top>box.y+box.height);el.classList.toggle('selected',overlap);});});
court.addEventListener('pointerup',e=>{if(!marqueeStart)return;marqueeStart=null;document.getElementById('marquee').classList.add('hidden');court.releasePointerCapture?.(e.pointerId);});

// --- Init ---
(function init(){setGridSize(20);setCourtTemplate('blank');try{const saved=localStorage.getItem('peplanner_autosave');if(saved)deserialize(JSON.parse(saved));}catch{}pushHistory();court.addEventListener('click',e=>{if(e.target===court)clearSelection();});})();