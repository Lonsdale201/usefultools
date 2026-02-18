# UsefulTools

A browser-based toolbox for common data, text, converter, diff, and code utility tasks.

## Live

GitHub Pages:
`https://lonsdale201.github.io/usefultools/`

---

## English

### What It Is

UsefulTools is a client-side React app with practical utilities for developers, marketers, and content teams.
All processing runs in your browser (offline-capable workflows, no backend required).

### Feature Overview (up to v1.2)

#### Data Generator

- Schema-based fake data generator
- Presets: `users`, `orders`, `products`, `empty`
- Column type groups: person, location, commerce, data types, tech, text, custom regex
- Per-column options:
  - numeric min/max
  - date range
  - enum/custom list
  - uniqueness toggle
- Seed support for reproducible output
- Export: `CSV`, `XLSX`, `JSON`, `SQL`

#### Text Toolbox

- Word frequency analysis (stopwords, case-fold, minimum length)
- N-gram analysis (bigram/trigram)
- Duplicate finder (sentences/paragraphs)
- Readability metrics (counts, averages, lexical diversity, longest sentence)
- Regex toolkit:
  - batch find/replace
  - extractor mode with capture groups (`Group1`, `Group2`, named groups)
  - CSV/JSON export
- Lorem ipsum generator:
  - paragraphs/sentences/words
  - configurable sentence-per-paragraph mode

#### Converters

- JSON <-> CSV
- JSON <-> YAML
- CSV Cleaner (delimiter handling, trimming, cleanup)
- Paste table (Excel/Sheets) -> CSV/XLSX
- SQL INSERT dump -> JSON/CSV
- JSONPath Explorer (structured tree view + JSONPath query + export)
- Markdown tools:
  - Markdown -> HTML
  - Markdown -> Plain text
  - HTML -> Markdown
- Date & Time Converter:
  - ISO / Unix sec/ms / RFC2822
  - source/target timezone conversion
  - batch input and TXT/CSV export
- URL Toolkit:
  - URL parser (protocol/host/path/query breakdown)
  - query parameter editor UI
  - URL encode/decode
  - batch UTM builder from CSV (`url`, `utm_*`) with CSV output

#### Diff & Compare

- Text diff (line / word / char mode)
- CSV diff by key column
- List dedup tool
- Advanced list tool:
  - unique
  - count duplicates (per-line count)
  - sort (`ABC`, `numeric`, `length`)
  - trim/lowercase/remove-empty options
  - diff two lists (`A\B`, `B\A`, intersection)
  - TXT/CSV export

#### Code Utils

- Prettify/minify (`JSON`, `XML`, `HTML`)
- HTML escape/unescape
- URL encode/decode
- Base64 encode/decode
- Hash generator (`SHA-1`, `SHA-256`, `SHA-384`, `SHA-512`)
- Advanced Password / Passphrase Generator:
  - secure RNG with Web Crypto API
  - password mode with custom rules
  - ambiguous character exclusion
  - Diceware passphrase mode
  - entropy estimation
  - passphrase constraints: no repeated words, exclude similar words

#### Everyday Tools

- QR Toolkit:
  - QR code generation from text/URL
  - QR decode from uploaded image
- Date Calculator:
  - add/subtract date offsets (minute/hour/day/week/month/year)
  - difference between two dates
- VAT Calculator:
  - net -> gross
  - gross -> net
  - VAT amount breakdown
- Text Cleanup:
  - line trim
  - whitespace normalization
  - empty-line removal
  - duplicate-line removal
  - case transform (lower/upper/title)

### UI / UX Notes

- Language switch: English / Hungarian
- Sidebar changelog modal, reading entries from `CHANGELOG.md`
- Shadcn-based UI components (including checkbox styling)

---

## Magyar

### Mi Ez

A UsefulTools egy kliensoldali React alkalmazás, amely fejlesztői, marketinges és tartalomkészítési feladatokhoz ad gyors segédeszközöket.
Minden feldolgozás a böngészőben történik (nincs szükség backendre).

### Funkciók Összefoglalása (v1.2-ig)

#### Adatgenerátor

