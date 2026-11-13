/**
 * One list of every template the editor can offer: built-in (docxTemplates.js) + packs (docxPacks/*.js) + the user's own (IndexedDB).
 *   loadTemplateLibrary({ ar }) -> Promise<{ groups:[{id,label}], items:[{ id, source, group, color, label, hint, html(ctx), insertAt }], blocks:[…], blockGroups:[…] }>
 */
import { listUserTemplates } from './docxStore';
import { BLOCKS, BLOCK_GROUPS } from './docxBlocks';

export const MINE = { id: 'mine', label: { en: 'My templates', ar: 'قوالبي' } };

export async function loadTemplateLibrary() {
  const [{ DOCX_TEMPLATES, DOCX_GROUPS, docxTemplateHtml }, { loadPacks }, mine] = await Promise.all([import('./docxTemplates'), import('./docxPacks'), listUserTemplates()]);
  const groups = [...DOCX_GROUPS]; const blockGroups = [...BLOCK_GROUPS];
  const items = DOCX_TEMPLATES.map((t) => ({ ...t, source: 'builtin', html: (ctx) => (t.id === 'blank' ? '<p></p>' : docxTemplateHtml(t.id, ctx)) }));
  const blocks = [...BLOCKS];
  (await loadPacks()).forEach((pack) => {
    (pack.groups || []).forEach((g) => { if (!groups.some((x) => x.id === g.id)) groups.push(g); });
    (pack.templates || []).forEach((t) => { if (t?.id && typeof t.html === 'function' && !items.some((x) => x.id === t.id)) items.push({ hint: { en: '', ar: '' }, color: '#64748b', ...t, source: 'pack', group: t.group || 'basic' }); });
    (pack.blocks || []).forEach((bl) => { if (bl?.id && typeof bl.html === 'function' && !blocks.some((x) => x.id === bl.id)) blocks.push(bl); });
  });
  const own = mine.map((t) => ({ id: t.id, source: 'mine', group: 'mine', color: t.color, label: typeof t.label === 'object' ? t.label : { en: t.label, ar: t.label }, hint: { en: '', ar: '' }, html: () => t.html, rec: t }));
  return { groups, items: [...own, ...items], blocks, blockGroups };
}
