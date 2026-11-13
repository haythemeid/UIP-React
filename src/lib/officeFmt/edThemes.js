import { useSyncExternalStore } from 'react';
import { THEMES as CODE } from '../../components/zipbench/themePalettes.js';

/**
 * Colour themes of the Office editors (Word / PowerPoint frame): the original look + two light "Office" looks
 * + every palette of the code editor (Dark+, Midnight, Dracula, Nord, Light, GitHub Light, Solarized …), so all editors match.
 * A theme is just CSS variables on the editor frame (.ed): --ed-bg / --ed-panel / --ed-line / --ed-text / --ed-strong / --ed-muted /
 * --ed-accent / --ed-on-accent / --ed-pop / --ed-stage / --ed-ink (white on dark themes, black on light ones — drives every hover / fill).
 * The paper of a document always stays white, like Word.
 */
const make = (o) => ({
  id: o.id, en: o.en, ar: o.ar || o.en, group: o.group, dark: !!o.dark,
  swatch: [o.bg, o.panel, o.accent],
  vars: {
    '--ed-bg': o.bg, '--ed-panel': o.panel, '--ed-line': o.line, '--ed-text': o.text, '--ed-strong': o.strong, '--ed-muted': o.muted,
    '--ed-accent': o.accent, '--ed-on-accent': o.onAccent, '--ed-pop': o.pop,
    '--ed-stage': o.stage || `color-mix(in srgb, ${o.dark ? o.bg : o.panel} ${o.dark ? 80 : 90}%, #000)`,
    '--ed-ink': o.dark ? '#ffffff' : '#000000', colorScheme: o.dark ? 'dark' : 'light',
  },
});

const list = [
  make({ id: 'classic', en: 'Classic dark', ar: 'داكن كلاسيك', group: 'office', dark: true, bg: '#0f1420', panel: '#151b2b', line: 'rgba(255,255,255,.1)', text: '#e8ecf3', strong: '#ffffff', muted: '#9aa4b6', accent: '#6ea8ff', onAccent: '#08122a', pop: '#1b2234', stage: '#0b0f19' }),
  make({ id: 'word', en: 'Word light', ar: 'Word فاتح', group: 'office', bg: '#f1f3f7', panel: '#ffffff', line: 'rgba(15,23,42,.14)', text: '#1f2937', strong: '#000000', muted: '#5b6573', accent: '#2b579a', onAccent: '#ffffff', pop: '#ffffff', stage: '#d8dce4' }),
  make({ id: 'paper', en: 'Warm paper', ar: 'ورق دافي', group: 'office', bg: '#f5efe3', panel: '#fbf7ee', line: 'rgba(80,60,20,.18)', text: '#3b3326', strong: '#1c160b', muted: '#7a6e58', accent: '#b45309', onAccent: '#ffffff', pop: '#fffaf0', stage: '#e4dac6' }),
  ...CODE.map((c) => {
    const u = c.ui;
    return make({
      id: `code-${c.id}`, en: c.name, ar: c.name, group: 'code', dark: c.dark, bg: u.bg, panel: u.side, line: u.line, text: u.text, strong: u.strong,
      muted: u.muted, accent: u.accent, onAccent: u.onPrimary || (c.dark ? '#08122a' : '#ffffff'), pop: u.menu,
    });
  }),
];

export const ED_THEME_LIST = list;
export const ED_THEMES = Object.fromEntries(list.map((t) => [t.id, t]));
export const edThemeOf = (id) => ED_THEMES[id] || ED_THEMES.classic;

const KEY = 'uip.office.theme';
function load() {
  try {
    const t = localStorage.getItem(KEY); if (ED_THEMES[t]) return t;
    const zb = localStorage.getItem('zb-theme'); if (zb && ED_THEMES[`code-${zb}`]) return `code-${zb}`; // same look as the code editor the student picked
  } catch { /* storage unavailable */ }
  return 'classic';
}
let current = load();
const subs = new Set();
export function setEdTheme(id) {
  if (!ED_THEMES[id] || id === current) return;
  current = id;
  try { localStorage.setItem(KEY, id); } catch { /* storage unavailable */ }
  subs.forEach((f) => f());
}
/** [themeId, setTheme] — shared by every Office editor and its ribbon. */
export function useEdTheme() {
  const id = useSyncExternalStore((cb) => { subs.add(cb); return () => subs.delete(cb); }, () => current, () => 'classic');
  return [id, setEdTheme];
}
