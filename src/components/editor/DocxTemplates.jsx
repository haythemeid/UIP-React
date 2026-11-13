import { useEffect, useMemo, useRef, useState } from 'react';
import Icon from '../Icon';
import { Modal, Seg } from './DocxUi';
import { sanitizeHtml } from '../../lib/officeFmt/docx';
import { today } from '../../lib/officeFmt/docxHtml';
import { loadTemplateLibrary, MINE } from '../../lib/officeFmt/docxTemplateIndex';
import { deleteUserTemplate, templatesToJson, templatesFromJson, saveUserTemplate } from '../../lib/officeFmt/docxStore';

/** Live thumbnail: the real template HTML on a tiny page, built only when the card scrolls into view (60+ templates must not cost anything up front). */
function Thumb({ item, ar, title }) {
  const ref = useRef(null); const [html, setHtml] = useState(null);
  useEffect(() => {
    const el = ref.current; if (!el) return undefined;
    const io = new IntersectionObserver((es) => {
      if (!es[0].isIntersecting) return; io.disconnect();
      try { setHtml(sanitizeHtml(item.html({ ar, title, today })) || ''); } catch { setHtml(''); }
    }, { rootMargin: '160px' });
    io.observe(el); return () => io.disconnect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <span ref={ref} className="dxtp__thumb" style={{ '--c': item.color }}>
      {html ? <span className="dxp dxtp__page" dir={ar ? 'rtl' : 'ltr'} dangerouslySetInnerHTML={{ __html: html }} /> : <i />}
    </span>
  );
}

const download = (name, text) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); };

/**
 * Template gallery. Every template can be put into the document FOUR ways — not only "replace":
 *   at the cursor · at the start (cover pages: adds a page break after) · at the end (adds a page break before) · replace the document.
 * Sources: built-in, packs (drop a .js in lib/officeFmt/docxPacks), and "My templates" (saved from a document, importable / exportable as .json).
 */
