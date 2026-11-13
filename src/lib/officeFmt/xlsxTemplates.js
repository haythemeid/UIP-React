/**
 * Ready-made Excel templates built on the real sheet engine (formulas, conditional formatting, charts, frozen panes).
 *   XLSX_TEMPLATES                         -> catalogue [{ id, group, color, label:{en,ar}, hint:{en,ar} }]
 *   buildTemplateWorkbook(id, { ar })      -> Workbook   (write it with writeXlsx from ../sheet/xlsxio)
 * Yellow cells are inputs; everything else is calculated.
 */
import { newBook, SheetB, ST, C, bd, merge, addr, colName, q, rng } from './xlsxBuilder.js';
import { DATA_BUILDERS, DATA_CATALOG } from './xlsxTemplatesData.js';
import { PRO_BUILDERS, PRO_CATALOG, PRO_GROUP } from './xlsxTemplatesPro.js';

const T = (ar) => (en, a) => (ar ? a : en);
const R = (a, b) => `${a}:${b}`;

export const XLSX_GROUPS = [
  { id: 'basic', label: { en: 'Basic', ar: 'أساسي' } }, { id: 'academic', label: { en: 'Academic', ar: 'أكاديمي' } }, { id: 'work', label: { en: 'Work & projects', ar: 'عمل ومشاريع' } },
  { id: 'finance', label: { en: 'Finance', ar: 'مالية' } }, { id: 'data', label: { en: 'Data analysis', ar: 'تحليل بيانات' } }, { id: 'personal', label: { en: 'Personal', ar: 'شخصي' } },
];
XLSX_GROUPS.splice(1, 0, PRO_GROUP); // professional templates right after the basic ones

export const XLSX_TEMPLATES = [
  { id: 'blank', group: 'basic', color: '#64748b', label: { en: 'Blank workbook', ar: 'جدول فارغ' }, hint: { en: 'Empty sheet', ar: 'ورقة فاضية' } },
  { id: 'grades', group: 'academic', color: '#16a34a', label: { en: 'Grades sheet', ar: 'كشف درجات' }, hint: { en: 'Totals, letter grades, pass rate', ar: 'مجموع وتقدير ونسبة نجاح' } },
  { id: 'attendance', group: 'academic', color: '#0d9488', label: { en: 'Attendance sheet', ar: 'كشف حضور' }, hint: { en: '15 lectures, % and warnings', ar: '١٥ محاضرة ونسبة وإنذار' } },
  { id: 'gpa', group: 'academic', color: '#7c3aed', label: { en: 'GPA calculator', ar: 'حاسبة المعدل التراكمي' }, hint: { en: 'Credit hours and grade points', ar: 'ساعات معتمدة ونقاط' } },
  { id: 'timetable', group: 'academic', color: '#0284c7', label: { en: 'Weekly timetable', ar: 'جدول المحاضرات' }, hint: { en: 'Days × time slots', ar: 'أيام × فترات' } },
  { id: 'tasks', group: 'work', color: '#2b6cdf', label: { en: 'Task tracker', ar: 'متابعة مهام' }, hint: { en: 'Status, priority, progress, chart', ar: 'حالة وأولوية وتقدم ورسم' } },
  { id: 'gantt', group: 'work', color: '#e5484d', label: { en: 'Project plan (Gantt)', ar: 'خطة مشروع (Gantt)' }, hint: { en: '16-week timeline bars', ar: 'شريط زمني ١٦ أسبوع' } },
  { id: 'budget', group: 'finance', color: '#ca8a04', label: { en: 'Monthly budget', ar: 'ميزانية شهرية' }, hint: { en: 'Planned vs actual + chart', ar: 'مخطط مقابل فعلي + رسم' } },
  { id: 'expenses', group: 'finance', color: '#b45309', label: { en: 'Expense tracker', ar: 'متابعة المصروفات' }, hint: { en: 'By category with pie chart', ar: 'حسب الفئة مع رسم دائري' } },
  { id: 'invoice', group: 'finance', color: '#ea580c', label: { en: 'Invoice', ar: 'فاتورة' }, hint: { en: 'Discount, tax, total', ar: 'خصم وضريبة وإجمالي' } },
  { id: 'loan', group: 'finance', color: '#475569', label: { en: 'Loan calculator', ar: 'حاسبة قرض' }, hint: { en: 'Payment schedule', ar: 'جدول سداد' } },
  { id: 'inventory', group: 'work', color: '#0f766e', label: { en: 'Inventory', ar: 'جرد مخزون' }, hint: { en: 'Stock, reorder alerts, value', ar: 'رصيد وتنبيه إعادة طلب وقيمة' } },
  { id: 'sales', group: 'work', color: '#2563eb', label: { en: 'Monthly sales tracker', ar: 'متابعة مبيعات' }, hint: { en: 'Products × 12 months, growth', ar: 'منتجات × ١٢ شهر ونمو' } },
  { id: 'kpi', group: 'work', color: '#9333ea', label: { en: 'KPI scorecard', ar: 'لوحة مؤشرات الأداء' }, hint: { en: 'Target vs actual with status', ar: 'مستهدف مقابل فعلي بحالة' } },
  { id: 'habits', group: 'personal', color: '#db2777', label: { en: 'Habit tracker', ar: 'متابع العادات' }, hint: { en: '31-day grid and streaks', ar: 'شبكة ٣١ يوم ونسب' } },
  ...PRO_CATALOG,
  ...DATA_CATALOG,
];

/* ------------------------------------------------------------------------------------------------ builders */
const B = {};

