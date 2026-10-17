import { parseColor } from './contrast.js';

const COLOR_TOKEN = /#[\da-f]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)|\b(?:black|white|transparent)\b/gi;

// Finds rules that set both a text color and a background color, and
// returns { selector, line, text, background } for each one.
export function findColorPairs(css) {
  // A rule right after /* x-contrast-ignore */ is skipped.
  const marked = css.replace(/\/\*\s*x-contrast-ignore\s*\*\/\s*/g, (c) => c.replace(/[^\n]/g, ' ') + '\u0000');
  const clean = marked.replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ' '));
  const vars = new Map();
  for (const m of clean.matchAll(/(--[\w-]+)\s*:\s*([^;{}]+)/g)) vars.set(m[1], m[2].trim());
  const pairs = [];
  for (const m of clean.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    let text = null;
    let background = null;
    let size = null;
    let bold = false;
    for (const decl of m[2].split(';')) {
      const i = decl.indexOf(':');
      if (i < 0) continue;
      const prop = decl.slice(0, i).trim().toLowerCase();
      const value = resolveVars(decl.slice(i + 1).replace(/!important/i, '').trim(), vars);
      if (prop === 'color') text = firstColor(value);
      else if (prop === 'background-color' || prop === 'background') background = firstColor(value) ?? background;
      else if (prop === 'font-size') size = toPx(value);
      else if (prop === 'font-weight') bold = value === 'bold' || value === 'bolder' || Number(value) >= 700;
    }
    if (text && background && !m[1].trimStart().startsWith('\u0000')) {
      const start = m.index + m[1].length - m[1].trimStart().length;
      pairs.push({
        selector: m[1].replace('\u0000', '').trim().replace(/\s+/g, ' '),
        line: clean.slice(0, start).split('\n').length,
        text,
        background,
        large: size !== null && (size >= 24 || (size >= 18.66 && bold)),
      });
    }
  }
  return pairs;
}

// Replaces var(--name) and var(--name, fallback) with their values (a few levels deep).
function resolveVars(value, vars) {
  for (let depth = 0; depth < 5 && value.includes('var('); depth++) {
    value = value.replace(/var\(\s*(--[\w-]+)\s*(?:,\s*([^()]*))?\)/g, (all, name, fallback) => vars.get(name) ?? fallback?.trim() ?? all);
  }
  return value;
}

// px, pt and rem/em (assuming 16px) font sizes; anything else is unknown.
function toPx(value) {
  const m = value.match(/^([\d.]+)(px|pt|r?em)$/);
  if (!m) return null;
  const n = Number(m[1]);
  return m[2] === 'px' ? n : m[2] === 'pt' ? (n * 4) / 3 : n * 16;
}

function firstColor(value) {
  for (const token of value.match(COLOR_TOKEN) ?? []) {
    if (parseColor(token)) return token;
  }
  return null;
}
