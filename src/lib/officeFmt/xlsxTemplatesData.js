/** Data-analysis Excel templates (sample data included so every table and chart works the moment the file opens). */
import { SheetB, ST, C, merge, colName, q, rng } from './xlsxBuilder.js';

const T = (ar) => (en, a) => (ar ? a : en);
const pad = (n) => String(n).padStart(2, '0');

export const DATA_CATALOG = [
  { id: 'da-sales', group: 'data', color: '#2563eb', label: { en: 'Sales data analysis', ar: 'تحليل بيانات المبيعات' }, hint: { en: 'Dataset + KPIs, region / product / rep tables, charts', ar: 'بيانات + مؤشرات وجداول وتحليلات ورسوم' } },
  { id: 'da-stats', group: 'data', color: '#7c3aed', label: { en: 'Descriptive statistics', ar: 'الإحصاء الوصفي' }, hint: { en: 'Mean, median, SD, quartiles, histogram', ar: 'متوسط ووسيط وانحراف ومئينات ومدرج' } },
  { id: 'da-survey', group: 'data', color: '#0d9488', label: { en: 'Survey analysis', ar: 'تحليل استبيان' }, hint: { en: 'Likert scores, % agree, distribution', ar: 'مقياس ليكرت ونسب الموافقة والتوزيع' } },
  { id: 'da-regression', group: 'data', color: '#e5484d', label: { en: 'Correlation & regression', ar: 'الارتباط والانحدار' }, hint: { en: 'R², slope, forecast, scatter chart', ar: 'R² وميل وتنبؤ ورسم انتشار' } },
  { id: 'da-ab', group: 'data', color: '#ea580c', label: { en: 'A/B test analysis', ar: 'تحليل اختبار A/B' }, hint: { en: 'Conversion lift and significance', ar: 'فرق التحويل ودلالة إحصائية' } },
  { id: 'da-pareto', group: 'data', color: '#ca8a04', label: { en: 'Pareto / ABC analysis', ar: 'تحليل باريتو / ABC' }, hint: { en: 'Cumulative %, A / B / C classes', ar: 'نسبة تراكمية وفئات A/B/C' } },
  { id: 'da-forecast', group: 'data', color: '#0284c7', label: { en: 'Sales forecast (trend)', ar: 'توقع المبيعات (اتجاه)' }, hint: { en: 'Linear trend + moving average', ar: 'اتجاه خطي ومتوسط متحرك' } },
  { id: 'da-finance', group: 'data', color: '#475569', label: { en: 'Financial ratio analysis', ar: 'تحليل النسب المالية' }, hint: { en: 'Liquidity, leverage, profitability', ar: 'سيولة ومديونية وربحية' } },
];

export const DATA_BUILDERS = {};

