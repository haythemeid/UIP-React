/**
 * "Professional" Excel templates: banner header, KPI cards, charts that read from small summary tables, gridlines off.
 * Same engine and builder as xlsxTemplates.js (real formulas, conditional formatting, charts). Yellow cells are inputs.
 */
import { SheetB, ST, C, merge, colName } from './xlsxBuilder.js';

const T = (ar) => (en, a) => (ar ? a : en);
const MON_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MON_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const months = (ar) => (ar ? MON_AR : MON_EN);
const q = (n) => `'${String(n).replace(/'/g, "''")}'`;

export const PRO_GROUP = { id: 'pro', label: { en: 'Professional', ar: 'احترافي' } };
export const PRO_CATALOG = [
  { id: 'pro-dashboard', group: 'pro', color: '#2563eb', label: { en: 'Sales dashboard', ar: 'لوحة مبيعات' }, hint: { en: 'KPI cards, trend vs target, product mix', ar: 'بطاقات مؤشرات واتجاه مقابل المستهدف' } },
  { id: 'pro-pnl', group: 'pro', color: '#0f766e', label: { en: 'Profit & loss (P&L)', ar: 'قائمة الدخل (P&L)' }, hint: { en: '12 months, margins, cost breakdown', ar: '١٢ شهر وهوامش وتوزيع التكاليف' } },
  { id: 'pro-cashflow', group: 'pro', color: '#0284c7', label: { en: 'Cash flow forecast', ar: 'توقع التدفق النقدي' }, hint: { en: 'Inflow / outflow and closing balance', ar: 'وارد / منصرف ورصيد ختامي' } },
  { id: 'pro-crm', group: 'pro', color: '#9333ea', label: { en: 'Sales pipeline (CRM)', ar: 'قمع المبيعات (CRM)' }, hint: { en: 'Stages, weighted value, win rate', ar: 'مراحل وقيمة مرجّحة ونسبة الفوز' } },
  { id: 'pro-okr', group: 'pro', color: '#e5484d', label: { en: 'OKR tracker', ar: 'متابعة OKR' }, hint: { en: 'Objectives, key results, progress', ar: 'أهداف ونتائج رئيسية وتقدم' } },
  { id: 'pro-breakeven', group: 'pro', color: '#ca8a04', label: { en: 'Break-even analysis', ar: 'تحليل نقطة التعادل' }, hint: { en: 'Units, revenue vs cost chart', ar: 'وحدات ورسم الإيراد مقابل التكلفة' } },
];

/** KPI card spanning 3 columns: label on top, big value below. */
function card(s, r, c, label, f, nf) {
  const lab = ST.kpiLabel; const val = merge(ST.kpiVal, { nf: nf || '#,##0' });
  for (let i = 0; i < 3; i += 1) { s.put(r, c + i, i ? '' : label, lab); s.put(r + 1, c + i, i ? '' : f, val); }
  s.merge(r, c, r, c + 2).merge(r + 1, c, r + 1, c + 2); s.h(r + 1, 40);
}
const sect = (s, r, c, text, w = 3) => { const st = { b: 1, color: C.navy, bd: { b: ['medium', C.blue] } }; for (let i = 0; i < w; i += 1) s.put(r, c + i, i ? '' : text, st); };

export const PRO_BUILDERS = {};

