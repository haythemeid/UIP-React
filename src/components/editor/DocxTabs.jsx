import { memo, useEffect, useRef, useState } from 'react';
import '../../styles/css/docx-bar.css';
import Icon from '../Icon';
import { B, ColorBtn, NumField, keep } from './ribbonParts';
import { Pop2, Group, Sep, Big, UiThemeButton, SizeBox } from './DocxUi';
import FontPicker from './DocxFonts';
import { PicStyleGallery, PicFilterGallery, Slider } from './DocxPicture';
import { PAGE_SIZES, MARGIN_PRESETS, SYMBOLS, STYLES, twToCm, cmToTw } from './docxEdit';
import { DOC_THEMES, STYLE_SETS, PAGE_BORDERS } from '../../lib/officeFmt/docxThemes';
import { ASPECTS } from '../../lib/officeFmt/docxImageFx';
import { loadTemplateLibrary } from '../../lib/officeFmt/docxTemplateIndex';

const LINES = [1, 1.15, 1.5, 2, 2.5, 3];
const LIST_TYPES = [['1', '1. 2. 3.'], ['a', 'a. b. c.'], ['A', 'A. B. C.'], ['i', 'i. ii. iii.'], ['I', 'I. II. III.']];
const ZOOMS = [50, 75, 100, 125, 150, 200];
const Item = ({ label, onClick, disabled, close, icon }) => <button type="button" className="dxb__item dxt__item" disabled={disabled} onMouseDown={keep} onClick={() => { onClick(); close?.(); }}>{icon && <Icon name={icon} size={15} />}<span>{label}</span></button>;
const Cap = ({ children }) => <small className="dxb__cap">{children}</small>;

