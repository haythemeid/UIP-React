import { Extension } from '@tiptap/core';
import { Plugin, PluginKey, TextSelection } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export const searchKey = new PluginKey('dxSearch');

function collect(doc, q, mc) {
  const out = []; if (!q) return out; const needle = mc ? q : q.toLowerCase();
  doc.descendants((node, pos) => {
    if (!node.isTextblock) return true;
    let text = ''; const map = [];
    node.forEach((child, off) => {
      if (child.isText) { for (let i = 0; i < child.text.length; i += 1) { map.push(pos + 1 + off + i); } text += child.text; } else { map.push(pos + 1 + off); text += '\ufffc'; }
    });
    const hay = mc ? text : text.toLowerCase(); let i = hay.indexOf(needle);
    while (i >= 0) { out.push({ from: map[i], to: map[i + needle.length - 1] + 1 }); i = hay.indexOf(needle, i + Math.max(1, needle.length)); }
    return false;
  });
  return out;
}

/** Find & replace: decorations only, the document is untouched until a replace runs. */
export const SearchExt = Extension.create({
  name: 'dxSearch',
  addProseMirrorPlugins() {
    return [new Plugin({
      key: searchKey,
      state: {
        init: () => ({ q: '', mc: false, cur: 0, matches: [] }),
        apply(tr, prev, _o, next) {
          const meta = tr.getMeta(searchKey); let s = prev;
          if (meta) s = { ...prev, ...meta };
          if (meta || tr.docChanged) { const matches = collect(next.doc, s.q, s.mc); s = { ...s, matches, cur: matches.length ? Math.min(s.cur, matches.length - 1) : 0 }; }
          return s;
        },
      },
      props: {
        decorations(state) {
          const s = searchKey.getState(state); if (!s.matches.length) return null;
          return DecorationSet.create(state.doc, s.matches.map((m, i) => Decoration.inline(m.from, m.to, { class: i === s.cur ? 'dx-find dx-find-cur' : 'dx-find' })));
        },
      },
    })];
  },
});

export const searchState = (editor) => searchKey.getState(editor.state);
export function setSearch(editor, patch, jump = false) {
  editor.view.dispatch(editor.state.tr.setMeta(searchKey, patch));
  if (jump) {
    const s = searchState(editor); const m = s.matches[s.cur];
    if (m) editor.view.dispatch(editor.state.tr.setSelection(TextSelection.create(editor.state.doc, m.from, m.to)).scrollIntoView());
  }
}
export function replaceCurrent(editor, text) {
  const s = searchState(editor); const m = s.matches[s.cur]; if (!m) return;
  editor.view.dispatch(editor.state.tr.insertText(text, m.from, m.to));
}
export function replaceAll(editor, text) {
  const s = searchState(editor); if (!s.matches.length) return;
  const tr = editor.state.tr; s.matches.slice().reverse().forEach((m) => tr.insertText(text, m.from, m.to)); editor.view.dispatch(tr);
}
