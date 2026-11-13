/**
 * Editor HTML -> the HTML shape lib/officeFmt/docx.js `htmlToDocx` expects (the shape the old contenteditable editor produced):
 *  - list items hold their text directly (no <p>); the paragraph's dir / style / data-st move to the <li>
 *  - tables lose <colgroup>; dragged column widths become % widths on the cells
 */
export function prepareForDocx(html) {
  const box = document.createElement('div'); box.innerHTML = html;
  box.querySelectorAll('li').forEach((li) => {
    const p = li.firstElementChild; if (!p || p.tagName !== 'P') return;
    ['dir', 'style', 'data-st'].forEach((a) => { if (p.getAttribute(a) && !li.getAttribute(a)) li.setAttribute(a, p.getAttribute(a)); });
    const kids = Array.from(p.childNodes); p.replaceWith(...kids);
    const sub = li.querySelector(':scope > ul, :scope > ol'); // extra paragraphs of the same item: join with a line break
    Array.from(li.children).filter((c) => c.tagName === 'P').forEach((q) => { const br = document.createElement('br'); const parts = Array.from(q.childNodes); if (sub) li.insertBefore(br, sub); else li.appendChild(br); parts.forEach((n) => (sub ? li.insertBefore(n, sub) : li.appendChild(n))); q.remove(); });
  });
  box.querySelectorAll('table').forEach((t) => {
    const cols = Array.from(t.querySelectorAll(':scope > colgroup > col')).map((c) => parseFloat(c.style.width) || parseFloat(c.getAttribute('width')) || 0);
    const rows = Array.from(t.querySelectorAll('tr')).filter((r) => r.closest('table') === t);
    const widths = cols.length && cols.every((w) => w > 0) ? cols : null;
    t.querySelectorAll(':scope > colgroup').forEach((c) => c.remove());
    rows.forEach((tr) => { let ci = 0; Array.from(tr.children).forEach((td) => {
      const span = parseInt(td.getAttribute('colspan'), 10) || 1;
      const cw = (td.getAttribute('colwidth') || '').split(',').map(Number).filter((n) => n > 0);
      if (widths && !/width\s*:/.test(td.getAttribute('style') || '')) { const total = widths.reduce((a, b) => a + b, 0); const w = widths.slice(ci, ci + span).reduce((a, b) => a + b, 0); td.style.width = `${Math.round((w / total) * 1000) / 10}%`; }
      else if (!widths && cw.length === span && !/width\s*:/.test(td.getAttribute('style') || '')) td.dataset.px = String(cw.reduce((a, b) => a + b, 0));
      td.removeAttribute('colwidth'); ci += span; }); });
    t.removeAttribute('style');
    // when only per-cell pixel widths exist, turn them into % of the widest row
    const px = Array.from(t.querySelectorAll('[data-px]')); if (px.length) { const total = Math.max(...rows.map((r) => Array.from(r.children).reduce((a, c) => a + (parseFloat(c.dataset.px) || 0), 0))) || 1; px.forEach((c) => { c.style.width = `${Math.round((parseFloat(c.dataset.px) / total) * 1000) / 10}%`; c.removeAttribute('data-px'); }); }
  });
  box.querySelectorAll('td,th').forEach((td) => td.removeAttribute('colwidth'));
  box.querySelectorAll('.dxpg').forEach((n) => n.remove());
  return box;
}

/** An empty paragraph from the reader is <p><br></p>; in the editor it is simply an empty paragraph (a real <br> would add a second line on export). */
export const normalizeIncoming = (html) => String(html || '').replace(/<p((?:\s[^>]*)?)>\s*<br\s*\/?>\s*<\/p>/gi, '<p$1></p>').replace(/<(td|th|li)((?:\s[^>]*)?)>\s*<br\s*\/?>\s*<\/\1>/gi, '<$1$2></$1>');
