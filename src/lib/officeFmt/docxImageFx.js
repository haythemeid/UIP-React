/**
 * Picture engine of the Word editor. Every effect is BAKED into the bitmap (crop, rotate, flip, colour, rounded / circle shape,
 * border, frame, shadow), so what you see in the editor is exactly what the .docx contains — Word-only effects that a
 * HTML → docx writer cannot express would just disappear on save.
 *   renderImage(src, ops, { maxSide, quality }) -> Promise<{ src, w, h }>
 *   ops = { rot, flipH, flipV, crop:{ ratio, zoom, cx, cy }, adj:{ brightness, contrast, saturate, gray, sepia, blur },
 *           shape:'rect'|'round'|'circle', radius, border:{ w, color }, frame:{ w, bottom, color, radius, border:{ w, color } }, shadow:{ blur, dy, alpha } }
 */
export const loadImage = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('img')); i.src = src; });
const cv = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; };
export const DEFAULT_ADJ = { brightness: 100, contrast: 100, saturate: 100, gray: 0, sepia: 0, blur: 0 };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function colourMatrix(px, a) {
  const br = a.brightness / 100; const co = a.contrast / 100; const sa = a.saturate / 100; const gr = a.gray / 100; const se = a.sepia / 100;
  const d = px.data;
  for (let i = 0; i < d.length; i += 4) {
    let r = d[i]; let g = d[i + 1]; let b = d[i + 2];
    r *= br; g *= br; b *= br;
    r = (r - 128) * co + 128; g = (g - 128) * co + 128; b = (b - 128) * co + 128;
    const l = 0.299 * r + 0.587 * g + 0.114 * b;
    r = l + (r - l) * sa; g = l + (g - l) * sa; b = l + (b - l) * sa;
    if (gr) { r += (l - r) * gr; g += (l - g) * gr; b += (l - b) * gr; }
    if (se) { const sr = 0.393 * r + 0.769 * g + 0.189 * b; const sg = 0.349 * r + 0.686 * g + 0.168 * b; const sb = 0.272 * r + 0.534 * g + 0.131 * b; r += (sr - r) * se; g += (sg - g) * se; b += (sb - b) * se; }
    d[i] = clamp(r, 0, 255); d[i + 1] = clamp(g, 0, 255); d[i + 2] = clamp(b, 0, 255);
  }
}
const isDefaultAdj = (a) => !a || (a.brightness === 100 && a.contrast === 100 && a.saturate === 100 && !a.gray && !a.sepia && !a.blur);

function shapePath(ctx, x, y, w, h, shape, radius) {
  ctx.beginPath();
  if (shape === 'circle') ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
  else if (shape === 'round') { const r = Math.min(radius, w / 2, h / 2); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); } else ctx.rect(x, y, w, h);
}

