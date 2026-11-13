import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import Icon from '../Icon';
import PageLoading from '../PageLoading';
import { StModal } from '../student/stUi';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  libraryLockApi, lockMsg, retryAfter, readUnlocked, writeUnlocked, readLockCache, writeLockCache, readRelock, writeRelock,
} from '../../lib/libraryLock';
import './library-lock.css';

/**
 * Optional lock for My Library. Wraps the page: when a lock is on and this tab has not unlocked it yet, the person sees
 * a dedicated lock page instead of the library (nothing of the library mounts, so nothing is fetched).
 * The unlock password can be: a library-only password, the account password, or the My PC lock password.
 * The page itself reaches the controls through useLibraryLock() (Lock now / Lock settings).
 */
const Ctx = createContext({ enabled: false, mode: null, lockNow: () => {}, openSettings: () => {} });
export const useLibraryLock = () => useContext(Ctx);

const MODE_LABEL = {
  own: ['Library password', 'باسورد خاص بالمكتبة'],
  account: ['Account password', 'باسورد الحساب'],
  mypc: ['My PC lock password', 'باسورد قفل جهازي'],
};

export default function LibraryLockGate({ children }) {
  const { user } = useAuth();
  const uid = user?.id;
  const { locale } = useLanguage();
  const ar = locale === 'ar';
  const tt = useCallback((en, a) => (ar ? a : en), [ar]);

  const [status, setStatus] = useState(null); // null = loading
  const [failed, setFailed] = useState(false);
  const [unlocked, setUnlocked] = useState(() => readUnlocked(uid));
  const [settings, setSettings] = useState(false);

  const load = useCallback(async () => {
    setFailed(false);
    try {
      const s = await libraryLockApi.status();
      writeLockCache(uid, !!s?.enabled);
      setStatus(s || { enabled: false });
    } catch {
      // Fail closed: only a library known to be unlocked-by-design (no lock, last time we looked) opens without the server.
      if (readLockCache(uid) === false) setStatus({ enabled: false, mode: null, offline: true });
      else setFailed(true);
    }
  }, [uid]);
  useEffect(() => { load(); }, [load]);

  // "Ask again every time I open My Library": drop the unlocked flag when the page closes.
  useEffect(() => () => { if (readRelock(uid)) writeUnlocked(uid, false); }, [uid]);

  const onUnlocked = useCallback(() => { writeUnlocked(uid, true); setUnlocked(true); }, [uid]);
  const lockNow = useCallback(() => { writeUnlocked(uid, false); setUnlocked(false); }, [uid]);
  const onChanged = useCallback((s) => {
    writeLockCache(uid, !!s?.enabled);
    setStatus(s);
    if (s?.enabled) onUnlocked(); // the person just proved who they are: do not lock them out of what they are looking at
    else { writeUnlocked(uid, false); setUnlocked(false); }
  }, [uid, onUnlocked]);

  const value = useMemo(() => ({
    enabled: !!status?.enabled, mode: status?.mode || null, lockNow, openSettings: () => setSettings(true),
  }), [status, lockNow]);

  if (failed) {
    return (
      <div className="ll-wrap" role="alert">
        <div className="ll-card">
          <span className="ll-badge is-warn"><Icon name="alert-triangle" size={26} /></span>
          <h2>{tt('Could not check the library lock', 'مقدرناش نتأكد من قفل المكتبة')}</h2>
          <p>{tt('Check your connection and try again.', 'اتأكد من الاتصال وجرّب تاني.')}</p>
          <button type="button" className="ll-btn is-primary" onClick={load}>{tt('Try again', 'حاول تاني')}</button>
        </div>
      </div>
    );
  }
  if (status === null) return <PageLoading />;

  const locked = status.enabled && !unlocked;
  return (
    <Ctx.Provider value={value}>
      {locked ? <LockPage ar={ar} tt={tt} status={status} onUnlocked={onUnlocked} /> : children}
      {settings && <LockSettings ar={ar} tt={tt} uid={uid} status={status} onClose={() => setSettings(false)} onChanged={onChanged} />}
    </Ctx.Provider>
  );
}

