import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Icon from '../Icon';
import { api, errorMessage } from '../../api/client';
import { avatarUrl, fmtTime, initials, peerLabel, previewLabel } from '../messaging/format';
import { useTt } from './shared';

const BASE = '/api/v1/messaging';
const TONES = 5;
const toneOf = (name) => { let h = 0; for (const ch of String(name || '')) h = (h * 31 + ch.charCodeAt(0)) % TONES; return h; };

function Av({ name, src, group, size = 44 }) {
  const [bad, setBad] = useState(false);
  const url = !bad ? avatarUrl(src) : null;
  return (
    <span className={`fc-av fc-tone-${toneOf(name)}${group ? ' is-group' : ''}`} style={{ width: size, height: size, fontSize: size * 0.36 }}>
      {url ? <img src={url} alt="" onError={() => setBad(true)} /> : (group ? <Icon name="users" size={size * 0.46} /> : initials(name))}
    </span>
  );
}

const convAvatar = (c) => (c.is_saved ? c.saved_avatar : c.is_group ? c.group_avatar : c.peer_deleted ? null : c.peer_avatar);
const bodyText = (m, tt) => {
  if (m.is_deleted) return tt('This message was deleted', 'تم حذف هذه الرسالة');
  if (m.body) return m.body;
  if (m.attachments?.length) return `📎 ${tt('Attachment', 'مرفق')}`;
  if (m.message_type && m.message_type !== 'text') return `[${m.message_type}]`;
  return '';
};

/**
 * Floating chat: a round button pinned to the corner that slides a messenger drawer in from the side.
 * Uses the same /api/v1/messaging endpoints as the full Messages page (inbox, thread, send, read).
 */