DATA_BUILDERS['da-sales'] = (wb, ar) => {
  const t = T(ar); const dn = t('Data', 'البيانات'); const sn = t('Summary', 'الملخص'); const N = 80; const L = N + 1;
  const regions = ar ? ['الشمال', 'الجنوب', 'الشرق', 'الغرب'] : ['North', 'South', 'East', 'West'];
  const prods = ar ? ['لابتوب', 'موبايل', 'تابلت', 'شاشة'] : ['Laptop', 'Phone', 'Tablet', 'Monitor'];
  const reps = ar ? ['أحمد', 'سارة', 'عمر', 'منى', 'علي'] : ['Ahmed', 'Sara', 'Omar', 'Mona', 'Ali'];
  const price = [18000, 12000, 8000, 5000]; const cost = [0.74, 0.7, 0.72, 0.78];
  const d = new SheetB(wb, dn); const r0 = rng(21);
  d.head(0, 0, [t('Date', 'التاريخ'), t('Month', 'الشهر'), t('Region', 'المنطقة'), t('Product', 'المنتج'), t('Sales rep', 'المندوب'), t('Units', 'الوحدات'), t('Unit price', 'سعر الوحدة'), t('Unit cost', 'تكلفة الوحدة'), t('Revenue', 'الإيراد'), t('Profit', 'الربح'), t('Margin', 'الهامش')]);
  for (let i = 0; i < N; i += 1) {
    const r = 1 + i; const x = r + 1; const m = 1 + Math.floor(r0() * 12); const pi = Math.floor(r0() * 4);
    d.put(r, 0, `2026-${pad(m)}-${pad(1 + Math.floor(r0() * 28))}`, ST.input).put(r, 1, `=VALUE(MID(A${x},6,2))`, merge(ST.center, {})).put(r, 2, regions[Math.floor(r0() * 4)], ST.input).put(r, 3, prods[pi], ST.input).put(r, 4, reps[Math.floor(r0() * 5)], ST.input);
    d.put(r, 5, 1 + Math.floor(r0() * 9), ST.inputInt).put(r, 6, Math.round(price[pi] * (0.92 + r0() * 0.16)), ST.inputInt).put(r, 7, Math.round(price[pi] * cost[pi]), ST.inputInt);
    d.put(r, 8, `=F${x}*G${x}`, ST.int).put(r, 9, `=F${x}*(G${x}-H${x})`, ST.int).put(r, 10, `=IFERROR(J${x}/I${x},"")`, ST.pct);
  }
  d.cf(`K2:K${L}`, { kind: 'scale', colors: ['#f8696b', '#ffeb84', '#63be7b'] }).filter(`A1:K${L}`);
  d.w([90, 60, 90, 90, 90, 70, 90, 90, 100, 100, 80]).freeze(1, 0);
  const Q = q(dn); const rg = (c) => `${Q}!$${c}$2:$${c}$${L}`;
  const s = new SheetB(wb, sn); s.w([150, 120, 120, 120, 120, 24, 24, 24, 24, 24, 24, 24, 24]);
  s.title(t('Sales analysis', 'تحليل المبيعات'), t(`Calculated from the "${dn}" sheet — add rows there and extend the ranges.`, `محسوب من ورقة "${dn}" — أضف صفوفًا هناك ومدّد النطاقات.`), 6);
  [[t('Total revenue', 'إجمالي الإيراد'), `=SUM(${rg('I')})`, '#,##0'], [t('Total profit', 'إجمالي الربح'), `=SUM(${rg('J')})`, '#,##0'], [t('Profit margin', 'هامش الربح'), `=IFERROR(B5/A5,"")`, '0.0%'], [t('Orders', 'عدد الطلبات'), `=COUNT(${rg('I')})`, '0'], [t('Avg order value', 'متوسط الطلب'), `=IFERROR(A5/D5,"")`, '#,##0']].forEach(([l, f, nf], i) => s.put(3, i, l, ST.kpiLabel).put(4, i, f, merge(ST.kpiVal, { nf })));
  s.h(4, 38);
  const tbl = (r, title, keyCol, items, first) => {
    s.head(r, 0, [title, t('Revenue', 'الإيراد'), t('Profit', 'الربح'), t('Units', 'الوحدات'), t('Share', 'النسبة')]);
    items.forEach((it, i) => { const x = r + 2 + i; s.put(r + 1 + i, 0, it, ST.text).put(r + 1 + i, 1, `=SUMIFS(${rg('I')},${rg(keyCol)},$A${x})`, ST.int).put(r + 1 + i, 2, `=SUMIFS(${rg('J')},${rg(keyCol)},$A${x})`, ST.int).put(r + 1 + i, 3, `=SUMIFS(${rg('F')},${rg(keyCol)},$A${x})`, ST.int).put(r + 1 + i, 4, `=IFERROR(B${x}/$A$5,"")`, ST.pct0); });
    const e = r + 1 + items.length; s.put(e, 0, t('Total', 'الإجمالي'), ST.total).put(e, 1, `=SUM(B${r + 2}:B${e})`, merge(ST.totalNum, { nf: '#,##0' })).put(e, 2, `=SUM(C${r + 2}:C${e})`, merge(ST.totalNum, { nf: '#,##0' })).put(e, 3, `=SUM(D${r + 2}:D${e})`, merge(ST.totalNum, { nf: '#,##0' })).put(e, 4, '', ST.total);
    s.cf(`E${r + 2}:E${e}`, { kind: 'bar', color: '#638ec6' }); void first;
  };
  tbl(7, t('Region', 'المنطقة'), 'C', regions); tbl(15, t('Product', 'المنتج'), 'D', prods);
  s.head(23, 0, [t('Sales rep', 'المندوب'), t('Revenue', 'الإيراد'), t('Orders', 'الطلبات'), t('Avg order', 'متوسط الطلب'), t('Rank', 'الترتيب')]);
  reps.forEach((p, i) => { const x = 25 + i; s.put(24 + i, 0, p, ST.text).put(24 + i, 1, `=SUMIFS(${rg('I')},${rg('E')},$A${x})`, ST.int).put(24 + i, 2, `=COUNTIFS(${rg('E')},$A${x})`, ST.int).put(24 + i, 3, `=IFERROR(B${x}/C${x},"")`, ST.int).put(24 + i, 4, `=RANK(B${x},$B$25:$B$29)`, merge(ST.center, { b: 1 })); });
  s.cf('E25:E29', { kind: 'cell', op: 'eq', v1: 1, fmt: { bg: C.ok, color: C.okT } });
  s.head(31, 0, [t('Region × Product', 'المنطقة × المنتج'), ...prods, t('Total', 'الإجمالي')]);
  regions.forEach((rgn, i) => { const x = 33 + i; s.put(32 + i, 0, rgn, ST.text); prods.forEach((p, j) => s.put(32 + i, 1 + j, `=SUMIFS(${rg('I')},${rg('C')},$A${x},${rg('D')},${colName(1 + j)}$32)`, ST.int)); s.put(32 + i, 5, `=SUM(B${x}:E${x})`, merge(ST.int, { b: 1 })); });
  s.cf('B33:E36', { kind: 'scale', colors: ['#ffffff', '#63be7b'] });
  s.head(38, 0, [t('Month', 'الشهر'), t('Revenue', 'الإيراد'), t('Orders', 'الطلبات')]);
  for (let m = 1; m <= 12; m += 1) s.put(38 + m, 0, m, merge(ST.center, {})).put(38 + m, 1, `=SUMIFS(${rg('I')},${rg('B')},A${40 + m - 1 + 0})`, ST.int).put(38 + m, 2, `=COUNTIFS(${rg('B')},A${39 + m})`, ST.int);
  s.w([150, 120, 120, 120, 120, 120, 24]);
  s.chart('col', 'A8:B12', t('Revenue by region', 'الإيراد حسب المنطقة'), 3, 7, 420, 250, { legend: false });
  s.chart('donut', 'A16:B20', t('Revenue by product', 'الإيراد حسب المنتج'), 3, 14, 380, 250);
  s.chart('line', 'A39:B51', t('Monthly revenue', 'الإيراد الشهري'), 19, 7, 520, 280, { legend: false });
  s.freeze(3, 0);
};

/* ---------------------------------------------------------------------------------------- helpers */
const kpi = (s, r, c, label, f, nf) => s.put(r, c, label, ST.kpiLabel).put(r + 1, c, f, merge(ST.kpiVal, { nf }));
/** standard-normal CDF from z in cell Z (Abramowitz-Stegun 26.2.17, error < 1e-7) — works in Excel and in the built-in engine */
const phi = (Z, Tt) => `1-EXP(-(${Z}^2)/2)/SQRT(2*PI())*${Tt}*(0.31938153+${Tt}*(-0.356563782+${Tt}*(1.781477937+${Tt}*(-1.821255978+${Tt}*1.330274429))))`;

