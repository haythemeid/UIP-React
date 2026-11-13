/**
 * Tiny authoring layer on top of the sheet engine (lib/sheet) used by the Excel templates:
 * real formulas, number formats, conditional formatting, charts, merges, frozen panes — written to .xlsx by writeXlsx().
 * Rows / columns are 0-based like the engine.
 */
import { Workbook } from '../sheet/workbook.js';
import { addr, colName, parseRange } from '../sheet/addr.js';

export { addr, colName };
export const DEF_W = 80; export const DEF_H = 24;
export const C = { navy: '#1F3864', blue: '#2F5496', soft: '#E8EEF9', grey: '#F2F2F2', line: '#BFC9DA', input: '#FFF8E1', ok: '#C6EFCE', okT: '#006100', bad: '#FFC7CE', badT: '#9C0006', warn: '#FFEB9C', warnT: '#9C5700', white: '#FFFFFF', ink: '#595959' };
export const bd = (c = C.line, w = 'thin') => ({ t: [w, c], b: [w, c], l: [w, c], r: [w, c] });
export const ST = {
  title: { b: 1, fs: 18, color: C.navy },
  sub: { color: C.ink, i: 1 },
  head: { b: 1, color: C.white, bg: C.navy, al: 'center', va: 'center', wrap: 1, bd: bd('#8EAADB') },
  cell: { bd: bd() },
  text: { bd: bd(), va: 'center' },
  wrapText: { bd: bd(), va: 'top', wrap: 1 },
  num: { bd: bd(), nf: '#,##0.00' },
  int: { bd: bd(), nf: '#,##0' },
  pct: { bd: bd(), nf: '0.0%' },
  pct0: { bd: bd(), nf: '0%' },
  money: { bd: bd(), nf: '#,##0.00' },
  center: { bd: bd(), al: 'center' },
  input: { bd: bd('#E0B84C'), bg: C.input },
  inputNum: { bd: bd('#E0B84C'), bg: C.input, nf: '#,##0.00' },
  inputInt: { bd: bd('#E0B84C'), bg: C.input, nf: '#,##0' },
  inputPct: { bd: bd('#E0B84C'), bg: C.input, nf: '0.0%' },
  total: { b: 1, bg: C.soft, bd: { t: ['medium', C.navy], b: ['thin', C.line], l: ['thin', C.line], r: ['thin', C.line] } },
  totalNum: { b: 1, bg: C.soft, nf: '#,##0.00', bd: { t: ['medium', C.navy], b: ['thin', C.line], l: ['thin', C.line], r: ['thin', C.line] } },
  label: { b: 1, color: C.blue },
  kpiLabel: { b: 1, color: C.white, bg: C.blue, al: 'center', bd: bd('#8EAADB') },
  kpiVal: { b: 1, fs: 16, color: C.navy, bg: C.soft, al: 'center', va: 'center', bd: bd('#8EAADB') },
  note: { color: C.ink, i: 1, fs: 10 },
};
export const merge = (a, b) => ({ ...a, ...b });

let seq = 1;
export class SheetB {
  constructor(wb, name) { this.wb = wb; this.sh = wb.addSheet(name); this.name = name; }
  put(r, c, v, st) {
    const { wb, sh } = this;
    if (typeof v === 'string' && v[0] === '=' && v.length > 1) wb.setFormula(sh, r, c, v);
    else if (v !== null && v !== undefined && v !== '') wb.setValue(sh, r, c, v);
    if (st) wb.setStyle(sh, r, c, st);
    return this;
  }
  /** values across a row; st may be a style or (i) => style */
  row(r, c0, arr, st) { arr.forEach((v, i) => this.put(r, c0 + i, v, typeof st === 'function' ? st(i) : st)); return this; }
  fill(r1, c1, r2, c2, st) { for (let r = r1; r <= r2; r += 1) for (let c = c1; c <= c2; c += 1) this.wb.setStyle(this.sh, r, c, st); return this; }
  head(r, c0, labels, h = 34) { this.row(r, c0, labels, ST.head); this.sh.rowH.set(r, h); return this; }
  title(text, sub, cols = 8) {
    this.put(0, 0, text, ST.title); this.sh.rowH.set(0, 34); this.merge(0, 0, 0, cols - 1);
    if (sub) { this.put(1, 0, sub, ST.sub); this.merge(1, 0, 1, cols - 1); }
    return this;
  }
  w(arr, from = 0) { arr.forEach((x, i) => this.sh.colW.set(from + i, x)); return this; }
  h(r, px) { this.sh.rowH.set(r, px); return this; }
  merge(r1, c1, r2, c2) { this.sh.merges.push({ r1, c1, r2, c2 }); return this; }
  freeze(r, c = 0) { this.sh.freeze = { r, c }; return this; }
  filter(rng) { this.sh.filter = { rng: parseRange(rng), cols: {}, hidden: new Set() }; return this; }
  cf(rng, rule) { this.sh.cf.push({ id: `cf${seq++}`, rng: parseRange(rng), ...rule }); return this; }
  /** pixel position of a cell's top-left corner (for placing charts) */
  xOf(c) { let x = 0; for (let i = 0; i < c; i += 1) x += this.sh.colW.get(i) ?? DEF_W; return x; }
  yOf(r) { let y = 0; for (let i = 0; i < r; i += 1) y += this.sh.rowH.get(i) ?? DEF_H; return y; }
  chart(type, rng, title, atRow, atCol, w = 460, h = 280, extra = {}) {
    this.sh.charts.push({ id: `ch${seq++}`, type, rng: parseRange(rng), title, legend: true, x: this.xOf(atCol), y: this.yOf(atRow), w, h, ...extra });
    return this;
  }
}
export const newBook = () => new Workbook();
export const q = (name) => `'${String(name).replace(/'/g, "''")}'`;

/** small deterministic generator so sample data is the same on every machine */
export function rng(seed = 7) { let s = seed >>> 0; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }
