import { useCallback, useEffect, useRef, useState } from 'react';
import EmojiPicker from '../messaging/EmojiPicker';
import { useTt } from './shared';
import '../../styles/css/chat-picker.css';

/** Inserts `emoji` at the caret of `el` (a textarea/input) and returns the new value, or null when it would pass `max`. */
export function insertAtCaret(el, value, emoji, max) {
  const a = el ? el.selectionStart ?? value.length : value.length;
  const b = el ? el.selectionEnd ?? value.length : value.length;
  const next = value.slice(0, a) + emoji + value.slice(b);
  if (max && next.length > max) return null;
  if (el) requestAnimationFrame(() => { el.focus(); const p = a + emoji.length; try { el.setSelectionRange(p, p); } catch { /* ignore */ } });
  return next;
}

const SmileIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9" /><path d="M8.5 14.5a4.2 4.2 0 0 0 7 0" /><path d="M9 9.5h.01M15 9.5h.01" />
  </svg>
);

/**
 * Emoji button + popover for the posts area (composer, comments, replies, bio) — same EmojiPicker the chat uses.
 * `onPick(emoji)` decides where it goes (usually insertAtCaret on the field's ref).
 */
export default function EmojiButton({ onPick, className = 'pp-icon', size = 18, up = false, disabled = false }) {
  const { tt, locale } = useTt();
  const [open, setOpen] = useState(false);
  const box = useRef(null);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return undefined;
    const down = (e) => { if (box.current && !box.current.contains(e.target)) close(); };
    const key = (e) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
    document.addEventListener('pointerdown', down, true);
    document.addEventListener('keydown', key, true);
    return () => { document.removeEventListener('pointerdown', down, true); document.removeEventListener('keydown', key, true); };
  }, [open, close]);

  return (
    <span className="pp-emo" ref={box}>
      <button type="button" className={`${className}${open ? ' is-on' : ''}`} disabled={disabled} aria-expanded={open} aria-haspopup="dialog"
        title={tt('Emoji', 'إيموجي')} aria-label={tt('Emoji', 'إيموجي')} onClick={() => setOpen((o) => !o)}>
        <SmileIcon size={size} />
      </button>
      {open && (
        <div className={`pp-emo__pop${up ? ' is-up' : ''}`} role="dialog" aria-label={tt('Emoji', 'إيموجي')}>
          <EmojiPicker ar={(locale || document.documentElement.lang) === 'ar'} top autoFocus onPick={onPick} onClose={close} />
        </div>
      )}
    </span>
  );
}
