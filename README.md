# X-Contrast

A GitHub Action that checks the color contrast of CSS changed in a pull request.
It finds rules that set both `color` and a background, checks each pair against
[WCAG 2.x](https://www.w3.org/TR/WCAG21/#contrast-minimum), and posts one comment
on the PR with the results (updated on every push, never duplicated).

## Usage

```yaml
# .github/workflows/contrast.yml
name: Contrast
on: pull_request

permissions:
  contents: read
  pull-requests: write

jobs:
  contrast:
    runs-on: ubuntu-latest
    steps:
      - uses: wesomitsu/X-Contrast@main
        with:
          level: AA # or AAA
```

The comment looks like this:

> ### X-Contrast: 1 of 2 color pairs fail WCAG AA
>
> | | Where | Selector | Colors | Ratio |
> |---|---|---|---|---|
> | ✅ | `examples/demo.css:2` | `.button-primary` | `#ffffff` on `#1d4ed8` | 6.70:1 |
> | ❌ | `examples/demo.css:3` | `.hint` | `#94a3b8` on `#ffffff` | 2.56:1 |

## Inputs

| Input | Default | What it does |
|---|---|---|
| `level` | `AA` | `AA` (4.5:1) or `AAA` (7:1), for normal text |
| `comment` | `true` | Post or update the PR comment |
| `fail-on-error` | `true` | Fail the job when a pair misses the level |
| `token` | `github.token` | Token used to read the PR and write the comment |

## What it understands

- Files: `.css`, `.scss`, and `<style>` blocks in `.html`, `.vue`, `.svelte` and `.astro`
- Colors: `#rgb`, `#rrggbb`, `rgb()`, `hsl()`, `black`, `white`
- Properties: `color` with `background-color` or `background` in the same rule
- CSS variables, other named colors and transparency are skipped

On pull requests from forks, the default token can't write comments. Set
`comment: 'false'` there and read the results in the job log instead.

## How it works

It uses the GitHub REST API to list the PR's changed files, read each `.css`
file at the PR's head commit, and create or update its comment. No dependencies.

## Development

```sh
npm test
```

## License

MIT
