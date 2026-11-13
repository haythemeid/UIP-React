/**
 * Page view of the Word editor: the document is ONE editable flow, but it is shown as separate sheets with a grey gap between them
 * (like Word's "Print Layout"). No node is ever added to the document: each page break is a *widget decoration* (a spacer) that
 *   - ends the current page (blank area + the page's footer),
 *   - draws the gap,
 *   - starts the next page (the page's header).
 * A line is never cut in half: paragraphs are split between lines, table rows are never split, a hard page break (Ctrl+Enter) starts a page.
 *
 * Cost control (this plugin must never be the reason typing lags):
 *   - nothing runs while you type: the measure is scheduled 180 ms after the last change (500 ms in a big document) and skipped during IME composition;
 *   - ONE layout read per measure: the spacers are hidden (class `dx-nopg`) while the natural positions are read, then shown again in the same task;
 *   - nothing is dispatched when the result is the same as before;
 *   - hard limits: above MAX_BLOCKS blocks the page view switches itself off (the editor falls back to the continuous sheet).
 *
 * Geometry comes from the DOM (sheet, header / footer bands) + the options below; everything is in CSS px of the sheet (zoom independent).
 */
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { TableMap } from '@tiptap/pm/tables';

export const pageKey = new PluginKey('dxPages');
export const PAGE_GAP = 28; // px between two sheets
const MAX_BLOCKS = 6000;
const EPS = 0.75;

const blankBand = (el) => !el || (!el.querySelector('img,table,[data-fld]') && !(el.textContent || '').trim());

/** DOM of one spacer. `tag` 'div' between blocks / inside a paragraph, 'tr' between table rows. */
function buildSpacer(info, hdrEl, ftrEl) {
  const { h, hz, fz, k, n, cols, hdPad, ftPad, ml = 0, mr = 0 } = info;
  const root = document.createElement(cols ? 'tr' : 'div');
  root.className = 'dxpg'; root.setAttribute('contenteditable', 'false'); root.setAttribute('aria-hidden', 'true');
  let host = root;
  if (cols) { const td = document.createElement('td'); td.colSpan = cols; td.className = 'dxpg__cell'; root.appendChild(td); host = document.createElement('div'); host.className = 'dxpg dxpg--in'; td.appendChild(host); }
  host.style.height = `${Math.max(0, h)}px`; host.style.marginLeft = `${-ml}px`; host.style.marginRight = `${-mr}px`; // bleed to the page edges, wherever the block sits (list, indent, table)
  const ft = Math.max(0, Math.min(fz, h - PAGE_GAP - hz)); const fill = Math.max(0, h - ft - PAGE_GAP - hz);
  const fillEl = document.createElement('div'); fillEl.className = 'dxpg__fill'; fillEl.style.height = `${fill}px`;
  const ftEl = document.createElement('div'); ftEl.className = 'dxpg__ft'; ftEl.style.height = `${ft}px`; ftEl.style.paddingBottom = `${ftPad}px`;
  const gap = document.createElement('div'); gap.className = 'dxpg__gap'; gap.style.height = `${PAGE_GAP}px`;
  const hdEl = document.createElement('div'); hdEl.className = 'dxpg__hd'; hdEl.style.height = `${hz}px`; hdEl.style.paddingTop = `${hdPad}px`;
  const ghost = (src, page) => { // a read-only copy of the header / footer with the right page number
    if (blankBand(src)) return null;
    const c = document.createElement('div'); c.className = src.className.replace('ProseMirror', '').trim(); c.innerHTML = src.innerHTML;
    c.querySelectorAll('[data-fld]').forEach((f) => { f.textContent = f.getAttribute('data-fld') === 'NUMPAGES' ? String(n) : String(page); });
    c.removeAttribute('contenteditable'); return c;
  };
  const f = ghost(ftrEl, k + 1); if (f) ftEl.appendChild(f);
  const hd = ghost(hdrEl, k + 2); if (hd) hdEl.appendChild(hd);
  host.append(fillEl, ftEl, gap, hdEl);
  return root;
}

