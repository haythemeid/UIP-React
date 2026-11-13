/**
 * Quick blocks (Insert ▸ Blocks): ready-made pieces you drop at the cursor — call-outs, banners, columns, cards, forms, photo grids.
 * To add one, add an entry to BLOCKS (or export `blocks` from a template pack in ./docxPacks).
 *   { id, group, label:{en,ar}, color, html({ ar, title, today }) -> string }
 */
import { C, p, sp, b, big, grid, row, td, kv, sign, banner, callout, table, head, blank, esc } from './docxHtml';

export const BLOCK_GROUPS = [
  { id: 'callouts', label: { en: 'Call-outs', ar: 'مربعات تنبيه' } },
  { id: 'layout', label: { en: 'Layout', ar: 'تخطيط' } },
  { id: 'forms', label: { en: 'Forms & signatures', ar: 'نماذج وتوقيعات' } },
  { id: 'photos', label: { en: 'Photo layouts', ar: 'تخطيطات صور' } },
];
const L = (ar) => (en, a) => (ar ? a : en);
const cell = (head1, body, c) => td(p(sp(head1, `color:${c};font-weight:bold;font-size:13pt`)) + p(body), `border-top:3pt solid ${c};background-color:#FFFFFF`);
const dropHere = (t) => td(p(sp(t, 'color:#94a3b8'), 'text-align:center;margin-top:26pt;margin-bottom:26pt'), 'background-color:#F1F5F9');

