import { useCallback, useEffect, useRef, useState } from 'react';
import Icon from '../Icon';
import { postsApi } from '../../api/postsApi';
import { errorMessage } from '../../api/client';
import { fmtBytes } from '../../lib/postMedia';
import { Alert, COMMENT_MODES, PAvatar, VIS, useTt } from './shared';

const CODE_EXT = ['py', 'js', 'ts', 'html', 'css', 'php', 'java', 'c', 'cpp', 'cs', 'go', 'rb', 'sh', 'sql', 'json', 'yml', 'md'];
let seq = 0;

/** Language picker: a styled listbox instead of the browser's native <select> popup (which ignores the app theme and shows an OS scrollbar). */
function LangSelect({ value, options, onChange, label }) {
  const [open, setOpen] = useState(false);
  const [cur, setCur] = useState(0);
  const root = useRef(null);
  const list = useRef(null);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return undefined;
    setCur(Math.max(0, options.indexOf(value)));
    const down = (e) => { if (root.current && !root.current.contains(e.target)) close(); };
    document.addEventListener('mousedown', down);
    return () => document.removeEventListener('mousedown', down);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (open) list.current?.children[cur]?.scrollIntoView({ block: 'nearest' }); }, [cur, open]);

  const pick = (v) => { onChange(v); close(); };
  const key = (e) => {
    if (!open) { if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) { e.preventDefault(); setOpen(true); } return; }
    if (e.key === 'Escape') { e.preventDefault(); close(); } else if (e.key === 'ArrowDown') { e.preventDefault(); setCur((i) => Math.min(options.length - 1, i + 1)); } else if (e.key === 'ArrowUp') { e.preventDefault(); setCur((i) => Math.max(0, i - 1)); } else if (e.key === 'Home') { e.preventDefault(); setCur(0); } else if (e.key === 'End') { e.preventDefault(); setCur(options.length - 1); } else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(options[cur]); }
  };
  return (
    <div className="pp-sel" ref={root} dir="ltr">
      <button type="button" className="pp-sel__btn" aria-haspopup="listbox" aria-expanded={open} aria-label={label} onClick={() => setOpen((o) => !o)} onKeyDown={key}>
        <span>{value}</span><Icon name="chevron-down" size={14} />
      </button>
      {open && (
        <ul className="pp-sel__list" role="listbox" ref={list} aria-label={label}>
          {options.map((o, i) => (
            <li key={o} role="option" aria-selected={o === value} className={`pp-sel__opt${o === value ? ' is-on' : ''}${i === cur ? ' is-cur' : ''}`} onMouseEnter={() => setCur(i)} onMouseDown={(e) => { e.preventDefault(); pick(o); }}>
              <span>{o}</span>{o === value && <Icon name="check" size={14} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Create (or edit, when `post` is given) a post: text, files of any kind (chunked when big), code snippet, voice note, audience & settings, schedule, draft. */
export default function Composer({ config, me, post, onSaved, onCancel }) {
  const { tt } = useTt();
  const editing = !!post;
  const lim = config?.limits || {};
  const [title, setTitle] = useState(post?.title || '');
  const [body, setBody] = useState(post?.body || '');
  const [link, setLink] = useState(post?.link_url || '');
  const [vis, setVis] = useState(post?.visibility || (config?.visibilities?.includes('public') ? 'public' : 'followers'));
  const [mode, setMode] = useState(post?.comments_mode || 'everyone');
  const [opts, setOpts] = useState({ allow_download: post?.allow_download ?? true, allow_repost: post?.allow_repost ?? true, hide_counts: post?.hide_counts ?? false, is_sensitive: post?.is_sensitive ?? false });
  const [items, setItems] = useState(() => (post?.media || []).map((m) => ({ key: `m${m.id}`, status: 'done', media: m, name: m.original_name, size: m.size_bytes })));
  const [open, setOpen] = useState(editing || false);
  const [more, setMore] = useState(false);
  const [showTitle, setShowTitle] = useState(!!post?.title);
  const [showLink, setShowLink] = useState(!!post?.link_url);
  const [code, setCode] = useState(null); // { ext, text }
  const [when, setWhen] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [rec, setRec] = useState(null);   // { mr, chunks, t }
  const [secs, setSecs] = useState(0);
  const fileRef = useRef(null);
  const ctl = useRef(new Map());

  useEffect(() => { if (!rec) return undefined; const id = setInterval(() => setSecs((s) => s + 1), 1000); return () => clearInterval(id); }, [rec]);
  useEffect(() => () => { ctl.current.forEach((c) => c.abort()); }, []);

  const uploading = items.some((i) => i.status === 'up');
  const upload = (file) => {
    const key = `u${++seq}`;
    const ac = new AbortController(); ctl.current.set(key, ac);
    setItems((p) => [...p, { key, status: 'up', progress: 0, name: file.name, size: file.size, file }]);
    const upd = (patch) => setItems((p) => p.map((i) => (i.key === key ? { ...i, ...patch } : i)));
    postsApi.uploadMedia(file, { signal: ac.signal, onProgress: (pct) => upd({ progress: pct }) })
      .then((m) => upd({ status: 'done', media: m, progress: 100 }))
      .catch((e) => upd({ status: 'err', error: ac.signal.aborted ? tt('Cancelled', 'أُلغي') : errorMessage(e) }))
      .finally(() => ctl.current.delete(key));
  };
  const addFiles = (list) => {
    setOpen(true);
    const room = (lim.max_media_per_post || 20) - items.length;
    Array.from(list).slice(0, Math.max(0, room)).forEach((f) => {
      if (lim.max_file_mb && f.size > lim.max_file_mb * 1048576) { setErr(tt(`${f.name} is larger than ${lim.max_file_mb} MB.`, `${f.name} أكبر من ${lim.max_file_mb} ميجا.`)); return; }
      upload(f);
    });
  };
  const remove = (i) => {
    ctl.current.get(i.key)?.abort();
    if (i.status === 'done' && i.media && !i.media.post_id) postsApi.deleteMedia(i.media.id).catch(() => {});
    setItems((p) => p.filter((x) => x.key !== i.key));
  };
  const retry = (i) => { setItems((p) => p.filter((x) => x.key !== i.key)); if (i.file) upload(i.file); };

  const addCode = () => {
    if (!code?.text.trim()) return;
    upload(new File([code.text], `snippet.${code.ext}`, { type: 'text/plain' }));
    setCode(null);
  };
  const startRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported('audio/ogg;codecs=opus') ? 'audio/ogg' : 'audio/webm';
      const mr = new MediaRecorder(stream, { mimeType: mime }); const chunks = [];
      mr.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      mr.onstop = () => { stream.getTracks().forEach((t) => t.stop()); upload(new File([new Blob(chunks, { type: mime })], `voice-${Date.now()}.${mime === 'audio/ogg' ? 'ogg' : 'weba'}`, { type: mime })); };
      mr.start(); setSecs(0); setRec({ mr }); setOpen(true);
    } catch { setErr(tt('Microphone is not available.', 'الميكروفون غير متاح.')); }
  };
  const stopRec = () => { rec?.mr.stop(); setRec(null); };

  const onPaste = (e) => { const fs = Array.from(e.clipboardData?.files || []); if (fs.length) { e.preventDefault(); addFiles(fs); } };
  const onDrop = (e) => { if (e.dataTransfer?.files?.length) { e.preventDefault(); addFiles(e.dataTransfer.files); } };

  const submit = async (draft = false) => {
    if (busy || uploading) return;
    setBusy(true); setErr('');
    const tags = Array.from(new Set((body.match(/#[\p{L}\p{N}_]{2,50}/gu) || []).map((t) => t.slice(1)))).slice(0, lim.max_hashtags || 10);
    const payload = {
      title, body, link_url: link, visibility: vis, comments_mode: mode, ...opts, tags,
      media_ids: items.filter((i) => i.status === 'done').map((i) => i.media.id),
      ...(draft ? { draft: true } : {}), ...(when ? { scheduled_at: new Date(when).toISOString() } : {}),
    };
    try {
      const saved = editing ? await postsApi.update(post.id, payload) : await postsApi.create(payload);
      onSaved?.(saved, { draft, scheduled: !!when });
      if (!editing) { setTitle(''); setBody(''); setLink(''); setItems([]); setWhen(''); setOpen(false); setShowTitle(false); setShowLink(false); }
    } catch (e) { setErr(errorMessage(e)); } finally { setBusy(false); }
  };

  const empty = !title.trim() && !body.trim() && !link.trim() && !items.some((i) => i.status === 'done');
  const flag = (k, en, ar) => <label className="pp-check"><input type="checkbox" checked={!!opts[k]} onChange={(e) => setOpts((o) => ({ ...o, [k]: e.target.checked }))} /> {tt(en, ar)}</label>;

  return (
    <section className={`pp-composer${open ? ' is-open' : ''}`} onDrop={onDrop} onDragOver={(e) => e.preventDefault()}>
      <div className="pp-composer__top">
        <PAvatar user={me} />
        {!open
          ? <button type="button" className="pp-composer__fake" onClick={() => setOpen(true)}>{tt('Share a thought, a PDF, code, a video…', 'شارك فكرة أو PDF أو كود أو فيديو…')}</button>
          : (
            <div className="pp-composer__fields">
              {showTitle && <input className="pp-input pp-input--title" maxLength={lim.max_title || 180} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={tt('Title', 'العنوان')} />}
              <textarea className="pp-input" dir="auto" rows={4} autoFocus maxLength={lim.max_body || 6000} value={body} onChange={(e) => setBody(e.target.value)} onPaste={onPaste}
                placeholder={tt('What do you want to talk about? Use #tags', 'عن ماذا تريد أن تتحدث؟ استخدم #وسوم')} />
              {showLink && <input className="pp-input" dir="ltr" type="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://…" />}
            </div>
          )}
      </div>

      {open && (
        <>
          {items.length > 0 && (
            <ul className="pp-files">
              {items.map((i) => (
                <li key={i.key} className={`pp-files__i is-${i.status}`}>
                  <Icon name={i.media?.kind === 'image' ? 'image' : i.media?.kind === 'audio' ? 'audio-wave' : i.media?.kind === 'video' ? 'video' : i.media?.kind === 'code' ? 'terminal' : 'file'} size={18} />
                  <div><strong dir="ltr">{i.name}</strong>
                    <small>{fmtBytes(i.size)}{i.status === 'up' ? ` · ${i.progress}%` : ''}{i.status === 'err' ? ` · ${i.error}` : ''}</small>
                    {i.status === 'up' && <i className="pp-bar"><b style={{ width: `${i.progress}%` }} /></i>}</div>
                  {i.status === 'err' && i.file && <button type="button" className="pp-icon" onClick={() => retry(i)} aria-label="Retry"><Icon name="refresh" size={15} /></button>}
                  <button type="button" className="pp-icon" onClick={() => remove(i)} aria-label="Remove"><Icon name="x" size={15} /></button>
                </li>
              ))}
            </ul>
          )}

          {code && (
            <div className="pp-panel">
              <div className="pp-row"><LangSelect value={code.ext} options={CODE_EXT} label={tt('Language', 'اللغة')} onChange={(ext) => setCode({ ...code, ext })} />
                <small className="pp-muted">{tt('Runnable languages get a Run button on the post.', 'اللغات القابلة للتشغيل يظهر لها زر تشغيل.')}</small></div>
              <textarea className="pp-input pp-input--code" dir="ltr" rows={8} spellCheck={false} value={code.text} onChange={(e) => setCode({ ...code, text: e.target.value })} placeholder="print('hello')" />
              <div className="pp-row"><button type="button" className="pp-btn is-primary" onClick={addCode} disabled={!code.text.trim()}>{tt('Attach code', 'إرفاق الكود')}</button><button type="button" className="pp-btn" onClick={() => setCode(null)}>{tt('Cancel', 'إلغاء')}</button></div>
            </div>
          )}

          <div className="pp-composer__bar">
            <input ref={fileRef} type="file" multiple hidden onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
            <button type="button" className="pp-icon" title={tt('Photos, videos, PDF, slides, files', 'صور، فيديو، PDF، عروض، ملفات')} onClick={() => fileRef.current?.click()}><Icon name="paperclip" size={18} /></button>
            <button type="button" className="pp-icon" title={tt('Code snippet', 'مقتطف كود')} onClick={() => setCode(code ? null : { ext: 'py', text: '' })}><Icon name="terminal" size={18} /></button>
            {rec
              ? <button type="button" className="pp-btn is-danger" onClick={stopRec}><Icon name="stop" size={13} /> {Math.floor(secs / 60)}:{String(secs % 60).padStart(2, '0')}</button>
              : <button type="button" className="pp-icon" title={tt('Voice note', 'تسجيل صوتي')} onClick={startRec}><Icon name="mic" size={18} /></button>}
            {!showTitle && <button type="button" className="pp-icon" title={tt('Add title', 'عنوان')} onClick={() => setShowTitle(true)}><Icon name="ed-type" size={18} /></button>}
            {!showLink && <button type="button" className="pp-icon" title={tt('Add link', 'رابط')} onClick={() => setShowLink(true)}><Icon name="link" size={18} /></button>}
            <span className="pp-sp" />
            <select className="pp-input pp-input--sm" value={vis} onChange={(e) => setVis(e.target.value)} aria-label={tt('Audience', 'الجمهور')}>
              {(config?.visibilities || Object.keys(VIS)).filter((v) => v !== 'selected').map((v) => <option key={v} value={v}>{tt(VIS[v]?.en || v, VIS[v]?.ar || v)}</option>)}
            </select>
            <button type="button" className={`pp-icon${more ? ' is-on' : ''}`} title={tt('Settings', 'الإعدادات')} onClick={() => setMore((m) => !m)}><Icon name="settings" size={18} /></button>
          </div>

          {more && (
            <div className="pp-panel pp-settings">
              <label>{tt('Who can comment', 'من يمكنه التعليق')}
                <select className="pp-input" value={mode} onChange={(e) => setMode(e.target.value)}>{(config?.comments_modes || Object.keys(COMMENT_MODES)).map((m) => <option key={m} value={m}>{tt(COMMENT_MODES[m]?.en || m, COMMENT_MODES[m]?.ar || m)}</option>)}</select></label>
              {flag('allow_download', 'Allow downloading files', 'السماح بتنزيل الملفات')}
              {config?.allow_reposts !== false && flag('allow_repost', 'Allow reposts', 'السماح بإعادة النشر')}
              {flag('hide_counts', 'Hide reaction counts', 'إخفاء أعداد التفاعل')}
              {flag('is_sensitive', 'Mark media as sensitive', 'وسائط حساسة (تُخفى حتى الضغط)')}
              {config?.allow_scheduling && !editing && <label>{tt('Schedule for later', 'جدولة للنشر لاحقًا')}<input className="pp-input" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} /></label>}
            </div>
          )}

          {err && <Alert tt={tt}>{err}</Alert>}
          <div className="pp-composer__foot">
            {onCancel || !editing ? <button type="button" className="pp-btn" onClick={() => { if (onCancel) onCancel(); else setOpen(false); }}>{tt('Cancel', 'إلغاء')}</button> : null}
            <span className="pp-sp" />
            {!editing && <button type="button" className="pp-btn" disabled={busy || uploading || empty} onClick={() => submit(true)}>{tt('Save draft', 'حفظ كمسودة')}</button>}
            <button type="button" className="pp-btn is-primary" disabled={busy || uploading || empty} onClick={() => submit(false)}>
              {uploading ? tt('Uploading…', 'جارٍ الرفع…') : editing ? tt('Save changes', 'حفظ التعديلات') : when ? tt('Schedule', 'جدولة') : tt('Post', 'نشر')}
            </button>
          </div>
        </>
      )}
    </section>
  );
}
