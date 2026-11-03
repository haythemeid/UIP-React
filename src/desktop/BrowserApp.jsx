import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { unzipSync } from 'fflate';
import Icon from '../components/Icon';
import { useSandbox } from '../components/zipbench/runner/useSandbox';
import { api, errorMessage } from '../api/client';
import { drive } from '../lib/driveApi';
import { saveBlob } from '../lib/exporter';
import { zipSync, strToU8 } from 'fflate';
import './webApps.css';

/**
 * Browser app. Two ways to show a page, chosen automatically:
 *   direct  — the page allows framing (checked by Full-API, GET /drive/web-probe): an <iframe>, instant, no server resources.
 *   cloud   — everything else (Blender-style web apps, Google, YouTube…): a real Chromium in the student's own container,
 *             streamed by noVNC (uip-RUN `browser` kind). Slower to start (a few seconds) and uses server CPU, so it is only used when needed.
 * The home page has its own search (GET /drive/web-search → results as cards), quick-launch tiles and recent sites.
 */
const TOKEN_PATH = '/api/v1/drive/browser-token';
const RECENT_KEY = 'uip.browser.recent';

// `cloud: true` = known not to allow framing (or needs real browser features): skip the probe.
// `external: true` = GPU-heavy 3D editors: a cloud browser has no GPU (software WebGL + video stream = slow), so they open in the person's own browser tab.
const TILES = [
  { id: 'photopea', name: 'Photopea', url: 'https://www.photopea.com/', color: '#18a497', hint: ['Photo editor', 'محرر صور'] },
  { id: 'excalidraw', name: 'Excalidraw', url: 'https://excalidraw.com/', color: '#6965db', hint: ['Whiteboard', 'سبورة رسم'] },
  { id: 'threejs', name: 'three.js editor', url: 'https://threejs.org/editor/', color: '#111827', hint: ['3D editor', 'محرر 3D'] },
  { id: 'blender', name: 'Blender', url: 'https://www.blender.org/', color: '#ea7600', hint: ['Official site', 'الموقع الرسمي'], external: true },
  { id: 'spline', name: 'Spline', url: 'https://spline.design/', color: '#7c3aed', hint: ['3D in the browser', 'تصميم 3D في المتصفح'], external: true },
  { id: 'playcanvas', name: 'PlayCanvas', url: 'https://playcanvas.com/', color: '#f97316', hint: ['3D / game editor', 'محرر ألعاب 3D'], external: true },
  { id: 'sketchfab', name: 'Sketchfab', url: 'https://sketchfab.com/', color: '#1caad9', hint: ['3D models', 'موديلات 3D'], external: true },
  { id: 'desmos', name: 'Desmos', url: 'https://www.desmos.com/calculator', color: '#2f7d4d', hint: ['Graphing', 'رسم بياني'] },
  { id: 'geogebra', name: 'GeoGebra', url: 'https://www.geogebra.org/classic', color: '#6557d2', hint: ['Math', 'رياضيات'] },
  { id: 'wikipedia', name: 'Wikipedia', url: 'https://www.wikipedia.org/', color: '#475569', hint: ['Encyclopedia', 'موسوعة'] },
  { id: 'github', name: 'GitHub', url: 'https://github.com/', color: '#24292f', hint: ['Code', 'كود'], cloud: true },
  { id: 'youtube', name: 'YouTube', url: 'https://www.youtube.com/', color: '#dc2626', hint: ['Videos', 'فيديوهات'], cloud: true },
  { id: 'so', name: 'Stack Overflow', url: 'https://stackoverflow.com/', color: '#f48024', hint: ['Q&A', 'أسئلة'], cloud: true },
  { id: 'mdn', name: 'MDN', url: 'https://developer.mozilla.org/', color: '#1f2937', hint: ['Web docs', 'توثيق الويب'] },
];

const readRecent = () => { try { const v = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); return Array.isArray(v) ? v.slice(0, 12) : []; } catch { return []; } };
const writeRecent = (v) => { try { localStorage.setItem(RECENT_KEY, JSON.stringify(v)); } catch { /* private mode */ } };
const hostOf = (u) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return u; } };
const payload = (r) => r?.data ?? r;
/** The UIPE Browser Helper extension is installed: pages are shown directly in the window (own GPU), the cloud browser is only a fallback. */
const hasHelper = () => typeof document !== 'undefined' && document.documentElement.getAttribute('data-uipe-embed-helper') === '1';
const b64 = (s) => btoa(String.fromCharCode(...new TextEncoder().encode(s)));