/* ------------------------------------------------------------------ Sales dashboard */
PRO_BUILDERS['pro-dashboard'] = (wb, ar) => {
  const t = T(ar); const M = months(ar); const dn = t('Data', 'البيانات'); const Q = q(dn);
  const prods = ar ? ['لابتوب', 'موبايل', 'تابلت', 'إكسسوار'] : ['Laptops', 'Phones', 'Tablets', 'Accessories'];
  const s = new SheetB(wb, t('Dashboard', 'اللوحة'));
  const d = new SheetB(wb, dn);
  d.head(0, 0, [t('Month', 'الشهر'), ...prods, t('Total', 'الإجمالي'), t('Target', 'المستهدف'), t('Achievement', 'التحقق')], 30);
  const base = [[180, 120, 60, 40], [190, 125, 62, 42], [210, 140, 70, 45], [205, 150, 66, 50], [230, 160, 75, 52], [250, 170, 80, 58], [240, 165, 78, 55], [260, 180, 85, 60], [275, 190, 90, 64], [300, 205, 96, 70], [330, 220, 104, 76], [360, 240, 112, 82]];
  M.forEach((m, i) => {
    const r = 1 + i; const x = r + 1; d.put(r, 0, m, ST.text);
    base[i].forEach((v, j) => d.put(r, 1 + j, v * 1000, ST.inputInt));
    d.put(r, 5, `=SUM(B${x}:E${x})`, merge(ST.int, { b: 1 })).put(r, 6, 340000 + i * 22000, ST.inputInt).put(r, 7, `=IFERROR(F${x}/G${x},"")`, ST.pct0);
  });
  d.cf('H2:H13', { kind: 'cell', op: 'ge', v1: 1, fmt: { bg: C.ok, color: C.okT } }).cf('H2:H13', { kind: 'cell', op: 'lt', v1: 0.9, fmt: { bg: C.bad, color: C.badT } });
  d.put(13, 0, t('Total', 'الإجمالي'), ST.total); for (let c = 1; c <= 6; c += 1) d.put(13, c, `=SUM(${colName(c)}2:${colName(c)}13)`, merge(ST.totalNum, { nf: '#,##0' })); d.put(13, 7, '=IFERROR(F14/G14,"")', merge(ST.total, { nf: '0%' }));
  d.w([90, 100, 100, 100, 100, 110, 110, 90]).freeze(1, 1); d.sh.noGrid = false;

  s.title(t('Sales dashboard', 'لوحة المبيعات'), t(`Edit the yellow cells in the "${dn}" sheet — cards and charts update.`, `عدّل الخلايا الصفراء في ورقة "${dn}" والبطاقات والرسوم بتتحدث.`), 14);
  card(s, 3, 0, t('Total revenue', 'إجمالي الإيراد'), `=${Q}!F14`, '#,##0');
  card(s, 3, 3, t('Target achievement', 'تحقق المستهدف'), `=${Q}!H14`, '0%');
  card(s, 3, 6, t('Best month', 'أفضل شهر'), `=INDEX(${Q}!A2:A13,MATCH(MAX(${Q}!F2:F13),${Q}!F2:F13,0))`, '@');
  card(s, 3, 9, t('Monthly average', 'متوسط الشهر'), `=AVERAGE(${Q}!F2:F13)`, '#,##0');
  sect(s, 6, 0, t('Monthly revenue vs target', 'الإيراد الشهري مقابل المستهدف'), 3); sect(s, 6, 4, t('Revenue by product', 'الإيراد حسب المنتج'), 2);
  s.head(7, 0, [t('Month', 'الشهر'), t('Revenue', 'الإيراد'), t('Target', 'المستهدف')], 24).head(7, 4, [t('Product', 'المنتج'), t('Revenue', 'الإيراد')], 24);
  M.forEach((m, i) => { const x = i + 2; s.put(8 + i, 0, m, ST.text).put(8 + i, 1, `=${Q}!F${x}`, ST.int).put(8 + i, 2, `=${Q}!G${x}`, ST.int); });
  prods.forEach((p, j) => s.put(8 + j, 4, p, ST.text).put(8 + j, 5, `=${Q}!${colName(1 + j)}14`, ST.int));
  s.cf('B9:B20', { kind: 'bar', color: '#638ec6' });
  s.w([84, 96, 96, 14, 100, 100, 14, 90, 90, 90, 90, 90, 90, 90]);
  s.chart('line', 'A8:C20', t('Revenue vs target', 'الإيراد مقابل المستهدف'), 21, 0, 560, 270);
  s.chart('donut', 'E8:F12', t('Product mix', 'توزيع المنتجات'), 21, 6, 400, 270);
  s.chart('col', 'A8:B20', t('Revenue by month', 'الإيراد لكل شهر'), 6, 7, 470, 250, { legend: false });
  wb.sheets.splice(wb.sheets.indexOf(s.sh), 1); wb.sheets.unshift(s.sh);
};