export async function renderImage(src, ops = {}, { maxSide = 1600, quality = 0.92 } = {}) {
  const img = await loadImage(src); const nw = img.naturalWidth || img.width; const nh = img.naturalHeight || img.height;
  const rot = ((ops.rot || 0) % 360 + 360) % 360; const swap = rot === 90 || rot === 270;
  // 1) rotate / flip into a work canvas
  const rw = swap ? nh : nw; const rh = swap ? nw : nh; const work = cv(rw, rh); const wx = work.getContext('2d', { willReadFrequently: true });
  wx.translate(rw / 2, rh / 2); wx.rotate((rot * Math.PI) / 180); wx.scale(ops.flipH ? -1 : 1, ops.flipV ? -1 : 1); wx.drawImage(img, -nw / 2, -nh / 2, nw, nh);
  // 2) colour
  const adj = { ...DEFAULT_ADJ, ...(ops.adj || {}) };
  if (!isDefaultAdj(adj)) {
    if (adj.brightness !== 100 || adj.contrast !== 100 || adj.saturate !== 100 || adj.gray || adj.sepia) { const px = wx.getImageData(0, 0, rw, rh); colourMatrix(px, adj); wx.putImageData(px, 0, 0); }
    if (adj.blur > 0 && 'filter' in wx) { const t = cv(rw, rh); const tx = t.getContext('2d'); tx.filter = `blur(${adj.blur}px)`; tx.drawImage(work, 0, 0); wx.clearRect(0, 0, rw, rh); wx.drawImage(t, 0, 0); }
  }
  // 3) crop rectangle in work-canvas pixels
  const c = ops.crop || {}; const zoom = Math.max(1, c.zoom || 1); let cw = rw; let ch = rh;
  if (c.ratio) { if (rw / rh > c.ratio) cw = rh * c.ratio; else ch = rw / c.ratio; }
  cw /= zoom; ch /= zoom;
  const sx = clamp((c.cx ?? 0.5) * rw - cw / 2, 0, rw - cw); const sy = clamp((c.cy ?? 0.5) * rh - ch / 2, 0, rh - ch);
  const k = Math.min(1, maxSide / Math.max(cw, ch)); const iw = Math.max(1, Math.round(cw * k)); const ih = Math.max(1, Math.round(ch * k));
  // 4) frame (white mat / polaroid) and shadow margins
  const fr = ops.frame; const fw = fr ? Math.round(fr.w * (iw / 600 + 0.6)) : 0; const fb = fr ? Math.round((fr.bottom || fr.w) * (iw / 600 + 0.6)) : 0;
  const sh = ops.shadow; const sm = sh ? Math.ceil(sh.blur * 1.6 + Math.abs(sh.dy || 0)) : 0;
  const W = iw + fw * 2 + sm * 2; const H = ih + fw + fb + sm * 2; const out = cv(W, H); const o = out.getContext('2d');
  const bw = ops.border ? Math.round(ops.border.w * (iw / 600 + 0.6)) : 0;
  const shape = ops.shape || 'rect'; const radius = (ops.radius || 0) * (Math.min(iw, ih) / 100);
  if (fr) { // the mat
    const frR = (fr.radius || 0) * (Math.min(W, H) / 100);
    o.save(); if (sh) { o.shadowColor = `rgba(0,0,0,${sh.alpha ?? 0.35})`; o.shadowBlur = sh.blur; o.shadowOffsetY = sh.dy || 0; }
    shapePath(o, sm, sm, W - sm * 2, H - sm * 2, frR ? 'round' : 'rect', frR); o.fillStyle = fr.color || '#ffffff'; o.fill(); o.restore();
    if (fr.border) { o.save(); shapePath(o, sm, sm, W - sm * 2, H - sm * 2, frR ? 'round' : 'rect', frR); o.lineWidth = fr.border.w * 2; o.strokeStyle = fr.border.color; o.clip(); o.stroke(); o.restore(); }
  } else if (sh) { // shadow of the (shaped) picture itself
    o.save(); o.shadowColor = `rgba(0,0,0,${sh.alpha ?? 0.35})`; o.shadowBlur = sh.blur; o.shadowOffsetY = sh.dy || 0; shapePath(o, sm, sm, iw, ih, shape, radius); o.fillStyle = '#fff'; o.fill(); o.restore();
  }
  const ix = sm + fw; const iy = sm + fw;
  o.save(); shapePath(o, ix, iy, iw, ih, shape, radius); o.clip(); o.drawImage(work, sx, sy, cw, ch, ix, iy, iw, ih); o.restore();
  if (bw) { o.save(); shapePath(o, ix, iy, iw, ih, shape, radius); o.clip(); shapePath(o, ix, iy, iw, ih, shape, radius); o.lineWidth = bw * 2; o.strokeStyle = ops.border.color; o.stroke(); o.restore(); }
  const transparent = shape !== 'rect' || !!sh || (fr && fr.radius);
  const jpeg = !transparent && /^data:image\/jpe?g/i.test(src);
  return { src: out.toDataURL(jpeg ? 'image/jpeg' : 'image/png', quality), w: W, h: H };
}

