# obdex

[![validate](https://github.com/foerbsnavi/obdex/actions/workflows/validate.yml/badge.svg)](https://github.com/foerbsnavi/obdex/actions/workflows/validate.yml)
[![data: CC0-1.0](https://img.shields.io/badge/data-CC0--1.0-blue.svg)](LICENSE-DATA)
[![code: MIT](https://img.shields.io/badge/code-MIT-green.svg)](LICENSE-CODE)

**The complete, open, machine-readable list of every generic OBD-II diagnostic trouble code — with bilingual descriptions, common causes, and repair estimates.**

If you are looking up a P-, B-, C- or U-code from your scan tool, this is a single source you can read, fork, and embed without paywalls or per-API fees.

> **Status: 9,533 / 9,533 codes fully described — 100 % across all seven families (P0, P2, P3, U0, U3, B0, C0).** No stubs left; the dataset is complete.

## What you get

- **All 9,533 generic codes** of the SAE J2012 / ISO 15031-6 standard in one repository, every one with the full schema.
- **Plain English and German** title, description, affected components, common causes with likelihood, repair difficulty + cost + hours, MIL / emissions / limp-mode flags, and sources — for every single code.
- **132 OBD-II PIDs** (Mode 01 + Mode 09) with formulas, units, and ranges.
- **CC0 data, MIT tooling.** Use it in your scan-tool app, garage software, training material — no attribution required, no licence fee.
- **Static JSON over CDN.** No API key, no rate limit, no account.

Manufacturer-specific codes (P1xxx, B1xxx, etc.) are deliberately out of scope — those are vendor IP. obdex covers only the generic layer that every OBD-II tool already speaks.

## Use it

Direct JSON over GitHub Pages — no auth, no rate limit:

```
https://foerbsnavi.github.io/obdex/all.json          # everything
https://foerbsnavi.github.io/obdex/generic.json      # DTCs only
https://foerbsnavi.github.io/obdex/pids/mode01.json  # live data PIDs
https://foerbsnavi.github.io/obdex/pids/mode09.json  # vehicle info PIDs
https://foerbsnavi.github.io/obdex/meta.json         # counts, build time
```

Each file also exists as a minified `.min.json` variant for production:

```
https://foerbsnavi.github.io/obdex/all.min.json
```

Two ways to explore the dataset:

- **Interactive search** — <https://obd.signalwelt.de/> — full search app with detail cards (causes, components, repair, sources) and offline PWA. Try `P0420`, `oxygen sensor`, `Lambdasonde`, `0C`.
- **Data browser** — <https://foerbsnavi.github.io/obdex/> — overview page with live coverage counts and direct JSON download links.

## What an entry looks like

```yaml
- code: P0420
  category: powertrain
  title:
    en: Catalyst System Efficiency Below Threshold (Bank 1)
    de: Katalysatorwirkungsgrad unter Schwellwert (Bank 1)
  description:
    en: The oxygen storage capacity of the main catalytic converter on bank 1
      has degraded below the OBD threshold. The downstream oxygen sensor signal
      increasingly mirrors the upstream sensor, indicating reduced conversion
      efficiency.
    de: Die Sauerstoffspeicherfähigkeit des Hauptkatalysators auf Bank 1 liegt
      unter dem OBD-Grenzwert. …
  affected_components:
    - catalytic_converter
    - oxygen_sensor_upstream
    - oxygen_sensor_downstream
  common_causes:
    - id: catalyst_aged
      likelihood: high
      label:
        en: Catalyst aged or contaminated
        de: Katalysator gealtert oder vergiftet
    - id: o2_sensor_downstream_drift
      likelihood: medium
      label: { en: Downstream oxygen sensor drift, de: Nachgeschaltete Lambdasonde driftet }
  repair:
    difficulty: hard
    diy_possible: false
    estimated_cost_eur: [600, 2500]
    estimated_hours: [1.5, 5.0]
  flags:
    mil: true
    emissions_relevant: true
  sources:
    - https://en.wikipedia.org/wiki/Catalytic_converter
```

## Develop locally

```bash
git clone https://github.com/foerbsnavi/obdex.git
cd obdex
npm install
npm run check     # validate + duplicate detection
npm run build     # generate dist/
```

Requires Node.js ≥ 20.

## Structure

```
data/
├── generic/                          SAE J2012 codes, valid for all OBD-II vehicles
│   └── <family>xxx_enriched.yaml     full schema, one file per family (P0/P2/P3/U0/U3/B0/C0)
└── pids/                             Live data parameter IDs (Mode 01, 09, …)

schema/                               JSON Schema (Draft 2020-12)
tools/                                Node.js validation + build scripts
```

Each generic-DTC family lives in a single `_enriched.yaml` file. The build reads them all and emits one merged dataset in `dist/`.

## Coverage

| Family | Codes | Enriched |
|--------|------:|---------:|
| P0 — Powertrain | 3,705 | 100 % |
| P2 — Powertrain (SAE) | 3,495 | 100 % |
| P3 — Powertrain (mixed) | 155 | 100 % |
| B0 — Body | 323 | 100 % |
| C0 — Chassis | 626 | 100 % |
| U0 — Network | 1,055 | 100 % |
| U3 — Network (HV / FCEV) | 174 | 100 % |
| **Total** | **9,533** | **100 %** |

Every code carries the full schema: English + German title and description, affected components, common causes with likelihood, repair difficulty / cost / hours, MIL / emissions / limp-mode flags, and at least one public source.

The 132 PIDs (Mode 01 + Mode 09) are all complete with formula, unit, and range where applicable.

Live counts are also in [`meta.json`](https://foerbsnavi.github.io/obdex/meta.json) and visualised on the [landing page](https://foerbsnavi.github.io/obdex/).

## Maintainer notes

GitHub Pages must be configured with **Source: GitHub Actions** in the repository settings before the first push to `main` for the release workflow to succeed.

## Schema

- [`schema/code.schema.json`](schema/code.schema.json) — DTC entries
- [`schema/pid.schema.json`](schema/pid.schema.json) — PID entries

JSON Schema Draft 2020-12. CI rejects any pull request that fails validation or introduces duplicate codes.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Short version: one PR per code or coherent batch, sources required, schema-validated automatically.

## License

- Data: [CC0-1.0](LICENSE-DATA) — public domain dedication.
- Code: [MIT](LICENSE-CODE).

SAE J2012 itself remains copyrighted. This repository contains independently authored descriptions referencing the publicly known code identifiers, not the SAE document text. Contributors must write their own descriptions in their own words — identifiers and bit-level facts are not copyrightable, but verbatim text from any service document is.

## Disclaimer

The data in this repository is provided **as is**, without warranty of any kind, express or implied. Diagnostic trouble codes describe symptoms, not definitive faults — incorrect interpretation can lead to wrong repairs and damage. Always cross-check with the vehicle's service documentation and qualified diagnostic tools before acting on any information from this database. Contributors and maintainers accept no liability for decisions made based on this data.
