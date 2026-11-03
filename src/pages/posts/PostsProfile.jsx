import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Icon from '../../components/Icon';
import { postsApi } from '../../api/postsApi';
import { networkApi } from '../../api/networkApi';
import { errorMessage } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { usePageMeta } from '../../context/PageMetaContext';
import { portalPrefix } from '../../config/navConfig';
import { parseServerDate } from '../../utils/serverDate';
import { useChatSettings } from '../../lib/chatSettings';
import { useMediaUrl } from '../../lib/postMedia';
import { Alert, Empty, RichText, useTt } from '../../components/posts/shared';
import PostCard from '../../components/posts/PostCard';
import Composer from '../../components/posts/Composer';
import { Lightbox } from '../../components/posts/PostMedia';
import { Dialog } from '../../components/posts/Dialogs';
import UserAvatar from '../../components/posts/UserAvatar';
import { StoryHubProvider, useStoryHub } from '../../components/posts/StoryHub';
import { usePhotoFlow } from '../../components/posts/ProfilePhotoFlow';
import PersonActions from '../../components/network/PersonActions';
import { roleText } from '../../components/network/PersonCard';
import '../../styles/css/posts.css';
import '../../styles/css/posts-pro.css';
import '../../styles/css/posts-engage.css';
import '../../styles/css/network.css';
import '../../styles/css/posts-profile.css';

const TABS = [['posts', 'Posts', 'المنشورات', 'note'], ['about', 'About', 'نبذة', 'info'], ['friends', 'Friends', 'الأصدقاء', 'users'], ['photos', 'Photos', 'الصور', 'image']];
const coverUrl = (p) => (p ? `/${String(p).replace(/^\//, '')}` : null);

function BioDialog({ initial, max, onClose, onSaved }) {
  const { tt } = useTt();
  const [text, setText] = useState(initial || '');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const { patch } = useChatSettings();
  const save = async () => {
    setBusy(true); setErr('');
    try { await patch({ bio: text.trim() }); onSaved(text.trim()); } catch (e) { setErr(errorMessage(e)); setBusy(false); }
  };
  return (
    <Dialog title={tt('Edit bio', 'تعديل البايو')} icon="edit" busy={busy} onClose={onClose}
      footer={<><button type="button" className="pp-btn" disabled={busy} onClick={onClose}>{tt('Cancel', 'إلغاء')}</button><button type="button" className="pp-btn is-primary" disabled={busy} onClick={save}>{tt('Save', 'حفظ')}</button></>}>
      <textarea className="pp-input" rows={4} maxLength={max} value={text} autoFocus onChange={(e) => setText(e.target.value)} placeholder={tt('Describe yourself in a few words…', 'عرّف بنفسك في كلمتين…')} />
      <small className="pp-muted">{text.length}/{max}</small>
      {err && <p className="pp-err" role="alert">{err}</p>}
    </Dialog>
  );
}

function PhotoTile({ item, onOpen }) {
  const { m, p } = item;
  const thumb = useMediaUrl(m, m.has_thumbnail ? 'thumbnail' : 'file');
  return (
    <button type="button" className="pf-photo-tile" onClick={onOpen} title={p.body || m.original_name}>
      {thumb.url ? <img src={thumb.url} alt={m.alt_text || m.original_name} loading="lazy" /> : <span className="pp-skel" />}
      {p.subtype && <span className="pf-photo-tile__tag"><Icon name={p.subtype === 'cover_photo' ? 'image' : 'user'} size={11} /></span>}
    </button>
  );
}

