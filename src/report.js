import { blend, contrastRatio, parseColor, THRESHOLDS } from './contrast.js';

const WHITE = [255, 255, 255];

export function checkPairs(pairs, level = 'AA') {
  return pairs.map((p) => {
    // A see-through background is assumed to sit on white; see-through text is
    // painted over the background before measuring.
    const bg = blend(parseColor(p.background), WHITE);
    const ratio = contrastRatio(blend(parseColor(p.text), bg), bg);
    const min = THRESHOLDS[level][p.large ? 'large' : 'normal'];
    const pass = ratio >= min;
    return { ...p, ratio, pass, suggestion: pass ? null : suggest(blend(parseColor(p.text), bg), bg, min) };
  });
}

const toHex = (rgb) => '#' + rgb.map((c) => c.toString(16).padStart(2, '0')).join('');

// Closest text color (same hue, scaled towards black or white) that reaches min.
export function suggest(text, bg, min) {
  let best = null;
  for (const toward of [0, 255]) {
    for (let step = 1; step <= 100; step++) {
      const candidate = text.map((c) => Math.round(c + (toward - c) * (step / 100)));
      if (contrastRatio(candidate, bg) >= min) {
        if (!best || step < best.step) best = { step, color: toHex(candidate) };
        break;
      }
    }
  }
  return best?.color ?? null;
}

// results: [{ file, line, selector, text, background, ratio, pass }]
export function formatReport(results, level) {
  const failing = results.filter((r) => !r.pass);
  if (results.length === 0) return '### X-Contrast\nNo text/background color pairs found in the changed CSS.';
  const head = failing.length
    ? `### X-Contrast: ${failing.length} of ${results.length} color pairs fail WCAG ${level}`
    : `### X-Contrast: all ${results.length} color pairs pass WCAG ${level}`;
  const rows = results.map(
    (r) =>
      `| ${r.pass ? '✅' : '❌'} | \`${r.file}:${r.line}\` | \`${r.selector.replace(/\|/g, '\\|')}\` | \`${r.text}\` on \`${r.background}\` | ${r.ratio.toFixed(2)}:1${r.large ? ' (large text)' : ''} | ${r.suggestion ? `\`${r.suggestion}\`` : ''} |`,
  );
  return [head, '', '| | Where | Selector | Colors | Ratio | Try |', '|---|---|---|---|---|---|', ...rows].join('\n');
}
