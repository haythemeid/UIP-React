import { p, sp, b, big, h1, h2, h3, ul, rule, gap, grid, row, td, kv, banner, callout, table, head, blank, PB, C, esc } from '../docxHtml';

const L = (ar) => (en, a) => (ar ? a : en);

export default {
  id: 'creative',
  label: { en: 'Announcements & more', ar: 'إعلانات وأكثر' },
  groups: [{ id: 'creative', label: { en: 'Announcements & publishing', ar: 'إعلانات ونشر' } }],
  templates: [
    {
      id: 'announcement', group: 'creative', color: '#e5484d', label: { en: 'Announcement', ar: 'إعلان' }, hint: { en: 'Big headline, details, contact', ar: 'عنوان كبير وتفاصيل وتواصل' },
      html: ({ ar, title }) => banner(L(ar)('ANNOUNCEMENT', 'إعلان هام'), '#b91c1c', 16) + gap(2) + p(big(esc(title || L(ar)('Event headline', 'عنوان الحدث')), 34, '#7f1d1d'), 'text-align:center') + p(sp(L(ar)('One line that makes people want to come.', 'سطر واحد يخلي الناس تحب تحضر.'), 'font-size:15pt;color:#595959'), 'text-align:center')
        + gap(2) + kv([[L(ar)('Date', 'التاريخ'), ''], [L(ar)('Time', 'الوقت'), ''], [L(ar)('Place', 'المكان'), ''], [L(ar)('Entry', 'الدخول'), L(ar)('Free', 'مجاني')]], 2, '#FDECEC') + gap(2) + callout(L(ar)('How to join', 'طريقة المشاركة'), L(ar)('Write the steps here.', 'اكتب الخطوات هنا.'), '#b91c1c', '#FDECEC') + gap(1) + p(b(L(ar)('Contact:', 'للتواصل:')) + ' ..................', 'text-align:center'),
    },
    {
      id: 'newsletter', group: 'creative', color: '#0ea5e9', label: { en: 'Newsletter', ar: 'نشرة إخبارية' }, hint: { en: 'Masthead, two columns, highlights', ar: 'ترويسة وعمودان ومميزات' },
      html: ({ ar, title, today }) => banner(esc(title || L(ar)('The Newsletter', 'النشرة')), '#0369a1', 28) + p(sp(today(ar), 'color:#595959'), 'text-align:center') + rule('#0369a1', '1.5pt')
        + grid(row(td(h2(L(ar)('Main story', 'الخبر الرئيسي'), '#0369a1') + p(L(ar)('Write the main story here. Keep paragraphs short.', 'اكتب الخبر الرئيسي هنا. خلي الفقرات قصيرة.')) + p(L(ar)('Second paragraph…', 'فقرة ثانية…')), 'width:62%'), td(h2(L(ar)('Highlights', 'أبرز النقاط'), '#0369a1') + ul('…', '…', '…') + callout(L(ar)('Did you know?', 'هل تعلم؟'), '…', '#0369a1', '#E6F3FB'))))
        + h2(L(ar)('Coming up', 'قريبًا'), '#0369a1') + table(head(L(ar)('Date', 'التاريخ'), L(ar)('Event', 'الحدث')), blank(3, 2)),
    },
    {
      id: 'press', group: 'creative', color: '#475569', label: { en: 'Press release', ar: 'بيان صحفي' }, hint: { en: 'Headline, lead, quote, contact', ar: 'عنوان ومقدمة واقتباس وتواصل' },
      html: ({ ar, title, today }) => p(sp(L(ar)('FOR IMMEDIATE RELEASE', 'للنشر الفوري'), 'color:#64748b;font-weight:bold;letter-spacing:1pt')) + p(big(esc(title || L(ar)('Headline that states the news', 'عنوان يقول الخبر')), 26, '#0f172a')) + p(sp(`${today(ar)} — ${L(ar)('City', 'المدينة')}`, 'color:#595959;font-style:italic'))
        + p(L(ar)('Lead paragraph: who, what, when, where and why in two sentences.', 'الفقرة الأولى: مين وإيه ومتى وفين وليه في جملتين.')) + p(L(ar)('Details and background.', 'التفاصيل والخلفية.')) + callout(L(ar)('Quote', 'اقتباس'), L(ar)('“A short quote from a spokesperson.” — Name, Title', '«اقتباس قصير من المتحدث.» — الاسم، المنصب'), '#475569', '#F1F5F9')
        + rule('#94a3b8', '1pt') + p(b(L(ar)('Media contact:', 'للتواصل الإعلامي:')) + ' ..................'),
    },
    {
      id: 'factsheet', group: 'creative', color: '#2563eb', label: { en: 'One-page fact sheet', ar: 'ورقة معلومات (صفحة)' }, hint: { en: 'Summary, key numbers, features', ar: 'ملخص وأرقام ومميزات' },
      html: ({ ar, title }) => banner(esc(title || L(ar)('Product / project name', 'اسم المنتج / المشروع')), '#1d4ed8', 26) + p(sp(L(ar)('One sentence that explains what it is.', 'جملة واحدة تشرح هو إيه.'), 'font-size:14pt;color:#595959'), 'text-align:center')
        + grid(row(...[['98%', L(ar)('Success', 'نجاح')], ['12', L(ar)('Partners', 'شريك')], ['3x', L(ar)('Faster', 'أسرع')]].map(([n, t]) => td(p(big(n, 26, '#1d4ed8'), 'text-align:center;margin-bottom:0') + p(sp(t, 'color:#6b7280'), 'text-align:center'), 'background-color:#EEF4FF'))))
        + h2(L(ar)('Key features', 'أهم المميزات'), '#1d4ed8') + ul(L(ar)('Feature one', 'ميزة أولى'), L(ar)('Feature two', 'ميزة ثانية'), L(ar)('Feature three', 'ميزة ثالثة')) + h2(L(ar)('Contact', 'التواصل'), '#1d4ed8') + p('..................'),
    },
    {
      id: 'bookreport', group: 'creative', color: '#9333ea', label: { en: 'Book review', ar: 'عرض كتاب' }, hint: { en: 'Details, summary, rating, opinion', ar: 'بيانات وملخص وتقييم ورأي' },
      html: ({ ar }) => h1(L(ar)('Book review', 'عرض كتاب'), '#6b21a8') + kv([[L(ar)('Title', 'العنوان'), ''], [L(ar)('Author', 'المؤلف'), ''], [L(ar)('Year', 'السنة'), ''], [L(ar)('Rating', 'التقييم'), '☆ ☆ ☆ ☆ ☆']], 2, '#F5F0FF')
        + h2(L(ar)('Summary', 'الملخص'), '#6b21a8') + p('…') + h2(L(ar)('Main ideas', 'الأفكار الرئيسية'), '#6b21a8') + ul('…', '…', '…') + h2(L(ar)('My opinion', 'رأيي'), '#6b21a8') + p('…'),
    },
    {
      id: 'faq', group: 'creative', color: '#0d9488', label: { en: 'FAQ', ar: 'الأسئلة الشائعة' }, hint: { en: 'Question and answer blocks', ar: 'أسئلة وإجابات' },
      html: ({ ar, title }) => h1(esc(title || L(ar)('Frequently asked questions', 'الأسئلة الشائعة')), '#0f766e') + [1, 2, 3, 4].map((n) => callout(L(ar)(`Question ${n}?`, `السؤال ${n}؟`), L(ar)('Write a clear, short answer.', 'اكتب إجابة واضحة وقصيرة.'), '#0f766e', '#E6F6F3')).join(gap(1)),
    },
    {
      id: 'program', group: 'creative', color: '#c2410c', label: { en: 'Event programme', ar: 'برنامج فعالية' }, hint: { en: 'Timed schedule', ar: 'جدول بالتوقيتات' },
      html: ({ ar, title, today }) => banner(esc(title || L(ar)('Event programme', 'برنامج الفعالية')), '#9a3412', 24) + p(sp(today(ar), 'color:#595959'), 'text-align:center') + gap(1)
        + table(head(L(ar)('Time', 'الوقت'), L(ar)('Session', 'الفقرة'), L(ar)('Speaker', 'المتحدث')), blank(6, 3)),
    },
  ],
};
