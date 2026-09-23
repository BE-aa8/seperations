/**
 * site.js — shared chrome: theme toggle, the narrow-screen menu, current-page
 * nav marking, and the contents rail on the reading pages. Loaded by every
 * page. Contains nothing about absorption.
 */

const KEY = 'tvp-theme';

const THEME_ICON = {
  auto: '<circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor" stroke="none"/>',
  light: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8"/>',
  dark: '<path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z"/>',
};
const THEME_NAME = { auto: 'automatic', light: 'light', dark: 'dark' };

function apply(theme) {
  if (theme === 'light' || theme === 'dark') {
    document.documentElement.setAttribute('data-theme', theme);
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
}

function current() {
  try {
    return localStorage.getItem(KEY) ?? 'auto';
  } catch {
    return 'auto';
  }
}

function paintToggle(btn, theme) {
  const svg = btn.querySelector('svg');
  if (svg) svg.innerHTML = THEME_ICON[theme];
  const next = { auto: 'light', light: 'dark', dark: 'auto' }[theme];
  btn.setAttribute('aria-label', `Colour theme: ${THEME_NAME[theme]}. Switch to ${THEME_NAME[next]}.`);
  btn.title = `Theme: ${THEME_NAME[theme]}`;
}

function initTheme() {
  apply(current());
  const btn = document.querySelector('.theme-toggle');
  if (!btn) return;
  paintToggle(btn, current());
  btn.addEventListener('click', () => {
    const order = ['auto', 'light', 'dark'];
    const next = order[(order.indexOf(current()) + 1) % order.length];
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* private mode: the toggle still works for this page view */
    }
    apply(next);
    paintToggle(btn, next);
  });
}

function initNav() {
  const here = location.pathname.split('/').pop() || 'index.html';
  for (const a of document.querySelectorAll('.nav a')) {
    if (a.getAttribute('href') === here) a.setAttribute('aria-current', 'page');
  }

  const menu = document.querySelector('.bar__menu');
  const nav = document.getElementById('site-nav');
  if (!menu || !nav) return;
  const set = (open) => {
    menu.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
  };
  menu.addEventListener('click', () => set(menu.getAttribute('aria-expanded') !== 'true'));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) {
      set(false);
      menu.focus();
    }
  });
  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target) && !menu.contains(e.target)) set(false);
  });
}

/** Mark the section in view in the contents rail, if the page has one. */
function initRail() {
  const links = [...document.querySelectorAll('.doc__rail a[href^="#"]')];
  if (!links.length || !('IntersectionObserver' in window)) return;
  const byId = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
  const targets = [...byId.keys()].map((id) => document.getElementById(id)).filter(Boolean);
  const visible = new Set();

  const mark = () => {
    // The first section whose heading has scrolled past the top third wins.
    let active = targets[0];
    for (const t of targets) {
      if (t.getBoundingClientRect().top < window.innerHeight * 0.33) active = t;
    }
    for (const a of links) a.removeAttribute('aria-current');
    byId.get(active.id)?.setAttribute('aria-current', 'true');
  };

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) (e.isIntersecting ? visible.add : visible.delete).call(visible, e.target);
    mark();
  }, { rootMargin: '0px 0px -60% 0px' });
  targets.forEach((t) => io.observe(t));
  window.addEventListener('scroll', () => requestAnimationFrame(mark), { passive: true });
  mark();

  // On narrow screens the rail is a disclosure, closed by default and closed
  // again after a jump; on wide screens it is always open.
  const details = document.querySelector('.doc__rail details');
  const narrow = window.matchMedia('(max-width: 1000px)');
  if (details) {
    const sync = () => { details.open = !narrow.matches; };
    sync();
    narrow.addEventListener('change', sync);
  }
  if (details) links.forEach((a) => a.addEventListener('click', () => {
    if (narrow.matches) details.open = false;
  }));
}

export function initSite() {
  initTheme();
  initNav();
  initRail();
}

initSite();
