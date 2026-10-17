const NAMED = { black: [0, 0, 0], white: [255, 255, 255], transparent: [0, 0, 0, 0] };

// Returns [r, g, b] or [r, g, b, a] for #rgb(a), #rrggbb(aa), rgb(a)(), hsl(a)(),
// black, white or transparent; null otherwise.
export function parseColor(input) {
  const value = String(input).trim().toLowerCase();
  if (NAMED[value]) return NAMED[value];

  let m = value.match(/^#([\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/);
  if (m) {
    const hex = m[1].length <= 4 ? [...m[1]].map((c) => c + c).join('') : m[1];
    const rgb = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
    return hex.length === 8 ? [...rgb, parseInt(hex.slice(6), 16) / 255] : rgb;
  }
  m = value.match(/^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*([\d.]+%?)\s*)?\)$/);
  if (m) {
    const rgb = m.slice(1, 4).map(Number);
    const alpha = parseAlpha(m[4]);
    if (!rgb.every((c) => c <= 255) || alpha === null) return null;
    return alpha < 1 ? [...rgb, alpha] : rgb;
  }
  m = value.match(/^hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*(?:,\s*([\d.]+%?)\s*)?\)$/);
  if (m) {
    const [h, s, l] = m.slice(1, 4).map(Number);
    const alpha = parseAlpha(m[4]);
    if (h > 360 || s > 100 || l > 100 || alpha === null) return null;
    const a = (s / 100) * Math.min(l / 100, 1 - l / 100);
    const f = (n) => {
      const k = (n + h / 30) % 12;
      return Math.round(255 * (l / 100 - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))));
    };
    return alpha < 1 ? [f(0), f(8), f(4), alpha] : [f(0), f(8), f(4)];
  }
  return null;
}

function parseAlpha(raw) {
  if (raw === undefined) return 1;
  const a = raw.endsWith('%') ? Number(raw.slice(0, -1)) / 100 : Number(raw);
  return a >= 0 && a <= 1 ? a : null;
}

// Paints a (possibly transparent) color over an opaque one.
export function blend([r, g, b, a = 1], [br, bg, bb]) {
  return [r * a + br * (1 - a), g * a + bg * (1 - a), b * a + bb * (1 - a)].map(Math.round);
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