/* ---------------------------------------------------------------------------------------- statistics */
DATA_BUILDERS['da-stats'] = (wb, ar) => {
  const t = T(ar); const dn = t('Data', 'البيانات'); const sn = t('Statistics', 'الإحصاءات'); const N = 60; const L = 501;
  const d = new SheetB(wb, dn); const r0 = rng(5);
  d.head(0, 0, ['#', t('Value', 'القيمة')]);
  for (let i = 0; i < N; i += 1) {
    const z = (r0() + r0() + r0() + r0() + r0() + r0() - 3) / 0.707; let v = Math.round(70 + 12 * z); if (i === 7) v = 118; if (i === 33) v = 14;
    d.put(1 + i, 0, i + 1, ST.center).put(1 + i, 1, v, ST.inputInt);
  }
  d.put(0, 3, t('Paste your numbers in column B (up to row 501). Everything on the next sheet updates by itself.', 'الصق أرقامك في العمود B (حتى الصف ٥٠١). كل شيء في الورقة التالية يتحدث تلقائيًا.'), ST.note);
  d.w([40, 90, 20, 300]).freeze(1, 0);
  const rg = `${q(dn)}!$B$2:$B$${L}`;
  const s = new SheetB(wb, sn);
  s.title(t('Descriptive statistics', 'الإحصاء الوصفي'), t(`Calculated from the "${dn}" sheet.`, `محسوب من ورقة "${dn}".`), 9);
  const keys = ['n', 'mean', 'median', 'mode', 'min', 'max', 'range', 'var', 'sd', 'se', 'cv', 'q1', 'q3', 'iqr', 'ciLo', 'ciHi', 'skew', 'out'];
  const A = (k) => `$B$${5 + keys.indexOf(k)}`;
  const defs = {
    n: [t('Count', 'العدد'), `=COUNT(${rg})`, '0', t('Number of values', 'عدد القيم')],
    mean: [t('Mean', 'المتوسط'), `=IFERROR(AVERAGE(${rg}),"")`, '0.00', t('Sum / count', 'المجموع ÷ العدد')],
    median: [t('Median', 'الوسيط'), `=IFERROR(MEDIAN(${rg}),"")`, '0.00', t('Middle value', 'القيمة الوسطى')],
    mode: [t('Mode', 'المنوال'), `=IFERROR(MODE(${rg}),"—")`, '0', t('Most frequent value', 'القيمة الأكثر تكرارًا')],
    min: [t('Minimum', 'أصغر قيمة'), `=IFERROR(MIN(${rg}),"")`, '0.00', ''],
    max: [t('Maximum', 'أكبر قيمة'), `=IFERROR(MAX(${rg}),"")`, '0.00', ''],
    range: [t('Range', 'المدى'), `=IFERROR(${A('max')}-${A('min')},"")`, '0.00', t('Max − min', 'الأكبر − الأصغر')],
    var: [t('Variance', 'التباين'), `=IFERROR(VAR(${rg}),"")`, '0.00', t('Sample variance', 'تباين العينة')],
    sd: [t('Std deviation', 'الانحراف المعياري'), `=IFERROR(STDEV(${rg}),"")`, '0.00', t('Spread around the mean', 'التشتت حول المتوسط')],
    se: [t('Std error of mean', 'الخطأ المعياري للمتوسط'), `=IFERROR(${A('sd')}/SQRT(${A('n')}),"")`, '0.000', 'SD ÷ √n'],
    cv: [t('Coeff. of variation', 'معامل الاختلاف'), `=IFERROR(${A('sd')}/${A('mean')},"")`, '0.0%', t('SD ÷ mean (relative spread)', 'الانحراف ÷ المتوسط')],
    q1: [t('Q1 (25th pct)', 'الربيع الأول'), `=IFERROR(QUARTILE(${rg},1),"")`, '0.00', ''],
    q3: [t('Q3 (75th pct)', 'الربيع الثالث'), `=IFERROR(QUARTILE(${rg},3),"")`, '0.00', ''],
    iqr: [t('IQR', 'المدى الربيعي'), `=IFERROR(${A('q3')}-${A('q1')},"")`, '0.00', 'Q3 − Q1'],
    ciLo: [t('95% CI of mean — low', 'فترة ثقة ٩٥٪ — أدنى'), `=IFERROR(${A('mean')}-1.96*${A('se')},"")`, '0.00', ''],
    ciHi: [t('95% CI of mean — high', 'فترة ثقة ٩٥٪ — أعلى'), `=IFERROR(${A('mean')}+1.96*${A('se')},"")`, '0.00', ''],
    skew: [t('Skewness', 'الالتواء'), `=IFERROR(${A('n')}/((${A('n')}-1)*(${A('n')}-2))*SUMPRODUCT((${rg}<>"")*((${rg}-${A('mean')})/${A('sd')})^3),"")`, '0.00', t('> 0 right tail, < 0 left tail', '> 0 ذيل يمين، < 0 ذيل يسار')],
    out: [t('Outliers (1.5×IQR)', 'قيم شاذة (١٫٥×IQR)'), `=IFERROR(COUNTIF(${rg},"<"&(${A('q1')}-1.5*${A('iqr')}))+COUNTIF(${rg},">"&(${A('q3')}+1.5*${A('iqr')})),"")`, '0', t('Values outside the fences', 'قيم خارج الحدود')],
  };
  s.head(3, 0, [t('Measure', 'المقياس'), t('Value', 'القيمة'), t('Meaning', 'المعنى')]);
  keys.forEach((k, i) => { const [lb, f, nf, note] = defs[k]; s.put(4 + i, 0, lb, ST.text).put(4 + i, 1, f, merge(ST.num, { nf, b: 1 })).put(4 + i, 2, note, merge(ST.text, { color: C.ink })); });
  const shapeRow = 4 + keys.length;
  s.put(shapeRow, 0, t('Shape', 'شكل التوزيع'), ST.total).put(shapeRow, 1, `=IF(${A('skew')}="","",IF(ABS(${A('skew')})<0.5,"${t('Roughly symmetric', 'متماثل تقريبًا')}",IF(${A('skew')}>0,"${t('Right-skewed', 'ملتوٍ لليمين')}","${t('Left-skewed', 'ملتوٍ لليسار')}")))`, merge(ST.total, { al: 'center' })).put(shapeRow, 2, '', ST.total);
  s.cf(`B${5 + keys.indexOf('out')}`, { kind: 'cell', op: 'gt', v1: 0, fmt: { bg: C.warn, color: C.warnT } });
  // histogram
  s.head(3, 4, [t('Bin', 'الفئة'), t('Count', 'العدد'), t('%', 'النسبة'), t('From', 'من'), t('To', 'إلى')]);
  s.put(2, 4, t('Bin width', 'عرض الفئة'), ST.label).put(2, 5, `=IFERROR(MAX(1,ROUNDUP((${A('max')}-${A('min')})/8,0)),1)`, merge(ST.int, { b: 1 }));
  for (let i = 0; i < 8; i += 1) {
    const r = 4 + i; const x = r + 1;
    s.put(r, 7, i === 0 ? `=IFERROR(${A('min')},"")` : `=I${x - 1}`, ST.int).put(r, 8, `=IFERROR(H${x}+$F$3,"")`, ST.int);
    s.put(r, 4, `=IFERROR(H${x}&"–"&I${x},"")`, merge(ST.center, {}));
    s.put(r, 5, i === 7 ? `=COUNTIFS(${rg},">="&H${x},${rg},"<="&I${x})` : `=COUNTIFS(${rg},">="&H${x},${rg},"<"&I${x})`, ST.int);
    s.put(r, 6, `=IFERROR(F${x}/${A('n')},"")`, ST.pct);
  }
  s.cf('F5:F12', { kind: 'bar', color: '#7c5cd6' });
  s.chart('col', 'E4:F12', t('Histogram', 'المدرج التكراري'), 14, 4, 480, 270, { legend: false });
  s.w([170, 90, 230, 24, 80, 70, 70, 60, 60]).freeze(3, 0);
};