B.grades = (wb, ar) => {
  const t = T(ar); const s = new SheetB(wb, t('Grades', 'الدرجات'));
  const pass = t('Pass', 'ناجح'); const fail = t('Fail', 'راسب'); const F = 6; const L = F + 19;
  s.title(t('Grades sheet', 'كشف درجات'), t('Course / semester: ..................', 'المقرر / الفصل الدراسي: ..................'), 10);
  s.put(3, 2, t('Max marks', 'الدرجة العظمى'), ST.label); [30, 20, 50].forEach((v, i) => s.put(3, 3 + i, v, ST.inputInt)); s.put(3, 6, '=SUM(D4:F4)', merge(ST.total, { nf: '0' }));
  s.head(4, 0, ['#', t('Student name', 'اسم الطالب'), t('Student ID', 'رقم الطالب'), t('Coursework', 'أعمال السنة'), t('Midterm', 'الميد'), t('Final', 'النهائي'), t('Total', 'المجموع'), '%', t('Grade', 'التقدير'), t('Status', 'الحالة')]);
  for (let i = 0; i < 20; i += 1) {
    const r = 5 + i; const x = r + 1;
    s.put(r, 0, i + 1, ST.center).put(r, 1, '', ST.input).put(r, 2, '', ST.input);
    [3, 4, 5].forEach((c) => s.put(r, c, '', ST.inputNum));
    s.put(r, 6, `=IF(COUNT(D${x}:F${x})=0,"",SUM(D${x}:F${x}))`, merge(ST.num, { b: 1 }));
    s.put(r, 7, `=IF(G${x}="","",G${x}/$G$4)`, ST.pct0);
    s.put(r, 8, `=IF(H${x}="","",IFS(H${x}>=0.9,"A+",H${x}>=0.85,"A",H${x}>=0.8,"B+",H${x}>=0.75,"B",H${x}>=0.7,"C+",H${x}>=0.65,"C",H${x}>=0.6,"D",TRUE,"F"))`, merge(ST.center, { b: 1 }));
    s.put(r, 9, `=IF(H${x}="","",IF(H${x}>=0.6,"${pass}","${fail}"))`, ST.center);
  }
  const rg = (c) => `${c}${F}:${c}${L}`;
  s.put(3, 11, t('Class statistics', 'إحصائيات الفصل'), merge(ST.head, { al: 'left' })).put(3, 12, '', ST.head);
  [[t('Students graded', 'عدد الطلاب'), `=COUNT(${rg('G')})`, '0'], [t('Average', 'المتوسط'), `=IFERROR(AVERAGE(${rg('G')}),"")`, '0.00'], [t('Highest', 'الأعلى'), `=IF(COUNT(${rg('G')})=0,"",MAX(${rg('G')}))`, '0.00'],
    [t('Lowest', 'الأدنى'), `=IF(COUNT(${rg('G')})=0,"",MIN(${rg('G')}))`, '0.00'], [t('Std deviation', 'الانحراف المعياري'), `=IFERROR(STDEV(${rg('G')}),"")`, '0.00'],
    [t('Pass rate', 'نسبة النجاح'), `=IFERROR(COUNTIF(${rg('J')},"${pass}")/COUNT(${rg('G')}),"")`, '0%']].forEach(([a, f, nf], i) => s.put(4 + i, 11, a, ST.text).put(4 + i, 12, f, merge(ST.int, { nf, b: 1 })));
  s.put(11, 11, t('Grade distribution', 'توزيع التقديرات'), merge(ST.head, { al: 'left' })).put(11, 12, t('Count', 'العدد'), ST.head);
  ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'].forEach((g, i) => s.put(12 + i, 11, g, ST.center).put(12 + i, 12, `=COUNTIF(${rg('I')},L${13 + i})`, ST.int));
  s.cf(rg('J'), { kind: 'text', tmode: 'contains', text: pass, fmt: { bg: C.ok, color: C.okT } }).cf(rg('J'), { kind: 'text', tmode: 'contains', text: fail, fmt: { bg: C.bad, color: C.badT } });
  s.cf(rg('G'), { kind: 'bar', color: '#638ec6' });
  s.chart('col', 'L12:M20', t('Grade distribution', 'توزيع التقديرات'), 21, 11, 360, 240, { legend: false });
  s.w([38, 190, 110, 96, 80, 80, 80, 64, 70, 80, 24, 150, 90]).freeze(5, 2);
};

B.attendance = (wb, ar) => {
  const t = T(ar); const s = new SheetB(wb, t('Attendance', 'الحضور'));
  const N = 15;
  s.title(t('Attendance sheet', 'كشف حضور'), t('Type P = present, A = absent, E = excused. Warning below 75 %.', 'اكتب P = حاضر، A = غائب، E = بعذر. إنذار لو الحضور أقل من ٧٥٪.'), N + 7);
  s.head(3, 0, ['#', t('Student name', 'اسم الطالب'), t('Student ID', 'رقم الطالب'), ...Array.from({ length: N }, (_, i) => `${t('L', 'م')}${i + 1}`), t('Present', 'حضور'), t('Absent', 'غياب'), 'Att. %', t('Status', 'الحالة')]);
  const c0 = 3; const cE = c0 + N - 1; const cP = cE + 1;
  for (let i = 0; i < 25; i += 1) {
    const r = 4 + i; const x = r + 1; const a = colName(c0); const b = colName(cE);
    s.put(r, 0, i + 1, ST.center).put(r, 1, '', ST.input).put(r, 2, '', ST.input);
    for (let c = c0; c <= cE; c += 1) s.put(r, c, '', merge(ST.input, { al: 'center' }));
    s.put(r, cP, `=COUNTIF(${a}${x}:${b}${x},"P")+COUNTIF(${a}${x}:${b}${x},"E")`, ST.center);
    s.put(r, cP + 1, `=COUNTIF(${a}${x}:${b}${x},"A")`, ST.center);
    s.put(r, cP + 2, `=IF(${colName(cP)}${x}+${colName(cP + 1)}${x}=0,"",${colName(cP)}${x}/(${colName(cP)}${x}+${colName(cP + 1)}${x}))`, ST.pct0);
    s.put(r, cP + 3, `=IF(${colName(cP + 2)}${x}="","",IF(${colName(cP + 2)}${x}<0.75,"${t('Warning', 'إنذار')}","${t('OK', 'منتظم')}"))`, ST.center);
  }
  s.cf(`${colName(c0)}5:${colName(cE)}29`, { kind: 'text', tmode: 'contains', text: 'A', fmt: { bg: C.bad, color: C.badT } });
  s.cf(`${colName(c0)}5:${colName(cE)}29`, { kind: 'text', tmode: 'contains', text: 'P', fmt: { bg: C.ok, color: C.okT } });
  s.cf(`${colName(c0)}5:${colName(cE)}29`, { kind: 'text', tmode: 'contains', text: 'E', fmt: { bg: C.warn, color: C.warnT } });
  s.cf(`${colName(cP + 3)}5:${colName(cP + 3)}29`, { kind: 'text', tmode: 'contains', text: t('Warning', 'إنذار'), fmt: { bg: C.bad, color: C.badT, b: 1 } });
  s.cf(`${colName(cP + 2)}5:${colName(cP + 2)}29`, { kind: 'bar', color: '#63c384' });
  s.put(30, 1, t('Lecture attendance rate', 'نسبة حضور المحاضرة'), ST.total);
  for (let c = c0; c <= cE; c += 1) { const a = colName(c); s.put(30, c, `=IFERROR((COUNTIF(${a}5:${a}29,"P")+COUNTIF(${a}5:${a}29,"E"))/(COUNTIF(${a}5:${a}29,"P")+COUNTIF(${a}5:${a}29,"E")+COUNTIF(${a}5:${a}29,"A")),"")`, merge(ST.total, { nf: '0%', al: 'center' })); }
  s.w([34, 180, 100, ...Array(N).fill(36), 64, 64, 64, 74]).freeze(4, 2);
};

