import { useRef } from 'react';
import { twToPx } from './docxEdit';

/** Horizontal ruler above the page (cm ticks). Drag the two markers to change the left / right page margins. */
export default function DocxRuler({ pg, zoom, onMargins }) {
  const ref = useRef(null); const W = twToPx(pg.w) * zoom; const PX_CM = 37.7953 * zoom;
  const drag = (side) => (e) => {
    e.preventDefault(); const startX = e.clientX; const start = pg[side];
    const move = (ev) => {
      const dx = (ev.clientX - startX) / zoom; const tw = Math.round((side === 'left' ? start + dx * 15 : start - dx * 15) / 28.35) * 28.35;
      const max = pg.w - (side === 'left' ? pg.right : pg.left) - 1440; onMargins({ [side]: Math.round(Math.max(360, Math.min(max, tw))) }, false);
    };
    const up = () => { document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', up); onMargins({}, true); };
    document.addEventListener('pointermove', move); document.addEventListener('pointerup', up);
  };
  const cms = Math.floor(W / PX_CM);
  return (
    <div className="dxruler" style={{ width: W }} ref={ref} aria-hidden="true">
      <div className="dxruler__m" style={{ left: 0, width: twToPx(pg.left) * zoom }} />
      <div className="dxruler__m" style={{ right: 0, width: twToPx(pg.right) * zoom }} />
      {Array.from({ length: cms + 1 }, (_, i) => <span key={i} className="dxruler__t" style={{ left: i * PX_CM }}>{i > 0 && i < cms ? i : ''}</span>)}
      <i className="dxruler__h" style={{ left: twToPx(pg.left) * zoom - 5 }} onPointerDown={drag('left')} title="Left margin" />
      <i className="dxruler__h" style={{ left: W - twToPx(pg.right) * zoom - 5 }} onPointerDown={drag('right')} title="Right margin" />
    </div>
  );
}
