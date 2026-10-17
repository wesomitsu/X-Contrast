import { appendFileSync, readFileSync } from 'node:fs';
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

  // Optional comma/newline separated folder or file prefixes, e.g. "src/styles, app/".
  const paths = input('paths').split(/[\n,]/).map((p) => p.trim().replace(/^\.\//, '')).filter(Boolean);
  const inPaths = (name) => paths.length === 0 || paths.some((p) => name === p || name.startsWith(p.endsWith('/') ? p : `${p}/`));
  const files = (await gh.changedFiles(pr.number)).filter(
    (f) => isCheckable(f.filename) && f.status !== 'removed' && inPaths(f.filename),
  );
  const results = [];
  for (const file of files) {
    const css = extractCss(file.filename, await gh.fileContent(file.filename, pr.head.sha));
    results.push(...checkPairs(findColorPairs(css), level).map((r) => ({ file: file.filename, ...r })));
  }

  const report = formatReport(results, level);
  console.log(report);
  if (env.GITHUB_STEP_SUMMARY) appendFileSync(env.GITHUB_STEP_SUMMARY, `${report}\n`);
  if (input('comment', 'true') === 'true') await gh.upsertComment(pr.number, report);

  for (const r of results.filter((x) => !x.pass)) console.log(annotation(r, level));
  const failing = results.filter((r) => !r.pass).length;
  if (env.GITHUB_OUTPUT) appendFileSync(env.GITHUB_OUTPUT, `checked=${results.length}\nfailures=${failing}\n`);
  return failing && input('fail-on-error', 'true') === 'true' ? 1 : 0;
}

// A workflow command that GitHub shows on that line of the PR's diff.
export function annotation(r, level) {
  const esc = (v) => String(v).replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
  const prop = (v) => esc(v).replace(/:/g, '%3A').replace(/,/g, '%2C');
  const tip = r.suggestion ? ` Try ${r.suggestion}.` : '';
  return `::error file=${prop(r.file)},line=${r.line},title=${prop(`Contrast below WCAG ${level}`)}::${esc(`${r.selector}: ${r.text} on ${r.background} is ${r.ratio.toFixed(2)}:1.${tip}`)}`;
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
