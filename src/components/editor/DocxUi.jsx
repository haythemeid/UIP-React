import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from '../Icon';
import { Btn } from './EditorUI';
import { keep } from './ribbonParts';
import { ED_THEME_LIST, edThemeOf, setEdTheme, useEdTheme } from '../../lib/officeFmt/edThemes';

/** Dropdown panel of the Word ribbon. Same idea as ribbonParts.Pop, but the width is yours and it never leaves the editor frame. */
export function Pop2({ icon, label, text, children, w = 280, extra, className = '', btnClass = '', chevron = true, disabled }) {
  const [open, setOpen] = useState(false); const [pos, setPos] = useState(null); const btn = useRef(null); const panel = useRef(null);
  const toggle = () => {
    if (open) { setOpen(false); return; }
    const ed = btn.current.closest('.ed'); if (!ed) return;
    const r = btn.current.getBoundingClientRect(); const er = ed.getBoundingClientRect();
    const width = Math.min(w, er.width - 12);
    setPos({ ed, left: Math.max(6, Math.min(r.left - er.left, er.width - width - 6)), top: r.bottom - er.top + 4, width, maxH: Math.max(240, er.height - (r.bottom - er.top) - 14) });
    setOpen(true);
  };
  useEffect(() => {
    if (!open) return undefined;
    const h = (e) => { if (!panel.current?.contains(e.target) && !btn.current?.contains(e.target)) setOpen(false); };
    const k = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', h); document.addEventListener('keydown', k);
    return () => { document.removeEventListener('pointerdown', h); document.removeEventListener('keydown', k); };
  }, [open]);
  return (
    <span ref={btn} className="pxr__pw">
      <Btn icon={icon} title={label} active={open} disabled={disabled} onClick={toggle} className={`pxr__b ${btnClass}`} onMouseDown={keep}>{text && <span>{text}</span>}{extra}{chevron && <Icon name="chevron-down" size={11} />}</Btn>
      {open && pos && createPortal(
        <div ref={panel} className={`pxr__pop dxpop ${className}`} data-px-keep style={{ left: pos.left, top: pos.top, width: pos.width, maxWidth: 'none', maxHeight: pos.maxH }} onMouseDown={keep}>{children(() => setOpen(false))}</div>, pos.ed)}
    </span>
  );
}

/** A ribbon group: its buttons on top, its name underneath. */
export const Group = ({ title, children, grow }) => <div className={`dxt__g${grow ? ' dxt__g--grow' : ''}`}><div className="dxt__row">{children}</div><span className="dxt__lbl">{title}</span></div>;
export const Sep = () => <span className="dxt__sep" aria-hidden="true" />;

/** Big ribbon button: icon over a short label (Templates, Picture, Shapes …). */
export function Big({ icon, label, onClick, on, disabled, title }) {
  return (
    <button type="button" className={`dxt__big${on ? ' is-on' : ''}`} onClick={onClick} disabled={disabled} title={title || label} onMouseDown={keep}>
      <Icon name={icon} size={22} /><span>{label}</span>
    </button>
  );
}

/** Centered dialog (templates, shapes …). Esc and a click outside close it. */
export function Modal({ title, onClose, children, w = 900, footer, className = '' }) {
  useEffect(() => { const k = (e) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } }; document.addEventListener('keydown', k, true); return () => document.removeEventListener('keydown', k, true); }, [onClose]);
  return createPortal(
    <div className="dxm" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }} role="dialog" aria-modal="true" aria-label={title}>
      <div className={`dxm__box ${className}`} style={{ width: `min(${w}px, 100%)` }}>
        <header><strong>{title}</strong><button type="button" onClick={onClose} aria-label="×">×</button></header>
        <div className="dxm__body">{children}</div>
        {footer && <footer>{footer}</footer>}
      </div>
    </div>, document.body);
}

/** Segmented control: [[value, label], …] */
export const Seg = ({ value, onChange, items }) => <div className="dxseg" role="group">{items.map(([v, l]) => <button key={v} type="button" className={v === value ? 'is-on' : ''} onClick={() => onChange(v)}>{l}</button>)}</div>;

/**
 * Interface theme (the colours of the EDITOR WINDOW — dark / light / code themes). It is a small palette button at the far end of the tab strip,
 * separate from "Document themes" (fonts + colours of the document) in the Design tab.
 */
