// --- Court templates as SVG data URIs ---
const TEMPLATES = {
  blank: '',
  basketball_half: `url('data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
      <rect width="400" height="300" fill="#ffffff"/>
      <rect x="10" y="10" width="380" height="280" fill="none" stroke="#d0d0d0" stroke-width="2"/>
      <line x1="200" y1="10" x2="200" y2="290" stroke="#ff7f7f" stroke-width="2"/>
      <circle cx="200" cy="150" r="45" fill="none" stroke="#ff7f7f" stroke-width="2"/>
      <rect x="10" y="80" width="120" height="140" fill="none" stroke="#ff7f7f" stroke-width="2"/>
      <circle cx="100" cy="150" r="7" fill="#ff7f7f"/>
      <rect x="30" y="110" width="80" height="80" fill="none" stroke="#ff7f7f" stroke-width="2"/>
    </svg>
  `)}')`,
  basketball_full: `url('data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
      <rect width="400" height="300" fill="#ffffff"/>
      <rect x="10" y="10" width="380" height="280" fill="none" stroke="#d0d0d0" stroke-width="2"/>
      <line x1="200" y1="10" x2="200" y2="290" stroke="#ff7f7f" stroke-width="2"/>
      <circle cx="200" cy="150" r="45" fill="none" stroke="#ff7f7f" stroke-width="2"/>
      <rect x="10" y="80" width="120" height="140" fill="none" stroke="#ff7f7f" stroke-width="2"/>
      <rect x="270" y="80" width="120" height="140" fill="none" stroke="#ff7f7f" stroke-width="2"/>
      <circle cx="100" cy="150" r="7" fill="#ff7f7f"/>
      <circle cx="300" cy="150" r="7" fill="#ff7f7f"/>
      <rect x="30" y="110" width="80" height="80" fill="none" stroke="#ff7f7f" stroke-width="2"/>
      <rect x="290" y="110" width="80" height="80" fill="none" stroke="#ff7f7f" stroke-width="2"/>
    </svg>
  `)}')`,
  soccer_field: `url('data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
      <rect width="400" height="300" fill="#f3fff3"/>
      <rect x="10" y="10" width="380" height="280" fill="none" stroke="#7fbf7f" stroke-width="2"/>
      <line x1="200" y1="10" x2="200" y2="290" stroke="#7fbf7f" stroke-width="2"/>
      <circle cx="200" cy="150" r="35" fill="none" stroke="#7fbf7f" stroke-width="2"/>
      <rect x="10" y="100" width="60" height="100" fill="none" stroke="#7fbf7f" stroke-width="2"/>
      <rect x="330" y="100" width="60" height="100" fill="none" stroke="#7fbf7f" stroke-width="2"/>
      <rect x="10" y="125" width="20" height="50" fill="none" stroke="#7fbf7f" stroke-width="2"/>
      <rect x="370" y="125" width="20" height="50" fill="none" stroke="#7fbf7f" stroke-width="2"/>
    </svg>
  `)}')`,
  volleyball_court: `url('data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
      <rect width="400" height="300" fill="#fff5f0"/>
      <rect x="40" y="40" width="320" height="220" fill="none" stroke="#ff9f5f" stroke-width="2"/>
      <line x1="200" y1="40" x2="200" y2="260" stroke="#ff9f5f" stroke-width="2"/> <!-- net -->
      <rect x="40" y="40" width="320" height="110" fill="none" stroke="#ff9f5f" stroke-width="1" opacity="0.6"/>
      <rect x="40" y="150" width="320" height="110" fill="none" stroke="#ff9f5f" stroke-width="1" opacity="0.6"/>
    </svg>
  `)}')`
};

// --- Elements and existing logic from previous drop-in ---
const court = document.getElementById('canvas-wrapper');
const gridOverlay = document.getElementById('grid-overlay');
const marquee = document.getElementById('marquee');
const templateLayer = document.getElementById('template-bg');
const chooseCourt = document.getElementById('choose-court');

