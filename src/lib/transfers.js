import { useSyncExternalStore } from 'react';

/**
 * Transfer manager — the data behind the OS-style upload panel (components/UploadProgress.jsx).
 *
 * drive.upload() (lib/driveApi.js) registers every upload here automatically, so ANY place that uploads to My PC
 * (Explorer, desktop drop, mobile, library …) gets the same professional progress panel: per-file bar, size, speed,
 * time left, cancel / retry, and one overall bar — like copying files from a flash drive.
 * Callers that know the whole batch up front (Explorer, desktop drop) can call transfers.add() for each file first,
 * so the panel shows "Uploading 12 items" immediately and queued files show "Waiting".
 */
// item: { id, name, rel, size, pct, speed, status: 'queued' | 'run' | 'done' | 'err', error, started, ended, abort, retry, onCancel }
let items = [];
let minimized = false;
let snap = { items, minimized };
let seq = 0;
let last = 0;
let clearTimer = 0;
const subs = new Set();

const publish = () => { snap = { items, minimized }; subs.forEach((f) => f()); };
/** Progress events can fire dozens of times a second: repaint at most ~8×/s. Status changes always publish at once. */
const publishSoft = () => {
  const n = Date.now();
  if (n - last < 120) return;
  last = n;
  publish();
};
const patch = (id, p, soft) => {
  let hit = false;
  items = items.map((i) => { if (i.id !== id) return i; hit = true; return { ...i, ...p }; });
  if (!hit) return;
  if (soft) publishSoft(); else publish();
};

const active = () => items.some((i) => i.status === 'queued' || i.status === 'run');

/** When everything finished without a problem the panel tidies itself away after a few seconds. */
function scheduleAutoClear() {
  clearTimeout(clearTimer);
  if (active() || !items.length || items.some((i) => i.status === 'err')) return;
  clearTimer = setTimeout(() => { if (!active() && !items.some((i) => i.status === 'err')) { items = []; minimized = false; publish(); } }, 6000);
}

export const transfers = {
  /** Registers a file as waiting. onCancel runs if the student cancels it before it started. Returns its id. */
  add(file, { rel, onCancel } = {}) {
    seq += 1;
    const id = `t${seq}`;
    clearTimeout(clearTimer);
    items = [...items, { id, name: file.name, rel: rel || file.name, size: file.size || 0, pct: 0, speed: 0, status: 'queued', error: '', started: 0, ended: 0, onCancel }];
    publish();
    return id;
  },
  begin(id, { abort, retry } = {}) {
    clearTimeout(clearTimer);
    patch(id, { status: 'run', pct: 0, speed: 0, error: '', started: Date.now(), ended: 0, abort, retry, _t: Date.now(), _l: 0 });
  },
  progress(id, pct) {
    const it = items.find((i) => i.id === id);
    if (!it || it.status !== 'run') return;
    const now = Date.now();
    const loaded = (Math.min(100, pct) / 100) * it.size;
    const dt = (now - (it._t || now)) / 1000;
    let speed = it.speed;
    if (dt > 0.2) { // smoothed (exponential average) so the number does not jump around
      const inst = Math.max(0, (loaded - (it._l || 0)) / dt);
      speed = it.speed ? it.speed * 0.7 + inst * 0.3 : inst;
      patch(id, { pct, speed, _t: now, _l: loaded }, true);
    } else patch(id, { pct }, true);
  },
  done(id) { patch(id, { status: 'done', pct: 100, ended: Date.now(), speed: 0 }); scheduleAutoClear(); },
  fail(id, error) { patch(id, { status: 'err', error: error || '', ended: Date.now(), speed: 0 }); },
  /** Removes an item (cancelled uploads simply disappear). */
  remove(id) { items = items.filter((i) => i.id !== id); publish(); scheduleAutoClear(); },
  cancel(id) {
    const it = items.find((i) => i.id === id);
    if (!it) return;
    if (it.status === 'run') { it.abort?.(); return; } // the upload rejects with AbortError → drive.upload removes the row
    if (it.status === 'queued') { try { it.onCancel?.(); } catch { /* caller gone */ } }
    transfers.remove(id);
  },
  cancelAll() { [...items].filter((i) => i.status === 'queued' || i.status === 'run').forEach((i) => transfers.cancel(i.id)); },
  retry(id) {
    const it = items.find((i) => i.id === id);
    if (it?.status === 'err' && it.retry) { patch(id, { status: 'queued', error: '', pct: 0 }); it.retry(); }
  },
  retryFailed() { items.filter((i) => i.status === 'err' && i.retry).forEach((i) => transfers.retry(i.id)); },
  /** Close the panel: drops the finished / failed rows (running ones stay). */
  clear() { items = items.filter((i) => i.status === 'queued' || i.status === 'run'); minimized = false; publish(); },
  toggleMinimized() { minimized = !minimized; publish(); },
};

export function useTransfers() {
  return useSyncExternalStore((cb) => { subs.add(cb); return () => subs.delete(cb); }, () => snap, () => snap);
}