/* ------------------------------------------------------------------ P&L */
PRO_BUILDERS['pro-pnl'] = (wb, ar) => {
  const t = T(ar); const M = months(ar); const s = new SheetB(wb, t('P&L', 'قائمة الدخل'));
  s.title(t('Profit & loss statement', 'قائمة الدخل'), t('Yellow cells are inputs (12 months). Margins, tax and net profit are calculated.', 'الخلايا الصفراء مدخلات (١٢ شهر). الهوامش والضريبة وصافي الربح محسوبة.'), 14);
  s.head(3, 0, [t('Line item', 'البند'), ...M, t('Total', 'الإجمالي')], 28);
  let r = 4; const rows = {}; const grow = (i, a) => Math.round(a * (1 + i * 0.03));
  const group = (title) => { s.put(r, 0, title, merge(ST.label, { bg: C.soft })); for (let c = 1; c <= 13; c += 1) s.put(r, c, '', { bg: C.soft }); r += 1; };
  const line = (key, label, base) => { rows[key] = r; s.put(r, 0, label, ST.text); for (let i = 0; i < 12; i += 1) s.put(r, 1 + i, grow(i, base), ST.inputInt); s.put(r, 13, `=SUM(B${r + 1}:M${r + 1})`, merge(ST.int, { b: 1 })); r += 1; };
  const calc = (key, label, fn, st) => { rows[key] = r; s.put(r, 0, label, merge(st || ST.total, {})); for (let c = 1; c <= 13; c += 1) s.put(r, c, fn(colName(c)), merge(st ? ST.int : ST.totalNum, { nf: '#,##0', b: 1, ...(st ? {} : {}) })); r += 1; };
  group(t('Revenue', 'الإيرادات')); line('r1', t('Product sales', 'مبيعات المنتجات'), 120000); line('r2', t('Services', 'الخدمات'), 45000); line('r3', t('Other income', 'إيرادات أخرى'), 8000);
  calc('rev', t('Total revenue', 'إجمالي الإيرادات'), (L) => `=SUM(${L}${rows.r1 + 1}:${L}${rows.r3 + 1})`);
  group(t('Cost of goods sold', 'تكلفة المبيعات')); line('c1', t('Materials', 'مواد'), 52000); line('c2', t('Direct labour', 'عمالة مباشرة'), 24000);
  calc('cogs', t('Total COGS', 'إجمالي التكلفة'), (L) => `=SUM(${L}${rows.c1 + 1}:${L}${rows.c2 + 1})`);
  calc('gp', t('Gross profit', 'مجمل الربح'), (L) => `=${L}${rows.rev + 1}-${L}${rows.cogs + 1}`);
  group(t('Operating expenses', 'المصروفات التشغيلية')); line('o1', t('Salaries', 'رواتب'), 38000); line('o2', t('Rent', 'إيجار'), 12000); line('o3', t('Marketing', 'تسويق'), 9000); line('o4', t('Other', 'أخرى'), 6000);
  calc('opex', t('Total opex', 'إجمالي المصروفات'), (L) => `=SUM(${L}${rows.o1 + 1}:${L}${rows.o4 + 1})`);
  calc('ebit', t('Operating profit (EBIT)', 'الربح التشغيلي'), (L) => `=${L}${rows.gp + 1}-${L}${rows.opex + 1}`);
  s.put(r, 0, t('Tax rate', 'نسبة الضريبة'), ST.text).put(r, 1, 0.225, ST.inputPct); const taxCell = `$B$${r + 1}`; r += 1;
  calc('net', t('Net profit', 'صافي الربح'), (L) => `=${L}${rows.ebit + 1}-MAX(0,${L}${rows.ebit + 1})*${taxCell}`);
  rows.gm = r; s.put(r, 0, t('Gross margin', 'هامش الربح الإجمالي'), ST.text); for (let c = 1; c <= 13; c += 1) s.put(r, c, `=IFERROR(${colName(c)}${rows.gp + 1}/${colName(c)}${rows.rev + 1},"")`, ST.pct); r += 1;
  s.put(r, 0, t('Net margin', 'هامش صافي الربح'), ST.text); for (let c = 1; c <= 13; c += 1) s.put(r, c, `=IFERROR(${colName(c)}${rows.net + 1}/${colName(c)}${rows.rev + 1},"")`, ST.pct); r += 1;
  s.cf(`B${rows.net + 1}:N${rows.net + 1}`, { kind: 'cell', op: 'lt', v1: 0, fmt: { bg: C.bad, color: C.badT } });
  // chart sources
  r += 1; const sr = r; s.head(sr, 0, [t('Summary', 'ملخص'), ...M], 24);
  [[t('Revenue', 'الإيرادات'), 'rev'], [t('Gross profit', 'مجمل الربح'), 'gp'], [t('Net profit', 'صافي الربح'), 'net']].forEach(([lb, k], i) => { s.put(sr + 1 + i, 0, lb, ST.text); for (let c = 1; c <= 12; c += 1) s.put(sr + 1 + i, c, `=${colName(c)}${rows[k] + 1}`, ST.int); });
  const cr = sr + 6; s.head(cr, 0, [t('Cost breakdown', 'توزيع التكاليف'), t('Total', 'الإجمالي')], 24);
  [[t('Materials', 'مواد'), 'c1'], [t('Direct labour', 'عمالة مباشرة'), 'c2'], [t('Salaries', 'رواتب'), 'o1'], [t('Rent', 'إيجار'), 'o2'], [t('Marketing', 'تسويق'), 'o3'], [t('Other', 'أخرى'), 'o4']].forEach(([lb, k], i) => s.put(cr + 1 + i, 0, lb, ST.text).put(cr + 1 + i, 1, `=N${rows[k] + 1}`, ST.int));
  s.w([190, ...Array(12).fill(80), 100]).freeze(4, 1);
  s.chart('col', `A${sr + 1}:M${sr + 4}`, t('Revenue, gross and net profit by month', 'الإيراد ومجمل وصافي الربح شهريًا'), sr + 1, 8, 700, 290, { byRow: true });
  s.chart('donut', `A${cr + 1}:B${cr + 7}`, t('Where the money goes', 'فين بتروح الفلوس'), cr + 1, 3, 400, 270);
};

