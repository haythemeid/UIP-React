/**
 * Excel stores functions added after Excel 2007 with a prefix in the file (`_xlfn.XLOOKUP`, `_xlfn._xlws.FILTER`).
 * The UIPE engine knows the plain names, so the prefix is removed when a file is READ (the editor shows and evaluates `XLOOKUP(...)`)
 * and put back when the file is WRITTEN (without it Excel shows #NAME?). String literals are never touched.
 */
const FUTURE = new Set(['XLOOKUP', 'XMATCH', 'IFS', 'SWITCH', 'MAXIFS', 'MINIFS', 'CONCAT', 'TEXTJOIN', 'IFNA', 'XOR', 'DAYS', 'NUMBERVALUE',
  'UNICHAR', 'UNICODE', 'FORMULATEXT', 'SHEET', 'SHEETS', 'STDEV.S', 'STDEV.P', 'VAR.S', 'VAR.P', 'RANK.EQ', 'PERCENTILE.INC', 'QUARTILE.INC',
  'FORECAST.LINEAR', 'UNIQUE', 'SEQUENCE', 'SORTBY', 'TAKE', 'DROP', 'CHOOSECOLS', 'CHOOSEROWS', 'HSTACK', 'VSTACK', 'TOCOL', 'TOROW',
  'TEXTSPLIT', 'TEXTBEFORE', 'TEXTAFTER']);
const FUTURE_WS = new Set(['FILTER', 'SORT']); // written as _xlfn._xlws.NAME
const outsideStrings = (f, fn) => f.split(/("(?:[^"]|"")*")/).map((p, i) => (i % 2 ? p : fn(p))).join('');
export const stripXlfn = (f) => (typeof f === 'string' && f.includes('_xl') ? outsideStrings(f, (p) => p.replace(/_xlfn\._xlws\.|_xlfn\.|_xlws\./g, '')) : f);
export const addXlfn = (f) => (typeof f !== 'string' ? f : outsideStrings(f, (p) => p.replace(/(?<![A-Za-z0-9_.])([A-Z][A-Z0-9]*(?:\.[A-Z0-9]+)*)(?=\()/g, (m, n) => (FUTURE_WS.has(n) ? `_xlfn._xlws.${n}` : FUTURE.has(n) ? `_xlfn.${n}` : m))));
