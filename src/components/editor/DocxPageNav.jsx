import { useEffect, useRef } from 'react';
import Icon from '../Icon';

/**
 * Page navigator (side panel of the Word editor): one small sheet per page with a text preview, the current page highlighted.
 *   - click a page = jump to it · "+" under a page = add a blank page after it · bin = delete that page
 *   - "Add page" at the bottom appends a blank page at the end of the document
 * `items`: [{ text, img, hasImg }] one per page (built from the document by the editor, so it stays cheap while typing).
 */
export default function DocxPageNav({ tt, pages, cur, items, ratio, paged, onGo, onAdd, onDel, onPaged, onClose }) {
  const list = useRef(null);
  useEffect(() => { // keep the current page card in view while scrolling through the document
    const l = list.current; const el = l?.querySelector('.is-cur'); if (!l || !el) return;
    const a = el.offsetTop; const b = a + el.offsetHeight;
    if (a < l.scrollTop) l.scrollTop = Math.max(0, a - 8); else if (b > l.scrollTop + l.clientHeight) l.scrollTop = b - l.clientHeight + 8;
  }, [cur, pages]);
  return (
    <aside className="dxnav" aria-label={tt('Pages', 'الصفحات')} data-px-keep>
      <header className="dxnav__hd">
        <strong>{tt('Pages', 'الصفحات')}</strong><span className="dxnav__n">{paged ? pages : ''}</span><span className="dxnav__sp" />
        <button type="button" onClick={onClose} title={tt('Close the pages panel', 'إغلاق لوحة الصفحات')} aria-label={tt('Close', 'إغلاق')}><Icon name="x" size={14} /></button>
      </header>
      {!paged ? (
        <div className="dxnav__off">
          <p>{tt('Page navigation needs the separate-pages view.', 'التنقل بين الصفحات محتاج عرض الصفحات المنفصلة.')}</p>
          <button type="button" className="dxb__chip" onClick={onPaged}>{tt('Show separate pages', 'عرض الصفحات منفصلة')}</button>
        </div>
      ) : (
        <>
          <ol className="dxnav__list" ref={list}>
            {items.map((it, i) => (
              <li key={i} className={`dxnav__card${i === cur ? ' is-cur' : ''}`}>
                <button type="button" className="dxnav__pg" style={{ aspectRatio: ratio }} onClick={() => onGo(i)} aria-current={i === cur ? 'page' : undefined} aria-label={`${tt('Page', 'صفحة')} ${i + 1}`}>
                  {it.img ? <img src={it.img} alt="" /> : it.hasImg ? <span className="dxnav__img"><Icon name="image" size={18} /></span> : null}
                  <span className="dxnav__txt" dir="auto">{it.text}</span>
                  {!it.text && !it.hasImg && <span className="dxnav__blank">{tt('Blank', 'فاضية')}</span>}
                </button>
                <span className="dxnav__num">{i + 1}</span>
                <span className="dxnav__act">
                  <button type="button" onClick={() => onAdd(i)} title={tt('Add a blank page after this one', 'إضافة صفحة فاضية بعد دي')} aria-label={tt('Add a blank page after this one', 'إضافة صفحة فاضية بعد دي')}><Icon name="plus" size={13} /></button>
                  <button type="button" onClick={() => onDel(i)} disabled={pages < 2} title={tt('Delete this page', 'حذف الصفحة دي')} aria-label={tt('Delete this page', 'حذف الصفحة دي')}><Icon name="trash" size={13} /></button>
                </span>
              </li>
            ))}
          </ol>
          <footer className="dxnav__ft"><button type="button" onClick={() => onAdd(pages - 1)}><Icon name="plus" size={14} />{tt('Add page', 'إضافة صفحة')}</button></footer>
        </>
      )}
    </aside>
  );
}