B.gpa = (wb, ar) => {
  const t = T(ar); const s = new SheetB(wb, t('GPA', 'المعدل'));
  s.title(t('GPA calculator', 'حاسبة المعدل التراكمي'), t('Enter course, credit hours and the letter grade. Edit the scale on the right if your university differs.', 'اكتب المقرر والساعات والتقدير. عدّل المقياس على اليمين لو جامعتك مختلفة.'), 8);
  s.head(3, 0, ['#', t('Course', 'المقرر'), t('Credit hours', 'الساعات'), t('Grade', 'التقدير'), t('Points', 'النقاط'), t('Quality points', 'نقاط الجودة')]);
  for (let i = 0; i < 12; i += 1) {
    const r = 4 + i; const x = r + 1;
    s.put(r, 0, i + 1, ST.center).put(r, 1, '', ST.input).put(r, 2, '', merge(ST.inputInt, { al: 'center' })).put(r, 3, '', merge(ST.input, { al: 'center' }));
    s.put(r, 4, `=IF(D${x}="","",IFERROR(VLOOKUP(UPPER(D${x}),$I$5:$J$13,2,FALSE),"?"))`, merge(ST.num, { al: 'center' }));
    s.put(r, 5, `=IF(OR(C${x}="",E${x}="",E${x}="?"),"",C${x}*E${x})`, ST.num);
  }
  s.put(16, 1, t('Total', 'الإجمالي'), ST.total).put(16, 2, '=SUM(C5:C16)', merge(ST.total, { al: 'center' })).put(16, 3, '', ST.total).put(16, 4, '', ST.total).put(16, 5, '=SUM(F5:F16)', ST.totalNum);
  s.put(18, 1, t('Semester GPA', 'معدل الفصل'), ST.kpiLabel).put(18, 2, '=IFERROR(F17/SUMPRODUCT((ISNUMBER(F5:F16))*(C5:C16)),"")', merge(ST.kpiVal, { nf: '0.00' }));
  s.put(19, 1, t('Previous credit hours', 'ساعات سابقة'), ST.text).put(19, 2, '', ST.inputInt);
  s.put(20, 1, t('Previous GPA', 'المعدل السابق'), ST.text).put(20, 2, '', ST.inputNum);
  s.put(21, 1, t('Cumulative GPA', 'المعدل التراكمي'), ST.kpiLabel).put(21, 2, '=IFERROR((C19*C20+F17)/(C19+SUMPRODUCT((ISNUMBER(F5:F16))*(C5:C16))),C18)', merge(ST.kpiVal, { nf: '0.00' }));
  s.put(3, 8, t('Grade', 'التقدير'), ST.head).put(3, 9, t('Points', 'النقاط'), ST.head);
  [['A+', 4], ['A', 4], ['A-', 3.7], ['B+', 3.3], ['B', 3], ['B-', 2.7], ['C+', 2.3], ['C', 2], ['D', 1], ['F', 0]].slice(0, 9).forEach(([g, p], i) => s.put(4 + i, 8, g, merge(ST.input, { al: 'center' })).put(4 + i, 9, p, merge(ST.inputNum, { al: 'center' })));
  s.put(13, 8, 'F', merge(ST.input, { al: 'center' })).put(13, 9, 0, merge(ST.inputNum, { al: 'center' }));
  s.w([34, 220, 100, 80, 80, 110, 24, 24, 70, 70]);
};

B.timetable = (wb, ar) => {
  const t = T(ar); const s = new SheetB(wb, t('Timetable', 'الجدول'));
  const days = ar ? ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] : ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];
  const slots = ['08:00 – 09:30', '09:40 – 11:10', '11:20 – 12:50', '13:00 – 14:30', '14:40 – 16:10', '16:20 – 17:50'];
  s.title(t('Weekly timetable', 'جدول المحاضرات الأسبوعي'), t('Type the course, room and doctor in each cell. Use the fill colour to group by course.', 'اكتب المقرر والقاعة والدكتور في كل خلية. استخدم لون التعبئة لتمييز المقررات.'), 7);
  s.head(3, 0, [t('Time', 'الوقت'), ...days], 30);
  const pal = ['#DDEBF7', '#E2F0D9', '#FFF2CC', '#FCE4D6', '#EADCF8', '#D9F2F0'];
  slots.forEach((sl, i) => {
    const r = 4 + i; s.put(r, 0, sl, merge(ST.label, { bd: bd(), al: 'center', va: 'center', bg: C.soft })); s.h(r, 64);
    days.forEach((_, d) => s.put(r, 1 + d, '', merge(ST.wrapText, { va: 'center', al: 'center', bg: (i + d) % 4 === 0 ? pal[(i + d) % 6] : C.white })));
  });
  s.put(11, 0, t('Notes', 'ملاحظات'), ST.label); s.put(12, 0, '', merge(ST.wrapText, {})); s.merge(12, 0, 14, 6);
  s.w([110, 150, 150, 150, 150, 150, 150]).freeze(4, 1);
};

