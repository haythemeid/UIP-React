# ثيمات محرر Word / PowerPoint

انسخ مجلد `src` فوق `src` بتاع المشروع.

- جديد: `lib/officeFmt/edThemes.js` (13 ثيم: كلاسيك داكن + Word فاتح + ورق دافي + كل ثيمات محرر الأكواد)، `components/editor/EdThemePicker.jsx`
- متعدّل: `OfficeShell.jsx` (بيطبّق الثيم)، `DocxRibbon.jsx` و`PptxRibbon.jsx` (قايمة السمة في تبويب «عرض»)،
  `accountSync.jsx` (الثيم بيتزامن بين أجهزتك)، وملفات الـ CSS (pptx / office / docx / docx-pro / editor) — الألوان الثابتة اتحوّلت لمتغيرات.
- الاختيار بيتحفظ، ولو مفيش اختيار بياخد ثيم محرر الأكواد بتاعك.