/* ---------------------------------------------------------------------------------------- survey */
DATA_BUILDERS['da-survey'] = (wb, ar) => {
  const t = T(ar); const dn = t('Responses', 'الإجابات'); const sn = t('Results', 'النتائج'); const N = 30; const L = 201;
  const qs = ar
    ? ['محتوى المقرر واضح', 'الشرح مفهوم', 'الأمثلة كافية', 'الواجبات مناسبة', 'التقييم عادل', 'المحاضر متعاون', 'القاعة والتجهيزات مناسبة', 'أنصح زملائي بالمقرر']
    : ['Course content is clear', 'Explanations are easy to follow', 'Examples are sufficient', 'Assignments are appropriate', 'Grading is fair', 'Instructor is supportive', 'Rooms and equipment are suitable', 'I would recommend this course'];
  const d = new SheetB(wb, dn); const r0 = rng(11);
  d.head(0, 0, [t('Respondent', 'المشارك'), ...qs], 52);
  for (let i = 0; i < N; i += 1) {
    d.put(1 + i, 0, i + 1, ST.center);
    qs.forEach((_, j) => d.put(1 + i, 1 + j, Math.max(1, Math.min(5, Math.round(3.5 + (j % 3 === 2 ? -0.6 : 0.2) + (r0() + r0() - 1) * 2.4))), merge(ST.input, { al: 'center' })));
  }
  d.cf(`B2:I${L}`, { kind: 'scale', colors: ['#f8696b', '#ffeb84', '#63be7b'] });
  d.w([80, ...qs.map(() => 96)]).freeze(1, 1);
  const col = (j) => `${q(dn)}!$${colName(1 + j)}$2:$${colName(1 + j)}$${L}`; const all = `${q(dn)}!$B$2:$I$${L}`;
  const s = new SheetB(wb, sn);
  s.title(t('Survey analysis', 'تحليل الاستبيان'), t('Scale 1 = strongly disagree … 5 = strongly agree. Agree = 4–5, disagree = 1–2.', 'المقياس 1 = أعارض بشدة … 5 = أوافق بشدة. موافق = ٤–٥، غير موافق = ١–٢.'), 9);
  kpi(s, 3, 0, t('Respondents', 'عدد المشاركين'), `=COUNT(${q(dn)}!$A$2:$A$${L})`, '0');
  kpi(s, 3, 1, t('Overall mean', 'المتوسط العام'), `=IFERROR(AVERAGE(${all}),"")`, '0.00');
  kpi(s, 3, 2, t('% agree', 'نسبة الموافقة'), `=IFERROR(COUNTIF(${all},">=4")/COUNT(${all}),"")`, '0%');
  kpi(s, 3, 3, t('% disagree', 'نسبة الرفض'), `=IFERROR(COUNTIF(${all},"<=2")/COUNT(${all}),"")`, '0%');
  s.h(4, 34);
  s.head(7, 0, [t('Question', 'السؤال'), t('Mean', 'المتوسط'), 'SD', t('% agree', 'موافق'), t('% neutral', 'محايد'), t('% disagree', 'غير موافق'), 'n', t('Rank', 'الترتيب')], 36);
  qs.forEach((_, j) => {
    const r = 8 + j; const x = r + 1; const c = col(j);
    s.put(r, 0, `=${q(dn)}!${colName(1 + j)}1`, merge(ST.wrapText, { va: 'center' })).put(r, 1, `=IFERROR(AVERAGE(${c}),"")`, merge(ST.num, { b: 1 })).put(r, 2, `=IFERROR(STDEV(${c}),"")`, ST.num);
    s.put(r, 3, `=IFERROR(COUNTIF(${c},">=4")/COUNT(${c}),"")`, ST.pct0).put(r, 4, `=IFERROR(COUNTIF(${c},3)/COUNT(${c}),"")`, ST.pct0).put(r, 5, `=IFERROR(COUNTIF(${c},"<=2")/COUNT(${c}),"")`, ST.pct0);
    s.put(r, 6, `=COUNT(${c})`, ST.center).put(r, 7, `=IFERROR(RANK(B${x},$B$9:$B$16),"")`, merge(ST.center, { b: 1 }));
  });
  s.cf('B9:B16', { kind: 'scale', colors: ['#f8696b', '#ffeb84', '#63be7b'] }).cf('D9:D16', { kind: 'bar', color: '#63c384' }).cf('F9:F16', { kind: 'bar', color: '#ff555a' });
  s.put(17, 0, t('Strongest item', 'أقوى بند'), ST.total).put(17, 1, `=IFERROR(INDEX(A9:A16,MATCH(MAX(B9:B16),B9:B16,0)),"")`, ST.total); s.merge(17, 1, 17, 5);
  s.put(18, 0, t('Weakest item', 'أضعف بند'), ST.total).put(18, 1, `=IFERROR(INDEX(A9:A16,MATCH(MIN(B9:B16),B9:B16,0)),"")`, ST.total); s.merge(18, 1, 18, 5);
  s.head(20, 0, [t('Answer', 'الإجابة'), t('Count', 'العدد'), t('Share', 'النسبة')]);
  [[1, t('1 – Strongly disagree', '١ – أعارض بشدة')], [2, t('2 – Disagree', '٢ – أعارض')], [3, t('3 – Neutral', '٣ – محايد')], [4, t('4 – Agree', '٤ – أوافق')], [5, t('5 – Strongly agree', '٥ – أوافق بشدة')]].forEach(([v, lb], i) => {
    s.put(21 + i, 0, lb, ST.text).put(21 + i, 1, `=COUNTIF(${all},${v})`, ST.int).put(21 + i, 2, `=IFERROR(B${22 + i}/SUM($B$22:$B$26),"")`, ST.pct0);
  });
  s.cf('C22:C26', { kind: 'bar', color: '#638ec6' });
  s.chart('bar', 'A8:B16', t('Mean score per question', 'متوسط كل سؤال'), 3, 9, 480, 300, { legend: false });
  s.chart('col', 'A21:B26', t('Answer distribution', 'توزيع الإجابات'), 19, 9, 480, 260, { legend: false });
  s.w([250, 90, 80, 90, 90, 100, 60, 70, 24]).freeze(2, 0);
};