function FriendsTab({ userId, tt, isMe }) {
  const [q, setQ] = useState('');
  const [qIn, setQIn] = useState('');
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [more, setMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const reqId = useRef(0);
  const load = useCallback(async (p = 1) => {
    const rid = ++reqId.current;
    setLoading(true); setErr('');
    try {
      const r = await networkApi.friendsOf(userId, q, p);
      if (rid !== reqId.current) return;
      setItems((prev) => (p === 1 ? r.items : [...prev, ...r.items.filter((n) => !prev.some((o) => o.id === n.id))]));
      setMore(!!r.meta.has_more); setPage(p);
    } catch (e) { if (rid === reqId.current) setErr(errorMessage(e)); } finally { if (rid === reqId.current) setLoading(false); }
  }, [userId, q]);
  useEffect(() => { setItems([]); load(1); }, [load]);
  const patch = (id, r) => setItems((prev) => prev.map((x) => (x.id === id ? { ...x, ...r } : x)));
  const nav = useNavigate();
  const { user } = useAuth();
  const open = (p) => nav(`/${portalPrefix(user?.role)}/posts/u/${p.id}`);
  return (
    <section className="pf-card">
      <header className="pf-card__head">
        <h2>{tt('Friends', 'الأصدقاء')}</h2>
        <form className="pf-search" onSubmit={(e) => { e.preventDefault(); setQ(qIn.trim()); }}>
          <Icon name="search" size={14} />
          <input value={qIn} onChange={(e) => setQIn(e.target.value)} placeholder={tt('Search friends', 'ابحث في الأصدقاء')} aria-label={tt('Search friends', 'ابحث في الأصدقاء')} />
        </form>
      </header>
      {err && <Alert tt={tt} onRetry={() => load(1)}>{err}</Alert>}
      <ul className="pf-friends">
        {items.map((f) => (
          <li key={f.id} className="pf-friend">
            <UserAvatar user={f} size={60} />
            <div className="pf-friend__main">
              <button type="button" className="pf-friend__name" onClick={() => open(f)}>{f.full_name}</button>
              <small>{roleText(f.role, tt)}{f.mutual_connections > 0 ? ` · ${tt(`${f.mutual_connections} mutual`, `${f.mutual_connections} مشترك`)}` : ''}</small>
            </div>
            {!f.is_me && <PersonActions p={f} compact onPatch={patch} onRemove={(id) => { if (isMe) setItems((prev) => prev.filter((x) => x.id !== id)); }} onOpenProfile={open} />}
          </li>
        ))}
      </ul>
      {loading && <div className="pp-skel" style={{ height: 90 }} />}
      {!loading && !err && items.length === 0 && <Empty icon="users" title={tt('No friends to show', 'لا يوجد أصدقاء لعرضهم')} text={q ? tt('Try another name.', 'جرّب اسمًا آخر.') : undefined} />}
      {more && !loading && <button type="button" className="pp-btn pf-more" onClick={() => load(page + 1)}>{tt('Show more', 'عرض المزيد')}</button>}
    </section>
  );
}

function About({ data, tt, locale, onEditBio }) {
  const org = locale === 'ar' ? (data.org_ar || data.org_en) : (data.org_en || data.org_ar);
  const fac = locale === 'ar' ? (data.faculty_ar || data.faculty_en) : (data.faculty_en || data.faculty_ar);
  const joined = data.joined_at ? parseServerDate(data.joined_at).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'long' }) : '';
  const row = (icon, label, value) => (value ? <li><span className="pf-about__ico"><Icon name={icon} size={16} /></span><div><small>{label}</small><strong dir="auto">{value}</strong></div></li> : null);
  return (
    <section className="pf-card">
      <header className="pf-card__head"><h2>{tt('About', 'نبذة')}</h2>{data.is_me && <button type="button" className="pp-btn" onClick={onEditBio}><Icon name="edit" size={14} /> {tt('Edit bio', 'تعديل البايو')}</button>}</header>
      {data.bio ? <p className="pf-bio" dir="auto">{data.bio}</p> : <p className="pp-muted">{data.is_me ? tt('Add a short bio so people know who you are.', 'أضف بايو قصير ليعرفك الناس.') : tt('No bio to show.', 'لا يوجد بايو لعرضه.')}</p>}
      <ul className="pf-about">
        {row('briefcase', tt('Role', 'الدور'), roleText(data.role, tt))}
        {row('building', tt('University', 'الجامعة'), org)}
        {row('graduation-cap', tt('Faculty', 'الكلية'), fac)}
        {row('calendar', tt('Joined', 'انضم في'), joined)}
        {row('users', tt('Connections', 'الاتصالات'), data.connections_count != null ? String(data.connections_count) : '')}
      </ul>
    </section>
  );
}

