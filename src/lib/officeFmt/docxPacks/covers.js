import { p, sp, b, big, rule, gap, grid, row, td, kv, banner, PB, C, esc } from '../docxHtml';

const L = (ar) => (en, a) => (ar ? a : en);
const meta = (ar) => [[L(ar)('Student', 'الطالب'), ''], [L(ar)('ID', 'الرقم الجامعي'), ''], [L(ar)('Supervisor', 'المشرف'), ''], [L(ar)('Course', 'المقرر'), '']];

export default {
  id: 'covers',
  label: { en: 'Cover pages', ar: 'صفحات الغلاف' },
  groups: [{ id: 'covers', label: { en: 'Cover pages', ar: 'صفحات غلاف' } }],
  templates: [
    {
      id: 'cover-academic', group: 'covers', color: '#b8891a', insertAt: 'start', label: { en: 'Academic cover', ar: 'غلاف أكاديمي' }, hint: { en: 'Centred, formal, with details', ar: 'رسمي متوسط مع البيانات' },
      html: ({ ar, title, today }) => p(big(L(ar)('University name', 'اسم الجامعة'), 20, C.navy), 'text-align:center;margin-bottom:0') + p(sp(L(ar)('Faculty / Department', 'الكلية / القسم'), 'color:#595959;font-size:14pt'), 'text-align:center') + rule(C.gold, '3pt')
        + gap(4) + p(big(esc(title || L(ar)('Document title', 'عنوان البحث')), 30, C.navy), 'text-align:center') + p(sp(L(ar)('Subtitle or course name', 'عنوان فرعي أو اسم المقرر'), 'font-size:15pt;font-style:italic;color:#595959'), 'text-align:center')
        + gap(4) + kv(meta(ar)) + gap(3) + p(sp(today(ar), 'color:#595959;font-size:13pt'), 'text-align:center') + PB,
    },
    {
      id: 'cover-band', group: 'covers', color: '#1F3864', insertAt: 'start', label: { en: 'Banner cover', ar: 'غلاف بشريط' }, hint: { en: 'Dark banner with title', ar: 'شريط داكن بالعنوان' },
      html: ({ ar, title, today }) => banner(L(ar)('Report', 'تقرير'), C.navy, 14) + gap(2) + p(big(esc(title || L(ar)('Document title', 'عنوان المستند')), 34, C.navy), 'text-align:start') + rule(C.blue, '4pt')
        + p(sp(L(ar)('A short line describing the document.', 'سطر قصير يوضح محتوى المستند.'), 'font-size:15pt;color:#595959')) + gap(6) + p(b(L(ar)('Prepared by', 'إعداد')) + ' ..................') + p(b(L(ar)('Date', 'التاريخ')) + ' ' + today(ar)) + PB,
    },
    {
      id: 'cover-minimal', group: 'covers', color: '#475569', insertAt: 'start', label: { en: 'Minimal cover', ar: 'غلاف بسيط' }, hint: { en: 'Lots of white space', ar: 'مساحة بيضاء واسعة' },
      html: ({ ar, title, today }) => gap(8) + p(big(esc(title || L(ar)('Title', 'العنوان')), 40, '#111827'), 'margin-bottom:0') + p('', 'border-bottom:6pt solid #111827;width:20%') + p(sp(L(ar)('Subtitle', 'العنوان الفرعي'), 'font-size:16pt;color:#6b7280')) + gap(10) + p(sp(L(ar)('Author name', 'اسم المؤلف'), 'font-size:13pt;font-weight:bold')) + p(sp(today(ar), 'color:#6b7280')) + PB,
    },
    {
      id: 'cover-split', group: 'covers', color: '#0d9488', insertAt: 'start', label: { en: 'Split cover', ar: 'غلاف بعمودين' }, hint: { en: 'Coloured side + title', ar: 'عمود ملون وعنوان' },
      html: ({ ar, title, today }) => grid(row(td(p(sp(String(new Date().getFullYear()), 'color:#fff;font-size:34pt;font-weight:bold'), 'text-align:center;margin-top:90pt;margin-bottom:90pt'), 'background-color:#0f766e;width:26%'),
        td(p(sp(L(ar)('PROJECT', 'مشروع'), 'color:#0f766e;font-weight:bold;letter-spacing:2pt')) + p(big(esc(title || L(ar)('Document title', 'عنوان المستند')), 30, '#134e4a')) + p(sp(L(ar)('Short description of the work.', 'وصف قصير للعمل.'), 'font-size:14pt;color:#595959')) + gap(5) + p(b(L(ar)('Team', 'الفريق'))) + p('.................. ') + p('.................. ') + p(sp(today(ar), 'color:#595959'))))) + PB,
    },
    {
      id: 'cover-framed', group: 'covers', color: '#7a1f1f', insertAt: 'start', label: { en: 'Framed cover', ar: 'غلاف بإطار' }, hint: { en: 'Elegant frame, centred', ar: 'إطار أنيق ومتوسط' },
      html: ({ ar, title, today }) => `<table data-b="none"><tbody><tr><td style="border:4pt double #7a1f1f">${gap(3) + p(sp('✦', 'color:#7a1f1f;font-size:24pt'), 'text-align:center') + p(big(esc(title || L(ar)('Document title', 'عنوان المستند')), 30, '#7a1f1f'), 'text-align:center') + p(sp(L(ar)('Subtitle', 'العنوان الفرعي'), 'font-size:15pt;font-style:italic;color:#595959'), 'text-align:center') + rule('#7a1f1f', '1pt') + gap(3) + p(b('..................'), 'text-align:center') + p(sp(today(ar), 'color:#595959'), 'text-align:center') + gap(3)}</td></tr></tbody></table>` + PB,
    },
    {
      id: 'cover-tech', group: 'covers', color: '#0f172a', insertAt: 'start', label: { en: 'Technical report cover', ar: 'غلاف تقرير فني' }, hint: { en: 'Version table', ar: 'مع جدول الإصدار' },
      html: ({ ar, title, today }) => p(sp(L(ar)('TECHNICAL REPORT', 'تقرير فني'), 'color:#64748b;font-weight:bold;letter-spacing:2pt;font-size:11pt')) + p(big(esc(title || L(ar)('Document title', 'عنوان التقرير')), 32, '#0f172a'), 'margin-bottom:2pt') + rule('#0f172a', '3pt') + gap(6)
        + kv([[L(ar)('Version', 'الإصدار'), '1.0'], [L(ar)('Date', 'التاريخ'), today(ar)], [L(ar)('Author', 'المؤلف'), ''], [L(ar)('Status', 'الحالة'), L(ar)('Draft', 'مسودة')]], 2, '#E2E8F0') + PB,
    },
  ],
};
