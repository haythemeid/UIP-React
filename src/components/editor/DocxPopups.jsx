import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { B, ColorBtn, keep } from './ribbonParts';
import { FONTS, SIZES } from './docxEdit';
import { DOCX_GROUPS } from '../../lib/officeFmt/docxTemplates';

/** Mini toolbar that floats over a text selection (like Word): the most used formatting without going to the ribbon. */
export function FloatingBar({ editor, fmt, A, tt, tick, host }) {
  const [pos, setPos] = useState(null); const down = useRef(false); const [t2, setTick] = useState(0);
  useEffect(() => {
    const md = (e) => { if (e.target.closest?.('.ProseMirror')) down.current = true; };
    const mu = () => { down.current = false; setTick((t) => t + 1); };
    document.addEventListener('mousedown', md); document.addEventListener('mouseup', mu);
    return () => { document.removeEventListener('mousedown', md); document.removeEventListener('mouseup', mu); };
  }, []);
  useLayoutEffect(() => {
    if (!editor || editor.isDestroyed || down.current) return;
    const { from, to, empty } = editor.state.selection;
    if (empty || !editor.isFocused || editor.state.selection.node) { setPos(null); return; }
    try {
      const a = editor.view.coordsAtPos(from); const b = editor.view.coordsAtPos(to);
      const left = Math.max(8, Math.min(window.innerWidth - 400, (a.left + b.right) / 2 - 190)); const top = Math.min(a.top, b.top) - 46;
      setPos({ left, top: top < 8 ? Math.max(a.bottom, b.bottom) + 10 : top });
    } catch { setPos(null); }
  }, [editor, tick, t2, fmt]);
  if (!pos || !host) return null;
  return createPortal(
    <div className="pxr dxr dxfb" style={{ left: pos.left, top: pos.top }} onMouseDown={keep} data-px-keep>
      <select className="pxr__sel" value={FONTS.includes(fmt.font) ? fmt.font : ''} onChange={(e) => e.target.value && A.font(e.target.value)} style={{ width: 110 }} aria-label={tt('Font', 'الخط')}>
        <option value="">{fmt.font || tt('Font', 'الخط')}</option>{FONTS.map((x) => <option key={x} value={x}>{x}</option>)}
      </select>
      <select className="pxr__sel" value={SIZES.includes(fmt.size) ? fmt.size : ''} onChange={(e) => e.target.value && A.size(Number(e.target.value))} style={{ width: 62 }} aria-label={tt('Size', 'الحجم')}>
        <option value="">{fmt.size || ''}</option>{SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <B icon="ed-bold" label={tt('Bold', 'عريض')} on={!!fmt.b} onClick={() => A.toggle('bold')} />
      <B icon="ed-italic" label={tt('Italic', 'مائل')} on={!!fmt.i} onClick={() => A.toggle('italic')} />
      <B icon="ed-underline" label={tt('Underline', 'تسطير')} on={!!fmt.u} onClick={() => A.toggle('underline')} />
      <ColorBtn icon="ed-font-color" label={tt('Text colour', 'لون النص')} color={fmt.color} onPick={A.color} />
      <ColorBtn icon="ed-highlight" label={tt('Highlight', 'تظليل')} color={fmt.hl} onPick={A.highlight} noneLabel={tt('No highlight', 'بدون تظليل')} />
      <B icon="ed-align-left" label={tt('Left', 'يسار')} on={fmt.align === 'left'} onClick={() => A.align('left')} />
      <B icon="ed-align-center" label={tt('Centre', 'وسط')} on={fmt.align === 'center'} onClick={() => A.align('center')} />
      <B icon="ed-align-right" label={tt('Right', 'يمين')} on={fmt.align === 'right'} onClick={() => A.align('right')} />
      <B icon="link" label={tt('Link', 'رابط')} on={!!fmt.link} onClick={A.link} />
    </div>, host);
}

/** Right-click menu: clipboard, quick formatting and, inside a table, row / column / cell actions. */
export function DocxContextMenu({ menu, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!menu) return undefined;
    const h = (e) => { if (!ref.current?.contains(e.target)) onClose(); };
    const k = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('pointerdown', h); document.addEventListener('keydown', k); window.addEventListener('blur', onClose);
    return () => { document.removeEventListener('pointerdown', h); document.removeEventListener('keydown', k); window.removeEventListener('blur', onClose); };
  }, [menu, onClose]);
  if (!menu) return null;
  const x = Math.min(menu.x, window.innerWidth - 230); const y = Math.min(menu.y, window.innerHeight - Math.min(480, menu.items.length * 32 + 20));
  return createPortal(
    <div ref={ref} className="dxctx" style={{ left: x, top: y }} role="menu" onMouseDown={keep} onContextMenu={(e) => e.preventDefault()}>
      {menu.items.map((it, i) => (it.sep ? <hr key={i} /> : <button key={i} type="button" role="menuitem" disabled={it.disabled} onClick={() => { onClose(); it.run(); }}><span>{it.label}</span>{it.kbd && <kbd>{it.kbd}</kbd>}</button>))}
    </div>, document.body);
}

/** Template gallery: pick a ready-made document and insert it (or replace the document). */
export function TemplateGallery({ open, onClose, templates, tt, ar, onPick }) {
  if (!open) return null;
  const groups = DOCX_GROUPS.map((g) => [g.id, ar ? g.label.ar : g.label.en]);
  return createPortal(
    <div className="dxtpl" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }} role="dialog" aria-modal="true">
      <div className="dxtpl__box">
        <header><strong>{tt('Templates', 'القوالب الجاهزة')}</strong><button type="button" onClick={onClose} aria-label={tt('Close', 'إغلاق')}>×</button></header>
        <div className="dxtpl__body">
          {groups.map(([g, label]) => {
            const list = templates.filter((x) => x.group === g); if (!list.length) return null;
            return (
              <section key={g}><h4>{label}</h4>
                <div className="dxtpl__grid">{list.map((x) => (
                  <button key={x.id} type="button" className="dxtpl__card" onClick={() => onPick(x)}>
                    <span className="dxtpl__thumb" style={{ borderTopColor: x.color }}><i style={{ background: x.color }} /><i /><i /><i className="s" /><i /><i className="s" /></span>
                    <b>{ar ? x.label.ar : x.label.en}</b><small>{ar ? x.hint.ar : x.hint.en}</small>
                  </button>))}</div>
              </section>);
          })}
        </div>
      </div>
    </div>, document.body);
}