- Sémára épülő tesztadat-generálás
- Előre definiált sablonok: `users`, `orders`, `products`, `empty`
- Oszloptípus csoportok: személy, hely, kereskedelem, adattípusok, technikai, szöveg, egyedi regex
- Oszloponkénti opciók:
  - numerikus min/max
  - dátumintervallum
  - enum/saját lista
  - egyediség kapcsoló
- Seed támogatás az ismételhető generáláshoz
- Export: `CSV`, `XLSX`, `JSON`, `SQL`

#### Szöveg Eszköztár

- Szógyakoriság elemzés (stopword, kis/nagybetű kezelés, minimum hossz)
- N-gram elemzés (bigram/trigram)
- Duplikációkereső (mondat/bekezdés)
- Olvashatósági metrikák (darabszámok, átlagok, lexikai diverzitás, leghosszabb mondat)
- Regex eszközök:
  - batch keresés/csere
  - kinyerő mód capture group táblával (`Group1`, `Group2`, név szerinti csoportok)
  - CSV/JSON export
- Lorem ipsum generátor:
  - bekezdés/mondat/szó mód
  - állítható mondat/bekezdés

#### Konverterek

- JSON <-> CSV
- JSON <-> YAML
- CSV tisztító (delimiter kezelés, trim, javítás)
- Táblázat beillesztés (Excel/Sheets) -> CSV/XLSX
- SQL INSERT dump -> JSON/CSV
- JSONPath Explorer (strukturált tree nézet + JSONPath lekérdezés + export)
- Markdown eszközök:
  - Markdown -> HTML
  - Markdown -> Plain text
  - HTML -> Markdown
- Dátum és idő konverter:
  - ISO / Unix sec/ms / RFC2822
  - forrás/cél időzóna átváltás
  - batch feldolgozás + TXT/CSV export
- URL Eszköztár:
  - URL parser (protokoll/host/útvonal/query bontás)
  - query paraméter-szerkesztő felület
  - URL encode/decode
  - batch UTM építő CSV-ből (`url`, `utm_*`), CSV kimenettel

#### Diff és Összehasonlítás

- Szöveg diff (sor / szó / karakter mód)
- CSV diff kulcsoszlop alapján
- Lista deduplikáló
- Fejlettebb listatool:
  - egyedi sorok
  - duplikátumszámlálás soronként
  - rendezés (`ABC`, `numeric`, `length`)
  - trim/kisbetűsítés/üres sor törlés opciók
  - két lista diff (`A\B`, `B\A`, metszet)
  - TXT/CSV export

#### Kód Eszközök

- Formázás/tömörítés (`JSON`, `XML`, `HTML`)
- HTML escape/unescape
- URL encode/decode
- Base64 encode/decode
- Hash generátor (`SHA-1`, `SHA-256`, `SHA-384`, `SHA-512`)
- Haladó jelszó/jelmondat generátor:
  - biztonságos random generálás Web Crypto API-val
  - jelszó mód egyedi szabályokkal
  - félreolvasható karakterek kizárása
  - Diceware jelmondat mód
  - entrópia becslés
  - jelmondat opciók: ismétlődő szavak tiltása, hasonló szavak tiltása

#### Mindennapi Eszközök

- QR Eszköztár:
  - QR-kód generálás szövegből/URL-ből
  - QR-kód visszaolvasás feltöltött képből
- Dátum Kalkulátor:
  - dátum hozzáadás/kivonás (perc/óra/nap/hét/hónap/év)
  - két dátum közti különbség számítása
- ÁFA Kalkulátor:
  - nettó -> bruttó
  - bruttó -> nettó
  - ÁFA összeg bontás
- Szöveg Tisztító:
  - sorok trimelése
  - whitespace normalizálás
  - üres sorok törlése
  - duplikált sorok kiszűrése
  - kis/nagybetű átalakítás (lower/upper/title)

### UI / UX Megjegyzések

- Nyelvváltás: magyar / angol
- Sidebar változásnapló modal (`CHANGELOG.md` alapján)
- Shadcn-alapú UI komponensek (beleértve a checkboxokat)

---

## Tech Stack

- React + TypeScript
- Vite
- Tailwind CSS
- shadcn/ui + Radix UI
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

Deployment workflow:
`.github/workflows/deploy-pages.yml`

Builds on push to `main` and publishes the `dist` output to GitHub Pages.

## Versioning

Current version: `1.2.0`

Release notes:
`CHANGELOG.md`
