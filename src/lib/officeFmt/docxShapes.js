/**
 * Built-in illustrations of the Word editor: shapes, badges, icons and divider lines. Each is plain SVG with a colour token,
 * rasterised to PNG when inserted (a .docx picture), so it looks identical in Word. To add one, add a line to SHAPES / ICONS / DIVIDERS.
 *   SHAPE_SETS -> [{ id, label:{en,ar}, items:[{ id, label:{en,ar}, vb:[w,h], body(c, c2) }] }]
 *   svgOf(item, color, color2) -> svg string      svgToPicture(svg, vb, { width }) -> Promise<{ src, w, h }>
 */
const f = (c) => `fill="${c}"`;
const poly = (pts) => (c) => `<polygon points="${pts}" ${f(c)} stroke-linejoin="round"/>`;
const SQ = [100, 100];
const SHAPES = [
  { id: 'square', en: 'Square', ar: 'مربع', vb: SQ, body: (c) => `<rect x="6" y="6" width="88" height="88" ${f(c)}/>` },
  { id: 'rounded', en: 'Rounded square', ar: 'مربع مدور', vb: SQ, body: (c) => `<rect x="6" y="6" width="88" height="88" rx="20" ${f(c)}/>` },
  { id: 'circle', en: 'Circle', ar: 'دائرة', vb: SQ, body: (c) => `<circle cx="50" cy="50" r="45" ${f(c)}/>` },
  { id: 'triangle', en: 'Triangle', ar: 'مثلث', vb: SQ, body: poly('50,7 95,91 5,91') },
  { id: 'diamond', en: 'Diamond', ar: 'معين', vb: SQ, body: poly('50,4 96,50 50,96 4,50') },
  { id: 'star', en: 'Star', ar: 'نجمة', vb: SQ, body: poly('50,5 62,37 96,38 69,59 79,92 50,72 21,92 31,59 4,38 38,37') },
  { id: 'hexagon', en: 'Hexagon', ar: 'سداسي', vb: SQ, body: poly('50,4 92,27 92,73 50,96 8,73 8,27') },
  { id: 'heart', en: 'Heart', ar: 'قلب', vb: SQ, body: (c) => `<path d="M50 90C20 66 6 50 6 32A22 22 0 0 1 50 26 22 22 0 0 1 94 32C94 50 80 66 50 90Z" ${f(c)}/>` },
  { id: 'arrow-r', en: 'Arrow →', ar: 'سهم ←', vb: SQ, body: poly('6,36 56,36 56,14 95,50 56,86 56,64 6,64') },
  { id: 'arrow-l', en: 'Arrow ←', ar: 'سهم →', vb: SQ, body: poly('94,36 44,36 44,14 5,50 44,86 44,64 94,64') },
  { id: 'arrow-u', en: 'Arrow ↑', ar: 'سهم ↑', vb: SQ, body: poly('36,94 36,44 14,44 50,5 86,44 64,44 64,94') },
  { id: 'chevron', en: 'Chevron', ar: 'شيفرون', vb: SQ, body: poly('14,8 60,8 90,50 60,92 14,92 44,50') },
  { id: 'bubble', en: 'Speech bubble', ar: 'فقاعة كلام', vb: SQ, body: (c) => `<path d="M12 12h76a8 8 0 0 1 8 8v44a8 8 0 0 1-8 8H44L24 92V72H12a8 8 0 0 1-8-8V20a8 8 0 0 1 8-8Z" ${f(c)}/>` },
  { id: 'check', en: 'Check badge', ar: 'علامة صح', vb: SQ, body: (c) => `<circle cx="50" cy="50" r="45" ${f(c)}/><path d="m28 52 15 15 29-31" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>` },
  { id: 'cross', en: 'Cross badge', ar: 'علامة خطأ', vb: SQ, body: (c) => `<circle cx="50" cy="50" r="45" ${f(c)}/><path d="m33 33 34 34M67 33 33 67" stroke="#fff" stroke-width="9" stroke-linecap="round"/>` },
  { id: 'info', en: 'Info badge', ar: 'معلومة', vb: SQ, body: (c) => `<circle cx="50" cy="50" r="45" ${f(c)}/><path d="M50 44v28" stroke="#fff" stroke-width="9" stroke-linecap="round"/><circle cx="50" cy="29" r="5.5" fill="#fff"/>` },
  { id: 'warn', en: 'Warning', ar: 'تحذير', vb: SQ, body: (c) => `<path d="M50 7 95 90H5Z" ${f(c)} stroke="${c}" stroke-width="6" stroke-linejoin="round"/><path d="M50 36v28" stroke="#fff" stroke-width="8" stroke-linecap="round"/><circle cx="50" cy="77" r="5" fill="#fff"/>` },
  { id: 'pill', en: 'Pill', ar: 'كبسولة', vb: [200, 64], body: (c) => `<rect x="3" y="3" width="194" height="58" rx="29" ${f(c)}/>` },
  { id: 'ribbon', en: 'Ribbon banner', ar: 'شريط', vb: [240, 72], body: (c, c2) => `<polygon points="0,14 36,14 36,58 0,58 18,36" fill="${c2}"/><polygon points="240,14 204,14 204,58 240,58 222,36" fill="${c2}"/><rect x="26" y="6" width="188" height="48" ${f(c)}/>` },
  { id: 'seal', en: 'Seal', ar: 'ختم', vb: SQ, body: (c, c2) => `<polygon points="50,3 59,14 72,9 76,22 90,24 88,38 98,48 90,58 94,72 80,76 76,90 62,88 50,97 38,88 24,90 20,76 6,72 10,58 2,48 12,38 10,24 24,22 28,9 41,14" ${f(c)}/><circle cx="50" cy="50" r="30" fill="none" stroke="${c2}" stroke-width="4"/><path d="m36 51 10 10 19-21" fill="none" stroke="${c2}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>` },
];