let snapEnabled = false;
let gridSize = 20;
let history = [];
let historyPtr = -1;
let courtTemplate = 'blank';

function setGridSize(px) {
  gridSize = px;
  gridOverlay.style.backgroundSize = `${px}px ${px}px`;
}

function setCourtTemplate(name) {
  courtTemplate = name in TEMPLATES ? name : 'blank';
  const img = TEMPLATES[courtTemplate];
  templateLayer.style.backgroundImage = img || 'none';
}

// --- Utilities ---
function getSelected() {
  return Array.from(court.querySelectorAll('.item.selected'));
}
function clearSelection() {
  getSelected().forEach(el => el.classList.remove('selected'));
}

// --- History ---
function serialize() {
  return {
    gameName: document.getElementById('game-name-input').value,
    objective: document.getElementById('objective-textarea').value,
    notes: document.getElementById('notes-textarea').value,
    equipment: document.getElementById('equipment-textarea').value,
    modifications: document.getElementById('modifications-textarea').value,
    gridSize,
    snapEnabled,
    courtTemplate,
    items: [...court.querySelectorAll('.item')].map(el => ({
      id: el.id,
      type: el.dataset.type,
      left: el.style.left,
      top: el.style.top,
      width: el.style.width || null,
      height: el.style.height || null,
      rotate: el.dataset.rotate || '0',
      text: el.textContent
    }))
  };
}
function deserialize(state) {
  if (!state) return;
  document.getElementById('game-name-input').value = state.gameName || '';
  document.getElementById('objective-textarea').value = state.objective || '';
  document.getElementById('notes-textarea').value = state.notes || '';
  document.getElementById('equipment-textarea').value = state.equipment || '';
  document.getElementById('modifications-textarea').value = state.modifications || '';
  setGridSize(state.gridSize || 20);
  snapEnabled = !!state.snapEnabled;
  setCourtTemplate(state.courtTemplate || 'blank');
  document.getElementById('toggle-grid-btn').textContent = snapEnabled ? 'Disable Grid Snap' : 'Enable Grid Snap';
  chooseCourt.value = courtTemplate;

  court.querySelectorAll('.item').forEach(n => n.remove());
  (state.items || []).forEach(it => {
    const el = createItem(it.type, parseFloat(it.left)||40, parseFloat(it.top)||40);
    el.id = it.id || el.id;
    el.textContent = it.text || it.type;
    if (it.width) el.style.width = it.width;
    if (it.height) el.style.height = it.height;
    el.dataset.rotate = it.rotate || '0';
    applyRotation(el);
  });
}
function pushHistory() {
  const current = serialize();
  history.splice(historyPtr + 1);
  history.push(current);
  historyPtr = history.length - 1;
  updateUndoRedo();
  localStorage.setItem('peplanner_autosave', JSON.stringify(current));
}
function updateUndoRedo() {
  document.getElementById('undo-btn').disabled = !(historyPtr > 0);
  document.getElementById('redo-btn').disabled = !(historyPtr < history.length - 1);
}
function undo() {
  if (historyPtr <= 0) return;
  historyPtr--;
  deserialize(history[historyPtr]);
  updateUndoRedo();
}
function redo() {
  if (historyPtr >= history.length - 1) return;
  historyPtr++;
  deserialize(history[historyPtr]);
  updateUndoRedo();
}

// --- Draggables (same as before) ---
let idCounter = 0;
function nextId() { return 'item_' + (++idCounter); }

function applyRotation(el) {
  const deg = parseFloat(el.dataset.rotate || '0');
  el.style.transform = `rotate(${deg}deg)`;
}