/* ---------------------------------------------------------------------------------------- regression */
DATA_BUILDERS['da-regression'] = (wb, ar) => {
  const t = T(ar); const sn = t('Regression', 'الانحدار'); const N = 30; const L = 101;
  const s = new SheetB(wb, sn); const r0 = rng(3);
  s.head(0, 0, [t('X (e.g. ad spend)', 'X (مثلاً الإعلان)'), t('Y (e.g. sales)', 'Y (مثلاً المبيعات)'), t('Predicted', 'المتوقع'), t('Residual', 'الخطأ')], 40);
  for (let i = 0; i < L - 1; i += 1) {
    const r = 1 + i; const x = r + 1;
    if (i < N) { const X = 10 + i * 3 + Math.round(r0() * 4); s.put(r, 0, X, ST.inputInt).put(r, 1, Math.round(140 + 3.1 * X + (r0() + r0() - 1) * 55), ST.inputInt); } else s.put(r, 0, '', ST.input).put(r, 1, '', ST.input);
    s.put(r, 2, `=IF(COUNT(A${x}:B${x})<2,"",$G$6+$G$5*A${x})`, ST.num).put(r, 3, `=IF(C${x}="","",B${x}-C${x})`, ST.num);
  }
  const X = `$A$2:$A$${L}`; const Y = `$B$2:$B$${L}`;
  s.put(0, 5, t('Regression results', 'نتائج الانحدار'), merge(ST.head, { al: 'left' })).put(0, 6, '', ST.head).put(0, 7, '', ST.head);
  const rows = [
    [t('Observations (n)', 'عدد المشاهدات'), `=COUNT(${Y})`, '0'],
    [t('Correlation (r)', 'معامل الارتباط r'), `=IFERROR(CORREL(${X},${Y}),"")`, '0.000'],
    [t('R²', 'معامل التحديد R²'), `=IFERROR(G3^2,"")`, '0.000'],
    [t('Slope (b)', 'الميل b'), `=IFERROR(SLOPE(${Y},${X}),"")`, '0.0000'],
    [t('Intercept (a)', 'الثابت a'), `=IFERROR(INTERCEPT(${Y},${X}),"")`, '0.00'],
    [t('Std error of estimate', 'الخطأ المعياري للتقدير'), `=IFERROR(SQRT(SUMSQ($D$2:$D$${L})/(G2-2)),"")`, '0.00'],
    [t('t-statistic of r', 'قيمة t'), `=IFERROR(G3*SQRT((G2-2)/(1-G3^2)),"")`, '0.00'],
  ];
  // order matters: G2 n, G3 r, G4 R2, G5 slope?  -> remap below so formulas above point at the right cells
  rows.forEach(([lb, f, nf], i) => s.put(1 + i, 5, lb, ST.text).put(1 + i, 6, f, merge(ST.num, { nf, b: 1 })));
  s.put(8, 5, t('Equation', 'المعادلة'), ST.total).put(8, 6, `=IFERROR("y = "&TEXT(G6,"0.00")&" + "&TEXT(G5,"0.000")&"·x","")`, ST.total); s.merge(8, 6, 8, 7);
  s.put(9, 5, t('Strength', 'قوة العلاقة'), ST.total).put(9, 6, `=IF(G3="","",IF(ABS(G3)>=0.8,"${t('Very strong', 'قوية جدًا')}",IF(ABS(G3)>=0.6,"${t('Strong', 'قوية')}",IF(ABS(G3)>=0.4,"${t('Moderate', 'متوسطة')}",IF(ABS(G3)>=0.2,"${t('Weak', 'ضعيفة')}","${t('None', 'لا توجد')}")))))&IF(G3="",""," "&IF(G3>0,"${t('positive', 'طردية')}","${t('negative', 'عكسية')}"))`, ST.total); s.merge(9, 6, 9, 7);
  s.put(10, 5, t('Significant (95 %)?', 'معنوية (٩٥٪)؟'), ST.total).put(10, 6, `=IF(G8="","",IF(ABS(G8)>2.05,"${t('Yes', 'نعم')}","${t('No', 'لا')}"))`, ST.total); s.merge(10, 6, 10, 7);
  s.put(12, 5, t('Forecast', 'تنبؤ'), merge(ST.head, { al: 'left' })).put(12, 6, '', ST.head).put(12, 7, '', ST.head);
  s.put(13, 5, t('New X value', 'قيمة X الجديدة'), ST.text).put(13, 6, 120, ST.inputInt);
  s.put(14, 5, t('Predicted Y', 'Y المتوقعة'), ST.total).put(14, 6, `=IFERROR(G6+G5*G14,"")`, merge(ST.totalNum, { nf: '#,##0.0' }));
  s.put(15, 5, t('± 95 % range', 'هامش ± ٩٥٪'), ST.text).put(15, 6, `=IFERROR(1.96*G7,"")`, ST.num);
  s.put(17, 5, t('Yellow cells are inputs. Add rows below the data (up to row 101).', 'الخلايا الصفراء مدخلات. أضف صفوفًا أسفل البيانات (حتى الصف ١٠١).'), ST.note);
  s.cf('D2:D101', { kind: 'scale', colors: ['#f8696b', '#ffffff', '#5a8ac6'] });
  s.chart('scatter', 'A1:C31', t('X vs Y with fitted line', 'X مقابل Y مع خط الانحدار'), 18, 5, 480, 300, {});
  s.w([110, 110, 100, 90, 24, 190, 120, 90]).freeze(1, 0);
};

