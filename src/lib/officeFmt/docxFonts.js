/**
 * Font library of the Word editor.
 *  - FONT_LIST is THE place to add a font: one line { name, g } (g = group id). `web` means it is loaded from Google Fonts on demand
 *    (the app's CSP already allows fonts.googleapis.com / fonts.gstatic.com), so it works on every device.
 *  - Fonts without `web` are system fonts (Calibri, Arial …): they show if the device has them, like in Word.
 *  - Users can also add their own font file from the picker: it is kept on their device and re-registered every time the editor opens.
 * The .docx only stores the font NAME (like Word without "embed fonts"): whoever opens the file needs the font installed.
 */
import { libAll, libPut, libDel, kvGet, kvSet } from './docxStore';

export const FONT_GROUPS = [
  { id: 'ar', label: { en: 'Arabic', ar: 'عربية' } },
  { id: 'sans', label: { en: 'Sans-serif', ar: 'بدون زوائد' } },
  { id: 'serif', label: { en: 'Serif', ar: 'بزوائد' } },
  { id: 'mono', label: { en: 'Code / mono', ar: 'أكواد' } },
  { id: 'display', label: { en: 'Display & handwriting', ar: 'عناوين وخط يد' } },
];

export const FONT_LIST = [
  // Arabic — already loaded by the app
  { name: 'Cairo', g: 'ar', web: 1 }, { name: 'Tajawal', g: 'ar', web: 1 }, { name: 'Amiri', g: 'ar', web: 1, serif: 1 }, { name: 'Reem Kufi', g: 'ar', web: 1 }, { name: 'Lalezar', g: 'ar', web: 1 },
  // Arabic — loaded on demand
  { name: 'Almarai', g: 'ar', web: 1 }, { name: 'IBM Plex Sans Arabic', g: 'ar', web: 1 }, { name: 'Noto Naskh Arabic', g: 'ar', web: 1, serif: 1 }, { name: 'Noto Kufi Arabic', g: 'ar', web: 1 },
  { name: 'Noto Sans Arabic', g: 'ar', web: 1 }, { name: 'El Messiri', g: 'ar', web: 1 }, { name: 'Changa', g: 'ar', web: 1 }, { name: 'Harmattan', g: 'ar', web: 1 }, { name: 'Lateef', g: 'ar', web: 1, serif: 1 },
  { name: 'Scheherazade New', g: 'ar', web: 1, serif: 1 }, { name: 'Mada', g: 'ar', web: 1 }, { name: 'Markazi Text', g: 'ar', web: 1, serif: 1 }, { name: 'Readex Pro', g: 'ar', web: 1 }, { name: 'Baloo Bhaijaan 2', g: 'ar', web: 1 },
  { name: 'Aref Ruqaa', g: 'ar', web: 1 }, { name: 'Katibeh', g: 'ar', web: 1 }, { name: 'Rakkas', g: 'ar', web: 1 }, { name: 'Vibes', g: 'ar', web: 1 },
  // Arabic — Windows / Office
  { name: 'Traditional Arabic', g: 'ar' }, { name: 'Simplified Arabic', g: 'ar' }, { name: 'Sakkal Majalla', g: 'ar' }, { name: 'Arabic Typesetting', g: 'ar' }, { name: 'Dubai', g: 'ar' },
  // Sans
  { name: 'Calibri', g: 'sans' }, { name: 'Arial', g: 'sans' }, { name: 'Segoe UI', g: 'sans' }, { name: 'Tahoma', g: 'sans' }, { name: 'Verdana', g: 'sans' }, { name: 'Trebuchet MS', g: 'sans' },
  { name: 'Inter', g: 'sans', web: 1 }, { name: 'Roboto', g: 'sans', web: 1 }, { name: 'Open Sans', g: 'sans', web: 1 }, { name: 'Lato', g: 'sans', web: 1 }, { name: 'Montserrat', g: 'sans', web: 1 },
  { name: 'Poppins', g: 'sans', web: 1 }, { name: 'Plus Jakarta Sans', g: 'sans', web: 1 }, { name: 'IBM Plex Sans', g: 'sans', web: 1 }, { name: 'Nunito', g: 'sans', web: 1 }, { name: 'Rubik', g: 'sans', web: 1 },
  // Serif
  { name: 'Times New Roman', g: 'serif' }, { name: 'Cambria', g: 'serif' }, { name: 'Georgia', g: 'serif' }, { name: 'Garamond', g: 'serif' },
  { name: 'Merriweather', g: 'serif', web: 1 }, { name: 'Lora', g: 'serif', web: 1 }, { name: 'Playfair Display', g: 'serif', web: 1 }, { name: 'Source Serif 4', g: 'serif', web: 1 }, { name: 'Libre Baskerville', g: 'serif', web: 1 }, { name: 'Newsreader', g: 'serif', web: 1 },
  // Mono
  { name: 'Consolas', g: 'mono' }, { name: 'Courier New', g: 'mono' }, { name: 'JetBrains Mono', g: 'mono', web: 1 }, { name: 'Source Code Pro', g: 'mono', web: 1 }, { name: 'Fira Code', g: 'mono', web: 1 },
  // Display / hand
  { name: 'Impact', g: 'display' }, { name: 'Comic Sans MS', g: 'display' }, { name: 'Bebas Neue', g: 'display', web: 1 }, { name: 'Pacifico', g: 'display', web: 1 }, { name: 'Caveat', g: 'display', web: 1 }, { name: 'Oswald', g: 'display', web: 1 },
];
export const FONT_NAMES = FONT_LIST.map((f) => f.name);
const BY_NAME = Object.fromEntries(FONT_LIST.map((f) => [f.name, f]));

