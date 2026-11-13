import { CellSelection, TableMap } from '@tiptap/pm/tables';
import { mergeStyle, parseStyle } from './cssUtil';

/** Textblocks (paragraphs / headings) touched by the selection. */
export function blocksIn(state) {
  const out = []; const { from, to } = state.selection;
  state.doc.nodesBetween(from, to, (node, pos) => { if (node.isTextblock) { out.push({ node, pos }); return false; } return true; });
  return out;
}
/** patch(node) -> attrs patch for each selected block. */
export function patchBlocks(editor, patch) {
  const { state, view } = editor; const tr = state.tr;
  blocksIn(state).forEach(({ node, pos }) => { const p = patch(node); if (p) tr.setNodeMarkup(pos, undefined, { ...node.attrs, ...p }); });
  if (tr.docChanged) view.dispatch(tr);
}
export const blockStyle = (props) => (node) => ({ style: mergeStyle(node.attrs.style, props) });

/** Merge CSS props into the inline `span` mark over the selection (or into the stored marks at a caret). */
export function applySpan(editor, props) {
  const { state, view } = editor; const type = state.schema.marks.span; const { selection } = state; const tr = state.tr;
  if (selection.empty) {
    const marks = state.storedMarks || selection.$from.marks(); const cur = marks.find((m) => m.type === type);
    const style = mergeStyle(cur?.attrs.style, props); tr.removeStoredMark(type);
    if (style || cur?.attrs.dir) tr.addStoredMark(type.create({ style, dir: cur?.attrs.dir || null }));
    view.dispatch(tr); return;
  }
  selection.ranges.forEach(({ $from, $to }) => {
    state.doc.nodesBetween($from.pos, $to.pos, (node, pos) => {
      if (!node.isText) return true;
      const a = Math.max(pos, $from.pos); const b = Math.min(pos + node.nodeSize, $to.pos); if (a >= b) return false;
      const cur = node.marks.find((m) => m.type === type); const style = mergeStyle(cur?.attrs.style, props);
      if (style || cur?.attrs.dir) tr.addMark(a, b, type.create({ style, dir: cur?.attrs.dir || null })); else if (cur) tr.removeMark(a, b, type);
      return false;
    });
  });
  view.dispatch(tr);
}

/** The span style at the selection start, as an object. */
export function spanAt(editor) {
  const { state } = editor; const type = state.schema.marks.span;
  const marks = state.selection.empty ? (state.storedMarks || state.selection.$from.marks()) : state.selection.$from.marksAcross(state.selection.$to) || [];
  const m = marks.find((x) => x.type === type) || state.selection.$from.marks().find((x) => x.type === type);
  return parseStyle(m?.attrs.style);
}

const findTable = ($p) => { for (let d = $p.depth; d > 0; d -= 1) if ($p.node(d).type.name === 'table') return { node: $p.node(d), start: $p.start(d) }; return null; };

/** Selected table cells: [{ node, pos }] */
export function cellsIn(state) {
  const out = []; const sel = state.selection;
  if (sel instanceof CellSelection) { sel.forEachCell((node, pos) => out.push({ node, pos })); return out; }
  const $p = sel.$from; for (let d = $p.depth; d > 0; d -= 1) { const n = $p.node(d); if (n.type.name === 'tableCell' || n.type.name === 'tableHeader') { out.push({ node: n, pos: $p.before(d) }); break; } }
  return out;
}
export function patchCells(editor, patch) {
  const { state, view } = editor; const tr = state.tr;
  cellsIn(state).forEach(({ node, pos }) => tr.setNodeMarkup(pos, undefined, { ...node.attrs, ...patch(node) }));
  if (tr.docChanged) view.dispatch(tr);
}
/** Merge the current cell with the next one when only a caret is inside the table (Word-style quick merge). */
export function mergeNext(editor) {
  const { state } = editor;
  if (state.selection instanceof CellSelection) return editor.commands.mergeCells();
  const t = findTable(state.selection.$from); const c = cellsIn(state)[0]; if (!t || !c) return false;
  const map = TableMap.get(t.node); const rel = c.pos - t.start; const r = map.findCell(rel);
  if (r.right >= map.width) return false;
  const next = map.map[r.top * map.width + r.right] + t.start;
  const sel = CellSelection.create(state.doc, c.pos, next); editor.view.dispatch(state.tr.setSelection(sel));
  return editor.commands.mergeCells();
}