B.tasks = (wb, ar) => {
  const t = T(ar); const s = new SheetB(wb, t('Tasks', 'المهام'));
  const st = [t('Not started', 'لم تبدأ'), t('In progress', 'قيد التنفيذ'), t('Done', 'مكتملة'), t('Blocked', 'متوقفة')];
  const pr = [t('High', 'عالية'), t('Medium', 'متوسطة'), t('Low', 'منخفضة')];
  s.title(t('Task tracker', 'متابعة المهام'), t(`Status values: ${st.join(' / ')}. Priority: ${pr.join(' / ')}.`, `قيم الحالة: ${st.join(' / ')}. الأولوية: ${pr.join(' / ')}.`), 9);
  s.head(3, 0, ['#', t('Task', 'المهمة'), t('Owner', 'المسؤول'), t('Priority', 'الأولوية'), t('Status', 'الحالة'), t('Start', 'البداية'), t('Due', 'الموعد'), t('Progress', 'التقدم'), t('Notes', 'ملاحظات')]);
  const demo = [[t('Define scope', 'تحديد النطاق'), t('Ahmed', 'أحمد'), pr[0], st[2], 1], [t('Design mock-ups', 'تصميم النماذج'), t('Sara', 'سارة'), pr[0], st[1], 0.6], [t('Build prototype', 'بناء نموذج أولي'), t('Omar', 'عمر'), pr[1], st[1], 0.3], [t('User testing', 'اختبار المستخدمين'), t('Mona', 'منى'), pr[1], st[0], 0], [t('Write documentation', 'كتابة التوثيق'), t('Ali', 'علي'), pr[2], st[3], 0.1]];
  for (let i = 0; i < 30; i += 1) {
    const r = 4 + i; const d = demo[i];
    s.put(r, 0, i + 1, ST.center).put(r, 1, d ? d[0] : '', ST.input).put(r, 2, d ? d[1] : '', ST.input).put(r, 3, d ? d[2] : '', merge(ST.input, { al: 'center' })).put(r, 4, d ? d[3] : '', merge(ST.input, { al: 'center' }));
    s.put(r, 5, '', merge(ST.input, { al: 'center' })).put(r, 6, '', merge(ST.input, { al: 'center' })).put(r, 7, d ? d[4] : '', merge(ST.inputPct, { nf: '0%', al: 'center' })).put(r, 8, '', ST.input);
  }
  const rg = (c) => `${c}5:${c}34`;
  st.forEach((x, i) => s.cf(rg('E'), { kind: 'text', tmode: 'contains', text: x, fmt: [{ bg: '#EDEDED', color: '#404040' }, { bg: '#DDEBF7', color: '#1F4E78' }, { bg: C.ok, color: C.okT }, { bg: C.bad, color: C.badT }][i] }));
  s.cf(rg('D'), { kind: 'text', tmode: 'contains', text: pr[0], fmt: { color: '#C00000', b: 1 } });
  s.cf(rg('H'), { kind: 'bar', color: '#638ec6' });
  s.put(3, 10, t('Status', 'الحالة'), ST.head).put(3, 11, t('Count', 'العدد'), ST.head);
  st.forEach((x, i) => s.put(4 + i, 10, x, ST.text).put(4 + i, 11, `=COUNTIF(${rg('E')},K${5 + i})`, merge(ST.int, { al: 'center' })));
  s.put(8, 10, t('Total tasks', 'إجمالي المهام'), ST.total).put(8, 11, '=COUNTA(B5:B34)', merge(ST.total, { al: 'center' }));
  s.put(9, 10, t('Overall progress', 'التقدم الكلي'), ST.kpiLabel).put(9, 11, '=IFERROR(AVERAGE(H5:H34),0)', merge(ST.kpiVal, { nf: '0%' }));
  s.chart('donut', 'K4:L8', t('Tasks by status', 'المهام حسب الحالة'), 11, 10, 340, 250);
  s.w([34, 220, 110, 90, 110, 90, 90, 90, 200, 24, 130, 70]).freeze(4, 2);
};

B.gantt = (wb, ar) => {
  const t = T(ar); const s = new SheetB(wb, t('Plan', 'الخطة')); const W = 16;
  s.title(t('Project plan (Gantt)', 'خطة المشروع (Gantt)'), t('Enter start week and duration (weeks): the bars draw themselves. Progress is shown in %.', 'اكتب أسبوع البداية والمدة (بالأسابيع) والأعمدة بترسم نفسها. التقدم بالنسبة المئوية.'), 5 + W);
  s.head(3, 0, ['#', t('Activity', 'النشاط'), t('Owner', 'المسؤول'), t('Start wk', 'أسبوع البداية'), t('Weeks', 'المدة'), t('Progress', 'التقدم'), ...Array.from({ length: W }, (_, i) => i + 1)]);
  const demo = [[t('Requirements', 'جمع المتطلبات'), 1, 2, 1], [t('Design', 'التصميم'), 2, 3, 0.8], [t('Development', 'التطوير'), 4, 6, 0.4], [t('Testing', 'الاختبار'), 9, 3, 0], [t('Deployment', 'النشر'), 12, 2, 0], [t('Handover', 'التسليم'), 14, 2, 0]];
  for (let i = 0; i < 20; i += 1) {
    const r = 4 + i; const x = r + 1; const d = demo[i];
    s.put(r, 0, i + 1, ST.center).put(r, 1, d ? d[0] : '', ST.input).put(r, 2, '', ST.input).put(r, 3, d ? d[1] : '', merge(ST.inputInt, { al: 'center' })).put(r, 4, d ? d[2] : '', merge(ST.inputInt, { al: 'center' })).put(r, 5, d ? d[3] : '', merge(ST.inputPct, { nf: '0%', al: 'center' }));
    for (let w = 0; w < W; w += 1) s.put(r, 6 + w, `=IF(AND($D${x}<>"",${colName(6 + w)}$4>=$D${x},${colName(6 + w)}$4<$D${x}+$E${x}),1,"")`, merge(ST.cell, { color: '#FFFFFF', fs: 8 }));
  }
  s.cf(`G5:${colName(5 + W)}24`, { kind: 'cell', op: 'eq', v1: 1, fmt: { bg: '#2F5496', color: '#2F5496' } });
  s.cf('F5:F24', { kind: 'bar', color: '#63c384' });
  s.w([34, 200, 110, 70, 64, 80, ...Array(W).fill(30)]).freeze(4, 2);
};

