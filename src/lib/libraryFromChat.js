import { drive } from './driveApi';
import { loadAttachmentBlob } from './chatMedia';
import { kindOf, KIND_BY_KEY, safeName } from './libraryKinds';
import { showToast } from '../native';

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

function report(ok, failed) {
  const ar = isAr();
  if (ok && !failed) showToast(ar ? `تم الحفظ في مكتبتي${ok > 1 ? ` (${ok} ملفات)` : ''}` : `Saved to My Library${ok > 1 ? ` (${ok} files)` : ''}`);
  else if (ok) showToast(ar ? `اتحفظ ${ok} وفشل ${failed}` : `Saved ${ok}, ${failed} failed`);
  else showToast(ar ? 'تعذّر الحفظ في مكتبتي، جرّب تاني' : 'Could not save to My Library, try again');
}

/** Message attachments (photo / video / file / audio) -> My Library. */
export async function saveAttachmentsToLibrary(attachments) {
  const list = (attachments || []).filter((a) => a && a.url && !a.local);
  let ok = 0; let failed = 0;
  for (const a of list) {
    try { await saveBlobToLibrary(await loadAttachmentBlob(a.url), a.original_name || `chat-${a.id ?? Date.now()}`); ok += 1; } catch { failed += 1; }
  }
  if (list.length) report(ok, failed);
}