/* ------------------------------------------------------------------ Cash flow */
PRO_BUILDERS['pro-cashflow'] = (wb, ar) => {
  const t = T(ar); const M = months(ar); const s = new SheetB(wb, t('Cash flow', 'التدفق النقدي'));
  s.title(t('Cash flow forecast', 'توقع التدفق النقدي'), t('Enter the opening balance and monthly inflows / outflows. Negative closing balances turn red.', 'اكتب الرصيد الافتتاحي والوارد والمنصرف شهريًا. الرصيد السالب بيحمر.'), 14);
  s.put(3, 0, t('Opening balance', 'الرصيد الافتتاحي'), ST.label).put(3, 1, 150000, ST.inputInt);
  s.head(5, 0, [t('Line item', 'البند'), ...M, t('Total', 'الإجمالي')], 28);
  let r = 6; const rows = {};
  const sec = (title) => { s.put(r, 0, title, merge(ST.label, { bg: C.soft })); for (let c = 1; c <= 13; c += 1) s.put(r, c, '', { bg: C.soft }); r += 1; };
  const line = (key, label, base, g) => { rows[key] = r; s.put(r, 0, label, ST.text); for (let i = 0; i < 12; i += 1) s.put(r, 1 + i, Math.round(base * (1 + i * g)), ST.inputInt); s.put(r, 13, `=SUM(B${r + 1}:M${r + 1})`, merge(ST.int, { b: 1 })); r += 1; };
  const tot = (key, label, fn) => { rows[key] = r; s.put(r, 0, label, ST.total); for (let c = 1; c <= 13; c += 1) s.put(r, c, fn(colName(c), c), merge(ST.totalNum, { nf: '#,##0' })); r += 1; };
  sec(t('Cash in', 'الوارد')); line('i1', t('Customer receipts', 'تحصيلات العملاء'), 90000, 0.04); line('i2', t('Other income', 'إيرادات أخرى'), 6000, 0.02);
  tot('in', t('Total inflow', 'إجمالي الوارد'), (L) => `=SUM(${L}${rows.i1 + 1}:${L}${rows.i2 + 1})`);
  sec(t('Cash out', 'المنصرف')); line('o1', t('Payroll', 'رواتب'), 35000, 0.01); line('o2', t('Rent & utilities', 'إيجار ومرافق'), 11000, 0); line('o3', t('Suppliers', 'موردين'), 28000, 0.03); line('o4', t('Other', 'أخرى'), 7000, 0.02);
  tot('out', t('Total outflow', 'إجمالي المنصرف'), (L) => `=SUM(${L}${rows.o1 + 1}:${L}${rows.o4 + 1})`);
  tot('net', t('Net cash flow', 'صافي التدفق'), (L) => `=${L}${rows.in + 1}-${L}${rows.out + 1}`);
  rows.close = r; s.put(r, 0, t('Closing balance', 'الرصيد الختامي'), ST.kpiLabel); for (let c = 1; c <= 12; c += 1) s.put(r, c, c === 1 ? `=B4+B${rows.net + 1}` : `=${colName(c - 1)}${r + 1}+${colName(c)}${rows.net + 1}`, merge(ST.kpiVal, { fs: 11, nf: '#,##0' })); s.put(r, 13, `=M${r + 1}`, merge(ST.kpiVal, { fs: 11, nf: '#,##0' }));
  s.cf(`B${r + 1}:N${r + 1}`, { kind: 'cell', op: 'lt', v1: 0, fmt: { bg: C.bad, color: C.badT } }); s.cf(`B${rows.net + 1}:M${rows.net + 1}`, { kind: 'cell', op: 'lt', v1: 0, fmt: { color: '#C00000', b: 1 } });
  r += 2; const sr = r; s.head(sr, 0, [t('Summary', 'ملخص'), ...M], 24);
  [[t('Inflow', 'الوارد'), 'in'], [t('Outflow', 'المنصرف'), 'out']].forEach(([lb, k], i) => { s.put(sr + 1 + i, 0, lb, ST.text); for (let c = 1; c <= 12; c += 1) s.put(sr + 1 + i, c, `=${colName(c)}${rows[k] + 1}`, ST.int); });
  s.head(sr + 4, 0, [t('Closing balance', 'الرصيد الختامي'), ...M], 24); s.put(sr + 5, 0, t('Balance', 'الرصيد'), ST.text); for (let c = 1; c <= 12; c += 1) s.put(sr + 5, c, `=${colName(c)}${rows.close + 1}`, ST.int);
  s.w([190, ...Array(12).fill(80), 100]).freeze(6, 1);
  s.chart('col', `A${sr + 1}:M${sr + 3}`, t('Inflow vs outflow', 'الوارد مقابل المنصرف'), sr + 7, 0, 560, 280, { byRow: true });
  s.chart('line', `A${sr + 5}:M${sr + 6}`, t('Closing balance', 'الرصيد الختامي'), sr + 7, 7, 560, 280, { byRow: true, legend: false });
};

