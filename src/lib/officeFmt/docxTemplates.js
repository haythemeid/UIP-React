/**
 * Ready-made Word templates (HTML in the exact shape the editor / .docx writer use: inline styles, tables, rules).
 *   DOCX_TEMPLATES  -> [{ id, group, label:{en,ar}, hint:{en,ar}, color }]
 *   docxTemplateHtml(id, { ar, title }) -> HTML string for the document body
 */
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const today = (ar) => new Date().toLocaleDateString(ar ? 'ar-EG' : 'en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
const NAVY = '#1F3864'; const BLUE = '#2F5496'; const GREY = '#595959'; const SOFT = '#E8EEF9';
const p = (t = '', st = '', extra = '') => `<p${st ? ` style="${st}"` : ''}${extra}>${t}</p>`;
const sp = (t, st) => `<span style="${st}">${t}</span>`;
const rule = (c = NAVY, w = '1.5pt') => `<p style="border-bottom:${w} solid ${c};margin-bottom:8pt"></p>`;
const th = (t, bg = NAVY, w = '') => `<th style="background-color:${bg};${w ? `width:${w};` : ''}text-align:center"><p style="text-align:center">${sp(t, 'color:#FFFFFF;font-weight:bold')}</p></th>`;
const td = (t = '', st = '') => `<td${st ? ` style="${st}"` : ''}><p>${t}</p></td>`;
const empty = (n, cols) => Array.from({ length: n }, () => `<tr>${Array.from({ length: cols }, () => td()).join('')}</tr>`).join('');
const h1 = (t) => `<h1 style="color:${NAVY}">${t}</h1>`;
const h2 = (t) => `<h2 style="color:${BLUE}">${t}</h2>`;

export const DOCX_TEMPLATES = [
  { id: 'blank', group: 'basic', color: '#64748b', label: { en: 'Blank document', ar: 'مستند فارغ' }, hint: { en: 'Start from nothing', ar: 'ابدأ من الصفر' } },
  { id: 'report', group: 'work', color: '#2b6cdf', label: { en: 'Professional report', ar: 'تقرير احترافي' }, hint: { en: 'Cover, summary, sections', ar: 'غلاف وملخص وأقسام' } },
  { id: 'cover', group: 'academic', color: '#7c3aed', label: { en: 'Assignment / research cover', ar: 'غلاف بحث / تكليف' }, hint: { en: 'University cover page', ar: 'صفحة غلاف جامعية' } },
  { id: 'letter', group: 'work', color: '#0d9488', label: { en: 'Formal letter', ar: 'خطاب رسمي' }, hint: { en: 'Letterhead and signature', ar: 'ترويسة وتوقيع' } },
  { id: 'resume', group: 'work', color: '#ea580c', label: { en: 'Résumé / CV', ar: 'سيرة ذاتية' }, hint: { en: 'Two-column CV', ar: 'سيرة بعمودين' } },
  { id: 'minutes', group: 'work', color: '#16a34a', label: { en: 'Meeting minutes', ar: 'محضر اجتماع' }, hint: { en: 'Agenda, decisions, actions', ar: 'جدول أعمال وقرارات ومهام' } },
  { id: 'invoice', group: 'work', color: '#ca8a04', label: { en: 'Invoice', ar: 'فاتورة' }, hint: { en: 'Items table with totals', ar: 'جدول بنود وإجمالي' } },
  { id: 'proposal', group: 'work', color: '#e5484d', label: { en: 'Project proposal', ar: 'مقترح مشروع' }, hint: { en: 'Goals, plan, budget', ar: 'أهداف وخطة وميزانية' } },
  { id: 'lab', group: 'academic', color: '#0284c7', label: { en: 'Lab report', ar: 'تقرير معمل' }, hint: { en: 'Aim, method, results', ar: 'الهدف والطريقة والنتائج' } },
  { id: 'certificate', group: 'basic', color: '#b45309', label: { en: 'Certificate', ar: 'شهادة تقدير' }, hint: { en: 'Centered, framed', ar: 'متوسطة بإطار' } },
];

export function docxTemplateHtml(id, { ar = false, title = '' } = {}) {
  const t = esc(title || (ar ? 'عنوان المستند' : 'Document title'));
  const L = (en, a) => (ar ? a : en); const al = ar ? 'right' : 'left';
  switch (id) {
    case 'report': return [
      p(sp(L('REPORT', 'تقرير'), `color:${BLUE};font-size:12pt;font-weight:bold`), 'text-align:center;margin-top:90pt'),
      p(sp(t, `color:${NAVY};font-size:30pt;font-weight:bold`), 'text-align:center;margin-bottom:6pt'), rule(),
      p(sp(L('Prepared by: ..................', 'إعداد: ..................'), `color:${GREY};font-size:13pt`), 'text-align:center;margin-top:10pt'),
      p(sp(today(ar), `color:${GREY};font-size:12pt`), 'text-align:center'), '<hr data-pb="1">',
      h1(L('Executive summary', 'الملخص التنفيذي')), p(L('Write the key findings in three to five sentences.', 'اكتب أهم النتائج في ثلاث إلى خمس جمل.')),
      h1(L('1. Introduction', '١. المقدمة')), p(), h2(L('1.1 Background', '١.١ الخلفية')), p(), h2(L('1.2 Objectives', '١.٢ الأهداف')),
      `<ul><li>${L('First objective', 'الهدف الأول')}</li><li>${L('Second objective', 'الهدف الثاني')}</li></ul>`,
      h1(L('2. Findings', '٢. النتائج')), p(),
      `<table><tbody><tr>${th(L('Item', 'البند'))}${th(L('Result', 'النتيجة'))}${th(L('Notes', 'ملاحظات'))}</tr>${empty(3, 3)}</tbody></table>`, p(),
      h1(L('3. Conclusion and recommendations', '٣. الخلاصة والتوصيات')), p(),
    ].join('');
    case 'cover': return [
      p(sp(L('University / Faculty', 'الجامعة / الكلية'), `color:${NAVY};font-size:18pt;font-weight:bold`), 'text-align:center;margin-top:20pt'),
      p(sp(L('Department of ..................', 'قسم ..................'), `color:${GREY};font-size:14pt`), 'text-align:center'), rule(NAVY, '3pt'),
      p(sp(t, `color:${NAVY};font-size:28pt;font-weight:bold`), 'text-align:center;margin-top:110pt;margin-bottom:14pt'),
      p(sp(L('Course: ..................', 'المقرر: ..................'), 'font-size:14pt'), 'text-align:center'), rule('#8EAADB', '1pt'),
      `<table data-b="none"><tbody><tr>${td(sp(L('Prepared by', 'إعداد الطالب'), `color:${BLUE};font-weight:bold`) + '<br>..................<br>..................', 'width:50%')}${td(sp(L('Supervised by', 'إشراف'), `color:${BLUE};font-weight:bold`) + '<br>Dr. ..................', 'width:50%')}</tr></tbody></table>`,
      p(sp(`${L('Academic year', 'العام الدراسي')} ${new Date().getFullYear()} / ${new Date().getFullYear() + 1}`, `color:${GREY};font-size:12pt`), 'text-align:center;margin-top:90pt'), '<hr data-pb="1">', p(),
    ].join('');
    case 'letter': return [
      p(sp(L('Organisation name', 'اسم الجهة'), `color:${NAVY};font-size:20pt;font-weight:bold`), `text-align:${al}`),
      p(sp(L('Address · Phone · Email', 'العنوان · الهاتف · البريد الإلكتروني'), `color:${GREY};font-size:10pt`), `text-align:${al}`), rule(),
      p(today(ar), `text-align:${al};margin-top:14pt`), p(),
      p(L('Mr. / Ms. ..................', 'السيد / السيدة ..................'), 'font-weight:bold'), p(L('Dear Sir / Madam,', 'تحية طيبة وبعد،')),
      p(`${L('Subject:', 'الموضوع:')} ${sp('..................', 'font-weight:bold')}`),
      p(L('I am writing to you regarding .................. Please find the details below.', 'أكتب إليكم بخصوص .................. وتجدون التفاصيل أدناه.'), 'text-align:justify'), p(),
      p(L('Thank you for your time and consideration.', 'وتفضلوا بقبول فائق الاحترام والتقدير،')), p(), p(L('Sincerely,', 'مع خالص التحية،')), p(), p(sp('..................', 'font-weight:bold')), p(L('Position', 'المنصب')),
    ].join('');
    case 'resume': return [
      p(sp(L('Your Full Name', 'الاسم بالكامل'), `color:${NAVY};font-size:28pt;font-weight:bold`), `text-align:${al};margin-bottom:0`),
      p(sp(L('Professional title', 'المسمى الوظيفي'), `color:${BLUE};font-size:14pt`), `text-align:${al}`),
      p(sp(L('email@example.com  ·  +20 000 000 0000  ·  City, Country', 'email@example.com  ·  ٠٠٠٠٠٠٠٠٠٠٠  ·  المدينة، الدولة'), `color:${GREY};font-size:10.5pt`), `text-align:${al}`), rule(),
      `<table data-b="none"><tbody><tr><td style="width:34%;background-color:${SOFT}"><p>${sp(L('SKILLS', 'المهارات'), `color:${NAVY};font-weight:bold`)}</p><ul><li>${L('Skill one', 'مهارة أولى')}</li><li>${L('Skill two', 'مهارة ثانية')}</li><li>${L('Skill three', 'مهارة ثالثة')}</li></ul><p>${sp(L('LANGUAGES', 'اللغات'), `color:${NAVY};font-weight:bold`)}</p><p>${L('Arabic — native', 'العربية — الأم')}</p><p>${L('English — fluent', 'الإنجليزية — بطلاقة')}</p><p>${sp(L('CONTACT', 'التواصل'), `color:${NAVY};font-weight:bold`)}</p><p>linkedin.com/in/..........</p></td><td style="width:66%"><p>${sp(L('PROFILE', 'نبذة'), `color:${NAVY};font-weight:bold`)}</p><p>${L('Two or three lines about who you are and what you do best.', 'سطران أو ثلاثة عن من أنت وما تتقنه.')}</p><p>${sp(L('EXPERIENCE', 'الخبرات'), `color:${NAVY};font-weight:bold`)}</p><p>${sp(L('Job title — Company', 'المسمى — الشركة'), 'font-weight:bold')}<br>${sp('2024 – 2026', `color:${GREY}`)}</p><ul><li>${L('Achievement with a number', 'إنجاز مدعّم برقم')}</li><li>${L('Another achievement', 'إنجاز آخر')}</li></ul><p>${sp(L('EDUCATION', 'التعليم'), `color:${NAVY};font-weight:bold`)}</p><p>${sp(L('Degree — University', 'الدرجة — الجامعة'), 'font-weight:bold')}<br>${sp('2022 – 2026', `color:${GREY}`)}</p></td></tr></tbody></table>`,
    ].join('');
    case 'minutes': return [
      h1(t), p(`${L('Date', 'التاريخ')}: ${today(ar)}   |   ${L('Place', 'المكان')}: ..................`), p(`${L('Attendees', 'الحضور')}: ..................`), rule('#8EAADB', '1pt'),
      h2(L('Agenda', 'جدول الأعمال')), '<ol><li></li><li></li></ol>', h2(L('Discussion', 'النقاش')), p(),
      h2(L('Decisions & actions', 'القرارات والمهام')),
      `<table><tbody><tr>${th(L('Decision / action', 'القرار / المهمة'), NAVY, '50%')}${th(L('Owner', 'المسؤول'), NAVY, '25%')}${th(L('Due date', 'الموعد'), NAVY, '25%')}</tr>${empty(4, 3)}</tbody></table>`, p(),
      p(`${L('Next meeting', 'الاجتماع القادم')}: ..................`),
    ].join('');
    case 'invoice': return [
      `<table data-b="none"><tbody><tr>${td(sp(L('INVOICE', 'فاتورة'), `color:${NAVY};font-size:28pt;font-weight:bold`) + `<br>${L('No.', 'رقم')} 0001`, 'width:55%')}${td(sp(L('Company name', 'اسم الشركة'), 'font-weight:bold') + `<br>${L('Address', 'العنوان')}<br>${L('Phone · Email', 'الهاتف · البريد')}`, 'width:45%')}</tr></tbody></table>`, rule(),
      p(`${sp(L('Bill to', 'العميل'), `color:${BLUE};font-weight:bold`)}: ..................`), p(`${sp(L('Date', 'التاريخ'), `color:${BLUE};font-weight:bold`)}: ${today(ar)}`),
      `<table><tbody><tr>${th(L('Description', 'البيان'), NAVY, '46%')}${th(L('Qty', 'الكمية'), NAVY, '14%')}${th(L('Unit price', 'السعر'), NAVY, '20%')}${th(L('Total', 'الإجمالي'), NAVY, '20%')}</tr>${empty(5, 4)}<tr>${td('', `background-color:${SOFT}`)}${td('', `background-color:${SOFT}`)}${td(sp(L('Total', 'الإجمالي'), 'font-weight:bold'), `background-color:${SOFT}`)}${td('', `background-color:${SOFT}`)}</tr></tbody></table>`, p(),
      p(sp(L('Payment terms: within 14 days. Thank you for your business.', 'شروط الدفع: خلال ١٤ يومًا. شكرًا لتعاملكم معنا.'), `color:${GREY}`)),
    ].join('');
    case 'proposal': return [
      p(sp(L('PROJECT PROPOSAL', 'مقترح مشروع'), `color:${BLUE};font-weight:bold`), 'text-align:center;margin-top:50pt'), p(sp(t, `color:${NAVY};font-size:26pt;font-weight:bold`), 'text-align:center'), rule(),
      h1(L('Problem', 'المشكلة')), p(), h1(L('Proposed solution', 'الحل المقترح')), p(), h1(L('Goals', 'الأهداف')), '<ul><li></li><li></li><li></li></ul>',
      h1(L('Timeline', 'الجدول الزمني')), `<table><tbody><tr>${th(L('Phase', 'المرحلة'))}${th(L('Duration', 'المدة'))}${th(L('Deliverable', 'المخرج'))}</tr>${empty(3, 3)}</tbody></table>`, p(),
      h1(L('Budget', 'الميزانية')), `<table><tbody><tr>${th(L('Item', 'البند'))}${th(L('Cost', 'التكلفة'))}</tr>${empty(3, 2)}</tbody></table>`, p(),
    ].join('');
    case 'lab': return [
      h1(t), p(`${L('Student', 'الطالب')}: ..................   |   ${L('Date', 'التاريخ')}: ${today(ar)}`), rule('#8EAADB', '1pt'),
      h2(L('Aim', 'الهدف')), p(), h2(L('Apparatus & materials', 'الأدوات والمواد')), '<ul><li></li><li></li></ul>', h2(L('Method', 'الطريقة')), '<ol><li></li><li></li></ol>',
      h2(L('Results', 'النتائج')), `<table><tbody><tr>${th(L('Trial', 'المحاولة'))}${th(L('Measurement', 'القياس'))}${th(L('Notes', 'ملاحظات'))}</tr>${empty(4, 3)}</tbody></table>`, p(), h2(L('Discussion', 'المناقشة')), p(), h2(L('Conclusion', 'الخلاصة')), p(),
    ].join('');
    case 'certificate': return [
      p(sp(L('CERTIFICATE', 'شهادة'), `color:${NAVY};font-size:40pt;font-weight:bold`), `text-align:center;margin-top:70pt;border-top:4.5pt double ${NAVY};padding-top:20pt`),
      p(sp(L('OF APPRECIATION', 'تقدير'), `color:${BLUE};font-size:18pt`), 'text-align:center'), p(sp(L('This certificate is proudly presented to', 'تُمنح هذه الشهادة إلى'), `color:${GREY};font-size:13pt`), 'text-align:center;margin-top:30pt'),
      p(sp(L('Recipient Name', 'اسم المتلقي'), `color:${NAVY};font-size:30pt;font-weight:bold`), 'text-align:center'), p(L('in recognition of outstanding effort and achievement.', 'تقديرًا لجهوده المتميزة وإنجازه.'), 'text-align:center;font-size:13pt'),
      p(sp(today(ar), `color:${GREY}`), `text-align:center;margin-top:50pt;border-bottom:4.5pt double ${NAVY};padding-bottom:20pt`),
    ].join('');
    default: return '<p></p>';
  }
}

/** Document looks: one click sets heading colours / fonts for the whole document. */
export const DOC_THEMES = [
  { id: 'office', label: { en: 'Office', ar: 'أوفيس' }, font: 'Calibri', head: '#2F5496', sub: '#1F3763' },
  { id: 'classic', label: { en: 'Classic', ar: 'كلاسيكي' }, font: 'Times New Roman', head: '#000000', sub: '#404040' },
  { id: 'modern', label: { en: 'Modern', ar: 'عصري' }, font: 'Segoe UI', head: '#0F766E', sub: '#115E59' },
  { id: 'bold', label: { en: 'Bold', ar: 'جريء' }, font: 'Arial', head: '#B91C1C', sub: '#7F1D1D' },
  { id: 'arabic', label: { en: 'Arabic elegant', ar: 'عربي أنيق' }, font: 'Cairo', head: '#1F3864', sub: '#2F5496' },
];
