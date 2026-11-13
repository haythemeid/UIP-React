import { useEffect, useMemo, useRef, useState } from 'react';
import Icon from '../Icon';
import { Modal, Seg } from './DocxUi';
import { SHAPE_SETS, svgOf } from '../../lib/officeFmt/docxShapes';
import { renderImage, PIC_STYLES } from '../../lib/officeFmt/docxImageFx';

const PALETTE = ['#1F3864', '#2F5496', '#0F766E', '#15803d', '#B91C1C', '#C2410C', '#B8891A', '#6D28D9', '#0F172A', '#64748B', '#ffffff'];

/**
 * Shapes, badges, icons and divider lines. Each one is SVG that is turned into a PNG when inserted (so it looks the same in Word).
 *   onInsert({ item, color, color2, width })
 */
export function IllustrationsDialog({ tt, ar, onClose, onInsert }) {
  const [set, setSet] = useState(SHAPE_SETS[0].id); const [color, setColor] = useState('#1F3864'); const [color2, setColor2] = useState('#ffffff'); const [q, setQ] = useState(''); const [width, setWidth] = useState(0);
  const cur = SHAPE_SETS.find((s) => s.id === set) || SHAPE_SETS[0];
  const norm = q.trim().toLowerCase();
  const items = useMemo(() => cur.items.filter((i) => !norm || `${i.en} ${i.ar}`.toLowerCase().includes(norm)), [cur, norm]);
  const defW = cur.wide ? 520 : 96;
  return (
    <Modal title={tt('Shapes, icons & dividers', 'أشكال وأيقونات وخطوط فاصلة')} onClose={onClose} w={860} className="dxil">
      <div className="dxil__bar">
        <Seg value={set} onChange={setSet} items={SHAPE_SETS.map((s) => [s.id, ar ? s.label.ar : s.label.en])} />
        <label className="dxtp__search"><Icon name="search" size={15} /><input value={q} placeholder={tt('Search…', 'بحث…')} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.stopPropagation()} /></label>
      </div>
      <div className="dxil__opts">
        <span>{tt('Colour', 'اللون')}</span>
        <span className="dxil__sw">{PALETTE.map((c) => <button key={c} type="button" className={c === color ? 'is-on' : ''} style={{ background: c }} onClick={() => setColor(c)} aria-label={c} />)}<input type="color" value={color} onChange={(e) => setColor(e.target.value)} aria-label={tt('Custom colour', 'لون مخصص')} /></span>
        {cur.colour2 && <><span>{tt('Inner', 'الداخل')}</span><input type="color" value={color2} onChange={(e) => setColor2(e.target.value)} aria-label={tt('Inner colour', 'لون الداخل')} /></>}
        <span>{tt('Width', 'العرض')}</span>
        <input type="range" min={cur.wide ? 200 : 32} max={cur.wide ? 640 : 360} value={width || defW} onChange={(e) => setWidth(Number(e.target.value))} /><b>{width || defW}px</b>
      </div>
      <div className={`dxil__grid${cur.wide ? ' is-wide' : ''}`}>
        {items.map((i) => (
          <button key={i.id} type="button" className="dxil__it" title={ar ? i.ar : i.en} onClick={() => onInsert({ item: i, color, color2, width: width || defW })}>
            <span dangerouslySetInnerHTML={{ __html: svgOf(i, color, color2) }} /><small>{ar ? i.ar : i.en}</small>
          </button>
        ))}
        {!items.length && <p className="dxtp__empty">{tt('Nothing matches your search.', 'مفيش نتيجة للبحث.')}</p>}
      </div>
    </Modal>
  );
}

/** Range slider that only commits on release: a picture is re-rendered from its original on every commit, so dragging must not do that 60 times a second. */
export function Slider({ label, value, min, max, step = 1, onCommit, unit = '' }) {
  const [v, setV] = useState(value); useEffect(() => setV(value), [value]);
  return (
    <label className="dxsl"><span>{label}</span>
      <input type="range" min={min} max={max} step={step} value={v} onChange={(e) => setV(Number(e.target.value))} onPointerUp={() => v !== value && onCommit(v)} onKeyUp={() => v !== value && onCommit(v)} onBlur={() => v !== value && onCommit(v)} />
      <b>{v}{unit}</b></label>
  );
}

/** Gallery of picture styles with REAL previews: the selected picture rendered tiny with each style (only built while the panel is open). */
export function PicStyleGallery({ src, onPick, tt, ar, close }) {
  const [thumbs, setThumbs] = useState({}); const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    (async () => {
      for (const s of PIC_STYLES) {
        if (!alive.current) return;
        try { const r = await renderImage(src, s.ops, { maxSide: 96, quality: 0.8 }); if (alive.current) setThumbs((t) => ({ ...t, [s.id]: r.src })); } catch { /* skip this preview */ }
      }
    })();
    return () => { alive.current = false; };
  }, [src]);
  return (
    <div className="dxpsg">
      {PIC_STYLES.map((s) => (
        <button key={s.id} type="button" onClick={() => { onPick(s); close?.(); }} title={ar ? s.label.ar : s.label.en}>
          <span className="dxpsg__th">{thumbs[s.id] ? <img src={thumbs[s.id]} alt="" /> : <i />}</span><small>{ar ? s.label.ar : s.label.en}</small>
        </button>
      ))}
    </div>
  );
}
