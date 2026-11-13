import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icon';
import { useLanguage } from '../context/LanguageContext';
import { transfers, useTransfers } from '../lib/transfers';
import '../styles/css/my-pc.css';

const MAX_ROWS = 40;

const nf = (n, ar, d = 0) => n.toLocaleString(ar ? 'ar-EG' : 'en-US', { maximumFractionDigits: d });

function fmtBytes(b, ar) {
  const u = ar ? ['ب', 'ك.ب', 'م.ب', 'ج.ب'] : ['B', 'KB', 'MB', 'GB'];
  let i = 0; let v = b;
  while (v >= 1024 && i < u.length - 1) { v /= 1024; i += 1; }
  return `${nf(v, ar, v >= 100 || i === 0 ? 0 : 1)} ${u[i]}`;
}

function fmtTime(sec, ar) {
  const s = Math.max(1, Math.round(sec));
  if (s < 60) return ar ? `${nf(s, ar)} ث` : `${s} s`;
  const m = Math.floor(s / 60);
  if (m < 60) return ar ? `${nf(m, ar)} د ${nf(s % 60, ar)} ث` : `${m} min ${s % 60} s`;
  return ar ? `${nf(Math.floor(m / 60), ar)} س ${nf(m % 60, ar)} د` : `${Math.floor(m / 60)} h ${m % 60} min`;
}

const EXT_TONE = {
  pdf: '#e5484d', doc: '#2b6cd9', docx: '#2b6cd9', xls: '#1f9d55', xlsx: '#1f9d55', csv: '#1f9d55', ppt: '#e8742a', pptx: '#e8742a',
  png: '#8b5cf6', jpg: '#8b5cf6', jpeg: '#8b5cf6', gif: '#8b5cf6', webp: '#8b5cf6', svg: '#8b5cf6',
  zip: '#78716c', rar: '#78716c', '7z': '#78716c', mp4: '#d946a8', mp3: '#d946a8', txt: '#64748b',
};
const extOf = (n) => { const m = /\.([a-z0-9]{1,5})$/i.exec(n || ''); return m ? m[1].toLowerCase() : ''; };

function Row({ it, ar, tt }) {
  const ext = extOf(it.name);
  const loaded = (it.pct / 100) * it.size;
  const left = it.speed > 0 ? (it.size - loaded) / it.speed : 0;
  let sub;
  if (it.status === 'queued') sub = tt('Waiting…', 'في الانتظار…');
  else if (it.status === 'err') sub = it.error || tt('Upload failed', 'فشل الرفع');
  else if (it.status === 'done') sub = `${fmtBytes(it.size, ar)} · ${tt('Uploaded', 'تم الرفع')}`;
  else if (it.pct >= 99) sub = tt('Finishing…', 'جاري الإنهاء…');
  else sub = `${fmtBytes(loaded, ar)} ${tt('of', 'من')} ${fmtBytes(it.size, ar)}${it.speed > 0 ? ` · ${fmtBytes(it.speed, ar)}/${tt('s', 'ث')}` : ''}${left > 1 ? ` · ${fmtTime(left, ar)}` : ''}`;
  return (
    <li className={`up-row is-${it.status}`}>
      <span className="up-ft" style={{ '--ft': EXT_TONE[ext] || 'var(--os-accent, var(--color-primary, #6366f1))' }} aria-hidden="true">{ext ? ext.slice(0, 4) : <Icon name="file" size={15} />}</span>
      <span className="up-mid">
        <b dir="auto" title={it.rel}>{it.rel}</b>
        <small dir="auto">{sub}</small>
        {(it.status === 'run' || it.status === 'queued') && (
          <span className={`up-bar${it.status === 'queued' ? ' is-wait' : ''}`}><i style={{ width: `${it.status === 'queued' ? 0 : it.pct}%` }} /></span>
        )}
      </span>
      <span className="up-act">
        {it.status === 'done' && <span className="up-ok"><Icon name="check" size={16} /></span>}
        {it.status === 'err' && it.retry && <button type="button" onClick={() => transfers.retry(it.id)} title={tt('Try again', 'حاول تاني')} aria-label={tt('Try again', 'حاول تاني')}><Icon name="refresh" size={14} /></button>}
        {(it.status === 'run' || it.status === 'queued') && <button type="button" onClick={() => transfers.cancel(it.id)} title={tt('Cancel', 'إلغاء')} aria-label={tt('Cancel', 'إلغاء')}><Icon name="x" size={14} /></button>}
        {it.status === 'err' && !it.retry && <span className="up-bad"><Icon name="alert-triangle" size={16} /></span>}
      </span>
    </li>
  );
}

/**
 * OS-style upload panel (like the Windows copy dialog / Google Drive upload box): one overall bar, speed, time left,
 * a row per file with its own bar, cancel + retry. Fed automatically by drive.upload (lib/transfers.js).
 * Mount once. portal = draw into <body> (use where there is no desktop theme around, e.g. the stand-alone Explorer page).
 */
