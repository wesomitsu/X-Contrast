import { blend, contrastRatio, parseColor, THRESHOLDS } from './contrast.js';

const WHITE = [255, 255, 255];

export function checkPairs(pairs, level = 'AA') {
  return pairs.map((p) => {
    // A see-through background is assumed to sit on white; see-through text is
    // painted over the background before measuring.
    const bg = blend(parseColor(p.background), WHITE);
    const ratio = contrastRatio(blend(parseColor(p.text), bg), bg);
    return { ...p, ratio, pass: ratio >= THRESHOLDS[level][p.large ? 'large' : 'normal'] };
  });
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
      `| ${r.pass ? '✅' : '❌'} | \`${r.file}:${r.line}\` | \`${r.selector.replace(/\|/g, '\\|')}\` | \`${r.text}\` on \`${r.background}\` | ${r.ratio.toFixed(2)}:1${r.large ? ' (large text)' : ''} |`,
  );
  return [head, '', '| | Where | Selector | Colors | Ratio |', '|---|---|---|---|---|', ...rows].join('\n');
}
