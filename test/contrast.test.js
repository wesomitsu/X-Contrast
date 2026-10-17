import { test } from 'node:test';
import assert from 'node:assert/strict';
import { blend, contrastRatio, parseColor } from '../src/contrast.js';

const close = (a, b) => assert.ok(Math.abs(a - b) < 0.005, `${a} != ${b}`);

test('parses supported formats', () => {
  assert.deepEqual(parseColor('#fff'), [255, 255, 255]);
  assert.deepEqual(parseColor('#1E293B'), [30, 41, 59]);
  assert.deepEqual(parseColor('rgb(1, 2, 3)'), [1, 2, 3]);
  assert.deepEqual(parseColor('hsl(0, 100%, 50%)'), [255, 0, 0]);
  assert.deepEqual(parseColor('Black'), [0, 0, 0]);
});

test('returns null for anything else', () => {
  for (const v of ['red', 'var(--x)', '#12', 'rgb(300,0,0)', 'rgba(0,0,0,2)', '']) assert.equal(parseColor(v), null, v);
});

test('known ratios', () => {
  close(contrastRatio(parseColor('#000'), parseColor('#fff')), 21);
  close(contrastRatio(parseColor('#767676'), parseColor('#fff')), 4.54);
  close(contrastRatio(parseColor('#fff'), parseColor('#fff')), 1);
});

test('parses transparency', () => {
  assert.deepEqual(parseColor('#00000080'), [0, 0, 0, 128 / 255]);
  assert.deepEqual(parseColor('#0008'), [0, 0, 0, 136 / 255]);
  assert.deepEqual(parseColor('rgba(10, 20, 30, 0.5)'), [10, 20, 30, 0.5]);
  assert.deepEqual(parseColor('rgba(10, 20, 30, 1)'), [10, 20, 30]);
  assert.deepEqual(parseColor('hsla(0, 100%, 50%, 50%)'), [255, 0, 0, 0.5]);
  assert.deepEqual(parseColor('transparent'), [0, 0, 0, 0]);
});

test('blends over a background', () => {
  assert.deepEqual(blend([0, 0, 0, 0.5], [255, 255, 255]), [128, 128, 128]);
  assert.deepEqual(blend([1, 2, 3], [9, 9, 9]), [1, 2, 3]);
});
