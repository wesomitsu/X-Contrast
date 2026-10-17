# X-Contrast

A GitHub Action that checks the color contrast of CSS changed in a pull request.
It finds rules that set both `color` and a background, checks each pair against
[WCAG 2.x](https://www.w3.org/TR/WCAG21/#contrast-minimum), and posts one comment
on the PR with the results and a suggested fix for each failing pair (updated on every push, never duplicated).

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

The same table is added to the run's summary page. The comment looks like this:

> ### X-Contrast: 1 of 2 color pairs fail WCAG AA
>
> | | Where | Selector | Colors | Ratio | Try |
> |---|---|---|---|---|---|
> | ✅ | `examples/demo.css:2` | `.button-primary` | `#ffffff` on `#1d4ed8` | 6.70:1 |  |
> | ❌ | `examples/demo.css:3` | `.hint` | `#94a3b8` on `#ffffff` | 2.56:1 | `#6c7786` |

## Inputs

| Input | Default | What it does |
|---|---|---|
| `level` | `AA` | `AA` (4.5:1, or 3:1 for large text) or `AAA` (7:1, or 4.5:1) |
| `paths` | (all) | Only check files under these folders, comma or newline separated |
| `comment` | `true` | Post or update the PR comment |
| `fail-on-error` | `true` | Fail the job when a pair misses the level |
| `token` | `github.token` | Token used to read the PR and write the comment |

## What it understands

- Files: `.css`, `.scss`, and `<style>` blocks in `.html`, `.vue`, `.svelte` and `.astro`
- Colors: `#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`, `rgb()`, `rgba()`, `hsl()`, `hsla()`, `black`, `white`, `transparent`
- See-through text is blended over its background; a see-through background is assumed to sit on white
- Properties: `color` with `background-color` or `background` in the same rule
- CSS variables defined in the same file, including `var(--x, fallback)`
- Large text: `font-size` of 24px+, or 18.66px+ with bold, in the same rule (px, pt, rem/em at 16px)
- Other named colors are skipped

On pull requests from forks, the default token can't write comments. Set
`comment: 'false'` there and read the results in the job log instead.

## Skipping a rule

Put `/* x-contrast-ignore */` right before a rule to leave it out, for example a logo with brand colors:

```css
/* x-contrast-ignore */
.logo { color: #fbbf24; background: #fff; }
```

## How it works

It uses the GitHub REST API to list the PR's changed files, read each `.css`
file at the PR's head commit, and create or update its comment. No dependencies.

## Development

```sh
npm test
```

## License

MIT
