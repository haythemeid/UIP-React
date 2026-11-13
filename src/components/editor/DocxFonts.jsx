import { useEffect, useMemo, useRef, useState } from 'react';
import Icon from '../Icon';
import { Pop2 } from './DocxUi';
import { FONT_GROUPS, FONT_LIST, loadWebFont, previewWebFont, listUserFonts, addUserFont, removeUserFont, getRecentFonts, pushRecentFont, fontInstalled } from '../../lib/officeFmt/docxFonts';

/**
 * Font picker of the Word editor: search, recently used, fonts used in this document, the built-in library (Arabic first),
 * the student's own font files, and a button to add a font file (.ttf / .otf / .woff / .woff2) that stays on this device.
 * Rows on screen preview with a tiny name-only font (a few KB); the real font downloads only when you pick it.
 */
function FontList({ tt, ar, current, onPick, close, used, setErr }) {
  const [q, setQ] = useState(''); const [mine, setMine] = useState([]); const [recent, setRecent] = useState([]); const file = useRef(null);
  const io = useRef(null); // previews only the rows that are really on screen
  const watch = (el) => {
    if (!el || typeof IntersectionObserver === 'undefined') return;
    if (!io.current) io.current = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { previewWebFont(e.target.dataset.font); io.current.unobserve(e.target); } }), { rootMargin: '40px' });
    io.current.observe(el);
  };
  useEffect(() => () => io.current?.disconnect(), []);
  useEffect(() => { let on = true; listUserFonts().then((l) => on && setMine(l)); getRecentFonts().then((l) => on && setRecent(l)); return () => { on = false; }; }, []);
  const norm = q.trim().toLowerCase();
  const match = (n) => !norm || n.toLowerCase().includes(norm);
  const groups = useMemo(() => FONT_GROUPS.map((g) => ({ ...g, list: FONT_LIST.filter((f) => f.g === g.id && match(f.name)) })).filter((g) => g.list.length), [norm]); // eslint-disable-line react-hooks/exhaustive-deps
  const pick = (name) => { loadWebFont(name); onPick(name); pushRecentFont(name); close(); };
  const add = async (f) => {
    if (!f) return;
    try { const r = await addUserFont(f); setMine((l) => [...l.filter((x) => x.name !== r.name), r]); onPick(r.name); setErr?.(''); }
    catch (e) { setErr?.(e?.message === 'size' ? tt('Font file is larger than 8 MB.', 'ملف الخط أكبر من 8 ميجا.') : tt('That font file could not be read.', 'تعذّر قراءة ملف الخط.')); }
  };
  const row = (name, mineFont, key) => {
    const ok = fontInstalled(name);
    return (
      <div key={key} className={`dxf__row${name === current ? ' is-on' : ''}`}>
        <button type="button" className="dxf__pick" ref={watch} data-font={name} onClick={() => pick(name)} style={{ fontFamily: `'${name}', sans-serif` }}>
          <span>{name}</span>{!ok && <em title={tt('Not installed on this device — it shows in another font here, and in Word only if the reader has it.', 'غير مثبّت على الجهاز ده — بيظهر بخط بديل هنا، وفي Word لو القارئ عنده.')}>!</em>}
        </button>
        {mineFont && <button type="button" className="dxf__del" title={tt('Remove this font', 'حذف الخط')} onClick={async () => { await removeUserFont(name); setMine((l) => l.filter((x) => x.name !== name)); }}><Icon name="trash" size={13} /></button>}
      </div>
    );
  };
  const section = (title, list, mineFont) => list.length > 0 && <div key={title}><small className="dxf__cap">{title}</small>{list.map((n) => row(n, mineFont, `${title}-${n}`))}</div>;
  return (
    <div className="dxf" dir={ar ? 'rtl' : 'ltr'}>
      <input className="dxf__q" autoFocus placeholder={tt('Search fonts…', 'ابحث عن خط…')} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter' && norm) { const first = [...mine.map((m) => m.name), ...FONT_LIST.map((f) => f.name)].find(match); if (first) pick(first); } }} />
      <div className="dxf__list">
        {section(tt('My fonts', 'خطوطي'), mine.map((m) => m.name).filter(match), true)}
        {!norm && section(tt('Recent', 'استُخدمت مؤخرًا'), recent.filter(match))}
        {!norm && section(tt('In this document', 'في المستند'), used.filter(match))}
        {groups.map((g) => section(tt(g.label.en, g.label.ar), g.list.map((f) => f.name)))}
        {norm && !groups.length && !mine.some((m) => match(m.name)) && <p className="dxf__none">{tt('No font with that name.', 'مفيش خط بالاسم ده.')}</p>}
      </div>
      <div className="dxf__foot">
        <button type="button" onClick={() => file.current?.click()}><Icon name="plus" size={14} />{tt('Add a font file…', 'إضافة ملف خط…')}</button>
        <input ref={file} type="file" accept=".ttf,.otf,.woff,.woff2" hidden onChange={(e) => { add(e.target.files?.[0]); e.target.value = ''; }} />
        <small>{tt('Saved on this device. The .docx stores only the font name.', 'بيتحفظ على الجهاز ده. ملف docx بيحفظ اسم الخط بس.')}</small>
      </div>
    </div>
  );
}

/** `current` = font name under the caret, `A.font(name)` applies it, `A.usedFonts()` lists the fonts of the document. */
export default function FontPicker({ tt, ar, current, disabled, A, onApply, setErr }) {
  const [used, setUsed] = useState([]);
  return (
    <Pop2 text={current || tt('Font', 'الخط')} label={tt('Font', 'الخط')} w={300} disabled={disabled} btnClass="dxf__trigger" className="dxf__pop">
      {(close) => <FontListLoader tt={tt} ar={ar} current={current} onPick={onApply || A.font} close={close} A={A} used={used} setUsed={setUsed} setErr={setErr} />}
    </Pop2>
  );
}
function FontListLoader({ A, used, setUsed, ...rest }) {
  useEffect(() => { try { setUsed(A.usedFonts?.() || []); } catch { /* ignore */ } }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return <FontList {...rest} used={used} />;
}
