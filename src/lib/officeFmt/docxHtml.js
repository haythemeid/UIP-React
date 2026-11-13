/** Tiny HTML builders for templates / blocks (the exact shape the editor and the .docx writer understand). Use them in your own template packs. */
export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export const today = (ar) => new Date().toLocaleDateString(ar ? 'ar-EG' : 'en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
export const C = { navy: '#1F3864', blue: '#2F5496', grey: '#595959', soft: '#E8EEF9', line: '#8EAADB', green: '#15803d', amber: '#b45309', red: '#b91c1c', gold: '#b8891a' };
export const p = (t = '', st = '') => `<p${st ? ` style="${st}"` : ''}>${t}</p>`;
export const sp = (t, st) => `<span style="${st}">${t}</span>`;
export const b = (t) => sp(t, 'font-weight:bold');
export const big = (t, size, color = C.navy, extra = '') => sp(t, `font-size:${size}pt;font-weight:bold;color:${color};${extra}`);
export const h1 = (t, c = C.navy) => `<h1 style="color:${c}">${t}</h1>`;
export const h2 = (t, c = C.blue) => `<h2 style="color:${c}">${t}</h2>`;
export const h3 = (t, c = C.navy) => `<h3 style="color:${c}">${t}</h3>`;
export const ul = (...a) => `<ul>${a.map((x) => `<li>${x}</li>`).join('')}</ul>`;
export const ol = (...a) => `<ol>${a.map((x) => `<li>${x}</li>`).join('')}</ol>`;
export const rule = (c = C.navy, w = '1.5pt') => `<p style="border-bottom:${w} solid ${c};margin-bottom:8pt"></p>`;
export const gap = (n = 1) => p('', 'margin-bottom:0').repeat(n);
export const PB = '<hr data-pb="1">';
export const td = (t = '', st = '') => `<td${st ? ` style="${st}"` : ''}>${t.startsWith('<p') || t.startsWith('<h') || t.startsWith('<ul') ? t : p(t)}</td>`;
export const row = (...cells) => `<tr>${cells.join('')}</tr>`;
/** table without borders (layout) */
export const grid = (...rows) => `<table data-b="none"><tbody>${rows.join('')}</tbody></table>`;
export const table = (...rows) => `<table><tbody>${rows.join('')}</tbody></table>`;
export const banner = (t, bg = C.navy, size = 24, color = '#FFFFFF') => grid(row(td(p(sp(t, `color:${color};font-size:${size}pt;font-weight:bold`), 'text-align:center;margin-top:10pt;margin-bottom:10pt'), `background-color:${bg}`)));
export const callout = (title, body, c = C.blue, bg = C.soft) => grid(row(td(p(sp(title, `color:${c};font-weight:bold`)) + p(body), `background-color:${bg};border-left:3pt solid ${c}`)));
export const kv = (pairs, cols = 2, bg = C.soft) => {
  const rows = []; for (let i = 0; i < pairs.length; i += cols) rows.push(row(...pairs.slice(i, i + cols).flatMap(([k, v]) => [td(sp(k, `color:${C.blue};font-weight:bold`), `background-color:${bg};width:${Math.round(50 / cols / 1.4)}%`), td(v || '..................', `width:${Math.round(50 / cols - 50 / cols / 1.4)}%`)])));
  return table(...rows);
};
export const sign = (...names) => grid(row(...names.map((n) => td(`<br><br>..............................<br>${b(n)}`, 'text-align:center'))));
export const th = (t, bg = C.navy) => `<th style="background-color:${bg};text-align:center">${p(sp(t, 'color:#FFFFFF;font-weight:bold'), 'text-align:center')}</th>`;
export const head = (...cols) => `<tr>${cols.map((c) => th(c)).join('')}</tr>`;
export const blank = (n, cols) => Array.from({ length: n }, () => row(...Array.from({ length: cols }, () => td()))).join('');
export const pick = (ar) => (en, arabic) => (ar ? arabic : en);
