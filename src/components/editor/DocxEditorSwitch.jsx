import { lazy, useState } from 'react';

const Modern = lazy(() => import('./DocxTiptap'));
const Legacy = lazy(() => import('./DocxView'));
const KEY = 'uip.docx.engine';
const read = () => { try { return localStorage.getItem(KEY) === 'legacy' ? 'legacy' : 'tiptap'; } catch { return 'tiptap'; } };

/** Word editor entry: the Tiptap editor by default, with a one-click way back to the previous editor (and again forward). */
export default function DocxEditorSwitch(props) {
  const [engine, setEngine] = useState(read);
  const go = (to) => () => { try { localStorage.setItem(KEY, to); } catch { /* private mode */ } setEngine(to); };
  return engine === 'legacy' ? <Legacy {...props} onModern={go('tiptap')} /> : <Modern {...props} onLegacy={go('legacy')} />;
}
