import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Icon from '../../components/Icon';
import { postsApi } from '../../api/postsApi';
import { errorMessage } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { usePageMeta } from '../../context/PageMetaContext';
import { Alert, Empty, useTt } from '../../components/posts/shared';
import UserAvatar, { useProfilePath } from '../../components/posts/UserAvatar';
import { PostStoriesBar, StoryHubProvider } from '../../components/posts/StoryHub';
import PostCard from '../../components/posts/PostCard';
import Composer from '../../components/posts/Composer';
import FloatingChat from '../../components/posts/FloatingChat';
import '../../styles/css/posts.css';
import '../../styles/css/posts-pro.css';
import '../../styles/css/posts-engage.css';
import { useDialogs } from '../../components/posts/Dialogs';
import { onRealtime } from '../../lib/realtime';

const TABS = [
  ['for_you', 'For you', 'لك', 'ai-spark'], ['following', 'Following', 'المتابَعون', 'users'], ['latest', 'Latest', 'الأحدث', 'clock'],
  ['trending', 'Trending', 'الرائج', 'trend'], ['university', 'University', 'الجامعة', 'building'], ['saved', 'Saved', 'المحفوظ', 'bookmark'], ['mine', 'My posts', 'منشوراتي', 'user'],
];
const MINE = [['', 'Published', 'المنشور'], ['draft', 'Drafts', 'المسودات'], ['scheduled', 'Scheduled', 'المجدولة'], ['pending', 'Pending', 'قيد المراجعة'], ['archived', 'Archived', 'المؤرشف']];

