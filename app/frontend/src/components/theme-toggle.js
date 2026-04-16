import { el } from '../lib/dom.js';

const STORAGE_KEY = 'pod-theme';
const VALID = new Set(['light', 'system', 'dark']);
const OPTIONS = [
  { value: 'light', label: 'Light' },
  { value: 'system', label: 'System' },
  { value: 'dark', label: 'Dark' },
];

let mediaQuery = null;
let mediaListener = null;

function readStoredTheme() {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return VALID.has(value) ? value : 'light';
  } catch {
    return 'light';
  }
}

function writeStoredTheme(value) {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // localStorage unavailable — private-mode or quota, tolerate silently
  }
}

function resolveSystemTheme() {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function detachSystemListener() {
  if (!mediaQuery || !mediaListener) return;
  if (typeof mediaQuery.removeEventListener === 'function') {
    mediaQuery.removeEventListener('change', mediaListener);
  } else if (typeof mediaQuery.removeListener === 'function') {
    mediaQuery.removeListener(mediaListener);
  }
  mediaQuery = null;
  mediaListener = null;
}

function attachSystemListener() {
  if (mediaQuery && mediaListener) return;
  if (typeof window === 'undefined' || !window.matchMedia) return;
  mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaListener = (event) => {
    if (readStoredTheme() !== 'system') return;
    document.documentElement.dataset.theme = event.matches ? 'dark' : 'light';
  };
  if (typeof mediaQuery.addEventListener === 'function') {
    mediaQuery.addEventListener('change', mediaListener);
  } else if (typeof mediaQuery.addListener === 'function') {
    mediaQuery.addListener(mediaListener);
  }
}

function applyTheme(value) {
  if (typeof document === 'undefined') return;
  if (value === 'system') {
    attachSystemListener();
    document.documentElement.dataset.theme = resolveSystemTheme();
  } else {
    detachSystemListener();
    document.documentElement.dataset.theme = value;
  }
}

// Apply the stored theme on module load so pages render in the correct
// register before the toggle is mounted.
if (typeof document !== 'undefined') {
  applyTheme(readStoredTheme());
}

export function renderThemeToggle() {
  const current = readStoredTheme();

  const group = el('div', {
    className: 'theme-toggle',
    role: 'radiogroup',
    'aria-label': 'Theme',
  });

  function setActive(value) {
    if (!VALID.has(value)) return;
    writeStoredTheme(value);
    applyTheme(value);
    for (const child of group.children) {
      const isActive = child.dataset.value === value;
      child.setAttribute('aria-checked', isActive ? 'true' : 'false');
      child.dataset.active = isActive ? 'true' : 'false';
    }
  }

  OPTIONS.forEach(({ value, label }) => {
    const segment = el(
      'button',
      {
        type: 'button',
        className: 'theme-toggle__segment',
        role: 'radio',
        'aria-checked': value === current ? 'true' : 'false',
        dataset: {
          value,
          active: value === current ? 'true' : 'false',
        },
        onclick: () => setActive(value),
      },
      [label]
    );
    group.append(segment);
  });

  return group;
}

export function getCurrentTheme() {
  return readStoredTheme();
}