export const BLOCKS = [
  { id: 'note', group: 'callouts', color: '#2F5496', label: { en: 'Note', ar: 'ملاحظة' }, html: ({ ar }) => callout(L(ar)('Note', 'ملاحظة'), L(ar)('Write the note here.', 'اكتب الملاحظة هنا.')) },
  { id: 'tip', group: 'callouts', color: '#15803d', label: { en: 'Tip', ar: 'نصيحة' }, html: ({ ar }) => callout(L(ar)('Tip', 'نصيحة'), L(ar)('A helpful tip.', 'نصيحة مفيدة.'), C.green, '#E8F5EC') },
  { id: 'warn', group: 'callouts', color: '#b45309', label: { en: 'Warning', ar: 'تحذير' }, html: ({ ar }) => callout(L(ar)('Warning', 'تحذير'), L(ar)('Something to be careful about.', 'حاجة لازم تاخد بالك منها.'), C.amber, '#FEF3E2') },
  { id: 'danger', group: 'callouts', color: '#b91c1c', label: { en: 'Important', ar: 'مهم جدًا' }, html: ({ ar }) => callout(L(ar)('Important', 'مهم جدًا'), L(ar)('Do not skip this.', 'متتخطاش ده.'), C.red, '#FDECEC') },
  { id: 'quote', group: 'callouts', color: '#7c3aed', label: { en: 'Big quote', ar: 'اقتباس كبير' }, html: ({ ar }) => grid(row(td(p(sp('“', 'font-size:40pt;color:#7c3aed;font-weight:bold'), 'text-align:center;margin-bottom:0') + p(sp(L(ar)('A quote that deserves attention.', 'اقتباس يستحق الانتباه.'), 'font-size:15pt;font-style:italic;color:#4c1d95'), 'text-align:center') + p(sp(L(ar)('— Author', '— المصدر'), 'color:#6b7280'), 'text-align:center'), 'background-color:#F5F0FF'))) },
  { id: 'banner', group: 'layout', color: '#1F3864', label: { en: 'Title banner', ar: 'شريط عنوان' }, html: ({ ar, title }) => banner(esc(title || L(ar)('Section title', 'عنوان القسم')), C.navy, 22) },
  { id: 'cols2', group: 'layout', color: '#0d9488', label: { en: 'Two columns', ar: 'عمودين' }, html: ({ ar }) => grid(row(td(p(b(L(ar)('Column one', 'العمود الأول'))) + p(L(ar)('Text…', 'نص…'))), td(p(b(L(ar)('Column two', 'العمود الثاني'))) + p(L(ar)('Text…', 'نص…'))))) },
  { id: 'cols3', group: 'layout', color: '#0284c7', label: { en: 'Three cards', ar: 'ثلاث بطاقات' }, html: ({ ar }) => grid(row(cell(L(ar)('First', 'الأولى'), L(ar)('Short description.', 'وصف قصير.'), C.blue), cell(L(ar)('Second', 'الثانية'), L(ar)('Short description.', 'وصف قصير.'), C.green), cell(L(ar)('Third', 'الثالثة'), L(ar)('Short description.', 'وصف قصير.'), C.amber))) },
  { id: 'stats', group: 'layout', color: '#2563eb', label: { en: 'Key numbers', ar: 'أرقام رئيسية' }, html: ({ ar }) => grid(row(...[['98%', L(ar)('Satisfaction', 'رضا')], ['1,250', L(ar)('Users', 'مستخدم')], ['24/7', L(ar)('Support', 'دعم')]].map(([n, t]) => td(p(big(n, 26, C.blue), 'text-align:center;margin-bottom:0') + p(sp(t, 'color:#6b7280'), 'text-align:center'), 'background-color:#F4F7FD')))) },
  { id: 'proscons', group: 'layout', color: '#16a34a', label: { en: 'Pros & cons', ar: 'مميزات وعيوب' }, html: ({ ar }) => grid(row(td(p(sp(L(ar)('Pros', 'المميزات'), `color:${C.green};font-weight:bold`)) + p('✓ …') + p('✓ …'), 'background-color:#E8F5EC'), td(p(sp(L(ar)('Cons', 'العيوب'), `color:${C.red};font-weight:bold`)) + p('✗ …') + p('✗ …'), 'background-color:#FDECEC'))) },
  { id: 'steps', group: 'layout', color: '#e5484d', label: { en: 'Numbered steps', ar: 'خطوات مرقمة' }, html: ({ ar }) => grid(...[1, 2, 3].map((n) => row(td(p(sp(String(n), 'color:#fff;font-weight:bold;font-size:16pt'), 'text-align:center;margin-top:4pt;margin-bottom:4pt'), `background-color:${C.navy};width:9%`), td(p(b(L(ar)(`Step ${n}`, `الخطوة ${n}`))) + p(L(ar)('What to do.', 'اللي هتعمله.')))))) },
  { id: 'timeline', group: 'layout', color: '#0ea5e9', label: { en: 'Timeline table', ar: 'جدول زمني' }, html: ({ ar }) => table(head(L(ar)('Date', 'التاريخ'), L(ar)('Milestone', 'المرحلة'), L(ar)('Owner', 'المسؤول')), blank(4, 3)) },
  { id: 'info', group: 'forms', color: '#475569', label: { en: 'Information form', ar: 'نموذج بيانات' }, html: ({ ar }) => kv([[L(ar)('Name', 'الاسم'), ''], [L(ar)('ID', 'الرقم'), ''], [L(ar)('Phone', 'الهاتف'), ''], [L(ar)('Email', 'البريد'), ''], [L(ar)('Date', 'التاريخ'), ''], [L(ar)('Notes', 'ملاحظات'), '']], 2) },
  { id: 'sign2', group: 'forms', color: '#64748b', label: { en: 'Two signatures', ar: 'توقيعان' }, html: ({ ar }) => sign(L(ar)('Prepared by', 'إعداد'), L(ar)('Approved by', 'اعتماد')) },
  { id: 'sign3', group: 'forms', color: '#64748b', label: { en: 'Three signatures', ar: 'ثلاث توقيعات' }, html: ({ ar }) => sign(L(ar)('Prepared by', 'إعداد'), L(ar)('Reviewed by', 'مراجعة'), L(ar)('Approved by', 'اعتماد')) },
  { id: 'check', group: 'forms', color: '#16a34a', label: { en: 'Checklist', ar: 'قائمة تحقق' }, html: ({ ar }) => ['☐  ' + L(ar)('First item', 'البند الأول'), '☐  ' + L(ar)('Second item', 'البند الثاني'), '☐  ' + L(ar)('Third item', 'البند الثالث')].map((t) => p(t)).join('') },
  { id: 'line', group: 'forms', color: '#94a3b8', label: { en: 'Fill-in lines', ar: 'سطور للكتابة' }, html: () => [1, 2, 3, 4].map(() => p('', 'border-bottom:1pt solid #94a3b8;margin-bottom:14pt')).join('') },
  { id: 'photos2', group: 'photos', color: '#7c3aed', label: { en: '2 photos', ar: 'صورتان' }, html: ({ ar }) => grid(row(dropHere(L(ar)('Drop picture 1 here', 'ضع الصورة الأولى هنا')), dropHere(L(ar)('Drop picture 2 here', 'ضع الصورة الثانية هنا'))), row(td(p(sp(L(ar)('Caption', 'تعليق'), 'color:#64748b;font-style:italic'), 'text-align:center')), td(p(sp(L(ar)('Caption', 'تعليق'), 'color:#64748b;font-style:italic'), 'text-align:center')))) },
  { id: 'photos3', group: 'photos', color: '#7c3aed', label: { en: '3 photos', ar: 'ثلاث صور' }, html: ({ ar }) => grid(row(...[1, 2, 3].map((n) => dropHere(L(ar)(`Picture ${n}`, `صورة ${n}`))))) },
  { id: 'photos4', group: 'photos', color: '#7c3aed', label: { en: '2 × 2 grid', ar: 'شبكة 2×2' }, html: ({ ar }) => grid(row(dropHere(L(ar)('Picture 1', 'صورة 1')), dropHere(L(ar)('Picture 2', 'صورة 2'))), row(dropHere(L(ar)('Picture 3', 'صورة 3')), dropHere(L(ar)('Picture 4', 'صورة 4')))) },
  { id: 'photoText', group: 'photos', color: '#7c3aed', label: { en: 'Picture + text', ar: 'صورة ونص' }, html: ({ ar }) => grid(row(dropHere(L(ar)('Picture', 'الصورة')), td(p(b(L(ar)('Heading', 'العنوان'))) + p(L(ar)('Write the description next to the picture.', 'اكتب الوصف جنب الصورة.'))))) },
];
