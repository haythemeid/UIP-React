/**
 * Fidelity guard: scans an Office file BEFORE the UIPE editor re-saves it and lists what the re-save would drop or change.
 * UIPE rebuilds the file from its own model (xlsx) / from HTML (docx) instead of patching the original, so these features
 * do not survive. `verified: true` = confirmed by Phase-0 round-trip tests; false = predicted from code review, not yet tested.
 */
import { unzipSync, strFromU8 } from 'fflate';
const has = (files, re) => Object.keys(files).some((n) => re.test(n));
const text = (files, n) => (files[n] ? strFromU8(files[n]) : '');

export function scanOfficeRisk(bytes, ext) {
  const files = unzipSync(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes), { filter: (f) => /\.(xml|rels|bin)$|^xl\/(media|drawings)\//i.test(f.name) });
  const risks = []; const add = (id, severity, verified, detail) => risks.push({ id, severity, verified, detail });
  if (ext === 'xlsx' || ext === 'xlsm') {
    const wb = text(files, 'xl/workbook.xml');
    if (/<sheet [^>]*state="(hidden|veryHidden)"/.test(wb)) add('hidden-sheets', 'high', true, 'Hidden sheets become VISIBLE after saving.');
    if (Object.keys(files).some((n) => /^xl\/worksheets\/sheet\d+\.xml$/.test(n) && /rightToLeft="1"/.test(text(files, n)))) add('rtl-sheet', 'medium', true, 'Right-to-left sheet direction is lost.');
    if (Object.keys(files).some((n) => /^xl\/worksheets\/sheet\d+\.xml$/.test(n) && /<dataValidations/.test(text(files, n)))) add('data-validation', 'high', true, 'Data validation (drop-down lists, rules) is removed.');
    if (has(files, /^xl\/media\//)) add('images', 'high', true, 'Pictures inside the workbook are removed.');
    if (has(files, /^xl\/comments/) || has(files, /^xl\/threadedComments/)) add('comments', 'medium', true, 'Cell comments are removed.');
    if (has(files, /^xl\/tables\//)) add('tables', 'medium', true, 'Excel Tables (ListObjects) are flattened to plain ranges.');
    if (has(files, /^xl\/pivot(Tables|Cache)\//)) add('pivot', 'high', false, 'Pivot tables are not read or written by the editor.');
    if (has(files, /vbaProject\.bin$/)) add('macros', 'high', false, 'VBA macros would be dropped.');
    if (has(files, /^xl\/externalLinks\//)) add('external-links', 'medium', false, 'Links to other workbooks are not preserved.');
  } else if (ext === 'docx') {
    const doc = text(files, 'word/document.xml');
    if (/<w:(ins|del|moveFrom|moveTo) /.test(doc)) add('tracked-changes', 'high', true, 'Tracked changes are silently ACCEPTED (insertions kept, deletions discarded).');
    if (has(files, /^word\/comments/) || /<w:commentReference/.test(doc)) add('comments', 'high', true, 'Comments are removed.');
    if (/<w:sdt[ >]/.test(doc)) add('content-controls', 'medium', true, 'Content controls lose their wrapper (the text stays).');
    if (has(files, /^word\/footnotes\.xml$/) && /<w:footnoteReference/.test(doc)) add('footnotes', 'medium', false, 'Footnotes/endnotes are probably not preserved.');
    if (/<mc:AlternateContent|<wps:|<w:pict/.test(doc)) add('shapes', 'medium', false, 'Text boxes and shapes are probably not preserved.');
    if (/<w:instrText[^>]*>\s*(TOC|REF|SEQ)/.test(doc)) add('fields', 'medium', false, 'Complex fields (TOC, cross-references) may be flattened.');
  }
  const order = { high: 0, medium: 1 };
  risks.sort((a, b) => order[a.severity] - order[b.severity]);
  return { safe: risks.length === 0, risks };
}
