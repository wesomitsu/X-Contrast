import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findColorPairs } from '../src/css.js';
import { extractCss, isCheckable } from '../src/sources.js';

test('knows which files to check', () => {
  for (const f of ['a.css', 'b.SCSS', 'c.html', 'd.vue', 'e.svelte', 'f.astro']) assert.ok(isCheckable(f), f);
  for (const f of ['a.js', 'b.less', 'README.md']) assert.ok(!isCheckable(f), f);
});

test('keeps line numbers for <style> blocks in markup', () => {
  const vue = `<template>
  <p class="x">hi</p>
</template>
<style scoped>
.x { color: #777; background: #fff; }
</style>`;
  assert.deepEqual(findColorPairs(extractCss('a.vue', vue)), [{ selector: '.x', line: 5, text: '#777', background: '#fff', large: false }]);
});

test('ignores // comments in SCSS', () => {
  const scss = `// .old { color: #777; background: #fff; }
.new { color: #000; background: #fff; }`;
  assert.deepEqual(findColorPairs(extractCss('a.scss', scss)).map((p) => p.selector), ['.new']);
});
