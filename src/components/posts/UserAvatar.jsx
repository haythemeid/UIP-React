import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import Icon from '../Icon';
import { useAuth } from '../../context/AuthContext';
import { portalPrefix } from '../../config/navConfig';
import { avatarSrc } from '../insight/AvatarUploader';
import { PAvatar, useTt } from './shared';
import { useStoryHub } from './StoryHub';
import '../../styles/css/posts-profile.css';

/** Where a person's profile page lives for the signed-in portal: /student/posts/u/12, /faculty/posts/u/12, … */
export function useProfilePath() {
  const { user } = useAuth();
  const prefix = portalPrefix(user?.role);
  return (id) => `/${prefix}/posts/u/${id}`;
}

/** Full-size profile photo (lightbox) with a shortcut to the profile. */
export function PhotoViewer({ user, onClose, onProfile }) {
  const { tt } = useTt();
  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', k); document.body.style.overflow = prev; };
  }, [onClose]);
  const url = avatarSrc(user?.avatar_path);
  return createPortal(
    <div className="pf-photo" role="dialog" aria-modal="true" aria-label={user?.full_name} onClick={onClose}>
      <button type="button" className="pf-photo__x" onClick={onClose} aria-label={tt('Close', 'إغلاق')}><Icon name="x" size={22} /></button>
      <figure onClick={(e) => e.stopPropagation()}>
        {url ? <img src={url} alt={user?.full_name || ''} /> : <span className="pf-photo__none">{tt('No photo', 'لا توجد صورة')}</span>}
        <figcaption>
          <strong>{user?.full_name}</strong>
          {onProfile && <button type="button" className="pp-btn is-primary" onClick={onProfile}><Icon name="user" size={14} /> {tt('View profile', 'عرض البروفايل')}</button>}
        </figcaption>
      </figure>
    </div>,
    document.body,
  );
}

/** "What do you want to open?" sheet — shown when the person has an active story. */
function ChoiceSheet({ user, group, onClose, onStory, onPhoto, onProfile, onAdd }) {
  const { tt } = useTt();
  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  const mine = !!group.is_mine;
  const count = group.stories?.length || 0;
  return createPortal(
    <div className="pf-sheet-scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="pf-sheet" role="dialog" aria-modal="true" aria-label={user.full_name}>
        <header className="pf-sheet__head">
          <span className={`pf-av has-story ${group.has_unseen ? 'is-new' : 'is-seen'}`} style={{ width: 52, height: 52 }}><PAvatar user={user} size={46} /></span>
          <div><strong>{user.full_name}</strong><small>{tt(`${count} active ${count === 1 ? 'story' : 'stories'}`, `${count} استوري نشطة`)}</small></div>
        </header>
        <button type="button" className="pf-sheet__row" onClick={onStory} autoFocus>
          <span className="pf-sheet__ico is-story"><Icon name="play" size={18} /></span>
          <span><strong>{mine ? tt('View my story', 'عرض الاستوري بتاعتي') : tt('View story', 'عرض الاستوري')}</strong>
            <small>{mine ? tt('See who viewed it', 'شوف مين شافها') : group.has_unseen ? tt('New — you haven’t seen it yet', 'جديدة — لسه ما شفتهاش') : tt('You’ve already seen it', 'شفتها قبل كده')}</small></span>
          {group.has_unseen && !mine && <i className="pf-sheet__dot" />}
        </button>
        <button type="button" className="pf-sheet__row" onClick={onPhoto} disabled={!user.avatar_path}>
          <span className="pf-sheet__ico"><Icon name="image" size={18} /></span>
          <span><strong>{mine ? tt('View my profile photo', 'عرض صورتي الشخصية') : tt('View profile photo', 'عرض الصورة الشخصية')}</strong>
            <small>{user.avatar_path ? tt('Open the photo full size', 'افتح الصورة بالحجم الكامل') : tt('No photo to show', 'لا توجد صورة')}</small></span>
        </button>
        <button type="button" className="pf-sheet__row" onClick={onProfile}>
          <span className="pf-sheet__ico"><Icon name="user" size={18} /></span>
          <span><strong>{tt('Go to profile', 'الذهاب إلى البروفايل')}</strong><small>{tt('Posts, friends and photos', 'المنشورات والأصدقاء والصور')}</small></span>
        </button>
        {mine && (
          <button type="button" className="pf-sheet__row" onClick={onAdd}>
            <span className="pf-sheet__ico"><Icon name="plus" size={18} /></span>
            <span><strong>{tt('Add to my story', 'إضافة استوري جديدة')}</strong></span>
          </button>
        )}
        <button type="button" className="pp-btn pf-sheet__cancel" onClick={onClose}>{tt('Cancel', 'إلغاء')}</button>
      </div>
    </div>,
    document.body,
  );
}

/**
 * A person's round photo that behaves like Facebook / WhatsApp:
 *   • has an active story  → coloured ring; tap asks "story, photo or profile?"
 *   • no story             → tap opens the photo full size (with "View profile")
 *   • no photo             → tap goes straight to the profile
 * Works without the stories provider too (then it is just photo / profile). `user` needs { id, full_name, avatar_path }.
 */
export default function UserAvatar({ user, size = 40, className = '', title }) {
  const nav = useNavigate();
  const profilePath = useProfilePath();
  const hub = useStoryHub();
  const [sheet, setSheet] = useState(false);
  const [photo, setPhoto] = useState(false);
  const clickable = user?.id != null;
  const group = clickable && hub ? hub.groupFor(user.id) : null;
  const profile = () => { setSheet(false); setPhoto(false); nav(profilePath(user.id)); };

  if (!clickable) return <PAvatar user={user} size={size} />;

  const onClick = (e) => {
    e.stopPropagation();
    if (group) setSheet(true);
    else if (user.avatar_path) setPhoto(true);
    else profile();
  };
  const ring = group ? (group.has_unseen ? 'is-new' : 'is-seen') : '';
  return (
    <>
      <button type="button" className={`pf-av${group ? ` has-story ${ring}` : ''} ${className}`} style={{ width: size + (group ? 8 : 0), height: size + (group ? 8 : 0) }}
        onClick={onClick} title={title || user.full_name} aria-label={user.full_name}>
        <PAvatar user={user} size={size} />
      </button>
      {sheet && group && (
        <ChoiceSheet user={user} group={group} onClose={() => setSheet(false)}
          onStory={() => { setSheet(false); hub.open(group, false); }}
          onPhoto={() => { setSheet(false); setPhoto(true); }}
          onProfile={profile}
          onAdd={() => { setSheet(false); hub.addStory(); }} />
      )}
      {photo && <PhotoViewer user={user} onClose={() => setPhoto(false)} onProfile={profile} />}
    </>
  );
}
