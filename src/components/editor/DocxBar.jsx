import { memo, useState } from 'react';
import { B, Pop, ColorBtn, NumField, keep } from './ribbonParts';
import { DOC_THEMES } from '../../lib/officeFmt/docxTemplates';
import { FONTS, SIZES, PAGE_SIZES, MARGIN_PRESETS, SYMBOLS, STYLES, twToCm, cmToTw } from './docxEdit';
import '../../styles/css/docx-bar.css';

const LINES = [1, 1.15, 1.5, 2, 2.5, 3];
const LIST_TYPES = [['1', '1. 2. 3.'], ['a', 'a. b. c.'], ['A', 'A. B. C.'], ['i', 'i. ii. iii.'], ['I', 'I. II. III.']];
const Sep = () => <span className="dxb__sep" aria-hidden="true" />;
const Item = ({ icon, label, onClick, disabled, close }) => (
  <button type="button" className="dxb__item" disabled={disabled} onMouseDown={keep} onClick={() => { onClick(); close?.(); }}>{label}</button>
);

/**
 * Light Word toolbar: one wrapping row instead of the tabbed ribbon. Everything rare (page setup, header / footer, templates…)
 * lives in the "More" menu. It is memoised: it only re-renders when the formatting under the caret really changes,
 * not on every keystroke (that was the main reason the old editor lagged).
 */
