/**
 * site.js — shared chrome: theme toggle and current-page nav marking.
 * Loaded by every page. Contains nothing about absorption.
 */

const KEY = 'tvp-theme';

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

function label(theme) {
  return theme === 'auto' ? '◐ Auto' : theme === 'light' ? '☀ Light' : '☾ Dark';
}

export function initSite() {
  apply(current());

  const btn = document.querySelector('.theme-toggle');
  if (btn) {
    btn.textContent = label(current());
    btn.addEventListener('click', () => {
      const order = ['auto', 'light', 'dark'];
      const next = order[(order.indexOf(current()) + 1) % order.length];
      try {
        localStorage.setItem(KEY, next);
      } catch {
        /* private mode: the toggle still works for this page view */
      }
      apply(next);
      btn.textContent = label(next);
    });
  }

  const here = location.pathname.split('/').pop() || 'index.html';
  for (const a of document.querySelectorAll('.nav a')) {
    if (a.getAttribute('href') === here) a.setAttribute('aria-current', 'page');
  }
}

initSite();
