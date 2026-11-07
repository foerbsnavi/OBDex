<div align="center">

# obdex

**The most detailed open database of generic OBD-II codes — every code individually reviewed, with sources.**

9,533 SAE J2012 codes · 30,884 sources · English and German · 132 PIDs · free to use under CC0

[![reviewed](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Ffoerbsnavi.github.io%2FOBDex%2Fmeta.json&query=%24.counts.generic.reviewed&label=reviewed&suffix=%20of%209%2C533&color=2f7d32)](#every-code-reviewed-individually)
[![data: CC0-1.0](https://img.shields.io/badge/data-CC0--1.0-blue.svg)](LICENSE-DATA)
[![code: MIT](https://img.shields.io/badge/code-MIT-blue.svg)](LICENSE-CODE)
[![validate](https://github.com/foerbsnavi/obdex/actions/workflows/validate.yml/badge.svg)](https://github.com/foerbsnavi/obdex/actions/workflows/validate.yml)

[Live search](https://obd.signalwelt.de/) · [Data browser](https://foerbsnavi.github.io/OBDex/) · [Quick start](#quick-start) · [How codes are reviewed](#every-code-reviewed-individually) · [Contributing](#contributing)

</div>

Your scan tool says `P0420`. obdex tells you what the engine module checked, when it set the code, which makers use it and how, what usually causes it, what you will notice and roughly what the repair costs — and it shows you where each statement comes from. Every one of the 9,533 generic codes was researched on its own and rewritten from regulations, manufacturer bulletins and service documents. Each code is one open entry you can read, fork and embed — a single fetch from GitHub Pages, free and without an account.

- **[obd.signalwelt.de](https://obd.signalwelt.de/)** — the live search app with a full English and German interface, installable as a PWA, with deep links and PDF export. Try `P0420`, `oxygen sensor` or `Lambdasonde`.
- **[Data browser](https://foerbsnavi.github.io/OBDex/)** — search the raw database and download the JSON bundles.
- **[Static JSON](#endpoints)** — plain files on GitHub Pages, ready for any app or script.

## Quick start

Look up a single code in three lines of JavaScript:

```js
const r = await fetch("https://foerbsnavi.github.io/OBDex/generic.min.json");
const codes = await r.json();
console.log(codes.find(c => c.code === "P0420").title.en);
// "Catalyst System Efficiency Below Threshold Bank 1"
```

With curl and jq:

```bash
curl -s https://foerbsnavi.github.io/OBDex/generic.min.json | jq '.[] | select(.code=="P0420")'
```

In Python:

```python
import json, urllib.request
codes = json.load(urllib.request.urlopen("https://foerbsnavi.github.io/OBDex/generic.min.json"))
print(next(c for c in codes if c["code"] == "P0420")["title"]["de"])
```

## Every code reviewed individually

Between 9 October and 7 November 2026 all 9,533 codes were worked through in 195 packages of about 50, family by family, and every entry was rewritten from verified sources. No code was filled from a template; where two codes look alike, their texts still explain what sets each one apart.

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://foerbsnavi.github.io/OBDex/progress-dark.svg">
    <img src="https://foerbsnavi.github.io/OBDex/progress.svg" width="720" alt="Reviewed per code family: all seven families at 100 percent. Live numbers are in meta.json under counts.generic.by_family.">
  </picture>
</p>

A reviewed code has passed five checks:

1. **Title** — confirmed against at least two independent code lists.
2. **Sources** — at least two that explain this very code or its monitor, one of them a regulation (CARB 13 CCR § 1968.2) or a manufacturer or supplier document; every URL fetched and checked.
3. **Text** — English and German descriptions written fresh for this code: what is monitored, when the module sets the code, which makers use it, what it means for the driver.
4. **Details** — causes with likelihood, symptoms, repair estimate and flags (MIL, emissions, drive cycle, limp mode) checked for this code.
5. **Links** — related codes exist in obdex and belong together: other bank, high/low pair, range/performance.

Each reviewed code carries the field `reviewed: 'YYYY-MM-DD'`.

To work with reviewed codes only, filter on that field:

```js
const reviewed = codes.filter(c => c.reviewed);
```

### Where the sources come from

The 30,884 source links point to 245 sites. The largest groups:

| Source | Links |
|---|---:|
| Manufacturer service bulletins (NHTSA archive) | 6,861 |
| OBD regulation, mainly CARB 13 CCR § 1968.2 | 6,308 |
| Manufacturer OBD and service documents (GM, Ford, Saab, Mitsubishi, Deutz …) | 11,336 |
| Patents describing the monitor | 2,749 |

Code lists are used only to cross-check titles, never as a source; forums and AI-generated code pages are not used at all.

### Where public sources stop

Some generic codes are reserved in SAE J2012 but used by only one maker, or by none that publishes its documents. 276 chassis and body codes appear in none of the public J2012 title lists that could be checked. These entries say so plainly — "no manufacturer documents this code publicly" — name the makers that do use the number, and explain the monitored function from the regulation, patents and comparable codes. They are kept because a driver who reads such a code from a car still deserves an honest answer.

770 codes rest on the regulation, patents and reference works alone, without a manufacturer bulletin or service document. A patent shows how a monitor can work, not how a given maker uses it, so these entries are the first place where the next edition adds manufacturer evidence.

## What the data holds

- **9,533 generic DTCs** — the full SAE J2012 / ISO 15031-6 code space in seven families.
- **Two languages** — title, description, causes and symptoms in English and German.
- **Diagnosis help** — affected components, common causes with likelihood, symptoms, repair difficulty, DIY flag, cost in euros and working hours.
- **Flags** — MIL, emissions relevance, drive cycle, limp mode.
- **Cross-references** — 46,824 links between related codes.
- **Sources** — 30,884 links, at least two per code, every one fetched and checked.
- **Depth** — 33,401 causes with likelihood and 26,762 symptoms, written for each code.
- **132 PIDs** — Mode 01 live data and Mode 09 vehicle information, with formula, unit and range.

obdex covers the generic layer that every OBD-II tool speaks. Manufacturer-specific codes such as P1xxx or B1xxx stay with their makers.

| Family | Area | Codes |
|---|---|---:|
| P0 | Powertrain (SAE) | 3,705 |
| P2 | Powertrain (SAE, extension) | 3,495 |
| P3 | Powertrain (shared SAE / manufacturer range) | 155 |
| B0 | Body | 323 |
| C0 | Chassis | 626 |
| U0 | Network | 1,055 |
| U3 | Network (hybrid / fuel cell) | 174 |
| | **Total** | **9,533** |

## An entry

P0420 after its review, shortened:

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

The full schema is in [`schema/code.schema.json`](schema/code.schema.json) for DTCs and [`schema/pid.schema.json`](schema/pid.schema.json) for PIDs (JSON Schema Draft 2020-12).

## Endpoints

Plain JSON on GitHub Pages under `https://foerbsnavi.github.io/OBDex`. Every file also exists as a minified `.min.json`.

| File | Content |
|---|---|
| [`/generic.json`](https://foerbsnavi.github.io/OBDex/generic.json) | all 9,533 DTCs |
| [`/all.json`](https://foerbsnavi.github.io/OBDex/all.json) | DTCs and PIDs combined |
| [`/pids/mode01.json`](https://foerbsnavi.github.io/OBDex/pids/mode01.json) | live data PIDs |
| [`/pids/mode09.json`](https://foerbsnavi.github.io/OBDex/pids/mode09.json) | vehicle information PIDs |
| [`/meta.json`](https://foerbsnavi.github.io/OBDex/meta.json) | counts per family, review progress, build time, credit line |

## Uses

- **Garage and workshop software** — bilingual code lookup that runs on your own server.
- **Scan-tool front-ends** — turn the codes from an ELM327 dongle into readable explanations with cause hints.
- **Driver and DIY apps** — show repair difficulty and a cost range before the workshop visit.
- **Training material** — every code explained, with the sources to follow up.
- **Research** — 9,533 codes with consistent fields in one JSON file.

## Languages

English and German are complete for every code. The schema accepts any ISO 639-1 language key next to `en` and `de`, so a new language fits in without a code change. Translations are welcome, even for a single family; please write them in your own words and open a pull request (see [CONTRIBUTING.md](CONTRIBUTING.md)).

## Contributing

Corrections, reviews and translations are all welcome. CI validates the schema, duplicates and related-code links on every pull request.

- **Found a wrong code?** Open a [correction issue](https://github.com/foerbsnavi/obdex/issues/new/choose) or a pull request.
- **Know a better source?** A manufacturer bulletin or service document that pins down a code more precisely is the most valuable contribution. [CONTRIBUTING.md › Reviewing codes](CONTRIBUTING.md#reviewing-codes) explains what a review needs.
- **Rules of thumb:** cite your sources, write in your own words, one pull request per code or coherent batch.

Thank you to everyone who has improved obdex so far, among them [rslnautic](https://github.com/rslnautic) (reviewed P2 codes, cleaned-up prose and titles) and [Noabza](https://github.com/Noabza) (142 corrected titles).

<details>
<summary><b>Develop locally</b></summary>

```bash
git clone https://github.com/foerbsnavi/obdex.git
cd obdex
npm install
npm run check     # schema, duplicates, related codes
npm run build     # generate dist/
```

Requires Node.js 20 or newer.

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

## How to credit

The data is CC0, so a credit is voluntary. If obdex is useful to you, a short line in your app, documentation or about page keeps the project alive and helps others find it:

> OBD-II code data: [obdex](https://github.com/foerbsnavi/obdex) (CC0-1.0)

```html
OBD-II code data: <a href="https://github.com/foerbsnavi/obdex">obdex</a> (CC0-1.0)
```

For papers and reports, use the **Cite this repository** button on GitHub (from [`CITATION.cff`](CITATION.cff)). The same credit line is published in [`meta.json`](https://foerbsnavi.github.io/OBDex/meta.json) under `attribution`.

## License

- Data: [CC0-1.0](LICENSE-DATA), public domain dedication.
- Code: [MIT](LICENSE-CODE).

SAE J2012 itself remains copyrighted. This repository contains independently written descriptions that reference the publicly known code identifiers, not the SAE document text. Contributors write their descriptions in their own words: identifiers and bit-level facts are free to use, verbatim text from any service document is protected.

## Disclaimer

The data in this repository is provided **as is**, without warranty of any kind, express or implied. Diagnostic trouble codes describe symptoms, not definitive faults; a wrong interpretation can lead to wrong repairs and damage. Always cross-check with the vehicle's service documentation and qualified diagnostic tools before acting on any information from this database. Contributors and maintainers accept no liability for decisions made based on this data.
