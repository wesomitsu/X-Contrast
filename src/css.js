import { parseColor } from './contrast.js';

const COLOR_TOKEN = /#[\da-f]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)|\b(?:black|white|transparent)\b/gi;

// Finds rules that set both a text color and a background color, and
// returns { selector, line, text, background } for each one.
export function findColorPairs(css) {
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ' '));
  const vars = new Map();
  for (const m of clean.matchAll(/(--[\w-]+)\s*:\s*([^;{}]+)/g)) vars.set(m[1], m[2].trim());
  const pairs = [];
  for (const m of clean.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    let text = null;
    let background = null;
    for (const decl of m[2].split(';')) {
      const i = decl.indexOf(':');
      if (i < 0) continue;
      const prop = decl.slice(0, i).trim().toLowerCase();
      const value = resolveVars(decl.slice(i + 1).replace(/!important/i, '').trim(), vars);
      if (prop === 'color') text = firstColor(value);
      else if (prop === 'background-color' || prop === 'background') background = firstColor(value) ?? background;
    }
    if (text && background) {
      const start = m.index + m[1].length - m[1].trimStart().length;
      pairs.push({
        selector: m[1].trim().replace(/\s+/g, ' '),
        line: clean.slice(0, start).split('\n').length,
        text,
        background,
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

function firstColor(value) {
  for (const token of value.match(COLOR_TOKEN) ?? []) {
    if (parseColor(token)) return token;
  }
  return null;
}