/* ---------------------------------------------------------------------------------------- A/B test */
DATA_BUILDERS['da-ab'] = (wb, ar) => {
  const t = T(ar); const s = new SheetB(wb, t('A/B test', 'اختبار A/B'));
  s.title(t('A/B test analysis', 'تحليل اختبار A/B'), t('Enter visitors and conversions for each variant (yellow cells).', 'أدخل الزوار والتحويلات لكل نسخة (الخلايا الصفراء).'), 6);
  s.head(3, 0, [t('Metric', 'المقياس'), t('A (control)', 'A (الأصلية)'), t('B (variant)', 'B (التجربة)')]);
  s.put(4, 0, t('Visitors', 'الزوار'), ST.text).put(4, 1, 5200, ST.inputInt).put(4, 2, 5150, ST.inputInt);
  s.put(5, 0, t('Conversions', 'التحويلات'), ST.text).put(5, 1, 416, ST.inputInt).put(5, 2, 479, ST.inputInt);
  s.put(6, 0, t('Conversion rate', 'معدل التحويل'), ST.total).put(6, 1, '=IFERROR(B6/B5,"")', merge(ST.totalNum, { nf: '0.00%' })).put(6, 2, '=IFERROR(C6/C5,"")', merge(ST.totalNum, { nf: '0.00%' }));
  s.head(8, 0, [t('Statistics', 'الإحصاءات'), t('Value', 'القيمة'), t('Note', 'ملاحظة')]);
  const rows = [
    [t('Absolute lift', 'الفرق المطلق'), '=IFERROR(C7-B7,"")', '0.00%', 'B − A'],
    [t('Relative lift', 'التحسن النسبي'), '=IFERROR(C7/B7-1,"")', '0.0%', '(B − A) ÷ A'],
    [t('Pooled rate', 'المعدل المجمّع'), '=IFERROR((B6+C6)/(B5+C5),"")', '0.00%', ''],
    [t('Std error', 'الخطأ المعياري'), '=IFERROR(SQRT(B12*(1-B12)*(1/B5+1/C5)),"")', '0.0000%', ''],
    [t('z-score', 'قيمة z'), '=IFERROR(B10/B13,"")', '0.000', ''],
    ['t = 1 / (1 + 0.2316419·|z|)', '=IFERROR(1/(1+0.2316419*ABS(B14)),"")', '0.0000', t('helper for the normal curve', 'مساعد للمنحنى الطبيعي')],
    [t('p-value (two-sided)', 'القيمة الاحتمالية (ذيلان)'), `=IFERROR(2*(1-(${phi('ABS(B14)', 'B15')})),"")`, '0.0000', t('below 0.05 = significant', 'أقل من ٠٫٠٥ = معنوي')],
    [t('95 % CI of difference — low', 'فترة ثقة الفرق — أدنى'), '=IFERROR(B10-1.96*SQRT(B7*(1-B7)/B5+C7*(1-C7)/C5),"")', '0.00%', ''],
    [t('95 % CI of difference — high', 'فترة ثقة الفرق — أعلى'), '=IFERROR(B10+1.96*SQRT(B7*(1-B7)/B5+C7*(1-C7)/C5),"")', '0.00%', ''],
  ];
  rows.forEach(([lb, f, nf, note], i) => s.put(9 + i, 0, lb, ST.text).put(9 + i, 1, f, merge(ST.num, { nf, b: 1 })).put(9 + i, 2, note, merge(ST.text, { color: C.ink })));
  s.put(19, 0, t('Verdict', 'القرار'), ST.total).put(19, 1, `=IF(B16="","",IF(B16<0.05,IF(B10>0,"${t('B wins — significant', 'B أفضل — فرق معنوي')}","${t('A wins — significant', 'A أفضل — فرق معنوي')}"),"${t('No significant difference yet', 'لا يوجد فرق معنوي بعد')}"))`, merge(ST.total, { al: 'center' })); s.merge(19, 1, 19, 2);
  s.cf('B20', { kind: 'text', tmode: 'contains', text: 'wins', fmt: { bg: C.ok, color: C.okT } }).cf('B20', { kind: 'text', tmode: 'contains', text: 'أفضل', fmt: { bg: C.ok, color: C.okT } }).cf('B20', { kind: 'text', tmode: 'contains', text: t('No significant', 'لا يوجد'), fmt: { bg: C.warn, color: C.warnT } });
  s.head(21, 0, [t('Planning the next test', 'تخطيط الاختبار القادم'), t('Value', 'القيمة'), '']);
  s.put(22, 0, t('Baseline rate', 'المعدل الأساسي'), ST.text).put(22, 1, '=B7', merge(ST.pct, { nf: '0.00%' }));
  s.put(23, 0, t('Smallest lift worth detecting', 'أصغر تحسن يهمك'), ST.text).put(23, 1, 0.01, merge(ST.inputPct, { nf: '0.00%' }));
  s.put(24, 0, t('Visitors needed per variant', 'الزوار المطلوبون لكل نسخة'), ST.total).put(24, 1, '=IFERROR(ROUNDUP(15.7*B23*(1-B23)/B24^2,0),"")', merge(ST.totalNum, { nf: '#,##0' })).put(24, 2, t('95 % confidence, 80 % power', 'ثقة ٩٥٪ وقوة ٨٠٪'), ST.note);
  s.put(3, 4, t('Variant', 'النسخة'), ST.head).put(3, 5, t('Rate', 'المعدل'), ST.head).put(4, 4, 'A', ST.center).put(4, 5, '=B7', ST.pct).put(5, 4, 'B', ST.center).put(5, 5, '=C7', ST.pct);
  s.chart('col', 'E4:F6', t('Conversion rate', 'معدل التحويل'), 7, 4, 340, 240, { legend: false });
  s.w([230, 130, 170, 24, 80, 80]).freeze(3, 0);
};

