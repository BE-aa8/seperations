/**
 * site.js — shared chrome: theme toggle, the narrow-screen menu, current-page
 * nav marking, and the contents rail on the reading pages. Loaded by every
 * page. Contains nothing about absorption.
 */

const KEY = 'tvp-theme';

/**
 * Pages whose content the site owner has not supplied yet. While a page is
 * listed as false it is left out of the navigation and the page-to-page
 * links, but its URL still works. Flip it to true when the video is up or
 * the transcript is pasted in.
 */
const PUBLISHED = {
  'video.html': false,
  'transcript.html': false,
};

/** Reading order, for the previous / next links at the foot of each page. */
const ORDER = [
  ['index.html', 'Demo'],
  ['video.html', 'Video'],
  ['transcript.html', 'Transcript'],
  ['docs.html', 'Documentation'],
  ['model-comparison.html', 'Model comparison'],
  ['references.html', 'References'],
];

/**
 * Draft mode shows the owner's "To fill in" regions and the unpublished pages.
 * It is on when the site is served locally, or with ?draft in the URL; the
 * public site never shows author instructions.
 */
const params = new URLSearchParams(location.search);
const DRAFT = params.has('draft') || ['localhost', '127.0.0.1', ''].includes(location.hostname);
const EMBED = params.has('embed');

/** This page's file name, whether or not the host strips ".html". */
function pageName() {
  const last = location.pathname.split('/').pop();
  if (!last || last === 'impl-a') return 'index.html';
  return last.endsWith('.html') ? last : `${last}.html`;
}
const isPublished = (page) => DRAFT || PUBLISHED[page] !== false;

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
  const here = pageName();
  for (const a of document.querySelectorAll('.nav a')) {
    const href = a.getAttribute('href');
    if (href === here) a.setAttribute('aria-current', 'page');
    if (!isPublished(href) && href !== here) a.hidden = true;
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

/**
 * Author-only regions. Outside draft mode, "To fill in" blocks are hidden, and
 * so is any section left with nothing else in it (and its contents entry).
 */
function initDraft() {
  document.documentElement.classList.toggle('is-draft', DRAFT);
  if (DRAFT) return;
  for (const h2 of document.querySelectorAll('.doc__body > h2')) {
    let n = h2.nextElementSibling;
    let hasContent = false;
    while (n && n.tagName !== 'H2' && !n.classList.contains('pager')) {
      if (!n.classList.contains('fillin')) hasContent = true;
      n = n.nextElementSibling;
    }
    if (!hasContent) {
      h2.hidden = true;
      document.querySelector(`.doc__rail a[href="#${h2.id}"]`)?.closest('li')?.setAttribute('hidden', '');
    }
  }
}

/** Point previous / next at the neighbouring PUBLISHED pages. */
function initPager() {
  const pager = document.querySelector('.pager');
  if (!pager) return;
  const pages = ORDER.filter(([p]) => isPublished(p));
  const i = pages.findIndex(([p]) => p === pageName());
  if (i < 0) return;
  const set = (a, target, fallback) => {
    if (!a) return;
    const [href, label] = target ?? fallback;
    a.setAttribute('href', href);
    a.querySelector('strong').textContent = label;
  };
  set(pager.querySelector('.pager__prev'), pages[i - 1], ['index.html', 'Demo']);
  set(pager.querySelector('.pager__next'), pages[i + 1], ['index.html', 'Back to the demo']);
}

export function initSite() {
  if (EMBED) document.documentElement.classList.add('is-embed');
  initTheme();
  initNav();
  initDraft();
  initPager();
  initRail();
}

initSite();