/* ------------------------------------------------------------------ CRM pipeline */
PRO_BUILDERS['pro-crm'] = (wb, ar) => {
  const t = T(ar); const s = new SheetB(wb, t('Pipeline', 'القمع'));
  const st = ar ? ['عميل محتمل', 'مؤهل', 'عرض سعر', 'تفاوض', 'تم الفوز', 'خسارة'] : ['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'];
  const pr = [0.1, 0.3, 0.5, 0.75, 1, 0];
  s.title(t('Sales pipeline', 'قمع المبيعات'), t('Pick a stage for each deal; probability and weighted value are automatic. Edit stage probabilities on the right.', 'اختر مرحلة كل صفقة والاحتمال والقيمة المرجّحة تلقائي. عدّل الاحتمالات من اليمين.'), 14);
  card(s, 3, 0, t('Open pipeline', 'القيمة المفتوحة'), '=SUMIFS(E8:E37,D8:D37,"<>"&$K$12,D8:D37,"<>"&$K$13)', '#,##0');
  card(s, 3, 3, t('Weighted forecast', 'التوقع المرجّح'), '=SUM(G8:G37)', '#,##0');
  card(s, 3, 6, t('Won value', 'قيمة الفوز'), '=SUMIFS(E8:E37,D8:D37,$K$12)', '#,##0');
  card(s, 3, 9, t('Win rate', 'نسبة الفوز'), '=IFERROR(COUNTIF(D8:D37,$K$12)/(COUNTIF(D8:D37,$K$12)+COUNTIF(D8:D37,$K$13)),"")', '0%');
  s.head(6, 0, ['#', t('Deal', 'الصفقة'), t('Client', 'العميل'), t('Stage', 'المرحلة'), t('Value', 'القيمة'), t('Probability', 'الاحتمال'), t('Weighted', 'مرجّح'), t('Owner', 'المسؤول'), t('Close date', 'تاريخ الإغلاق')], 30);
  const deals = [['Portal redesign', 'Nile Tech', 3, 85000, 'Sara'], ['ERP rollout', 'Delta Foods', 2, 240000, 'Ahmed'], ['Mobile app', 'Cairo Bank', 4, 160000, 'Omar'], ['Support plan', 'Alpha Co', 1, 40000, 'Mona'], ['Data platform', 'Pyramids Ltd', 0, 120000, 'Ali'], ['Training', 'Sky Edu', 4, 30000, 'Sara'], ['Website', 'Oasis', 5, 25000, 'Omar'], ['Analytics', 'Delta Foods', 3, 70000, 'Mona']];
  const dealsAr = ['إعادة تصميم البوابة', 'تطبيق ERP', 'تطبيق موبايل', 'خطة دعم', 'منصة بيانات', 'تدريب', 'موقع إلكتروني', 'تحليلات'];
  for (let i = 0; i < 30; i += 1) {
    const r = 7 + i; const x = r + 1; const d = deals[i];
    s.put(r, 0, i + 1, ST.center).put(r, 1, d ? (ar ? dealsAr[i] : d[0]) : '', ST.input).put(r, 2, d ? d[1] : '', ST.input).put(r, 3, d ? st[d[2]] : '', merge(ST.input, { al: 'center' })).put(r, 4, d ? d[3] : '', ST.inputInt);
    s.put(r, 5, `=IFERROR(VLOOKUP(D${x},$K$8:$L$13,2,FALSE),"")`, merge(ST.pct0, { al: 'center' })).put(r, 6, `=IF(OR(E${x}="",F${x}=""),"",E${x}*F${x})`, ST.int).put(r, 7, d ? d[4] : '', ST.input).put(r, 8, '', merge(ST.input, { al: 'center' }));
  }
  s.cf('D8:D37', { kind: 'cell', op: 'eq', v1: st[4], fmt: { bg: C.ok, color: C.okT, b: 1 } }).cf('D8:D37', { kind: 'cell', op: 'eq', v1: st[5], fmt: { bg: C.bad, color: C.badT } }).cf('G8:G37', { kind: 'bar', color: '#a55fa7' });
  s.head(6, 10, [t('Stage', 'المرحلة'), t('Probability', 'الاحتمال')], 30);
  st.forEach((x, i) => s.put(7 + i, 10, x, ST.text).put(7 + i, 11, pr[i], merge(ST.inputPct, { nf: '0%', al: 'center' })));
  s.head(15, 10, [t('Stage', 'المرحلة'), t('Deals', 'الصفقات'), t('Value', 'القيمة')], 26);
  st.forEach((x, i) => s.put(16 + i, 10, x, ST.text).put(16 + i, 11, `=COUNTIF($D$8:$D$37,K${17 + i})`, merge(ST.int, { al: 'center' })).put(16 + i, 12, `=SUMIFS($E$8:$E$37,$D$8:$D$37,K${17 + i})`, ST.int));
  s.w([30, 150, 120, 100, 100, 80, 100, 90, 90, 14, 110, 80, 100]).freeze(7, 2);
  s.chart('col', 'K16:M22', t('Pipeline by stage', 'القيمة حسب المرحلة'), 24, 10, 480, 270, {});
  s.chart('donut', 'K16:L22', t('Deals by stage', 'الصفقات حسب المرحلة'), 24, 1, 400, 270);
};

