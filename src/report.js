import { contrastRatio, parseColor, THRESHOLDS } from './contrast.js';

export function checkPairs(pairs, level = 'AA') {
  const min = THRESHOLDS[level];
  return pairs.map((p) => {
    const ratio = contrastRatio(parseColor(p.text), parseColor(p.background));
    return { ...p, ratio, pass: ratio >= min };
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
      `| ${r.pass ? '✅' : '❌'} | \`${r.file}:${r.line}\` | \`${r.selector.replace(/\|/g, '\\|')}\` | \`${r.text}\` on \`${r.background}\` | ${r.ratio.toFixed(2)}:1 |`,
  );
  return [head, '', '| | Where | Selector | Colors | Ratio |', '|---|---|---|---|---|', ...rows].join('\n');
}
