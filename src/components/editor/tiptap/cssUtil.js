/** Tiny inline-CSS helpers: block / span styles are kept as the raw `style` string so the .docx writer sees exactly what the reader produced. */
export const parseStyle = (s) => {
  const o = {};
  String(s || '').split(';').forEach((d) => { const i = d.indexOf(':'); if (i > 0) o[d.slice(0, i).trim().toLowerCase()] = d.slice(i + 1).trim(); });
  return o;
};
export const styleStr = (o) => Object.entries(o).filter(([, v]) => v !== null && v !== undefined && v !== '').map(([k, v]) => `${k}:${v}`).join(';');
/** props: { 'font-size': '12pt', color: null } — a null / '' value removes the property. Returns null when nothing is left. */
export const mergeStyle = (s, props) => { const o = parseStyle(s); Object.entries(props).forEach(([k, v]) => { if (v === null || v === undefined || v === '') delete o[k]; else o[k] = v; }); return styleStr(o) || null; };
export const ptOf = (v) => { const m = /^(-?[\d.]+)(pt|px)$/.exec(v || ''); return m ? (m[2] === 'px' ? Number(m[1]) * 0.75 : Number(m[1])) : null; };
export const isBlankHtml = (h) => !h || (!/<(img|table|hr)|data-fld/i.test(h) && !h.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim());
