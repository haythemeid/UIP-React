import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { zipSync } from 'fflate';
import Icon from '../Icon';
import { useLanguage } from '../../context/LanguageContext';
import { api } from '../../api/client';
import { postsApi } from '../../api/postsApi';
import { useSandbox } from '../zipbench/runner/useSandbox';
import { fmtBytes } from '../../lib/postMedia';
import { highlight } from './highlight';

const SandboxTerminal = lazy(() => import('./SandboxTerminal'));
const MAX_LINES = 14;

/** HTML/CSS/JS runs in a locked-down iframe (no same-origin → can't touch the UIP session). */
function htmlDoc(text, lang) {
  if (lang === 'html') return text;
  if (lang === 'css') return `<!doctype html><meta charset="utf-8"><style>${text}</style><body><h1>Heading</h1><p>Paragraph with <a href="#">link</a>.</p><button>Button</button>`;
  return `<!doctype html><meta charset="utf-8"><body><pre id="out" style="font:13px monospace"></pre><script>
const out=document.getElementById('out');const w=(...a)=>{out.textContent+=a.map(x=>typeof x==='object'?JSON.stringify(x):String(x)).join(' ')+'\\n'};
console.log=w;console.error=(...a)=>w('Error:',...a);window.onerror=(m)=>w('Error:',m);
</script><script>${text.replace(/<\/script/gi, '<\\/script')}</script>`;
}

export default function CodeCard({ media, onRunStart }) {
  const { locale } = useLanguage();
  const tt = (en, ar) => (locale === 'ar' ? ar : en);
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [open, setOpen] = useState(false);       // expanded
  const [mode, setMode] = useState('code');      // code | run
  const [copied, setCopied] = useState(false);
  const [frameKey, setFrameKey] = useState(0);
  const sandbox = useSandbox(`post-${media.id}`, `/api/v1/posts/media/${media.id}/run-token`);
  const textRef = useRef('');

  useEffect(() => {
    let dead = false;
    postsApi.mediaText(media.id).then((d) => { if (!dead) { setData(d); textRef.current = d.text; } }).catch(() => { if (!dead) setErr(tt('Could not load the code.', 'تعذّر تحميل الكود.')); });
    return () => { dead = true; };
  }, [media.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const lang = data?.language || media.extension || 'text';
  const runner = data?.runner || media.meta?.runner || 'none';
  const lines = useMemo(() => (data?.text || '').split('\n'), [data]);
  const shown = open ? lines : lines.slice(0, MAX_LINES);
  const html = useMemo(() => highlight(shown.join('\n'), lang), [shown, lang]);

  const copy = async () => { try { await navigator.clipboard.writeText(textRef.current); setCopied(true); setTimeout(() => setCopied(false), 1400); } catch { /* blocked */ } };

  const runSandbox = () => {
    setMode('run');
    onRunStart?.();
    const name = media.original_name && /^[\w.\- ]+$/.test(media.original_name) ? media.original_name : `main.${media.extension || 'txt'}`;
    const zip = zipSync({ [name]: new TextEncoder().encode(textRef.current) }, { level: 1 });
    sandbox.start({ kind: 'lang', entry: name, zip, cols: 100, rows: 14 });
  };
  const run = () => { if (runner === 'html') { setMode('run'); setFrameKey((k) => k + 1); } else if (runner === 'sandbox') runSandbox(); };
  const stop = () => { if (runner === 'sandbox') sandbox.stop(); setMode('code'); };

  const download = async () => {
    try {
      const res = await api.blob(media.urls.download);
      const blob = await res.blob();
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = media.original_name || 'code.txt'; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    } catch { /* blocked by author */ }
  };

  return (
    <div className="pp-code">
      <div className="pp-code__bar">
        <span className="pp-code__dots"><i /><i /><i /></span>
        <strong dir="ltr">{media.original_name}</strong>
        <span className="pp-chip">{lang}</span>
        <span className="pp-code__sp" />
        {runner !== 'none' && (mode === 'run'
          ? <button type="button" className="pp-code__btn is-stop" onClick={stop}><Icon name="stop" size={13} /> {tt('Stop', 'إيقاف')}</button>
          : <button type="button" className="pp-code__btn is-run" onClick={run} disabled={!data}><Icon name="play" size={13} /> {tt('Run', 'تشغيل')}</button>)}
        <button type="button" className="pp-code__btn" onClick={copy}><Icon name={copied ? 'check' : 'copy'} size={13} /> {copied ? tt('Copied', 'اتنسخ') : tt('Copy', 'نسخ')}</button>
        {media.urls?.download && <button type="button" className="pp-code__btn" onClick={download} title={fmtBytes(media.size_bytes)}><Icon name="download" size={13} /></button>}
      </div>

      {err && <p className="pp-code__err">{err}</p>}
      {!data && !err && <div className="pp-skel" style={{ height: 120 }} />}
      {data && (
        <pre className={`pp-code__pre${open ? ' is-open' : ''}`} dir="ltr"><code dangerouslySetInnerHTML={{ __html: html }} /></pre>
      )}
      {data && (lines.length > MAX_LINES || data.truncated) && (
        <button type="button" className="pp-code__more" onClick={() => setOpen((o) => !o)}>
          <Icon name={open ? 'chevron-up' : 'chevron-down'} size={14} />
          {open ? tt('Show less', 'عرض أقل') : tt(`Show all ${lines.length} lines`, `عرض كل ${lines.length} سطر`)}
        </button>
      )}
      {data?.truncated && open && <p className="pp-code__note">{tt('Large file — only the first part is shown. Download it to see everything.', 'ملف كبير — الجزء الأول بس معروض. نزّله عشان تشوفه كله.')}</p>}

      {mode === 'run' && runner === 'html' && (
        <div className="pp-run">
          <div className="pp-run__bar"><span><Icon name="play" size={12} /> {tt('Live preview', 'معاينة مباشرة')}</span>
            <button type="button" className="pp-code__btn" onClick={() => setFrameKey((k) => k + 1)}><Icon name="refresh" size={13} /></button></div>
          <iframe key={frameKey} title={media.original_name} className="pp-run__frame" sandbox="allow-scripts" referrerPolicy="no-referrer" srcDoc={htmlDoc(textRef.current, String(lang).toLowerCase())} />
        </div>
      )}
      {mode === 'run' && runner === 'sandbox' && (
        <div className="pp-run">
          <div className="pp-run__bar">
            <span className={`pp-run__st is-${sandbox.phase}`}><i />{sandbox.busy && sandbox.statusText ? sandbox.statusText : sandbox.phase === 'running' ? tt('Running', 'شغّال') : sandbox.phase === 'exited' ? tt('Finished', 'خلص') : sandbox.phase === 'error' ? tt('Failed', 'فشل') : tt('Connecting…', 'جاري الاتصال…')}</span>
            {(sandbox.phase === 'running' || sandbox.phase === 'exited') && <button type="button" className="pp-code__btn" onClick={() => sandbox.restart(100, 14)}><Icon name="refresh" size={13} /> {tt('Run again', 'شغّل تاني')}</button>}
          </div>
          {sandbox.error && <p className="pp-code__err">{sandbox.error}</p>}
          <Suspense fallback={<div className="pp-skel" style={{ height: 180 }} />}><SandboxTerminal sandbox={sandbox} /></Suspense>
          {sandbox.previewUrl && <iframe title="preview" className="pp-run__frame" src={sandbox.previewUrl} sandbox="allow-scripts allow-same-origin allow-forms" referrerPolicy="no-referrer" />}
        </div>
      )}
    </div>
  );
}
