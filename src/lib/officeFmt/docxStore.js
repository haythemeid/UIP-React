/**
 * Personal library of the Word editor, kept in IndexedDB on this device:
 *   templates – documents the user saved as templates (or imported)
 *   fonts     – font files the user added (.ttf / .otf / .woff / .woff2)
 *   kv        – small things (recent fonts, last used colours …)
 * Every function resolves and never throws: a browser without IndexedDB (private mode) behaves as an empty library
 * that still works for the current session (memory fallback).
 */
const DB = 'uip-docx-lib';
const STORES = { templates: 'id', fonts: 'name', kv: 'key' };
const mem = { templates: new Map(), fonts: new Map(), kv: new Map() };
let dbp = null;

function open() {
  if (dbp) return dbp;
  dbp = new Promise((resolve) => {
    try {
      if (typeof indexedDB === 'undefined') { resolve(null); return; }
      const rq = indexedDB.open(DB, 1);
      rq.onupgradeneeded = () => { Object.entries(STORES).forEach(([s, k]) => { if (!rq.result.objectStoreNames.contains(s)) rq.result.createObjectStore(s, { keyPath: k }); }); };
      rq.onsuccess = () => { const d = rq.result; d.onversionchange = () => { try { d.close(); } catch { /* ignore */ } dbp = null; }; resolve(d); };
      rq.onerror = () => resolve(null); rq.onblocked = () => resolve(null);
    } catch { resolve(null); }
  });
  return dbp;
}

async function run(store, mode, fn) {
  const db = await open(); if (!db) return { fail: true };
  return new Promise((resolve) => {
    try {
      const t = db.transaction(store, mode); const rq = fn(t.objectStore(store));
      t.oncomplete = () => resolve({ value: rq ? rq.result : true }); t.onerror = () => resolve({ fail: true }); t.onabort = () => resolve({ fail: true });
    } catch { resolve({ fail: true }); }
  });
}

export const libAll = async (store) => { const r = await run(store, 'readonly', (s) => s.getAll()); return r.fail ? Array.from(mem[store].values()) : (r.value || []); };
export const libGet = async (store, key) => { const r = await run(store, 'readonly', (s) => s.get(key)); return r.fail ? mem[store].get(key) : r.value; };
export const libPut = async (store, val) => { const r = await run(store, 'readwrite', (s) => s.put(val)); if (r.fail) mem[store].set(val[STORES[store]], val); return !r.fail; };
export const libDel = async (store, key) => { mem[store].delete(key); const r = await run(store, 'readwrite', (s) => s.delete(key)); return !r.fail; };

/* small helpers on top of kv */
export const kvGet = async (key, fallback) => { const r = await libGet('kv', key); return r && 'value' in r ? r.value : fallback; };
export const kvSet = (key, value) => libPut('kv', { key, value });

/* templates ------------------------------------------------------------------ */
export const newId = () => `u${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
/** a saved template: { id, label, group, color, html, header?, footer?, page?, defaults?, at } */
export const listUserTemplates = async () => (await libAll('templates')).sort((a, b) => (b.at || 0) - (a.at || 0));
export const saveUserTemplate = async (t) => { const rec = { color: '#2b6cdf', group: 'mine', ...t, id: t.id || newId(), at: Date.now() }; await libPut('templates', rec); return rec; };
export const deleteUserTemplate = (id) => libDel('templates', id);

/** share templates between devices / students as a small .json file */
export const TPL_FILE = 'uip-docx-templates';
export const templatesToJson = (list) => JSON.stringify({ format: TPL_FILE, v: 1, templates: list.map(({ id, label, group, color, html, header, footer, page, defaults }) => ({ id, label, group, color, html, header, footer, page, defaults })) });
export function templatesFromJson(text) {
  let j; try { j = JSON.parse(text); } catch { throw new Error('bad-json'); }
  if (j?.format !== TPL_FILE || !Array.isArray(j.templates)) throw new Error('bad-format');
  return j.templates.filter((t) => t && typeof t.html === 'string' && t.html.length < 8e6).map((t) => ({ label: { en: String(t.label?.en || t.label || 'Template'), ar: String(t.label?.ar || t.label || 'قالب') }, group: 'mine', color: /^#[0-9a-f]{6}$/i.test(t.color || '') ? t.color : '#2b6cdf', html: t.html, header: t.header || '', footer: t.footer || '', page: t.page && typeof t.page === 'object' ? t.page : undefined, defaults: t.defaults && typeof t.defaults === 'object' ? t.defaults : undefined }));
}