/* ------------------------------------------------------------------ OKR */
PRO_BUILDERS['pro-okr'] = (wb, ar) => {
  const t = T(ar); const s = new SheetB(wb, t('OKR', 'OKR'));
  s.title(t('OKR tracker', 'متابعة الأهداف (OKR)'), t('Each key result: start, target and current value. Progress and status are calculated.', 'لكل نتيجة رئيسية: البداية والمستهدف والحالي. التقدم والحالة تلقائيين.'), 11);
  const O = ar ? ['زيادة الإيرادات', 'تحسين رضا العملاء', 'رفع كفاءة التشغيل'] : ['Grow revenue', 'Delight customers', 'Improve operations'];
  const krs = [[0, ar ? 'إيراد شهري (ألف)' : 'Monthly revenue (k)', 100, 150, 128], [0, ar ? 'عملاء جدد' : 'New customers', 0, 60, 41], [1, ar ? 'NPS' : 'NPS', 30, 55, 48], [1, ar ? 'زمن الرد (ساعة)' : 'Response time (h)', 24, 4, 9], [2, ar ? 'نسبة الأتمتة %' : 'Automation %', 10, 60, 22], [2, ar ? 'أخطاء شهرية' : 'Monthly errors', 40, 10, 31]];
  s.head(3, 0, ['#', t('Objective', 'الهدف'), t('Key result', 'النتيجة الرئيسية'), t('Start', 'البداية'), t('Target', 'المستهدف'), t('Current', 'الحالي'), t('Progress', 'التقدم'), t('Status', 'الحالة'), t('Owner', 'المسؤول')], 30);
  for (let i = 0; i < 18; i += 1) {
    const r = 4 + i; const x = r + 1; const k = krs[i];
    s.put(r, 0, i + 1, ST.center).put(r, 1, k ? O[k[0]] : '', ST.input).put(r, 2, k ? k[1] : '', ST.input).put(r, 3, k ? k[2] : '', ST.inputNum).put(r, 4, k ? k[3] : '', ST.inputNum).put(r, 5, k ? k[4] : '', ST.inputNum);
    s.put(r, 6, `=IF(OR(D${x}="",E${x}="",F${x}="",E${x}=D${x}),"",MAX(0,MIN(1,(F${x}-D${x})/(E${x}-D${x}))))`, merge(ST.pct0, { al: 'center' }));
    s.put(r, 7, `=IF(G${x}="","",IF(G${x}>=0.7,"${t('On track', 'ماشي كويس')}",IF(G${x}>=0.4,"${t('At risk', 'في خطر')}","${t('Off track', 'متأخر')}")))`, merge(ST.center, { b: 1 })).put(r, 8, '', ST.input);
  }
  s.cf('G5:G22', { kind: 'bar', color: '#63c384' }).cf('H5:H22', { kind: 'cell', op: 'eq', v1: t('On track', 'ماشي كويس'), fmt: { bg: C.ok, color: C.okT } }).cf('H5:H22', { kind: 'cell', op: 'eq', v1: t('At risk', 'في خطر'), fmt: { bg: C.warn, color: C.warnT } }).cf('H5:H22', { kind: 'cell', op: 'eq', v1: t('Off track', 'متأخر'), fmt: { bg: C.bad, color: C.badT } });
  s.head(3, 10, [t('Objective', 'الهدف'), t('Progress', 'التقدم')], 30);
  O.forEach((o, i) => s.put(4 + i, 10, o, ST.input).put(4 + i, 11, `=IFERROR(AVERAGEIF($B$5:$B$22,K${5 + i},$G$5:$G$22),"")`, merge(ST.pct0, { al: 'center', b: 1 })));
  s.put(8, 10, t('Overall', 'الإجمالي'), ST.kpiLabel).put(8, 11, '=IFERROR(AVERAGE(G5:G22),"")', merge(ST.kpiVal, { nf: '0%' }));
  s.w([30, 160, 190, 70, 80, 80, 90, 100, 90, 14, 160, 90]).freeze(4, 0);
  s.chart('bar', 'K4:L7', t('Progress by objective', 'التقدم حسب الهدف'), 10, 10, 460, 250, { legend: false });
};