B.budget = (wb, ar) => {
  const t = T(ar); const s = new SheetB(wb, t('Budget', 'الميزانية'));
  s.title(t('Monthly budget', 'الميزانية الشهرية'), t('Fill the yellow cells. Differences turn red when you overspend.', 'املأ الخلايا الصفراء. الفرق بيبقى أحمر لو تخطيت المخطط.'), 5);
  s.head(3, 0, [t('Income', 'الدخل'), t('Planned', 'مخطط'), t('Actual', 'فعلي'), t('Difference', 'الفرق')]);
  [t('Salary', 'الراتب'), t('Freelance', 'عمل حر'), t('Other income', 'دخل آخر')].forEach((x, i) => { const r = 4 + i; s.put(r, 0, x, ST.input).put(r, 1, '', ST.inputNum).put(r, 2, '', ST.inputNum).put(r, 3, `=C${r + 1}-B${r + 1}`, ST.num); });
  s.put(7, 0, t('Total income', 'إجمالي الدخل'), ST.total).put(7, 1, '=SUM(B5:B7)', ST.totalNum).put(7, 2, '=SUM(C5:C7)', ST.totalNum).put(7, 3, '=C8-B8', ST.totalNum);
  s.head(9, 0, [t('Expenses', 'المصروفات'), t('Planned', 'مخطط'), t('Actual', 'فعلي'), t('Difference', 'الفرق')]);
  const cats = [t('Housing', 'السكن'), t('Utilities', 'المرافق'), t('Food', 'الطعام'), t('Transport', 'المواصلات'), t('Education', 'التعليم'), t('Health', 'الصحة'), t('Entertainment', 'الترفيه'), t('Savings', 'الادخار'), t('Other', 'أخرى')];
  cats.forEach((x, i) => { const r = 10 + i; s.put(r, 0, x, ST.input).put(r, 1, '', ST.inputNum).put(r, 2, '', ST.inputNum).put(r, 3, `=B${r + 1}-C${r + 1}`, ST.num); });
  s.put(19, 0, t('Total expenses', 'إجمالي المصروفات'), ST.total).put(19, 1, '=SUM(B11:B19)', ST.totalNum).put(19, 2, '=SUM(C11:C19)', ST.totalNum).put(19, 3, '=B20-C20', ST.totalNum);
  s.put(21, 0, t('Balance (income − expenses)', 'الرصيد (الدخل − المصروفات)'), ST.kpiLabel).put(21, 1, '=B8-B20', merge(ST.kpiVal, { nf: '#,##0.00' })).put(21, 2, '=C8-C20', merge(ST.kpiVal, { nf: '#,##0.00' }));
  s.put(22, 0, t('Savings rate', 'نسبة الادخار'), ST.kpiLabel).put(22, 1, '=IFERROR(B22/B8,"")', merge(ST.kpiVal, { nf: '0%' })).put(22, 2, '=IFERROR(C22/C8,"")', merge(ST.kpiVal, { nf: '0%' }));
  s.cf('D11:D19', { kind: 'cell', op: 'lt', v1: 0, fmt: { bg: C.bad, color: C.badT } });
  s.cf('D5:D7', { kind: 'cell', op: 'lt', v1: 0, fmt: { color: C.badT } });
  s.chart('col', 'A10:C19', t('Planned vs actual expenses', 'المصروفات: مخطط مقابل فعلي'), 3, 5, 480, 300);
  s.w([210, 100, 100, 100, 24]).freeze(3, 1);
};

B.expenses = (wb, ar) => {
  const t = T(ar); const s = new SheetB(wb, t('Expenses', 'المصروفات'));
  const cats = [t('Food', 'طعام'), t('Transport', 'مواصلات'), t('Bills', 'فواتير'), t('Shopping', 'تسوق'), t('Health', 'صحة'), t('Education', 'تعليم'), t('Other', 'أخرى')];
  s.title(t('Expense tracker', 'متابعة المصروفات'), t(`Categories: ${cats.join(', ')}`, `الفئات: ${cats.join('، ')}`), 5);
  s.head(3, 0, [t('Date', 'التاريخ'), t('Category', 'الفئة'), t('Description', 'البيان'), t('Amount', 'المبلغ'), t('Method', 'طريقة الدفع')]);
  for (let i = 0; i < 60; i += 1) { const r = 4 + i; s.put(r, 0, '', merge(ST.input, { al: 'center' })).put(r, 1, '', ST.input).put(r, 2, '', ST.input).put(r, 3, '', ST.inputNum).put(r, 4, '', ST.input); }
  s.put(3, 6, t('Category', 'الفئة'), ST.head).put(3, 7, t('Total', 'الإجمالي'), ST.head).put(3, 8, '%', ST.head);
  cats.forEach((x, i) => s.put(4 + i, 6, x, ST.text).put(4 + i, 7, `=SUMIF($B$5:$B$64,G${5 + i},$D$5:$D$64)`, ST.num).put(4 + i, 8, `=IFERROR(H${5 + i}/$H$12,0)`, ST.pct0));
  s.put(11, 6, t('Total', 'الإجمالي'), ST.total).put(11, 7, '=SUM(H5:H11)', ST.totalNum).put(11, 8, '', ST.total);
  s.put(12, 6, t('Entries', 'عدد العمليات'), ST.text).put(12, 7, '=COUNT(D5:D64)', ST.int);
  s.put(13, 6, t('Average', 'المتوسط'), ST.text).put(13, 7, '=IFERROR(AVERAGE(D5:D64),0)', ST.num);
  s.put(14, 6, t('Largest', 'الأكبر'), ST.text).put(14, 7, '=IF(COUNT(D5:D64)=0,0,MAX(D5:D64))', ST.num);
  s.cf('H5:H11', { kind: 'bar', color: '#ffb628' });
  s.chart('pie', 'G4:H11', t('Spending by category', 'المصروفات حسب الفئة'), 16, 6, 380, 280);
  s.w([100, 120, 220, 100, 110, 24, 120, 100, 64]).freeze(4, 0);
};