// ---------------------------------------------------------------- the lock page
function LockPage({ tt, status, onUnlocked }) {
  const [pw, setPw] = useState('');
  const [show, setShow] = useState(false);
  const [caps, setCaps] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [wait, setWait] = useState(0);
  const [useAccount, setUseAccount] = useState(false);
  const [shake, setShake] = useState(0);
  const input = useRef(null);

  const mode = status.mode;
  // Account mode (or My PC mode whose lock password was removed) is the account password already.
  const accountOnly = mode === 'account' || status.fallback;
  const asAccount = accountOnly || useAccount;
  const canSwitch = !accountOnly && status.hasAccountPassword;

  useEffect(() => { input.current?.focus(); }, [asAccount]);
  useEffect(() => {
    if (wait <= 0) return undefined;
    const h = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(h);
  }, [wait]);

  const submit = async (e) => {
    e.preventDefault();
    if (busy || !pw || wait > 0) return;
    setBusy(true); setErr('');
    try {
      await libraryLockApi.verify(pw, asAccount);
      onUnlocked();
    } catch (x) {
      setErr(lockMsg(x)); setPw(''); setShake((n) => n + 1);
      const w = retryAfter(x); if (w) setWait(w);
      input.current?.focus();
    } finally { setBusy(false); }
  };

  const what = asAccount ? tt('Account password', 'باسورد الحساب') : mode === 'mypc' ? tt('My PC lock password', 'باسورد قفل جهازي') : tt('Library password', 'باسورد المكتبة');
  const mm = Math.floor(wait / 60); const ss = String(wait % 60).padStart(2, '0');
  return (
    <div className="ll-wrap">
      <form className="ll-card" key={shake} data-shake={shake > 0 ? '1' : undefined} onSubmit={submit} autoComplete="off">
        <span className="ll-badge"><Icon name="lock" size={28} /></span>
        <h2>{tt('My Library is locked', 'مكتبتي مقفولة')}</h2>
        <p>{tt('Enter the password to open it.', 'اكتب الباسورد عشان تفتحها.')}</p>
        <label className="ll-field">
          <span>{what}</span>
          <div className="ll-pw">
            <input ref={input} type={show ? 'text' : 'password'} value={pw} onChange={(e) => setPw(e.target.value)} disabled={busy || wait > 0}
              onKeyUp={(e) => setCaps(!!e.getModifierState?.('CapsLock'))} autoComplete="current-password" aria-invalid={!!err} />
            <button type="button" className="ll-eye" onClick={() => setShow((v) => !v)} aria-label={show ? tt('Hide', 'إخفاء') : tt('Show', 'إظهار')}><Icon name={show ? 'eye-off' : 'eye'} size={16} /></button>
          </div>
        </label>
        {caps && <small className="ll-hint"><Icon name="alert-triangle" size={13} /> {tt('Caps Lock is on', 'Caps Lock شغّال')}</small>}
        {err && <div className="ll-err" role="alert">{err}</div>}
        {wait > 0 && <div className="ll-err">{tt('Try again in', 'جرّب تاني بعد')} {mm}:{ss}</div>}
        <button type="submit" className="ll-btn is-primary" disabled={busy || !pw || wait > 0}>{busy ? tt('Checking…', 'جارِ التحقق…') : tt('Unlock', 'فتح')}</button>
        {canSwitch && (
          <button type="button" className="ll-link" onClick={() => { setUseAccount((v) => !v); setPw(''); setErr(''); }}>
            {useAccount ? tt('Use the library password instead', 'استخدم باسورد المكتبة') : tt('Forgot it? Use my account password', 'نسيت؟ افتح بباسورد حسابي')}
          </button>
        )}
      </form>
    </div>
  );
}