const ic = (d) => (c) => `<g fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</g>`;
const V24 = [24, 24];
const ICONS = [
  { id: 'i-info', en: 'Info', ar: 'معلومة', vb: V24, body: ic('<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.8h.01"/>') },
  { id: 'i-warn', en: 'Warning', ar: 'تنبيه', vb: V24, body: ic('<path d="M12 3 2.5 20h19Z"/><path d="M12 10v4.5M12 17.5h.01"/>') },
  { id: 'i-bulb', en: 'Idea', ar: 'فكرة', vb: V24, body: ic('<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.4 1.1 2.2h5c0-.8.4-1.6 1.1-2.2A6 6 0 0 0 12 3Z"/>') },
  { id: 'i-book', en: 'Book', ar: 'كتاب', vb: V24, body: ic('<path d="M3 5h6a3 3 0 0 1 3 3v12a2.5 2.5 0 0 0-2.5-2.5H3Z"/><path d="M21 5h-6a3 3 0 0 0-3 3v12a2.5 2.5 0 0 1 2.5-2.5H21Z"/>') },
  { id: 'i-cap', en: 'Graduation', ar: 'تخرج', vb: V24, body: ic('<path d="M22 9 12 4 2 9l10 5 10-5Z"/><path d="M6 11.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5M22 9v6"/>') },
  { id: 'i-cal', en: 'Calendar', ar: 'تقويم', vb: V24, body: ic('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>') },
  { id: 'i-mail', en: 'Mail', ar: 'بريد', vb: V24, body: ic('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>') },
  { id: 'i-phone', en: 'Phone', ar: 'هاتف', vb: V24, body: ic('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/>') },
  { id: 'i-pin', en: 'Location', ar: 'موقع', vb: V24, body: ic('<path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/>') },
  { id: 'i-user', en: 'Person', ar: 'شخص', vb: V24, body: ic('<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>') },
  { id: 'i-users', en: 'Team', ar: 'فريق', vb: V24, body: ic('<circle cx="9" cy="8" r="3"/><path d="M2 20c0-3.3 3-5 7-5s7 1.7 7 5"/><circle cx="17" cy="8" r="3"/><path d="M15 15.2c3-.3 5.5 1.4 5.5 4.8"/>') },
  { id: 'i-clock', en: 'Time', ar: 'وقت', vb: V24, body: ic('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>') },
  { id: 'i-award', en: 'Award', ar: 'جائزة', vb: V24, body: ic('<circle cx="12" cy="9" r="6"/><path d="m8.5 14 -1.5 7 5-3 5 3-1.5-7"/>') },
  { id: 'i-chart', en: 'Chart', ar: 'رسم بياني', vb: V24, body: ic('<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>') },
  { id: 'i-target', en: 'Target', ar: 'هدف', vb: V24, body: ic('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>') },
  { id: 'i-flag', en: 'Flag', ar: 'علم', vb: V24, body: ic('<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>') },
  { id: 'i-lock', en: 'Lock', ar: 'قفل', vb: V24, body: ic('<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>') },
  { id: 'i-shield', en: 'Security', ar: 'حماية', vb: V24, body: ic('<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6Z"/><path d="m9 12 2 2 4-4"/>') },
  { id: 'i-globe', en: 'Web', ar: 'ويب', vb: V24, body: ic('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>') },
  { id: 'i-rocket', en: 'Launch', ar: 'إطلاق', vb: V24, body: ic('<path d="M12 3c4 1 7 5 6 11l-4 3-4-4-4-4 3-4c1-1 2-2 3-2Z"/><path d="M7 14c-2 .5-3 2-3 5 3 0 4.5-1 5-3M15 8h.01"/>') },
  { id: 'i-gear', en: 'Settings', ar: 'إعدادات', vb: V24, body: ic('<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/>') },
  { id: 'i-quote', en: 'Quote', ar: 'اقتباس', vb: V24, body: ic('<path d="M9 7H5v6h4c0 3-1 4-4 5M19 7h-4v6h4c0 3-1 4-4 5"/>') },
  { id: 'i-clip', en: 'Clipboard', ar: 'قائمة', vb: V24, body: ic('<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4h6v3H9zM9 12h6M9 16h4"/>') },
  { id: 'i-code', en: 'Code', ar: 'كود', vb: V24, body: ic('<path d="m8 8-5 4 5 4M16 8l5 4-5 4M14 5l-4 14"/>') },
  { id: 'i-heart', en: 'Heart', ar: 'قلب', vb: V24, body: ic('<path d="M12 20S3 14.5 3 8.8A4.8 4.8 0 0 1 12 6.5a4.8 4.8 0 0 1 9 2.3C21 14.5 12 20 12 20Z"/>') },
];

