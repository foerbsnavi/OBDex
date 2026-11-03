<div align="center">

# obdex

**The open, machine-readable database of every generic OBD-II trouble code.**

9,533 codes · 132 PIDs · English + German · free to use, fork and embed

[![validate](https://github.com/foerbsnavi/obdex/actions/workflows/validate.yml/badge.svg)](https://github.com/foerbsnavi/obdex/actions/workflows/validate.yml)
[![reviewed](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Ffoerbsnavi.github.io%2FOBDex%2Fmeta.json&query=%24.counts.generic.reviewed&label=reviewed%20individually&suffix=%20%2F%209%2C533&color=2f7d32)](#-edition-2--every-code-reviewed-individually)
[![data: CC0-1.0](https://img.shields.io/badge/data-CC0--1.0-blue.svg)](LICENSE-DATA)
[![code: MIT](https://img.shields.io/badge/code-MIT-green.svg)](LICENSE-CODE)
[![stars](https://img.shields.io/github/stars/foerbsnavi/obdex?style=flat&color=yellow)](https://github.com/foerbsnavi/obdex/stargazers)

**[🚗 Live search](https://obd.signalwelt.de/)** · **[📊 Data browser](https://foerbsnavi.github.io/OBDex/)** · **[⚡ Quick start](#-quick-start)** · **[📈 Review progress](#-edition-2--every-code-reviewed-individually)** · **[🤝 Contribute](#-contributing)**

</div>

---

Your scan tool says `P0420`. obdex tells you what the engine module actually checked, why it set the code, what usually causes it, what you will notice, and roughly what the repair costs. Every code is a single, open entry you can read, fork and embed, with no paywall, no API key and no per-request fee.

| | |
|---|---|
| 🚗 **[obd.signalwelt.de](https://obd.signalwelt.de/)** | Live search app: full DE/EN interface, installable as a PWA, deep links, PDF export. Try `P0420`, `oxygen sensor` or `Lambdasonde`. |
| 📊 **[Data browser](https://foerbsnavi.github.io/OBDex/)** | Search the raw database and download the JSON bundles. |
| 📦 **[Static JSON](#-endpoints)** | One fetch away, served from GitHub Pages: no auth, no rate limit, no account. |

## 📈 Edition 2 — every code reviewed individually

The first edition gave all 9,533 codes a complete entry. **Edition 2 checks every code individually**: since October 2026 we have been working through the whole database in 195 packages of 50 codes, family by family, and rewriting each entry from verified sources. The chart below is rebuilt from the data on every release, so it always shows the current state:

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://foerbsnavi.github.io/OBDex/progress-dark.svg">
    <img src="https://foerbsnavi.github.io/OBDex/progress.svg" width="720" alt="Review progress per code family: share of codes that carry a reviewed date. Live numbers are in meta.json under counts.generic.by_family.">
  </picture>
</p>

**A reviewed code has passed all of these checks:**

| | Check |
|---|---|
| 🏷️ **Title** | confirmed against at least two independent code lists |
| 📚 **Sources** | at least two that explain *this* code or its monitor, one of them a regulation (CARB 13 CCR § 1968.2) or a manufacturer / supplier technical document; every URL fetched and read |
| ✍️ **Text** | description in English and German written fresh for this code: what is monitored, when the module sets the code, what it means for the driver |
| 🔧 **Details** | causes with likelihood, symptoms, repair estimate and flags (MIL, emissions, drive cycle, limp mode) checked for this code |
| 🔗 **Links** | related codes exist in obdex and belong together (other bank, high/low pair, range/performance) |

It then carries the field `reviewed: 'YYYY-MM-DD'`. Codes without it still hold their complete first-edition entry.

**Order of work:** P0 → P2 → U0 → C0 → B0 → P3 → U3. Community pull requests review codes across all families, and every reviewed code counts towards the chart as soon as it is merged.

Need only reviewed data today? Filter on the field:

```js
const reviewed = codes.filter(c => c.reviewed);
```

## ⚡ Quick start

Look up a single code in three lines of JavaScript:

```js
const r = await fetch("https://foerbsnavi.github.io/OBDex/generic.min.json");
const codes = await r.json();
const p0420 = codes.find(c => c.code === "P0420");
console.log(p0420.title.en);  // "Catalyst System Efficiency Below Threshold Bank 1"
```

Or with curl and jq:

```bash
curl -s https://foerbsnavi.github.io/OBDex/generic.min.json | jq '.[] | select(.code=="P0420")'
```

Or in Python:

```python
import json, urllib.request
codes = json.load(urllib.request.urlopen("https://foerbsnavi.github.io/OBDex/generic.min.json"))
print(next(c for c in codes if c["code"] == "P0420")["title"]["de"])
```

## 🧩 What you get

| | |
|---|---|
| **9,533 generic DTCs** | the full SAE J2012 / ISO 15031-6 code space: P0, P2, P3, B0, C0, U0, U3 |
| **Bilingual entries** | title, description, causes and symptoms in English and German |
| **Diagnosis help** | affected components, common causes with likelihood, symptoms, repair difficulty, DIY flag, cost (€) and hours |
| **Flags** | MIL, emissions relevance, drive cycle, limp mode |
| **Cross-references** | 34,000+ links between related codes |
| **Sources** | 24,000+ source links, at least one per code (at least two for reviewed codes) |
| **132 PIDs** | Mode 01 live data and Mode 09 vehicle info, with formula, unit and range |
| **Open licences** | CC0 data, MIT tooling: use it in scan-tool apps, garage software or training material |

Manufacturer-specific codes (P1xxx, B1xxx and so on) are deliberately out of scope; they are vendor IP. obdex covers the generic layer that every OBD-II tool already speaks.

## 🔍 What an entry looks like

P0420 after its review (shortened):

```yaml
- code: P0420
  category: powertrain
  title:
    en: Catalyst System Efficiency Below Threshold Bank 1
    de: Katalysatorsystem Wirkungsgrad unter Schwellwert Bank 1
  description:
    en: The engine module checks whether the catalyst of bank 1 still converts enough.
      On petrol engines it estimates the oxygen storage capacity by comparing the
      sensors before and after the catalyst – a good catalyst smooths the rear signal. …
    de: Das Motorsteuergerät prüft, ob der Katalysator von Bank 1 noch genug umsetzt. …
  affected_components: [catalytic_converter, downstream_oxygen_sensor, upstream_oxygen_sensor, engine_control_module]
  common_causes:
    - id: aged
      likelihood: high
      label:
        en: Catalyst aged or poisoned (oil consumption, silicone, coolant)
        de: Katalysator gealtert oder vergiftet (Ölverbrauch, Silikon, Kühlmittel)
    - id: o2_sensor
      likelihood: medium
      label:
        en: Rear oxygen sensor sluggish, dirty or unsuitable
        de: Hintere Lambdasonde träge, verschmutzt oder ungeeignet
  symptoms:
    - en: Check engine light on, otherwise often no change in driving
      de: Motorkontrollleuchte an, sonst oft keine Auffälligkeit
    - en: Emission test failed (higher HC, CO, NOx)
      de: Abgasuntersuchung nicht bestanden (höhere HC-, CO-, NOx-Werte)
  repair:
    difficulty: medium
    diy_possible: true
    estimated_cost_eur: [80, 1800]
    estimated_hours: [0.5, 3]
  flags:
    mil: true
    emissions_relevant: true
    drive_cycle_required: true
    limp_mode_possible: false
  references: [sae:J2012]
  related_codes: [P0430, P0421, P0422, P0136, P2270, P0300]
  sources:
    - https://www.law.cornell.edu/regulations/california/13-CCR-1968.2
    - https://gsi.ext.gm.com/gmspo/mode6/pdf/2018/18OBDG03A%20Engine%20Diagnostics.pdf
    - https://www.fordservicecontent.com/Ford_Content/catalog/motorcraft/OBD-Operations-Summary-Gasoline-2020-2023.pdf
  reviewed: '2026-10-11'
```

The full schema is in [`schema/code.schema.json`](schema/code.schema.json) (DTCs) and [`schema/pid.schema.json`](schema/pid.schema.json) (PIDs), JSON Schema Draft 2020-12.

## 📦 Endpoints

Plain JSON on GitHub Pages. Every file also exists as a minified `.min.json`.

| URL | Content |
|---|---|
| [`/generic.json`](https://foerbsnavi.github.io/OBDex/generic.json) | all 9,533 DTCs |
| [`/all.json`](https://foerbsnavi.github.io/OBDex/all.json) | DTCs and PIDs combined |
| [`/pids/mode01.json`](https://foerbsnavi.github.io/OBDex/pids/mode01.json) | live data PIDs |
| [`/pids/mode09.json`](https://foerbsnavi.github.io/OBDex/pids/mode09.json) | vehicle info PIDs |
| [`/meta.json`](https://foerbsnavi.github.io/OBDex/meta.json) | counts per family, review progress, build time, credit line |

All URLs start with `https://foerbsnavi.github.io/OBDex`.

## 🗂️ Code families

| Family | Area | Codes |
|---|---|---:|
| **P0** | Powertrain (SAE) | 3,705 |
| **P2** | Powertrain (SAE, extension) | 3,495 |
| **P3** | Powertrain (shared SAE / manufacturer range) | 155 |
| **B0** | Body | 323 |
| **C0** | Chassis | 626 |
| **U0** | Network | 1,055 |
| **U3** | Network (hybrid / fuel cell) | 174 |
| | **Total** | **9,533** |

Every code in every family has a complete entry; the review progress per family is in the [chart above](#-edition-2--every-code-reviewed-individually).

## 🌍 Languages

| Language | Titles | Descriptions, causes, symptoms |
|---|---|---|
| 🇬🇧 English | all codes | all codes |
| 🇩🇪 German | all codes | all codes |
| ➕ **yours?** | | |

The schema accepts any ISO 639-1 language key next to `en` and `de`, so a new language needs no code change. Translations are very welcome, even for a single family; please write them in your own words and open a pull request (see [CONTRIBUTING.md](CONTRIBUTING.md)).

## 💡 Use cases

- **Garage and workshop software**: bilingual code lookup without a vendor cloud
- **Scan-tool front-ends**: turn the codes from an ELM327 dongle into readable explanations with cause hints
- **Driver and DIY apps**: show repair difficulty and a cost range before the workshop visit
- **Training material**: every code explained, with sources
- **Research**: 9,533 codes with consistent fields in one JSON file

## 🤝 Contributing

Corrections, reviews and translations are all welcome. Everything is checked automatically: CI validates the schema, duplicates and related-code links on every pull request.

- **Found a wrong code?** Open a [correction issue](https://github.com/foerbsnavi/obdex/issues/new/choose) or a pull request.
- **Want to review codes?** [CONTRIBUTING.md → Reviewing codes](CONTRIBUTING.md#reviewing-codes) explains the package tools and what a review needs.
- **Rules of thumb:** sources required, your own words only, one pull request per code or coherent batch.

**Thank you** to everyone who has improved obdex so far, among them [rslnautic](https://github.com/rslnautic) (reviewed P2 codes, cleaned-up prose and titles) and [Noabza](https://github.com/Noabza) (142 corrected titles).

<details>
<summary><b>Develop locally</b></summary>

```bash
git clone https://github.com/foerbsnavi/obdex.git
cd obdex
npm install
npm run check     # schema, duplicates, related codes
npm run build     # generate dist/
```

Requires Node.js ≥ 20.

```
data/
├── generic/                          SAE J2012 codes, valid for all OBD-II vehicles
│   └── <family>xxx_enriched.yaml     one file per family (P0/P2/P3/U0/U3/B0/C0)
└── pids/                             live data parameter IDs (Mode 01, 09)

schema/                               JSON Schema (Draft 2020-12)
tools/                                validation, build and review tools (Node.js)
```

The build reads all family files and writes one merged dataset to `dist/`, which the release workflow publishes to GitHub Pages.

**Maintainer note:** GitHub Pages must be set to **Source: GitHub Actions** in the repository settings for the release workflow to deploy.

</details>

## 🏷️ How to credit

The data is CC0, so a credit is voluntary. If obdex is useful to you, a short line in your app, documentation or about page keeps the project alive and helps others find it:

> OBD-II code data: [obdex](https://github.com/foerbsnavi/obdex) (CC0-1.0)

```html
OBD-II code data: <a href="https://github.com/foerbsnavi/obdex">obdex</a> (CC0-1.0)
```

For papers and reports, use the **Cite this repository** button on GitHub (from [`CITATION.cff`](CITATION.cff)). The same credit line is also published in [`meta.json`](https://foerbsnavi.github.io/OBDex/meta.json) under `attribution`.

## ⚖️ License

- Data: [CC0-1.0](LICENSE-DATA), public domain dedication.
- Code: [MIT](LICENSE-CODE).

SAE J2012 itself remains copyrighted. This repository contains independently written descriptions that reference the publicly known code identifiers, not the SAE document text. Contributors write their descriptions in their own words: identifiers and bit-level facts are not copyrightable, verbatim text from any service document is.

## Disclaimer

The data in this repository is provided **as is**, without warranty of any kind, express or implied. Diagnostic trouble codes describe symptoms, not definitive faults; a wrong interpretation can lead to wrong repairs and damage. Always cross-check with the vehicle's service documentation and qualified diagnostic tools before acting on any information from this database. Contributors and maintainers accept no liability for decisions made based on this data.