/* ------------------------------------------------------------------ ready-made picture styles (the gallery of the Picture tab) */
const ACC = '#1F3864';
export const PIC_STYLES = [
  { id: 'plain', label: { en: 'No style', ar: 'بدون' }, ops: {} },
  { id: 'thin', label: { en: 'Thin border', ar: 'حد رفيع' }, ops: { border: { w: 3, color: '#334155' } } },
  { id: 'thick', label: { en: 'Thick border', ar: 'حد سميك' }, ops: { border: { w: 9, color: ACC } } },
  { id: 'round', label: { en: 'Rounded', ar: 'زوايا مدورة' }, ops: { shape: 'round', radius: 9 } },
  { id: 'roundb', label: { en: 'Rounded + border', ar: 'مدور بحد' }, ops: { shape: 'round', radius: 9, border: { w: 6, color: ACC } } },
  { id: 'circle', label: { en: 'Circle', ar: 'دائرة' }, ops: { shape: 'circle', crop: { ratio: 1 } } },
  { id: 'circleb', label: { en: 'Circle + border', ar: 'دائرة بحد' }, ops: { shape: 'circle', crop: { ratio: 1 }, border: { w: 8, color: '#c9a227' } } },
  { id: 'shadow', label: { en: 'Soft shadow', ar: 'ظل ناعم' }, ops: { shadow: { blur: 22, dy: 8, alpha: 0.38 } } },
  { id: 'frame', label: { en: 'White frame', ar: 'إطار أبيض' }, ops: { frame: { w: 18, color: '#ffffff' }, shadow: { blur: 22, dy: 8, alpha: 0.35 } } },
  { id: 'polaroid', label: { en: 'Polaroid', ar: 'بولارويد' }, ops: { frame: { w: 20, bottom: 74, color: '#ffffff' }, shadow: { blur: 22, dy: 8, alpha: 0.35 } } },
  { id: 'double', label: { en: 'Double frame', ar: 'إطار مزدوج' }, ops: { frame: { w: 14, color: '#ffffff', border: { w: 4, color: ACC } } } },
  { id: 'gold', label: { en: 'Gold frame', ar: 'إطار ذهبي' }, ops: { frame: { w: 16, color: '#f6e7b4', border: { w: 5, color: '#b8891a' } } } },
  { id: 'mono', label: { en: 'Black & white', ar: 'أبيض وأسود' }, ops: { adj: { gray: 100 } } },
  { id: 'sepia', label: { en: 'Vintage', ar: 'قديم' }, ops: { adj: { sepia: 80, contrast: 105 }, border: { w: 4, color: '#6b4f2a' } } },
];
export const ASPECTS = [[0, { en: 'Original', ar: 'الأصلي' }], [1, { en: '1 : 1', ar: '١ : ١' }], [4 / 3, { en: '4 : 3', ar: '٤ : ٣' }], [3 / 2, { en: '3 : 2', ar: '٣ : ٢' }], [16 / 9, { en: '16 : 9', ar: '١٦ : ٩' }], [3 / 4, { en: '3 : 4', ar: '٣ : ٤' }], [9 / 16, { en: '9 : 16', ar: '٩ : ١٦' }]];

/** a picture file -> data URL scaled to `maxSide` (keeps PNG transparency, everything else becomes JPEG when large) */
export async function fileToPicture(file, maxSide = 1800) {
  if (!file || !/^image\//.test(file.type)) throw new Error('type');
  if (file.size > 20 * 1024 * 1024) throw new Error('size');
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url); const k = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    if (k === 1 && file.size < 1.5 * 1024 * 1024) return { src: await new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(file); }), w: img.naturalWidth, h: img.naturalHeight };
    const c = cv(img.naturalWidth * k, img.naturalHeight * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return { src: c.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.9), w: c.width, h: c.height };
  } finally { URL.revokeObjectURL(url); }
}
