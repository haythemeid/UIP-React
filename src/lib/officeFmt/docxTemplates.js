/**
 * Ready-made Word templates (HTML in the exact shape the editor / .docx writer use: inline styles, tables, rules).
 *   DOCX_TEMPLATES  -> [{ id, group, label:{en,ar}, hint:{en,ar}, color }]
 *   DOCX_GROUPS     -> [{ id, label:{en,ar} }]   (gallery sections, in order)
 *   docxTemplateHtml(id, { ar, title }) -> HTML string for the document body
 */
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const today = (ar) => new Date().toLocaleDateString(ar ? 'ar-EG' : 'en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
const NAVY = '#1F3864'; const BLUE = '#2F5496'; const GREY = '#595959'; const SOFT = '#E8EEF9'; const LINE = '#8EAADB';
const p = (t = '', st = '', extra = '') => `<p${st ? ` style="${st}"` : ''}${extra}>${t}</p>`;
const sp = (t, st) => `<span style="${st}">${t}</span>`;
const b = (t) => sp(t, 'font-weight:bold');
const lab = (t, c = BLUE) => sp(t, `color:${c};font-weight:bold`);
const rule = (c = NAVY, w = '1.5pt') => `<p style="border-bottom:${w} solid ${c};margin-bottom:8pt"></p>`;
const th = (t, bg = NAVY, w = '') => `<th style="background-color:${bg};${w ? `width:${w};` : ''}text-align:center"><p style="text-align:center">${sp(t, 'color:#FFFFFF;font-weight:bold')}</p></th>`;
const td = (t = '', st = '') => `<td${st ? ` style="${st}"` : ''}><p>${t}</p></td>`;
const empty = (n, cols) => Array.from({ length: n }, () => `<tr>${Array.from({ length: cols }, () => td()).join('')}</tr>`).join('');
const h1 = (t) => `<h1 style="color:${NAVY}">${t}</h1>`;
const h2 = (t) => `<h2 style="color:${BLUE}">${t}</h2>`;
const ul = (...a) => `<ul>${a.map((x) => `<li>${x}</li>`).join('')}</ul>`;
const ol = (...a) => `<ol>${a.map((x) => `<li>${x}</li>`).join('')}</ol>`;
const tbl = (heads, rows, widths = [], bg = NAVY) => `<table><tbody><tr>${heads.map((h, i) => th(h, bg, widths[i] || '')).join('')}</tr>${rows}</tbody></table>`;
/** full-width colour band with a title (report headers, section banners) */
const banner = (t, bg = NAVY, size = '22pt') => `<table data-b="none"><tbody><tr><td style="background-color:${bg}"><p style="text-align:center">${sp(t, `color:#FFFFFF;font-size:${size};font-weight:bold`)}</p></td></tr></tbody></table>`;
/** label : value grid, two pairs per row */
const kv = (pairs, cols = 2) => {
  const rows = []; for (let i = 0; i < pairs.length; i += cols) rows.push(`<tr>${pairs.slice(i, i + cols).map(([k, v]) => td(lab(k), `background-color:${SOFT};width:${Math.round(100 / cols / 2.2)}%`) + td(v || '..................', `width:${Math.round(100 / cols - 100 / cols / 2.2)}%`)).join('')}</tr>`);
  return `<table><tbody>${rows.join('')}</tbody></table>`;
};
/** coloured call-out box */
const box = (title, body, c = BLUE, bg = SOFT) => `<table data-b="none"><tbody><tr><td style="background-color:${bg};border-left:3pt solid ${c}"><p>${sp(title, `color:${c};font-weight:bold`)}</p><p>${body}</p></td></tr></tbody></table>`;
const sign = (...names) => `<table data-b="none"><tbody><tr>${names.map((n) => td(`<br><br>..............................<br>${b(n)}`, 'text-align:center')).join('')}</tr></tbody></table>`;
const chk = (...a) => a.map((x) => p(`☐  ${x}`)).join('');
const PB = '<hr data-pb="1">';

export const DOCX_GROUPS = [
  { id: 'basic', label: { en: 'Basic', ar: 'أساسي' } }, { id: 'work', label: { en: 'Work & business', ar: 'عمل وأعمال' } },
  { id: 'academic', label: { en: 'Academic & study', ar: 'أكاديمي ودراسة' } }, { id: 'data', label: { en: 'Data & projects', ar: 'بيانات ومشاريع' } },
  { id: 'letters', label: { en: 'Letters & forms', ar: 'خطابات ونماذج' } },
];

const T = (id, group, color, en, ar, hen, har) => ({ id, group, color, label: { en, ar }, hint: { en: hen, ar: har } });
export const DOCX_TEMPLATES = [
  T('blank', 'basic', '#64748b', 'Blank document', 'مستند فارغ', 'Start from nothing', 'ابدأ من الصفر'),
  T('certificate', 'basic', '#b45309', 'Certificate', 'شهادة تقدير', 'Centered, framed', 'متوسطة بإطار'),
  T('checklist', 'basic', '#16a34a', 'Checklist', 'قائمة مراجعة', 'Tick-box list by section', 'قائمة تحقق بأقسام'),
  T('weekly', 'basic', '#0ea5e9', 'Weekly planner', 'مخطط أسبوعي', 'Days, goals, notes', 'أيام وأهداف وملاحظات'),
  T('report', 'work', '#2b6cdf', 'Professional report', 'تقرير احترافي', 'Cover, summary, sections', 'غلاف وملخص وأقسام'),
  T('minutes', 'work', '#16a34a', 'Meeting minutes', 'محضر اجتماع', 'Agenda, decisions, actions', 'جدول أعمال وقرارات ومهام'),
  T('agenda', 'work', '#0d9488', 'Meeting agenda', 'جدول أعمال اجتماع', 'Timed topics and owners', 'بنود بتوقيت ومسؤولين'),
  T('memo', 'work', '#7c3aed', 'Internal memo', 'مذكرة داخلية', 'To / from / subject', 'إلى / من / الموضوع'),
  T('proposal', 'work', '#e5484d', 'Project proposal', 'مقترح مشروع', 'Goals, plan, budget, risks', 'أهداف وخطة وميزانية ومخاطر'),
  T('quote', 'work', '#d97706', 'Price quotation', 'عرض سعر', 'Items, validity, terms', 'بنود وصلاحية وشروط'),
  T('invoice', 'work', '#ca8a04', 'Invoice', 'فاتورة', 'Items, tax, totals, payment', 'بنود وضريبة وإجمالي ودفع'),
  T('contract', 'work', '#475569', 'Service agreement', 'عقد خدمات', 'Parties, scope, terms, signatures', 'أطراف ونطاق وشروط وتوقيعات'),
  T('sop', 'work', '#0284c7', 'Procedure (SOP)', 'إجراء عمل (SOP)', 'Purpose, steps, responsibilities', 'الغرض والخطوات والمسؤوليات'),
  T('resume', 'work', '#ea580c', 'Résumé / CV', 'سيرة ذاتية', 'Two-column CV', 'سيرة بعمودين'),
  T('cover', 'academic', '#7c3aed', 'Assignment / research cover', 'غلاف بحث / تكليف', 'University cover page', 'صفحة غلاف جامعية'),
  T('lab', 'academic', '#0284c7', 'Lab report', 'تقرير معمل', 'Aim, method, results, error', 'الهدف والطريقة والنتائج والخطأ'),
  T('thesis', 'academic', '#9333ea', 'Graduation project report', 'تقرير مشروع تخرج', 'Chapters 1–5, references', 'فصول ١–٥ ومراجع'),
  T('research', 'academic', '#2563eb', 'Research paper outline', 'هيكل ورقة بحثية', 'Abstract → references', 'ملخص حتى المراجع'),
  T('lesson', 'academic', '#0d9488', 'Lesson plan', 'خطة درس', 'Objectives, activities, assessment', 'أهداف وأنشطة وتقييم'),
  T('studyplan', 'academic', '#db2777', 'Study plan', 'خطة مذاكرة', 'Subjects, hours, exam dates', 'مواد وساعات ومواعيد امتحان'),
  T('datareport', 'data', '#2563eb', 'Data analysis report', 'تقرير تحليل بيانات', 'Question, data, method, findings', 'سؤال وبيانات ومنهج ونتائج'),
  T('status', 'data', '#16a34a', 'Project status report', 'تقرير حالة مشروع', 'Progress, risks, next steps', 'تقدم ومخاطر وخطوات قادمة'),
  T('srs', 'data', '#e5484d', 'Requirements (SRS)', 'وثيقة متطلبات (SRS)', 'Functional / non-functional', 'متطلبات وظيفية وغير وظيفية'),
  T('letter', 'letters', '#0d9488', 'Formal letter', 'خطاب رسمي', 'Letterhead and signature', 'ترويسة وتوقيع'),
  T('coverletter', 'letters', '#ea580c', 'Job application letter', 'خطاب تقديم لوظيفة', 'Intro, fit, closing', 'مقدمة وملاءمة وختام'),
  T('resignation', 'letters', '#64748b', 'Resignation letter', 'خطاب استقالة', 'Polite, with notice period', 'مهذب مع فترة إشعار'),
  T('recommend', 'letters', '#b45309', 'Recommendation letter', 'خطاب توصية', 'Relationship, strengths, endorsement', 'علاقة ونقاط قوة وتزكية'),
];

export function docxTemplateHtml(id, { ar = false, title = '' } = {}) {
  const t = esc(title || (ar ? 'عنوان المستند' : 'Document title'));
  const L = (en, a) => (ar ? a : en); const al = ar ? 'right' : 'left'; const dots = '..................';
  const head = (kind) => [banner(kind, NAVY, '13pt'), p(sp(t, `color:${NAVY};font-size:26pt;font-weight:bold`), 'margin-top:14pt;margin-bottom:2pt'), rule(LINE, '1pt')].join('');
  switch (id) {
    case 'report': return [
      p(sp(L('REPORT', 'تقرير'), `color:${BLUE};font-size:12pt;font-weight:bold`), 'text-align:center;margin-top:80pt'),
      p(sp(t, `color:${NAVY};font-size:32pt;font-weight:bold`), 'text-align:center;margin-bottom:6pt'), rule(NAVY, '3pt'),
      p(sp(L('Subtitle or department', 'عنوان فرعي أو القسم'), `color:${GREY};font-size:14pt`), 'text-align:center'),
      p(sp(`${L('Prepared by', 'إعداد')}: ${dots}`, `color:${GREY};font-size:13pt`), 'text-align:center;margin-top:60pt'),
      p(sp(`${L('Reviewed by', 'مراجعة')}: ${dots}`, `color:${GREY};font-size:13pt`), 'text-align:center'),
      p(sp(today(ar), `color:${GREY};font-size:12pt`), 'text-align:center'), PB,
      h1(L('Table of contents', 'المحتويات')), ol(L('Executive summary', 'الملخص التنفيذي'), L('Introduction', 'المقدمة'), L('Findings', 'النتائج'), L('Conclusion and recommendations', 'الخلاصة والتوصيات'), L('Appendices', 'الملاحق')), PB,
      h1(L('Executive summary', 'الملخص التنفيذي')), box(L('Key message', 'الرسالة الأساسية'), L('Write the one thing the reader must remember.', 'اكتب أهم شيء يجب أن يتذكره القارئ.')),
      p(L('Summarise purpose, main findings and the decision you need, in three to five sentences.', 'لخّص الغرض وأهم النتائج والقرار المطلوب في ثلاث إلى خمس جمل.')),
      h1(L('1. Introduction', '١. المقدمة')), h2(L('1.1 Background', '١.١ الخلفية')), p(), h2(L('1.2 Objectives', '١.٢ الأهداف')), ul(L('First objective', 'الهدف الأول'), L('Second objective', 'الهدف الثاني')),
      h2(L('1.3 Scope and method', '١.٣ النطاق والمنهج')), p(),
      h1(L('2. Findings', '٢. النتائج')), p(),
      tbl([L('Item', 'البند'), L('Result', 'النتيجة'), L('Comment', 'تعليق')], empty(4, 3), ['34%', '26%', '40%']), p(),
      h1(L('3. Conclusion and recommendations', '٣. الخلاصة والتوصيات')), ol(L('Recommendation one', 'التوصية الأولى'), L('Recommendation two', 'التوصية الثانية')),
      h1(L('Appendices', 'الملاحق')), p(),
    ].join('');
    case 'cover': return [
      p(sp(L('University / Faculty', 'الجامعة / الكلية'), `color:${NAVY};font-size:20pt;font-weight:bold`), 'text-align:center;margin-top:10pt'),
      p(sp(L('Department of ..................', 'قسم ..................'), `color:${GREY};font-size:14pt`), 'text-align:center'), rule(NAVY, '3pt'),
      p(sp(L('Assignment / Research', 'تكليف / بحث'), `color:${BLUE};font-size:14pt;font-weight:bold`), 'text-align:center;margin-top:70pt'),
      p(sp(t, `color:${NAVY};font-size:28pt;font-weight:bold`), 'text-align:center;margin-top:10pt;margin-bottom:14pt'),
      p(sp(L('Course: ..................', 'المقرر: ..................'), 'font-size:14pt'), 'text-align:center'), rule('#8EAADB', '1pt'),
      `<table data-b="none"><tbody><tr>${td(lab(L('Prepared by', 'إعداد الطالب')) + `<br>${dots}<br>${dots}<br>${L('ID', 'رقم الجلوس')}: ${dots}`, 'width:50%')}${td(lab(L('Supervised by', 'إشراف')) + `<br>${dots}<br>${L('Group / Section', 'المجموعة / الشعبة')}: ${dots}`, 'width:50%')}</tr></tbody></table>`,
      p(sp(`${L('Academic year', 'العام الدراسي')} ${new Date().getFullYear()} / ${new Date().getFullYear() + 1}`, `color:${GREY};font-size:12pt`), 'text-align:center;margin-top:90pt'), PB,
      h1(L('Contents', 'المحتويات')), ol(L('Introduction', 'المقدمة'), L('Main content', 'المحتوى الرئيسي'), L('Conclusion', 'الخاتمة'), L('References', 'المراجع')), PB, p(),
    ].join('');
    case 'letter': return [
      p(sp(L('Organisation name', 'اسم الجهة'), `color:${NAVY};font-size:22pt;font-weight:bold`), `text-align:${al};margin-bottom:0`),
      p(sp(L('Address · Phone · Email · Website', 'العنوان · الهاتف · البريد · الموقع'), `color:${GREY};font-size:10pt`), `text-align:${al}`), rule(),
      kv([[L('Ref.', 'المرجع'), '0001/' + new Date().getFullYear()], [L('Date', 'التاريخ'), today(ar)]]), p(),
      p(L('Mr. / Ms. ..................', 'السيد / السيدة ..................'), 'font-weight:bold'), p(L('Position, organisation', 'المنصب، الجهة')), p(L('Dear Sir / Madam,', 'تحية طيبة وبعد،')),
      p(`${L('Subject:', 'الموضوع:')} ${sp(dots, 'font-weight:bold;text-decoration:underline')}`),
      p(L('Opening: state the purpose of the letter in one sentence.', 'المقدمة: اذكر الغرض من الخطاب في جملة واحدة.'), 'text-align:justify'),
      p(L('Body: give the details, dates and any figures the reader needs.', 'المتن: اذكر التفاصيل والتواريخ والأرقام التي يحتاجها القارئ.'), 'text-align:justify'),
      p(L('Closing: state the action you expect and by when. Thank you for your time and consideration.', 'الختام: اذكر الإجراء المطلوب وموعده. وتفضلوا بقبول فائق الاحترام والتقدير،'), 'text-align:justify'),
      p(L('Sincerely,', 'مع خالص التحية،')), p(), p(b(dots)), p(L('Position', 'المنصب')), p(sp(`${L('Enclosures', 'المرفقات')}: ${dots}`, `color:${GREY};font-size:10pt`), 'margin-top:14pt'),
    ].join('');
    case 'resume': return [
      p(sp(L('Your Full Name', 'الاسم بالكامل'), `color:${NAVY};font-size:28pt;font-weight:bold`), `text-align:${al};margin-bottom:0`),
      p(sp(L('Professional title', 'المسمى الوظيفي'), `color:${BLUE};font-size:14pt`), `text-align:${al}`),
      p(sp(L('email@example.com  ·  +20 000 000 0000  ·  City, Country  ·  linkedin.com/in/you', 'email@example.com  ·  ٠٠٠٠٠٠٠٠٠٠٠  ·  المدينة، الدولة  ·  linkedin.com/in/you'), `color:${GREY};font-size:10.5pt`), `text-align:${al}`), rule(),
      `<table data-b="none"><tbody><tr><td style="width:33%;background-color:${SOFT}"><p>${lab(L('SKILLS', 'المهارات'), NAVY)}</p>${ul(L('Skill one', 'مهارة أولى'), L('Skill two', 'مهارة ثانية'), L('Skill three', 'مهارة ثالثة'), L('Skill four', 'مهارة رابعة'))}<p>${lab(L('LANGUAGES', 'اللغات'), NAVY)}</p><p>${L('Arabic — native', 'العربية — الأم')}</p><p>${L('English — fluent', 'الإنجليزية — بطلاقة')}</p><p>${lab(L('TOOLS', 'الأدوات'), NAVY)}</p>${ul('Excel', 'Python', 'Git')}<p>${lab(L('LINKS', 'روابط'), NAVY)}</p><p>github.com/you</p></td>`
        + `<td style="width:67%"><p>${lab(L('PROFILE', 'نبذة'), NAVY)}</p><p>${L('Two or three sentences: who you are, what you do best, what you are looking for.', 'جملتان أو ثلاث: من أنت، وما أفضل ما تفعله، وما الذي تبحث عنه.')}</p>`
        + `<p>${lab(L('EXPERIENCE', 'الخبرات'), NAVY)}</p><p>${b(L('Job title — Company', 'المسمى — الشركة'))}  ${sp('2024 – ' + L('Present', 'الآن'), `color:${GREY}`)}</p>${ul(L('Achievement with a number (e.g. cut load time by 30 %)', 'إنجاز برقم (مثلاً قلّلت زمن التحميل ٣٠٪)'), L('Responsibility or tool used', 'مسؤولية أو أداة استخدمتها'))}`
        + `<p>${lab(L('PROJECTS', 'المشاريع'), NAVY)}</p><p>${b(L('Project name', 'اسم المشروع'))} — ${L('one line about what it does and the result', 'سطر عن وظيفته ونتيجته')}</p>`
        + `<p>${lab(L('EDUCATION', 'التعليم'), NAVY)}</p><p>${b(L('B.Sc. in ..................', 'بكالوريوس ..................'))}  ${sp('2022 – 2026', `color:${GREY}`)}</p><p>${L('University, GPA', 'الجامعة، المعدل')}</p></td></tr></tbody></table>`,
    ].join('');
    case 'minutes': return [
      head(L('MEETING MINUTES', 'محضر اجتماع')),
      kv([[L('Date', 'التاريخ'), today(ar)], [L('Time', 'الوقت'), ''], [L('Place / link', 'المكان / الرابط'), ''], [L('Chair', 'رئيس الاجتماع'), ''], [L('Minute taker', 'مقرر الاجتماع'), ''], [L('Next meeting', 'الاجتماع القادم'), '']]), p(),
      h2(L('Attendance', 'الحضور')), tbl([L('Name', 'الاسم'), L('Role', 'الصفة'), L('Present', 'الحضور')], empty(4, 3), ['45%', '35%', '20%']), p(),
      h2(L('Agenda', 'جدول الأعمال')), ol('', ''), h2(L('Discussion summary', 'ملخص النقاش')), p(),
      h2(L('Decisions', 'القرارات')), ul('', ''),
      h2(L('Action items', 'المهام')), tbl([L('Action', 'المهمة'), L('Owner', 'المسؤول'), L('Due date', 'الموعد'), L('Status', 'الحالة')], empty(5, 4), ['44%', '22%', '17%', '17%']), p(),
      sign(L('Chair', 'رئيس الاجتماع'), L('Minute taker', 'مقرر الاجتماع')),
    ].join('');
    case 'invoice': return [
      `<table data-b="none"><tbody><tr>${td(sp(L('INVOICE', 'فاتورة'), `color:${NAVY};font-size:30pt;font-weight:bold`) + `<br>${lab(L('No.', 'رقم'))} 0001`, 'width:55%')}${td(b(L('Company name', 'اسم الشركة')) + `<br>${L('Address', 'العنوان')}<br>${L('Phone · Email', 'الهاتف · البريد')}<br>${L('Tax ID', 'الرقم الضريبي')}: ${dots}`, 'width:45%')}</tr></tbody></table>`, rule(NAVY, '3pt'),
      kv([[L('Bill to', 'العميل'), ''], [L('Invoice date', 'تاريخ الفاتورة'), today(ar)], [L('Address', 'العنوان'), ''], [L('Due date', 'تاريخ الاستحقاق'), '']]), p(),
      tbl(['#', L('Description', 'البيان'), L('Qty', 'الكمية'), L('Unit price', 'السعر'), L('Total', 'الإجمالي')], empty(6, 5), ['6%', '44%', '12%', '19%', '19%']), p(),
      `<table><tbody><tr>${td('', 'width:60%')}${td(b(L('Subtotal', 'المجموع')), `background-color:${SOFT};width:20%`)}${td('', 'width:20%')}</tr><tr>${td('')}${td(b(L('Discount', 'الخصم')), `background-color:${SOFT}`)}${td('')}</tr><tr>${td('')}${td(b(L('Tax', 'الضريبة')), `background-color:${SOFT}`)}${td('')}</tr><tr>${td('')}${td(sp(L('TOTAL DUE', 'المطلوب سداده'), 'color:#FFFFFF;font-weight:bold'), `background-color:${NAVY}`)}${td('', `background-color:${SOFT}`)}</tr></tbody></table>`, p(),
      box(L('Payment details', 'بيانات الدفع'), `${L('Bank', 'البنك')}: ${dots}   ${L('Account / IBAN', 'الحساب')}: ${dots}<br>${L('Payment terms: within 14 days. Thank you for your business.', 'شروط الدفع: خلال ١٤ يومًا. شكرًا لتعاملكم معنا.')}`),
    ].join('');
    case 'proposal': return [
      banner(L('PROJECT PROPOSAL', 'مقترح مشروع'), NAVY, '13pt'), p(sp(t, `color:${NAVY};font-size:28pt;font-weight:bold`), 'margin-top:14pt;margin-bottom:2pt'), rule(LINE, '1pt'),
      kv([[L('Prepared by', 'إعداد'), ''], [L('Date', 'التاريخ'), today(ar)], [L('Sponsor', 'الجهة الراعية'), ''], [L('Version', 'الإصدار'), '1.0']]),
      h1(L('1. Summary', '١. الملخص')), box(L('In one sentence', 'في جملة واحدة'), L('We propose to … so that … by …', 'نقترح … حتى … بحلول …')),
      h1(L('2. Problem', '٢. المشكلة')), p(), h1(L('3. Proposed solution', '٣. الحل المقترح')), p(),
      h1(L('4. Goals and success measures', '٤. الأهداف ومقاييس النجاح')), tbl([L('Goal', 'الهدف'), L('Measure', 'المقياس'), L('Target', 'المستهدف')], empty(3, 3)), p(),
      h1(L('5. Timeline', '٥. الجدول الزمني')), tbl([L('Phase', 'المرحلة'), L('Start', 'البداية'), L('End', 'النهاية'), L('Deliverable', 'المخرج')], empty(4, 4)), p(),
      h1(L('6. Budget', '٦. الميزانية')), tbl([L('Item', 'البند'), L('Qty', 'الكمية'), L('Unit cost', 'تكلفة الوحدة'), L('Total', 'الإجمالي')], empty(4, 4) + `<tr>${td('', `background-color:${SOFT}`)}${td('', `background-color:${SOFT}`)}${td(b(L('Total', 'الإجمالي')), `background-color:${SOFT}`)}${td('', `background-color:${SOFT}`)}</tr>`), p(),
      h1(L('7. Risks', '٧. المخاطر')), tbl([L('Risk', 'الخطر'), L('Impact', 'الأثر'), L('Mitigation', 'المعالجة')], empty(3, 3)), p(),
      h1(L('8. Team', '٨. الفريق')), tbl([L('Name', 'الاسم'), L('Role', 'الدور')], empty(3, 2)),
    ].join('');
    case 'lab': return [
      head(L('LAB REPORT', 'تقرير معمل')),
      kv([[L('Student', 'الطالب'), ''], [L('ID', 'الرقم'), ''], [L('Course', 'المقرر'), ''], [L('Experiment no.', 'رقم التجربة'), ''], [L('Date', 'التاريخ'), today(ar)], [L('Instructor', 'المشرف'), '']]),
      h2(L('Aim', 'الهدف')), p(), h2(L('Theory', 'النظرية')), p(L('Key equations and definitions used in the experiment.', 'المعادلات والتعريفات الأساسية المستخدمة.')),
      h2(L('Apparatus & materials', 'الأدوات والمواد')), ul('', ''), h2(L('Procedure', 'الخطوات')), ol('', '', ''),
      h2(L('Results', 'النتائج')), tbl([L('Trial', 'المحاولة'), L('Measured value', 'القيمة المقاسة'), L('Expected', 'المتوقعة'), L('Error %', 'نسبة الخطأ')], empty(5, 4)), p(sp(L('Error % = |measured − expected| ÷ expected × 100', 'نسبة الخطأ = |المقاس − المتوقع| ÷ المتوقع × ١٠٠'), `color:${GREY};font-size:10pt`)),
      h2(L('Graph', 'الرسم البياني')), box(L('Insert graph here', 'ضع الرسم هنا'), L('Label both axes with units and give the graph a title.', 'اكتب الوحدات على المحورين وعنوانًا للرسم.'), GREY, '#F2F2F2'),
      h2(L('Discussion', 'المناقشة')), p(), h2(L('Sources of error', 'مصادر الخطأ')), ul('', ''), h2(L('Conclusion', 'الخلاصة')), p(),
    ].join('');
    case 'certificate': return [
      p(sp(L('CERTIFICATE', 'شهادة'), `color:${NAVY};font-size:44pt;font-weight:bold`), `text-align:center;margin-top:60pt;border-top:4.5pt double ${NAVY};padding-top:20pt`),
      p(sp(L('OF APPRECIATION', 'تقدير'), `color:${BLUE};font-size:18pt`), 'text-align:center'), p(sp(L('This certificate is proudly presented to', 'تُمنح هذه الشهادة إلى'), `color:${GREY};font-size:13pt`), 'text-align:center;margin-top:30pt'),
      p(sp(L('Recipient Name', 'اسم المتلقي'), `color:${NAVY};font-size:32pt;font-weight:bold`), 'text-align:center'), rule(LINE, '1pt'),
      p(L('in recognition of outstanding effort, dedication and achievement in ..................', 'تقديرًا لجهوده المتميزة وتفانيه وإنجازه في ..................'), 'text-align:center;font-size:13pt'),
      p(sp(today(ar), `color:${GREY}`), 'text-align:center;margin-top:30pt'), sign(L('Name & title', 'الاسم والمنصب'), L('Name & title', 'الاسم والمنصب')),
      p(sp('✦', `color:${NAVY};font-size:16pt`), `text-align:center;border-bottom:4.5pt double ${NAVY};padding-bottom:20pt`),
    ].join('');
    case 'checklist': return [
      head(L('CHECKLIST', 'قائمة مراجعة')), kv([[L('Prepared by', 'إعداد'), ''], [L('Date', 'التاريخ'), today(ar)]]),
      h2(L('Before you start', 'قبل البدء')), chk(L('Item one', 'البند الأول'), L('Item two', 'البند الثاني'), L('Item three', 'البند الثالث')),
      h2(L('During', 'أثناء التنفيذ')), chk('', '', ''), h2(L('Before you finish', 'قبل الانتهاء')), chk('', '', ''),
      box(L('Notes', 'ملاحظات'), '<br><br>', GREY, '#F2F2F2'),
    ].join('');
    case 'weekly': return [
      head(L('WEEKLY PLANNER', 'المخطط الأسبوعي')), kv([[L('Week of', 'أسبوع'), today(ar)], [L('Main goal', 'الهدف الرئيسي'), '']]), p(),
      tbl([L('Day', 'اليوم'), L('Top 3 tasks', 'أهم ٣ مهام'), L('Done', 'تم'), L('Notes', 'ملاحظات')], (ar ? ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'] : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']).map((d) => `<tr>${td(b(d), `background-color:${SOFT}`)}${td('<br>')}${td('☐', 'text-align:center')}${td('')}</tr>`).join(''), ['16%', '50%', '8%', '26%']), p(),
      h2(L('Weekly review', 'مراجعة الأسبوع')), ul(L('What went well', 'ما سار جيدًا'), L('What to improve', 'ما يحتاج تحسينًا')),
    ].join('');
    case 'agenda': return [
      head(L('MEETING AGENDA', 'جدول أعمال الاجتماع')),
      kv([[L('Date', 'التاريخ'), today(ar)], [L('Time', 'الوقت'), ''], [L('Place / link', 'المكان / الرابط'), ''], [L('Facilitator', 'المنسّق'), '']]),
      h2(L('Objective', 'هدف الاجتماع')), p(),
      h2(L('Topics', 'البنود')), tbl([L('Time', 'الوقت'), L('Topic', 'البند'), L('Lead', 'المسؤول'), L('Outcome needed', 'المطلوب')], [[L('5 min', '٥ د'), L('Welcome and review of last actions', 'ترحيب ومراجعة المهام السابقة')], [L('15 min', '١٥ د'), L('Topic one', 'البند الأول')], [L('20 min', '٢٠ د'), L('Topic two', 'البند الثاني')], [L('10 min', '١٠ د'), L('Summary and next steps', 'الملخص والخطوات القادمة')]].map(([m, x]) => `<tr>${td(m)}${td(x)}${td('')}${td('')}</tr>`).join(''), ['12%', '40%', '20%', '28%']), p(),
      h2(L('Please prepare', 'للتحضير')), ul('', ''),
    ].join('');
    case 'memo': return [
      banner(L('MEMORANDUM', 'مذكرة داخلية'), NAVY, '20pt'), p(),
      kv([[L('To', 'إلى'), ''], [L('From', 'من'), ''], [L('Date', 'التاريخ'), today(ar)], [L('Priority', 'الأولوية'), L('Normal', 'عادية')]]),
      p(`${lab(L('Subject', 'الموضوع'))}: ${b(t)}`, 'margin-top:10pt'), rule(LINE, '1pt'),
      h2(L('Purpose', 'الغرض')), p(), h2(L('Details', 'التفاصيل')), p(), h2(L('Action required', 'الإجراء المطلوب')), ul(L('Who does what by when', 'من يفعل ماذا وبحلول متى'), ''),
      p(sp(`${L('Cc', 'نسخة إلى')}: ${dots}`, `color:${GREY}`), 'margin-top:14pt'),
    ].join('');
    case 'quote': return [
      `<table data-b="none"><tbody><tr>${td(sp(L('QUOTATION', 'عرض سعر'), `color:${NAVY};font-size:30pt;font-weight:bold`) + `<br>${lab(L('No.', 'رقم'))} Q-0001`, 'width:55%')}${td(b(L('Company name', 'اسم الشركة')) + `<br>${L('Address', 'العنوان')}<br>${L('Phone · Email', 'الهاتف · البريد')}`, 'width:45%')}</tr></tbody></table>`, rule(NAVY, '3pt'),
      kv([[L('Prepared for', 'مقدم إلى'), ''], [L('Date', 'التاريخ'), today(ar)], [L('Project', 'المشروع'), t], [L('Valid until', 'صالح حتى'), '']]), p(),
      tbl(['#', L('Item / service', 'البند / الخدمة'), L('Qty', 'الكمية'), L('Unit price', 'السعر'), L('Total', 'الإجمالي')], empty(6, 5), ['6%', '44%', '12%', '19%', '19%']), p(),
      `<table><tbody><tr>${td('', 'width:60%')}${td(b(L('Subtotal', 'المجموع')), `background-color:${SOFT};width:20%`)}${td('', 'width:20%')}</tr><tr>${td('')}${td(b(L('Tax', 'الضريبة')), `background-color:${SOFT}`)}${td('')}</tr><tr>${td('')}${td(sp(L('TOTAL', 'الإجمالي'), 'color:#FFFFFF;font-weight:bold'), `background-color:${NAVY}`)}${td('', `background-color:${SOFT}`)}</tr></tbody></table>`,
      h2(L('Terms', 'الشروط')), ul(L('Prices are valid for 14 days from the date above.', 'الأسعار صالحة ١٤ يومًا من التاريخ أعلاه.'), L('Delivery time: ..................', 'مدة التسليم: ..................'), L('Payment: 50 % in advance, 50 % on delivery.', 'الدفع: ٥٠٪ مقدمًا و٥٠٪ عند التسليم.')),
      sign(L('Prepared by', 'أعدّه'), L('Customer approval', 'موافقة العميل')),
    ].join('');
    case 'contract': return [
      p(sp(L('SERVICE AGREEMENT', 'عقد تقديم خدمات'), `color:${NAVY};font-size:24pt;font-weight:bold`), 'text-align:center'), rule(NAVY, '3pt'),
      p(`${L('This agreement is made on', 'تم إبرام هذا العقد بتاريخ')} ${b(today(ar))} ${L('between:', 'بين كل من:')}`),
      kv([[L('First party (Client)', 'الطرف الأول (العميل)'), ''], [L('Second party (Provider)', 'الطرف الثاني (مقدم الخدمة)'), ''], [L('Address', 'العنوان'), ''], [L('Address', 'العنوان'), '']]),
      h2(L('1. Scope of services', '١. نطاق الخدمات')), p(), h2(L('2. Term', '٢. المدة')), p(L('From .................. to .................., renewable by written agreement.', 'من .................. إلى .................. وتُجدد باتفاق كتابي.')),
      h2(L('3. Fees and payment', '٣. الأتعاب والدفع')), p(L('Total fee: .................. payable as follows: ..................', 'إجمالي الأتعاب: .................. وتُدفع كالتالي: ..................')),
      h2(L('4. Responsibilities', '٤. المسؤوليات')), ul(L('The Provider will deliver the services with professional care.', 'يلتزم مقدم الخدمة بتنفيذ الخدمات بعناية مهنية.'), L('The Client will provide the information and access needed.', 'يلتزم العميل بتوفير المعلومات والصلاحيات اللازمة.')),
      h2(L('5. Confidentiality', '٥. السرية')), p(L('Both parties keep the other’s confidential information private during and after this agreement.', 'يحافظ الطرفان على سرية معلومات الطرف الآخر أثناء العقد وبعده.')),
      h2(L('6. Termination', '٦. الإنهاء')), p(L('Either party may end this agreement with .. days’ written notice.', 'يجوز لأي طرف إنهاء العقد بإخطار كتابي قبل .. يومًا.')),
      h2(L('7. Governing law', '٧. القانون الواجب التطبيق')), p(), sign(L('First party', 'الطرف الأول'), L('Second party', 'الطرف الثاني')),
      p(sp(L('This is a general template, not legal advice — have it reviewed before use.', 'هذا نموذج عام وليس استشارة قانونية — يُراجع قبل الاستخدام.'), `color:${GREY};font-size:9pt`)),
    ].join('');
    case 'sop': return [
      head(L('STANDARD OPERATING PROCEDURE', 'إجراء عمل قياسي (SOP)')),
      kv([[L('Procedure no.', 'رقم الإجراء'), 'SOP-001'], [L('Version', 'الإصدار'), '1.0'], [L('Owner', 'المسؤول'), ''], [L('Effective date', 'تاريخ السريان'), today(ar)]]),
      h2(L('1. Purpose', '١. الغرض')), p(), h2(L('2. Scope', '٢. النطاق')), p(), h2(L('3. Roles and responsibilities', '٣. الأدوار والمسؤوليات')), tbl([L('Role', 'الدور'), L('Responsibility', 'المسؤولية')], empty(3, 2), ['30%', '70%']), p(),
      h2(L('4. Procedure', '٤. الخطوات')), tbl(['#', L('Step', 'الخطوة'), L('Who', 'المنفذ'), L('Notes', 'ملاحظات')], empty(5, 4), ['6%', '50%', '16%', '28%']), p(),
      h2(L('5. Records and forms', '٥. السجلات والنماذج')), ul('', ''), h2(L('6. Revision history', '٦. سجل التعديلات')), tbl([L('Version', 'الإصدار'), L('Date', 'التاريخ'), L('Change', 'التعديل'), L('By', 'بواسطة')], empty(2, 4)),
    ].join('');
    case 'thesis': return [
      p(sp(L('University / Faculty', 'الجامعة / الكلية'), `color:${NAVY};font-size:20pt;font-weight:bold`), 'text-align:center'), p(sp(L('Department of ..................', 'قسم ..................'), `color:${GREY};font-size:14pt`), 'text-align:center'), rule(NAVY, '3pt'),
      p(sp(L('GRADUATION PROJECT', 'مشروع التخرج'), `color:${BLUE};font-size:14pt;font-weight:bold`), 'text-align:center;margin-top:50pt'), p(sp(t, `color:${NAVY};font-size:28pt;font-weight:bold`), 'text-align:center;margin-top:6pt'),
      p(sp(L('Submitted in partial fulfilment of the requirements for the B.Sc. degree', 'مقدم استكمالًا لمتطلبات الحصول على درجة البكالوريوس'), `color:${GREY};font-size:12pt`), 'text-align:center;margin-top:16pt'),
      tbl([L('Team member', 'عضو الفريق'), L('ID', 'الرقم')], empty(4, 2), ['70%', '30%']), p(),
      p(`${lab(L('Supervisor', 'المشرف'))}: ${dots}`, 'text-align:center;margin-top:20pt'), p(sp(`${L('Academic year', 'العام الدراسي')} ${new Date().getFullYear()} / ${new Date().getFullYear() + 1}`, `color:${GREY}`), 'text-align:center'), PB,
      h1(L('Acknowledgements', 'شكر وتقدير')), p(), h1(L('Abstract', 'المستخلص')), p(L('150–250 words: problem, method, main result.', '١٥٠–٢٥٠ كلمة: المشكلة والمنهج وأهم نتيجة.')), PB,
      h1(L('Chapter 1 — Introduction', 'الفصل ١ — المقدمة')), h2(L('1.1 Problem statement', '١.١ المشكلة')), p(), h2(L('1.2 Objectives', '١.٢ الأهداف')), ul('', ''), h2(L('1.3 Scope and limitations', '١.٣ النطاق والحدود')), p(), h2(L('1.4 Report outline', '١.٤ هيكل التقرير')), p(),
      h1(L('Chapter 2 — Background and related work', 'الفصل ٢ — الخلفية والدراسات السابقة')), p(),
      h1(L('Chapter 3 — System analysis and design', 'الفصل ٣ — تحليل النظام وتصميمه')), h2(L('3.1 Requirements', '٣.١ المتطلبات')), p(), h2(L('3.2 Architecture', '٣.٢ البنية')), p(), h2(L('3.3 Database / data design', '٣.٣ تصميم البيانات')), p(),
      h1(L('Chapter 4 — Implementation and testing', 'الفصل ٤ — التنفيذ والاختبار')), p(), tbl([L('Test case', 'حالة الاختبار'), L('Expected', 'المتوقع'), L('Actual', 'الفعلي'), L('Pass / Fail', 'نجاح / فشل')], empty(4, 4)), p(),
      h1(L('Chapter 5 — Conclusion and future work', 'الفصل ٥ — الخاتمة والأعمال المستقبلية')), p(), h1(L('References', 'المراجع')), ol('', ''), h1(L('Appendices', 'الملاحق')), p(),
    ].join('');
    case 'research': return [
      p(sp(t, `color:${NAVY};font-size:24pt;font-weight:bold`), 'text-align:center'), p(sp(L('Author names · Affiliation · email', 'أسماء الباحثين · الجهة · البريد'), `color:${GREY};font-size:11pt`), 'text-align:center'), rule(),
      box(L('Abstract', 'الملخص'), L('Context, problem, method, key result and one-line impact — about 200 words.', 'السياق والمشكلة والمنهج وأهم نتيجة وأثرها — نحو ٢٠٠ كلمة.')), p(`${lab(L('Keywords', 'الكلمات المفتاحية'))}: ${L('keyword one, keyword two, keyword three', 'كلمة أولى، كلمة ثانية، كلمة ثالثة')}`),
      h1(L('1. Introduction', '١. المقدمة')), p(), h1(L('2. Related work', '٢. الدراسات السابقة')), p(), h1(L('3. Method', '٣. المنهج')), p(), h1(L('4. Results', '٤. النتائج')), p(),
      tbl([L('Method', 'الطريقة'), L('Metric 1', 'مقياس ١'), L('Metric 2', 'مقياس ٢')], empty(3, 3)), p(), h1(L('5. Discussion', '٥. المناقشة')), p(), h1(L('6. Conclusion', '٦. الخاتمة')), p(), h1(L('References', 'المراجع')), ol('', '', ''),
    ].join('');
    case 'lesson': return [
      head(L('LESSON PLAN', 'خطة درس')),
      kv([[L('Teacher', 'المعلم'), ''], [L('Subject', 'المادة'), ''], [L('Class / level', 'الصف / المستوى'), ''], [L('Date', 'التاريخ'), today(ar)], [L('Duration', 'المدة'), ''], [L('Topic', 'الموضوع'), '']]),
      h2(L('Learning objectives', 'أهداف التعلم')), p(L('By the end of the lesson students will be able to:', 'بنهاية الدرس سيكون الطلاب قادرين على:')), ul('', '', ''), h2(L('Materials', 'المواد والوسائل')), ul('', ''),
      h2(L('Lesson flow', 'سير الدرس')), tbl([L('Time', 'الوقت'), L('Activity', 'النشاط'), L('Teacher', 'المعلم'), L('Students', 'الطلاب')], [L('Warm-up', 'تمهيد'), L('Presentation', 'عرض'), L('Practice', 'تطبيق'), L('Wrap-up', 'ختام')].map((x) => `<tr>${td('')}${td(b(x))}${td('')}${td('')}</tr>`).join(''), ['12%', '28%', '30%', '30%']), p(),
      h2(L('Assessment', 'التقييم')), p(), h2(L('Homework', 'الواجب')), p(), h2(L('Reflection', 'تأمل بعد الدرس')), p(),
    ].join('');
    case 'studyplan': return [
      head(L('STUDY PLAN', 'خطة المذاكرة')), kv([[L('Student', 'الطالب'), ''], [L('Term', 'الفصل'), ''], [L('Daily study hours', 'ساعات المذاكرة اليومية'), ''], [L('Goal GPA', 'المعدل المستهدف'), '']]),
      h2(L('Subjects and exams', 'المواد والامتحانات')), tbl([L('Subject', 'المادة'), L('Exam date', 'موعد الامتحان'), L('Chapters', 'الأبواب'), L('Priority', 'الأولوية'), L('Hours needed', 'الساعات')], empty(6, 5), ['26%', '18%', '24%', '16%', '16%']), p(),
      h2(L('Weekly schedule', 'الجدول الأسبوعي')), tbl([L('Day', 'اليوم'), L('Morning', 'صباحًا'), L('Afternoon', 'ظهرًا'), L('Evening', 'مساءً')], (ar ? ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'] : ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri']).map((d) => `<tr>${td(b(d), `background-color:${SOFT}`)}${td('')}${td('')}${td('')}</tr>`).join(''), ['16%', '28%', '28%', '28%']), p(),
      box(L('Tips', 'نصائح'), L('Study the hardest subject first · 50 min focus + 10 min break · review the same day · sleep before the exam.', 'ابدأ بأصعب مادة · ٥٠ دقيقة تركيز و١٠ راحة · راجع في نفس اليوم · نم جيدًا قبل الامتحان.'), '#16a34a', '#E8F5E9'),
    ].join('');
    case 'datareport': return [
      banner(L('DATA ANALYSIS REPORT', 'تقرير تحليل بيانات'), NAVY, '13pt'), p(sp(t, `color:${NAVY};font-size:28pt;font-weight:bold`), 'margin-top:14pt;margin-bottom:2pt'), rule(LINE, '1pt'),
      kv([[L('Analyst', 'المحلل'), ''], [L('Date', 'التاريخ'), today(ar)], [L('Data source', 'مصدر البيانات'), ''], [L('Tools', 'الأدوات'), 'Excel / Python / SQL']]),
      h1(L('1. Business question', '١. سؤال العمل')), box(L('Question', 'السؤال'), L('What decision will this analysis support?', 'ما القرار الذي سيدعمه هذا التحليل؟')),
      h1(L('2. Key findings', '٢. أهم النتائج')), ol(L('Finding with a number (e.g. revenue grew 12 % vs last quarter)', 'نتيجة برقم (مثلاً زادت الإيرادات ١٢٪ عن الربع السابق)'), '', ''),
      h1(L('3. Data', '٣. البيانات')), tbl([L('Field', 'الحقل'), L('Type', 'النوع'), L('Description', 'الوصف'), L('Missing %', 'نسبة الفاقد')], empty(4, 4), ['24%', '16%', '40%', '20%']), p(),
      h2(L('Cleaning steps', 'خطوات التنظيف')), ul(L('Removed duplicates', 'حذف المكرر'), L('Handled missing values', 'معالجة القيم المفقودة'), L('Fixed data types and outliers', 'تصحيح الأنواع والقيم الشاذة')),
      h1(L('4. Method', '٤. المنهج')), p(L('Describe the statistics or model used and why.', 'صف الإحصاء أو النموذج المستخدم ولماذا.')),
      h1(L('5. Results', '٥. النتائج التفصيلية')), tbl([L('Metric', 'المقياس'), L('Value', 'القيمة'), L('Change', 'التغير'), L('Comment', 'تعليق')], empty(4, 4)), p(),
      box(L('Chart', 'رسم بياني'), L('Paste a chart here — one message per chart, a clear title and labelled axes.', 'ضع رسمًا هنا — رسالة واحدة لكل رسم، بعنوان واضح ومحاور موسومة.'), GREY, '#F2F2F2'),
      h1(L('6. Limitations', '٦. القيود')), ul('', ''), h1(L('7. Recommendations and next steps', '٧. التوصيات والخطوات القادمة')), tbl([L('Action', 'الإجراء'), L('Owner', 'المسؤول'), L('Expected impact', 'الأثر المتوقع')], empty(3, 3)),
    ].join('');
    case 'status': return [
      head(L('PROJECT STATUS REPORT', 'تقرير حالة مشروع')),
      kv([[L('Project', 'المشروع'), ''], [L('Reporting period', 'فترة التقرير'), today(ar)], [L('Manager', 'مدير المشروع'), ''], [L('Overall status', 'الحالة العامة'), '🟢 ' + L('On track', 'على المسار')]]),
      h2(L('Health', 'المؤشرات')), tbl([L('Area', 'المجال'), L('Status', 'الحالة'), L('Comment', 'تعليق')], [[L('Schedule', 'الجدول'), '🟢'], [L('Budget', 'الميزانية'), '🟢'], [L('Scope', 'النطاق'), '🟡'], [L('Quality', 'الجودة'), '🟢']].map(([a, s]) => `<tr>${td(b(a), `background-color:${SOFT}`)}${td(s, 'text-align:center')}${td('')}</tr>`).join(''), ['26%', '14%', '60%']), p(),
      h2(L('Progress this period', 'ما تحقق')), ul('', '', ''), h2(L('Planned next period', 'المخطط للفترة القادمة')), ul('', ''),
      h2(L('Milestones', 'المراحل')), tbl([L('Milestone', 'المرحلة'), L('Due', 'الموعد'), L('% done', 'الإنجاز'), L('Status', 'الحالة')], empty(4, 4)), p(),
      h2(L('Risks and issues', 'المخاطر والمشاكل')), tbl([L('Risk / issue', 'الخطر / المشكلة'), L('Impact', 'الأثر'), L('Action', 'الإجراء'), L('Owner', 'المسؤول')], empty(3, 4)), p(),
      h2(L('Decisions needed', 'قرارات مطلوبة')), ul('', ''),
    ].join('');
    case 'srs': return [
      head(L('SOFTWARE REQUIREMENTS SPECIFICATION', 'وثيقة متطلبات البرمجيات')),
      kv([[L('Project', 'المشروع'), ''], [L('Version', 'الإصدار'), '1.0'], [L('Authors', 'المؤلفون'), ''], [L('Date', 'التاريخ'), today(ar)]]),
      h1(L('1. Introduction', '١. المقدمة')), h2(L('1.1 Purpose', '١.١ الغرض')), p(), h2(L('1.2 Scope', '١.٢ النطاق')), p(), h2(L('1.3 Definitions', '١.٣ التعريفات')), tbl([L('Term', 'المصطلح'), L('Definition', 'التعريف')], empty(3, 2), ['30%', '70%']), p(),
      h1(L('2. Overall description', '٢. وصف عام')), h2(L('2.1 Users', '٢.١ المستخدمون')), tbl([L('User', 'المستخدم'), L('Description', 'الوصف')], empty(3, 2), ['30%', '70%']), p(), h2(L('2.2 Assumptions and constraints', '٢.٢ الافتراضات والقيود')), ul('', ''),
      h1(L('3. Functional requirements', '٣. المتطلبات الوظيفية')), tbl(['ID', L('Requirement', 'المتطلب'), L('Priority', 'الأولوية'), L('Status', 'الحالة')], [1, 2, 3, 4].map((i) => `<tr>${td('FR-' + i)}${td('')}${td(L('High', 'عالية'))}${td('')}</tr>`).join(''), ['12%', '56%', '16%', '16%']), p(),
      h1(L('4. Non-functional requirements', '٤. المتطلبات غير الوظيفية')), tbl(['ID', L('Category', 'الفئة'), L('Requirement', 'المتطلب')], [[1, L('Performance', 'الأداء')], [2, L('Security', 'الأمان')], [3, L('Usability', 'سهولة الاستخدام')]].map(([i, c]) => `<tr>${td('NFR-' + i)}${td(c)}${td('')}</tr>`).join(''), ['14%', '24%', '62%']), p(),
      h1(L('5. Use cases', '٥. حالات الاستخدام')), tbl([L('Use case', 'الحالة'), L('Actor', 'الفاعل'), L('Main flow', 'المسار الرئيسي')], empty(3, 3)),
    ].join('');
    case 'coverletter': return [
      p(sp(L('Your Full Name', 'الاسم بالكامل'), `color:${NAVY};font-size:22pt;font-weight:bold`), `text-align:${al};margin-bottom:0`), p(sp(L('email@example.com · +20 000 000 0000 · City', 'email@example.com · ٠٠٠٠٠٠٠٠٠٠٠ · المدينة'), `color:${GREY};font-size:10.5pt`), `text-align:${al}`), rule(),
      p(today(ar)), p(L('Hiring Manager', 'مدير التوظيف')), p(L('Company name', 'اسم الشركة')), p(),
      p(`${lab(L('Re', 'بخصوص'))}: ${b(L('Application for [Job title]', 'التقدم لوظيفة [المسمى الوظيفي]'))}`),
      p(L('Dear Hiring Manager,', 'السيد مدير التوظيف، تحية طيبة وبعد،')),
      p(L('Opening — name the role, how you found it and one sentence on why you fit.', 'المقدمة — اذكر الوظيفة وكيف عرفت بها وجملة عن سبب ملاءمتك.'), 'text-align:justify'),
      p(L('Fit — two or three achievements with numbers that match the job requirements.', 'الملاءمة — إنجازان أو ثلاثة بأرقام تطابق متطلبات الوظيفة.'), 'text-align:justify'),
      p(L('Why this company — show you know their work and what you would add.', 'لماذا هذه الشركة — أظهر معرفتك بعملها وما ستضيفه.'), 'text-align:justify'),
      p(L('Closing — thank them and ask for an interview. I have attached my CV for your review.', 'الختام — اشكرهم واطلب مقابلة. أرفقت سيرتي الذاتية للاطلاع.'), 'text-align:justify'),
      p(L('Sincerely,', 'مع خالص التقدير،')), p(), p(b(L('Your Full Name', 'الاسم بالكامل'))),
    ].join('');
    case 'resignation': return [
      p(today(ar), `text-align:${al}`), p(),
      p(L('To: ..................', 'إلى: ..................'), 'font-weight:bold'), p(L('Position, company', 'المنصب، الشركة')), p(),
      p(`${lab(L('Subject', 'الموضوع'))}: ${b(L('Resignation', 'استقالة'))}`), p(L('Dear ..................,', 'السيد / السيدة .................. تحية طيبة وبعد،')),
      p(L('Please accept this letter as formal notice of my resignation from the position of .................. at .................. My last working day will be .................., in line with my notice period.', 'أتقدم باستقالتي من منصب .................. في .................. وسيكون آخر يوم عمل لي .................. وفق فترة الإشعار.'), 'text-align:justify'),
      p(L('Thank you for the opportunities and support during my time here. I will do my best to hand over my work and help make the transition smooth.', 'أشكركم على الفرص والدعم خلال فترة عملي، وسأبذل جهدي لتسليم أعمالي وتسهيل الانتقال.'), 'text-align:justify'),
      p(L('Sincerely,', 'مع خالص التقدير،')), p(), p(b(dots)), p(L('Employee ID / Department', 'الرقم الوظيفي / القسم')),
    ].join('');
    case 'recommend': return [
      p(sp(L('Organisation / Department letterhead', 'ترويسة الجهة / القسم'), `color:${NAVY};font-size:18pt;font-weight:bold`), `text-align:${al};margin-bottom:0`), rule(), p(today(ar)), p(),
      p(L('To whom it may concern,', 'إلى من يهمه الأمر، تحية طيبة وبعد،')),
      p(`${b(L('Re: Recommendation for [Name]', 'بخصوص: توصية للسيد / السيدة [الاسم]'))}`),
      p(L('I am pleased to recommend [Name]. I have known them for .. years as their [teacher / supervisor / manager] at ..................', 'يسعدني أن أوصي بـ [الاسم]. عرفته/عرفتها لمدة .. سنوات بصفتي [أستاذ / مشرف / مدير] في ..................'), 'text-align:justify'),
      p(L('Strengths — two or three specific qualities, each with a short example.', 'نقاط القوة — صفتان أو ثلاث محددة، مع مثال قصير لكل منها.'), 'text-align:justify'),
      p(L('Achievement — one result that shows their ability, ideally with a number.', 'إنجاز — نتيجة واحدة تُظهر قدرته، ويفضل برقم.'), 'text-align:justify'),
      p(L('Endorsement — I recommend them without reservation. Please contact me for any further information.', 'التزكية — أوصي به دون تحفظ، ويمكنكم التواصل معي لأي معلومات إضافية.'), 'text-align:justify'),
      p(L('Sincerely,', 'مع خالص التقدير،')), p(), p(b(dots)), p(`${L('Name, title', 'الاسم، المنصب')} · ${L('Phone / Email', 'الهاتف / البريد')}`),
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