const wave = (n, amp = 6, w = 600) => { let d = `M0 12`; const step = w / n; for (let i = 0; i < n; i += 1) d += ` q ${step / 4} ${i % 2 ? amp : -amp} ${step / 2} 0 t ${step / 2} 0`; return d; };
const VD = [600, 24];
const DIVIDERS = [
  { id: 'd-solid', en: 'Line', ar: 'خط', vb: VD, body: (c) => `<line x1="0" y1="12" x2="600" y2="12" stroke="${c}" stroke-width="2"/>` },
  { id: 'd-thick', en: 'Thick line', ar: 'خط سميك', vb: VD, body: (c) => `<line x1="0" y1="12" x2="600" y2="12" stroke="${c}" stroke-width="6"/>` },
  { id: 'd-double', en: 'Double line', ar: 'خط مزدوج', vb: VD, body: (c) => `<line x1="0" y1="8" x2="600" y2="8" stroke="${c}" stroke-width="2"/><line x1="0" y1="16" x2="600" y2="16" stroke="${c}" stroke-width="2"/>` },
  { id: 'd-dash', en: 'Dashed', ar: 'متقطع', vb: VD, body: (c) => `<line x1="0" y1="12" x2="600" y2="12" stroke="${c}" stroke-width="3" stroke-dasharray="14 9"/>` },
  { id: 'd-dot', en: 'Dotted', ar: 'نقاط', vb: VD, body: (c) => `<line x1="3" y1="12" x2="597" y2="12" stroke="${c}" stroke-width="5" stroke-linecap="round" stroke-dasharray="0 12"/>` },
  { id: 'd-wave', en: 'Wave', ar: 'موجة', vb: VD, body: (c) => `<path d="${wave(20)}" fill="none" stroke="${c}" stroke-width="2.5" stroke-linecap="round"/>` },
  { id: 'd-fade', en: 'Fading line', ar: 'خط متلاشي', vb: VD, body: (c) => `<defs><linearGradient id="g"><stop offset="0" stop-color="${c}" stop-opacity="0"/><stop offset=".5" stop-color="${c}"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></linearGradient></defs><rect x="0" y="10" width="600" height="4" fill="url(#g)"/>` },
  { id: 'd-orn', en: 'Ornament', ar: 'زخرفة', vb: VD, body: (c) => `<line x1="0" y1="12" x2="270" y2="12" stroke="${c}" stroke-width="2"/><line x1="330" y1="12" x2="600" y2="12" stroke="${c}" stroke-width="2"/><polygon points="300,2 312,12 300,22 288,12" fill="${c}"/><circle cx="276" cy="12" r="3" fill="${c}"/><circle cx="324" cy="12" r="3" fill="${c}"/>` },
  { id: 'd-stars', en: 'Stars', ar: 'نجوم', vb: VD, body: (c) => `<line x1="0" y1="12" x2="250" y2="12" stroke="${c}" stroke-width="1.5"/><line x1="350" y1="12" x2="600" y2="12" stroke="${c}" stroke-width="1.5"/>${[270, 300, 330].map((x) => `<polygon points="${x},4 ${x + 2.5},9.5 ${x + 8},9.7 ${x + 3.7},13.2 ${x + 5},19 ${x},15.8 ${x - 5},19 ${x - 3.7},13.2 ${x - 8},9.7 ${x - 2.5},9.5" fill="${c}"/>`).join('')}` },
];

export const SHAPE_SETS = [
  { id: 'shapes', label: { en: 'Shapes & badges', ar: 'أشكال وشارات' }, items: SHAPES, colour2: true },
  { id: 'icons', label: { en: 'Icons', ar: 'أيقونات' }, items: ICONS },
  { id: 'dividers', label: { en: 'Divider lines', ar: 'خطوط فاصلة' }, items: DIVIDERS, wide: true },
].map((s) => ({ ...s, items: s.items.map((i) => ({ ...i, label: { en: i.en, ar: i.ar } })) }));

export const svgOf = (item, c = '#1F3864', c2 = '#ffffff') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${item.vb[0]} ${item.vb[1]}" width="${item.vb[0]}" height="${item.vb[1]}">${item.body(c, c2)}</svg>`;

/** SVG -> PNG data URL (width in px; 2x oversampling so it stays sharp when printed) */
export function svgToPicture(svg, vb, { width = 120 } = {}) {
  return new Promise((resolve, reject) => {
    const img = new Image(); const w = Math.round(width * 2); const h = Math.round((w * vb[1]) / vb[0]);
    img.onload = () => { const c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(img, 0, 0, w, h); resolve({ src: c.toDataURL('image/png'), w: width, h: Math.round((width * vb[1]) / vb[0]) }); };
    img.onerror = () => reject(new Error('svg'));
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
}
