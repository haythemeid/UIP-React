import { useCallback, useEffect, useMemo, useState } from 'react';
import Icon from '../Icon';
import { StModal } from '../student/stUi';
import { errorMessage } from '../../api/client';
import { drive, fetchDriveBlob } from '../../lib/driveApi';
import { KINDS, KIND_BY_KEY, fmtSize, kindOf } from '../../lib/libraryKinds';
import { libraryLockApi, readLockCache, readUnlocked, writeUnlocked } from '../../lib/libraryLock';
import { LockPage } from './LibraryLockGate';
import { useAuth } from '../../context/AuthContext';
import './library-picker.css';

/**
 * Pick files from My Library (or all of My PC) to send in a chat. The chosen files are downloaded and handed back as
 * ordinary File objects, so they go through exactly the same path as files picked from the device (limits, review,
 * sending). If the library lock is on and this tab has not opened it yet, nothing is listed: open My Library first.
 */
const LIB_ROOT = 'My Library';
const MAX_PICK = 20;

export default function LibraryPicker({ ar, onClose, onPick }) {
  const { user } = useAuth();
  const uid = user?.id;
  const tt = useCallback((en, a) => (ar ? a : en), [ar]);
  const [nodes, setNodes] = useState(null);
  const [lockInfo, setLockInfo] = useState(null); // lock status while the library still has to be unlocked here
  const [rev, setRev] = useState(0);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [kind, setKind] = useState('all');
  const [everything, setEverything] = useState(false); // false = only what lives in "My Library"
  const [sel, setSel] = useState(() => new Set());
  const [busy, setBusy] = useState('');

  useEffect(() => {
    let off = false;
    (async () => {
      try {
        let s = null;
        try { s = await libraryLockApi.status(); } catch {
          // fail closed: only a library last seen without a lock may list files when the lock status cannot be fetched
          if (readLockCache(uid) !== false) { if (!off) { setError(tt('Could not check the library lock. Try again.', 'مقدرناش نتأكد من قفل المكتبة. جرّب تاني.')); setNodes([]); } return; }
        }
        if (s?.enabled && !readUnlocked(uid)) { if (!off) { setLockInfo(s); setNodes([]); } return; }
        const r = await drive.manifest();
        if (!off) { setLockInfo(null); setNodes(r?.items || []); }
      } catch (e) { if (!off) { setError(errorMessage(e)); setNodes([]); } }
    })();
    return () => { off = true; };
  }, [uid, rev]); // eslint-disable-line react-hooks/exhaustive-deps

  const unlocked = () => { writeUnlocked(uid, true); setNodes(null); setRev((n) => n + 1); }; // remembered for the whole login session

  const byId = useMemo(() => new Map((nodes || []).map((n) => [n.id, n])), [nodes]);
  const libRoot = useMemo(() => (nodes || []).find((n) => n.type === 'folder' && n.parent_id == null && n.name === LIB_ROOT) || null, [nodes]);
  const inLib = useCallback((n) => { if (!libRoot) return false; for (let c = n, i = 0; c && i < 40; i += 1) { if (c.parent_id === libRoot.id) return true; c = byId.get(c.parent_id); } return false; }, [libRoot, byId]);

  const all = useMemo(() => (nodes || []).filter((n) => n.type !== 'folder').map((n) => ({ ...n, kind: kindOf(n.name) })), [nodes]);
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return all
      .filter((n) => (everything || inLib(n)) && (kind === 'all' || n.kind === kind) && (!s || n.name.toLowerCase().includes(s)))
      .sort((a, b) => Date.parse(b.updated_at || 0) - Date.parse(a.updated_at || 0));
  }, [all, everything, inLib, kind, q]);
  const kinds = useMemo(() => KINDS.filter((k) => all.some((n) => n.kind === k.key && (everything || inLib(n)))), [all, everything, inLib]);

  const toggle = (id) => setSel((p) => {
    const n = new Set(p);
    if (n.has(id)) n.delete(id); else if (n.size < MAX_PICK) n.add(id);
    return n;
  });

  const send = async () => {
    const chosen = list.filter((n) => sel.has(n.id));
    if (!chosen.length || busy) return;
    setError('');
    const files = [];
    for (let i = 0; i < chosen.length; i += 1) {
      const n = chosen[i];
      setBusy(tt(`Preparing ${i + 1} / ${chosen.length}…`, `جارِ التجهيز ${i + 1} / ${chosen.length}…`));
      try { const b = await fetchDriveBlob(n.id); files.push(new File([b], n.name, { type: b.type || n.mime_type || '', lastModified: Date.parse(n.updated_at) || Date.now() })); } catch { /* skipped */ }
    }
    setBusy('');
    if (!files.length) { setError(tt('Could not load the selected files.', 'تعذّر تحميل الملفات المختارة.')); return; }
    onPick(files); onClose(); // a few that failed to load are simply left out
  };

  return (
    <StModal wide title={tt('Send from My Library', 'إرسال من مكتبتي')} onClose={busy ? undefined : onClose}
      actions={(
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={!!busy}>{tt('Cancel', 'إلغاء')}</button>
          <button type="button" className="btn btn-primary" onClick={send} disabled={!sel.size || !!busy}>{busy || (sel.size ? tt(`Add ${sel.size} to message`, `إضافة ${sel.size} للرسالة`) : tt('Choose files', 'اختار ملفات'))}</button>
        </>
      )}>
      {lockInfo ? (
        <LockPage embedded tt={tt} status={lockInfo} onUnlocked={unlocked} />
      ) : (
        <div className="lp">
          <div className="lp-top">
            <div className="lp-search"><Icon name="search" size={15} /><input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={tt('Search files…', 'دوّر على ملف…')} aria-label={tt('Search', 'بحث')} /></div>
            <button type="button" className={`lp-scope${everything ? ' is-on' : ''}`} onClick={() => setEverything((v) => !v)} aria-pressed={everything}>
              <Icon name="monitor" size={14} /><span>{everything ? tt('All My PC', 'كل جهازي') : tt('My Library only', 'المكتبة فقط')}</span>
            </button>
          </div>
          <div className="lp-chips">
            <button type="button" className={kind === 'all' ? 'is-on' : ''} onClick={() => setKind('all')}>{tt('All', 'الكل')}</button>
            {kinds.map((k) => <button key={k.key} type="button" className={kind === k.key ? 'is-on' : ''} onClick={() => setKind(k.key)}>{ar ? k.ar : k.en}</button>)}
          </div>
          <div className="lp-box">
            {nodes === null ? <div className="lp-empty"><span>{tt('Loading…', 'جارِ التحميل…')}</span></div>
              : list.length === 0 ? (
                <div className="lp-empty">
                  <Icon name="bookmark" size={26} />
                  <b>{everything ? tt('No files found', 'مفيش ملفات') : tt('Nothing in My Library yet', 'مكتبتي فاضية لسه')}</b>
                  {!everything && <button type="button" className="lp-link" onClick={() => setEverything(true)}>{tt('Show all My PC instead', 'اعرض كل جهازي بدلها')}</button>}
                </div>
              ) : (
                <ul className="lp-list">
                  {list.map((n) => {
                    const k = KIND_BY_KEY[n.kind]; const on = sel.has(n.id);
                    return (
                      <li key={n.id}>
                        <button type="button" className={`lp-row${on ? ' is-on' : ''}`} onClick={() => toggle(n.id)} aria-pressed={on}>
                          <span className="lp-ic" style={{ '--k': k.color }}><Icon name={k.icon} size={17} /></span>
                          <span className="lp-name" dir="auto">{n.name}</span>
                          <small>{fmtSize(n.size_bytes)}</small>
                          <span className={`lp-dot${on ? ' is-on' : ''}`} aria-hidden="true">{on && <Icon name="check" size={12} />}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
          </div>
          {sel.size >= MAX_PICK && <small className="lp-hint">{tt(`Up to ${MAX_PICK} files at a time.`, `لحد ${MAX_PICK} ملف في المرة.`)}</small>}
          {error && <div className="lp-err" role="alert">{error}</div>}
        </div>
      )}
    </StModal>
  );
}
