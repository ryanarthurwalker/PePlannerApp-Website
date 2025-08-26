/* Core state */
let gridSize = 20;
const court = document.getElementById('court');
const gridCanvas = document.getElementById('gridCanvas');
const palette = document.getElementById('palette');

/* Draw grid */
function drawGrid() {
  const dpi = window.devicePixelRatio || 1;
  const rect = court.getBoundingClientRect();
  gridCanvas.width = Math.floor(rect.width * dpi);
  gridCanvas.height = Math.floor(rect.height * dpi);
  const ctx = gridCanvas.getContext('2d');
  ctx.scale(dpi, dpi);
  ctx.clearRect(0, 0, rect.width, rect.height);
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = 1;
  ctx.strokeStyle = '#e8e8e8';
  for (let x = 0; x < rect.width; x += gridSize) {
    ctx.beginPath(); ctx.moveTo(x+0.5, 0); ctx.lineTo(x+0.5, rect.height); ctx.stroke();
  }
  for (let y = 0; y < rect.height; y += gridSize) {
    ctx.beginPath(); ctx.moveTo(0, y+0.5); ctx.lineTo(rect.width, y+0.5); ctx.stroke();
  }
}
window.addEventListener('resize', drawGrid);

/* Utilities */
function getSelected() {
  return Array.from(court.querySelectorAll('.draggable.selected'));
}
function clearSelection() {
  getSelected().forEach(el => el.classList.remove('selected'));
}

/* Dragging with Pointer Events + snap on release */
function enableDrag(el) {
  let startX=0, startY=0, origX=0, origY=0;
  const onDown = (e) => {
    el.setPointerCapture(e.pointerId);
    if (!e.shiftKey && !el.classList.contains('selected')) {
      clearSelection();
    }
    el.classList.add('selected');
    startX = e.clientX; startY = e.clientY;
    const r = el.getBoundingClientRect();
    const pr = court.getBoundingClientRect();
    origX = r.left - pr.left; origY = r.top - pr.top;
  };
  const onMove = (e) => {
    if (!el.hasPointerCapture(e.pointerId)) return;
    const dx = e.clientX - startX; const dy = e.clientY - startY;
    const sel = getSelected();
    sel.forEach(node => {
      const left = parseFloat(node.style.left || 0);
      const top = parseFloat(node.style.top || 0);
      node.style.left = (left + dx - (node===el?0:0)) + 'px';
      node.style.top  = (top  + dy - (node===el?0:0)) + 'px';
    });
    startX = e.clientX; startY = e.clientY;
  };
  const onUp = (e) => {
    if (!el.hasPointerCapture(e.pointerId)) return;
    el.releasePointerCapture(e.pointerId);
    // Snap selection
    getSelected().forEach(snapToGrid);
  };
  el.addEventListener('pointerdown', onDown);
  el.addEventListener('pointermove', onMove);
  el.addEventListener('pointerup', onUp);
}

/* Snap */
function snapToGrid(el) {
  if (!document.getElementById('snapToggle').checked) return;
  const left = Math.round(parseFloat(el.style.left || 0) / gridSize) * gridSize;
  const top  = Math.round(parseFloat(el.style.top  || 0) / gridSize) * gridSize;
  el.style.left = left + 'px';
  el.style.top  = top  + 'px';
}

/* Palette: add items */
function createItem(type, x=40, y=40) {
  const el = document.createElement('div');
  el.className = 'draggable';
  el.dataset.type = type;
  el.textContent = type;
  el.style.left = x + 'px';
  el.style.top = y + 'px';
  court.appendChild(el);
  enableDrag(el);

  el.addEventListener('click', (e) => {
    if (!e.shiftKey) clearSelection();
    el.classList.toggle('selected');
    e.stopPropagation();
  });
  return el;
}

palette.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-type]');
  if (!btn) return;
  const el = createItem(btn.dataset.type);
  if (document.getElementById('snapToggle').checked) snapToGrid(el);
});

/* Deselect when clicking empty court */
court.addEventListener('pointerdown', (e) => {
  if (e.target === court || e.target === gridCanvas) clearSelection();
});

/* Keyboard shortcuts */
document.addEventListener('keydown', (e) => {
  const sel = getSelected();
  if (e.key === 'Delete') {
    sel.forEach(el => el.remove());
    e.preventDefault();
    return;
  }
  if (e.shiftKey && ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) {
    const delta = 5;
    sel.forEach(el => {
      const dx = e.key==='ArrowLeft'?-delta:e.key==='ArrowRight'?delta:0;
      const dy = e.key==='ArrowUp'?-delta:e.key==='ArrowDown'?delta:0;
      el.style.left = (parseFloat(el.style.left||0)+dx)+'px';
      el.style.top  = (parseFloat(el.style.top ||0)+dy)+'px';
    });
    e.preventDefault();
  }
});