// ---------------------------------------------------------------- lock settings
function LockSettings({ tt, uid, status, onClose, onChanged }) {
  const on = !!status.enabled;
  const [mode, setMode] = useState(status.mode || 'own');
  const [pw, setPw] = useState(''); const [pw2, setPw2] = useState('');
  const [acc, setAcc] = useState('');
  const [relock, setRelock] = useState(() => readRelock(uid));
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const needAcc = status.hasAccountPassword;

  const options = [
    { k: 'own', icon: 'key', en: 'Its own password', ar: 'باسورد خاص بالمكتبة', d: tt('A password used only for My Library.', 'باسورد للمكتبة بس، غير أي باسورد تاني.'), ok: true },
    { k: 'account', icon: 'user', en: 'My account password', ar: 'باسورد حسابي', d: tt('Opens with the password you log in with.', 'بتتفتح بنفس باسورد تسجيل الدخول.'), ok: status.hasAccountPassword, why: tt('Your account has no password.', 'حسابك مالوش باسورد.') },
    { k: 'mypc', icon: 'monitor', en: 'My PC lock password', ar: 'باسورد قفل جهازي', d: tt('Same as the My PC lock screen. If you change it there, it changes here.', 'نفس باسورد شاشة قفل جهازي. لو غيّرته هناك بيتغيّر هنا.'), ok: status.desktopLock, why: tt('Set a lock password in My PC first (Settings > Lock screen).', 'فعّل باسورد القفل في جهازي الأول (الإعدادات > شاشة القفل).') },
  ];

  const proof = () => (needAcc && !acc ? tt('Enter your account password to confirm it is you.', 'اكتب باسورد حسابك عشان نتأكد إنه إنت.') : '');
  const save = async () => {
    if (busy) return;
    if (mode === 'own') {
      if (pw.length < 4) { setErr(tt('The password must be at least 4 characters.', 'الباسورد لازم يكون 4 حروف/أرقام على الأقل.')); return; }
      if (pw !== pw2) { setErr(tt('The two passwords do not match.', 'الباسوردين مش متطابقين.')); return; }
    }
    const p = proof(); if (p) { setErr(p); return; }
    setBusy(true); setErr('');
    try {
      const s = await libraryLockApi.set({ mode, password: mode === 'own' ? pw : undefined, account_password: acc });
      writeRelock(uid, relock);
      onChanged(s); onClose();
    } catch (x) { setErr(lockMsg(x)); } finally { setBusy(false); }
  };
  const remove = async () => {
    if (busy) return;
    const p = proof(); if (p) { setErr(p); return; }
    setBusy(true); setErr('');
    try { const s = await libraryLockApi.disable(acc); onChanged(s); onClose(); } catch (x) { setErr(lockMsg(x)); } finally { setBusy(false); }
  };

  return (
    <StModal title={tt('Library lock', 'قفل المكتبة')} onClose={onClose} wide
      actions={(
        <>
          {on && <button type="button" className="btn btn-ghost" onClick={remove} disabled={busy}>{tt('Remove lock', 'إلغاء القفل')}</button>}
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>{tt('Cancel', 'إلغاء')}</button>
          <button type="button" className="btn btn-primary" onClick={save} disabled={busy}>{busy ? tt('Saving…', 'جارِ الحفظ…') : on ? tt('Save', 'حفظ') : tt('Turn on lock', 'تفعيل القفل')}</button>
        </>
      )}>
      <div className="ll-set">
        <p className="ll-lead">{on ? tt(`Locked with: ${MODE_LABEL[status.mode][0]}.`, `مقفولة بـ: ${MODE_LABEL[status.mode][1]}.`) : tt('Choose how My Library should unlock.', 'اختار إزاي مكتبتي تتفتح.')}</p>
        {status.fallback && <div className="ll-note">{tt('The My PC lock password was removed, so the library opens with your account password for now.', 'باسورد قفل جهازي اتشال، فالمكتبة بتتفتح بباسورد حسابك دلوقتي.')}</div>}
        <div className="ll-opts" role="radiogroup" aria-label={tt('Unlock with', 'تتفتح بـ')}>
          {options.map((o) => (
            <button key={o.k} type="button" role="radio" aria-checked={mode === o.k} disabled={!o.ok} className={`ll-opt${mode === o.k ? ' is-on' : ''}`} onClick={() => { setMode(o.k); setErr(''); }}>
              <span className="ll-opt__ic"><Icon name={o.icon} size={18} /></span>
              <span className="ll-opt__txt"><b>{tt(o.en, o.ar)}</b><small>{o.ok ? o.d : o.why}</small></span>
              <span className="ll-radio" aria-hidden="true" />
            </button>
          ))}
        </div>
        {mode === 'own' && (
          <div className="ll-two">
            <label className="ll-field"><span>{tt('New password', 'الباسورد الجديد')}</span><input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" /></label>
            <label className="ll-field"><span>{tt('Repeat it', 'كرّره')}</span><input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" /></label>
          </div>
        )}
        {needAcc && (
          <label className="ll-field"><span>{tt('Your account password (to confirm)', 'باسورد حسابك (للتأكيد)')}</span><input type="password" value={acc} onChange={(e) => setAcc(e.target.value)} autoComplete="current-password" /></label>
        )}
        <label className="ll-check"><input type="checkbox" checked={relock} onChange={(e) => setRelock(e.target.checked)} /><span>{tt('Ask for the password every time I open My Library', 'اطلب الباسورد كل مرة أفتح فيها مكتبتي')}</span></label>
        <p className="ll-fine">{tt('This hides the Library page on this account. Your files still live in My PC (which has its own lock).', 'ده بيخبّي صفحة المكتبة. ملفاتك نفسها لسه في جهازي (وليه قفله الخاص).')}</p>
        {err && <div className="ll-err" role="alert">{err}</div>}
      </div>
    </StModal>
  );
}
