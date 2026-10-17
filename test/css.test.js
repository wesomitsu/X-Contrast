import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findColorPairs } from '../src/css.js';

test('finds rules with both colors, with line numbers', () => {
  const css = `/* header */
.a { color: #777; background: #fff url(x.png); }
.b { color: #000; }

@media (min-width: 600px) {
  .c,
  .d { background-color: rgb(0, 0, 0) !important; color: white }
}`;
  assert.deepEqual(findColorPairs(css), [
    { selector: '.a', line: 2, text: '#777', background: '#fff' },
    { selector: '.c, .d', line: 6, text: 'white', background: 'rgb(0, 0, 0)' },
  ]);
});

test('ignores variables, unknown names and commented-out rules', () => {
  const css = `.x { color: var(--fg); background: #fff; }
.y { color: red; background: #fff; }
/* .z { color: #777; background: #fff; } */`;
  assert.deepEqual(findColorPairs(css), []);
});
