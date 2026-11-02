import { useCallback, useEffect, useState } from 'react';
import Icon from '../Icon';
import { postsApi } from '../../api/postsApi';
import { errorMessage } from '../../api/client';
import { ago } from '../feed/feedUi';
import { Alert, PAvatar, useTt } from './shared';

function Comment({ c, postId, canComment, onChange, onDeleted, depth = 0 }) {
  const { tt, locale } = useTt();
  const [replies, setReplies] = useState(null);
  const [more, setMore] = useState(false);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [editing, setEditing] = useState(false);
  const [edit, setEdit] = useState(c.body);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const loadReplies = async (page = 1) => {
    const r = await postsApi.replies(c.id, page);
    setReplies((p) => (page === 1 ? r.items : [...(p || []), ...r.items]));
    setMore(!!r.meta.has_more);
  };
  const like = async () => { try { const r = await postsApi.likeComment(c.id); onChange({ ...c, liked_by_me: r.liked ?? !c.liked_by_me, likes_count: r.likes_count ?? c.likes_count + (c.liked_by_me ? -1 : 1) }); } catch (e) { setErr(errorMessage(e)); } };
  const reply = async (e) => {
    e.preventDefault(); if (!text.trim() || busy) return;
    setBusy(true); setErr('');
    try { const n = await postsApi.addComment(postId, text.trim(), c.parent_id || c.id); setText(''); setOpen(false); setReplies((p) => [...(p || []), n]); onChange({ ...c, replies_count: c.replies_count + 1 }); }
    catch (er) { setErr(errorMessage(er)); } finally { setBusy(false); }
  };
  const save = async () => { try { const n = await postsApi.editComment(c.id, edit.trim()); onChange({ ...c, ...n }); setEditing(false); } catch (e) { setErr(errorMessage(e)); } };
  const del = async () => { if (!window.confirm(tt('Delete this comment?', 'حذف هذا التعليق؟'))) return; try { await postsApi.deleteComment(c.id); onDeleted(c); } catch (e) { setErr(errorMessage(e)); } };

  return (
    <li className="pp-cm">
      <PAvatar user={c.author} size={32} />
      <div className="pp-cm__main">
        <div className="pp-cm__bubble">
          <strong>{c.author.full_name}{c.author.is_author && <em className="pp-chip">{tt('Author', 'الكاتب')}</em>}</strong>
          {editing ? (
            <div className="pp-row"><input className="pp-input" value={edit} onChange={(e) => setEdit(e.target.value)} /><button type="button" className="pp-btn is-primary" onClick={save}>{tt('Save', 'حفظ')}</button></div>
          ) : <p>{c.body}</p>}
        </div>
        <div className="pp-cm__acts">
          <span>{ago(c.created_at, locale)}{c.edited_at ? ` · ${tt('edited', 'معدّل')}` : ''}</span>
          <button type="button" className={c.liked_by_me ? 'is-on' : ''} onClick={like}><Icon name="heart" size={12} /> {c.likes_count || ''}</button>
          {canComment && depth === 0 && <button type="button" onClick={() => setOpen((o) => !o)}>{tt('Reply', 'رد')}</button>}
          {c.can.edit && <button type="button" onClick={() => setEditing((v) => !v)}>{tt('Edit', 'تعديل')}</button>}
          {c.can.delete && <button type="button" onClick={del}>{tt('Delete', 'حذف')}</button>}
        </div>
        {err && <small className="pp-err">{err}</small>}
        {open && <form className="pp-row" onSubmit={reply}><input className="pp-input" autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder={tt('Write a reply…', 'اكتب ردًا…')} /><button className="pp-btn is-primary" disabled={busy || !text.trim()}>{tt('Send', 'إرسال')}</button></form>}
        {c.replies_count > 0 && replies === null && depth === 0 && <button type="button" className="pp-link" onClick={() => loadReplies(1)}>{tt(`View ${c.replies_count} replies`, `عرض ${c.replies_count} ردود`)}</button>}
        {replies && (
          <ul className="pp-cm__list is-nested">
            {replies.map((r) => <Comment key={r.id} c={r} postId={postId} canComment={false} depth={1}
              onChange={(n) => setReplies((p) => p.map((x) => (x.id === n.id ? n : x)))} onDeleted={(d) => { setReplies((p) => p.filter((x) => x.id !== d.id)); onChange({ ...c, replies_count: Math.max(0, c.replies_count - 1) }); }} />)}
            {more && <button type="button" className="pp-link" onClick={() => loadReplies(Math.ceil(replies.length / 10) + 1)}>{tt('More replies', 'المزيد من الردود')}</button>}
          </ul>
        )}
      </div>
    </li>
  );
}

export default function Comments({ post, onCount }) {
  const { tt } = useTt();
  const [items, setItems] = useState(null);
  const [more, setMore] = useState(false);
  const [sort, setSort] = useState('top');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const load = useCallback(async (page = 1) => {
    try {
      const r = await postsApi.comments(post.id, sort, page);
      setItems((p) => (page === 1 ? r.items : [...(p || []), ...r.items])); setMore(!!r.meta.has_more); setErr('');
    } catch (e) { setErr(errorMessage(e)); setItems((p) => p || []); }
  }, [post.id, sort]);
  useEffect(() => { load(1); }, [load]);

  const add = async (e) => {
    e.preventDefault(); if (!text.trim() || busy) return;
    setBusy(true); setErr('');
    try { const n = await postsApi.addComment(post.id, text.trim()); setText(''); setItems((p) => [n, ...(p || [])]); onCount?.(1); }
    catch (er) { setErr(errorMessage(er)); } finally { setBusy(false); }
  };

  return (
    <section className="pp-comments">
      <div className="pp-comments__head">
        <div className="pp-seg">{[['top', 'Top', 'الأفضل'], ['new', 'Newest', 'الأحدث']].map(([k, en, ar]) => <button key={k} type="button" className={sort === k ? 'is-on' : ''} onClick={() => setSort(k)}>{tt(en, ar)}</button>)}</div>
      </div>
      {post.can.comment ? (
        <form className="pp-row" onSubmit={add}>
          <input className="pp-input" value={text} maxLength={2000} onChange={(e) => setText(e.target.value)} placeholder={tt('Write a comment…', 'اكتب تعليقًا…')} />
          <button className="pp-btn is-primary" disabled={busy || !text.trim()}><Icon name="send" size={14} /></button>
        </form>
      ) : <p className="pp-muted"><Icon name="lock" size={13} /> {post.comments_mode === 'none' ? tt('Comments are turned off.', 'التعليقات مغلقة.') : tt('You cannot comment on this post.', 'لا يمكنك التعليق على هذا المنشور.')}</p>}
      {err && <Alert tt={tt} onRetry={() => load(1)}>{err}</Alert>}
      {items === null && <div className="pp-skel" style={{ height: 60 }} />}
      {items && items.length === 0 && !err && <p className="pp-muted">{tt('No comments yet.', 'لا توجد تعليقات بعد.')}</p>}
      <ul className="pp-cm__list">
        {(items || []).map((c) => <Comment key={c.id} c={c} postId={post.id} canComment={post.can.comment}
          onChange={(n) => setItems((p) => p.map((x) => (x.id === n.id ? n : x)))}
          onDeleted={(d) => { setItems((p) => p.filter((x) => x.id !== d.id)); onCount?.(-(1 + (d.replies_count || 0))); }} />)}
      </ul>
      {more && <button type="button" className="pp-link" onClick={() => load(Math.ceil((items?.length || 0) / 10) + 1)}>{tt('Load more comments', 'تحميل المزيد')}</button>}
    </section>
  );
}
