/** Picture node view: click to select, drag a corner to resize with the ratio kept (works under the page zoom). */
export function imageNodeView({ node, editor, getPos }) {
  const dom = document.createElement('span'); dom.className = 'dxi';
  const img = document.createElement('img'); img.draggable = false; dom.appendChild(img);
  let cur = node;
  const paint = (n) => {
    img.src = n.attrs.src; img.alt = n.attrs.alt || '';
    ['width', 'height'].forEach((k) => { if (n.attrs[k]) img.setAttribute(k, String(n.attrs[k])); else img.removeAttribute(k); });
    if (n.attrs.dataFl) dom.setAttribute('data-fl', n.attrs.dataFl); else dom.removeAttribute('data-fl');
  };
  paint(node);
  ['nw', 'ne', 'sw', 'se'].forEach((c) => {
    const h = document.createElement('i'); h.className = `dxi__h dxi__h--${c}`; dom.appendChild(h);
    h.addEventListener('mousedown', (e) => {
      e.preventDefault(); e.stopPropagation();
      const r = img.getBoundingClientRect(); const scale = r.width / (img.offsetWidth || r.width || 1) || 1;
      const w0 = img.offsetWidth || r.width; const ratio = (img.offsetHeight || r.height) / (w0 || 1); const x0 = e.clientX; const sign = c.endsWith('e') ? 1 : -1; let w = w0;
      const move = (ev) => { w = Math.max(16, Math.round(w0 + ((ev.clientX - x0) / scale) * sign)); img.setAttribute('width', String(w)); img.setAttribute('height', String(Math.round(w * ratio))); };
      const up = () => {
        document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up);
        const pos = getPos(); if (typeof pos !== 'number') return;
        editor.view.dispatch(editor.state.tr.setNodeMarkup(pos, undefined, { ...cur.attrs, width: w, height: Math.round(w * ratio) }));
      };
      document.addEventListener('mousemove', move); document.addEventListener('mouseup', up);
    });
  });
  return {
    dom,
    update(n) { if (n.type !== cur.type) return false; cur = n; paint(n); return true; },
    selectNode() { dom.classList.add('is-sel'); }, deselectNode() { dom.classList.remove('is-sel'); },
    stopEvent: (e) => !!e.target?.classList?.contains('dxi__h'),
    ignoreMutation: () => true,
  };
}