/* ---------------------------------------------------------------------------------------- Pareto */
DATA_BUILDERS['da-pareto'] = (wb, ar) => {
  const t = T(ar); const s = new SheetB(wb, t('Pareto', 'باريتو')); const N = 12;
  const items = ar ? ['تأخير التسليم', 'خطأ في الطلب', 'عيب تصنيع', 'تلف أثناء الشحن', 'فاتورة خاطئة', 'خدمة العملاء', 'مشكلة تغليف', 'أخرى', 'تأخر الرد', 'منتج ناقص', 'عنوان خاطئ', 'تعطل الموقع']
    : ['Late delivery', 'Wrong order', 'Manufacturing defect', 'Shipping damage', 'Billing error', 'Customer service', 'Packaging issue', 'Other', 'Slow reply', 'Missing item', 'Wrong address', 'Website down'];
  const vals = [120, 45, 80, 30, 18, 25, 12, 8, 22, 15, 6, 10];
  s.title(t('Pareto / ABC analysis', 'تحليل باريتو / ABC'), t('Enter any list of causes or products and their value (yellow). The ranked table sorts itself.', 'أدخل أي قائمة أسباب أو منتجات وقيمتها (أصفر). الجدول المرتّب يرتب نفسه.'), 11);
  s.head(3, 0, [t('Item', 'البند'), t('Value', 'القيمة'), '']);
  s.head(3, 4, ['#', t('Item (ranked)', 'البند (مرتّب)'), t('Value', 'القيمة'), t('Share', 'النسبة'), t('Cumulative', 'التراكمي'), t('Class', 'الفئة')]);
  for (let i = 0; i < N; i += 1) {
    const r = 4 + i; const x = r + 1;
    s.put(r, 0, items[i], ST.input).put(r, 1, vals[i], ST.inputInt).put(r, 2, `=IF(B${x}="","",B${x}+ROW()/1000000)`, merge(ST.cell, { color: '#FFFFFF', fs: 8 }));
    s.put(r, 4, i + 1, ST.center);
    s.put(r, 5, `=IFERROR(INDEX($A$5:$A$16,MATCH(LARGE($C$5:$C$16,E${x}),$C$5:$C$16,0)),"")`, ST.text);
    s.put(r, 6, `=IFERROR(INDEX($B$5:$B$16,MATCH(LARGE($C$5:$C$16,E${x}),$C$5:$C$16,0)),"")`, ST.int);
    s.put(r, 7, `=IFERROR(G${x}/SUM($B$5:$B$16),"")`, ST.pct).put(r, 8, i === 0 ? `=IFERROR(H${x},"")` : `=IFERROR(I${x - 1}+H${x},"")`, ST.pct);
    s.put(r, 9, `=IF(I${x}="","",IF(I${x}-H${x}<0.8,"A",IF(I${x}-H${x}<0.95,"B","C")))`, merge(ST.center, { b: 1 }));
  }
  s.put(3, 2, '', ST.head);
  s.cf('J5:J16', { kind: 'cell', op: 'eq', v1: 'A', fmt: { bg: C.bad, color: C.badT } }).cf('J5:J16', { kind: 'cell', op: 'eq', v1: 'B', fmt: { bg: C.warn, color: C.warnT } }).cf('J5:J16', { kind: 'cell', op: 'eq', v1: 'C', fmt: { bg: C.ok, color: C.okT } });
  s.cf('H5:H16', { kind: 'bar', color: '#ffb628' });
  s.put(17, 4, t('Total', 'الإجمالي'), ST.total).put(17, 5, '', ST.total).put(17, 6, '=SUM(B5:B16)', merge(ST.total, { nf: '#,##0' })).put(17, 7, '', ST.total).put(17, 8, '', ST.total).put(17, 9, '', ST.total);
  s.put(19, 4, t('Class A = items making up the first 80 % of the total (focus here). B = next 15 %. C = last 5 %.', 'الفئة A = البنود التي تكوّن أول ٨٠٪ من الإجمالي (ركّز عليها). B = الـ ١٥٪ التالية. C = آخر ٥٪.'), ST.note);
  s.put(20, 4, t('Items in class A', 'عدد بنود الفئة A'), ST.text).put(20, 6, '=COUNTIF(J5:J16,"A")', merge(ST.int, { b: 1 }));
  s.chart('col', 'F4:G16', t('Ranked values', 'القيم مرتبة'), 21, 4, 460, 260, { legend: false });
  s.w([170, 80, 20, 24, 40, 170, 80, 80, 90, 60, 24]).freeze(4, 0);
};

/* ---------------------------------------------------------------------------------------- forecast */
DATA_BUILDERS['da-forecast'] = (wb, ar) => {
  const t = T(ar); const s = new SheetB(wb, t('Forecast', 'التوقع')); const H = 24; const F = 6; const tot = H + F; const L = 5 + tot - 1;
  const mon = ar ? ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'] : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const r0 = rng(13);
  s.title(t('Sales forecast (linear trend)', 'توقع المبيعات (اتجاه خطي)'), t('Enter monthly actuals (yellow). Trend and the next 6 months are calculated.', 'أدخل الفعلي الشهري (أصفر). الاتجاه وأول ٦ شهور قادمة محسوبة.'), 8);
  s.head(3, 0, ['#', t('Month', 'الشهر'), t('Actual', 'الفعلي'), t('Trend', 'الاتجاه'), t('3-mo average', 'متوسط ٣ شهور'), t('Error %', 'نسبة الخطأ')]);
  for (let i = 0; i < tot; i += 1) {
    const r = 4 + i; const x = r + 1; const hist = i < H;
    const y = 2026 - 2 + Math.floor(i / 12); const label = `${mon[i % 12]} ${String(y).slice(2)}`;
    s.put(r, 0, i + 1, ST.center).put(r, 1, label, hist ? ST.text : merge(ST.text, { i: 1, color: C.ink }));
    s.put(r, 2, hist ? Math.round(1000 + i * 28 + 140 * Math.sin((i / 12) * 2 * Math.PI) + (r0() - 0.5) * 120) : '', hist ? ST.inputInt : merge(ST.int, { bg: C.grey }));
    s.put(r, 3, `=IFERROR($J$7+$J$6*A${x},"")`, ST.int);
    s.put(r, 4, i >= 2 ? `=IF(COUNT(C${x - 2}:C${x})=3,AVERAGE(C${x - 2}:C${x}),"")` : '', ST.int);
    s.put(r, 5, `=IF(C${x}="","",(C${x}-D${x})/D${x})`, ST.pct);
  }
  const Ac = `$C$5:$C$${5 + H - 1}`; const Ax = `$A$5:$A$${5 + H - 1}`;
  s.put(3, 8, t('Model', 'النموذج'), merge(ST.head, { al: 'left' })).put(3, 9, '', ST.head);
  [[t('Months of history', 'شهور البيانات'), `=COUNT(${Ac})`, '0'], [t('Slope / month', 'الميل / شهر'), `=IFERROR(SLOPE(${Ac},${Ax}),"")`, '#,##0.00'], [t('Intercept', 'الثابت'), `=IFERROR(INTERCEPT(${Ac},${Ax}),"")`, '#,##0.00'],
    ['R²', `=IFERROR(CORREL(${Ac},${Ax})^2,"")`, '0.000'], ['MAPE', `=IFERROR(SUMPRODUCT(ABS(F5:F${4 + H}))/COUNT(F5:F${4 + H}),"")`, '0.0%'],
    [t('Growth / month', 'نمو / شهر'), `=IFERROR(J6/AVERAGE(${Ac}),"")`, '0.0%'], [t('Next 6 months total', 'إجمالي ٦ شهور قادمة'), `=SUM(D${5 + H}:D${L})`, '#,##0']].forEach(([lb, f, nf], i) => s.put(4 + i, 8, lb, ST.text).put(4 + i, 9, f, merge(ST.num, { nf, b: 1 })));
  s.cf(`F5:F${4 + H}`, { kind: 'cell', op: 'gt', v1: 0.15, fmt: { bg: C.warn, color: C.warnT } }).cf(`C5:C${4 + H}`, { kind: 'bar', color: '#6fc4d6' });
  s.chart('line', `B4:E${L}`, t('Actual vs trend vs moving average', 'الفعلي مقابل الاتجاه والمتوسط المتحرك'), 12, 8, 560, 300, {});
  s.w([40, 80, 90, 90, 100, 80, 24, 24, 160, 100]).freeze(4, 0);
};