function ProfileInner({ userId }) {
  const { tt, locale } = useTt();
  const { user } = useAuth();
  const nav = useNavigate();
  const hub = useStoryHub();
  const prefix = portalPrefix(user?.role);
  const [params, setParams] = useSearchParams();
  const tab = TABS.some((t) => t[0] === params.get('tab')) ? params.get('tab') : 'posts';
  const { settings } = useChatSettings();

  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [notice, setNotice] = useState('');
  const [config, setConfig] = useState(null);
  const [menu, setMenu] = useState(null); // 'avatar' | 'cover'
  const [bioOpen, setBioOpen] = useState(false);
  const [lb, setLb] = useState(null);

  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [more, setMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [perr, setPerr] = useState('');
  const reqId = useRef(0);
  const sentinel = useRef(null);

  usePageMeta(data?.full_name || tt('Profile', 'البروفايل'));

  useEffect(() => {
    let alive = true;
    setData(null); setErr(''); setItems([]); setMore(false); setPage(1); setLb(null); setNotice('');
    networkApi.person(userId).then((r) => { if (alive) setData(r); }).catch((e) => { if (alive) setErr(errorMessage(e)); });
    return () => { alive = false; };
  }, [userId]);
  useEffect(() => { postsApi.config().then(setConfig).catch(() => {}); }, []);

  const load = useCallback(async (p = 1) => {
    const rid = ++reqId.current;
    setLoading(true); setPerr('');
    try {
      const r = await postsApi.feed({ mode: 'user', user_id: userId, page: p, per_page: 10 });
      if (rid !== reqId.current) return;
      setItems((prev) => (p === 1 ? r.items : [...prev, ...r.items.filter((n) => !prev.some((o) => o.id === n.id))]));
      setMore(!!r.meta.has_more); setPage(p);
    } catch (e) { if (rid === reqId.current) setPerr(errorMessage(e)); } finally { if (rid === reqId.current) setLoading(false); }
  }, [userId]);
  useEffect(() => { load(1); }, [load]);

  useEffect(() => {
    if (!sentinel.current || !more || loading || tab !== 'posts') return undefined;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) load(page + 1); }, { rootMargin: '600px' });
    io.observe(sentinel.current);
    return () => io.disconnect();
  }, [more, loading, page, load, tab]);

  const flow = usePhotoFlow({
    onError: setNotice,
    onChanged: ({ kind, path, post, removed, warn }) => {
      setData((d) => d && (kind === 'profile' ? { ...d, avatar_path: path } : { ...d, cover_path: path }));
      if (post?.id && post.status === 'published') { setItems((prev) => [post, ...prev.filter((x) => x.id !== post.id)]); setData((d) => d && { ...d, posts_count: (d.posts_count || 0) + 1 }); }
      setNotice(warn || (removed ? tt('Removed.', 'تم الحذف.') : kind === 'profile' ? tt('Profile picture updated.', 'تم تحديث الصورة الشخصية.') : tt('Cover photo updated.', 'تم تحديث صورة الغلاف.')));
    },
  });

  const isMe = !!data?.is_me;
  const setTab = (k) => setParams(k === 'posts' ? {} : { tab: k }, { replace: true });
  const photos = useMemo(() => items.flatMap((p) => (p.media || []).filter((m) => m.kind === 'image' && m.urls?.file).map((m) => ({ m, p }))), [items]);
  const pickTag = (t) => nav(`/${prefix}/posts?tag=${encodeURIComponent(t)}`);
  const replace = (n) => setItems((prev) => prev.map((x) => (x.id === n.id ? n : x)));
  const drop = (p) => { setItems((prev) => prev.filter((x) => x.id !== p.id)); setData((d) => d && { ...d, posts_count: Math.max(0, (d.posts_count || 1) - 1) }); };
  const saved = (p, { draft, scheduled } = {}) => {
    if (draft || scheduled || p?.status !== 'published') { setNotice(draft ? tt('Saved to drafts.', 'تم الحفظ في المسودات.') : scheduled ? tt('Scheduled.', 'تمت الجدولة.') : tt('Sent for approval.', 'أُرسل للموافقة.')); return; }
    setItems((prev) => [p, ...prev.filter((x) => x.id !== p.id)]);
    setData((d) => d && { ...d, posts_count: (d.posts_count || 0) + 1 });
  };
  const patchRel = (id, r) => setData((d) => d && { ...d, ...r });

  if (err) {
    return (
      <div className="pp-page pf-page"><Link to={`/${prefix}/posts`} className="pp-btn"><Icon name="arrow-left" size={14} /> {tt('Back to feed', 'العودة للموجز')}</Link>
        <Empty icon="user-x" title={tt('Profile not available', 'البروفايل غير متاح')} text={err} /></div>
    );
  }
  if (!data) return <div className="pp-page pf-page"><div className="pp-skel" style={{ height: 260, borderRadius: 18 }} /><div className="pp-skel" style={{ height: 120, marginTop: 14 }} /></div>;

  const org = locale === 'ar' ? (data.org_ar || data.org_en) : (data.org_en || data.org_ar);
  const cover = coverUrl(data.cover_path);
  const storyGroup = hub?.groupFor(data.id);
  const stat = (n, en, ar, k) => <button type="button" className="pf-stat" onClick={() => k && setTab(k)}><strong>{n ?? '–'}</strong><span>{tt(en, ar)}</span></button>;
  const relation = data.connection === 'connected' ? tt('Friends', 'أصدقاء') : data.connection === 'pending_sent' ? tt('Request sent', 'تم إرسال الطلب') : data.connection === 'pending_received' ? tt('Wants to connect', 'يرغب في الاتصال') : '';

  return (
    <div className="pp-page pf-page" onClick={() => menu && setMenu(null)}>
      <Link to={`/${prefix}/posts`} className="pf-back"><Icon name="arrow-left" size={14} /> {tt('Back to feed', 'العودة للموجز')}</Link>

      <header className="pf-head">
        <div className={`pf-cover${cover ? ' has-img' : ''}`} style={cover ? { backgroundImage: `url("${cover}")` } : undefined}>
          {isMe && (
            <div className="pf-cover__edit" onClick={(e) => e.stopPropagation()}>
              <button type="button" className="pp-btn" onClick={() => setMenu(menu === 'cover' ? null : 'cover')} aria-expanded={menu === 'cover'}><Icon name="image" size={14} /> {cover ? tt('Edit cover', 'تعديل الغلاف') : tt('Add cover photo', 'إضافة غلاف')}</button>
              {menu === 'cover' && (
                <div className="pf-pop">
                  <button type="button" onClick={() => { setMenu(null); flow.choose('cover'); }}><Icon name="upload" size={14} /> {tt('Upload a photo', 'رفع صورة')}</button>
                  {cover && <button type="button" className="is-danger" onClick={() => { setMenu(null); flow.remove('cover'); }}><Icon name="trash" size={14} /> {tt('Remove cover', 'إزالة الغلاف')}</button>}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="pf-id">
          <div className="pf-id__av" onClick={(e) => e.stopPropagation()}>
            <UserAvatar user={data} size={128} />
            {isMe && (
              <>
                <button type="button" className="pf-id__cam" aria-label={tt('Change profile picture', 'تغيير الصورة الشخصية')} onClick={() => setMenu(menu === 'avatar' ? null : 'avatar')}><Icon name="image" size={15} /></button>
                {menu === 'avatar' && (
                  <div className="pf-pop is-avatar">
                    <button type="button" onClick={() => { setMenu(null); flow.choose('profile'); }}><Icon name="upload" size={14} /> {tt('Update profile picture', 'تحديث الصورة الشخصية')}</button>
                    <button type="button" onClick={() => { setMenu(null); hub?.addStory(); }}><Icon name="plus" size={14} /> {tt('Add to my story', 'إضافة استوري')}</button>
                    {data.avatar_path && <button type="button" className="is-danger" onClick={() => { setMenu(null); flow.remove('profile'); }}><Icon name="trash" size={14} /> {tt('Remove photo', 'إزالة الصورة')}</button>}
                  </div>
                )}
              </>
            )}
          </div>
          <div className="pf-id__txt">
            <h1 dir="auto">{data.full_name}</h1>
            <p className="pf-id__meta">{[roleText(data.role, tt), org].filter(Boolean).join(' · ')}</p>
            <div className="pf-id__chips">
              {storyGroup && <button type="button" className={`pp-chip${storyGroup.has_unseen ? ' is-on' : ''}`} onClick={() => hub.open(storyGroup, false)}><Icon name="play" size={11} /> {tt('Story', 'استوري')}</button>}
              {relation && <span className="pp-chip is-on">{relation}</span>}
              {data.follows_me && <span className="pp-chip">{tt('Follows you', 'يتابعك')}</span>}
              {data.mutual_connections > 0 && <span className="pp-chip"><Icon name="users" size={12} /> {tt(`${data.mutual_connections} mutual`, `${data.mutual_connections} مشترك`)}</span>}
            </div>
            {data.bio && <p className="pf-bio" dir="auto"><RichText text={data.bio} /></p>}
          </div>
          <div className="pf-id__actions">
            {isMe ? (
              <>
                <button type="button" className="pp-btn is-primary" onClick={() => flow.choose('profile')}><Icon name="image" size={14} /> {tt('Change photo', 'تغيير الصورة')}</button>
                <button type="button" className="pp-btn" onClick={() => setBioOpen(true)}><Icon name="edit" size={14} /> {data.bio ? tt('Edit bio', 'تعديل البايو') : tt('Add bio', 'إضافة بايو')}</button>
              </>
            ) : <PersonActions p={data} onPatch={patchRel} onRemove={() => {}} />}
          </div>
        </div>

        <div className="pf-stats">
          {stat(data.posts_count, 'Posts', 'منشورات', 'posts')}
          {stat(data.followers_count, 'Followers', 'متابِعون')}
          {stat(data.following_count, 'Following', 'متابَعون')}
          {stat(data.connections_count, 'Friends', 'أصدقاء', 'friends')}
        </div>
        <nav className="pf-tabs" role="tablist">
          {TABS.map(([k, en, ar, ic]) => <button key={k} type="button" role="tab" aria-selected={tab === k} className={tab === k ? 'is-on' : ''} onClick={() => setTab(k)}><Icon name={ic} size={14} /> {tt(en, ar)}</button>)}
        </nav>
      </header>

      {notice && <div className="pp-ok pp-toast" role="status" onClick={() => setNotice('')}>{notice}</div>}

      <div className="pf-body">
        {tab === 'posts' && (
          <div className="pf-posts">
            {isMe && config && <Composer config={config} me={{ full_name: user?.full_name }} onSaved={saved} />}
            {perr && <Alert tt={tt} onRetry={() => load(1)}>{perr}</Alert>}
            <div className="pp-stack">
              {items.map((p) => <PostCard key={p.id} post={p} onChange={replace} onRemoved={drop} onTag={pickTag} />)}
            </div>
            {loading && <div className="pp-skel" style={{ height: 200 }} />}
            {!loading && !perr && items.length === 0 && <Empty icon="inbox" title={tt('No posts yet', 'لا توجد منشورات بعد')} text={isMe ? tt('Share something with your university.', 'شارك شيئًا مع جامعتك.') : tt('Posts you are allowed to see appear here.', 'تظهر هنا المنشورات المسموح لك برؤيتها.')} />}
            <div ref={sentinel} style={{ height: 1 }} />
          </div>
        )}
        {tab === 'about' && <About data={data} tt={tt} locale={locale} onEditBio={() => setBioOpen(true)} />}
        {tab === 'friends' && <FriendsTab userId={userId} tt={tt} isMe={isMe} />}
        {tab === 'photos' && (
          <section className="pf-card">
            <header className="pf-card__head"><h2>{tt('Photos', 'الصور')}</h2></header>
            {photos.length > 0 && <div className="pf-photos">{photos.map((it, i) => <PhotoTile key={`${it.p.id}-${it.m.id}`} item={it} onOpen={() => setLb(i)} />)}</div>}
            {loading && <div className="pp-skel" style={{ height: 120 }} />}
            {!loading && photos.length === 0 && <Empty icon="image" title={tt('No photos yet', 'لا توجد صور بعد')} />}
            {more && !loading && <button type="button" className="pp-btn pf-more" onClick={() => load(page + 1)}>{tt('Show more', 'عرض المزيد')}</button>}
          </section>
        )}
      </div>

      {lb != null && <Lightbox items={photos.map((x) => x.m)} start={lb} onClose={() => setLb(null)} />}
      {bioOpen && <BioDialog initial={data.bio || ''} max={settings?.bio_max || 190} onClose={() => setBioOpen(false)} onSaved={(b) => { setBioOpen(false); setData((d) => ({ ...d, bio: b || null })); }} />}
      {flow.node}
    </div>
  );
}

/** A person's profile page: /{portal}/posts/u/:id — cover, photo (with story ring), bio, friends, photos and their posts. */
export default function PostsProfile() {
  const { id } = useParams();
  const userId = Number(id);
  return (
    <StoryHubProvider>
      <ProfileInner key={userId} userId={userId} />
    </StoryHubProvider>
  );
}
