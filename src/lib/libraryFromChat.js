import { drive } from './driveApi';
import { loadAttachmentBlob } from './chatMedia';
import { kindOf, KIND_BY_KEY, safeName } from './libraryKinds';
import { beginToast } from './transferToast';

/**
 * Chat -> My Library. Stores a chat file as an ordinary My PC file under "My Library/<type>" (same place the Library
 * page's own Upload puts things), so it shows in My Library and My PC and every sharing option works on it.
 */
const LIB_ROOT = 'My Library';
const idOf = (r) => (r?.data ?? r)?.id;
const isAr = () => { try { return document.documentElement.lang === 'ar' || localStorage.getItem('uip_locale') === 'ar'; } catch { return false; } };

export async function saveBlobToLibrary(blob, name) {
  const fileName = safeName(name, 'file');
  const file = blob instanceof File && blob.name === fileName ? blob : new File([blob], fileName, { type: blob.type || '' });
  const pid = idOf(await drive.ensurePath(null, `${LIB_ROOT}/${KIND_BY_KEY[kindOf(fileName)].folder}`));
  await drive.upload(pid, file);
  window.dispatchEvent(new Event('uip-drive-changed'));
}

/** Message attachments (photo / video / file / audio) -> My Library, with a visible progress / result notification. */
export async function saveAttachmentsToLibrary(attachments) {
  const list = (attachments || []).filter((a) => a && a.url && !a.local);
  if (!list.length) return;
  const ar = isAr();
  const nameOf = (a) => a.original_name || `chat-${a.id ?? Date.now()}`;
  const t = beginToast({ title: ar ? 'جارِ الحفظ في مكتبتي…' : 'Saving to My Library…', detail: nameOf(list[0]), total: list.length });
  let ok = 0; const failed = [];
  for (let i = 0; i < list.length; i += 1) {
    const a = list[i];
    t.update({ title: list.length > 1 ? (ar ? `جارِ الحفظ في مكتبتي (${i + 1}/${list.length})…` : `Saving to My Library (${i + 1}/${list.length})…`) : undefined, detail: nameOf(a), done: i });
    try { await saveBlobToLibrary(await loadAttachmentBlob(a.url), nameOf(a)); ok += 1; } catch { failed.push(nameOf(a)); }
  }
  if (ok && !failed.length) t.success(ar ? 'تم الحفظ في مكتبتي' : 'Saved to My Library', ok > 1 ? (ar ? `${ok} ملفات` : `${ok} files`) : nameOf(list[0]));
  else if (ok) t.fail(ar ? `اتحفظ ${ok} وفشل ${failed.length}` : `Saved ${ok}, ${failed.length} failed`, failed.join(', '));
  else t.fail(ar ? 'تعذّر الحفظ في مكتبتي' : 'Could not save to My Library', failed[0] || '');
}
