/**
 * A visible "working on it" notification for saves and downloads: a card at the top of the screen with a spinner and the
 * file name, that turns into a green check (saved) or a red cross (failed) and then fades away by itself.
 * Plain DOM (no React mount needed), so it works from anywhere: message menu, file bubbles, native save helpers.
 *
 *   const t = beginToast({ title: 'Saving to My Library…', detail: 'report.pdf', total: 3 });
 *   t.update({ detail: 'next.pdf', done: 1 });
 *   t.success('Saved to My Library', '3 files');     // or t.fail('Could not save', 'report.pdf')
 */
const CSS = `
.tt-stack{position:fixed;top:max(12px,env(safe-area-inset-top));left:50%;transform:translateX(-50%);z-index:99999;display:grid;gap:8px;width:min(420px,calc(100vw - 24px));pointer-events:none}
.tt-card{pointer-events:auto;position:relative;overflow:hidden;display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:16px;background:rgba(22,26,44,.97);color:#fff;box-shadow:0 12px 34px rgba(0,0,0,.34),0 0 0 1px rgba(255,255,255,.08);animation:tt-in .22s ease-out;font:14px/1.35 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
.tt-card.is-out{animation:tt-out .22s ease-in forwards}
.tt-ic{flex:none;width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.1)}
.tt-spin{width:18px;height:18px;border-radius:50%;border:2.5px solid rgba(255,255,255,.28);border-top-color:#fff;animation:tt-rot .8s linear infinite}
.tt-card.is-ok .tt-ic{background:#22c55e}.tt-card.is-bad .tt-ic{background:#ef4444}
.tt-txt{flex:1;min-width:0;display:grid;gap:1px}
.tt-txt b{font-size:14px;font-weight:700}
.tt-txt small{font-size:12.5px;opacity:.72;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tt-x{flex:none;width:26px;height:26px;border:0;border-radius:50%;background:transparent;color:#fff;opacity:.6;cursor:pointer;display:grid;place-items:center;padding:0}
.tt-x:hover{opacity:1;background:rgba(255,255,255,.12)}
.tt-bar{position:absolute;inset-inline:0;bottom:0;height:3px;background:rgba(255,255,255,.12)}
.tt-bar i{display:block;height:100%;width:35%;background:#7c8cff;border-radius:3px;animation:tt-slide 1.1s ease-in-out infinite}
.tt-bar i.is-det{animation:none;width:0;transition:width .25s}
.tt-card.is-ok .tt-bar,.tt-card.is-bad .tt-bar{display:none}
@keyframes tt-rot{to{transform:rotate(360deg)}}
@keyframes tt-slide{0%{margin-inline-start:-35%}100%{margin-inline-start:100%}}
@keyframes tt-in{from{opacity:0;transform:translateY(-14px) scale(.96)}to{opacity:1;transform:none}}
@keyframes tt-out{to{opacity:0;transform:translateY(-10px) scale(.96)}}
@media (prefers-reduced-motion:reduce){.tt-card,.tt-card.is-out{animation:none}.tt-spin{animation-duration:2s}}
`;
const OK = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';
const BAD = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>';
const X = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>';

let stack = null;
function root() {
  if (typeof document === 'undefined') return null;
  if (!document.getElementById('tt-style')) {
    const st = document.createElement('style'); st.id = 'tt-style'; st.textContent = CSS; document.head.appendChild(st);
  }
  if (!stack || !stack.isConnected) {
    stack = document.createElement('div'); stack.className = 'tt-stack'; stack.setAttribute('role', 'status'); stack.setAttribute('aria-live', 'polite');
    document.body.appendChild(stack);
  }
  return stack;
}

export function beginToast({ title = '', detail = '', total = 0 } = {}) {
  const host = root();
  if (!host) return { update() {}, success() {}, fail() {}, dismiss() {} };
  const card = document.createElement('div');
  card.className = 'tt-card';
  card.innerHTML = '<span class="tt-ic"><span class="tt-spin"></span></span><span class="tt-txt"><b dir="auto"></b><small dir="auto"></small></span><button type="button" class="tt-x" aria-label="Close">' + X + '</button><span class="tt-bar"><i></i></span>';
  host.appendChild(card);
  const $ = (s) => card.querySelector(s);
  let timer = null; let gone = false;
  const set = (t, d) => { if (t !== undefined) $('b').textContent = t; if (d !== undefined) { $('small').textContent = d; $('small').style.display = d ? '' : 'none'; } };
  const dismiss = () => {
    if (gone) return; gone = true; clearTimeout(timer);
    card.classList.add('is-out'); setTimeout(() => card.remove(), 240);
  };
  const finish = (cls, icon, t, d, ms) => {
    if (gone) return;
    card.classList.add(cls); $('.tt-ic').innerHTML = icon; set(t, d);
    clearTimeout(timer); timer = setTimeout(dismiss, ms);
  };
  $('.tt-x').addEventListener('click', dismiss);
  set(title, detail);
  const bar = $('.tt-bar i');
  const progress = (done) => { if (total > 1 && done != null) { bar.classList.add('is-det'); bar.style.width = `${Math.min(100, Math.round((done / total) * 100))}%`; } };
  return {
    update({ title: t, detail: d, done } = {}) { if (gone) return; set(t, d); progress(done); },
    success(t, d) { finish('is-ok', OK, t, d, 3200); },
    fail(t, d) { finish('is-bad', BAD, t, d, 6000); },
    dismiss,
  };
}
