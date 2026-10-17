const STYLE_FILES = /\.(css|scss)$/i;
const MARKUP_FILES = /\.(html?|vue|svelte|astro)$/i;

export function isCheckable(filename) {
  return STYLE_FILES.test(filename) || MARKUP_FILES.test(filename);
}

// Returns the CSS to scan. For markup files, everything outside <style> blocks
// is blanked out (newlines kept) so line numbers still match the file.
export function extractCss(filename, content) {
  if (STYLE_FILES.test(filename)) return content.replace(/^\s*\/\/.*$/gm, (l) => l.replace(/./g, ' '));
  let out = '';
  let last = 0;
  for (const m of content.matchAll(/(<style\b[^>]*>)([\s\S]*?)<\/style>/gi)) {
    const start = m.index + m[1].length;
    out += blank(content.slice(last, start)) + m[2];
    last = start + m[2].length;
  }
  return out + blank(content.slice(last));
}

const blank = (s) => s.replace(/[^\n]/g, ' ');