/* Align helpers */
function getSelectionBox(els) {
  const pr = court.getBoundingClientRect();
  const rects = els.map(e => e.getBoundingClientRect());
  const minX = Math.min(...rects.map(r=>r.left)) - pr.left;
  const minY = Math.min(...rects.map(r=>r.top)) - pr.top;
  const maxX = Math.max(...rects.map(r=>r.right)) - pr.left;
  const maxY = Math.max(...rects.map(r=>r.bottom)) - pr.top;
  return {minX, minY, maxX, maxY, width: maxX-minX, height: maxY-minY};
}
function alignLeft(){ const s=getSelected(); if(s.length<2) return; const box=getSelectionBox(s); s.forEach(el=>el.style.left=box.minX+'px'); }
function alignRight(){ const s=getSelected(); if(s.length<2) return; const box=getSelectionBox(s); s.forEach(el=>{ const w=el.getBoundingClientRect().width; el.style.left=(box.maxX - w)+'px'; }); }
function alignTop(){ const s=getSelected(); if(s.length<2) return; const box=getSelectionBox(s); s.forEach(el=>el.style.top=box.minY+'px'); }
function alignBottom(){ const s=getSelected(); if(s.length<2) return; const box=getSelectionBox(s); s.forEach(el=>{ const h=el.getBoundingClientRect().height; el.style.top=(box.maxY - h)+'px'; }); }
function alignHCenter(){ const s=getSelected(); if(s.length<2) return; const box=getSelectionBox(s); s.forEach(el=>{ const w=el.getBoundingClientRect().width; el.style.left=(box.minX + (box.width - w)/2)+'px'; }); }
function alignVCenter(){ const s=getSelected(); if(s.length<2) return; const box=getSelectionBox(s); s.forEach(el=>{ const h=el.getBoundingClientRect().height; el.style.top=(box.minY + (box.height - h)/2)+'px'; }); }

document.getElementById('alignLeft').addEventListener('click', alignLeft);
document.getElementById('alignRight').addEventListener('click', alignRight);
document.getElementById('alignTop').addEventListener('click', alignTop);
document.getElementById('alignBottom').addEventListener('click', alignBottom);
document.getElementById('alignHCenter').addEventListener('click', alignHCenter);
document.getElementById('alignVCenter').addEventListener('click', alignVCenter);

/* Snap/grid size controls */
document.querySelectorAll('input[name="gridSize"]').forEach(radio => {
  radio.addEventListener('change', () => {
    gridSize = parseInt(radio.value, 10);
    drawGrid();
  });
});

/* Export: PDF + PNG */
async function exportCanvasFromCourt() {
  const dpr = Math.max(2, window.devicePixelRatio || 1);
  return await html2canvas(court, {
    backgroundColor: '#ffffff',
    scale: dpr,
    useCORS: true
  });
}
async function exportPDF() {
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
}
async function exportPNG() {
  const canvas = await exportCanvasFromCourt();
  const link = document.createElement('a');
  link.download = 'PEPlanner.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
}

document.getElementById('btnExportPDF').addEventListener('click', exportPDF);
document.getElementById('btnExportPNG').addEventListener('click', exportPNG);

/* Clear court */
document.getElementById('btnClear').addEventListener('click', () => {
  clearSelection();
  court.querySelectorAll('.draggable').forEach(el => el.remove());
  saveAutosave();
});

/* Autosave */
function serializeState() {
  return {
    gameName: document.getElementById('gameName').value,
    objective: document.getElementById('objective').value,
    notes: document.getElementById('quickNotes').value,
    equipment: document.getElementById('equipment').value,
    modifications: document.getElementById('modifications').value,
    items: [...court.querySelectorAll('.draggable')].map(d => ({
      type: d.dataset.type, left: d.style.left, top: d.style.top, text: d.textContent
    }))
  };
}
function deserializeState(state) {
  if (!state) return;
  document.getElementById('gameName').value = state.gameName || '';
  document.getElementById('objective').value = state.objective || '';
  document.getElementById('quickNotes').value = state.notes || '';
  document.getElementById('equipment').value = state.equipment || '';
  document.getElementById('modifications').value = state.modifications || '';
  // clear
  court.querySelectorAll('.draggable').forEach(el => el.remove());
  (state.items||[]).forEach(it => {
    const el = createItem(it.type, parseFloat(it.left)||40, parseFloat(it.top)||40);
    el.textContent = it.text || it.type;
  });
}
function saveAutosave() {
  localStorage.setItem('peplanner_autosave', JSON.stringify(serializeState()));
}
['gameName','objective','quickNotes','equipment','modifications'].forEach(id => {
  const el = document.getElementById(id);
  el.addEventListener('input', saveAutosave);
});
const autosaveInterval = setInterval(saveAutosave, 3000);
window.addEventListener('beforeunload', saveAutosave);

/* Init existing draggable (if any) and grid */
function initExisting() {
  drawGrid();
  const saved = localStorage.getItem('peplanner_autosave');
  if (saved) {
    try { deserializeState(JSON.parse(saved)); } catch {}
  }
  court.querySelectorAll('.draggable').forEach(enableDrag);
}
window.addEventListener('load', initExisting);
