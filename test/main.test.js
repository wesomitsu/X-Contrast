import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { run } from '../src/main.js';

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