function measure(view, opts) {
  const dom = view.dom; const st = pageKey.getState(view.state);
  const g = opts.getGeom();
  const sheet = dom.closest('.dxp');
  const done = (set, sig, n) => {
    if (sig === st.sig) { opts.onPages?.(n); return; }
    view.dispatch(view.state.tr.setMeta(pageKey, { set, sig }).setMeta('addToHistory', false));
    opts.onPages?.(n);
  };
  if (!g.enabled || !sheet || !dom.isConnected) { done([], 'off', 0); return; }

  // ---- 1. read natural positions (spacers hidden) -------------------------------------------------------------
  dom.classList.add('dx-nopg');
  const sr = sheet.getBoundingClientRect(); const scale = g.pageW > 0 && sr.width > 0 ? sr.width / g.pageW : 1;
  const root = dom.getBoundingClientRect();
  const ftrEl = sheet.querySelector('.dxp__ftr'); const ftrWrap = ftrEl ? ftrEl.closest('.dxp__bandwrap') : null;
  const hz = (root.top - sr.top) / scale; // sheet top -> first line of the body (top padding + header band)
  const fz = (ftrWrap ? ftrWrap.getBoundingClientRect().height / scale : 0) + g.ftPad; // footer band + bottom padding
  const C = g.pageH - hz - fz; const P = g.pageH + PAGE_GAP;
  const doc = view.state.doc;
  const items = []; let count = 0;
  doc.descendants((node, pos) => {
    if (node.isTextblock) { count += 1; items.push({ t: 'p', pos, node }); return false; }
    if (node.type.name === 'tableRow') { items.push({ t: 'r', pos, node }); return false; }
    if (node.type.name === 'pageBreak') { items.push({ t: 'b', pos, node }); return false; }
    return true;
  });
  if (count > MAX_BLOCKS || C < 120) { dom.classList.remove('dx-nopg'); done([], 'off', 0); opts.onTooBig?.(); return; }
  const Y = (v) => (v - root.top) / scale;
  const rects = items.map((it) => { const el = view.nodeDOM(it.pos); return el && el.getBoundingClientRect ? el.getBoundingClientRect() : null; });
  const caret = (pos) => { try { return view.coordsAtPos(pos, 1); } catch { return null; } };

  // ---- 2. walk the blocks and decide where each page ends ------------------------------------------------------
  const out = []; let off = 0; let k = 0; let lastBottom = 0;
  const limit = () => k * P + C;
  const pushBreak = (pos, effTop, extra = {}) => { const h = (k + 1) * P - effTop; out.push({ pos, h, k, ...extra }); off += h; k += 1; };
  for (let i = 0; i < items.length; i += 1) {
    const it = items[i]; const r = rects[i]; if (!r) continue;
    const top = Y(r.top) + off; const bottom = Y(r.bottom) + off; const side = { ml: (r.left - sr.left) / scale, mr: (sr.right - r.right) / scale }; // where the block sits inside the sheet: the spacer bleeds out to both page edges
    if (it.t === 'b') { // hard page break: what follows starts a new page (the break itself stays on the old page)
      while (top >= (k + 1) * P - EPS) k += 1;
      pushBreak(it.pos + it.node.nodeSize, bottom, side); lastBottom = (k) * P; continue;
    }
    while (top >= (k + 1) * P - EPS) k += 1; // an earlier oversized block already spilled into the next page
    if (bottom <= limit() + EPS) { lastBottom = bottom; continue; }
    if (it.t === 'r') {
      if (top <= k * P + EPS) { lastBottom = bottom; continue; } // taller than a page: let it run
      const table = doc.resolve(it.pos).parent; let cols = 1; try { cols = TableMap.get(table).width; } catch { /* keep 1 */ }
      pushBreak(it.pos, top, { cols, ...side }); lastBottom = bottom + out[out.length - 1].h; continue;
    }
    // a text block that crosses the end of the page: find the first line that does not fit
    const start = it.pos + 1; const end = it.pos + it.node.nodeSize - 1; let from = start; let guard = 0; let curOff = off;
    let bBottom = bottom;
    while (bBottom > limit() + EPS && guard < 40) {
      guard += 1;
      const lim = limit();
      const lineBottom = (pos) => { const c = caret(pos); return c ? Y(c.bottom) + curOff : -1; };
      const lineTop = (pos) => { const c = caret(pos); return c ? Y(c.top) + curOff : -1; };
      let q;
      if (end <= from || lineBottom(end) <= lim + EPS) break; // the rest fits (or the paragraph is empty)
      if (lineBottom(from) > lim + EPS) q = from; // even its first remaining line does not fit
      else { let lo = from; let hi = end; while (lo < hi) { const mid = (lo + hi) >> 1; if (lineBottom(mid) > lim + EPS) hi = mid; else lo = mid + 1; } q = lo; }
      // walk back to the first char of that line (mixed fonts can move the caret box inside one line)
      const tq = lineTop(q); if (tq < 0) break; { let lo = from; let hi = q; while (lo < hi) { const mid = (lo + hi) >> 1; if (lineTop(mid) >= tq - 3) hi = mid; else lo = mid + 1; } q = lo; }
      const effTop = q === start && guard === 1 ? top : lineTop(q);
      if (effTop <= k * P + EPS) { k += 1; break; } // it is already at the top of a page: nothing to gain, let it overflow
      const before = off; pushBreak(q, effTop, side); curOff += off - before; bBottom += off - before; from = q;
    }
    lastBottom = Y(r.bottom) + off;
  }
  dom.classList.remove('dx-nopg');

  const n = Math.max(1, Math.floor((Math.max(lastBottom, 0) - 1) / P) + 1);
  const sig = `${out.map((o) => `${o.pos}:${Math.round(o.h)}:${o.cols || 0}:${Math.round(o.ml)}:${Math.round(o.mr)}`).join('|')}#${n}#${Math.round(hz)}#${Math.round(fz)}#${Math.round(g.pageH)}#${g.ghost}#${opts.bands()}`;
  const set = out.map((o) => ({ ...o, n, hz, fz, hdPad: g.hdPad, ftPad: g.ftPad }));
  done(set, sig, n);
}