function enableResize(el, handle) {
  let sx, sy, sw, sh;
  handle.addEventListener('pointerdown', e => {
    e.stopPropagation();
    handle.setPointerCapture(e.pointerId);
    sx = e.clientX; sy = e.clientY;
    const r = el.getBoundingClientRect();
    sw = r.width; sh = r.height;
  });
  handle.addEventListener('pointermove', e => {
    if (!handle.hasPointerCapture(e.pointerId)) return;
    const dx = e.clientX - sx;
    const dy = e.clientY - sy;
    el.style.width = Math.max(20, sw + dx) + 'px';
    el.style.height = Math.max(20, sh + dy) + 'px';
  });
  handle.addEventListener('pointerup', e => {
    if (!handle.hasPointerCapture(e.pointerId)) return;
    handle.releasePointerCapture(e.pointerId);
    pushHistory();
  });
}

function createItem(type, x=40, y=40) {
  const el = document.createElement('div');
  el.className = 'item';
  el.dataset.type = type;
  el.dataset.rotate = '0';
  el.id = nextId();
  el.style.left = x + 'px';
  el.style.top = y + 'px';

  if (type === 'zone') {
    el.classList.add('zone');
    el.textContent = 'Zone';
    el.style.width = '160px';
    el.style.height = '100px';
    const h = document.createElement('div');
    h.className = 'resize';
    el.appendChild(h);
    enableResize(el, h);
  } else {
    el.textContent = type;
  }
  applyRotation(el);
  court.appendChild(el);
  enableDrag(el);
  return el;
}

function cloneItem(node) {
  const el = createItem(node.dataset.type, parseFloat(node.style.left||0)+12, parseFloat(node.style.top||0)+12);
  el.textContent = node.textContent;
  el.dataset.rotate = node.dataset.rotate || '0';
  el.style.width = node.style.width;
  el.style.height = node.style.height;
  applyRotation(el);
  return el;
}

function enableDrag(el) {
  let startX=0, startY=0, offsets=[], altClones=null;

  el.addEventListener('pointerdown', e => {
    el.setPointerCapture(e.pointerId);
    if (e.altKey) {
      const selection = getSelected().length ? getSelected() : [el];
      altClones = selection.map(n => cloneItem(n));
      clearSelection();
      altClones.forEach(c => c.classList.add('selected'));
    } else {
      if (!e.shiftKey && !el.classList.contains('selected')) clearSelection();
      el.classList.add('selected');
    }
    const sel = getSelected();
    offsets = sel.map(n => ({
      node: n,
      left: parseFloat(n.style.left || 0),
      top: parseFloat(n.style.top  || 0)
    }));
    startX = e.clientX; startY = e.clientY;
  });

  el.addEventListener('pointermove', e => {
    if (!el.hasPointerCapture(e.pointerId)) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    offsets.forEach(p => {
      p.node.style.left = (p.left + dx) + 'px';
      p.node.style.top  = (p.top  + dy) + 'px';
    });
  });

  el.addEventListener('pointerup', e => {
    if (!el.hasPointerCapture(e.pointerId)) return;
    el.releasePointerCapture(e.pointerId);
    if (snapEnabled) getSelected().forEach(snapToGrid);
    pushHistory();
    altClones = null;
  });

  el.addEventListener('click', e => {
    if (!e.shiftKey && !el.classList.contains('selected')) clearSelection();
    el.classList.toggle('selected');
    e.stopPropagation();
  });
}

function snapToGrid(el) {
  const left = Math.round(parseFloat(el.style.left || 0) / gridSize) * gridSize;
  const top  = Math.round(parseFloat(el.style.top  || 0) / gridSize) * gridSize;
  el.style.left = left + 'px';
  el.style.top  = top  + 'px';
}