/* ---------------------------------------------------------------------------------------- finance ratios */
DATA_BUILDERS['da-finance'] = (wb, ar) => {
  const t = T(ar); const s = new SheetB(wb, t('Ratios', 'النسب'));
  s.title(t('Financial ratio analysis', 'تحليل النسب المالية'), t('Enter the statements in the yellow cells; every ratio is calculated with a quick verdict.', 'أدخل القوائم في الخلايا الصفراء؛ كل نسبة تُحسب مع حكم سريع.'), 9);
  s.head(3, 0, [t('Balance sheet', 'قائمة المركز المالي'), t('Amount', 'المبلغ')]);
  const bs = [[t('Cash', 'النقدية'), 80000], [t('Receivables', 'العملاء'), 120000], [t('Inventory', 'المخزون'), 150000], [t('Other current assets', 'أصول متداولة أخرى'), 20000], [t('Fixed assets', 'الأصول الثابتة'), 480000],
    [t('Current liabilities', 'التزامات متداولة'), 190000], [t('Long-term debt', 'ديون طويلة الأجل'), 250000], [t("Owners' equity", 'حقوق الملكية'), 410000]];
  bs.forEach(([lb, v], i) => s.put(4 + i, 0, lb, ST.text).put(4 + i, 1, v, ST.inputInt));
  s.put(12, 0, t('Total assets', 'إجمالي الأصول'), ST.total).put(12, 1, '=SUM(B5:B9)', merge(ST.totalNum, { nf: '#,##0' }));
  s.put(13, 0, t('Check: assets − liabilities − equity', 'فحص: الأصول − الالتزامات − الملكية'), ST.text).put(13, 1, '=B13-B10-B11-B12', merge(ST.int, { b: 1 }));
  s.cf('B14', { kind: 'cell', op: 'ne', v1: 0, fmt: { bg: C.bad, color: C.badT } });
  s.head(15, 0, [t('Income statement', 'قائمة الدخل'), t('Amount', 'المبلغ')]);
  const is = [[t('Revenue', 'الإيرادات'), 900000], [t('Cost of goods sold', 'تكلفة المبيعات'), 560000], [t('Operating expenses', 'مصروفات تشغيلية'), 190000], [t('Interest expense', 'فوائد'), 25000], [t('Tax', 'ضرائب'), 25000]];
  is.forEach(([lb, v], i) => s.put(16 + i, 0, lb, ST.text).put(16 + i, 1, v, ST.inputInt));
  s.put(21, 0, t('Net income', 'صافي الربح'), ST.total).put(21, 1, '=B17-B18-B19-B20-B21', merge(ST.totalNum, { nf: '#,##0' }));
  s.head(3, 3, [t('Ratio', 'النسبة'), t('Value', 'القيمة'), t('Healthy range', 'المدى الجيد'), t('Verdict', 'الحكم')]);
  const G = t('Good', 'جيد'); const W = t('Watch', 'انتبه');
  const ratios = [
    [t('Current ratio', 'نسبة التداول'), '=IFERROR((B5+B6+B7+B8)/B10,"")', '0.00', '1.5 – 3', 'v>=1.5', ''],
    [t('Quick ratio', 'نسبة السيولة السريعة'), '=IFERROR((B5+B6)/B10,"")', '0.00', '≥ 1', 'v>=1', ''],
    [t('Cash ratio', 'نسبة النقدية'), '=IFERROR(B5/B10,"")', '0.00', '≥ 0.2', 'v>=0.2', ''],
    [t('Debt ratio', 'نسبة المديونية'), '=IFERROR((B10+B11)/B13,"")', '0.0%', '≤ 60 %', 'v<=0.6', ''],
    [t('Debt-to-equity', 'الديون إلى الملكية'), '=IFERROR((B10+B11)/B12,"")', '0.00', '≤ 1.5', 'v<=1.5', ''],
    [t('Interest coverage', 'تغطية الفوائد'), '=IFERROR((B17-B18-B19)/B20,"")', '0.0', '≥ 3', 'v>=3', ''],
    [t('Gross margin', 'هامش الربح الإجمالي'), '=IFERROR((B17-B18)/B17,"")', '0.0%', '≥ 30 %', 'v>=0.3', ''],
    [t('Operating margin', 'هامش التشغيل'), '=IFERROR((B17-B18-B19)/B17,"")', '0.0%', '≥ 10 %', 'v>=0.1', ''],
    [t('Net margin', 'هامش صافي الربح'), '=IFERROR(B22/B17,"")', '0.0%', '≥ 5 %', 'v>=0.05', ''],
    [t('Return on assets', 'العائد على الأصول'), '=IFERROR(B22/B13,"")', '0.0%', '≥ 5 %', 'v>=0.05', ''],
    [t('Return on equity', 'العائد على الملكية'), '=IFERROR(B22/B12,"")', '0.0%', '≥ 10 %', 'v>=0.1', ''],
    [t('Asset turnover', 'دوران الأصول'), '=IFERROR(B17/B13,"")', '0.00', '≥ 0.7', 'v>=0.7', ''],
    [t('Inventory turnover', 'دوران المخزون'), '=IFERROR(B18/B7,"")', '0.0', '≥ 4', 'v>=4', ''],
    [t('Days sales outstanding', 'أيام التحصيل'), '=IFERROR(B6/B17*365,"")', '0', '≤ 45', 'v<=45', ''],
  ];
  ratios.forEach(([lb, f, nf, rg, cond], i) => {
    const r = 4 + i; const x = r + 1; s.put(r, 3, lb, ST.text).put(r, 4, f, merge(ST.num, { nf, b: 1 })).put(r, 5, rg, merge(ST.center, { color: C.ink }));
    s.put(r, 6, `=IF(E${x}="","",IF(${cond.replace('v', `E${x}`)},"${G}","${W}"))`, merge(ST.center, { b: 1 }));
  });
  s.cf('G5:G18', { kind: 'cell', op: 'eq', v1: G, fmt: { bg: C.ok, color: C.okT } }).cf('G5:G18', { kind: 'cell', op: 'eq', v1: W, fmt: { bg: C.warn, color: C.warnT } });
  s.put(19, 3, t('Ratios in the healthy range', 'نسب في المدى الجيد'), ST.total).put(19, 4, '', ST.total).put(19, 5, '', ST.total).put(19, 6, `=COUNTIF(G5:G18,"${G}")&" / "&COUNTA(G5:G18)`, merge(ST.total, { al: 'center' }));
  s.put(21, 3, t('Ranges are general rules of thumb — compare with your industry.', 'المدى إرشادي عام — قارن بقطاعك.'), ST.note);
  s.chart('col', 'D5:E8', t('Liquidity & leverage', 'السيولة والمديونية'), 22, 3, 420, 240, { legend: false });
  s.w([190, 100, 24, 190, 90, 110, 90, 24, 24]).freeze(3, 0);
};
