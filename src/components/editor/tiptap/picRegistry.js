/**
 * Originals of the pictures the user styled in this editing session.
 * A styled picture is BAKED into the bitmap (so the .docx looks the same as the editor), which is lossy: crop, colour and frame
 * would be applied on top of each other. So the untouched original is remembered here (by the picture's `dxId`, never saved in the
 * document) and every change re-renders from the original + the current options. Closing the editor forgets them — the saved .docx
 * simply contains the final picture.
 */
const store = new Map(); // id -> { orig, ops }
let n = 0;
export const newPicId = () => `p${Date.now().toString(36)}${(n += 1).toString(36)}`;
export const picGet = (id) => (id ? store.get(id) : undefined);
export const picSet = (id, rec) => { store.set(id, rec); if (store.size > 60) store.delete(store.keys().next().value); };
export const picClear = () => store.clear();
