import { Extension, Node, Mark } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table';
import Image from '@tiptap/extension-image';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import { SearchExt } from './search';
import { imageNodeView } from './imageView';
import { PageView } from './pagination';

const attr = (name, html, valid) => ({
  default: null,
  parseHTML: (el) => { const v = el.getAttribute(html); return v && (!valid || valid(v)) ? v : null; },
  renderHTML: (a) => (a[name] ? { [html]: a[name] } : {}),
});
const dirOk = (v) => v === 'rtl' || v === 'ltr';

/** style / dir / data-st live on every block as plain attributes, so nothing the .docx reader produced is lost on the way back. */
const BlockAttrs = Extension.create({
  name: 'dxBlockAttrs',
  addGlobalAttributes() {
    return [
      { types: ['paragraph', 'heading', 'blockquote', 'bulletList', 'orderedList', 'listItem', 'table', 'tableCell', 'tableHeader'], attributes: { style: attr('style', 'style'), dir: attr('dir', 'dir', dirOk), dataSt: attr('dataSt', 'data-st', (v) => ['title', 'subtitle', 'quote'].includes(v)) } },
      { types: ['table'], attributes: { dataB: attr('dataB', 'data-b', (v) => v === 'none') } },
      { types: ['orderedList'], attributes: { listType: attr('listType', 'type', (v) => /^[aAiI1]$/.test(v)) } },
    ];
  },
});

/** Inline CSS (font, size, colour, highlight, direction) kept as one mark carrying the raw style string. */
export const SpanMark = Mark.create({
  name: 'span',
  priority: 90,
  addAttributes() { return { style: attr('style', 'style'), dir: attr('dir', 'dir', dirOk) }; },
  parseHTML() {
    return [{ tag: 'span', getAttrs: (el) => { if (el.hasAttribute('data-fld')) return false; const style = el.getAttribute('style'); const dir = el.getAttribute('dir'); if (!style && !dirOk(dir)) return false; return { style: style || null, dir: dirOk(dir) ? dir : null }; } }];
  },
  renderHTML({ HTMLAttributes }) { return ['span', HTMLAttributes, 0]; },
});

export const PageBreak = Node.create({
  name: 'pageBreak', group: 'block', atom: true, selectable: true,
  parseHTML() { return [{ tag: 'hr[data-pb]' }]; },
  renderHTML() { return ['hr', { 'data-pb': '1' }]; },
});

export const Field = Node.create({
  name: 'field', group: 'inline', inline: true, atom: true, selectable: true, priority: 1000,
  addAttributes() { return { kind: { default: 'PAGE', parseHTML: (el) => (el.getAttribute('data-fld') === 'NUMPAGES' ? 'NUMPAGES' : 'PAGE') } }; },
  parseHTML() { return [{ tag: 'span[data-fld]' }]; },
  renderHTML({ node }) { return ['span', { 'data-fld': node.attrs.kind, contenteditable: 'false' }, '1']; },
});

const DocImage = Image.extend({
  addAttributes() { return { ...this.parent?.(), dataFl: attr('dataFl', 'data-fl', (v) => v === 'left' || v === 'right'), dxId: { default: null, rendered: false } }; }, // dxId: key of the picture's original in picRegistry (not an HTML attribute, never saved)
  addNodeView() { return imageNodeView; },
});

/** Tab outside lists and tables types a real tab, like Word. */
const TabKey = Extension.create({
  name: 'dxTab', priority: 10,
  addKeyboardShortcuts() { return { Tab: ({ editor }) => editor.commands.insertContent('\t'), 'Shift-Tab': () => true }; },
});

/** `paged` (body editor only): the page-view plugin, see pagination.js */
export function buildExtensions(paged) {
  return [
    StarterKit.configure({ codeBlock: false, code: false, horizontalRule: false, link: { openOnClick: false, autolink: false, HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' } } }),
    SpanMark, Subscript, Superscript, PageBreak, Field, DocImage.configure({ inline: true, allowBase64: true }),
    Table.configure({ resizable: true, lastColumnResizable: true, cellMinWidth: 30 }), TableRow, TableHeader, TableCell,
    SearchExt, BlockAttrs, TabKey,
    ...(paged ? [PageView.configure(paged)] : []),
  ];
}