// --- Marquee selection ---
let marqueeStart = null;
court.addEventListener('pointerdown', e => {
  if (e.target !== court) return;
  clearSelection();
  const rect = court.getBoundingClientRect();
  marqueeStart = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  marquee.classList.remove('hidden');
  marquee.style.left = `${marqueeStart.x}px`;
  marquee.style.top  = `${marqueeStart.y}px`;
  marquee.style.width = '0px'; marquee.style.height = '0px';
  court.setPointerCapture(e.pointerId);
});
court.addEventListener('pointermove', e => {
  if (!marqueeStart || !court.hasPointerCapture?.(e.pointerId)) return;
  const rect = court.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const left = Math.min(x, marqueeStart.x);
  const top  = Math.min(y, marqueeStart.y);
  const w = Math.abs(x - marqueeStart.x);
  const h = Math.abs(y - marqueeStart.y);
  marquee.style.left = `${left}px`;
  marquee.style.top = `${top}px`;
  marquee.style.width = `${w}px`;
  marquee.style.height = `${h}px`;

  const box = new DOMRect(left + rect.left, top + rect.top, w, h);
  court.querySelectorAll('.item').forEach(el => {
    const r = el.getBoundingClientRect();
    const overlap = !(r.right < box.x || r.left > box.x + box.width || r.bottom < box.y || r.top > box.y + box.height);
    el.classList.toggle('selected', overlap);
  });
});
court.addEventListener('pointerup', e => {
  if (!marqueeStart) return;
  marqueeStart = null;
  marquee.classList.add('hidden');
  court.releasePointerCapture?.(e.pointerId);
});

// --- Icons palette wiring ---
const iconMap = {
  'icon-player': 'Player',
  'icon-cone': 'Cone',
  'icon-circle': 'Circle',
  'icon-square': 'Square',
  'icon-arrow-up': 'ArrowUp',
  'icon-arrow-down': 'ArrowDown',
  'icon-arrow-left': 'ArrowLeft',
  'icon-arrow-right': 'ArrowRight',
  'icon-frisbee': 'Frisbee',
  'icon-tennis': 'Tennis',
  'icon-badminton': 'Badminton',
  'icon-volleyball': 'Volleyball',
  'icon-baseball': 'Baseball',
  'icon-football': 'Football',
  'icon-soccer': 'Soccer',
  'icon-basketball': 'Basketball'
};
Object.keys(iconMap).forEach(id => {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener('click', () => { 
      const n = createItem(iconMap[id], 40 + Math.random()*60, 40 + Math.random()*60);
      if (snapEnabled) snapToGrid(n);
      pushHistory();
    });
  }
});

// --- Align & Group ---
function selectionBox(els) {
  const pr = court.getBoundingClientRect();
  const rects = els.map(e => e.getBoundingClientRect());
  const minX = Math.min(...rects.map(r=>r.left)) - pr.left;
  const minY = Math.min(...rects.map(r=>r.top)) - pr.top;
  const maxX = Math.max(...rects.map(r=>r.right)) - pr.left;
  const maxY = Math.max(...rects.map(r=>r.bottom)) - pr.top;
  return {minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY};
}
document.getElementById('align-horizontal-btn').addEventListener('click', () => {
  const s = getSelected(); if (s.length<2) return;
  const box = selectionBox(s);
  s.forEach(el => {
    const h = el.getBoundingClientRect().height;
    el.style.top = (box.minY + (box.height - h)/2) + 'px';
  });
  if (snapEnabled) s.forEach(snapToGrid);
  pushHistory();
});
document.getElementById('align-vertical-btn').addEventListener('click', () => {
  const s = getSelected(); if (s.length<2) return;
  const box = selectionBox(s);
  s.forEach(el => {
    const w = el.getBoundingClientRect().width;
    el.style.left = (box.minX + (box.width - w)/2) + 'px';
  });
  if (snapEnabled) s.forEach(snapToGrid);
  pushHistory();
});

document.getElementById('group-btn').addEventListener('click', () => {
  const s = getSelected(); if (s.length<2) return;
  const gid = 'g_' + Date.now();
  s.forEach(el => el.dataset.group = gid);
  pushHistory();
});
document.getElementById('ungroup-btn').addEventListener('click', () => {
  getSelected().forEach(el => delete el.dataset.group);
  pushHistory();
});

// --- Grid controls ---
document.getElementById('toggle-grid-btn').addEventListener('click', (e) => {
  snapEnabled = !snapEnabled;
  e.target.textContent = snapEnabled ? 'Disable Grid Snap' : 'Enable Grid Snap';
});
document.getElementById('grid-size').addEventListener('change', (e) => {
  setGridSize(parseInt(e.target.value, 10));
  pushHistory();
});

