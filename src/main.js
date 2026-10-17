import { readFileSync } from 'node:fs';
import { findColorPairs } from './css.js';
import { createClient } from './github.js';
import { extractCss, isCheckable } from './sources.js';
import { checkPairs, formatReport } from './report.js';

const input = (name, fallback = '') => process.env[`INPUT_${name.toUpperCase()}`]?.trim() || fallback;

export async function run({ env = process.env, client } = {}) {
  const event = JSON.parse(readFileSync(env.GITHUB_EVENT_PATH, 'utf8'));
  const pr = event.pull_request;
  if (!pr) {
    console.log('Not a pull_request event, nothing to check.');
    return 0;
  }

  const level = input('level', 'AA').toUpperCase();
  if (level !== 'AA' && level !== 'AAA') throw new Error('level must be AA or AAA');
  const gh = client ?? createClient({ token: input('token'), repo: env.GITHUB_REPOSITORY });

  const files = (await gh.changedFiles(pr.number)).filter((f) => isCheckable(f.filename) && f.status !== 'removed');
  const results = [];
  for (const file of files) {
    const css = extractCss(file.filename, await gh.fileContent(file.filename, pr.head.sha));
    results.push(...checkPairs(findColorPairs(css), level).map((r) => ({ file: file.filename, ...r })));
  }

  const report = formatReport(results, level);
  console.log(report);
  if (input('comment', 'true') === 'true') await gh.upsertComment(pr.number, report);

  const failing = results.filter((r) => !r.pass).length;
  return failing && input('fail-on-error', 'true') === 'true' ? 1 : 0;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run().then(
    (code) => process.exit(code),
    (err) => {
      console.error(`::error::${err.message}`);
      process.exit(1);
    },
  );
}
