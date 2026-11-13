import { api, errorMessage } from '../api/client';

/**
 * Library ("My Library") lock — thin wrappers over /api/v1/library-lock/*
 * (App\Http\Controllers\Api\LibraryLockApiController).
 *   mode 'own'     a password just for the library
 *   mode 'account' the account password itself
 *   mode 'mypc'    the My PC lock-screen password
 * "Unlocked" is remembered for the whole login session (localStorage, all tabs of this browser) and is cleared by
 * clearTokens() in api/client.js when the person logs out or the session ends. A new device starts locked.
 */
const B = '/api/v1/library-lock';
const unwrap = (r) => (r && r.data !== undefined ? r.data : r);

export const libraryLockApi = {
  status: async () => unwrap(await api.get(B)),
  set: async (body) => unwrap(await api.post(`${B}/set`, body)),
  verify: async (password, useAccount = false) => unwrap(await api.post(`${B}/verify`, { password, use_account: useAccount })),
  disable: async (password) => unwrap(await api.post(`${B}/disable`, { password })),
};

/** The server's own (already localized) message — errorMessage() would join field codes like "invalid". */
export const lockMsg = (e) => (e && e.message && e.status ? e.message : errorMessage(e));
/** Seconds left of a temporary block (HTTP 429), 0 otherwise. */
export const retryAfter = (e) => (e?.status === 429 ? Number(e?.payload?.errors?.retry_after) || 0 : 0);

const kUn = (uid) => `uip_library_unlocked_v1_${uid ?? 'anon'}`;
const kOn = (uid) => `uip_library_lock_v1_${uid ?? 'anon'}`;
const kRe = (uid) => `uip_library_relock_v1_${uid ?? 'anon'}`;
const get = (s, k) => { try { return s.getItem(k); } catch { return null; } };
const put = (s, k, v) => { try { if (v === null) s.removeItem(k); else s.setItem(k, v); } catch { /* private mode */ } };

export const readUnlocked = (uid) => get(localStorage, kUn(uid)) === '1';
export const writeUnlocked = (uid, on) => put(localStorage, kUn(uid), on ? '1' : null);
/** Last known "is the lock on?" — so a failed request never opens a library that was locked. */
export const readLockCache = (uid) => { const v = get(localStorage, kOn(uid)); return v === '1' ? true : v === '0' ? false : null; };
export const writeLockCache = (uid, on) => put(localStorage, kOn(uid), on ? '1' : '0');
/** "Ask for the password every time I open My Library" (per browser). */
export const readRelock = (uid) => get(localStorage, kRe(uid)) === '1';
export const writeRelock = (uid, on) => put(localStorage, kRe(uid), on ? '1' : null);