// --- Choose court ---
chooseCourt.addEventListener('change', (e) => {
  setCourtTemplate(e.target.value);
  pushHistory();
});

// --- Export ---
async function exportCanvasFromCourt() {
  const dpr = Math.max(2, window.devicePixelRatio || 1);
  return await html2canvas(document.getElementById('court-container'), {
    backgroundColor: '#ffffff',
    scale: dpr,
    useCORS: true
  });
}
document.getElementById('export-pdf-btn').addEventListener('click', async () => {
  const canvas = await exportCanvasFromCourt();
  const img = canvas.toDataURL('image/png');
  const pdf = new jspdf.jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait' });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const imgW = pageW;
  const imgH = canvas.height * (imgW / canvas.width);
  const y = Math.max(0, (pageH - imgH) / 2);
  pdf.addImage(img, 'PNG', 0, y, imgW, imgH, '', 'FAST');
  pdf.save('PEPlanner.pdf');
});
document.getElementById('export-png-btn').addEventListener('click', async () => {
  const canvas = await exportCanvasFromCourt();
  const link = document.createElement('a');
  link.download = 'PEPlanner.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
});

// --- Clear court ---
document.getElementById('clear-court').addEventListener('click', () => {
  clearSelection();
  court.querySelectorAll('.item').forEach(el => el.remove());
  pushHistory();
});

// --- Save/Load JSON ---
document.getElementById('save-json-btn').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(serialize(), null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'peplanner-session.json'; a.click();
  URL.revokeObjectURL(url);
});
document.getElementById('load-json-btn').addEventListener('change', (e) => {
  const f = e.target.files?.[0];
  if (!f) return;
  const reader = new FileReader();
  reader.onload = () => {
    try { deserialize(JSON.parse(reader.result)); pushHistory(); }
    catch { alert('Invalid JSON file.'); }
  };
  reader.readAsText(f);
  e.target.value = '';
});

// --- Keyboard shortcuts ---
document.addEventListener('keydown', (e) => {
  const mac = navigator.platform.toUpperCase().includes('MAC');
  const mod = mac ? e.metaKey : e.ctrlKey;
  if (mod && e.key.toLowerCase()==='z') { e.preventDefault(); undo(); return; }
  if (mod && e.key.toLowerCase()==='y') { e.preventDefault(); redo(); return; }
  const sel = getSelected();
  if (e.key === 'Delete') {
    sel.forEach(el => el.remove());
    pushHistory();
    e.preventDefault();
  }
  if (e.shiftKey && ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) {
    const delta = 5;
    sel.forEach(el => {
      const dx = e.key==='ArrowLeft'?-delta:e.key==='ArrowRight'?delta:0;
      const dy = e.key==='ArrowUp'?-delta:e.key==='ArrowDown'?delta:0;
      el.style.left = (parseFloat(el.style.left||0)+dx)+'px';
      el.style.top  = (parseFloat(el.style.top ||0)+dy)+'px';
      if (snapEnabled) snapToGrid(el);
    });
    pushHistory();
    e.preventDefault();
  }
  if (e.key.toLowerCase()==='r' && sel.length) {
    sel.forEach(el => {
      const curr = parseFloat(el.dataset.rotate || '0');
      el.dataset.rotate = String((curr + 15) % 360);
      el.style.transform = `rotate(${el.dataset.rotate}deg)`;
    });
    pushHistory();
  }
});

// --- Init ---
(function init() {
  setGridSize(20);
  setCourtTemplate('blank');
  // restore autosave
  try {
    const saved = localStorage.getItem('peplanner_autosave');
    if (saved) deserialize(JSON.parse(saved));
  } catch {}
  // seed history
  pushHistory();
  // deselect when clicking empty court
  court.addEventListener('click', (e) => { if (e.target === court) clearSelection(); });
})();