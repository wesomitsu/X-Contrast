import { parseColor } from './contrast.js';

const COLOR_TOKEN = /#[\da-f]{3,6}\b|rgb\([^)]*\)|hsl\([^)]*\)|\b(?:black|white)\b/gi;

// Finds rules that set both a text color and a background color, and
// returns { selector, line, text, background } for each one.
export function findColorPairs(css) {
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ' '));
  const pairs = [];
  for (const m of clean.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    let text = null;
    let background = null;
    for (const decl of m[2].split(';')) {
      const i = decl.indexOf(':');
      if (i < 0) continue;
      const prop = decl.slice(0, i).trim().toLowerCase();
      const value = decl.slice(i + 1).replace(/!important/i, '').trim();
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

function firstColor(value) {
  for (const token of value.match(COLOR_TOKEN) ?? []) {
    if (parseColor(token)) return token;
  }
  return null;
}
