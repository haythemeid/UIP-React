import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import Icon from '../Icon';
import { postsApi } from '../../api/postsApi';
import { errorMessage } from '../../api/client';
import { ago } from '../feed/feedUi';
import { compact } from '../../lib/postMedia';
import { safeHref } from '../../lib/safeUrl';
import { Alert, PAvatar, REACTIONS, REPORT_REASONS, RichText, VIS, useTt } from './shared';
import PostMedia from './PostMedia';
import SaveDialog from './SaveDialog';
import ShareDialog from './ShareDialog';

const Comments = lazy(() => import('./Comments'));
const BODY_CLAMP = 420;

function ReportBox({ post, onDone, tt }) {
  const [reason, setReason] = useState('spam');
  const [details, setDetails] = useState('');
  const [err, setErr] = useState('');
  const send = async (e) => { e.preventDefault(); try { await postsApi.report(post.id, reason, details || undefined); onDone(); } catch (x) { setErr(errorMessage(x)); } };
  return (
    <form className="pp-panel" onSubmit={send}>
      <strong>{tt('Why are you reporting this post?', 'سبب الإبلاغ عن المنشور')}</strong>
      <div className="pp-chips">{Object.entries(REPORT_REASONS).map(([k, [en, ar]]) => <button type="button" key={k} className={`pp-chip${reason === k ? ' is-on' : ''}`} onClick={() => setReason(k)}>{tt(en, ar)}</button>)}</div>
      <textarea className="pp-input" rows={2} maxLength={500} value={details} onChange={(e) => setDetails(e.target.value)} placeholder={tt('Details (optional)', 'تفاصيل (اختياري)')} />
      {err && <small className="pp-err">{err}</small>}
      <div className="pp-row"><button className="pp-btn is-primary">{tt('Send report', 'إرسال البلاغ')}</button><button type="button" className="pp-btn" onClick={onDone}>{tt('Cancel', 'إلغاء')}</button></div>
    </form>
  );
}