function Side({ tt, onTag, onFollow }) {
  const nav = useNavigate();
  const profilePath = useProfilePath();
  const [tags, setTags] = useState([]);
  const [people, setPeople] = useState([]);
  useEffect(() => { postsApi.trendingTags().then((r) => setTags(Array.isArray(r) ? r : r?.tags || [])).catch(() => {}); postsApi.suggestions(6).then((r) => setPeople(Array.isArray(r) ? r : [])).catch(() => {}); }, []);
  const follow = async (u) => { try { await postsApi.follow(u.id); setPeople((p) => p.filter((x) => x.id !== u.id)); onFollow?.(); } catch { /* ignore */ } };
  return (
    <aside className="pp-side">
      {tags.length > 0 && (
        <div className="pp-card"><h3>{tt('Trending tags', 'وسوم رائجة')}</h3>
          <div className="pp-tags">{tags.map((t) => { const name = t.tag || t; return <button key={name} type="button" className="pp-tag" onClick={() => onTag(name)}>#{name}{t.count ? <small> {t.count}</small> : null}</button>; })}</div></div>
      )}
      {people.length > 0 && (
        <div className="pp-card"><h3>{tt('People to follow', 'أشخاص قد تتابعهم')}</h3>
          <ul className="pp-people">{people.map((u) => (
            <li key={u.id}><UserAvatar user={u} size={36} /><div><button type="button" className="pp-namelink" onClick={() => nav(profilePath(u.id))}>{u.full_name}</button><small>{(u.role || '').replace(/_/g, ' ')}</small></div>
              <button type="button" className="pp-btn is-primary" onClick={() => follow(u)}>{tt('Follow', 'متابعة')}</button></li>))}</ul></div>
      )}
    </aside>
  );
}

function PostsFeedPage() {
  const { tt } = useTt();
  const { user } = useAuth();
  const dialogs = useDialogs();
  const [params, setParams] = useSearchParams();
  usePageMeta(tt('Posts', 'المنشورات'));
  const [config, setConfig] = useState(null);
  const [mode, setMode] = useState('for_you');
  const [status, setStatus] = useState('');
  const [tag, setTag] = useState(params.get('tag') || '');
  const [q, setQ] = useState('');
  const [qIn, setQIn] = useState('');
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [more, setMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState('');
  const [cols, setCols] = useState(null); // saved-items folders
  const [col, setCol] = useState(''); // '' all | 'none' | folder id
  const [colBusy, setColBusy] = useState(false);
  const sentinel = useRef(null);
  const reqId = useRef(0); // only the latest request may write: a slow answer from a previous tab can no longer overwrite the one you just opened
  const single = params.get('post');

  useEffect(() => { postsApi.config().then(setConfig).catch((e) => setErr(errorMessage(e))); }, []);

  const effMode = single ? 'single' : tag ? 'tag' : q ? 'search' : mode;
  const load = useCallback(async (p = 1, refresh = false) => {
    const rid = ++reqId.current;
    setLoading(true); setErr('');
    try {
      if (single) { const one = await postsApi.one(single); if (rid !== reqId.current) return; setItems([one]); setMore(false); return; }
      const r = await postsApi.feed({ mode: effMode, page: p, per_page: 10, ...(tag ? { tag } : {}), ...(q ? { q } : {}), ...(effMode === 'mine' && status ? { status } : {}), ...(effMode === 'saved' && col ? { collection: col } : {}), ...(refresh ? { refresh: 1 } : {}) });
      if (rid !== reqId.current) return; // a newer tab / filter was requested meanwhile
      setItems((prev) => (p === 1 ? r.items : [...prev, ...r.items.filter((n) => !prev.some((o) => o.id === n.id))]));
      setMore(!!r.meta.has_more); setPage(p);
    } catch (e) { if (rid === reqId.current) setErr(errorMessage(e)); } finally { if (rid === reqId.current) setLoading(false); }
  }, [effMode, tag, q, status, single, col]);
  // switching tab / filter: drop the previous tab's posts right away (no stale list under the new tab) and load page 1
  useEffect(() => { setItems([]); setMore(false); setPage(1); load(1); }, [load]);

  // Realtime: other people's new posts → a "N new posts" pill (no jumping feed); reconnect → quiet reload of page 1
  const [fresh, setFresh] = useState(0);
  const liveMode = !single && !tag && !q && (mode === 'for_you' || mode === 'latest');
  useEffect(() => setFresh(0), [mode, tag, q, single]);
  useEffect(() => onRealtime('posts', (d, topic) => {
    if (!liveMode) return;
    if (topic === 'resync') return;
    if (d.kind === 'new' && Number(d.actor) !== Number(user?.id)) setFresh((n) => n + 1);
  }), [liveMode, user?.id]);

  useEffect(() => {
    if (!sentinel.current || !more || loading) return undefined;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) load(page + 1); }, { rootMargin: '600px' });
    io.observe(sentinel.current);
    return () => io.disconnect();
  }, [more, loading, page, load]);

  const pickTag = (t) => { setParams({}); setTag(t); setQ(''); setQIn(''); window.scrollTo?.({ top: 0 }); };
  const reset = () => { setTag(''); setQ(''); setQIn(''); setParams({}); };
  const saved = (p, { draft, scheduled }) => {
    setEditing(null);
    if (draft || scheduled || p?.status !== 'published') { setToast(draft ? tt('Saved to drafts.', 'تم الحفظ في المسودات.') : scheduled ? tt('Scheduled.', 'تمت الجدولة.') : tt('Sent for approval.', 'أُرسل للموافقة.')); return; }
    setToast('');
    if (effMode === 'for_you' || effMode === 'latest' || effMode === 'following' || effMode === 'mine') setItems((prev) => [p, ...prev.filter((x) => x.id !== p.id)]);
  };
  const loadCols = useCallback(() => { postsApi.collections().then(setCols).catch(() => setCols({ items: [], uncategorized: 0, total: 0 })); }, []);
  useEffect(() => { if (effMode === 'saved') loadCols(); }, [effMode, loadCols]);
  const replace = (n) => {
    if (effMode === 'saved' && col && n.saved && String(n.saved_collection_id ?? 'none') !== String(col)) { setItems((prev) => prev.filter((x) => x.id !== n.id)); loadCols(); return; }
    setItems((prev) => prev.map((x) => (x.id === n.id ? n : x)));
    if (effMode === 'saved') loadCols();
  };
  const unsavedHere = (p) => { if (effMode === 'saved') { setItems((prev) => prev.filter((x) => x.id !== p.id)); loadCols(); } };
  const newFolder = async () => {
    const name = await dialogs.ask({ title: tt('New folder', 'مجلد جديد'), label: tt('Folder name', 'اسم المجلد'), confirmLabel: tt('Create', 'إنشاء') });
    if (!name) return;
    setColBusy(true);
    try { const c = await postsApi.createCollection(name); loadCols(); setCol(String(c.id)); } catch (e) { setErr(errorMessage(e)); } finally { setColBusy(false); }
  };
  const renameFolder = async (c) => {
    const name = await dialogs.ask({ title: tt('Rename folder', 'إعادة تسمية المجلد'), label: tt('Folder name', 'اسم المجلد'), initial: c.name, confirmLabel: tt('Save', 'حفظ') });
    if (!name || name === c.name) return;
    setColBusy(true);
    try { await postsApi.renameCollection(c.id, name.trim()); loadCols(); } catch (e) { setErr(errorMessage(e)); } finally { setColBusy(false); }
  };
  const deleteFolder = async (c) => {
    const ok = await dialogs.confirm({ title: tt('Delete folder?', 'حذف المجلد؟'), message: tt(`“${c.name}” will be deleted. The posts inside stay in your saved items.`, `سيتم حذف «${c.name}». المنشورات التي بداخله تبقى في المحفوظات.`), confirmLabel: tt('Delete', 'حذف') });
    if (!ok) return;
    setColBusy(true);
    try { await postsApi.deleteCollection(c.id); setCol(''); loadCols(); } catch (e) { setErr(errorMessage(e)); } finally { setColBusy(false); }
  };
  const drop = (p) => setItems((prev) => prev.filter((x) => x.id !== p.id));

  if (config && config.enabled === false) return <div className="pp-page"><Empty icon="lock" title={tt('Posts are turned off', 'المنشورات متوقفة حاليًا')} text={tt('The administrator has disabled posts.', 'قام المسؤول بتعطيل المنشورات.')} /></div>;

  return (
    <div className="pp-page">
      {!single && (
        <section className="pp-hero">
          <div className="pp-hero__txt">
            <span className="pp-hero__eyebrow"><Icon name="ai-spark" size={13} /> {tt('Community feed', 'مجتمع الجامعة')}</span>
            <h1>{tt(`Hi ${(user?.full_name || '').split(' ')[0] || 'there'}, what's new today?`, `أهلًا ${(user?.full_name || '').split(' ')[0] || ''}، إيه الجديد النهاردة؟`)}</h1>
            <p>{tt('Share ideas, files and code with your university and discover what others are building.', 'شارك أفكارك وملفاتك وأكوادك مع جامعتك واكتشف مشاريع زمايلك.')}</p>
            {(tag || q) && <button type="button" className="pp-hero__chip" onClick={reset}>{tag ? `#${tag}` : q} <Icon name="x" size={11} /></button>}
          </div>
          <form className="pp-hero__search" onSubmit={(e) => { e.preventDefault(); setTag(''); setQ(qIn.trim()); }}>
            <Icon name="search" size={16} />
            <input value={qIn} onChange={(e) => setQIn(e.target.value)} placeholder={tt('Search posts, people, #tags', 'ابحث في المنشورات والوسوم')} aria-label={tt('Search', 'بحث')} />
            <button type="submit">{tt('Search', 'بحث')}</button>
          </form>
        </section>
      )}
      <div className="pp-layout">
        <main className="pp-main">
          {!single && <PostStoriesBar />}
          {!single && config && !editing && <Composer config={config} me={{ full_name: user?.full_name }} onSaved={saved} />}
          {editing && <Composer config={config} post={editing} me={{ full_name: user?.full_name }} onSaved={(p) => { replace(p); setEditing(null); }} onCancel={() => setEditing(null)} />}
          {toast && <div className="pp-ok pp-toast">{toast}</div>}

          {single ? <button type="button" className="pp-btn" onClick={reset}><Icon name="arrow-left" size={14} /> {tt('Back to feed', 'العودة للموجز')}</button> : (
            <>
              <div className="pp-bar-wrap">
                <div className="pp-tabs" role="tablist">
                  {TABS.map(([k, en, ar, ic]) => <button key={k} type="button" role="tab" aria-selected={!tag && !q && mode === k} className={!tag && !q && mode === k ? 'is-on' : ''} onClick={() => { setMode(k); setCol(''); setTag(''); setQ(''); setQIn(''); }}><Icon name={ic} size={14} /> {tt(en, ar)}</button>)}
                </div>
              </div>
              {effMode === 'saved' && cols && (
                <div className="pp-folders" role="tablist" aria-label={tt('Saved folders', 'مجلدات المحفوظات')}>
                  <button type="button" className={!col ? 'is-on' : ''} onClick={() => setCol('')}><Icon name="bookmark" size={14} /> {tt('All', 'الكل')} <i>{cols.total}</i></button>
                  <button type="button" className={col === 'none' ? 'is-on' : ''} onClick={() => setCol('none')}>{tt('No folder', 'بدون مجلد')} <i>{cols.uncategorized}</i></button>
                  {cols.items.map((c) => <button key={c.id} type="button" className={col === String(c.id) ? 'is-on' : ''} onClick={() => setCol(String(c.id))}><Icon name="folder" size={14} /> {c.name} <i>{c.count}</i></button>)}
                  <button type="button" className="pp-folders__new" onClick={newFolder} disabled={colBusy}><Icon name="plus" size={14} /> {tt('New folder', 'مجلد جديد')}</button>
                  {col && col !== 'none' && (() => { const c = cols.items.find((x) => String(x.id) === col); return c ? <span className="pp-folders__tools"><button type="button" className="pp-icon" title={tt('Rename', 'إعادة تسمية')} onClick={() => renameFolder(c)}><Icon name="edit" size={15} /></button><button type="button" className="pp-icon" title={tt('Delete folder', 'حذف المجلد')} onClick={() => deleteFolder(c)}><Icon name="trash" size={15} /></button></span> : null; })()}
                </div>
              )}
              {effMode === 'mine' && <div className="pp-seg">{MINE.map(([k, en, ar]) => <button key={k} type="button" className={status === k ? 'is-on' : ''} onClick={() => setStatus(k)}>{tt(en, ar)}</button>)}</div>}
            </>
          )}

          {err && <Alert tt={tt} onRetry={() => load(1)}>{err}</Alert>}
          {fresh > 0 && (
            <button type="button" className="pp-newpill" onClick={() => { setFresh(0); window.scrollTo?.({ top: 0, behavior: 'smooth' }); load(1, true); }}>
              <Icon name="refresh" size={14} /> {tt(`${fresh} new post${fresh > 1 ? 's' : ''}`, `${fresh} ${fresh > 2 && fresh < 11 ? 'منشورات جديدة' : 'منشور جديد'}`)}
            </button>
          )}
          <div className="pp-stack">
            {items.map((p) => <PostCard key={p.id} post={p} onChange={replace} onRemoved={drop} onTag={pickTag} onEdit={setEditing} onSavedRemoved={unsavedHere} />)}
          </div>
          {loading && <div className="pp-skel" style={{ height: 220 }} />}
          {!loading && !err && items.length === 0 && <Empty icon="inbox" title={tt('Nothing here yet', 'لا يوجد شيء هنا بعد')} text={effMode === 'saved' ? tt('Posts you save appear here.', 'المنشورات التي تحفظها تظهر هنا.') : effMode === 'following' ? tt('Posts from people you follow appear here. Follow someone from “People to follow” to fill this tab.', 'منشورات من تتابعهم تظهر هنا. تابع أشخاصًا من «أشخاص قد تتابعهم» ليمتلئ هذا التبويب.') : effMode === 'mine' ? tt('You have not posted anything here yet.', 'لم تنشر شيئًا هنا بعد.') : effMode === 'university' ? tt('No posts from your university yet.', 'لا توجد منشورات من جامعتك بعد.') : effMode === 'trending' ? tt('Nothing is trending yet.', 'لا يوجد شيء رائج الآن.') : tt('Be the first to post.', 'كن أول من ينشر.')} />}
          <div ref={sentinel} style={{ height: 1 }} />
          {!loading && !more && items.length > 5 && <p className="pp-muted pp-end">{tt("You're all caught up.", 'أنت على اطلاع بكل شيء.')}
            {effMode === 'for_you' && <> <button type="button" className="pp-link" onClick={() => load(1, true)}>{tt('Refresh recommendations', 'تحديث التوصيات')}</button></>}</p>}
        </main>
        {!single && <Side tt={tt} onTag={pickTag} />}
      </div>
      <FloatingChat />
      {dialogs.dialogs}
    </div>
  );
}

/** The posts page: the stories provider wraps it so the top bar and every avatar share ONE story feed + viewer. */
export default function PostsFeed() {
  return <StoryHubProvider><PostsFeedPage /></StoryHubProvider>;
}
