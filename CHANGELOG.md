# Changelog

All notable changes to this project are tracked in this file.

## [1.3] - 2026.02.21

### Added

- `Converters`:
  - JSONPath Explorer upgraded with a dynamic JSON extractor workflow:
    - auto-discovered record sources from uploaded JSON
    - dynamic field-level filtering (`contains` / `equals`)
    - selectable label/value mapping with export-ready outputs (`label: ... / value: ...`, plain, comma, JSON)
- `Code Utils`:
  - New `Dependency Impact` tool:
    - analyze `package.json` + `package-lock.json` dependency graph (direct + transitive links)
    - inspect package relations (`depends on`, `depended by`)
    - remove-impact preview for direct dependencies
    - interactive graph view with focus highlighting, zoom, and pan

## [1.2] - 2026.02.18

### Added

- `Converters`:
  - Date & Time converter (ISO/Unix/RFC2822 + timezone conversion, batch mode, TXT/CSV export)
  - JSONPath Explorer (JSON tree view + JSONPath query field + result export)
  - Markdown tools:
    - Markdown -> HTML
    - Markdown -> Plain text
    - HTML -> Markdown
  - URL Toolkit:
    - URL parser (protocol/host/path/query details)
    - Query parameter editor (add/edit/remove + rebuild URL)
    - URL encode/decode utility
    - Batch UTM builder from CSV (`url`, `utm_*` columns) with CSV output
- `Diff & Compare`:
  - New list tool features:
    - count duplicates (per-line counts)
    - sort (`ABC` / `numeric` / `length`)
    - separate `remove empty` switch
    - two-list diff (`A\B`, `B\A`, intersection)
    - CSV export for list outputs
- `Code Utils`:
  - Advanced Password / Passphrase generator:
    - secure offline generation (Web Crypto API)
    - Diceware passphrase mode with entropy estimation
    - custom rules and ambiguous character exclusion
    - optional `no repeated words` and `exclude similar words` passphrase constraints
- `Everyday Tools` (new category):
  - QR Toolkit:
    - QR generation from text/URL
    - QR decode from uploaded image
  - Date Calculator:
    - add/subtract offsets (min/hour/day/week/month/year)
    - two-date difference calculator
  - VAT Calculator:
    - net -> gross
    - gross -> net
    - VAT amount breakdown
  - Text Cleanup:
    - trim / whitespace normalization / remove empty / dedupe lines
    - lowercase / uppercase / title-case transforms

### Fixed

- Hungarian text encoding issues in Converter tabs and labels
- Date difference unit labels localized in Hungarian (`perc`, `óra`, `nap`)

## [1.1] - 2026.02.18

### Added

- SQL INSERT dump converter in Converters (`SQL -> JSON/CSV`) with paste and file upload support
- Regex batch extractor mode in Text Toolbox with capture-group table and CSV/JSON export
- Sidebar changelog button with modal popup, parsing entries from `CHANGELOG.md` with 3 items per page

## [1.0.0] - 2026.02.18

### Added

- Initial public release setup
- Core tool groups:
  - Data Generator
  - Text Toolbox
  - Converters
  - Diff & Compare
  - Code Utils
- GitHub Pages deployment workflow via GitHub Actions
