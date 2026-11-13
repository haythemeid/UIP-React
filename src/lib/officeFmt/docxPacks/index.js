/** Loads every template pack in this folder (any *.js except this file). See README.md. */
const mods = import.meta.glob(['./*.js', '!./index.js']);

export async function loadPacks() {
  const out = [];
  for (const [path, load] of Object.entries(mods)) {
    try { const m = await load(); const pack = m.default; if (pack && (pack.templates || pack.blocks)) out.push({ id: pack.id || path, ...pack }); } catch (e) { console.warn('[docx template pack]', path, e); }
  }
  return out;
}
