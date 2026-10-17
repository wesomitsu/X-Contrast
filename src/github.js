export const MARKER = '<!-- x-contrast -->';

// Minimal GitHub REST client using fetch. `fetch` can be swapped in tests.
export function createClient({ token, repo, fetch = globalThis.fetch, api = 'https://api.github.com' }) {
  async function request(method, path, body, accept = 'application/vnd.github+json') {
    const res = await fetch(`${api}/repos/${repo}${path}`, {
      method,
      headers: {
        Accept: accept,
        Authorization: `Bearer ${token}`,
        'User-Agent': 'x-contrast',
        'X-GitHub-Api-Version': '2022-11-28',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`GitHub API ${method} ${path} failed with ${res.status}`);
    return accept.endsWith('raw') ? res.text() : res.json();
  }

  return {
    async changedFiles(pr) {
      const files = [];
      for (let page = 1; ; page++) {
        const batch = await request('GET', `/pulls/${pr}/files?per_page=100&page=${page}`);
        files.push(...batch);
        if (batch.length < 100) return files;
      }
    },

    fileContent(path, ref) {
      const encoded = path.split('/').map(encodeURIComponent).join('/');
      return request('GET', `/contents/${encoded}?ref=${encodeURIComponent(ref)}`, null, 'application/vnd.github.raw');
    },

    // Keeps a single bot comment per PR: edits it if it exists, creates it otherwise.
    async upsertComment(pr, body) {
      const text = `${MARKER}\n${body}`;
      for (let page = 1; ; page++) {
        const comments = await request('GET', `/issues/${pr}/comments?per_page=100&page=${page}`);
        const mine = comments.find((c) => c.body?.startsWith(MARKER));
        if (mine) return request('PATCH', `/issues/comments/${mine.id}`, { body: text });
        if (comments.length < 100) break;
      }
      return request('POST', `/issues/${pr}/comments`, { body: text });
    },
  };
}
