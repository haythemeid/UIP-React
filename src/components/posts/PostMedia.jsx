import { lazy, Suspense, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from '../Icon';
import VideoPlayer from '../VideoPlayer';
import VoiceMessage from '../messaging/VoiceMessage';
import { useLanguage } from '../../context/LanguageContext';
import { api } from '../../api/client';
import { fmtBytes, fmtDuration, useMediaUrl, useSignedUrl } from '../../lib/postMedia';
import PdfCarousel from './PdfCarousel';
import CodeCard from './CodeCard';

const PdfFull = lazy(() => import('./PdfFull'));

function Img({ m, onOpen, className = '' }) {
  const thumb = useMediaUrl(m, m.has_thumbnail ? 'thumbnail' : 'file');
  return (
    <button type="button" className={`pp-img ${className}`} onClick={() => onOpen(m)} style={m.width && m.height ? { aspectRatio: `${m.width}/${m.height}` } : undefined}>
      {thumb.url ? <img src={thumb.url} alt={m.alt_text || m.original_name} loading="lazy" /> : <span className={thumb.error ? 'pp-img__err' : 'pp-skel'}>{thumb.error && <Icon name="image" size={28} />}</span>}
    </button>
  );
}

function Lightbox({ items, start, onClose }) {
  const [i, setI] = useState(start);
  const m = items[i];
  const full = useMediaUrl(m, 'file');
  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') onClose(); if (e.key === 'ArrowRight') setI((v) => Math.min(items.length - 1, v + 1)); if (e.key === 'ArrowLeft') setI((v) => Math.max(0, v - 1)); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [items.length, onClose]);
  return createPortal(
    <div className="pp-lb" role="dialog" aria-modal="true" onClick={onClose}>
      <button type="button" className="pp-lb__x" onClick={onClose} aria-label="Close"><Icon name="x" size={22} /></button>
      {i > 0 && <button type="button" className="pp-lb__nav is-prev" onClick={(e) => { e.stopPropagation(); setI(i - 1); }}><Icon name="chevron-left" size={26} /></button>}
      {i < items.length - 1 && <button type="button" className="pp-lb__nav is-next" onClick={(e) => { e.stopPropagation(); setI(i + 1); }}><Icon name="chevron-right" size={26} /></button>}
      <div className="pp-lb__body" onClick={(e) => e.stopPropagation()}>
        {full.url ? <img src={full.url} alt={m.alt_text || m.original_name} /> : <span className="pp-skel" style={{ width: 240, height: 240 }} />}
        {m.caption && <p>{m.caption}</p>}
      </div>
    </div>, document.body);
}

function Video({ m }) {
  const [play, setPlay] = useState(false);
  const poster = useMediaUrl(m, 'thumbnail');
  const src = useSignedUrl(m, 'file', play);
  return (
    <div className="pp-video" style={m.width && m.height ? { aspectRatio: `${m.width}/${m.height}`, maxHeight: 560 } : undefined}>
      {play && src.url ? <VideoPlayer src={src.url} poster={poster.url || undefined} autoPlay />
        : (
          <button type="button" className="pp-video__cover" onClick={() => setPlay(true)} aria-label="Play">
            {poster.url ? <img src={poster.url} alt="" /> : <span className="pp-skel" />}
            <span className="pp-doc__play"><Icon name="play" size={24} /></span>
            {m.duration_seconds ? <span className="pp-video__dur">{fmtDuration(m.duration_seconds)}</span> : null}
            {play && !src.url && !src.error && <span className="pp-doc__spin" />}
            {src.error && <span className="pp-doc__err">!</span>}
          </button>
        )}
    </div>
  );
}

function Audio({ m }) {
  const [go, setGo] = useState(false);
  const src = useSignedUrl(m, 'file', go);
  return (
    <div className="pp-audio">
      <span className="pp-audio__ico"><Icon name="audio-wave" size={20} /></span>
      <div className="pp-audio__main">
        <strong dir="ltr">{m.original_name}</strong>
        {go && src.url
          ? <VoiceMessage src={src.url} duration={m.duration_seconds} name={m.original_name} downloadable={false} />
          : <button type="button" className="pp-btn" onClick={() => setGo(true)}><Icon name="play" size={14} /> {m.duration_seconds ? fmtDuration(m.duration_seconds) : 'Play'}</button>}
      </div>
    </div>
  );
}

function FileCard({ m, canDownload }) {
  const { locale } = useLanguage();
  const [busy, setBusy] = useState(false);
  const dl = async () => {
    setBusy(true);
    try {
      const res = await api.blob(m.urls.download); const blob = await res.blob();
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = m.original_name; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    } catch { /* download blocked by the author */ } finally { setBusy(false); }
  };
  return (
    <div className="pp-file">
      <span className="pp-file__ico"><Icon name={m.kind === 'archive' ? 'folder' : 'file'} size={22} /></span>
      <div className="pp-file__main"><strong dir="ltr">{m.original_name}</strong><small>{(m.extension || '').toUpperCase()} · {fmtBytes(m.size_bytes)}</small></div>
      {canDownload && <button type="button" className="pp-btn" onClick={dl} disabled={busy}><Icon name="download" size={14} /> {locale === 'ar' ? 'تنزيل' : 'Download'}</button>}
    </div>
  );
}

/** Renders a post's attachments by kind: image grid + lightbox, video, audio, PDF/Office carousel, runnable code, other files. */
export default function PostMedia({ media = [], canDownload = true, canRun = true }) {
  const [lb, setLb] = useState(null);
  const [full, setFull] = useState(null);
  if (!media.length) return null;
  const images = media.filter((m) => m.kind === 'image');
  const rest = media.filter((m) => m.kind !== 'image');
  const shown = images.slice(0, 4);
  return (
    <div className="pp-media">
      {images.length > 0 && (
        <div className={`pp-grid is-${Math.min(images.length, 4)}`}>
          {shown.map((m, i) => (
            <div key={m.id} className="pp-grid__c">
              <Img m={m} onOpen={() => setLb(images.indexOf(m))} />
              {i === 3 && images.length > 4 && <span className="pp-grid__more">+{images.length - 4}</span>}
            </div>
          ))}
        </div>
      )}
      {rest.map((m) => {
        if (m.kind === 'video') return <Video key={m.id} m={m} />;
        if (m.kind === 'audio') return <Audio key={m.id} m={m} />;
        if (m.kind === 'pdf' || (m.has_preview && m.kind === 'document')) return <PdfCarousel key={m.id} media={m} onOpenFull={(mm, p) => setFull({ media: mm, page: p })} />;
        if (m.kind === 'code' || m.is_text) return <CodeCard key={m.id} canRun={canRun} media={{ ...m, urls: { ...m.urls, download: canDownload ? m.urls.download : null } }} />;
        return <FileCard key={m.id} m={m} canDownload={canDownload} />;
      })}
      {lb != null && <Lightbox items={images} start={lb} onClose={() => setLb(null)} />}
      {full && <Suspense fallback={null}><PdfFull media={full.media} page={full.page} onClose={() => setFull(null)} /></Suspense>}
    </div>
  );
}
