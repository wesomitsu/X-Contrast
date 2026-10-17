import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createClient, MARKER } from '../src/github.js';

function fakeFetch(routes) {
  const calls = [];
  const fetch = async (url, init) => {
    const key = `${init.method} ${url.replace('https://api.github.com/repos/o/r', '')}`;
    calls.push({ key, init });
    const body = routes[key];
    if (body === undefined) return { ok: false, status: 404 };
    return { ok: true, status: 200, json: async () => body, text: async () => body };
  };
  return { fetch, calls };
}

test('lists changed files across pages', async () => {
  const page1 = Array.from({ length: 100 }, (_, i) => ({ filename: `f${i}.css` }));
  const { fetch } = fakeFetch({
    'GET /pulls/7/files?per_page=100&page=1': page1,
    'GET /pulls/7/files?per_page=100&page=2': [{ filename: 'last.css' }],
  });
  const files = await createClient({ token: 't', repo: 'o/r', fetch }).changedFiles(7);
  assert.equal(files.length, 101);
});

test('reads raw file content at a ref', async () => {
  const { fetch, calls } = fakeFetch({ 'GET /contents/src/a%20b.css?ref=abc': '.a{}' });
  assert.equal(await createClient({ token: 't', repo: 'o/r', fetch }).fileContent('src/a b.css', 'abc'), '.a{}');
  assert.equal(calls[0].init.headers.Accept, 'application/vnd.github.raw');
  assert.equal(calls[0].init.headers.Authorization, 'Bearer t');
});

test('creates the comment when there is none', async () => {
  const { fetch, calls } = fakeFetch({
    'GET /issues/7/comments?per_page=100&page=1': [{ id: 1, body: 'hi' }],
    'POST /issues/7/comments': { id: 2 },
  });
  await createClient({ token: 't', repo: 'o/r', fetch }).upsertComment(7, 'report');
  assert.equal(calls.at(-1).key, 'POST /issues/7/comments');
  assert.equal(JSON.parse(calls.at(-1).init.body).body, `${MARKER}\nreport`);
});

test('updates its own comment instead of adding another', async () => {
  const { fetch, calls } = fakeFetch({
    'GET /issues/7/comments?per_page=100&page=1': [{ id: 5, body: `${MARKER}\nold` }],
    'PATCH /issues/comments/5': { id: 5 },
  });
  await createClient({ token: 't', repo: 'o/r', fetch }).upsertComment(7, 'new');
  assert.equal(calls.at(-1).key, 'PATCH /issues/comments/5');
});

test('throws on API errors', async () => {
  const { fetch } = fakeFetch({});
  await assert.rejects(createClient({ token: 't', repo: 'o/r', fetch }).changedFiles(7), /failed with 404/);
});
