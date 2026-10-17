const NAMED = { black: [0, 0, 0], white: [255, 255, 255] };

// Returns [r, g, b] for #rgb, #rrggbb, rgb(), hsl(), black or white; null otherwise.
export function parseColor(input) {
  const value = String(input).trim().toLowerCase();
  if (NAMED[value]) return NAMED[value];

  let m = value.match(/^#([\da-f]{3}|[\da-f]{6})$/);
  if (m) {
    const hex = m[1].length === 3 ? [...m[1]].map((c) => c + c).join('') : m[1];
    return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
  }
  m = value.match(/^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/);
  if (m) {
    const rgb = m.slice(1).map(Number);
    return rgb.every((c) => c <= 255) ? rgb : null;
  }
  m = value.match(/^hsl\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*\)$/);
  if (m) {
    const [h, s, l] = m.slice(1).map(Number);
    if (h > 360 || s > 100 || l > 100) return null;
    const a = (s / 100) * Math.min(l / 100, 1 - l / 100);
    const f = (n) => {
      const k = (n + h / 30) % 12;
      return Math.round(255 * (l / 100 - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))));
    };
    return [f(0), f(8), f(4)];
  }
  return null;
}

function luminance([r, g, b]) {
  const lin = (c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

// WCAG 2.x contrast ratio between two parsed colors.
export function contrastRatio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

export const THRESHOLDS = { AA: 4.5, AAA: 7 };
