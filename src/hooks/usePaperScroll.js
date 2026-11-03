import { useLayoutEffect, useRef } from 'react';
import { isNative } from '../native.js';

/**
 * Scroll reveal: each matching section "unfolds" like crumpled paper the first time it scrolls into view
 * (styles in paper-reveal.css, .pr-sec). One IntersectionObserver, one-shot per section, no layout work.
 * Skipped when animations are off (Admin switch / Android app) or the visitor prefers reduced motion.
 */
export default function usePaperScroll(selector = '.lp4-section') {
  const io = useRef(null);
  // No deps on purpose: runs after every render and only picks up sections it has not seen yet.
  useLayoutEffect(() => {
    if (isNative || typeof IntersectionObserver === 'undefined') return;
    if (document.documentElement.dataset.motion === 'off') return;
    try { if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return; } catch { /* ignore */ }
    if (!io.current) {
      io.current = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          const el = en.target;
          io.current.unobserve(el);
          el.classList.add('is-in');
          const done = () => { el.classList.add('pr-done'); el.removeEventListener('animationend', onEnd); };
          const onEnd = (e) => { if (e.target === el && e.animationName === 'pr-sec-open') done(); };
          el.addEventListener('animationend', onEnd);
          setTimeout(done, 1600); // fallback
        });
      }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });
    }
    document.querySelectorAll(selector).forEach((el) => {
      if (el.dataset.pr) return;
      el.dataset.pr = '1';
      el.classList.add('pr-sec');
      io.current.observe(el);
    });
  });
  useLayoutEffect(() => () => { io.current?.disconnect(); io.current = null; }, []);
}