B.invoice = (wb, ar) => {
  const t = T(ar); const s = new SheetB(wb, t('Invoice', 'فاتورة'));
  s.put(0, 0, t('INVOICE', 'فاتورة'), merge(ST.title, { fs: 26 })); s.h(0, 42);
  s.put(0, 4, t('Invoice no.', 'رقم الفاتورة'), merge(ST.label, { al: 'right' })).put(0, 5, 'INV-0001', ST.input);
  s.put(1, 4, t('Date', 'التاريخ'), merge(ST.label, { al: 'right' })).put(1, 5, '', ST.input);
  s.put(2, 4, t('Due date', 'تاريخ الاستحقاق'), merge(ST.label, { al: 'right' })).put(2, 5, '', ST.input);
  s.put(1, 0, t('Company name', 'اسم الشركة'), merge(ST.input, { b: 1 })).merge(1, 0, 1, 2); s.put(2, 0, t('Address · phone · email', 'العنوان · الهاتف · البريد'), ST.input).merge(2, 0, 2, 2);
  s.put(4, 0, t('Bill to', 'العميل'), ST.label).put(5, 0, '', ST.input).merge(5, 0, 5, 2).put(6, 0, '', ST.input).merge(6, 0, 6, 2);
  s.head(8, 0, [t('Description', 'البيان'), t('Qty', 'الكمية'), t('Unit price', 'سعر الوحدة'), t('Amount', 'المبلغ')], 30);
  for (let i = 0; i < 10; i += 1) { const r = 9 + i; const x = r + 1; s.put(r, 0, '', ST.input).put(r, 1, '', merge(ST.inputInt, { al: 'center' })).put(r, 2, '', ST.inputNum).put(r, 3, `=IF(OR(B${x}="",C${x}=""),"",B${x}*C${x})`, ST.num); }
  s.put(20, 2, t('Subtotal', 'المجموع الفرعي'), merge(ST.label, { al: 'right' })).put(20, 3, '=SUM(D10:D19)', ST.num);
  s.put(21, 2, t('Discount %', 'نسبة الخصم'), merge(ST.label, { al: 'right' })).put(21, 3, 0, ST.inputPct);
  s.put(22, 2, t('Tax %', 'نسبة الضريبة'), merge(ST.label, { al: 'right' })).put(22, 3, 0.14, ST.inputPct);
  s.put(23, 2, t('Discount', 'الخصم'), merge(ST.label, { al: 'right' })).put(23, 3, '=-D21*D22', ST.num);
  s.put(24, 2, t('Tax', 'الضريبة'), merge(ST.label, { al: 'right' })).put(24, 3, '=(D21+D24)*D23', ST.num);
  s.put(25, 2, t('TOTAL', 'الإجمالي'), ST.kpiLabel).put(25, 3, '=D21+D24+D25', merge(ST.kpiVal, { nf: '#,##0.00' }));
  s.put(27, 0, t('Payment terms: within 14 days. Thank you for your business.', 'شروط الدفع: خلال ١٤ يومًا. شكرًا لتعاملكم معنا.'), ST.note);
  s.w([280, 80, 110, 120, 110, 110]);
};

B.loan = (wb, ar) => {
  const t = T(ar); const s = new SheetB(wb, t('Loan', 'القرض'));
  s.title(t('Loan calculator', 'حاسبة القرض'), t('Change the yellow cells; the schedule updates (up to 60 months).', 'غيّر الخلايا الصفراء والجدول بيتحدث (حتى ٦٠ شهر).'), 6);
  s.put(3, 0, t('Loan amount', 'مبلغ القرض'), ST.label).put(3, 1, 100000, ST.inputNum);
  s.put(4, 0, t('Annual interest rate', 'سعر الفائدة السنوي'), ST.label).put(4, 1, 0.18, ST.inputPct);
  s.put(5, 0, t('Years (max 5)', 'المدة بالسنوات (حتى ٥)'), ST.label).put(5, 1, 3, ST.inputInt);
  s.put(6, 0, t('Monthly payment', 'القسط الشهري'), ST.kpiLabel).put(6, 1, '=PMT(B5/12,B6*12,-B4)', merge(ST.kpiVal, { nf: '#,##0.00' }));
  s.put(7, 0, t('Total interest', 'إجمالي الفوائد'), ST.kpiLabel).put(7, 1, '=B7*B6*12-B4', merge(ST.kpiVal, { nf: '#,##0.00' }));
  s.put(8, 0, t('Total paid', 'إجمالي المدفوع'), ST.kpiLabel).put(8, 1, '=B4+B8', merge(ST.kpiVal, { nf: '#,##0.00' }));
  s.head(10, 0, [t('Month', 'الشهر'), t('Payment', 'القسط'), t('Interest', 'الفائدة'), t('Principal', 'أصل الدين'), t('Balance', 'الرصيد')]);
  for (let i = 0; i < 60; i += 1) {
    const r = 11 + i; const x = r + 1; const prev = i === 0 ? '$B$4' : `E${x - 1}`;
    s.put(r, 0, `=IF(${i + 1}<=$B$6*12,${i + 1},"")`, ST.center);
    s.put(r, 1, `=IF(A${x}="","",$B$7)`, ST.num);
    s.put(r, 2, `=IF(A${x}="","",${prev}*$B$5/12)`, ST.num);
    s.put(r, 3, `=IF(A${x}="","",B${x}-C${x})`, ST.num);
    s.put(r, 4, `=IF(A${x}="","",MAX(0,${prev}-D${x}))`, ST.num);
  }
  s.w([200, 120, 110, 110, 120]).freeze(11, 0);
};

B.inventory = (wb, ar) => {
  const t = T(ar); const s = new SheetB(wb, t('Inventory', 'المخزون'));
  s.title(t('Inventory', 'جرد المخزون'), t('Stock = received − issued. Rows turn red at or below the reorder level.', 'الرصيد = الوارد − المنصرف. الصف بيحمر عند حد إعادة الطلب أو أقل.'), 9);
  s.head(3, 0, ['#', t('Item', 'الصنف'), 'SKU', t('Received', 'وارد'), t('Issued', 'منصرف'), t('In stock', 'الرصيد'), t('Reorder at', 'حد الطلب'), t('Unit cost', 'تكلفة الوحدة'), t('Stock value', 'قيمة المخزون'), t('Status', 'الحالة')]);
  const demo = [[t('A4 paper ream', 'رزمة ورق A4'), 'PAP-01', 100, 62, 20, 85], [t('Blue pen (box)', 'أقلام زرقاء (علبة)'), 'PEN-02', 40, 31, 10, 60], [t('Stapler', 'دباسة'), 'STP-03', 15, 4, 5, 120], [t('Toner cartridge', 'خرطوشة حبر'), 'TON-04', 8, 6, 3, 950]];
  for (let i = 0; i < 40; i += 1) {
    const r = 4 + i; const x = r + 1; const d = demo[i];
    s.put(r, 0, i + 1, ST.center).put(r, 1, d ? d[0] : '', ST.input).put(r, 2, d ? d[1] : '', ST.input).put(r, 3, d ? d[2] : '', ST.inputInt).put(r, 4, d ? d[3] : '', ST.inputInt);
    s.put(r, 5, `=IF(AND(D${x}="",E${x}=""),"",N(D${x})-N(E${x}))`, merge(ST.int, { b: 1 })).put(r, 6, d ? d[4] : '', ST.inputInt).put(r, 7, d ? d[5] : '', ST.inputNum);
    s.put(r, 8, `=IF(F${x}="","",F${x}*N(H${x}))`, ST.num).put(r, 9, `=IF(F${x}="","",IF(F${x}<=0,"${t('Out of stock', 'نفذ')}",IF(F${x}<=N(G${x}),"${t('Reorder', 'أعد الطلب')}","${t('OK', 'متوفر')}")))`, ST.center);
  }
  s.cf('A5:J44', { kind: 'expr', expr: '=AND($F5<>"",$F5<=N($G5))', fmt: { bg: '#FDECEA', color: C.badT } });
  s.cf('J5:J44', { kind: 'text', tmode: 'contains', text: t('OK', 'متوفر'), fmt: { bg: C.ok, color: C.okT } });
  s.put(45, 7, t('Total value', 'إجمالي القيمة'), ST.total).put(45, 8, '=SUM(I5:I44)', ST.totalNum);
  s.put(46, 7, t('Items to reorder', 'أصناف تحتاج طلب'), ST.text).put(46, 8, `=COUNTIF(J5:J44,"${t('Reorder', 'أعد الطلب')}")+COUNTIF(J5:J44,"${t('Out of stock', 'نفذ')}")`, ST.int);
  s.w([34, 200, 80, 80, 80, 80, 80, 90, 110, 100]).freeze(4, 2);
};

