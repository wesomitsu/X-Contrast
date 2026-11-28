// The CSS named colors, as name:rrggbb.
const NAMED = Object.fromEntries(
  `
  aliceblue:f0f8ff antiquewhite:faebd7 aqua:00ffff aquamarine:7fffd4 azure:f0ffff beige:f5f5dc bisque:ffe4c4
  black:000000 blanchedalmond:ffebcd blue:0000ff blueviolet:8a2be2 brown:a52a2a burlywood:deb887
  cadetblue:5f9ea0 chartreuse:7fff00 chocolate:d2691e coral:ff7f50 cornflowerblue:6495ed cornsilk:fff8dc
  crimson:dc143c cyan:00ffff darkblue:00008b darkcyan:008b8b darkgoldenrod:b8860b darkgray:a9a9a9
  darkgreen:006400 darkgrey:a9a9a9 darkkhaki:bdb76b darkmagenta:8b008b darkolivegreen:556b2f
  darkorange:ff8c00 darkorchid:9932cc darkred:8b0000 darksalmon:e9967a darkseagreen:8fbc8f
  darkslateblue:483d8b darkslategray:2f4f4f darkslategrey:2f4f4f darkturquoise:00ced1 darkviolet:9400d3
  deeppink:ff1493 deepskyblue:00bfff dimgray:696969 dimgrey:696969 dodgerblue:1e90ff firebrick:b22222
  floralwhite:fffaf0 forestgreen:228b22 fuchsia:ff00ff gainsboro:dcdcdc ghostwhite:f8f8ff gold:ffd700
  goldenrod:daa520 gray:808080 green:008000 greenyellow:adff2f grey:808080 honeydew:f0fff0 hotpink:ff69b4
  indianred:cd5c5c indigo:4b0082 ivory:fffff0 khaki:f0e68c lavender:e6e6fa lavenderblush:fff0f5
  lawngreen:7cfc00 lemonchiffon:fffacd lightblue:add8e6 lightcoral:f08080 lightcyan:e0ffff
  lightgoldenrodyellow:fafad2 lightgray:d3d3d3 lightgreen:90ee90 lightgrey:d3d3d3 lightpink:ffb6c1
  lightsalmon:ffa07a lightseagreen:20b2aa lightskyblue:87cefa lightslategray:778899 lightslategrey:778899
  lightsteelblue:b0c4de lightyellow:ffffe0 lime:00ff00 limegreen:32cd32 linen:faf0e6 magenta:ff00ff
  maroon:800000 mediumaquamarine:66cdaa mediumblue:0000cd mediumorchid:ba55d3 mediumpurple:9370db
  mediumseagreen:3cb371 mediumslateblue:7b68ee mediumspringgreen:00fa9a mediumturquoise:48d1cc
  mediumvioletred:c71585 midnightblue:191970 mintcream:f5fffa mistyrose:ffe4e1 moccasin:ffe4b5
  navajowhite:ffdead navy:000080 oldlace:fdf5e6 olive:808000 olivedrab:6b8e23 orange:ffa500 orangered:ff4500
  orchid:da70d6 palegoldenrod:eee8aa palegreen:98fb98 paleturquoise:afeeee palevioletred:db7093
  papayawhip:ffefd5 peachpuff:ffdab9 peru:cd853f pink:ffc0cb plum:dda0dd powderblue:b0e0e6 purple:800080
  rebeccapurple:663399 red:ff0000 rosybrown:bc8f8f royalblue:4169e1 saddlebrown:8b4513 salmon:fa8072
  sandybrown:f4a460 seagreen:2e8b57 seashell:fff5ee sienna:a0522d silver:c0c0c0 skyblue:87ceeb
  slateblue:6a5acd slategray:708090 slategrey:708090 snow:fffafa springgreen:00ff7f steelblue:4682b4
  tan:d2b48c teal:008080 thistle:d8bfd8 tomato:ff6347 turquoise:40e0d0 violet:ee82ee wheat:f5deb3
  white:ffffff whitesmoke:f5f5f5 yellow:ffff00 yellowgreen:9acd32`
    .trim()
    .split(/\s+/)
    .map((pair) => {
      const [name, hex] = pair.split(':');
      return [name, [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16))];
    }),
);
NAMED.transparent = [0, 0, 0, 0];

// Returns [r, g, b] or [r, g, b, a] for #rgb(a), #rrggbb(aa), rgb(a)(), hsl(a)() (comma or space separated),
// a named color or transparent; null otherwise.
export function parseColor(input) {
  let value = String(input).trim().toLowerCase();
  // Modern space-separated syntax: rgb(29 78 216 / 50%), hsl(220deg 70% 40%).
  value = value.replace(/^((?:rgb|hsl)a?)\(\s*([^,()\/]+?)\s*(?:\/\s*([^,()\/]+?)\s*)?\)$/, (all, fn, parts, alpha) => {
    const list = parts.split(/\s+/);
    return list.length === 3 ? `${fn}(${[...list, ...(alpha ? [alpha] : [])].join(', ')})` : all;
  });
  value = value.replace(/^(hsla?\(\s*[\d.]+)deg\b/, '$1');
  if (Object.hasOwn(NAMED, value)) return NAMED[value];

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

// Minimum ratios for normal and large text (24px+, or 18.66px+ bold).
export const THRESHOLDS = { AA: { normal: 4.5, large: 3 }, AAA: { normal: 7, large: 4.5 } };
