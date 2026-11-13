import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import { TextSelection } from '@tiptap/pm/state';
import OfficeShell from './OfficeShell';
import { Btn } from './EditorUI';
import DocxBar from './DocxBar';
import DocxRuler from './DocxRuler';
import { FloatingBar, DocxContextMenu, TemplateGallery } from './DocxPopups';
import { PageBorders } from './DocxView';
import { readDocx, htmlToDocx, sanitizeHtml } from '../../lib/officeFmt/docx';
import { DOCX_TEMPLATES, docxTemplateHtml, DOC_THEMES } from '../../lib/officeFmt/docxTemplates';
import { twToPx, tableHtml, fitImage, countWords, normalizeUrl, printDocument, PAGE_SIZES } from './docxEdit';
import { buildExtensions } from './tiptap/extensions';
import { prepareForDocx, normalizeIncoming } from './tiptap/exportHtml';
import { blocksIn, patchBlocks, blockStyle, applySpan, spanAt, patchCells, mergeNext } from './tiptap/docCommands';
import { mergeStyle, parseStyle, ptOf, isBlankHtml } from './tiptap/cssUtil';
import { searchState, setSearch, replaceCurrent, replaceAll } from './tiptap/search';
import '../../styles/css/docx.css';
import '../../styles/css/docx-pro.css';
import '../../styles/css/office.css';

const WARN = { chart: ['Charts are not editable here and will be dropped on save.', 'الرسوم البيانية مش قابلة للتعديل هنا وهتتشال عند الحفظ.'], textbox: ['Text boxes are not editable here and will be dropped on save.', 'مربعات النص مش قابلة للتعديل هنا وهتتشال عند الحفظ.'], shape: ['Shapes are not editable here and will be dropped on save.', 'الأشكال مش قابلة للتعديل هنا وهتتشال عند الحفظ.'], notes: ['Footnotes / endnotes are not kept on save.', 'الحواشي مش بتتحفظ.'], firstPage: ['Only the default header / footer is kept.', 'بيتحفظ الهيدر والفوتر الافتراضي بس.'] };
const HEAD_PT = { 1: 16, 2: 13, 3: 12 };
const pageStyle = (pg, d, zoom) => ({
  width: twToPx(pg.w), minHeight: twToPx(pg.h), padding: `${twToPx(Math.min(pg.header, pg.top))}px ${twToPx(pg.right)}px ${twToPx(Math.min(pg.footer, pg.bottom))}px ${twToPx(pg.left)}px`,
  '--dx-hmin': `${twToPx(Math.max(0, pg.top - pg.header))}px`, '--dx-fmin': `${twToPx(Math.max(0, pg.bottom - pg.footer))}px`,
  '--dx-font': `'${d.font}', Calibri, Arial, 'Noto Naskh Arabic', sans-serif`, '--dx-size': `${d.size}pt`, '--dx-before': `${d.before}pt`, '--dx-after': `${d.after}pt`, '--dx-line': d.line,
  '--dx-ph': `${twToPx(pg.h)}px`, '--dx-hd': `${twToPx(pg.header)}px`, '--dx-fd': `${twToPx(pg.footer)}px`, zoom,
});

/** Word editor on Tiptap / ProseMirror: real document model, native undo history, mouse selection, table / picture handles, find & replace. Saves the same .docx as the old editor. */
export default function DocxTiptap(props) {
  const { blob, tt } = props; const [initial, setInitial] = useState(null); const [err, setErr] = useState('');
  useEffect(() => { let d = false; blob.arrayBuffer().then((b) => readDocx(b)).then((r) => !d && setInitial(r)).catch((e) => !d && setErr(e?.message || String(e))); return () => { d = true; }; }, [blob]);
  if (err) return <div className="ed ed--center"><p className="ed__err">{err}</p><Btn label={tt('Close', 'إغلاق')} onClick={props.onClose} /></div>;
  if (!initial) return <div className="ed ed--center"><span className="st-fv-spinner" /><p className="ed__hint">{tt('Opening the document…', 'جارٍ فتح المستند…')}</p></div>;
  return <Inner {...props} initial={initial} />;
}