export function UiThemeButton({ tt }) {
  const [id] = useEdTheme(); const cur = edThemeOf(id);
  return (
    <Pop2 icon={cur.dark ? 'moon' : 'sun'} label={tt('Editor appearance', 'مظهر المحرر')} w={300} chevron={false} btnClass="dxt__theme">
      {(close) => (
        <div className="dxuit">
          <div className="dxuit__quick">
            <button type="button" className={!cur.dark ? 'is-on' : ''} onClick={() => { setEdTheme('word'); close(); }}><Icon name="sun" size={15} />{tt('Light', 'فاتح')}</button>
            <button type="button" className={cur.dark ? 'is-on' : ''} onClick={() => { setEdTheme('classic'); close(); }}><Icon name="moon" size={15} />{tt('Dark', 'داكن')}</button>
          </div>
          {[['office', tt('Office', 'أوفيس')], ['code', tt('Code editor themes', 'ثيمات محرر الأكواد')]].map(([g, title]) => (
            <div key={g}><small>{title}</small>
              <div className="dxuit__grid">
                {ED_THEME_LIST.filter((t) => t.group === g).map((t) => (
                  <button key={t.id} type="button" className={`dxuit__it${t.id === id ? ' is-on' : ''}`} title={tt(t.en, t.ar)} onClick={() => { setEdTheme(t.id); close(); }}>
                    <span className="dxuit__sw">{t.swatch.map((c, i) => <i key={i} style={{ background: c }} />)}</span><span>{tt(t.en, t.ar)}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Pop2>
  );
}

/**
 * Font-size box like Word / Google Docs: click or tab into it and the list of common sizes opens at once; or just type a size
 * (Enter applies, Esc cancels, ↑ ↓ walk the list). No native spin arrows and no native scrollbar.
 */
export const FONT_SIZES = [8, 9, 10, 10.5, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 32, 36, 40, 48, 56, 64, 72, 96];
export function SizeBox({ value, onCommit, disabled, title, sizes = FONT_SIZES }) {
  const [open, setOpen] = useState(false); const [txt, setTxt] = useState(''); const [hi, setHi] = useState(-1); const [pos, setPos] = useState(null);
  const wrap = useRef(null); const input = useRef(null); const panel = useRef(null); const list = useRef(null);
  const cur = value ? String(value) : '';
  useEffect(() => { if (!open) setTxt(cur); }, [cur, open]);
  const show = () => {
    if (disabled || open) return;
    const ed = wrap.current?.closest('.ed'); if (!ed) return;
    const r = wrap.current.getBoundingClientRect(); const er = ed.getBoundingClientRect();
    setPos({ ed, left: r.left - er.left, top: r.bottom - er.top + 4, width: Math.max(r.width, 72) });
    setHi(sizes.indexOf(Number(value))); setOpen(true);
  };
  const close = () => setOpen(false);
  const commit = (v) => {
    const n = parseFloat(String(v).replace(',', '.')); close();
    if (Number.isFinite(n) && n > 0) { const pt = Math.min(400, Math.max(1, Math.round(n * 2) / 2)); if (pt !== Number(value)) onCommit(pt); setTxt(String(pt)); } else setTxt(cur);
  };
  useEffect(() => { // keep the highlighted row in view
    if (!open) return;
    const l = list.current; const el = l?.querySelector('.is-hi') || l?.querySelector('.is-on'); if (!l || !el) return;
    const a = el.offsetTop; const b = a + el.offsetHeight;
    if (a < l.scrollTop) l.scrollTop = a; else if (b > l.scrollTop + l.clientHeight) l.scrollTop = b - l.clientHeight;
  }, [open, hi]);
  useEffect(() => {
    if (!open) return undefined;
    const h = (e) => { if (!panel.current?.contains(e.target) && !wrap.current?.contains(e.target)) { setOpen(false); setTxt(cur); } };
    document.addEventListener('pointerdown', h); return () => document.removeEventListener('pointerdown', h);
  }, [open, cur]);
  const onKey = (e) => {
    e.stopPropagation();
    if (e.key === 'Enter') { e.preventDefault(); commit(hi >= 0 && open && txt === cur ? sizes[hi] : txt); }
    else if (e.key === 'Escape') { e.preventDefault(); close(); setTxt(cur); input.current?.blur(); }
    else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault(); if (!open) { show(); return; }
      const d = e.key === 'ArrowDown' ? 1 : -1; const n = Math.max(0, Math.min(sizes.length - 1, (hi < 0 ? Math.max(0, sizes.findIndex((x) => x >= Number(value))) - (d > 0 ? 1 : 0) : hi) + d)); setHi(n); setTxt(String(sizes[n]));
    } else if (e.key === 'Tab') commit(txt);
  };
  return (
    <span ref={wrap} className={`dxsz${disabled ? ' is-off' : ''}`}>
      <input ref={input} className="dxsz__in" type="text" inputMode="decimal" autoComplete="off" spellCheck={false} value={txt} disabled={disabled} title={title} aria-label={title}
        aria-haspopup="listbox" aria-expanded={open} onFocus={(e) => { e.target.select(); show(); }} onClick={show} onChange={(e) => { setTxt(e.target.value.replace(/[^0-9.,]/g, '').slice(0, 5)); setHi(-1); }} onKeyDown={onKey}
        onBlur={() => { if (!open) { if (txt !== cur) commit(txt); } }} />
      {open && pos && createPortal(
        <div ref={panel} className="dxpop dxsz__pop" role="listbox" data-px-keep style={{ left: pos.left, top: pos.top, width: pos.width }} onMouseDown={(e) => e.preventDefault()}>
          <div ref={list} className="dxsz__list">
            {sizes.map((s, i) => <button key={s} type="button" role="option" aria-selected={Number(value) === s} className={`dxsz__opt${Number(value) === s ? ' is-on' : ''}${i === hi ? ' is-hi' : ''}`} onMouseEnter={() => setHi(i)} onClick={() => { commit(s); input.current?.blur(); }}>{s}</button>)}
          </div>
        </div>, pos.ed)}
    </span>
  );
}