export default function FloatingChat() {
  const { tt, rtl } = useTt();
  const nav = useNavigate();
  const loc = useLocation();
  const portal = loc.pathname.split('/')[1] || 'student';

  const [open, setOpen] = useState(false);
  const [convs, setConvs] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listErr, setListErr] = useState('');
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');
  const [active, setActive] = useState(null); // conversation object from inbox
  const [msgs, setMsgs] = useState([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [sendErr, setSendErr] = useState('');
  const bodyRef = useRef(null);
  const stick = useRef(true);
  const activeId = active?.id;

  const unreadTotal = useMemo(() => convs.reduce((n, c) => n + (c.is_muted ? 0 : Number(c.unread_count || (c.is_unread ? 1 : 0))), 0), [convs]);

  const loadInbox = useCallback(async () => {
    try {
      const r = await api.get(`${BASE}/inbox`);
      setConvs(Array.isArray(r?.data) ? r.data : []); setListErr('');
    } catch (e) { setListErr(errorMessage(e)); } finally { setLoadingList(false); }
  }, []);

  // inbox: slow poll while closed (keeps the badge fresh), faster while open
  useEffect(() => {
    loadInbox();
    const id = setInterval(() => { if (!document.hidden) loadInbox(); }, open ? 6000 : 25000);
    return () => clearInterval(id);
  }, [open, loadInbox]);

  const loadThread = useCallback(async (id, initial) => {
    try {
      const r = await api.get(`${BASE}/conversations/${id}`);
      const list = r?.data?.messages || [];
      setMsgs((prev) => (JSON.stringify(prev.map((m) => [m.id, m.body, m.is_deleted])) === JSON.stringify(list.map((m) => [m.id, m.body, m.is_deleted])) ? prev : list));
      if (initial) { api.post(`${BASE}/conversations/${id}/read`).catch(() => {}); setConvs((p) => p.map((c) => (String(c.id) === String(id) ? { ...c, is_unread: false, unread_count: 0 } : c))); }
    } catch (e) { if (initial) setSendErr(errorMessage(e)); } finally { if (initial) setLoadingThread(false); }
  }, []);

  useEffect(() => {
    if (!open || !activeId) return undefined;
    setLoadingThread(true); setMsgs([]); setSendErr(''); stick.current = true;
    loadThread(activeId, true);
    const id = setInterval(() => { if (!document.hidden) loadThread(activeId, false); }, 3000);
    return () => clearInterval(id);
  }, [open, activeId, loadThread]);

  useEffect(() => { if (stick.current && bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight; }, [msgs, activeId]);
  const onScroll = () => { const el = bodyRef.current; if (el) stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80; };

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') { if (active) setActive(null); else setOpen(false); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, active]);

  const send = async (e) => {
    e?.preventDefault();
    const text = draft.trim();
    if (!text || sending || !activeId) return;
    setSending(true); setSendErr('');
    const tmp = { id: `tmp-${Date.now()}`, body: text, is_mine: true, created_at: new Date().toISOString(), _tmp: true };
    stick.current = true; setMsgs((p) => [...p, tmp]); setDraft('');
    try {
      const fd = new FormData(); fd.append('body', text);
      const r = await api.postForm(`${BASE}/conversations/${activeId}/messages`, fd);
      setMsgs((p) => p.map((m) => (m.id === tmp.id ? { ...r.data } : m)));
      loadInbox();
    } catch (x) { setMsgs((p) => p.filter((m) => m.id !== tmp.id)); setDraft(text); setSendErr(errorMessage(x)); } finally { setSending(false); }
  };

  const shown = useMemo(() => convs.filter((c) => {
    if (filter === 'unread' && !c.is_unread) return false;
    if (filter === 'group' && !c.is_group) return false;
    if (q.trim() && !peerLabel(c).toLowerCase().includes(q.trim().toLowerCase())) return false;
    return true;
  }), [convs, filter, q]);

  const FILTERS = [['all', tt('All', 'الكل')], ['unread', tt('Unread', 'غير مقروءة')], ['group', tt('Groups', 'مجموعات')]];
  const full = () => nav(`/${portal}/messages${active ? `/${active.id}` : ''}`);

  // group consecutive messages by sender for a cleaner look
  const rows = msgs.map((m, i) => {
    const prev = msgs[i - 1];
    const first = !prev || prev.is_mine !== m.is_mine || prev.sender_id !== m.sender_id;
    return { m, first };
  });

  return (
    <>
      <button type="button" className={`fc-fab${open ? ' is-open' : ''}`} onClick={() => setOpen((o) => !o)} aria-label={tt('Chats', 'المحادثات')} aria-expanded={open}>
        <span className="fc-fab__ico fc-fab__ico--chat"><Icon name="chat" size={26} /></span>
        <span className="fc-fab__ico fc-fab__ico--x"><Icon name="x" size={24} /></span>
        {unreadTotal > 0 && !open && <span className="fc-fab__badge">{unreadTotal > 99 ? '99+' : unreadTotal}</span>}
        {unreadTotal > 0 && !open && <span className="fc-fab__ring" aria-hidden="true" />}
      </button>

      <div className={`fc-scrim${open ? ' is-open' : ''}`} onClick={() => setOpen(false)} aria-hidden="true" />
      <aside className={`fc-drawer${open ? ' is-open' : ''}`} dir={rtl ? 'rtl' : 'ltr'} role="dialog" aria-label={tt('Chats', 'المحادثات')} aria-hidden={!open}>
        {!active ? (
          <>
            <header className="fc-head">
              <div className="fc-head__t"><h2>{tt('Messages', 'الرسائل')}</h2><small>{unreadTotal > 0 ? tt(`${unreadTotal} unread`, `${unreadTotal} غير مقروءة`) : tt('You are all caught up', 'لا رسائل جديدة')}</small></div>
              <button type="button" className="fc-ibtn" onClick={full} title={tt('Open full messenger', 'فتح صفحة الرسائل')}><Icon name="external-link" size={17} /></button>
              <button type="button" className="fc-ibtn" onClick={() => setOpen(false)} aria-label={tt('Close', 'إغلاق')}><Icon name="x" size={18} /></button>
            </header>
            <div className="fc-search"><Icon name="search" size={15} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder={tt('Search chats', 'ابحث في المحادثات')} /></div>
            <div className="fc-filters">{FILTERS.map(([k, l]) => <button key={k} type="button" className={filter === k ? 'is-on' : ''} onClick={() => setFilter(k)}>{l}</button>)}</div>
            <div className="fc-list">
              {loadingList && [0, 1, 2, 3, 4].map((i) => <div key={i} className="fc-skel" />)}
              {!loadingList && listErr && <p className="fc-empty">{listErr}<button type="button" onClick={loadInbox}>{tt('Retry', 'إعادة المحاولة')}</button></p>}
              {!loadingList && !listErr && shown.length === 0 && <p className="fc-empty"><Icon name="chat" size={30} />{tt('No conversations', 'لا توجد محادثات')}</p>}
              {shown.map((c) => {
                const n = Number(c.unread_count || (c.is_unread ? 1 : 0));
                return (
                  <button key={c.id} type="button" className={`fc-item${n ? ' is-unread' : ''}`} onClick={() => setActive(c)}>
                    <Av name={peerLabel(c)} src={convAvatar(c)} group={c.is_group} />
                    <span className="fc-item__main">
                      <span className="fc-item__top"><strong>{peerLabel(c)}</strong><time>{fmtTime(c.last_message_at || c.updated_at)}</time></span>
                      <span className="fc-item__bot"><span dir="auto">{previewLabel(c, rtl ? 'ar' : 'en')}</span>{n > 0 && <b>{n > 99 ? '99+' : n}</b>}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <header className="fc-head fc-head--thread">
              <button type="button" className="fc-ibtn fc-back" onClick={() => { setActive(null); loadInbox(); }} aria-label={tt('Back', 'رجوع')}><Icon name={rtl ? 'arrow-right' : 'arrow-left'} size={18} /></button>
              <Av name={peerLabel(active)} src={convAvatar(active)} group={active.is_group} size={38} />
              <div className="fc-head__t"><h2>{peerLabel(active)}</h2><small>{active.is_group ? tt('Group', 'مجموعة') : tt('Direct message', 'رسالة مباشرة')}</small></div>
              <button type="button" className="fc-ibtn" onClick={full} title={tt('Open full messenger', 'فتح صفحة الرسائل')}><Icon name="external-link" size={17} /></button>
              <button type="button" className="fc-ibtn" onClick={() => setOpen(false)} aria-label={tt('Close', 'إغلاق')}><Icon name="x" size={18} /></button>
            </header>
            <div className="fc-thread" ref={bodyRef} onScroll={onScroll}>
              {loadingThread && <div className="fc-spin" />}
              {!loadingThread && msgs.length === 0 && <p className="fc-empty"><Icon name="chat" size={30} />{tt('Say hello 👋', 'ابدأ المحادثة 👋')}</p>}
              {rows.map(({ m, first }) => (
                m.message_type === 'system'
                  ? <div key={m.id} className="fc-sys">{bodyText(m, tt)}</div>
                  : (
                    <div key={m.id} className={`fc-msg${m.is_mine ? ' is-mine' : ''}${first ? ' is-first' : ''}${m._tmp ? ' is-tmp' : ''}`}>
                      {!m.is_mine && active.is_group && first && <span className="fc-msg__who">{m.sender_name}</span>}
                      <p dir="auto">{bodyText(m, tt)}</p>
                      <time>{fmtTime(m.created_at)}</time>
                    </div>
                  )
              ))}
            </div>
            {sendErr && <div className="fc-err" role="alert">{sendErr}</div>}
            <form className="fc-compose" onSubmit={send}>
              <textarea rows={1} value={draft} dir="auto" placeholder={tt('Write a message…', 'اكتب رسالة…')} onChange={(e) => { setDraft(e.target.value); e.target.style.height = 'auto'; e.target.style.height = `${Math.min(e.target.scrollHeight, 110)}px`; }}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} />
              <button type="submit" className="fc-send" disabled={!draft.trim() || sending} aria-label={tt('Send', 'إرسال')}><Icon name="send" size={18} /></button>
            </form>
          </>
        )}
      </aside>
    </>
  );
}