function Inner({ initial, fileName, tt, rtl: uiRtl, guardRef, onSave, onClose, draftKey, startDirty = false, onLegacy }) {
  const ar = !!uiRtl;
  const [dirty, setDirty] = useState(startDirty); const [ver, setVer] = useState(0);
  const [pg, setPg] = useState(initial.page); const [def, setDef] = useState(initial.defaults); const pgRef = useRef(initial.page); const defRef = useRef(initial.defaults);
  const [tab, setTab] = useState('home'); const [zoom, setZoom] = useState(1); const [fmt, setFmt] = useState({ has: false }); const [hist, setHist] = useState({ u: false, r: false });
  const [find, setFind] = useState({ open: false, q: '', r: '', mc: false, idx: 0, total: 0, showReplace: false });
  const [words, setWords] = useState({ all: 0, sel: 0 }); const [pages, setPages] = useState(1); const [err, setErr] = useState('');
  const [emptyBand, setEmptyBand] = useState({ hdr: isBlankHtml(initial.header), ftr: isBlankHtml(initial.footer) });
  const [menu, setMenu] = useState(null); const [gallery, setGallery] = useState(false); const [ruler, setRuler] = useState(false); const [ftick, setFtick] = useState(0);
  const stage = useRef(null); const pageEl = useRef(null); const activeKey = useRef('body'); const A_ref = useRef(null); const fmtRaf = useRef(0); const selWas = useRef(false); const A_live = useRef(null);
  // typing must not re-render the whole editor tree: `dirty` flips once, the change counter (autosave / word count) is debounced
  const verTimer = useRef(0);
  const mark = useCallback(() => { setDirty(true); clearTimeout(verTimer.current); verTimer.current = setTimeout(() => setVer((v) => v + 1), 500); }, []);
  useEffect(() => () => clearTimeout(verTimer.current), []);
  const bigDoc = useMemo(() => (initial.html || '').length > 30000, [initial]);

  const mk = (html, key) => ({
    extensions: buildExtensions(), content: normalizeIncoming(html) || '<p></p>', shouldRerenderOnTransaction: false,
    editorProps: {
      attributes: { class: key === 'body' ? 'dxp__body' : key === 'hdr' ? 'dxp__hdr' : 'dxp__ftr', spellcheck: bigDoc ? 'false' : 'true', role: 'textbox', 'aria-multiline': 'true', 'aria-label': key === 'body' ? tt('Document', 'المستند') : key === 'hdr' ? tt('Header', 'رأس الصفحة') : tt('Footer', 'تذييل الصفحة') },
      transformPastedHTML: (h) => normalizeIncoming(sanitizeHtml(h) || h),
      handleKeyDown: (_v, e) => A_ref.current?.key(e) || false,
      handlePaste: (view, e) => { const f = Array.from(e.clipboardData?.files || []).find((x) => x.type.startsWith('image/')); if (f) { A_ref.current?.picture(f); return true; } return false; },
      handleDrop: (view, e) => { const f = Array.from(e.dataTransfer?.files || []).find((x) => x.type.startsWith('image/')); if (!f) return false; e.preventDefault(); const at = view.posAtCoords({ left: e.clientX, top: e.clientY }); if (at) view.dispatch(view.state.tr.setSelection(view.state.selection.constructor.near(view.state.doc.resolve(at.pos)))); A_ref.current?.picture(f); return true; },
      handleDOMEvents: { contextmenu: (view, e) => { A_ref.current?.ctx(e); return true; }, click: (view, e) => { const a = e.target.closest?.('a'); if (a && (e.ctrlKey || e.metaKey)) { window.open(a.href, '_blank', 'noopener'); return true; } return false; } },
    },
    onUpdate: () => { if (key !== 'body') setEmptyBand((s) => ({ ...s, [key]: false })); mark(); },
    onFocus: () => { activeKey.current = key; },
    onSelectionUpdate: () => A_ref.current?.fmtSoon(), onTransaction: () => A_ref.current?.fmtSoon(),
  });
  // options are built ONCE: a fresh options object on every render made Tiptap re-apply them to the view after each keystroke
  const bodyOpts = useMemo(() => mk(initial.html, 'body'), []); // eslint-disable-line react-hooks/exhaustive-deps
  const hdrOpts = useMemo(() => mk(initial.header, 'hdr'), []); // eslint-disable-line react-hooks/exhaustive-deps
  const ftrOpts = useMemo(() => mk(initial.footer, 'ftr'), []); // eslint-disable-line react-hooks/exhaustive-deps
  const body = useEditor(bodyOpts); const hdr = useEditor(hdrOpts); const ftr = useEditor(ftrOpts);
  const active = () => ({ body, hdr, ftr }[activeKey.current] || body);
  const run = (fn) => { const ed = active(); if (!ed || ed.isDestroyed) return; fn(ed, ed.chain().focus()); };

  /* -------------------------------------------------------------- ribbon state */
  const updateFmt = useCallback(() => {
    const ed = { body, hdr, ftr }[activeKey.current] || body; if (!ed || ed.isDestroyed || !body) return;
    const { state } = ed; const sel = state.selection; const blk = blocksIn(state)[0]?.node || sel.$from.parent;
    const span = spanAt(ed); const bs = parseStyle(blk?.attrs?.style); const d = defRef.current;
    const level = blk?.type.name === 'heading' ? blk.attrs.level : 0; const st = blk?.attrs?.dataSt;
    const dirRtl = (blk?.attrs?.dir || (d.rtl ? 'rtl' : 'ltr')) === 'rtl';
    let al = bs['text-align'] || (dirRtl ? 'right' : 'left'); if (al === 'start') al = dirRtl ? 'right' : 'left'; if (al === 'end') al = dirRtl ? 'left' : 'right';
    const base = st === 'title' ? 26 : st === 'subtitle' ? 14 : level ? (HEAD_PT[level] || 11) : d.size;
    const lh = parseFloat(bs['line-height']);
    const next = {
      has: true, root: activeKey.current, font: (span['font-family'] || '').split(',')[0].replace(/['"]/g, '').trim() || d.font, size: ptOf(span['font-size']) || base,
      b: ed.isActive('bold') || level > 0, i: ed.isActive('italic'), u: ed.isActive('underline'), st: ed.isActive('strike'), sub: ed.isActive('subscript'), sup: ed.isActive('superscript'),
      color: span.color || '#000000', hl: span['background-color'] || null, align: al, rtl: dirRtl,
      style: st || (level ? `h${level}` : 'p'), list: ed.isActive('bulletList') ? 'ul' : ed.isActive('orderedList') ? 'ol' : null, link: ed.isActive('link'), inTable: ed.isActive('table'),
      line: Number.isFinite(lh) && lh < 10 ? lh : d.line, before: ptOf(bs['margin-top']) ?? d.before, after: ptOf(bs['margin-bottom']) ?? d.after,
      img: sel.node?.type.name === 'image' ? Math.round(sel.node.attrs.width || 0) : 0,
    };
    setFmt((p) => { for (const k of Object.keys(next)) if (p[k] !== next[k]) return next; return p; });
    setHist((h) => { const u = ed.can().undo(); const r = ed.can().redo(); return h.u === u && h.r === r ? h : { u, r }; });
    const nonEmpty = !sel.empty; if (nonEmpty || selWas.current) setFtick((t) => t + 1); selWas.current = nonEmpty;
  }, [body, hdr, ftr]);
  const fmtSoon = useCallback(() => { if (fmtRaf.current) return; fmtRaf.current = requestAnimationFrame(() => { fmtRaf.current = 0; updateFmt(); }); }, [updateFmt]);
  useEffect(() => () => cancelAnimationFrame(fmtRaf.current), []);

  /* -------------------------------------------------------------- word / page counts, find refresh */
  useEffect(() => {
    if (!body) return undefined;
    const t = setTimeout(() => {
      const sel = body.state.selection; const selText = sel.empty ? '' : body.state.doc.textBetween(sel.from, sel.to, ' ');
      setWords({ all: countWords(body.state.doc.textBetween(0, body.state.doc.content.size, ' ')), sel: countWords(selText) });
      if (find.open) { const s = searchState(body); setFind((f) => (f.total === s.matches.length && f.idx === s.cur ? f : { ...f, total: s.matches.length, idx: s.cur })); }
    }, 400);
    return () => clearTimeout(t);
  }, [ver, ftick, body, find.open]);
  useEffect(() => {
    const el = pageEl.current; if (!el) return undefined; const ph = twToPx(pg.h);
    const calc = () => setPages(Math.max(1, Math.ceil(el.offsetHeight / ph - 0.02))); calc(); const ro = new ResizeObserver(calc); ro.observe(el); return () => ro.disconnect();
  }, [pg.h]);
  useEffect(() => { // Ctrl + wheel = zoom
    const el = stage.current; if (!el) return undefined;
    const h = (e) => { if (!(e.ctrlKey || e.metaKey)) return; e.preventDefault(); setZoom((z) => Math.max(0.3, Math.min(2.5, Math.round((z - Math.sign(e.deltaY) * 0.1) * 10) / 10))); };
    el.addEventListener('wheel', h, { passive: false }); return () => el.removeEventListener('wheel', h);
  }, []);

  /* -------------------------------------------------------------- actions (same contract as the old editor, so the ribbon is shared) */
  const setPage = (fn) => { const next = fn(pgRef.current); pgRef.current = next; setPg(next); mark(); };
  const insertPicture = async (file) => {
    try { const { src, w, h } = await fitImage(file); run((ed, c) => c.setImage({ src, width: w, height: h }).run()); } catch (e) { setErr(e?.message === 'size' ? tt('Picture is larger than 20 MB.', 'الصورة أكبر من 20 ميجا.') : tt('That picture could not be added.', 'تعذّر إضافة الصورة.')); }
  };
  const doFind = (q, mc, idx = 0, jump = false) => { if (!body) return; setSearch(body, { q, mc, cur: Math.max(0, idx) }, false); const s = searchState(body); const i = s.matches.length ? ((idx % s.matches.length) + s.matches.length) % s.matches.length : 0; if (i !== s.cur) setSearch(body, { cur: i }, jump); else if (jump) setSearch(body, {}, true); setFind((f) => ({ ...f, q, mc, idx: i, total: s.matches.length })); };
  const A = {
    setTab, undo: () => run((ed, c) => c.undo().run()), redo: () => run((ed, c) => c.redo().run()),
    toggle: (k) => run((ed, c) => ({ bold: c.toggleBold(), italic: c.toggleItalic(), underline: c.toggleUnderline(), strikeThrough: c.toggleStrike(), subscript: c.toggleSubscript(), superscript: c.toggleSuperscript() }[k]?.run())),
    font: (f) => run((ed) => applySpan(ed, { 'font-family': `'${f}'` })),
    size: (pt) => { if (pt > 0) run((ed) => applySpan(ed, { 'font-size': `${pt}pt` })); },
    color: (c) => run((ed) => applySpan(ed, { color: c || '#000000' })),
    highlight: (c) => run((ed) => applySpan(ed, { 'background-color': c || null })),
    clear: () => run((ed, c) => { c.unsetAllMarks().run(); patchBlocks(ed, (n) => ({ dataSt: null, style: mergeStyle(n.attrs.style, { 'font-size': null, color: null, 'font-family': null }) })); }),
    style: (id) => run((ed, c) => {
      if (/^h[1-4]$/.test(id)) c.setHeading({ level: Number(id[1]) }).run(); else c.setParagraph().run();
      patchBlocks(ed, () => ({ dataSt: ['title', 'subtitle', 'quote'].includes(id) ? id : null }));
    }),
    align: (a) => run((ed) => patchBlocks(ed, blockStyle({ 'text-align': a }))),
    list: (kind, type) => run((ed, c) => {
      if (kind === 'ul') { c.toggleBulletList().run(); return; }
      if (fmt.list === 'ol' && !type) { c.toggleOrderedList().run(); return; }
      if (!ed.isActive('orderedList')) c.toggleOrderedList().run();
      ed.chain().focus().updateAttributes('orderedList', { listType: type && type !== '1' ? type : null }).run();
    }),
    indent: (dir) => run((ed, c) => {
      if (ed.isActive('listItem')) { (dir > 0 ? c.sinkListItem('listItem') : c.liftListItem('listItem')).run(); return; }
      patchBlocks(ed, (n) => { const cur = ptOf(parseStyle(n.attrs.style)['margin-inline-start']) || 0; const v = Math.max(0, cur + dir * 36); return { style: mergeStyle(n.attrs.style, { 'margin-inline-start': v ? `${v}pt` : null }) }; });
    }),
    dir: (d) => run((ed) => patchBlocks(ed, (n) => { const s = parseStyle(n.attrs.style); const ta = s['text-align']; return { dir: d, style: ta === 'left' || ta === 'right' ? mergeStyle(n.attrs.style, { 'text-align': d === 'rtl' ? 'right' : 'left' }) : n.attrs.style }; })),
    spacing: (k, v) => run((ed) => patchBlocks(ed, blockStyle(k === 'line' ? { 'line-height': String(v) } : { [k === 'before' ? 'margin-top' : 'margin-bottom']: `${v}pt` }))),
    link: () => {
      const u = window.prompt(tt('Link address (https://…)', 'عنوان الرابط (https://…)'), fmt.link ? '' : 'https://'); if (u === null) return;
      const url = normalizeUrl(u); if (!url) { if (u.trim()) setErr(tt('That address is not allowed.', 'العنوان ده مش مسموح.')); return; }
      run((ed, c) => { if (ed.state.selection.empty && !ed.isActive('link')) c.insertContent({ type: 'text', text: u.trim(), marks: [{ type: 'link', attrs: { href: url } }] }).run(); else c.extendMarkRange('link').setLink({ href: url }).run(); });
    },
    unlink: () => run((ed, c) => c.extendMarkRange('link').unsetLink().run()),
    symbol: (ch) => run((ed, c) => c.insertContent(ch).run()),
    pageBreak: () => { if (activeKey.current === 'body') run((ed, c) => c.insertContent([{ type: 'pageBreak' }, { type: 'paragraph' }]).run()); },
    field: (kind) => run((ed, c) => c.insertContent({ type: 'field', attrs: { kind } }).run()),
    band: (which) => { const e = which === 'hdr' ? hdr : ftr; if (!e) return; activeKey.current = which; setEmptyBand((s) => ({ ...s, [which]: false })); e.commands.focus('end'); },
    delBand: (which) => { const e = which === 'hdr' ? hdr : ftr; e?.commands.clearContent(true); setEmptyBand((s) => ({ ...s, [which]: true })); mark(); },
    table: (r, c) => {
      if (activeKey.current !== 'body') return;
      run((ed, ch) => {
        const at = ed.state.selection.to; ch.setTextSelection(at).insertContent(normalizeIncoming(tableHtml(r, c, def.rtl))).run();
        let first = null; ed.state.doc.descendants((n, pos) => { if (!first && n.type.name === 'table' && pos >= at - 2) { first = pos; return false; } return !first; });
        if (first !== null) ed.view.dispatch(ed.state.tr.setSelection(TextSelection.near(ed.state.doc.resolve(first + 1), 1)).scrollIntoView());
      });
    },
    tRow: (after) => run((ed, c) => (after ? c.addRowAfter() : c.addRowBefore()).run()), tCol: (after) => run((ed, c) => (after ? c.addColumnAfter() : c.addColumnBefore()).run()),
    tDelRow: () => run((ed, c) => c.deleteRow().run()), tDelCol: () => run((ed, c) => c.deleteColumn().run()), tDel: () => run((ed, c) => c.deleteTable().run()),
    tMerge: () => run((ed) => mergeNext(ed)), tSplit: () => run((ed, c) => c.splitCell().run()),
    tShade: (c) => run((ed) => patchCells(ed, (n) => ({ style: mergeStyle(n.attrs.style, { 'background-color': c || null }) }))),
    tBorders: () => run((ed) => { const { $from } = ed.state.selection; for (let d = $from.depth; d > 0; d -= 1) { const n = $from.node(d); if (n.type.name === 'table') { ed.view.dispatch(ed.state.tr.setNodeMarkup($from.before(d), undefined, { ...n.attrs, dataB: n.attrs.dataB === 'none' ? null : 'none' })); break; } } }),
    tValign: (v) => run((ed) => patchCells(ed, (n) => ({ style: mergeStyle(n.attrs.style, { 'vertical-align': v === 'top' ? null : v }) }))),
    tStyle: (kind) => run((ed) => patchCells(ed, (n) => ({ style: mergeStyle(n.attrs.style, kind === 'header' ? { 'background-color': '#1F3864' } : kind === 'zebra' ? { 'background-color': '#E8EEF9' } : { 'background-color': null }) }))),
    image: () => { const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/png,image/jpeg,image/gif,image/webp,image/bmp'; i.onchange = () => { const f = i.files?.[0]; if (f) insertPicture(f); }; i.click(); },
    imgWidth: (w) => run((ed) => { const n = ed.state.selection.node; if (n?.type.name !== 'image' || !(w > 8)) return; const ratio = (n.attrs.height || 3) / (n.attrs.width || 4); ed.view.dispatch(ed.state.tr.setNodeMarkup(ed.state.selection.from, undefined, { ...n.attrs, width: Math.round(w), height: Math.round(w * ratio) })); }),
    imgDel: () => run((ed, c) => c.deleteSelection().run()),
    imgFloat: (side) => run((ed) => { const n = ed.state.selection.node; if (n?.type.name === 'image') ed.view.dispatch(ed.state.tr.setNodeMarkup(ed.state.selection.from, undefined, { ...n.attrs, dataFl: side || null })); }),
    pageSize: (name) => setPage((p) => { const s = PAGE_SIZES.find((x) => x[0] === name); if (!s) return p; return p.w > p.h ? { ...p, w: s[2], h: s[1] } : { ...p, w: s[1], h: s[2] }; }),
    orient: (land) => setPage((p) => { const w = Math.min(p.w, p.h); const h = Math.max(p.w, p.h); return land ? { ...p, w: h, h: w } : { ...p, w, h }; }),
    margins: (m) => setPage((p) => ({ ...p, ...m })),
    setZoom, fit: () => { const w = stage.current?.clientWidth; if (w) setZoom(Math.max(0.3, Math.min(2, (w - 40) / twToPx(pgRef.current.w)))); },
    openFind: (replace) => { setFind((f) => ({ ...f, open: true, showReplace: !!replace })); const s = body && body.state.selection; if (s && !s.empty) { const q = body.state.doc.textBetween(s.from, s.to, ' ').slice(0, 80); if (q && !q.includes('\n')) doFind(q, false, 0, true); } },
    print: () => printDocument({ body: body.getHTML(), header: isBlankHtml(hdr.getHTML()) ? '' : hdr.getHTML(), footer: isBlankHtml(ftr.getHTML()) ? '' : ftr.getHTML(), page: pgRef.current, look: defRef.current, rtl: !!defRef.current.rtl }),
    cut: () => run(() => document.execCommand('cut')), copy: () => run(() => document.execCommand('copy')),
    paste: async () => {
      try {
        const items = await navigator.clipboard.read();
        for (const it of items) { const img = it.types.find((t) => t.startsWith('image/')); if (img) { insertPicture(await it.getType(img)); return; } if (it.types.includes('text/html')) { const h = await (await it.getType('text/html')).text(); run((ed, c) => c.insertContent(normalizeIncoming(sanitizeHtml(h))).run()); return; } }
      } catch { /* fall through to plain text */ }
      try { const t = await navigator.clipboard.readText(); run((ed, c) => c.insertContent(t.replace(/\r/g, '').split('\n').map((l) => ({ type: 'paragraph', content: l ? [{ type: 'text', text: l }] : undefined }))).run()); } catch { setErr(tt('Use Ctrl+V to paste here.', 'استخدم Ctrl+V للصق هنا.')); }
    },
    /* ---- Word-pro extras */
    selectAll: () => run((ed, c) => c.selectAll().run()),
    hr: () => run((ed, c) => c.insertContent({ type: 'paragraph', attrs: { style: 'border-bottom:1pt solid #808080;margin-bottom:6pt' } }).run()),
    date: () => run((ed, c) => c.insertContent(new Date().toLocaleDateString(ar ? 'ar-EG' : 'en-GB', { year: 'numeric', month: 'long', day: 'numeric' })).run()),
    toc: () => run((ed, c) => {
      const items = []; ed.state.doc.descendants((n) => { if (n.type.name === 'heading' && n.textContent.trim()) items.push({ level: n.attrs.level, text: n.textContent.trim() }); });
      if (!items.length) { setErr(tt('Add headings (Heading 1-3) first, then insert the table of contents.', 'أضف عناوين (عنوان 1-3) الأول وبعدين أدرج الفهرس.')); return; }
      c.insertContent([{ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: tt('Contents', 'المحتويات') }] }, ...items.map((i) => ({ type: 'paragraph', attrs: { style: `margin-inline-start:${(i.level - 1) * 18}pt;margin-bottom:2pt` }, content: [{ type: 'text', text: i.text }] }))]).run();
    }),
    templates: () => setGallery(true), toggleRuler: () => setRuler((r) => !r),
    legacy: onLegacy ? () => { if (!dirty || window.confirm(tt('Unsaved changes will be lost. Switch editor?', 'التعديلات غير المحفوظة هتضيع. تغيّر المحرر؟'))) onLegacy(); } : null,
    theme: (id) => {
      const th = DOC_THEMES.find((x) => x.id === id); if (!th || !body) return; const d = { ...defRef.current, font: th.font }; defRef.current = d; setDef(d);
      const tr = body.state.tr; body.state.doc.descendants((n, pos) => { if (n.type.name === 'heading') tr.setNodeMarkup(pos, undefined, { ...n.attrs, style: mergeStyle(n.attrs.style, { color: n.attrs.level === 1 ? th.head : th.sub }) }); }); body.view.dispatch(tr); mark();
    },
  };
  A_live.current = A;
  const Astable = useMemo(() => new Proxy({}, { get: (_, k) => (k === 'legacy' ? (A_live.current?.legacy ? () => A_live.current.legacy() : null) : (...a) => A_live.current?.[k]?.(...a)) }), []);
  A_ref.current = {
    fmtSoon,
    picture: insertPicture,
    key: (e) => {
      const mod = e.ctrlKey || e.metaKey; const k = e.key.toLowerCase();
      if (!mod) return false;
      if (k === 'f') { e.preventDefault(); A.openFind(false); return true; }
      if (k === 'h') { e.preventDefault(); A.openFind(true); return true; }
      if (k === 'k') { e.preventDefault(); A.link(); return true; }
      if (k === 'p') { e.preventDefault(); A.print(); return true; }
      if (!e.shiftKey && !e.altKey && ['e', 'l', 'r', 'j'].includes(k)) { e.preventDefault(); A.align({ e: 'center', l: 'left', r: 'right', j: 'justify' }[k]); return true; }
      if (e.shiftKey && k === 'l') { e.preventDefault(); A.list('ul'); return true; }
      if (e.key === ']' || e.key === '[') { e.preventDefault(); A.size(Math.max(1, (fmt.size || 11) + (e.key === ']' ? 1 : -1))); return true; }
      return false;
    },
    ctx: (e) => {
      e.preventDefault(); const ed = body; if (!ed) return; activeKey.current = 'body';
      if (ed.state.selection.empty) { const at = ed.view.posAtCoords({ left: e.clientX, top: e.clientY }); if (at) ed.view.dispatch(ed.state.tr.setSelection(ed.state.selection.constructor.near(ed.state.doc.resolve(at.pos)))); }
      const has = !ed.state.selection.empty; const inT = ed.isActive('table');
      const items = [
        { label: tt('Cut', 'قص'), kbd: 'Ctrl+X', disabled: !has, run: A.cut }, { label: tt('Copy', 'نسخ'), kbd: 'Ctrl+C', disabled: !has, run: A.copy }, { label: tt('Paste', 'لصق'), kbd: 'Ctrl+V', run: A.paste }, { sep: true },
        { label: tt('Bold', 'عريض'), kbd: 'Ctrl+B', run: () => A.toggle('bold') }, { label: tt('Italic', 'مائل'), kbd: 'Ctrl+I', run: () => A.toggle('italic') }, { label: tt('Underline', 'تسطير'), kbd: 'Ctrl+U', run: () => A.toggle('underline') },
        { label: tt('Link…', 'رابط…'), kbd: 'Ctrl+K', run: A.link }, { label: tt('Select all', 'تحديد الكل'), kbd: 'Ctrl+A', run: A.selectAll },
      ];
      if (inT) items.push({ sep: true }, { label: tt('Insert row above', 'إضافة صف أعلى'), run: () => A.tRow(false) }, { label: tt('Insert row below', 'إضافة صف أسفل'), run: () => A.tRow(true) }, { label: tt('Insert column before', 'إضافة عمود قبل'), run: () => A.tCol(false) }, { label: tt('Insert column after', 'إضافة عمود بعد'), run: () => A.tCol(true) },
        { label: tt('Merge cells', 'دمج الخلايا'), run: A.tMerge }, { label: tt('Split cell', 'فصل الخلية'), run: A.tSplit }, { label: tt('Delete row', 'حذف الصف'), run: A.tDelRow }, { label: tt('Delete column', 'حذف العمود'), run: A.tDelCol }, { label: tt('Delete table', 'حذف الجدول'), run: A.tDel });
      setMenu({ x: e.clientX, y: e.clientY, items });
    },
  };

  /* -------------------------------------------------------------- build / draft */
  const build = useCallback(async () => {
    const hh = hdr.getHTML(); const ff = ftr.getHTML();
    return htmlToDocx(prepareForDocx(body.getHTML()), { header: isBlankHtml(hh) ? '' : prepareForDocx(hh).innerHTML, footer: isBlankHtml(ff) ? '' : prepareForDocx(ff).innerHTML, page: pgRef.current, defaults: defRef.current });
  }, [body, hdr, ftr]);
  const draftBuild = useCallback(async () => { await new Promise((r) => (window.requestIdleCallback ? window.requestIdleCallback(r, { timeout: 3000 }) : setTimeout(r, 50))); return build(); }, [build]);

  const pickTemplate = (x) => {
    const html = x.id === 'blank' ? '<p></p>' : docxTemplateHtml(x.id, { ar, title: fileName.replace(/\.docx$/i, '') });
    const empty = isBlankHtml(body.getHTML());
    setGallery(false);
    if (empty || window.confirm(tt('Replace the current document with this template? (Undo brings it back.)', 'استبدال المستند الحالي بالقالب ده؟ (التراجع بيرجّعه.)'))) body.chain().focus().setContent(normalizeIncoming(sanitizeHtml(html)), { emitUpdate: true }).run();
    else body.chain().focus().insertContent(normalizeIncoming(sanitizeHtml(html))).run();
  };

  const ttRef = useRef(tt); ttRef.current = tt; const ttS = useCallback((e, a) => ttRef.current(e, a), []);
  const S = useMemo(() => ({ fmt, pg, zoom, canUndo: hist.u, canRedo: hist.r, inTable: !!fmt.inTable, imgSel: fmt.img ? { w: fmt.img } : null }), [fmt, pg, zoom, hist]);
  if (!body || !hdr || !ftr) return <div className="ed ed--center"><span className="st-fv-spinner" /></div>;

  const sizeName = PAGE_SIZES.find((s) => (s[1] === Math.min(pg.w, pg.h) && s[2] === Math.max(pg.w, pg.h)))?.[0] || `${Math.round(pg.w / 56.7)}×${Math.round(pg.h / 56.7)} mm`;

  return (
    <OfficeShell
      fileName={fileName} tt={tt} guardRef={guardRef} onSave={onSave} onClose={onClose} dirty={dirty} build={build} onSaved={() => setDirty(false)} draftKey={draftKey} draftToken={ver} draftBuild={draftBuild} draftDelay={20000}
      className="ed--docx" tools={<DocxBar tt={ttS} S={S} A={Astable} ruler={ruler} />}
      status={(
        <div className="dx__status">
          <span>{tt('Page', 'صفحة')} {pages}</span><span>{tt('Words', 'كلمات')}: {words.sel ? `${words.sel} / ${words.all}` : words.all}</span><span>{sizeName}{pg.w > pg.h ? ` · ${tt('Landscape', 'عرضي')}` : ''}</span>
          {(initial.warnings || []).map((w) => <span key={w} className="dx__warn" title={WARN[w]?.[0]}>⚠ {tt(WARN[w]?.[0] || w, WARN[w]?.[1] || w)}</span>)}
          <span className="dx__sp" />
          <input type="range" min="30" max="250" step="5" value={Math.round(zoom * 100)} onChange={(e) => setZoom(Number(e.target.value) / 100)} aria-label={tt('Zoom', 'تكبير')} />
          <button type="button" className="dx__zoomlbl" onClick={() => setZoom(1)}>{Math.round(zoom * 100)}%</button>
        </div>
      )}
    >
      {find.open && (
        <div className="dx__find" role="search" onKeyDown={(e) => { if (e.key === 'Escape') { setFind((f) => ({ ...f, open: false })); setSearch(body, { q: '' }); } }}>
          <input autoFocus placeholder={tt('Find', 'بحث')} value={find.q} onChange={(e) => doFind(e.target.value, find.mc, 0, true)} onKeyDown={(e) => { if (e.key === 'Enter') doFind(find.q, find.mc, find.idx + (e.shiftKey ? -1 : 1), true); }} />
          <span className="dx__cnt">{find.total ? `${find.idx + 1}/${find.total}` : '0'}</span>
          <Btn icon="chevron-up" title={tt('Previous', 'السابق')} onClick={() => doFind(find.q, find.mc, find.idx - 1, true)} /><Btn icon="chevron-down" title={tt('Next', 'التالي')} onClick={() => doFind(find.q, find.mc, find.idx + 1, true)} />
          <label className="dx__mc"><input type="checkbox" checked={find.mc} onChange={(e) => doFind(find.q, e.target.checked, 0, true)} />{tt('Match case', 'حروف مطابقة')}</label>
          <input placeholder={tt('Replace with', 'استبدال بـ')} value={find.r} onChange={(e) => setFind((f) => ({ ...f, r: e.target.value }))} />
          <Btn label={tt('Replace', 'استبدال')} onClick={() => { replaceCurrent(body, find.r); doFind(find.q, find.mc, find.idx, true); }} disabled={!find.total} /><Btn label={tt('All', 'الكل')} onClick={() => { replaceAll(body, find.r); doFind(find.q, find.mc, 0); }} disabled={!find.total} />
          <Btn icon="x" title={tt('Close', 'إغلاق')} onClick={() => { setFind((f) => ({ ...f, open: false })); setSearch(body, { q: '' }); }} />
        </div>
      )}
      {err && <p className="ed__err dx__err" role="alert" onClick={() => setErr('')}>{err}</p>}
      <div className="dx__stage" ref={stage}>
        {ruler && <DocxRuler pg={pg} zoom={zoom} onMargins={(m, commit) => { if (Object.keys(m).length) setPage((p) => ({ ...p, ...m })); else if (commit) mark(); }} />}
        <div className="dxp" ref={pageEl} dir={def.rtl ? 'rtl' : 'ltr'} style={pageStyle(pg, def, zoom)}>
          <PageBorders pg={pg} zoom={zoom} />
          <div className="dxp__bandwrap">{emptyBand.hdr && <span className="dxp__ph">{tt('Header', 'رأس الصفحة')}</span>}<EditorContent editor={hdr} /></div>
          <div className="dxp__bodywrap"><EditorContent editor={body} /></div>
          <div className="dxp__bandwrap">{emptyBand.ftr && <span className="dxp__ph">{tt('Footer', 'تذييل الصفحة')}</span>}<EditorContent editor={ftr} /></div>
        </div>
      </div>
      <FloatingBar editor={active()} fmt={fmt} A={A} tt={tt} tick={ftick} host={document.body} />
      <DocxContextMenu menu={menu} onClose={() => setMenu(null)} />
      <TemplateGallery open={gallery} onClose={() => setGallery(false)} templates={DOCX_TEMPLATES} tt={tt} ar={ar} onPick={pickTemplate} />
    </OfficeShell>
  );
}