export default function UploadProgressHost({ portal = false }) {
  const { locale } = useLanguage();
  const { items, minimized } = useTransfers();
  const ar = locale === 'ar';
  const tt = (en, a) => (ar ? a : en);
  const busy = items.some((i) => i.status === 'queued' || i.status === 'run');

  useEffect(() => {
    if (!busy) return undefined;
    const warn = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn); // closing the tab would cut the upload
    return () => window.removeEventListener('beforeunload', warn);
  }, [busy]);

  if (!items.length) return null;

  const total = items.length;
  const doneN = items.filter((i) => i.status === 'done').length;
  const failN = items.filter((i) => i.status === 'err').length;
  const leftN = total - doneN - failN;
  const sizeSum = items.reduce((a, i) => a + Math.max(i.size, 1), 0);
  const loadedSum = items.reduce((a, i) => a + (i.status === 'done' ? Math.max(i.size, 1) : i.status === 'run' ? (i.pct / 100) * Math.max(i.size, 1) : 0), 0);
  const overall = Math.min(100, Math.round((loadedSum / sizeSum) * 100));
  const speed = items.filter((i) => i.status === 'run').reduce((a, i) => a + i.speed, 0);
  const eta = speed > 0 ? (sizeSum - loadedSum) / speed : 0;

  const order = { run: 0, queued: 1, err: 2, done: 3 };
  const rows = [...items].sort((a, b) => order[a.status] - order[b.status]);

  let title; let sub; let state;
  if (busy) {
    state = 'run';
    title = leftN === 1 ? tt('Uploading 1 item', 'جارٍ رفع ملف واحد') : tt(`Uploading ${nf(leftN, ar)} items`, `جارٍ رفع ${nf(leftN, ar)} ملفات`);
    sub = `${nf(overall, ar)}%${speed > 0 ? ` · ${fmtBytes(speed, ar)}/${tt('s', 'ث')}` : ''}${eta > 1 ? ` · ${tt(`${fmtTime(eta, ar)} left`, `باقي ${fmtTime(eta, ar)}`)}` : ''}`;
  } else if (failN) {
    state = 'err';
    title = tt(`${nf(failN, ar)} of ${nf(total, ar)} failed`, `فشل رفع ${nf(failN, ar)} من ${nf(total, ar)}`);
    sub = doneN ? tt(`${nf(doneN, ar)} uploaded`, `تم رفع ${nf(doneN, ar)}`) : tt('Check the files and try again', 'راجع الملفات وحاول تاني');
  } else {
    state = 'ok';
    title = doneN === 1 ? tt('Upload complete', 'اكتمل الرفع') : tt(`${nf(doneN, ar)} uploads complete`, `اكتمل رفع ${nf(doneN, ar)} ملفات`);
    sub = tt('Saved to My PC', 'اتحفظت في جهازي');
  }

  const node = (
    <div className={`up is-${state}${minimized ? ' is-min' : ''}`} dir={ar ? 'rtl' : 'ltr'} role="status" aria-live="polite">
      <div className="up-head">
        <span className="up-ico" aria-hidden="true">
          <Icon name={state === 'ok' ? 'check' : state === 'err' ? 'alert-triangle' : 'cloud-up'} size={18} />
        </span>
        <span className="up-title"><b>{title}</b><small>{sub}</small></span>
        <span className="up-hbtns">
          {state === 'err' && items.some((i) => i.status === 'err' && i.retry) && <button type="button" className="up-txt" onClick={() => transfers.retryFailed()}>{tt('Retry', 'إعادة')}</button>}
          {busy && <button type="button" className="up-txt" onClick={() => transfers.cancelAll()}>{tt('Cancel all', 'إلغاء الكل')}</button>}
          <button type="button" onClick={() => transfers.toggleMinimized()} aria-label={minimized ? tt('Expand', 'توسيع') : tt('Minimize', 'تصغير')} title={minimized ? tt('Expand', 'توسيع') : tt('Minimize', 'تصغير')}><Icon name={minimized ? 'chevron-up' : 'chevron-down'} size={16} /></button>
          {!busy && <button type="button" onClick={() => transfers.clear()} aria-label={tt('Close', 'إغلاق')} title={tt('Close', 'إغلاق')}><Icon name="x" size={16} /></button>}
        </span>
      </div>
      {busy && <span className="up-all"><i style={{ width: `${overall}%` }} /></span>}
      {!minimized && (
        <ul className="up-list">
          {rows.slice(0, MAX_ROWS).map((it) => <Row key={it.id} it={it} ar={ar} tt={tt} />)}
          {rows.length > MAX_ROWS && <li className="up-more">{tt(`+ ${nf(rows.length - MAX_ROWS, ar)} more`, `+ ${nf(rows.length - MAX_ROWS, ar)} ملف تاني`)}</li>}
        </ul>
      )}
    </div>
  );
  return portal && typeof document !== 'undefined' ? createPortal(node, document.body) : node;
}