B.sales = (wb, ar) => {
  const t = T(ar); const s = new SheetB(wb, t('Sales', 'المبيعات'));
  const mon = ar ? ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'] : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  s.title(t('Monthly sales tracker', 'متابعة المبيعات الشهرية'), t('Enter monthly sales per product. Totals, share and growth are calculated.', 'اكتب مبيعات كل منتج شهريًا. الإجماليات والنسب والنمو بتتحسب تلقائيًا.'), 16);
  s.head(3, 0, [t('Product', 'المنتج'), ...mon, t('Total', 'الإجمالي'), t('Share', 'النسبة')]);
  const r0 = rng(11); const prods = [t('Product A', 'منتج أ'), t('Product B', 'منتج ب'), t('Product C', 'منتج ج'), t('Product D', 'منتج د'), t('Product E', 'منتج هـ'), '', '', '', ''];
  prods.forEach((p, i) => {
    const r = 4 + i; const x = r + 1; s.put(r, 0, p, ST.input);
    for (let m = 0; m < 12; m += 1) s.put(r, 1 + m, p ? Math.round((800 + i * 250) * (0.8 + r0() * 0.6) * (1 + m * 0.02)) : '', ST.inputInt);
    s.put(r, 13, `=SUM(B${x}:M${x})`, merge(ST.int, { b: 1 })).put(r, 14, `=IFERROR(N${x}/$N$14,"")`, ST.pct0);
  });
  s.put(13, 0, t('Total', 'الإجمالي'), ST.total); for (let m = 1; m <= 13; m += 1) s.put(13, m, `=SUM(${colName(m)}5:${colName(m)}13)`, merge(ST.totalNum, { nf: '#,##0' })); s.put(13, 14, '', ST.total);
  s.put(14, 0, t('Growth vs previous month', 'النمو عن الشهر السابق'), ST.text); for (let m = 2; m <= 12; m += 1) s.put(14, m, `=IFERROR(${colName(m)}14/${colName(m - 1)}14-1,"")`, ST.pct); s.put(14, 1, '', ST.pct);
  s.cf('C15:M15', { kind: 'cell', op: 'lt', v1: 0, fmt: { color: C.badT, bg: '#FDECEA' } }).cf('C15:M15', { kind: 'cell', op: 'gt', v1: 0, fmt: { color: C.okT } });
  s.cf('B5:M13', { kind: 'scale', colors: ['#ffffff', '#63be7b'] });
  s.cf('O5:O13', { kind: 'bar', color: '#638ec6' });
  s.chart('line', 'A4:M9', t('Sales trend by product', 'اتجاه المبيعات لكل منتج'), 17, 0, 760, 300, { byRow: true });
  s.w([140, ...Array(12).fill(62), 90, 64]).freeze(4, 1);
};

B.kpi = (wb, ar) => {
  const t = T(ar); const s = new SheetB(wb, t('KPIs', 'المؤشرات'));
  s.title(t('KPI scorecard', 'لوحة مؤشرات الأداء'), t('Enter target and actual. Tick "lower is better" with 1 for cost-type KPIs.', 'اكتب المستهدف والفعلي. اكتب 1 في "الأقل أفضل" لمؤشرات التكلفة.'), 8);
  s.head(3, 0, ['#', t('KPI', 'المؤشر'), t('Unit', 'الوحدة'), t('Target', 'المستهدف'), t('Actual', 'الفعلي'), t('Lower is better (1)', 'الأقل أفضل (1)'), t('Achievement', 'نسبة التحقق'), t('Status', 'الحالة')], 40);
  const demo = [[t('Revenue', 'الإيرادات'), 'EGP', 500000, 463000, ''], [t('New customers', 'عملاء جدد'), '#', 120, 138, ''], [t('Customer satisfaction', 'رضا العملاء'), '%', 90, 86, ''], [t('Cost per lead', 'تكلفة العميل المحتمل'), 'EGP', 80, 72, 1], [t('Delivery time', 'زمن التسليم'), t('days', 'يوم'), 3, 4.2, 1]];
  for (let i = 0; i < 15; i += 1) {
    const r = 4 + i; const x = r + 1; const d = demo[i];
    s.put(r, 0, i + 1, ST.center).put(r, 1, d ? d[0] : '', ST.input).put(r, 2, d ? d[1] : '', merge(ST.input, { al: 'center' })).put(r, 3, d ? d[2] : '', ST.inputNum).put(r, 4, d ? d[3] : '', ST.inputNum).put(r, 5, d ? d[4] : '', merge(ST.inputInt, { al: 'center' }));
    s.put(r, 6, `=IF(OR(D${x}="",E${x}=""),"",IF(F${x}=1,D${x}/E${x},E${x}/D${x}))`, ST.pct0);
    s.put(r, 7, `=IF(G${x}="","",IF(G${x}>=1,"${t('On target', 'محقق')}",IF(G${x}>=0.85,"${t('Close', 'قريب')}","${t('Behind', 'متأخر')}")))`, merge(ST.center, { b: 1 }));
  }
  s.cf('H5:H19', { kind: 'text', tmode: 'contains', text: t('On target', 'محقق'), fmt: { bg: C.ok, color: C.okT } }).cf('H5:H19', { kind: 'text', tmode: 'contains', text: t('Close', 'قريب'), fmt: { bg: C.warn, color: C.warnT } }).cf('H5:H19', { kind: 'text', tmode: 'contains', text: t('Behind', 'متأخر'), fmt: { bg: C.bad, color: C.badT } });
  s.cf('G5:G19', { kind: 'bar', color: '#a55fa7' });
  s.put(20, 5, t('Overall', 'الإجمالي'), ST.kpiLabel).put(20, 6, '=IFERROR(AVERAGE(G5:G19),"")', merge(ST.kpiVal, { nf: '0%' }));
  s.w([34, 220, 70, 100, 100, 110, 100, 100]).freeze(4, 2);
};