function DocxBar({ tt, S, A, ruler }) {
  const f = S.fmt || {}; const has = !!f.has; const pg = S.pg; const size = f.size || '';
  const [grid, setGrid] = useState([0, 0]);
  const sizeName = pg ? PAGE_SIZES.find((s) => s[1] === Math.min(pg.w, pg.h) && s[2] === Math.max(pg.w, pg.h))?.[0] || '' : '';
  const body = f.root === 'body';

  return (
    <div className="dxb" data-px-keep role="toolbar" aria-label={tt('Formatting', 'التنسيق')}>
      <div className="dxb__row">
        <B icon="ed-undo" label={tt('Undo (Ctrl+Z)', 'تراجع (Ctrl+Z)')} onClick={A.undo} disabled={!S.canUndo} />
        <B icon="ed-redo" label={tt('Redo (Ctrl+Y)', 'إعادة (Ctrl+Y)')} onClick={A.redo} disabled={!S.canRedo} />
        <B icon="ed-print" label={tt('Print (Ctrl+P)', 'طباعة (Ctrl+P)')} onClick={A.print} />
        <Sep />
        <select className="pxr__sel dxb__sel" value={f.style || 'p'} disabled={!has} aria-label={tt('Style', 'النمط')} onChange={(e) => A.style(e.target.value)} style={{ width: 112 }}>
          {STYLES.map(([id, en, ar]) => <option key={id} value={id}>{tt(en, ar)}</option>)}
        </select>
        <select className="pxr__sel dxb__sel" value={FONTS.includes(f.font) ? f.font : ''} disabled={!has} aria-label={tt('Font', 'الخط')} onChange={(e) => e.target.value && A.font(e.target.value)} style={{ width: 124 }}>
          <option value="">{f.font || tt('Font', 'الخط')}</option>{FONTS.map((x) => <option key={x} value={x}>{x}</option>)}
        </select>
        <B icon="ed-minus" label={tt('Smaller', 'أصغر')} onClick={() => A.size(Math.max(1, (size || 11) - ((size || 11) > 12 ? 2 : 1)))} disabled={!has} />
        <NumField value={size} step={0.5} min={1} width={52} title={tt('Font size (pt)', 'حجم الخط (نقطة)')} onCommit={A.size} />
        <B icon="plus" label={tt('Larger', 'أكبر')} onClick={() => A.size((size || 11) + ((size || 11) >= 12 ? 2 : 1))} disabled={!has} />
        <Pop icon="ed-type" label={tt('Common sizes', 'أحجام شائعة')}>
          {(close) => <div className="pxr__list">{SIZES.map((s) => <button key={s} type="button" className={size === s ? 'is-on' : ''} onClick={() => { A.size(s); close(); }}>{s}</button>)}</div>}
        </Pop>
        <Sep />
        <B icon="ed-bold" label={tt('Bold (Ctrl+B)', 'عريض (Ctrl+B)')} on={!!f.b} onClick={() => A.toggle('bold')} disabled={!has} />
        <B icon="ed-italic" label={tt('Italic (Ctrl+I)', 'مائل (Ctrl+I)')} on={!!f.i} onClick={() => A.toggle('italic')} disabled={!has} />
        <B icon="ed-underline" label={tt('Underline (Ctrl+U)', 'تسطير (Ctrl+U)')} on={!!f.u} onClick={() => A.toggle('underline')} disabled={!has} />
        <ColorBtn icon="ed-font-color" label={tt('Text colour', 'لون النص')} color={f.color} onPick={A.color} />
        <ColorBtn icon="ed-highlight" label={tt('Highlight', 'تظليل')} color={f.hl} onPick={A.highlight} noneLabel={tt('No highlight', 'بدون تظليل')} />
        <Sep />
        <B icon="ed-align-right" label={tt('Align right', 'محاذاة لليمين')} on={f.align === 'right'} onClick={() => A.align('right')} disabled={!has} />
        <B icon="ed-align-center" label={tt('Centre', 'توسيط')} on={f.align === 'center'} onClick={() => A.align('center')} disabled={!has} />
        <B icon="ed-align-left" label={tt('Align left', 'محاذاة لليسار')} on={f.align === 'left'} onClick={() => A.align('left')} disabled={!has} />
        <B icon="ed-justify" label={tt('Justify', 'ضبط')} on={f.align === 'justify'} onClick={() => A.align('justify')} disabled={!has} />
        <B icon={f.rtl ? 'ed-ltr' : 'ed-rtl'} label={f.rtl ? tt('Left-to-right', 'من اليسار لليمين') : tt('Right-to-left', 'من اليمين لليسار')} onClick={() => A.dir(f.rtl ? 'ltr' : 'rtl')} disabled={!has} />
        <Sep />
        <B icon="ed-list" label={tt('Bullets', 'نقاط')} on={f.list === 'ul'} onClick={() => A.list('ul')} disabled={!has} />
        <B icon="ed-numbered" label={tt('Numbering', 'ترقيم')} on={f.list === 'ol'} onClick={() => A.list('ol')} disabled={!has} />
        <Pop icon="ed-line-spacing" label={tt('Spacing & lists', 'التباعد والقوائم')}>
          {(close) => (
            <div className="pxr__list">
              <small className="dxb__cap">{tt('Line spacing', 'تباعد الأسطر')}</small>
              {LINES.map((v) => <button key={v} type="button" className={f.line === v ? 'is-on' : ''} onClick={() => { A.spacing('line', v); close(); }}>{v}</button>)}
              <small className="dxb__cap">{tt('Numbering style', 'نمط الترقيم')}</small>
              {LIST_TYPES.map(([t, l]) => <button key={t} type="button" onClick={() => { A.list('ol', t); close(); }}>{l}</button>)}
              <small className="dxb__cap">{tt('Indent', 'المسافة البادئة')}</small>
              <button type="button" onClick={() => A.indent(1)}>{tt('Increase', 'زيادة')}</button>
              <button type="button" onClick={() => A.indent(-1)}>{tt('Decrease', 'تقليل')}</button>
            </div>
          )}
        </Pop>
        <Sep />
        <B icon="link" label={tt('Link (Ctrl+K)', 'رابط (Ctrl+K)')} on={!!f.link} onClick={A.link} disabled={!has} />
        <B icon="ed-image-plus" label={tt('Picture', 'صورة')} onClick={A.image} />
        <Pop icon="ed-table" label={tt('Insert table', 'إدراج جدول')}>
          {(close) => (
            <div className="dxr__grid" onMouseLeave={() => setGrid([0, 0])}>
              <div className="dxr__gcells">{Array.from({ length: 8 }, (_, r) => Array.from({ length: 8 }, (_, c) => (
                <button key={`${r}-${c}`} type="button" className={r < grid[0] && c < grid[1] ? 'is-on' : ''} aria-label={`${r + 1}×${c + 1}`} onMouseEnter={() => setGrid([r + 1, c + 1])} onClick={() => { A.table(r + 1, c + 1); close(); }} />
              )))}</div>
              <small>{grid[0] ? `${grid[0]} × ${grid[1]}` : tt('Rows × columns', 'صفوف × أعمدة')}</small>
            </div>
          )}
        </Pop>
        <B icon="ed-find" label={tt('Find & replace (Ctrl+F)', 'بحث واستبدال (Ctrl+F)')} onClick={() => A.openFind(false)} />
        <Pop icon="more-horizontal" label={tt('More', 'المزيد')}>
          {(close) => (
            <div className="dxb__more">
              <small className="dxb__cap">{tt('Insert', 'إدراج')}</small>
              <Item close={close} label={tt('Page break', 'فاصل صفحة')} onClick={A.pageBreak} disabled={!body} />
              <Item close={close} label={tt('Table of contents', 'فهرس المحتويات')} onClick={A.toc} disabled={!body} />
              <Item close={close} label={tt('Horizontal line', 'خط فاصل')} onClick={A.hr} disabled={!body} />
              <Item close={close} label={tt('Today’s date', 'تاريخ اليوم')} onClick={A.date} disabled={!has} />
              <Item close={close} label={tt('Page number', 'رقم الصفحة')} onClick={() => A.field('PAGE')} disabled={!has} />
              <Item close={close} label={tt('Number of pages', 'عدد الصفحات')} onClick={() => A.field('NUMPAGES')} disabled={!has} />
              <Item close={close} label={tt('Remove link', 'إزالة الرابط')} onClick={A.unlink} disabled={!f.link} />
              <div className="dxb__syms">{SYMBOLS.slice(0, 24).map((s) => <button key={s} type="button" onMouseDown={keep} onClick={() => { A.symbol(s); close(); }}>{s}</button>)}</div>
              <small className="dxb__cap">{tt('Header & footer', 'الرأس والتذييل')}</small>
              <Item close={close} label={tt('Edit header', 'تعديل رأس الصفحة')} onClick={() => A.band('hdr')} />
              <Item close={close} label={tt('Edit footer', 'تعديل تذييل الصفحة')} onClick={() => A.band('ftr')} />
              <Item close={close} label={tt('Remove header', 'حذف الرأس')} onClick={() => A.delBand('hdr')} />
              <Item close={close} label={tt('Remove footer', 'حذف التذييل')} onClick={() => A.delBand('ftr')} />
              <small className="dxb__cap">{tt('Page', 'الصفحة')}</small>
              <div className="dxb__line">
                <select className="pxr__sel dxb__sel" value={sizeName} aria-label={tt('Paper size', 'حجم الورق')} onChange={(e) => A.pageSize(e.target.value)} style={{ width: 90 }}>
                  {!sizeName && <option value="">{tt('Custom', 'مخصص')}</option>}{PAGE_SIZES.map(([n]) => <option key={n} value={n}>{n}</option>)}
                </select>
                <B icon="ed-portrait" label={tt('Portrait', 'طولي')} on={!!pg && pg.h >= pg.w} onClick={() => A.orient(false)} />
                <B icon="ed-landscape" label={tt('Landscape', 'عرضي')} on={!!pg && pg.w > pg.h} onClick={() => A.orient(true)} />
              </div>
              <div className="dxb__line">
                {MARGIN_PRESETS.map(([k, m]) => <button key={k} type="button" className="dxb__chip" onClick={() => A.margins(m)}>{{ normal: tt('Normal', 'عادي'), narrow: tt('Narrow', 'ضيق'), moderate: tt('Moderate', 'متوسط'), wide: tt('Wide', 'واسع') }[k]}</button>)}
              </div>
              <div className="dxb__line dxb__margins">
                {['top', 'bottom', 'left', 'right'].map((k) => (
                  <label key={k}><span>{{ top: tt('Top', 'أعلى'), bottom: tt('Bottom', 'أسفل'), left: tt('Left', 'يسار'), right: tt('Right', 'يمين') }[k]}</span>
                    <NumField value={pg ? twToCm(pg[k]) : ''} step={0.1} min={0} width={54} title={`${k} (cm)`} onCommit={(v) => A.margins({ [k]: cmToTw(v) })} /></label>
                ))}
              </div>
              <small className="dxb__cap">{tt('Document', 'المستند')}</small>
              <Item close={close} label={tt('Templates…', 'قوالب جاهزة…')} onClick={A.templates} />
              <div className="dxb__line">{DOC_THEMES.map((t) => <button key={t.id} type="button" className="dxr__theme" onMouseDown={keep} onClick={() => { A.theme(t.id); close(); }} title={t.label.en}><b style={{ fontFamily: t.font, color: t.head }}>Aa</b><span>{tt(t.label.en, t.label.ar)}</span></button>)}</div>
              <Item close={close} label={tt('Clear formatting', 'مسح التنسيق')} onClick={A.clear} disabled={!has} />
              <Item close={close} label={ruler ? tt('Hide ruler', 'إخفاء المسطرة') : tt('Show ruler', 'إظهار المسطرة')} onClick={A.toggleRuler} />
              <Item close={close} label={tt('Fit width', 'ملاءمة العرض')} onClick={A.fit} />
              {A.legacy && <Item close={close} label={tt('Use the old editor', 'استخدام المحرر القديم')} onClick={A.legacy} />}
            </div>
          )}
        </Pop>
      </div>

      {S.inTable && (
        <div className="dxb__row dxb__row--ctx">
          <span className="dxb__tag">{tt('Table', 'جدول')}</span>
          <B icon="ed-row-plus" label={tt('Insert row below', 'إضافة صف أسفل')} onClick={() => A.tRow(true)} />
          <B icon="ed-row-plus" label={tt('Insert row above', 'إضافة صف أعلى')} onClick={() => A.tRow(false)} className="dxr__flipv" />
          <B icon="ed-row-minus" label={tt('Delete row', 'حذف الصف')} onClick={A.tDelRow} />
          <B icon="ed-col-plus" label={tt('Insert column after', 'إضافة عمود بعد')} onClick={() => A.tCol(true)} />
          <B icon="ed-col-plus" label={tt('Insert column before', 'إضافة عمود قبل')} onClick={() => A.tCol(false)} className="dxr__fliph" />
          <B icon="ed-col-minus" label={tt('Delete column', 'حذف العمود')} onClick={A.tDelCol} />
          <Sep />
          <B icon="ed-merge" label={tt('Merge with the next cell', 'دمج مع الخلية التالية')} onClick={A.tMerge} />
          <B icon="ed-split" label={tt('Split merged cell', 'فصل الخلية المدمجة')} onClick={A.tSplit} />
          <ColorBtn icon="ed-fill" label={tt('Cell shading', 'تظليل الخلية')} onPick={A.tShade} noneLabel={tt('No shading', 'بدون تظليل')} />
          <B icon="ed-valign-top" label={tt('Align top', 'محاذاة للأعلى')} onClick={() => A.tValign('top')} />
          <B icon="ed-valign-mid" label={tt('Align middle', 'محاذاة للوسط')} onClick={() => A.tValign('middle')} />
          <B icon="ed-valign-bottom" label={tt('Align bottom', 'محاذاة للأسفل')} onClick={() => A.tValign('bottom')} />
          <Sep />
          <button type="button" className="dxb__chip" onMouseDown={keep} onClick={() => A.tStyle('header')}>{tt('Dark header', 'عنوان داكن')}</button>
          <button type="button" className="dxb__chip" onMouseDown={keep} onClick={() => A.tStyle('zebra')}>{tt('Light fill', 'تعبئة فاتحة')}</button>
          <button type="button" className="dxb__chip" onMouseDown={keep} onClick={() => A.tStyle('none')}>{tt('Clear fill', 'بدون تعبئة')}</button>
          <B icon="ed-outline" label={tt('Show / hide borders', 'إظهار / إخفاء الحدود')} onClick={A.tBorders} />
          <B icon="ed-table-del" label={tt('Delete table', 'حذف الجدول')} onClick={A.tDel} />
        </div>
      )}

      {S.imgSel && (
        <div className="dxb__row dxb__row--ctx">
          <span className="dxb__tag">{tt('Picture', 'صورة')}</span>
          <NumField value={S.imgSel.w} step={10} min={10} width={64} title={tt('Width (px)', 'العرض (بكسل)')} onCommit={A.imgWidth} />
          <B icon="ed-minus" label={tt('Smaller', 'أصغر')} onClick={() => A.imgWidth(S.imgSel.w * 0.9)} />
          <B icon="plus" label={tt('Larger', 'أكبر')} onClick={() => A.imgWidth(S.imgSel.w * 1.1)} />
          <Sep />
          <button type="button" className="dxb__chip" onMouseDown={keep} onClick={() => A.imgFloat(null)}>{tt('In line', 'ضمن السطر')}</button>
          <button type="button" className="dxb__chip" onMouseDown={keep} onClick={() => A.imgFloat('left')}>{tt('Float left', 'عائم يسار')}</button>
          <button type="button" className="dxb__chip" onMouseDown={keep} onClick={() => A.imgFloat('right')}>{tt('Float right', 'عائم يمين')}</button>
          <B icon="trash" label={tt('Delete picture', 'حذف الصورة')} onClick={A.imgDel} />
        </div>
      )}
    </div>
  );
}

export default memo(DocxBar);