/** Quick blocks (call-outs, columns, forms, photo grids …): loaded the first time the menu opens. */
function BlocksMenu({ tt, ar, A }) {
  const [lib, setLib] = useState(null);
  return (
    <Pop2 icon="layers" label={tt('Quick blocks', 'كتل جاهزة')} text={tt('Blocks', 'كتل جاهزة')} w={420} btnClass="dxt__bigpop">
      {(close) => <BlocksList tt={tt} ar={ar} A={A} lib={lib} setLib={setLib} close={close} />}
    </Pop2>
  );
}
function BlocksList({ tt, ar, A, lib, setLib, close }) {
  useEffect(() => { if (!lib) loadTemplateLibrary().then((l) => setLib({ blocks: l.blocks, groups: l.blockGroups })); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  if (!lib) return <p className="dxtp__empty">{tt('Loading…', 'جارٍ التحميل…')}</p>;
  return (
    <div className="dxbl">
      {lib.groups.map((g) => { const list = lib.blocks.filter((b) => b.group === g.id); return list.length ? (
        <div key={g.id}><Cap>{ar ? g.label.ar : g.label.en}</Cap>
          <div className="dxbl__grid">{list.map((b) => <button key={b.id} type="button" onMouseDown={keep} onClick={() => { A.block(b); close(); }}><i style={{ background: b.color }} /><span>{ar ? b.label.ar : b.label.en}</span></button>)}</div>
        </div>) : null; })}
    </div>
  );
}

const ThemeTile = ({ t, on, tt, onClick, small }) => (
  <button type="button" className={`dxth${on ? ' is-on' : ''}${small ? ' dxth--s' : ''}`} onMouseDown={keep} onClick={onClick} title={t.label.en}>
    <b style={{ fontFamily: `'${t.headFont}', serif`, color: t.head }}>Aa</b>
    <span className="dxth__dots"><i style={{ background: t.head }} /><i style={{ background: t.accent }} /><i style={{ background: t.soft }} /></span>
    <small style={{ fontFamily: `'${t.font}', sans-serif` }}>{tt(t.label.en, t.label.ar)}</small>
  </button>
);

function HomeTab({ tt, ar, S, A }) {
  const f = S.fmt || {}; const has = !!f.has; const size = f.size || ''; const th = S.theme;
  const st = { p: { fontSize: 12 }, title: { fontSize: 19, color: th.sub, fontWeight: 300 }, subtitle: { fontSize: 12, fontStyle: 'italic', color: '#595959' }, h1: { fontSize: 16, fontWeight: 700, color: th.head }, h2: { fontSize: 14, fontWeight: 700, color: th.head }, h3: { fontSize: 12.5, fontWeight: 700, color: th.sub }, h4: { fontSize: 12, fontWeight: 700, color: th.sub }, quote: { fontSize: 12, fontStyle: 'italic', color: '#404040' } };
  return (
    <>
      <Group title={tt('History', 'تراجع')}>
        <B icon="ed-undo" label={tt('Undo (Ctrl+Z)', 'تراجع (Ctrl+Z)')} onClick={A.undo} disabled={!S.canUndo} />
        <B icon="ed-redo" label={tt('Redo (Ctrl+Y)', 'إعادة (Ctrl+Y)')} onClick={A.redo} disabled={!S.canRedo} />
      </Group>
      <Sep />
      <Group title={tt('Clipboard', 'الحافظة')}>
        <Big icon="ed-paste" label={tt('Paste', 'لصق')} onClick={A.paste} />
        <div className="dxt__col"><B icon="ed-cut" label={tt('Cut', 'قص')} onClick={A.cut} disabled={!has} /><B icon="copy" label={tt('Copy', 'نسخ')} onClick={A.copy} disabled={!has} /></div>
      </Group>
      <Sep />
      <Group title={tt('Font', 'الخط')}>
        <div className="dxt__2r">
          <div className="dxt__row">
            <FontPicker tt={tt} ar={ar} current={f.font} disabled={!has} A={A} />
            <B icon="ed-minus" label={tt('Decrease font size', 'تصغير الخط')} onClick={() => A.size(Math.max(1, (size || 11) - ((size || 11) > 12 ? 2 : 1)))} disabled={!has} />
            <SizeBox value={size} disabled={!has} title={tt('Font size (pt)', 'حجم الخط (نقطة)')} onCommit={A.size} />
            <B icon="plus" label={tt('Increase font size', 'تكبير الخط')} onClick={() => A.size((size || 11) + ((size || 11) >= 12 ? 2 : 1))} disabled={!has} />
          </div>
          <div className="dxt__row">
            <B icon="ed-bold" label={tt('Bold (Ctrl+B)', 'عريض (Ctrl+B)')} on={!!f.b} onClick={() => A.toggle('bold')} disabled={!has} />
            <B icon="ed-italic" label={tt('Italic (Ctrl+I)', 'مائل (Ctrl+I)')} on={!!f.i} onClick={() => A.toggle('italic')} disabled={!has} />
            <B icon="ed-underline" label={tt('Underline (Ctrl+U)', 'تسطير (Ctrl+U)')} on={!!f.u} onClick={() => A.toggle('underline')} disabled={!has} />
            <B icon="ed-strike" label={tt('Strikethrough', 'يتوسطه خط')} on={!!f.st} onClick={() => A.toggle('strikeThrough')} disabled={!has} />
            <B icon="ed-sub" label={tt('Subscript', 'منخفض')} on={!!f.sub} onClick={() => A.toggle('subscript')} disabled={!has} />
            <B icon="ed-sup" label={tt('Superscript', 'مرتفع')} on={!!f.sup} onClick={() => A.toggle('superscript')} disabled={!has} />
            <ColorBtn icon="ed-font-color" label={tt('Text colour', 'لون النص')} color={f.color} onPick={A.color} />
            <ColorBtn icon="ed-highlight" label={tt('Highlight', 'تظليل')} color={f.hl} onPick={A.highlight} noneLabel={tt('No highlight', 'بدون تظليل')} />
            <B icon="ed-clear" label={tt('Clear formatting', 'مسح التنسيق')} onClick={A.clear} disabled={!has} />
          </div>
        </div>
      </Group>
      <Sep />
      <Group title={tt('Paragraph', 'الفقرة')}>
        <div className="dxt__2r">
          <div className="dxt__row">
            <B icon="ed-list" label={tt('Bullets', 'نقاط')} on={f.list === 'ul'} onClick={() => A.list('ul')} disabled={!has} />
            <B icon="ed-numbered" label={tt('Numbering', 'ترقيم')} on={f.list === 'ol'} onClick={() => A.list('ol')} disabled={!has} />
            <B icon="ed-outdent" label={tt('Decrease indent', 'تقليل المسافة')} onClick={() => A.indent(-1)} disabled={!has} />
            <B icon="ed-indent" label={tt('Increase indent', 'زيادة المسافة')} onClick={() => A.indent(1)} disabled={!has} />
            <Pop2 icon="ed-line-spacing" label={tt('Spacing & numbering', 'التباعد والترقيم')} w={230}>
              {(close) => (
                <div className="pxr__list">
                  <Cap>{tt('Line spacing', 'تباعد الأسطر')}</Cap>
                  {LINES.map((v) => <button key={v} type="button" className={f.line === v ? 'is-on' : ''} onClick={() => { A.spacing('line', v); close(); }}>{v}</button>)}
                  <Cap>{tt('Numbering style', 'نمط الترقيم')}</Cap>
                  {LIST_TYPES.map(([t, l]) => <button key={t} type="button" onClick={() => { A.list('ol', t); close(); }}>{l}</button>)}
                  <Cap>{tt('Space (pt)', 'مسافة (نقطة)')}</Cap>
                  <div className="dxb__line"><span>{tt('Before', 'قبل')}</span><NumField value={f.before} step={1} min={0} width={50} title={tt('Before', 'قبل')} onCommit={(v) => A.spacing('before', v)} /><span>{tt('After', 'بعد')}</span><NumField value={f.after} step={1} min={0} width={50} title={tt('After', 'بعد')} onCommit={(v) => A.spacing('after', v)} /></div>
                </div>
              )}
            </Pop2>
          </div>
          <div className="dxt__row">
            <B icon="ed-align-left" label={tt('Align left', 'محاذاة لليسار')} on={f.align === 'left'} onClick={() => A.align('left')} disabled={!has} />
            <B icon="ed-align-center" label={tt('Centre', 'توسيط')} on={f.align === 'center'} onClick={() => A.align('center')} disabled={!has} />
            <B icon="ed-align-right" label={tt('Align right', 'محاذاة لليمين')} on={f.align === 'right'} onClick={() => A.align('right')} disabled={!has} />
            <B icon="ed-justify" label={tt('Justify', 'ضبط')} on={f.align === 'justify'} onClick={() => A.align('justify')} disabled={!has} />
            <B icon={f.rtl ? 'ed-ltr' : 'ed-rtl'} label={f.rtl ? tt('Left-to-right', 'من اليسار لليمين') : tt('Right-to-left', 'من اليمين لليسار')} onClick={() => A.dir(f.rtl ? 'ltr' : 'rtl')} disabled={!has} />
          </div>
        </div>
      </Group>
      <Sep />
      <Group title={tt('Styles', 'الأنماط')} grow>
        <div className="dxt__styles">
          {STYLES.map(([id, en, a]) => <button key={id} type="button" className={`dxt__st${(f.style || 'p') === id ? ' is-on' : ''}`} disabled={!has} onMouseDown={keep} onClick={() => A.style(id)}><span style={st[id]}>{ar ? 'أبجد' : 'AaBb'}</span><small>{tt(en, a)}</small></button>)}
        </div>
      </Group>
      <Sep />
      <Group title={tt('Editing', 'تحرير')}>
        <Big icon="ed-find" label={tt('Find', 'بحث')} onClick={() => A.openFind(false)} />
        <div className="dxt__col"><button type="button" className="dxb__chip" onMouseDown={keep} onClick={() => A.openFind(true)}>{tt('Replace', 'استبدال')}</button><button type="button" className="dxb__chip" onMouseDown={keep} onClick={A.selectAll}>{tt('Select all', 'تحديد الكل')}</button></div>
      </Group>
    </>
  );
}

/** Page numbers: pick a format, then a position (top / bottom × left / centre / right). The number goes into the header or footer. */
const NUM_FORMATS = [['n', '1', '1'], ['dash', '- 1 -', '- 1 -'], ['page', 'Page 1', 'صفحة 1'], ['of', 'Page 1 of N', 'صفحة 1 من N'], ['slash', '1 / N', '1 / N']];
function PageNumberPanel({ tt, A, close, has }) {
  const [fmt, setFmt] = useState('n');
  const pos = [['hdr', 'left', 'Top left', 'أعلى يسار'], ['hdr', 'center', 'Top centre', 'أعلى وسط'], ['hdr', 'right', 'Top right', 'أعلى يمين'], ['ftr', 'left', 'Bottom left', 'أسفل يسار'], ['ftr', 'center', 'Bottom centre', 'أسفل وسط'], ['ftr', 'right', 'Bottom right', 'أسفل يمين']];
  return (
    <div className="dxpn">
      <Cap>{tt('Number format', 'شكل الرقم')}</Cap>
      <div className="dxb__line">{NUM_FORMATS.map(([id, en, ar]) => <button key={id} type="button" className={`dxb__chip${fmt === id ? ' is-on' : ''}`} onMouseDown={keep} onClick={() => setFmt(id)}>{tt(en, ar)}</button>)}</div>
      <Cap>{tt('Position (click to apply)', 'المكان (دوس عشان يتطبق)')}</Cap>
      <div className="dxpn__grid">
        {pos.map(([w, a, en, ar]) => (
          <button key={`${w}${a}`} type="button" onMouseDown={keep} onClick={() => { A.pageNumbers({ where: w, align: a, format: fmt }); close(); }}>
            <span className={`dxpn__pg dxpn__pg--${w === 'hdr' ? 't' : 'b'}${a[0]}`} /><small>{tt(en, ar)}</small>
          </button>
        ))}
      </div>
      <Cap>{tt('More', 'المزيد')}</Cap>
      <Item close={close} label={tt('Page number at the cursor', 'رقم الصفحة عند المؤشر')} onClick={() => A.field('PAGE')} disabled={!has} />
      <Item close={close} label={tt('Number of pages at the cursor', 'عدد الصفحات عند المؤشر')} onClick={() => A.field('NUMPAGES')} disabled={!has} />
      <Item close={close} label={tt('Remove page numbers', 'إزالة ترقيم الصفحات')} onClick={A.pageNumbersOff} />
      <Item close={close} label={tt('Remove header', 'حذف الرأس')} onClick={() => A.delBand('hdr')} />
      <Item close={close} label={tt('Remove footer', 'حذف التذييل')} onClick={() => A.delBand('ftr')} />
    </div>
  );
}

/** Page borders: ready-made frames, plus line style / width / colour / sides / distance / which pages. */
const LINE_STYLES = [['single', 'Solid', 'متصل'], ['double', 'Double', 'مزدوج'], ['dashed', 'Dashed', 'متقطع'], ['dotted', 'Dotted', 'منقط'], ['triple', 'Triple', 'ثلاثي'], ['thinThickSmallGap', 'Fancy', 'مزخرف']];
const BORDER_PT = [0.5, 1, 1.5, 2.25, 3, 4.5, 6];
const BORDER_SIDES = [['box', 'Box', 'إطار كامل'], ['tb', 'Top & bottom', 'أعلى وأسفل'], ['lr', 'Sides', 'الجوانب'], ['top', 'Top', 'أعلى'], ['bottom', 'Bottom', 'أسفل']];
const BORDER_GAP = [[8, 'Close', 'قريب'], [24, 'Normal', 'عادي'], [31, 'Wide', 'واسع']];
const BORDER_PAGES = [['allPages', 'All pages', 'كل الصفحات'], ['firstPage', 'First page only', 'الأولى بس'], ['notFirstPage', 'All but the first', 'ماعدا الأولى']];
function PageBorderPanel({ tt, S, A, close }) {
  const b = S.pg.borders; const first = b && (b.top || b.left || b.bottom || b.right); const bd = S.borderId;
  const sides = !b ? null : (b.top && b.left && b.bottom && b.right ? 'box' : b.top && b.bottom ? 'tb' : b.left && b.right ? 'lr' : b.top ? 'top' : 'bottom');
  const chip = (on, label, fn, k) => <button key={k} type="button" className={`dxb__chip${on ? ' is-on' : ''}`} onMouseDown={keep} onClick={fn}>{label}</button>;
  return (
    <div className="dxbd2">
      <div className="dxbd">
        {PAGE_BORDERS.map((p) => <button key={p.id} type="button" className={p.id === bd ? 'is-on' : ''} onMouseDown={keep} onClick={() => A.pageBorder(p.id)}><span className="dxbd__pg" style={p.borders ? { border: `${p.borders.top ? Math.max(1, Math.min(4, p.borders.top.sz / 6)) : 1}px ${/double|thin|thick/i.test(p.borders.top?.val || '') ? 'double' : p.borders.top?.val === 'dotted' ? 'dotted' : 'solid'} ${p.borders.top?.color}` } : undefined} /><small>{tt(p.label.en, p.label.ar)}</small></button>)}
      </div>
      <Cap>{tt('Line style', 'شكل الخط')}</Cap>
      <div className="dxb__line">{LINE_STYLES.map(([v, en, ar]) => chip(first?.val === v, tt(en, ar), () => A.pageBorderSet({ val: v }), v))}</div>
      <Cap>{tt('Width (pt)', 'السمك (نقطة)')}</Cap>
      <div className="dxb__line">{BORDER_PT.map((w) => chip(first && first.sz === w * 8, String(w), () => A.pageBorderSet({ sz: Math.round(w * 8) }), w))}</div>
      <Cap>{tt('Show on', 'يظهر على')}</Cap>
      <div className="dxb__line">{BORDER_SIDES.map(([v, en, ar]) => chip(sides === v, tt(en, ar), () => A.pageBorderSet({ sides: v }), v))}</div>
      <Cap>{tt('Distance from the edge', 'المسافة من الحافة')}</Cap>
      <div className="dxb__line">{BORDER_GAP.map(([v, en, ar]) => chip(first?.space === v, tt(en, ar), () => A.pageBorderSet({ space: v }), v))}</div>
      <Cap>{tt('Apply to', 'تطبيق على')}</Cap>
      <div className="dxb__line">{BORDER_PAGES.map(([v, en, ar]) => chip(b?.display === v, tt(en, ar), () => A.pageBorderSet({ display: v }), v))}</div>
      <label className="dxbd__col"><span>{tt('Border colour', 'لون الحد')}</span><input type="color" value={/^#[0-9a-f]{6}$/i.test(first?.color || '') ? first.color : '#1F3864'} onChange={(e) => A.pageBorderSet({ color: e.target.value })} /></label>
      <div className="dxb__line"><button type="button" className="dxb__chip" onMouseDown={keep} onClick={() => { A.pageBorder('none'); close(); }}>{tt('No border', 'بدون حدود')}</button><button type="button" className="dxb__chip" onMouseDown={keep} onClick={close}>{tt('Done', 'تم')}</button></div>
    </div>
  );
}

function InsertTab({ tt, ar, S, A }) {
  const f = S.fmt || {}; const has = !!f.has; const body = f.root === 'body'; const [grid, setGrid] = useState([0, 0]);
  return (
    <>
      <Group title={tt('Pages', 'الصفحات')}>
        <Big icon="layers" label={tt('Templates', 'قوالب')} onClick={() => A.templates('all')} title={tt('Ready-made documents: add at the cursor, at the start, at the end, or replace', 'مستندات جاهزة: أضف عند المؤشر أو في البداية أو في النهاية أو استبدل')} />
        <Big icon="file" label={tt('Cover page', 'غلاف')} onClick={() => A.templates('covers')} />
        <Big icon="ed-page-plus" label={tt('Blank page', 'صفحة فاضية')} onClick={A.blankPage} title={tt('Add an empty page after the page you are on', 'إضافة صفحة فاضية بعد الصفحة اللي واقف فيها')} />
        <Big icon="ed-page-break" label={tt('Page break', 'فاصل صفحة')} onClick={A.pageBreak} disabled={!body} />
        <Big icon="panel-left" label={tt('Pages panel', 'لوحة الصفحات')} on={S.navOpen} onClick={A.toggleNav} title={tt('Show every page on the side: jump to a page, add or delete one', 'عرض كل الصفحات على الجنب: انتقل لأي صفحة أو أضف أو احذف')} />
      </Group>
      <Sep />
      <Group title={tt('Tables', 'الجداول')}>
        <Pop2 icon="ed-table" label={tt('Insert table', 'إدراج جدول')} text={tt('Table', 'جدول')} w={200} btnClass="dxt__bigpop" disabled={!body}>
          {(close) => (
            <div className="dxr__grid" onMouseLeave={() => setGrid([0, 0])}>
              <div className="dxr__gcells">{Array.from({ length: 8 }, (_, r) => Array.from({ length: 8 }, (_, c) => <button key={`${r}-${c}`} type="button" className={r < grid[0] && c < grid[1] ? 'is-on' : ''} aria-label={`${r + 1}×${c + 1}`} onMouseEnter={() => setGrid([r + 1, c + 1])} onClick={() => { A.table(r + 1, c + 1); close(); }} />))}</div>
              <small>{grid[0] ? `${grid[0]} × ${grid[1]}` : tt('Rows × columns', 'صفوف × أعمدة')}</small>
            </div>
          )}
        </Pop2>
      </Group>
      <Sep />
      <Group title={tt('Illustrations', 'رسومات')}>
        <Big icon="ed-image-plus" label={tt('Picture', 'صورة')} onClick={A.image} title={tt('Insert a picture (or paste / drop one)', 'إدراج صورة (أو الصق / اسحب صورة)')} />
        <Big icon="ed-star" label={tt('Shapes & icons', 'أشكال وأيقونات')} onClick={A.shapes} disabled={!has} />
        <BlocksMenu tt={tt} ar={ar} A={A} />
      </Group>
      <Sep />
      <Group title={tt('Header & footer', 'الرأس والتذييل')}>
        <Big icon="ed-header" label={tt('Header', 'رأس')} onClick={() => A.band('hdr')} />
        <Big icon="ed-footer" label={tt('Footer', 'تذييل')} onClick={() => A.band('ftr')} />
        <Pop2 icon="ed-hash" label={tt('Page number', 'رقم الصفحة')} text={tt('Numbers', 'ترقيم')} w={320} btnClass="dxt__bigpop">
          {(close) => <PageNumberPanel tt={tt} A={A} close={close} has={has} />}
        </Pop2>
      </Group>
      <Sep />
      <Group title={tt('Text', 'نص')}>
        <div className="dxt__2r"><div className="dxt__row">
          <B icon="link" label={tt('Link (Ctrl+K)', 'رابط (Ctrl+K)')} on={!!f.link} onClick={A.link} disabled={!has} />
          <button type="button" className="dxb__chip" disabled={!f.link} onMouseDown={keep} onClick={A.unlink}>{tt('Remove link', 'إزالة الرابط')}</button>
          <button type="button" className="dxb__chip" disabled={!body} onMouseDown={keep} onClick={A.toc}>{tt('Contents', 'فهرس')}</button>
          <button type="button" className="dxb__chip" disabled={!body} onMouseDown={keep} onClick={A.hr}>{tt('Line', 'خط')}</button>
        </div><div className="dxt__row">
          <button type="button" className="dxb__chip" disabled={!has} onMouseDown={keep} onClick={A.date}>{tt('Date', 'التاريخ')}</button>
          <button type="button" className="dxb__chip" disabled={!body} onMouseDown={keep} onClick={A.caption}>{tt('Caption', 'تعليق')}</button>
          <Pop2 icon="ed-symbol" label={tt('Symbols', 'رموز')} text={tt('Symbols', 'رموز')} w={290}>{(close) => <div className="dxr__sym">{SYMBOLS.map((s) => <button key={s} type="button" onMouseDown={keep} onClick={() => { A.symbol(s); close(); }}>{s}</button>)}</div>}</Pop2>
        </div></div>
      </Group>
    </>
  );
}

function DesignTab({ tt, ar, S, A }) {
  const cur = S.themeId; const bd = S.borderId;
  return (
    <>
      <Group title={tt('Document theme', 'سمة المستند')} grow>
        <div className="dxt__themes">{DOC_THEMES.map((t) => <ThemeTile key={t.id} t={t} on={t.id === cur} tt={tt} onClick={() => A.theme(t.id, 'all')} />)}</div>
      </Group>
      <Sep />
      <Group title={tt('Mix', 'دمج')}>
        <Pop2 icon="palette" label={tt('Theme colours only', 'ألوان السمة فقط')} text={tt('Colours', 'ألوان')} w={250} btnClass="dxt__bigpop">
          {(close) => <div className="dxb__more">{DOC_THEMES.map((t) => <button key={t.id} type="button" className="dxb__item dxt__item" onMouseDown={keep} onClick={() => { A.theme(t.id, 'colors'); close(); }}><span className="dxth__dots"><i style={{ background: t.head }} /><i style={{ background: t.accent }} /><i style={{ background: t.soft }} /></span><span>{tt(t.label.en, t.label.ar)}</span></button>)}</div>}
        </Pop2>
        <Pop2 icon="ed-type" label={tt('Theme fonts only', 'خطوط السمة فقط')} text={tt('Fonts', 'خطوط')} w={270} btnClass="dxt__bigpop">
          {(close) => <div className="dxb__more">{DOC_THEMES.map((t) => <button key={t.id} type="button" className="dxb__item dxt__item" onMouseDown={keep} onClick={() => { A.theme(t.id, 'fonts'); close(); }}><b style={{ fontFamily: `'${t.headFont}', serif` }}>{t.headFont}</b><span style={{ fontFamily: `'${t.font}', sans-serif`, opacity: 0.8 }}>{t.font}</span></button>)}</div>}
        </Pop2>
        <Pop2 icon="ed-line-spacing" label={tt('Paragraph spacing', 'تباعد الفقرات')} text={tt('Spacing', 'التباعد')} w={210} btnClass="dxt__bigpop">
          {(close) => <div className="dxb__more">{STYLE_SETS.map((s) => <Item key={s.id} close={close} label={`${tt(s.label.en, s.label.ar)} · ${s.line}`} onClick={() => A.styleSet(s.id)} icon={S.styleSetId === s.id ? 'check' : undefined} />)}</div>}
        </Pop2>
      </Group>
      <Sep />
      <Group title={tt('Page background', 'خلفية الصفحة')}>
        <Pop2 icon="file" label={tt('Page borders', 'حدود الصفحة')} text={tt('Page borders', 'حدود الصفحة')} w={330} btnClass="dxt__bigpop">
          {(close) => <PageBorderPanel tt={tt} S={S} A={A} close={close} />}
        </Pop2>
      </Group>
      <Sep />
      <Group title={tt('Templates', 'قوالب')}>
        <Big icon="layers" label={tt('Templates', 'قوالب')} onClick={() => A.templates('all')} />
        <Big icon="save" label={tt('Save as template', 'احفظ كقالب')} onClick={A.saveTemplate} />
      </Group>
    </>
  );
}

function LayoutTab({ tt, S, A }) {
  const pg = S.pg; const sizeName = pg ? PAGE_SIZES.find((s) => s[1] === Math.min(pg.w, pg.h) && s[2] === Math.max(pg.w, pg.h))?.[0] || '' : '';
  const names = { normal: tt('Normal', 'عادي'), narrow: tt('Narrow', 'ضيق'), moderate: tt('Moderate', 'متوسط'), wide: tt('Wide', 'واسع') };
  return (
    <>
      <Group title={tt('Page setup', 'إعداد الصفحة')}>
        <Pop2 icon="ed-margins" label={tt('Margins', 'الهوامش')} text={tt('Margins', 'الهوامش')} w={250} btnClass="dxt__bigpop">
          {(close) => (<div className="dxb__more">
            {MARGIN_PRESETS.map(([k, m]) => <Item key={k} close={close} label={`${names[k]} · ${twToCm(m.top)} / ${twToCm(m.left)} cm`} onClick={() => A.margins(m)} />)}
            <Cap>{tt('Custom (cm)', 'مخصص (سم)')}</Cap>
            <div className="dxb__line dxb__margins">{['top', 'bottom', 'left', 'right'].map((k) => <label key={k}><span>{{ top: tt('Top', 'أعلى'), bottom: tt('Bottom', 'أسفل'), left: tt('Left', 'يسار'), right: tt('Right', 'يمين') }[k]}</span><NumField value={pg ? twToCm(pg[k]) : ''} step={0.1} min={0} width={54} title={k} onCommit={(v) => A.margins({ [k]: cmToTw(v) })} /></label>)}</div>
          </div>)}
        </Pop2>
        <div className="dxt__col">
          <B icon="ed-portrait" label={tt('Portrait', 'طولي')} on={!!pg && pg.h >= pg.w} onClick={() => A.orient(false)} />
          <B icon="ed-landscape" label={tt('Landscape', 'عرضي')} on={!!pg && pg.w > pg.h} onClick={() => A.orient(true)} />
        </div>
        <select className="pxr__sel dxb__sel" value={sizeName} aria-label={tt('Paper size', 'حجم الورق')} onChange={(e) => A.pageSize(e.target.value)} style={{ width: 92, alignSelf: 'center' }}>
          {!sizeName && <option value="">{tt('Custom', 'مخصص')}</option>}{PAGE_SIZES.map(([n]) => <option key={n} value={n}>{n}</option>)}
        </select>
      </Group>
      <Sep />
      <Group title={tt('Header & footer', 'الرأس والتذييل')}>
        <Big icon="ed-header" label={tt('Header', 'رأس')} onClick={() => A.band('hdr')} />
        <Big icon="ed-footer" label={tt('Footer', 'تذييل')} onClick={() => A.band('ftr')} />
      </Group>
      <Sep />
      <Group title={tt('Page borders', 'حدود الصفحة')}>
        <div className="dxt__row dxt__wrap">{PAGE_BORDERS.slice(0, 5).map((p) => <button key={p.id} type="button" className={`dxb__chip${p.id === S.borderId ? ' is-on' : ''}`} onMouseDown={keep} onClick={() => A.pageBorder(p.id)}>{tt(p.label.en, p.label.ar)}</button>)}</div>
      </Group>
    </>
  );
}

function ViewTab({ tt, S, A }) {
  const z = Math.round(S.zoom * 100);
  return (
    <>
      <Group title={tt('Page view', 'عرض الصفحة')}>
        <Big icon="file" label={S.paged ? tt('Separate pages', 'صفحات منفصلة') : tt('One sheet', 'ورقة واحدة')} on={S.paged} onClick={A.togglePaged} title={tt('Show the document as separate pages (like Word) or one long sheet (faster for very long documents)', 'عرض المستند كصفحات منفصلة (زي Word) أو ورقة طويلة (أسرع للمستندات الكبيرة جدًا)')} />
        <Big icon="ed-margins" label={S.ruler ? tt('Hide ruler', 'إخفاء المسطرة') : tt('Ruler', 'مسطرة')} on={S.ruler} onClick={A.toggleRuler} />
        <Big icon="panel-left" label={tt('Pages panel', 'لوحة الصفحات')} on={S.navOpen} onClick={A.toggleNav} />
      </Group>
      <Sep />
      <Group title={tt('Zoom', 'التكبير')}>
        <B icon="ed-minus" label={tt('Zoom out', 'تصغير')} onClick={() => A.setZoom(Math.max(0.3, Math.round((S.zoom - 0.1) * 10) / 10))} />
        <select className="pxr__sel dxb__sel" value={ZOOMS.includes(z) ? z : ''} aria-label={tt('Zoom', 'تكبير')} onChange={(e) => e.target.value && A.setZoom(Number(e.target.value) / 100)} style={{ width: 84 }}>{!ZOOMS.includes(z) && <option value="">{z}%</option>}{ZOOMS.map((v) => <option key={v} value={v}>{v}%</option>)}</select>
        <B icon="plus" label={tt('Zoom in', 'تكبير')} onClick={() => A.setZoom(Math.min(2.5, Math.round((S.zoom + 0.1) * 10) / 10))} />
        <Big icon="ed-fit" label={tt('Fit width', 'ملاءمة العرض')} onClick={A.fit} />
      </Group>
      <Sep />
      <Group title={tt('Document', 'المستند')}>
        <Big icon="ed-print" label={tt('Print', 'طباعة')} onClick={A.print} />
        {A.legacy && <Big icon="refresh" label={tt('Old editor', 'المحرر القديم')} onClick={A.legacy} />}
      </Group>
    </>
  );
}

const TABLE_PRESETS = [['grid', 'Grid', 'شبكة'], ['soft', 'Soft header', 'عنوان فاتح'], ['zebra', 'Banded', 'صفوف متبادلة'], ['dark', 'Dark header', 'عنوان داكن'], ['minimal', 'Minimal', 'بسيط']];
function TableTab({ tt, A }) {
  return (
    <>
      <Group title={tt('Rows & columns', 'صفوف وأعمدة')}>
        <B icon="ed-row-plus" label={tt('Insert row below', 'إضافة صف أسفل')} onClick={() => A.tRow(true)} />
        <B icon="ed-row-plus" label={tt('Insert row above', 'إضافة صف أعلى')} onClick={() => A.tRow(false)} className="dxr__flipv" />
        <B icon="ed-row-minus" label={tt('Delete row', 'حذف الصف')} onClick={A.tDelRow} />
        <B icon="ed-col-plus" label={tt('Insert column after', 'إضافة عمود بعد')} onClick={() => A.tCol(true)} />
        <B icon="ed-col-plus" label={tt('Insert column before', 'إضافة عمود قبل')} onClick={() => A.tCol(false)} className="dxr__fliph" />
        <B icon="ed-col-minus" label={tt('Delete column', 'حذف العمود')} onClick={A.tDelCol} />
      </Group>
      <Sep />
      <Group title={tt('Cells', 'الخلايا')}>
        <B icon="ed-merge" label={tt('Merge with the next cell', 'دمج مع الخلية التالية')} onClick={A.tMerge} />
        <B icon="ed-split" label={tt('Split merged cell', 'فصل الخلية المدمجة')} onClick={A.tSplit} />
        <ColorBtn icon="ed-fill" label={tt('Cell shading', 'تظليل الخلية')} onPick={A.tShade} noneLabel={tt('No shading', 'بدون تظليل')} />
        <B icon="ed-valign-top" label={tt('Align top', 'محاذاة للأعلى')} onClick={() => A.tValign('top')} />
        <B icon="ed-valign-mid" label={tt('Align middle', 'محاذاة للوسط')} onClick={() => A.tValign('middle')} />
        <B icon="ed-valign-bottom" label={tt('Align bottom', 'محاذاة للأسفل')} onClick={() => A.tValign('bottom')} />
      </Group>
      <Sep />
      <Group title={tt('Table styles', 'أنماط الجدول')} grow>
        <div className="dxt__row dxt__wrap">{TABLE_PRESETS.map(([id, en, ar]) => <button key={id} type="button" className="dxb__chip" onMouseDown={keep} onClick={() => A.tPreset(id)}>{tt(en, ar)}</button>)}
          <B icon="ed-outline" label={tt('Show / hide borders', 'إظهار / إخفاء الحدود')} onClick={A.tBorders} /></div>
      </Group>
      <Sep />
      <Group title={tt('Delete', 'حذف')}><Big icon="ed-table-del" label={tt('Delete table', 'حذف الجدول')} onClick={A.tDel} /></Group>
    </>
  );
}

function PictureTab({ tt, ar, S, A }) {
  const im = S.imgSel || {}; const rec = A.picGet?.() || {}; const ops = rec.ops || {}; const adj = ops.adj || {}; const crop = ops.crop || {};
  const set = (k, v) => A.picOps({ adj: { ...adj, [k]: v } });
  return (
    <>
      <Group title={tt('Size', 'الحجم')}>
        <div className="dxt__2r"><div className="dxt__row">
          <NumField value={im.w} step={10} min={10} width={64} title={tt('Width (px)', 'العرض (بكسل)')} onCommit={A.imgWidth} />
          <B icon="ed-minus" label={tt('Smaller', 'أصغر')} onClick={() => A.imgWidth(im.w * 0.9)} />
          <B icon="plus" label={tt('Larger', 'أكبر')} onClick={() => A.imgWidth(im.w * 1.1)} />
        </div><div className="dxt__row"><button type="button" className="dxb__chip" onMouseDown={keep} onClick={A.picFit}>{tt('Fit page width', 'بعرض الصفحة')}</button></div></div>
      </Group>
      <Sep />
      <Group title={tt('Picture styles', 'أنماط الصورة')}>
        <Pop2 icon="image" label={tt('Picture styles', 'أنماط الصورة')} text={tt('Styles', 'أنماط')} w={420} btnClass="dxt__bigpop">
          {(close) => <PicStyleGallery src={A.picSrc()} tt={tt} ar={ar} close={close} onPick={A.picStyle} />}
        </Pop2>
        <Pop2 icon="ed-crop" label={tt('Crop & shape', 'قص وشكل')} text={tt('Crop', 'قص')} w={290} btnClass="dxt__bigpop">
          {() => (
            <div className="dxpp">
              <Cap>{tt('Aspect ratio', 'نسبة الأبعاد')}</Cap>
              <div className="dxb__line">{ASPECTS.map(([r, l]) => <button key={r} type="button" className={`dxb__chip${(crop.ratio || 0) === r ? ' is-on' : ''}`} onClick={() => A.picOps({ crop: { ...crop, ratio: r || undefined } })}>{ar ? l.ar : l.en}</button>)}</div>
              <Slider label={tt('Zoom', 'تكبير')} value={crop.zoom || 1} min={1} max={3} step={0.05} unit="×" onCommit={(v) => A.picOps({ crop: { ...crop, zoom: v } })} />
              <Slider label={tt('Left ↔ right', 'يسار ↔ يمين')} value={Math.round((crop.cx ?? 0.5) * 100)} min={0} max={100} onCommit={(v) => A.picOps({ crop: { ...crop, cx: v / 100 } })} />
              <Slider label={tt('Up ↕ down', 'أعلى ↕ أسفل')} value={Math.round((crop.cy ?? 0.5) * 100)} min={0} max={100} onCommit={(v) => A.picOps({ crop: { ...crop, cy: v / 100 } })} />
            </div>
          )}
        </Pop2>
        <Pop2 icon="palette" label={tt('Ready-made filters', 'فلاتر جاهزة')} text={tt('Filters', 'فلاتر')} w={440} btnClass="dxt__bigpop">
          {(close) => <PicFilterGallery src={A.picSrc()} current={ops.adj} tt={tt} ar={ar} close={close} onPick={A.picFilter} />}
        </Pop2>
        <Pop2 icon="ed-sliders" label={tt('Corrections', 'تصحيحات')} text={tt('Adjust', 'ضبط')} w={300} btnClass="dxt__bigpop">
          {() => (
            <div className="dxpp">
              <Slider label={tt('Brightness', 'السطوع')} value={adj.brightness ?? 100} min={40} max={160} onCommit={(v) => set('brightness', v)} unit="%" />
              <Slider label={tt('Contrast', 'التباين')} value={adj.contrast ?? 100} min={40} max={160} onCommit={(v) => set('contrast', v)} unit="%" />
              <Slider label={tt('Saturation', 'التشبع')} value={adj.saturate ?? 100} min={0} max={200} onCommit={(v) => set('saturate', v)} unit="%" />
              <Slider label={tt('Grayscale', 'رمادي')} value={adj.gray ?? 0} min={0} max={100} onCommit={(v) => set('gray', v)} unit="%" />
              <Slider label={tt('Sepia', 'بني قديم')} value={adj.sepia ?? 0} min={0} max={100} onCommit={(v) => set('sepia', v)} unit="%" />
              <Slider label={tt('Blur', 'تمويه')} value={adj.blur ?? 0} min={0} max={10} step={0.5} onCommit={(v) => set('blur', v)} unit="px" />
              <Slider label={tt('Warmth', 'الدفء')} value={adj.temp ?? 0} min={-100} max={100} onCommit={(v) => set('temp', v)} />
              <Slider label={tt('Hue', 'درجة اللون')} value={adj.hue ?? 0} min={-180} max={180} onCommit={(v) => set('hue', v)} unit="°" />
              <Slider label={tt('Fade', 'بهتان')} value={adj.fade ?? 0} min={0} max={100} onCommit={(v) => set('fade', v)} unit="%" />
              <Slider label={tt('Sharpen', 'حدّة')} value={adj.sharpen ?? 0} min={0} max={100} onCommit={(v) => set('sharpen', v)} unit="%" />
              <Slider label={tt('Vignette', 'تعتيم الأطراف')} value={adj.vignette ?? 0} min={0} max={100} onCommit={(v) => set('vignette', v)} unit="%" />
              <div className="dxb__line">
                <button type="button" className={`dxb__chip${adj.auto ? ' is-on' : ''}`} onClick={() => set('auto', adj.auto ? 0 : 1)}>{tt('Auto enhance', 'تحسين تلقائي')}</button>
                <button type="button" className="dxb__chip" onClick={() => A.picFilter({ adj: null })}>{tt('Reset adjustments', 'إلغاء التعديلات')}</button>
              </div>
            </div>
          )}
        </Pop2>
      </Group>
      <Sep />
      <Group title={tt('Rotate', 'تدوير')}>
        <B icon="ed-rotate-ccw" label={tt('Rotate left', 'تدوير لليسار')} onClick={() => A.picOps({ rot: (ops.rot || 0) - 90 })} />
        <B icon="ed-rotate-cw" label={tt('Rotate right', 'تدوير لليمين')} onClick={() => A.picOps({ rot: (ops.rot || 0) + 90 })} />
        <B icon="ed-flip-h" label={tt('Flip horizontally', 'قلب أفقي')} onClick={() => A.picOps({ flipH: !ops.flipH })} />
        <B icon="ed-flip-v" label={tt('Flip vertically', 'قلب رأسي')} onClick={() => A.picOps({ flipV: !ops.flipV })} />
      </Group>
      <Sep />
      <Group title={tt('Position', 'الموضع')}>
        <div className="dxt__2r"><div className="dxt__row">
          <button type="button" className={`dxb__chip${!im.fl ? ' is-on' : ''}`} onMouseDown={keep} onClick={() => A.imgFloat(null)}>{tt('In line', 'ضمن السطر')}</button>
          <button type="button" className={`dxb__chip${im.fl === 'left' ? ' is-on' : ''}`} onMouseDown={keep} onClick={() => A.imgFloat('left')}>{tt('Float left', 'عائم يسار')}</button>
          <button type="button" className={`dxb__chip${im.fl === 'right' ? ' is-on' : ''}`} onMouseDown={keep} onClick={() => A.imgFloat('right')}>{tt('Float right', 'عائم يمين')}</button>
        </div><div className="dxt__row">
          <B icon="ed-align-left" label={tt('Align left', 'يسار')} onClick={() => A.align('left')} /><B icon="ed-align-center" label={tt('Centre', 'وسط')} onClick={() => A.align('center')} /><B icon="ed-align-right" label={tt('Align right', 'يمين')} onClick={() => A.align('right')} />
        </div></div>
      </Group>
      <Sep />
      <Group title={tt('Picture', 'الصورة')}>
        <Big icon="note" label={tt('Caption', 'تعليق')} onClick={A.caption} />
        <Pop2 icon="info" label={tt('Alt text', 'نص بديل')} text={tt('Alt text', 'نص بديل')} w={260} btnClass="dxt__bigpop">
          {(close) => <AltEditor tt={tt} value={im.alt} onSave={(v) => { A.picAlt(v); close(); }} />}
        </Pop2>
        <Big icon="refresh" label={tt('Replace', 'استبدال')} onClick={A.picReplace} />
        <Big icon="ed-clear" label={tt('Reset', 'إعادة ضبط')} onClick={A.picReset} disabled={!rec.orig} />
        <Big icon="trash" label={tt('Delete', 'حذف')} onClick={A.imgDel} />
      </Group>
    </>
  );
}
function AltEditor({ tt, value, onSave }) {
  const [v, setV] = useState(value || '');
  return <div className="dxpp"><input autoFocus className="dxf__q" value={v} placeholder={tt('Describe the picture', 'اوصف الصورة')} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') onSave(v); }} /><button type="button" className="dxb__chip" onClick={() => onSave(v)}>{tt('Save', 'حفظ')}</button></div>;
}

/**
 * Tabbed Word ribbon: Home · Insert · Design · Layout · View, plus Table / Picture tabs that appear when one is selected.
 * Memoised on S (formatting under the caret, page, zoom …): typing does not re-render it. The window-appearance button
 * (dark / light / code themes) sits at the far end of the tab strip — it is NOT part of the document design.
 */
function DocxTabs({ tt, ar, S, A }) {
  const [tab, setTab] = useState('home'); const [open, setOpen] = useState(true); const back = useRef('home');
  const ctx = S.imgSel ? 'picture' : S.inTable ? 'table' : null; const was = useRef(null);
  useEffect(() => { // a table / picture was just selected: jump to its tab; when it is left, go back
    if (ctx && ctx !== was.current) { if (!['table', 'picture'].includes(tab)) back.current = tab; setTab(ctx); }
    was.current = ctx;
    if (!ctx && ['table', 'picture'].includes(tab)) { // the picture / table is no longer selected: leave its tab, but not on a momentary blink (a picture edit re-renders the picture)
      const t = setTimeout(() => setTab(back.current), 900); return () => clearTimeout(t);
    }
    return undefined;
  }, [ctx]); // eslint-disable-line react-hooks/exhaustive-deps
  const tabs = [['home', tt('Home', 'الرئيسية')], ['insert', tt('Insert', 'إدراج')], ['design', tt('Design', 'التصميم')], ['layout', tt('Layout', 'التخطيط')], ['view', tt('View', 'عرض')], ...(S.inTable ? [['table', tt('Table', 'جدول'), 1]] : []), ...(S.imgSel ? [['picture', tt('Picture', 'صورة'), 1]] : [])];
  const cur = tabs.some((t) => t[0] === tab) ? tab : 'home'; const P = { tt, ar, S, A };
  return (
    <div className="dxt" data-px-keep role="toolbar" aria-label={tt('Word ribbon', 'شريط Word')}>
      <div className="dxt__tabs" role="tablist">
        {tabs.map(([id, label, c]) => <button key={id} type="button" role="tab" aria-selected={cur === id} className={`dxt__tab${cur === id ? ' is-on' : ''}${c ? ' is-ctx' : ''}`} onMouseDown={keep} onClick={() => { setTab(id); setOpen(true); }}>{label}</button>)}
        <span className="dxt__fill" />
        <button type="button" className="dxt__fold" onMouseDown={keep} onClick={() => setOpen((o) => !o)} title={open ? tt('Collapse the ribbon', 'طي الشريط') : tt('Expand the ribbon', 'توسيع الشريط')} aria-expanded={open}><Icon name={open ? 'chevron-up' : 'chevron-down'} size={14} /></button>
        <UiThemeButton tt={tt} />
      </div>
      {open && (
        <div className="dxt__panel" role="tabpanel">
          {cur === 'home' && <HomeTab {...P} />}{cur === 'insert' && <InsertTab {...P} />}{cur === 'design' && <DesignTab {...P} />}
          {cur === 'layout' && <LayoutTab {...P} />}{cur === 'view' && <ViewTab {...P} />}{cur === 'table' && <TableTab {...P} />}{cur === 'picture' && <PictureTab {...P} />}
        </div>
      )}
    </div>
  );
}
export default memo(DocxTabs);