B.habits = (wb, ar) => {
  const t = T(ar); const s = new SheetB(wb, t('Habits', 'العادات'));
  s.title(t('Habit tracker', 'متابع العادات'), t('Type 1 on a day the habit was done. Months of 31 days.', 'اكتب 1 في اليوم اللي اتعملت فيه العادة.'), 34);
  s.head(3, 0, [t('Habit', 'العادة'), ...Array.from({ length: 31 }, (_, i) => i + 1), t('Days', 'أيام'), '%'], 28);
  const hab = [t('Exercise', 'رياضة'), t('Read 20 min', 'قراءة ٢٠ دقيقة'), t('Drink 2 L water', 'شرب ٢ لتر ماء'), t('Sleep before 11', 'النوم قبل ١١'), t('Study', 'مذاكرة'), '', '', ''];
  hab.forEach((h, i) => { const r = 4 + i; const x = r + 1; s.put(r, 0, h, ST.input); for (let d = 1; d <= 31; d += 1) s.put(r, d, '', merge(ST.input, { al: 'center' })); s.put(r, 32, `=COUNTIF(B${x}:AF${x},1)`, ST.center).put(r, 33, `=IF(A${x}="","",AG${x}/31)`, ST.pct0); });
  s.cf('B5:AF12', { kind: 'cell', op: 'eq', v1: 1, fmt: { bg: '#63c384', color: '#63c384' } });
  s.cf('AH5:AH12', { kind: 'bar', color: '#db2777' });
  s.put(12, 0, t('Done per day', 'المنجز يوميًا'), ST.total); for (let d = 1; d <= 31; d += 1) s.put(12, d, `=COUNTIF(${colName(d)}5:${colName(d)}12,1)`, merge(ST.total, { al: 'center' }));
  s.w([170, ...Array(31).fill(26), 56, 56]).freeze(4, 1);
};

/* ------------------------------------------------------------------------------------------------ entry */
Object.assign(B, DATA_BUILDERS, PRO_BUILDERS);

/* ---- charts for the classic templates: small summary tables next to the data feed them ---- */
const wrap = (wb, sh) => Object.assign(Object.create(SheetB.prototype), { wb, sh, name: sh.name });
const ENH = {};
ENH.kpi = (s, t) => {
  s.head(3, 9, [t('KPI', 'المؤشر'), t('Achievement', 'التحقق')], 40);
  for (let i = 0; i < 8; i += 1) s.put(4 + i, 9, `=IF(B${5 + i}="","",B${5 + i})`, ST.text).put(4 + i, 10, `=IF(G${5 + i}="","",G${5 + i})`, ST.pct0);
  s.w([180, 90], 9).chart('bar', 'J4:K12', t('Achievement by KPI', 'التحقق لكل مؤشر'), 12, 9, 460, 280, { legend: false });
};
ENH.attendance = (s, t) => {
  s.put(33, 1, t('Lecture', 'المحاضرة'), ST.head).put(34, 1, t('Attendance %', 'نسبة الحضور'), ST.text);
  for (let c = 3; c <= 17; c += 1) s.put(33, c, `${t('L', 'م')}${c - 2}`, ST.head).put(34, c, `=N(${colName(c)}31)`, ST.pct0);
  s.chart('line', 'D34:R35', t('Attendance rate by lecture', 'نسبة الحضور لكل محاضرة'), 36, 1, 700, 260, { byRow: true, legend: false });
};
ENH.loan = (s, t) => {
  s.chart('line', 'E11:E71', t('Remaining balance', 'الرصيد المتبقي'), 3, 6, 480, 270, { legend: false });
  s.chart('area', 'C11:D71', t('Interest vs principal', 'الفائدة مقابل أصل الدين'), 19, 6, 480, 270, {});
};
ENH.inventory = (s, t) => {
  s.head(3, 11, [t('Item', 'الصنف'), t('In stock', 'الرصيد')], 28);
  for (let i = 0; i < 8; i += 1) s.put(4 + i, 11, `=IF(B${5 + i}="","",B${5 + i})`, ST.text).put(4 + i, 12, `=IF(F${5 + i}="",0,F${5 + i})`, ST.int);
  s.w([170, 80], 11).chart('col', 'L4:M12', t('Stock by item', 'الرصيد لكل صنف'), 13, 11, 460, 270, { legend: false });
};
ENH.gpa = (s, t) => {
  s.head(3, 11, [t('Course', 'المقرر'), t('Points', 'النقاط')], 28);
  for (let i = 0; i < 8; i += 1) s.put(4 + i, 11, `=IF(B${5 + i}="","",B${5 + i})`, ST.text).put(4 + i, 12, `=IF(E${5 + i}="",0,N(E${5 + i}))`, ST.num);
  s.w([170, 80], 11).chart('col', 'L4:M12', t('Grade points per course', 'نقاط كل مقرر'), 13, 11, 460, 260, { legend: false });
};
ENH.habits = (s, t) => {
  s.head(14, 0, [t('Habit', 'العادة'), t('Completion', 'الإنجاز')], 26);
  for (let i = 0; i < 8; i += 1) s.put(15 + i, 0, `=IF(A${5 + i}="","",A${5 + i})`, ST.text).put(15 + i, 1, `=IF(AH${5 + i}="",0,AH${5 + i})`, ST.pct0);
  s.chart('bar', 'A15:B23', t('Completion by habit', 'إنجاز كل عادة'), 14, 3, 520, 270, { legend: false });
};

export function buildTemplateWorkbook(id, { ar = false } = {}) {
  const wb = newBook(); const fn = B[id];
  if (!fn) { new SheetB(wb, ar ? 'ورقة1' : 'Sheet1'); return wb; }
  wb._accent = (XLSX_TEMPLATES.find((x) => x.id === id) || {}).color;
  fn(wb, ar, { SheetB, ST, C, bd, merge, addr, colName, q, rng });
  if (ENH[id]) ENH[id](wrap(wb, wb.sheets[0]), T(ar));
  wb.touch();
  return wb;
}