/** what the person typed -> { url } for an address, { q } for a search */
function parseInput(raw) {
  const t = raw.trim();
  if (!t) return null;
  if (/^https?:\/\/\S+$/i.test(t)) return { url: t };
  if (!/\s/.test(t) && /^(localhost|[\w-]+(\.[\w-]+)+)(:\d+)?(\/\S*)?$/i.test(t) && !/^\d+(\.\d+)*$/.test(t)) return { url: `https://${t}` };
  return { q: t };
}

export default function BrowserApp({ tt, ar, req }) {
  const sbx = useSandbox('browser', TOKEN_PATH);
  const helper = useMemo(hasHelper, []);
  const { phase, busy, previewUrl, error } = sbx;
  const sbxRef = useRef(sbx); sbxRef.current = sbx;
  const [view, setView] = useState({ type: 'home' }); // home | results | loading | direct | cloud
  const [input, setInput] = useState('');
  const [hist, setHist] = useState([]);  // direct pages & searches: [{ type, url|q }]
  const [pos, setPos] = useState(-1);
  const [recent, setRecent] = useState(readRecent);
  const [msg, setMsg] = useState('');
  const [frameKey, setFrameKey] = useState(0);
  const [cloudUp, setCloudUp] = useState(false);   // the cloud session was started from this window
  const [dl, setDl] = useState('');
  const stageRef = useRef(null);
  const pendingUrl = useRef('');

  const remember = useCallback((url) => {
    setRecent((old) => { const next = [{ url, host: hostOf(url), at: Date.now() }, ...old.filter((x) => x.url !== url)].slice(0, 12); writeRecent(next); return next; });
  }, []);
  const push = useCallback((entry) => setHist((h) => { const base = h.slice(0, pos + 1); setPos(base.length); return [...base, entry]; }), [pos]);

  // ---- cloud browser ------------------------------------------------------------------------------------------
  const startCloud = useCallback((url) => {
    const el = stageRef.current;
    const w = Math.max(800, Math.min(2560, Math.round((el?.clientWidth || 1280) / 2) * 2));
    const h = Math.max(500, Math.min(1500, Math.round((el?.clientHeight || 720) / 2) * 2));
    const zip = zipSync({ 'README.txt': strToU8('Cloud browser workspace. Files you download are in Downloads/.\n') });
    setCloudUp(true);
    sbxRef.current.start({ kind: 'browser', entry: `u:${b64(url)}`, zip, cols: 80, rows: 24, screen: `${w}x${h}` });
  }, []);
  const toCloud = useCallback((url) => {
    setMsg(''); remember(url);
    setView({ type: 'cloud', url });
    if (sbxRef.current.phase === 'running') sbxRef.current.openUrl(url);
    else if (!['connecting', 'starting'].includes(sbxRef.current.phase)) startCloud(url);
    else pendingUrl.current = url;
  }, [remember, startCloud]);
  // a page asked for while the cloud browser was still starting: send it as soon as it is up
  useEffect(() => { if (phase === 'running' && pendingUrl.current) { sbxRef.current.openUrl(pendingUrl.current); pendingUrl.current = ''; } }, [phase]);
  // refresh: the gateway may still hold the session
  useEffect(() => { if (sbxRef.current.resumable()) { setCloudUp(true); sbxRef.current.resumeSaved(); } }, []);

  // ---- navigation -----------------------------------------------------------------------------------------------
  const openUrl = useCallback(async (url, { cloud = false, record = true } = {}) => {
    setMsg('');
    if (cloud) { toCloud(url); return; }
    setView({ type: 'loading', url });
    let embeddable = false;
    try { const d = payload(await api.get('/api/v1/drive/web-probe', { url })); embeddable = !!(d?.ok && d?.embeddable); if (d?.ok === false && d?.reason === 'blocked') { setView({ type: 'home' }); setMsg(tt('That address cannot be opened.', 'العنوان ده مينفعش يتفتح.')); return; } } catch { /* probe failed: use the cloud browser, it always works */ }
    if (!embeddable && !helper) { toCloud(url); return; } // with the helper extension the page is framed anyway
    remember(url); if (record) push({ type: 'direct', url });
    setView({ type: 'direct', url }); setInput(url);
  }, [helper, push, remember, toCloud, tt]);

  const search = useCallback(async (q, { record = true } = {}) => {
    setMsg(''); setInput(q);
    setView({ type: 'results', q, items: null, configured: true });
    if (record) push({ type: 'results', q });
    try {
      const d = payload(await api.get('/api/v1/drive/web-search', { q, lang: ar ? 'ar' : 'en' }));
      setView({ type: 'results', q, items: d?.results || [], configured: d?.configured !== false, failed: !!d?.failed });
    } catch (e) { setView({ type: 'results', q, items: [], configured: true, error: errorMessage(e) }); }
  }, [ar, push]);

  const go = useCallback((raw) => { const p = parseInput(raw); if (!p) return; if (p.url) openUrl(p.url); else search(p.q); }, [openUrl, search]);
  const goHome = () => { setView({ type: 'home' }); setInput(''); setMsg(''); };
  const step = (d) => {
    const n = pos + d; if (n < 0 || n >= hist.length) return;
    setPos(n); const e = hist[n];
    if (e.type === 'direct') { setView({ type: 'direct', url: e.url }); setInput(e.url); } else search(e.q, { record: false });
  };

  // opened from elsewhere (an address given by another app)
  const handled = useRef(null);
  useEffect(() => { if (req?.url && handled.current !== req.nonce) { handled.current = req.nonce; go(req.url); } }, [req, go]);

  // ---- downloads of the cloud browser -> My PC --------------------------------------------------------------------
  const saveDownloads = async () => {
    setDl(tt('Collecting your downloads…', 'بجمّع التنزيلات…')); setMsg('');
    try {
      const files = Object.entries(unzipSync(await sbx.pull())).filter(([p, d]) => p.startsWith('Downloads/') && !p.endsWith('/') && d.length);
      if (!files.length) { setDl(''); setMsg(tt('Nothing was downloaded in the cloud browser yet.', 'لسه مفيش حاجة اتنزّلت في المتصفح السحابي.')); return; }
      let folderId = null;
      try { folderId = payload(await drive.ensurePath(null, 'Cloud browser downloads'))?.id ?? null; } catch { /* fall back to a ZIP on this device */ }
      if (!folderId) { saveBlob(new Blob([zipSync(Object.fromEntries(files))], { type: 'application/zip' }), 'cloud-browser-downloads.zip'); setDl(''); return; }
      for (const [p, d] of files) await drive.upload(folderId, new File([d], p.split('/').pop())); // eslint-disable-line no-await-in-loop
      window.dispatchEvent(new Event('uip-drive-changed'));
      setDl(tt(`Saved ${files.length} file(s) to My PC ▸ Cloud browser downloads.`, `اتحفظ ${files.length} ملف في جهازي ◂ Cloud browser downloads.`)); setTimeout(() => setDl(''), 6000);
    } catch (e) { setDl(''); setMsg(errorMessage(e) || tt('Could not read the downloads.', 'معرفتش أقرا التنزيلات.')); }
  };

  const cloudSrc = previewUrl ? `${previewUrl}/vnc.html?autoconnect=true&resize=scale&reconnect=true&reconnect_delay=1000&path=websockify&show_dot=true&quality=6&compression=2` : '';
  const cloudLive = ['running', 'starting', 'connecting', 'disconnected'].includes(phase);
  const canBack = pos > 0; const canFwd = pos < hist.length - 1;
  const showUrl = view.type === 'direct' || view.type === 'cloud';
  const tiles = useMemo(() => TILES, []);

  return (
    <div className="os-wa os-wa--web">
      <form className="os-wa__bar os-wa__bar--web" onSubmit={(e) => { e.preventDefault(); go(input); }}>
        <button type="button" onClick={() => step(-1)} disabled={!canBack} title={tt('Back', 'رجوع')} aria-label={tt('Back', 'رجوع')}><Icon name={ar ? 'arrow-right' : 'arrow-left'} size={15} /></button>
        <button type="button" onClick={() => step(1)} disabled={!canFwd} title={tt('Forward', 'قدّام')} aria-label={tt('Forward', 'قدّام')}><Icon name={ar ? 'arrow-left' : 'arrow-right'} size={15} /></button>
        <button type="button" onClick={() => (view.type === 'direct' ? setFrameKey((k) => k + 1) : goHome())} title={view.type === 'direct' ? tt('Reload', 'إعادة تحميل') : tt('Home', 'الرئيسية')} aria-label={tt('Home', 'الرئيسية')}><Icon name={view.type === 'direct' ? 'refresh' : 'home'} size={15} /></button>
        <div className="os-wa__omni">
          <Icon name={showUrl ? 'lock' : 'search'} size={14} />
          <input value={input} onChange={(e) => setInput(e.target.value)} onFocus={(e) => e.target.select()} placeholder={tt('Search the web or type an address', 'ابحث في الويب أو اكتب عنوان')} dir="auto" spellCheck={false} aria-label={tt('Address', 'العنوان')} />
          {view.type === 'cloud' && <span className="os-wa__badge os-wa__badge--cloud" title={tt('A real browser running on the server', 'متصفح حقيقي شغال على السيرفر')}><Icon name="cloud" size={12} />{tt('Cloud browser', 'متصفح سحابي')}</span>}
          {view.type === 'direct' && <span className="os-wa__badge" title={tt('Shown directly — instant', 'معروض مباشرة — فوري')}>{tt('Direct', 'مباشر')}</span>}
        </div>
        {view.type === 'direct' && <button type="button" onClick={() => toCloud(view.url)} title={tt('Open this page in the cloud browser (for sites that do not work here)', 'افتح الصفحة في المتصفح السحابي (للمواقع اللي مش شغالة هنا)')}><Icon name="cloud" size={15} /><span className="os-wa__lbl">{tt('Cloud', 'سحابي')}</span></button>}
        {view.type === 'cloud' && <a className="os-wa__btn" href={view.url} target="_blank" rel="noopener noreferrer" title={tt('Slow? Open this page in your own browser tab (uses your graphics card)', 'بطيء؟ افتح الصفحة في تبويب متصفحك أنت (بيستخدم كارت الشاشة بتاعك)')}><Icon name="external-link" size={15} /><span className="os-wa__lbl">{tt('Faster: new tab', 'أسرع: تبويب جديد')}</span></a>}
        {(view.type === 'direct') && <a className="os-wa__btn" href={view.url} target="_blank" rel="noopener noreferrer" title={tt('Open in a new tab', 'فتح في تبويب جديد')}><Icon name="external-link" size={15} /></a>}
        {cloudUp && cloudLive && <button type="button" onClick={saveDownloads} title={tt('Save files you downloaded in the cloud browser to My PC', 'احفظ الملفات اللي نزّلتها في المتصفح السحابي في جهازي')}><Icon name="download" size={15} /><span className="os-wa__lbl">{tt('Downloads', 'التنزيلات')}</span></button>}
        {cloudUp && cloudLive && <button type="button" onClick={() => { sbx.reset(); setCloudUp(false); if (view.type === 'cloud') goHome(); }} title={tt('Stop the cloud browser and free its resources', 'اقفل المتصفح السحابي وحرّر موارده')}><Icon name="stop" size={15} /></button>}
      </form>
      {(msg || dl) && <div className={`os-wa__err${dl ? ' is-ok' : ''}`} role="status">{dl || msg}</div>}

      <div className="os-wa__stage" ref={stageRef}>
        {view.type === 'home' && (
          <div className="os-wa__home">
            <div className="os-wa__brandline"><Icon name="globe" size={34} /><h1>{tt('UIPE Search', 'بحث UIPE')}</h1></div>
            <form className="os-wa__big" onSubmit={(e) => { e.preventDefault(); go(input); }}>
              <Icon name="search" size={20} />
              <input autoFocus value={input} onChange={(e) => setInput(e.target.value)} placeholder={tt('Search Google or type an address', 'ابحث في جوجل أو اكتب عنوان')} dir="auto" spellCheck={false} />
              <button type="submit">{tt('Search', 'بحث')}</button>
            </form>
            <div className="os-wa__tiles">
              {tiles.map((t) => (
                <button type="button" key={t.id} className="os-wa__site" onClick={() => (t.search ? search(t.search) : t.external && !helper ? window.open(t.url, '_blank', 'noopener,noreferrer') : openUrl(t.url, { cloud: !!t.cloud && !helper }))}>
                  <b style={{ background: t.color }}>{t.name.slice(0, 1)}</b><span>{t.name}</span><small>{tt(t.hint[0], t.hint[1])}{t.external ? ' ↗' : ''}</small>
                </button>
              ))}
            </div>
            {recent.length > 0 && (
              <div className="os-wa__recent"><h3>{tt('Recent', 'الأخيرة')}</h3>
                <div>{recent.map((r) => <button type="button" key={r.url} onClick={() => openUrl(r.url)} title={r.url}><Icon name="clock" size={12} />{r.host}</button>)}</div>
              </div>
            )}
            {!helper && <p className="os-wa__foot">{tt('Faster option: install the UIPE Browser Helper extension (Chrome / Edge) and every site opens directly on your computer, with your graphics card.', 'خيار أسرع: ركّب إضافة UIPE Browser Helper (Chrome / Edge) وأي موقع هيفتح مباشرة على جهازك بكارت الشاشة بتاعك.')}</p>}
            <p className="os-wa__foot">{tt('Pages that allow it open instantly. Everything else — web apps, Google, YouTube — opens in a real cloud browser that runs for you on the server.', 'الصفحات اللي بتسمح بتفتح فورًا. أي حاجة تانية — تطبيقات ويب وجوجل ويوتيوب — بتتفتح في متصفح سحابي حقيقي شغال ليك على السيرفر.')}</p>
          </div>
        )}

        {view.type === 'results' && (
          <div className="os-wa__results">
            {view.items === null && <div className="os-wa__wait"><span className="mp-spin" /></div>}
            {view.items && (!view.configured || view.failed) && (
              <div className="os-wa__note"><Icon name="alert-triangle" size={18} />
                <div><b>{view.failed ? tt('Web search is unavailable right now.', 'البحث في الويب مش شغال دلوقتي.') : tt('Web search is not set up on this server yet.', 'البحث في الويب لسه مش متظبط على السيرفر.')}</b>
                  <p>{tt('Type a full address to open a site, or search with the cloud browser.', 'اكتب عنوان كامل لفتح موقع، أو ابحث من المتصفح السحابي.')}</p>
                  <button type="button" className="os-wa__cta" onClick={() => openUrl(`https://www.google.com/search?q=${encodeURIComponent(view.q)}`, { cloud: true })}><Icon name="cloud" size={14} />{tt('Search in the cloud browser', 'ابحث في المتصفح السحابي')}</button></div></div>
            )}
            {view.items && view.configured && !view.failed && view.error && <div className="os-wa__err" role="alert">{view.error}</div>}
            {view.items && view.configured && !view.failed && !view.error && !view.items.length && <div className="os-wa__hint">{tt('No results.', 'مفيش نتايج.')}</div>}
            {view.items && view.items.map((r) => (
              <article key={r.url} className="os-wa__res">
                <div className="os-wa__resTop"><span className="os-wa__fav">{r.domain.slice(0, 1).toUpperCase()}</span><span dir="ltr">{r.domain}</span></div>
                <button type="button" className="os-wa__resT" onClick={() => openUrl(r.url)} dir="auto">{r.title}</button>
                <p dir="auto">{r.snippet}</p>
                <button type="button" className="os-wa__lnk" onClick={() => openUrl(r.url, { cloud: true })}><Icon name="cloud" size={12} />{tt('Open in the cloud browser', 'افتح في المتصفح السحابي')}</button>
              </article>
            ))}
          </div>
        )}

        {view.type === 'loading' && <div className="os-wa__wait"><span className="mp-spin" /><p dir="ltr">{hostOf(view.url)}</p></div>}

        {view.type === 'direct' && (
          <iframe key={`${frameKey}:${view.url}`} src={view.url} title={hostOf(view.url)} className="os-wa__frame" referrerPolicy="no-referrer"
            allow="clipboard-read; clipboard-write; fullscreen; camera; microphone; autoplay" sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads allow-pointer-lock" />
        )}

        {/* the cloud browser stays mounted (hidden) while another page is shown, so its tabs and logins survive */}
        {cloudUp && (
          <div className="os-wa__cloud" style={{ display: view.type === 'cloud' ? 'block' : 'none' }}>
            {previewUrl && cloudLive ? <iframe src={cloudSrc} title="Cloud browser" className="os-wa__frame" referrerPolicy="no-referrer" allow="clipboard-read; clipboard-write; fullscreen" sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads" />
              : <div className="os-wa__wait"><span className="mp-spin" /><p>{phase === 'error' ? (error || tt('Could not start the cloud browser.', 'معرفتش أشغّل المتصفح السحابي.')) : phase === 'closed' ? tt('The cloud browser session ended.', 'جلسة المتصفح السحابي انتهت.') : tt('Starting your cloud browser…', 'بشغّل المتصفح السحابي…')}</p>
                {(phase === 'error' || phase === 'closed') && <button type="button" className="os-wa__cta" onClick={() => { sbx.reset(); setCloudUp(false); goHome(); }}>{tt('Back', 'رجوع')}</button>}</div>}
          </div>
        )}
      </div>
      {busy && view.type === 'cloud' && <div className="os-wa__ribbon">{tt('Starting the cloud browser — this takes a few seconds the first time…', 'بشغّل المتصفح السحابي — بياخد كام ثانية أول مرة…')}</div>}
    </div>
  );
}