/* ---------------------------------------------------------------- Google Fonts on demand */
const loaded = new Set(['Cairo', 'Tajawal', 'Amiri', 'Reem Kufi', 'Lalezar', 'Inter', 'JetBrains Mono', 'Plus Jakarta Sans', 'Playfair Display', 'Bebas Neue', 'Pacifico']); // index.html loads these
export function loadWebFont(name) {
  const f = BY_NAME[name]; if (!f?.web || loaded.has(name) || typeof document === 'undefined') return;
  loaded.add(name);
  const l = document.createElement('link'); l.rel = 'stylesheet'; l.setAttribute('data-dx-font', name);
  l.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(name).replace(/%20/g, '+')}:wght@400;700&display=swap`;
  document.head.appendChild(l);
}
/** the editor opened a document that uses fonts: make sure the ones we know are available */
export function ensureFontsIn(html) {
  const seen = new Set(); String(html || '').replace(/font-family:\s*([^;"]+)/gi, (_, v) => { v.split(',').forEach((x) => seen.add(x.replace(/['"&;quot]/g, '').trim())); return ''; });
  seen.forEach((n) => loadWebFont(n)); return Array.from(seen).filter(Boolean);
}

/* ---------------------------------------------------------------- user fonts */
const FMT = { ttf: 'truetype', otf: 'opentype', woff: 'woff', woff2: 'woff2' };
const nameOfFile = (f) => f.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').replace(/\s+(regular|bold|italic|medium|light)$/i, '').replace(/[^\p{L}\p{N} ]/gu, '').trim().slice(0, 40) || 'My font';
const registered = new Set();
async function register(rec) {
  if (registered.has(rec.name) || typeof FontFace === 'undefined') return;
  try { const ff = new FontFace(rec.name, rec.data); await ff.load(); document.fonts.add(ff); registered.add(rec.name); } catch { /* corrupt font file */ }
}
export async function listUserFonts() { const all = await libAll('fonts'); await Promise.all(all.map(register)); return all.map((r) => ({ name: r.name, g: 'mine', size: r.data?.byteLength || 0 })); }
export async function addUserFont(file) {
  if (!file || !/\.(ttf|otf|woff2?)$/i.test(file.name)) throw new Error('type');
  if (file.size > 8 * 1024 * 1024) throw new Error('size');
  const data = await file.arrayBuffer(); const name = nameOfFile(file);
  const ff = new FontFace(name, data); await ff.load(); document.fonts.add(ff); registered.add(name);
  await libPut('fonts', { name, data, format: FMT[file.name.split('.').pop().toLowerCase()], at: Date.now() });
  return { name, g: 'mine', size: data.byteLength };
}
export const removeUserFont = (name) => libDel('fonts', name);

/* ---------------------------------------------------------------- recent fonts */
export const getRecentFonts = () => kvGet('recentFonts', []);
export async function pushRecentFont(name) { const cur = await getRecentFonts(); await kvSet('recentFonts', [name, ...cur.filter((x) => x !== name)].slice(0, 6)); }

/* ---------------------------------------------------------------- is a font installed on this device? (width test against fall-backs) */
const cache = new Map(); let ctx = null;
export function fontInstalled(name) {
  if (BY_NAME[name]?.web || registered.has(name)) return true;
  if (cache.has(name)) return cache.get(name);
  let ok = true;
  try {
    ctx = ctx || document.createElement('canvas').getContext('2d'); const probe = 'mmmmmmmmmmlli وعربي 123';
    ok = ['monospace', 'serif', 'sans-serif'].some((base) => { ctx.font = `72px ${base}`; const w0 = ctx.measureText(probe).width; ctx.font = `72px "${name}", ${base}`; return ctx.measureText(probe).width !== w0; });
  } catch { ok = true; }
  cache.set(name, ok); return ok;
}
