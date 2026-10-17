import { test } from 'node:test';
import assert from 'node:assert/strict';
import { contrastRatio, parseColor } from '../src/contrast.js';

const close = (a, b) => assert.ok(Math.abs(a - b) < 0.005, `${a} != ${b}`);

test('parses supported formats', () => {
  assert.deepEqual(parseColor('#fff'), [255, 255, 255]);
  assert.deepEqual(parseColor('#1E293B'), [30, 41, 59]);
  assert.deepEqual(parseColor('rgb(1, 2, 3)'), [1, 2, 3]);
  assert.deepEqual(parseColor('hsl(0, 100%, 50%)'), [255, 0, 0]);
  assert.deepEqual(parseColor('Black'), [0, 0, 0]);
});

test('returns null for anything else', () => {
  for (const v of ['red', 'var(--x)', '#12', 'rgb(300,0,0)', 'transparent', '']) assert.equal(parseColor(v), null, v);
});

test('known ratios', () => {
  close(contrastRatio(parseColor('#000'), parseColor('#fff')), 21);
  close(contrastRatio(parseColor('#767676'), parseColor('#fff')), 4.54);
  close(contrastRatio(parseColor('#fff'), parseColor('#fff')), 1);
});
