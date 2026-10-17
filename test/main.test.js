import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { annotation, run } from '../src/main.js';

function setup(files) {
  const dir = mkdtempSync(join(tmpdir(), 'xc-'));
  const eventPath = join(dir, 'event.json');
  writeFileSync(eventPath, JSON.stringify({ pull_request: { number: 3, head: { sha: 'abc' } } }));
  const comments = [];
  const client = {
    changedFiles: async () => Object.keys(files).map((filename) => ({ filename, status: 'modified' })),
    fileContent: async (path) => files[path],
    upsertComment: async (pr, body) => comments.push({ pr, body }),
  };
  return { env: { GITHUB_EVENT_PATH: eventPath }, client, comments };
}

test('fails and comments when a pair misses AA', async () => {
  const { env, client, comments } = setup({ 'a.css': '.x { color: #777; background: #fff; }', 'b.js': '' });
  assert.equal(await run({ env, client }), 1);
  assert.equal(comments[0].pr, 3);
  assert.match(comments[0].body, /1 of 1 color pairs fail WCAG AA/);
  assert.match(comments[0].body, /`a.css:1`/);
});

test('passes when everything meets AA', async () => {
  const { env, client, comments } = setup({ 'a.css': '.x { color: #000; background: #fff; }' });
  assert.equal(await run({ env, client }), 0);
  assert.match(comments[0].body, /all 1 color pairs pass/);
});

test('measures see-through text against its background', async () => {
  // 50% black on white looks like #808080, which is 3.95:1
  const { env, client, comments } = setup({ 'a.css': '.x { color: rgba(0, 0, 0, 0.5); background: #fff; }' });
  assert.equal(await run({ env, client }), 1);
  assert.match(comments[0].body, /3\.95:1/);
});

test('uses the 3:1 large-text threshold', async () => {
  const { env, client } = setup({ 'a.css': '.x { color: #777; background: #fff; font-size: 32px; }' });
  assert.equal(await run({ env, client }), 0);
});

test('suggests a passing text color', async () => {
  const { env, client, comments } = setup({ 'a.css': '.x { color: #777; background: #fff; }' });
  await run({ env, client });
  assert.match(comments[0].body, /\| `#767676` \|/);
});

test('paths limits which files are checked', async () => {
  const { env, client, comments } = setup({
    'src/styles/a.css': '.x { color: #000; background: #fff; }',
    'src/stylesheet.css': '.y { color: #777; background: #fff; }',
    'legacy/b.css': '.z { color: #777; background: #fff; }',
  });
  process.env.INPUT_PATHS = './src/styles';
  try {
    assert.equal(await run({ env, client }), 0);
    assert.match(comments[0].body, /all 1 color pairs pass/);
  } finally {
    delete process.env.INPUT_PATHS;
  }
});

test('writes the report to the job summary', async () => {
  const { env, client } = setup({ 'a.css': '.x { color: #000; background: #fff; }' });
  env.GITHUB_STEP_SUMMARY = join(mkdtempSync(join(tmpdir(), 'xc-')), 'summary.md');
  await run({ env, client });
  assert.match(readFileSync(env.GITHUB_STEP_SUMMARY, 'utf8'), /all 1 color pairs pass/);
});

test('sets checked and failures outputs', async () => {
  const { env, client } = setup({ 'a.css': '.x { color: #777; background: #fff; } .y { color: #000; background: #fff; }' });
  env.GITHUB_OUTPUT = join(mkdtempSync(join(tmpdir(), 'xc-')), 'out');
  await run({ env, client });
  assert.equal(readFileSync(env.GITHUB_OUTPUT, 'utf8'), 'checked=2\nfailures=1\n');
});

test('formats a line annotation for failures', () => {
  const line = annotation({ file: 'a,b.css', line: 4, selector: '.x', text: '#777', background: '#fff', ratio: 4.48, suggestion: '#767676' }, 'AA');
  assert.equal(line, '::error file=a%2Cb.css,line=4,title=Contrast below WCAG AA::.x: #777 on #fff is 4.48:1. Try #767676.');
});