export default function TemplateDialog({ tt, ar, docTitle, group: startGroup = 'all', hasContent, onClose, onApply, onSaveCurrent, canSave }) {
  const [lib, setLib] = useState(null); const [group, setGroup] = useState(startGroup); const [q, setQ] = useState(''); const [mode, setMode] = useState(null);
  const [naming, setNaming] = useState(false); const [name, setName] = useState(''); const [msg, setMsg] = useState(''); const file = useRef(null);
  const reload = () => loadTemplateLibrary().then(setLib);
  useEffect(() => { let on = true; loadTemplateLibrary().then((l) => on && setLib(l)); return () => { on = false; }; }, []);
  const groups = useMemo(() => {
    if (!lib) return [];
    const all = [{ id: 'all', label: { en: 'All', ar: 'الكل' } }, MINE, ...lib.groups];
    return all.filter((g) => g.id === 'all' || lib.items.some((i) => i.group === g.id));
  }, [lib]);
  const norm = q.trim().toLowerCase();
  const items = useMemo(() => (lib ? lib.items.filter((i) => (group === 'all' || i.group === group) && (!norm || `${i.label.en} ${i.label.ar} ${i.hint?.en || ''} ${i.hint?.ar || ''}`.toLowerCase().includes(norm))) : []), [lib, group, norm]);
  const defMode = (i) => mode || i.insertAt || (hasContent ? 'cursor' : 'replace');
  const mine = lib ? lib.items.filter((i) => i.source === 'mine') : [];
  const say = (t) => { setMsg(t); setTimeout(() => setMsg(''), 3500); };

  const doSave = async () => {
    const n = name.trim(); if (!n) return;
    try { await onSaveCurrent(n); setNaming(false); setName(''); await reload(); setGroup('mine'); say(tt('Saved in My templates.', 'اتحفظ في قوالبي.')); } catch { say(tt('Could not save the template.', 'تعذّر حفظ القالب.')); }
  };
  const doImport = async (f) => {
    if (!f) return;
    try { const list = templatesFromJson(await f.text()); for (const t of list) await saveUserTemplate(t); await reload(); setGroup('mine'); say(tt(`${list.length} template(s) imported.`, `تم استيراد ${list.length} قالب.`)); }
    catch { say(tt('That file is not a template file.', 'الملف ده مش ملف قوالب.')); }
  };

  return (
    <Modal title={tt('Templates & cover pages', 'القوالب وصفحات الغلاف')} onClose={onClose} w={1020} className="dxtp" footer={(
      <div className="dxtp__foot">
        {canSave && (naming
          ? <span className="dxtp__name"><input autoFocus value={name} placeholder={tt('Template name', 'اسم القالب')} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') doSave(); if (e.key === 'Escape') setNaming(false); }} /><button type="button" onClick={doSave} disabled={!name.trim()}>{tt('Save', 'حفظ')}</button><button type="button" onClick={() => setNaming(false)}>{tt('Cancel', 'إلغاء')}</button></span>
          : <button type="button" onClick={() => setNaming(true)}><Icon name="save" size={14} />{tt('Save this document as a template', 'احفظ المستند ده كقالب')}</button>)}
        <button type="button" onClick={() => file.current?.click()}><Icon name="upload" size={14} />{tt('Import templates (.json)', 'استيراد قوالب (.json)')}</button>
        <input ref={file} type="file" accept=".json,application/json" hidden onChange={(e) => { doImport(e.target.files?.[0]); e.target.value = ''; }} />
        <button type="button" disabled={!mine.length} onClick={() => download('my-templates.json', templatesToJson(mine.map((m) => m.rec)))}><Icon name="download" size={14} />{tt('Export my templates', 'تصدير قوالبي')}</button>
        <span className="dxtp__msg" role="status">{msg}</span>
      </div>
    )}>
      <div className="dxtp__bar">
        <label className="dxtp__search"><Icon name="search" size={15} /><input value={q} placeholder={tt('Search templates…', 'ابحث في القوالب…')} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.stopPropagation()} /></label>
        <span className="dxtp__modelbl">{tt('Add to the document:', 'إضافة للمستند:')}</span>
        <Seg value={mode || 'auto'} onChange={(v) => setMode(v === 'auto' ? null : v)} items={[['auto', tt('Smart', 'تلقائي')], ['cursor', tt('At cursor', 'عند المؤشر')], ['start', tt('At start', 'في البداية')], ['end', tt('At end', 'في النهاية')], ['replace', tt('Replace all', 'استبدال الكل')]]} />
      </div>
      <div className="dxtp__main">
        <nav className="dxtp__nav" aria-label={tt('Template groups', 'مجموعات القوالب')}>
          {groups.map((g) => <button key={g.id} type="button" className={g.id === group ? 'is-on' : ''} onClick={() => setGroup(g.id)}>{ar ? g.label.ar : g.label.en}</button>)}
        </nav>
        <div className="dxtp__grid">
          {!lib && <p className="dxtp__empty">{tt('Loading…', 'جارٍ التحميل…')}</p>}
          {lib && !items.length && <p className="dxtp__empty">{group === 'mine' ? tt('No saved templates yet. Use “Save this document as a template”.', 'لسه مفيش قوالب محفوظة. استخدم "احفظ المستند ده كقالب".') : tt('Nothing matches your search.', 'مفيش نتيجة للبحث.')}</p>}
          {items.map((i) => (
            <div key={i.id} className="dxtp__card">
              <button type="button" className="dxtp__use" onClick={() => onApply(i, defMode(i))}>
                <Thumb item={i} ar={ar} title={docTitle} />
                <b>{ar ? i.label.ar : i.label.en}</b><small>{(ar ? i.hint?.ar : i.hint?.en) || ''}</small>
              </button>
              {i.source === 'mine' && <button type="button" className="dxtp__del" title={tt('Delete this template', 'حذف القالب')} onClick={async () => { if (window.confirm(tt('Delete this template?', 'حذف القالب ده؟'))) { await deleteUserTemplate(i.id); reload(); } }}><Icon name="trash" size={13} /></button>}
              <span className="dxtp__how">{{ cursor: tt('at cursor', 'عند المؤشر'), start: tt('at start', 'في البداية'), end: tt('at end', 'في النهاية'), replace: tt('replace', 'استبدال') }[defMode(i)]}</span>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