/** One post: header, text, attachments, reactions, comments, repost / share / save, and the author / reader menu. */
export default function PostCard({ post: initial, onChange, onRemoved, onTag, onEdit, onOpenAuthor, onSavedRemoved, compactView = false }) {
  const { tt, locale } = useTt();
  const [post, setPost] = useState(initial);
  const [panel, setPanel] = useState(null); // comments | report | repost
  const [menu, setMenu] = useState(false);
  const [picker, setPicker] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [sensitiveOk, setSensitiveOk] = useState(false);
  const [note, setNote] = useState('');
  const [err, setErr] = useState('');
  const [quote, setQuote] = useState('');
  const [saveOpen, setSaveOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => setPost(initial), [initial]);

  const patch = (p) => setPost((cur) => { const n = { ...cur, ...p }; onChange?.(n); return n; });
  const bumpCount = (k, d) => patch({ counts: post.counts ? { ...post.counts, [k]: Math.max(0, (post.counts[k] || 0) + d) } : post.counts });
  const run = async (fn) => { setErr(''); setNote(''); try { await fn(); } catch (e) { setErr(errorMessage(e)); } };

  // dwell tracking: report a view once the card has been mostly visible for 2s (feeds the ranking), and again on leave with the real dwell
  useEffect(() => {
    if (post.status !== 'published' || !ref.current) return undefined;
    let t0 = 0; let sent = false;
    const flush = () => { if (t0) { const ms = Date.now() - t0; t0 = 0; if (ms >= 2000 && !sent) { sent = true; postsApi.view(post.id, ms).catch(() => {}); } } };
    const io = new IntersectionObserver(([e]) => { if (e.intersectionRatio >= 0.6) { if (!t0) t0 = Date.now(); } else flush(); }, { threshold: [0, 0.6] });
    io.observe(ref.current);
    return () => { flush(); io.disconnect(); };
  }, [post.id, post.status]);

  const react = (type) => run(async () => {
    setPicker(false);
    const next = post.my_reaction === type ? null : type;
    const r = await postsApi.react(post.id, next);
    patch({ my_reaction: r.my_reaction, reaction_breakdown: r.breakdown, counts: post.counts ? { ...post.counts, reactions: r.reactions_count } : post.counts });
  });
  const saveDone = (r) => {
    setSaveOpen(false);
    patch({ saved: r.saved, saved_collection_id: r.collection_id ?? null, counts: post.counts ? { ...post.counts, saves: r.saves_count } : post.counts });
    setNote(!r.saved ? tt('Removed from saved.', 'تم إلغاء الحفظ.') : r.moved ? tt('Moved.', 'تم النقل.') : r.folder ? tt(`Saved to “${r.folder}”.`, `تم الحفظ في «${r.folder}».`) : tt('Saved.', 'تم الحفظ.'));
    if (!r.saved && onSavedRemoved) onSavedRemoved(post);
  };
  const shared = (kind) => bumpCount(kind === 'repost' ? 'reposts' : 'shares', 1);
  const repost = () => run(async () => { await postsApi.repost(post.id, quote.trim() || undefined); setPanel(null); setQuote(''); bumpCount('reposts', 1); setNote(tt('Reposted to your profile', 'تمت إعادة النشر')); });
  const follow = () => run(async () => { const r = post.author.is_following ? await postsApi.unfollow(post.author.id) : await postsApi.follow(post.author.id); patch({ author: { ...post.author, is_following: r?.following ?? !post.author.is_following } }); });
  const del = () => run(async () => { if (!window.confirm(tt('Delete this post?', 'حذف هذا المنشور؟'))) return; await postsApi.remove(post.id); onRemoved?.(post); });
  const pin = () => run(async () => { await (post.is_pinned ? postsApi.unpin(post.id) : postsApi.pin(post.id)); patch({ is_pinned: !post.is_pinned }); setMenu(false); });
  const archive = () => run(async () => { await postsApi.archive(post.id); onRemoved?.(post); });
  const publish = () => run(async () => { const n = await postsApi.publish(post.id); patch(n && n.id ? n : { status: 'published' }); });
  const hide = () => run(async () => { await postsApi.hide(post.id, 'not_interested'); onRemoved?.(post); });
  const mute = () => run(async () => { await postsApi.mute(post.author.id); onRemoved?.(post); });

  const c = post.counts;
  const vis = VIS[post.visibility] || VIS.public;
  const long = (post.body || '').length > BODY_CLAMP && !expanded;
  const top = Object.entries(post.reaction_breakdown || {}).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const hiddenMedia = post.is_sensitive && !sensitiveOk && !post.author.is_me;
  const my = post.my_reaction ? REACTIONS[post.my_reaction] : null;

  return (
    <article ref={ref} className={`pp-post${post.is_pinned ? ' is-pinned' : ''}${post.status !== 'published' ? ' is-draft' : ''}`}>
      <header className="pp-post__head">
        <button type="button" className="pp-plain" onClick={() => onOpenAuthor?.(post.author)}><PAvatar user={post.author} /></button>
        <div className="pp-post__who">
          <strong>{post.author.full_name}</strong>
          <span>
            {post.author.role && <em>{post.author.role.replace(/_/g, ' ')} · </em>}
            {ago(post.published_at || post.created_at, locale)}{post.edited_at ? ` · ${tt('edited', 'معدّل')}` : ''} · <Icon name={vis.icon} size={11} /> {tt(vis.en, vis.ar)}
          </span>
        </div>
        {post.is_pinned && <span className="pp-chip"><Icon name="pin" size={11} /> {tt('Pinned', 'مثبت')}</span>}
        {post.status !== 'published' && <span className="pp-chip is-warn">{{ draft: tt('Draft', 'مسودة'), scheduled: tt('Scheduled', 'مجدول'), pending: tt('Awaiting approval', 'بانتظار الموافقة'), archived: tt('Archived', 'مؤرشف'), removed: tt('Removed', 'محذوف') }[post.status] || post.status}</span>}
        {!post.author.is_me && !compactView && <button type="button" className={`pp-btn${post.author.is_following ? '' : ' is-primary'}`} onClick={follow}>{post.author.is_following ? tt('Following', 'تتابعه') : tt('Follow', 'متابعة')}</button>}
        <div className="pp-menu">
          <button type="button" className="pp-icon" aria-label={tt('More', 'المزيد')} aria-expanded={menu} onClick={() => setMenu((m) => !m)}><Icon name="more-horizontal" size={18} /></button>
          {menu && (
            <div className="pp-menu__list" onMouseLeave={() => setMenu(false)}>
              {post.can.edit && <button type="button" onClick={() => { setMenu(false); onEdit?.(post); }}><Icon name="edit" size={14} /> {tt('Edit', 'تعديل')}</button>}
              {post.can.pin && <button type="button" onClick={pin}><Icon name="pin" size={14} /> {post.is_pinned ? tt('Unpin', 'إلغاء التثبيت') : tt('Pin to profile', 'تثبيت')}</button>}
              {post.can.edit && post.status === 'published' && <button type="button" onClick={() => { setMenu(false); archive(); }}><Icon name="archive" size={14} /> {tt('Archive', 'أرشفة')}</button>}
              {!post.author.is_me && <button type="button" onClick={() => { setMenu(false); hide(); }}><Icon name="eye-off" size={14} /> {tt('Not interested', 'غير مهتم')}</button>}
              {!post.author.is_me && <button type="button" onClick={() => { setMenu(false); mute(); }}><Icon name="user-x" size={14} /> {tt('Mute this author', 'كتم الكاتب')}</button>}
              {post.can.report && <button type="button" onClick={() => { setMenu(false); setPanel('report'); }}><Icon name="flag" size={14} /> {tt('Report', 'إبلاغ')}</button>}
              {post.can.delete && <button type="button" className="is-danger" onClick={() => { setMenu(false); del(); }}><Icon name="trash" size={14} /> {tt('Delete', 'حذف')}</button>}
            </div>
          )}
        </div>
      </header>

      {post.title && <h2 className="pp-post__title">{post.title}</h2>}
      {post.body && (
        <p className="pp-post__body" dir="auto">
          <RichText text={long ? `${post.body.slice(0, BODY_CLAMP)}…` : post.body} onTag={onTag} />
          {long && <button type="button" className="pp-link" onClick={() => setExpanded(true)}>{tt('See more', 'عرض المزيد')}</button>}
        </p>
      )}
      {post.link_url && <a className="pp-linkcard" href={safeHref(post.link_url)} target="_blank" rel="noopener noreferrer nofollow"><Icon name="link" size={16} /><span dir="ltr">{post.link_url}</span></a>}
      {post.hashtags?.length > 0 && !post.body?.includes('#') && <div className="pp-tags">{post.hashtags.map((t) => <button key={t} type="button" className="pp-tag" onClick={() => onTag?.(t)}>#{t}</button>)}</div>}

      {hiddenMedia && post.media.length > 0 ? (
        <button type="button" className="pp-sensitive" onClick={() => setSensitiveOk(true)}><Icon name="eye-off" size={22} /><strong>{tt('Sensitive content', 'محتوى حساس')}</strong><span>{tt('Tap to view', 'اضغط للعرض')}</span></button>
      ) : <PostMedia media={post.media} canDownload={post.can.download} canRun={post.can.run !== false} />}

      {post.repost_of && (
        <div className="pp-quote">
          {post.repost_of.unavailable ? <p className="pp-muted">{tt('The original post is not available.', 'المنشور الأصلي غير متاح.')}</p>
            : <PostCard post={post.repost_of} compactView onTag={onTag} onOpenAuthor={onOpenAuthor} />}
        </div>
      )}

      {c && (c.reactions > 0 || c.comments > 0 || c.reposts > 0 || c.views > 0) && (
        <div className="pp-stats">
          <span>{top.map(([k]) => REACTIONS[k]?.e).join('')} {c.reactions > 0 && compact(c.reactions)}</span>
          <span>
            {c.comments > 0 && <button type="button" className="pp-plain" onClick={() => setPanel('comments')}>{compact(c.comments)} {tt('comments', 'تعليق')}</button>}
            {c.reposts > 0 && <> · {compact(c.reposts)} {tt('reposts', 'إعادة نشر')}</>}
            {post.author.is_me && c.views > 0 && <> · {compact(c.views)} {tt('views', 'مشاهدة')}</>}
          </span>
        </div>
      )}

      {post.status === 'published' && !compactView && (
        <div className="pp-actions">
          <div className="pp-react" onMouseEnter={() => setPicker(true)} onMouseLeave={() => setPicker(false)}>
            {picker && <div className="pp-react__pick">{Object.entries(REACTIONS).map(([k, r]) => <button key={k} type="button" title={tt(r.en, r.ar)} onClick={() => react(k)}>{r.e}</button>)}</div>}
            <button type="button" className={`pp-act${my ? ' is-on' : ''}`} onClick={() => react(my ? post.my_reaction : 'like')} aria-pressed={!!my}>
              {my ? <span>{my.e}</span> : <Icon name="thumbs-up" size={16} />} {my ? tt(my.en, my.ar) : tt('Like', 'إعجاب')}
            </button>
          </div>
          <button type="button" className={`pp-act${panel === 'comments' ? ' is-on' : ''}`} onClick={() => setPanel((p) => (p === 'comments' ? null : 'comments'))}><Icon name="message" size={16} /> {tt('Comment', 'تعليق')}</button>
          {post.can.repost && <button type="button" className={`pp-act${panel === 'repost' ? ' is-on' : ''}`} onClick={() => setPanel((p) => (p === 'repost' ? null : 'repost'))}><Icon name="refresh" size={16} /> {tt('Repost', 'إعادة نشر')}</button>}
          <button type="button" className="pp-act" onClick={() => setShareOpen(true)}><Icon name="share" size={16} /> {tt('Share', 'مشاركة')}</button>
          <button type="button" className={`pp-act pp-act--end pp-act--save${post.saved ? ' is-on' : ''}`} onClick={() => setSaveOpen(true)} aria-pressed={post.saved} title={post.saved ? tt('Unsave', 'إلغاء الحفظ') : tt('Save', 'حفظ')} aria-label={post.saved ? tt('Unsave', 'إلغاء الحفظ') : tt('Save', 'حفظ')}><Icon name="bookmark" size={16} />{post.saved && <span>{tt('Saved', 'محفوظ')}</span>}</button>
        </div>
      )}
      {(post.status === 'draft' || post.status === 'scheduled') && post.author.is_me && (
        <div className="pp-row"><button type="button" className="pp-btn is-primary" onClick={publish}>{tt('Publish now', 'نشر الآن')}</button>
          {post.scheduled_at && <small className="pp-muted"><Icon name="clock" size={12} /> {post.scheduled_at}</small>}</div>
      )}

      {shareOpen && <ShareDialog post={post} onClose={() => setShareOpen(false)} onShared={shared} />}
      {saveOpen && <SaveDialog post={post} onClose={() => setSaveOpen(false)} onDone={saveDone} />}
      {note && <small className="pp-ok">{note}</small>}
      {err && <Alert tt={tt}>{err}</Alert>}
      {panel === 'repost' && (
        <div className="pp-panel"><textarea className="pp-input" rows={2} maxLength={1000} value={quote} onChange={(e) => setQuote(e.target.value)} placeholder={tt('Add your thoughts (optional)', 'أضف رأيك (اختياري)')} />
          <div className="pp-row"><button type="button" className="pp-btn is-primary" onClick={repost}>{tt('Repost', 'إعادة نشر')}</button><button type="button" className="pp-btn" onClick={() => setPanel(null)}>{tt('Cancel', 'إلغاء')}</button></div></div>
      )}
      {panel === 'report' && <ReportBox post={post} tt={tt} onDone={() => { setPanel(null); setNote(tt('Thanks — your report was sent.', 'شكرًا — تم إرسال البلاغ.')); }} />}
      {panel === 'comments' && <Suspense fallback={<div className="pp-skel" style={{ height: 60 }} />}><Comments post={post} onCount={(d) => bumpCount('comments', d)} /></Suspense>}
    </article>
  );
}
