# UsefulTools

A browser-based toolbox for day-to-day data, text, conversion, diff, and code utility tasks.

## Live

GitHub Pages URL:
`https://lonsdale201.github.io/usefultools/`

## What It Does

UsefulTools is a single-page React app with multiple tool groups:

- Data Generator
- Text Toolbox
- Converters
- Diff & Compare
- Code Utils

Everything runs client-side in your browser. No server processing is required.

## Tool Groups

### Data Generator

- Schema-based fake data generation
- Presets (users, orders, products)
- Export to CSV, XLSX, JSON, SQL

### Text Toolbox

- Word frequency
- N-gram analysis
- Duplicate sentence/paragraph finder
- Readability metrics
- Regex batch find/replace
- Lorem ipsum generator

### Converters

- JSON <-> CSV
- JSON <-> YAML
- CSV cleaner
- Paste table -> CSV/XLSX
- SQL INSERT dump -> JSON/CSV

### Diff & Compare

- Text diff (line/word/char mode)
- CSV diff by key column
- List deduplication

### Code Utils

- Prettify/minify (JSON/XML/HTML)
- HTML and URL escape/unescape
- Base64 encode/decode
- Hash generator (SHA-1, SHA-256, SHA-384, SHA-512)

## Tech Stack

- React + TypeScript
- Vite
- Tailwind CSS
- GitHub Actions + GitHub Pages

## Local Development

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
```

## Deployment

This repository contains a GitHub Actions workflow at:
`.github/workflows/deploy-pages.yml`

It builds on pushes to `main` and deploys the `dist` output to GitHub Pages.

## Versioning

Current version: `1.0.0` (`VERSION`)

Release notes are tracked in:
`CHANGELOG.md`