/* ------------------------------------------------------------------ Break-even */
PRO_BUILDERS['pro-breakeven'] = (wb, ar) => {
  const t = T(ar); const s = new SheetB(wb, t('Break-even', 'التعادل'));
  s.title(t('Break-even analysis', 'تحليل نقطة التعادل'), t('Change the yellow inputs; the break-even point, margin of safety and chart update.', 'غيّر المدخلات الصفراء ونقطة التعادل وهامش الأمان والرسم بيتحدثوا.'), 9);
  s.put(3, 0, t('Selling price per unit', 'سعر بيع الوحدة'), ST.label).put(3, 1, 250, ST.inputNum);
  s.put(4, 0, t('Variable cost per unit', 'التكلفة المتغيرة للوحدة'), ST.label).put(4, 1, 140, ST.inputNum);
  s.put(5, 0, t('Fixed costs (period)', 'التكاليف الثابتة (الفترة)'), ST.label).put(5, 1, 66000, ST.inputInt);
  s.put(6, 0, t('Expected units', 'الوحدات المتوقعة'), ST.label).put(6, 1, 800, ST.inputInt);
  s.put(7, 0, t('Chart step (units)', 'خطوة الرسم (وحدات)'), ST.label).put(7, 1, 100, ST.inputInt);
  card(s, 3, 3, t('Break-even units', 'وحدات التعادل'), '=IFERROR(ROUNDUP(B6/(B4-B5),0),"")', '#,##0');
  card(s, 3, 6, t('Break-even revenue', 'إيراد التعادل'), '=IFERROR(D5*B4,"")', '#,##0');
  s.put(6, 3, t('Contribution margin', 'هامش المساهمة'), ST.kpiLabel).put(6, 4, '', ST.kpiLabel).put(6, 5, '', ST.kpiLabel).merge(6, 3, 6, 5); s.put(7, 3, '=IFERROR((B4-B5)/B4,"")', merge(ST.kpiVal, { nf: '0.0%' })).put(7, 4, '', ST.kpiVal).put(7, 5, '', ST.kpiVal).merge(7, 3, 7, 5);
  s.put(6, 6, t('Expected profit', 'الربح المتوقع'), ST.kpiLabel).put(6, 7, '', ST.kpiLabel).put(6, 8, '', ST.kpiLabel).merge(6, 6, 6, 8); s.put(7, 6, '=B7*(B4-B5)-B6', merge(ST.kpiVal, { nf: '#,##0' })).put(7, 7, '', ST.kpiVal).put(7, 8, '', ST.kpiVal).merge(7, 6, 7, 8);
  s.cf('G8', { kind: 'cell', op: 'lt', v1: 0, fmt: { bg: C.bad, color: C.badT } });
  s.head(9, 0, [t('Units', 'الوحدات'), t('Revenue', 'الإيراد'), t('Total cost', 'التكلفة الكلية'), t('Profit', 'الربح')], 28);
  for (let i = 0; i <= 14; i += 1) {
    const r = 10 + i; const x = r + 1; const u = `${i}*$B$8`;
    s.put(r, 0, `=TEXT(${u},"0")`, ST.center).put(r, 1, `=${u}*$B$4`, ST.int).put(r, 2, `=$B$6+${u}*$B$5`, ST.int).put(r, 3, `=B${x}-C${x}`, ST.int);
  }
  s.cf('D11:D25', { kind: 'cell', op: 'lt', v1: 0, fmt: { color: '#C00000' } }).cf('D11:D25', { kind: 'cell', op: 'gt', v1: 0, fmt: { color: C.okT, b: 1 } });
  s.w([190, 110, 110, 110, 24, 24, 110, 24, 24]);
  s.chart('line', 'A10:C25', t('Revenue vs total cost', 'الإيراد مقابل التكلفة الكلية'), 9, 4, 520, 300, {});
};
