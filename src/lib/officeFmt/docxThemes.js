/**
 * Document themes (Design tab): body font + heading font + heading colours + accent (table headers, banners) + soft tint.
 * To add a theme add one object to DOC_THEMES. Applying a theme recolours headings / title and dark table headers and sets the fonts.
 */
export const DOC_THEMES = [
  { id: 'office', label: { en: 'Office', ar: 'أوفيس' }, font: 'Calibri', headFont: 'Calibri', head: '#2F5496', sub: '#1F3763', accent: '#1F3864', soft: '#E8EEF9' },
  { id: 'classic', label: { en: 'Classic', ar: 'كلاسيكي' }, font: 'Times New Roman', headFont: 'Times New Roman', head: '#000000', sub: '#404040', accent: '#262626', soft: '#EFEFEF' },
  { id: 'modern', label: { en: 'Modern', ar: 'عصري' }, font: 'Segoe UI', headFont: 'Segoe UI', head: '#0F766E', sub: '#115E59', accent: '#0F766E', soft: '#E3F4F1' },
  { id: 'bold', label: { en: 'Bold', ar: 'جريء' }, font: 'Arial', headFont: 'Arial', head: '#B91C1C', sub: '#7F1D1D', accent: '#B91C1C', soft: '#FDECEC' },
  { id: 'arabic', label: { en: 'Arabic elegant', ar: 'عربي أنيق' }, font: 'Cairo', headFont: 'Cairo', head: '#1F3864', sub: '#2F5496', accent: '#1F3864', soft: '#E8EEF9' },
  { id: 'tajawal', label: { en: 'Clean blue', ar: 'أزرق نظيف' }, font: 'Tajawal', headFont: 'Tajawal', head: '#0B5FFF', sub: '#0A3FA8', accent: '#0B5FFF', soft: '#E6EFFF' },
  { id: 'academic', label: { en: 'Academic', ar: 'أكاديمي' }, font: 'Amiri', headFont: 'Amiri', head: '#7A1F1F', sub: '#5B1616', accent: '#7A1F1F', soft: '#F7E9E9' },
  { id: 'emerald', label: { en: 'Emerald', ar: 'زمردي' }, font: 'Almarai', headFont: 'Almarai', head: '#047857', sub: '#065F46', accent: '#047857', soft: '#E1F5EE' },
  { id: 'royal', label: { en: 'Royal', ar: 'ملكي' }, font: 'IBM Plex Sans Arabic', headFont: 'IBM Plex Sans Arabic', head: '#6D28D9', sub: '#4C1D95', accent: '#6D28D9', soft: '#F0EAFB' },
  { id: 'sunset', label: { en: 'Sunset', ar: 'غروب' }, font: 'Cairo', headFont: 'Cairo', head: '#C2410C', sub: '#9A3412', accent: '#C2410C', soft: '#FDEBDD' },
  { id: 'gold', label: { en: 'Gold', ar: 'ذهبي' }, font: 'Cairo', headFont: 'Playfair Display', head: '#92700C', sub: '#6F5409', accent: '#B8891A', soft: '#FBF3DC' },
  { id: 'tech', label: { en: 'Tech', ar: 'تقني' }, font: 'Inter', headFont: 'JetBrains Mono', head: '#0F172A', sub: '#334155', accent: '#0F172A', soft: '#E9EDF3' },
];

/** paragraph spacing sets: line height, space before / after (pt) */
export const STYLE_SETS = [
  { id: 'compact', label: { en: 'Compact', ar: 'مضغوط' }, line: 1, before: 0, after: 4 },
  { id: 'normal', label: { en: 'Normal', ar: 'عادي' }, line: 1.15, before: 0, after: 8 },
  { id: 'open', label: { en: 'Open', ar: 'مفتوح' }, line: 1.3, before: 0, after: 10 },
  { id: 'relaxed', label: { en: 'Relaxed', ar: 'مريح' }, line: 1.5, before: 0, after: 12 },
  { id: 'double', label: { en: 'Double', ar: 'مزدوج' }, line: 2, before: 0, after: 0 },
];

/** page border presets (Word "Page Borders"): sz = eighths of a point, space = pt from the page edge */
const side = (val, sz, color, space = 24) => ({ val, sz, color, space });
const all = (s) => ({ top: s, left: s, bottom: s, right: s, offsetFrom: 'page', display: 'allPages', zOrder: 'front' });
export const PAGE_BORDERS = [
  { id: 'none', label: { en: 'None', ar: 'بدون' }, borders: null },
  { id: 'thin', label: { en: 'Thin box', ar: 'إطار رفيع' }, borders: all(side('single', 6, '#1F3864')) },
  { id: 'thick', label: { en: 'Thick box', ar: 'إطار سميك' }, borders: all(side('single', 24, '#1F3864')) },
  { id: 'double', label: { en: 'Double', ar: 'مزدوج' }, borders: all(side('double', 12, '#1F3864')) },
  { id: 'gold', label: { en: 'Gold', ar: 'ذهبي' }, borders: all(side('thinThickSmallGap', 18, '#B8891A')) },
  { id: 'dotted', label: { en: 'Dotted', ar: 'منقط' }, borders: all(side('dotted', 12, '#64748B')) },
  { id: 'top', label: { en: 'Top & bottom', ar: 'أعلى وأسفل' }, borders: { top: side('single', 18, '#1F3864', 20), bottom: side('single', 18, '#1F3864', 20), offsetFrom: 'page', display: 'allPages', zOrder: 'front' } },
];

const lum = (hex) => { const m = /^#?([0-9a-f]{6})$/i.exec(hex || ''); if (!m) return 1; const n = parseInt(m[1], 16); return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255; };
export const isDark = (hex) => lum(hex) < 0.45;
export const hexOf = (c) => {
  const m = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/.exec(c || ''); if (m) return `#${[m[1], m[2], m[3]].map((n) => Number(n).toString(16).padStart(2, '0')).join('')}`;
  return /^#[0-9a-f]{6}$/i.test(c || '') ? c.toLowerCase() : /^#[0-9a-f]{3}$/i.test(c || '') ? `#${c.slice(1).split('').map((x) => x + x).join('')}`.toLowerCase() : null;
};