export const PageView = Extension.create({
  name: 'dxPageView',
  addOptions() { return { getGeom: () => ({ enabled: false }), onPages: null, onTooBig: null, bands: () => '', sheet: () => null }; },
  addProseMirrorPlugins() {
    const opts = this.options;
    return [new Plugin({
      key: pageKey,
      state: {
        init: () => ({ deco: DecorationSet.empty, sig: '' }),
        apply(tr, prev, _o, next) {
          const meta = tr.getMeta(pageKey);
          if (meta?.set) {
            const sheet = opts.sheet?.();
            const hdrEl = sheet?.querySelector('.dxp__hdr'); const ftrEl = sheet?.querySelector('.dxp__ftr');
            const g = opts.getGeom();
            const decos = meta.set.map((s, i) => Decoration.widget(s.pos, () => buildSpacer({ ...s, ghost: g.ghost }, g.ghost ? hdrEl : null, g.ghost ? ftrEl : null), { side: -1, key: `pg${i}-${meta.sig.length}-${Math.round(s.h)}-${s.n}-${s.cols || 0}-${Math.round(s.ml || 0)}-${g.ghost ? opts.bands() : ''}`, ignoreSelection: true, stopEvent: () => true }));
            return { deco: DecorationSet.create(next.doc, decos), sig: meta.sig };
          }
          return tr.docChanged ? { ...prev, deco: prev.deco.map(tr.mapping, tr.doc) } : prev;
        },
      },
      props: { decorations: (state) => pageKey.getState(state).deco },
      view(view) {
        let timer = 0;
        const run = () => { timer = 0; if (view.isDestroyed) return; if (view.composing) { timer = setTimeout(run, 400); return; } try { measure(view, opts); } catch (e) { view.dom.classList.remove('dx-nopg'); console.warn('[page view]', e); } };
        const schedule = (ms) => { clearTimeout(timer); timer = setTimeout(run, ms); };
        const typing = () => (view.state.doc.content.size > 200000 ? 500 : 180);
        const again = () => schedule(0);
        const onLoad = () => schedule(60);
        view.dom.addEventListener('dx-repage', again);
        view.dom.addEventListener('load', onLoad, true); // pictures finishing to load change the height
        document.fonts?.addEventListener?.('loadingdone', onLoad);
        schedule(60);
        return {
          update(v, prev) { if (v.state.doc !== prev.doc) schedule(typing()); },
          destroy() { clearTimeout(timer); view.dom.removeEventListener('dx-repage', again); view.dom.removeEventListener('load', onLoad, true); document.fonts?.removeEventListener?.('loadingdone', onLoad); },
        };
      },
    })];
  },
});

/** ask the page view to measure again now (page setup, zoom, header / footer, on / off) */
export const repage = (editor) => { try { editor?.view?.dom?.dispatchEvent(new Event('dx-repage')); } catch { /* editor gone */ } };
