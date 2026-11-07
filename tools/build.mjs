import { readFileSync, readdirSync, mkdirSync, writeFileSync } from "node:fs";
import { join, basename, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

const root = fileURLToPath(new URL("..", import.meta.url));
const dist = join(root, "dist");

mkdirSync(dist, { recursive: true });
mkdirSync(join(dist, "pids"), { recursive: true });

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p));
    else if (entry.name.endsWith(".yaml")) out.push(p);
  }
  return out;
}

function loadArray(file) {
  const parsed = parse(readFileSync(file, "utf8"));
  if (parsed === null) return [];
  return Array.isArray(parsed) ? parsed : [];
}

const generic = walk(join(root, "data/generic")).flatMap(loadArray);

const pidsRoot = join(root, "data/pids");
const pidsByMode = {};
for (const f of walk(pidsRoot)) {
  const key = basename(f, ".yaml");
  pidsByMode[key] = loadArray(f);
}

const all = {
  generic,
  pids: pidsByMode
};

// Coverage je Familie: enriched (mit Description) vs indexed (nur Minimal-Schema), reviewed (Feld reviewed gesetzt)
const families = ["P0", "P2", "P3", "U0", "U3", "B0", "C0"];
const coverage = {};
for (const fam of families) coverage[fam] = { total: 0, enriched: 0, indexed: 0, reviewed: 0 };
for (const c of generic) {
  const fam = c.code.slice(0, 2);
  if (!coverage[fam]) continue;
  coverage[fam].total++;
  if (c.description?.en) coverage[fam].enriched++;
  else coverage[fam].indexed++;
  if (c.reviewed) coverage[fam].reviewed++;
}
const totalCodes = generic.length;
const totalPids = Object.values(pidsByMode).reduce((a, b) => a + b.length, 0);
const totalEnriched = Object.values(coverage).reduce((a, b) => a + b.enriched, 0);
const totalIndexed = totalCodes - totalEnriched;
const totalReviewed = Object.values(coverage).reduce((a, b) => a + b.reviewed, 0);
const totalSymptoms = generic.reduce((s, c) => s + (Array.isArray(c.symptoms) ? c.symptoms.length : 0), 0);
const totalCauses = generic.reduce((s, c) => s + (Array.isArray(c.common_causes) ? c.common_causes.length : 0), 0);
const totalSources = generic.reduce((s, c) => s + (Array.isArray(c.sources) ? c.sources.length : 0), 0);
const totalRelated = generic.reduce((s, c) => s + (Array.isArray(c.related_codes) ? c.related_codes.length : 0), 0);

// Quellen nach Art für die Startseite: Domains, Hersteller-Bulletins, Vorschrift, Herstellerunterlagen, Patente
const sourceHosts = new Map();
for (const c of generic) {
  for (const s of c.sources || []) {
    try {
      const h = new URL(s).hostname.replace(/^www\./, "");
      sourceHosts.set(h, (sourceHosts.get(h) || 0) + 1);
    } catch { /* keine URL */ }
  }
}
const hostSum = re => [...sourceHosts].reduce((a, [h, n]) => a + (re.test(h) ? n : 0), 0);
const sourceKinds = {
  domains: sourceHosts.size,
  bulletins: hostSum(/(^|\.)nhtsa\.gov$/),
  regulation: hostSum(/(^|\.)(law\.cornell\.edu|arb\.ca\.gov|ecfr\.gov|govinfo\.gov|eur-lex\.europa\.eu)$/),
  oem: hostSum(/(^|\.)(gm\.com|fordservicecontent\.com|ford\.com|saabwisonline\.com|mitsubishitechinfo\.com|newtonnet\.co\.uk|deutz\.com)$/),
  patents: hostSum(/^(patents\.google\.com|image-ppubs\.uspto\.gov|patentimages\.storage\.googleapis\.com)$/)
};
const minSources = generic.reduce((m, c) => Math.min(m, (c.sources || []).length), Infinity);
const reviewDates = generic.map(c => c.reviewed).filter(Boolean).map(String).sort();
const reviewFirst = reviewDates[0] || "";
const reviewLast = reviewDates[reviewDates.length - 1] || "";
const fmtDate = d => d ? new Date(d + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }) : "";

const meta = {
  generated_at: new Date().toISOString(),
  license: "CC0-1.0",
  attribution: {
    note: "Credit is voluntary under CC0, but appreciated.",
    text: "OBD-II code data: obdex (https://github.com/foerbsnavi/obdex), CC0-1.0",
    html: "OBD-II code data: <a href=\"https://github.com/foerbsnavi/obdex\">obdex</a> (CC0-1.0)"
  },
  counts: {
    generic: {
      total: totalCodes,
      enriched: totalEnriched,
      indexed: totalIndexed,
      reviewed: totalReviewed,
      symptoms: totalSymptoms,
      causes: totalCauses,
      sources: totalSources,
      related_codes: totalRelated,
      by_family: Object.fromEntries(
        families
          .filter(f => coverage[f].total > 0)
          .map(f => [f, { total: coverage[f].total, enriched: coverage[f].enriched, indexed: coverage[f].indexed, reviewed: coverage[f].reviewed }])
      )
    },
    pids: Object.fromEntries(Object.entries(pidsByMode).map(([k, v]) => [k, v.length]))
  }
};

function writePair(file, data) {
  writeFileSync(`${file}.json`, JSON.stringify(data, null, 2));
  writeFileSync(`${file}.min.json`, JSON.stringify(data));
}

writePair(join(dist, "all"), all);
writePair(join(dist, "generic"), generic);
writeFileSync(join(dist, "meta.json"), JSON.stringify(meta, null, 2));

// Fortschritt der Einzelprüfung (Edition 2) als SVG für die README, hell und dunkel
const PROGRESS_ORDER = ["P0", "P2", "U0", "C0", "B0", "P3", "U3"];
const PROGRESS_LABELS = {
  P0: "Powertrain", P2: "Powertrain ext.", U0: "Network", C0: "Chassis",
  B0: "Body", P3: "Powertrain mixed", U3: "Network HV / FCEV"
};
const PROGRESS_THEMES = {
  light: { text: "#1f2328", muted: "#59636e", track: "#e1e4e8", fill: "#2f7d32" },
  dark: { text: "#e6edf3", muted: "#9198a1", track: "#30363d", fill: "#4fae55" }
};
function progressSvg(theme) {
  const c = PROGRESS_THEMES[theme];
  const fmt = n => n.toLocaleString("en-US");
  const pctOf = (r, t) => (t === 0 ? 0 : Math.floor((r / t) * 1000) / 10).toFixed(1);
  const rows = PROGRESS_ORDER.filter(f => coverage[f]?.total > 0);
  const W = 720, barX = 190, barW = 360, rowH = 30, top = 76;
  const H = top + rows.length * rowH + 30;
  const bar = (y, h, r, t, color) => {
    const w = Math.round((r / t) * barW);
    return w > 0 ? `<rect x="${barX}" y="${y}" width="${w}" height="${h}" rx="4" fill="${color}"/>` : "";
  };
  const lines = rows.map((f, i) => {
    const { total, reviewed } = coverage[f];
    const y = top + i * rowH;
    return `  <text x="0" y="${y + 11}" class="t"><tspan font-weight="600">${f}</tspan><tspan class="m" dx="8">${PROGRESS_LABELS[f]}</tspan></text>
  <rect x="${barX}" y="${y}" width="${barW}" height="12" rx="4" fill="${c.track}"/>
  ${bar(y, 12, reviewed, total, c.fill)}
  <text x="${W}" y="${y + 11}" class="t n" text-anchor="end">${fmt(reviewed)} / ${fmt(total)}<tspan class="m" dx="8">${pctOf(reviewed, total)} %</tspan></text>`;
  }).join("\n");
  const date = meta.generated_at.slice(0, 10);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Reviewed individually: ${fmt(totalReviewed)} of ${fmt(totalCodes)} codes">
  <style>.t{font:14px system-ui,-apple-system,"Segoe UI",Helvetica,Arial,sans-serif;fill:${c.text}}.m{fill:${c.muted}}.n{font-variant-numeric:tabular-nums}.h{font-size:20px;font-weight:600}.s{font-size:12px}</style>
  <text x="0" y="22" class="t h">${fmt(totalReviewed)} of ${fmt(totalCodes)} codes reviewed individually<tspan class="m" dx="10" font-weight="400">${pctOf(totalReviewed, totalCodes)} %</tspan></text>
  <rect x="0" y="38" width="${W}" height="8" rx="4" fill="${c.track}"/>
  ${totalReviewed > 0 ? `<rect x="0" y="38" width="${Math.round((totalReviewed / totalCodes) * W)}" height="8" rx="4" fill="${c.fill}"/>` : ""}
${lines}
  <text x="0" y="${H - 6}" class="t m s">Families in order of work · updated ${date} with every release</text>
</svg>
`;
}
writeFileSync(join(dist, "progress.svg"), progressSvg("light"));
writeFileSync(join(dist, "progress-dark.svg"), progressSvg("dark"));

for (const [mode, pids] of Object.entries(pidsByMode)) {
  writePair(join(dist, "pids", mode), pids);
}

const pidLinks = Object.keys(pidsByMode).sort()
  .map(mode => `      <li><a href="pids/${mode}.json"><code>pids/${mode}.json</code></a> <span class="count">${pidsByMode[mode].length}</span></li>`)
  .join("\n");

const FAMILY_LABELS = {
  P0: "Powertrain", P2: "Powertrain (SAE)", P3: "Powertrain (mixed)",
  U0: "Network", U3: "Network (HV / FCEV)", B0: "Body", C0: "Chassis"
};
const coverageRows = families
  .filter(f => coverage[f].total > 0)
  .map(f => {
    const e = coverage[f].reviewed;
    const t = coverage[f].total;
    const pct = t === 0 ? 0 : Math.floor((e / t) * 100);
    return `      <tr><td><code>${f}</code> <span class="count">${FAMILY_LABELS[f] || ""}</span></td><td class="num">${t.toLocaleString("en-US")}</td><td class="bar"><div class="bar-row"><div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div><span class="bar-pct">${pct} %</span></div></td></tr>`;
  })
  .join("\n");

const indexHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>obdex — the most detailed open database of generic OBD-II codes</title>
  <meta name="description" content="The most detailed open database of generic OBD-II codes: all ${totalCodes.toLocaleString("en-US")} SAE J2012 codes individually reviewed, with ${totalSources.toLocaleString("en-US")} sources, in English and German. Free JSON, CC0.">
  <meta property="og:title" content="obdex — the most detailed open database of generic OBD-II codes">
  <meta property="og:description" content="Every one of ${totalCodes.toLocaleString("en-US")} generic OBD-II codes individually reviewed, with sources: regulations, manufacturer bulletins, service documents. English and German, CC0.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://foerbsnavi.github.io/OBDex/">
  <meta name="twitter:card" content="summary">
  <style>
    :root { color-scheme: light dark; --fg: #111; --muted: #666; --bg: #fff; --accent: #0969da; --border: #d0d7de; --code-bg: #f6f8fa; --card: #f6f8fa; --pill-bg: #ddf4ff; --pill-fg: #0969da; --warn-bg: #fff8c5; --warn-fg: #7d4e00; }
    @media (prefers-color-scheme: dark) {
      :root { --fg: #e6edf3; --muted: #8b949e; --bg: #0d1117; --accent: #58a6ff; --border: #30363d; --code-bg: #161b22; --card: #161b22; --pill-bg: #1f6feb33; --pill-fg: #58a6ff; --warn-bg: #4d350033; --warn-fg: #d4a72c; }
    }
    * { box-sizing: border-box; }
    body { font: 16px/1.6 system-ui, -apple-system, "Segoe UI", sans-serif; color: var(--fg); background: var(--bg); margin: 0; padding: 2rem 1.5rem; }
    main { max-width: 760px; margin: 0 auto; }
    h1 { font-size: 2rem; margin: 0 0 .25rem; letter-spacing: -0.02em; }
    h2 { font-size: 1.1rem; margin: 2rem 0 .75rem; padding-bottom: .25rem; border-bottom: 1px solid var(--border); }
    p.tagline { color: var(--muted); margin: 0 0 1.5rem; }
    code { font: 0.92em ui-monospace, "SF Mono", Consolas, monospace; background: var(--code-bg); padding: 0.1em 0.35em; border-radius: 4px; }
    a { color: var(--accent); text-decoration: none; }
    a:hover { text-decoration: underline; }
    ul { list-style: none; padding: 0; margin: 0; }
    li { padding: .35rem 0; display: flex; justify-content: space-between; align-items: baseline; gap: 1rem; border-bottom: 1px solid var(--border); }
    li:last-child { border-bottom: none; }
    .count { color: var(--muted); font: 0.85em ui-monospace, "SF Mono", Consolas, monospace; }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(95px, 1fr)); gap: 1rem 1rem; margin: 1.5rem 0 0; padding: 1.25rem 1.5rem; background: var(--card); border: 1px solid var(--border); border-radius: 10px; }
    .stat { color: var(--muted); font-size: .82rem; text-transform: uppercase; letter-spacing: .04em; }
    .stat strong { color: var(--fg); font-size: 1.7em; font-weight: 700; display: block; line-height: 1.05; letter-spacing: -.02em; font-variant-numeric: tabular-nums; margin-bottom: .15rem; text-transform: none; }
    .stat strong.accent { color: var(--accent); }
    .lead { font-size: 1.05rem; margin: 0 0 .5rem; }
    .checks { margin: .5rem 0 0; }
    .checks li { display: block; }
    .checks b { color: var(--pill-fg); }
    .kinds { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: .75rem 1.5rem; margin: .75rem 0 0; }
    .kinds div { border-left: 3px solid var(--accent); padding-left: .75rem; }
    .kinds strong { display: block; font-size: 1.25rem; font-variant-numeric: tabular-nums; }
    .kinds span { color: var(--muted); font-size: .85rem; }
    .reviewed-pill { font-size: .72rem; padding: .12rem .55rem; border-radius: 999px; background: var(--pill-bg); color: var(--pill-fg); font-weight: 600; }
    .complete-badge { display: inline-flex; align-items: center; gap: .4rem; background: linear-gradient(135deg, #1ea66c, #0f7a4e); color: white; padding: .35rem .9rem; border-radius: 999px; font-size: .8rem; font-weight: 600; letter-spacing: .02em; margin-top: .75rem; }
    .complete-badge::before { content: "✓"; font-weight: 900; }
    .demo-cta { display: flex; align-items: center; gap: 1rem; padding: 1.25rem 1.5rem; margin: 1.5rem 0 0; background: linear-gradient(135deg, var(--pill-bg), transparent); border: 1px solid var(--accent); border-radius: 10px; }
    .demo-cta-text { flex: 1; }
    .demo-cta strong { display: block; font-size: 1rem; color: var(--fg); margin-bottom: .15rem; }
    .demo-cta span { color: var(--muted); font-size: .9rem; }
    .demo-cta a.btn { background: var(--accent); color: white; padding: .6rem 1.1rem; border-radius: 8px; font-weight: 600; white-space: nowrap; text-decoration: none; }
    .demo-cta a.btn:hover { opacity: .9; text-decoration: none; }
    footer { margin-top: 3rem; padding-top: 1.5rem; border-top: 1px solid var(--border); color: var(--muted); font-size: 0.92em; }
    footer a { color: var(--muted); text-decoration: underline; }

    .search { margin: 1.5rem 0 0; }
    .search input { width: 100%; padding: .75rem 1rem; font: 1rem ui-monospace, "SF Mono", Consolas, monospace; color: var(--fg); background: var(--bg); border: 1px solid var(--border); border-radius: 8px; outline: none; transition: border-color .12s; }
    .search input:focus { border-color: var(--accent); }
    .search input:disabled { opacity: .5; cursor: progress; }

    #result { margin-top: 1rem; }
    #result:empty { display: none; }
    .card { background: var(--card); border: 1px solid var(--border); border-radius: 10px; padding: 1.25rem 1.5rem; }
    .card-head { display: flex; align-items: baseline; gap: .75rem; flex-wrap: wrap; margin-bottom: .25rem; }
    .card-code { font: 600 1.4rem ui-monospace, "SF Mono", Consolas, monospace; letter-spacing: -0.01em; }
    .card-cat { font-size: .8rem; color: var(--muted); text-transform: uppercase; letter-spacing: .05em; }
    .card-title { font-size: 1.05rem; font-weight: 500; margin: 0 0 .25rem; }
    .card-title-de { font-size: .98rem; color: var(--muted); margin: 0 0 1rem; }
    .card h3 { font-size: .82rem; text-transform: uppercase; letter-spacing: .05em; color: var(--muted); margin: 1.25rem 0 .4rem; font-weight: 600; }
    .card .desc { margin: 0 0 .5rem; }
    .card .desc-de { color: var(--muted); margin: 0; }
    .causes { padding: 0; margin: 0; }
    .causes li { display: grid; grid-template-columns: auto 1fr; gap: .75rem; align-items: baseline; padding: .25rem 0; border: none; }
    .lik { font-size: .72rem; text-transform: uppercase; letter-spacing: .05em; padding: .15rem .5rem; border-radius: 999px; font-weight: 600; min-width: 4.2rem; text-align: center; }
    .lik-high { background: var(--warn-bg); color: var(--warn-fg); }
    .lik-medium { background: var(--pill-bg); color: var(--pill-fg); }
    .lik-low { background: var(--code-bg); color: var(--muted); border: 1px solid var(--border); }
    .repair-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: .75rem 1.5rem; }
    .repair-grid div { display: flex; flex-direction: column; }
    .repair-grid .label { font-size: .75rem; color: var(--muted); text-transform: uppercase; letter-spacing: .04em; }
    .repair-grid .value { font-weight: 500; }
    .flags { display: flex; flex-wrap: wrap; gap: .35rem; margin: .5rem 0 0; }
    .flag { font-size: .75rem; padding: .15rem .55rem; border-radius: 999px; background: var(--code-bg); color: var(--muted); border: 1px solid var(--border); }
    .flag.on { background: var(--pill-bg); color: var(--pill-fg); border-color: transparent; }
    .sources { padding: 0; margin: 0; }
    .sources li { display: block; padding: .15rem 0; border: none; word-break: break-all; }
    .matches { padding: 0; margin: 0; }
    .matches li { padding: .5rem 0; display: grid; grid-template-columns: auto auto 1fr; gap: .75rem; cursor: pointer; align-items: baseline; }
    .matches li:hover { color: var(--accent); }
    .matches code { background: transparent; font-weight: 600; }
    .matches .kind { font-size: .7rem; padding: .1rem .45rem; border-radius: 999px; background: var(--code-bg); color: var(--muted); border: 1px solid var(--border); text-transform: uppercase; letter-spacing: .05em; }
    .empty { color: var(--muted); padding: 1rem; text-align: center; }
    .hint { color: var(--muted); font-size: .85rem; margin: .5rem 0 0; }
    .hint code { font-size: .9em; }
    .pid-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: .75rem 1.5rem; margin: .75rem 0; }
    .pid-grid div { display: flex; flex-direction: column; }
    .pid-grid .label { font-size: .75rem; color: var(--muted); text-transform: uppercase; letter-spacing: .04em; }
    .pid-grid .value { font-weight: 500; word-break: break-word; }
    .pid-grid .value.mono { font-family: ui-monospace, "SF Mono", Consolas, monospace; font-size: .9em; }

    .ex { font-size: .85rem; color: var(--muted); margin: .5rem 0 0; }
    .ex code { font-size: .9em; cursor: pointer; transition: background-color .12s, color .12s; }
    .ex code:hover { background: var(--pill-bg); color: var(--pill-fg); }
    .depth { font-size: .68rem; padding: .12rem .5rem; border-radius: 999px; text-transform: uppercase; letter-spacing: .05em; font-weight: 600; }
    .depth.enriched { background: var(--pill-bg); color: var(--pill-fg); }
    .depth.indexed { background: var(--code-bg); color: var(--muted); border: 1px solid var(--border); }

    table.coverage { width: 100%; border-collapse: collapse; font-size: .92rem; }
    table.coverage td, table.coverage th { padding: .35rem .25rem; text-align: left; border-bottom: 1px solid var(--border); }
    table.coverage th { font-size: .75rem; text-transform: uppercase; letter-spacing: .05em; color: var(--muted); font-weight: 600; }
    table.coverage th.num, table.coverage td.num { text-align: right; font-variant-numeric: tabular-nums; font-family: ui-monospace, "SF Mono", Consolas, monospace; font-size: .9em; }
    table.coverage th.num { font-family: inherit; font-size: .75rem; }
    table.coverage th.bar-h { padding-left: .75rem; }
    table.coverage td.bar { width: 40%; padding-left: .75rem; }
    .bar-row { display: flex; align-items: center; gap: .6rem; }
    .bar-track { flex: 1; height: 6px; background: var(--code-bg); border-radius: 3px; overflow: hidden; border: 1px solid var(--border); }
    .bar-fill { height: 100%; background: var(--accent); transition: width .3s; }
    .bar-pct { font-size: .78rem; color: var(--muted); font-variant-numeric: tabular-nums; min-width: 2.5rem; text-align: right; }
    table.coverage tfoot td { font-weight: 600; padding-top: .55rem; border-top: 2px solid var(--border); border-bottom: none; }
  </style>
</head>
<body>
<main>
  <h1>obdex</h1>
  <p class="tagline">The most detailed open database of generic OBD-II codes — every code individually reviewed, with sources.</p>
  <div class="complete-badge">${totalReviewed.toLocaleString("en-US")} of ${totalCodes.toLocaleString("en-US")} codes reviewed individually</div>

  <div class="stats" aria-label="Database statistics">
    <div class="stat"><strong class="accent">${totalCodes.toLocaleString("en-US")}</strong>codes</div>
    <div class="stat"><strong class="accent">${totalSources.toLocaleString("en-US")}</strong>sources</div>
    <div class="stat"><strong>${totalCauses.toLocaleString("en-US")}</strong>causes</div>
    <div class="stat"><strong>${totalSymptoms.toLocaleString("en-US")}</strong>symptoms</div>
    <div class="stat"><strong>${totalRelated.toLocaleString("en-US")}</strong>cross-refs</div>
    <div class="stat"><strong>${totalPids}</strong>PIDs</div>
  </div>

  <div class="demo-cta">
    <div class="demo-cta-text">
      <strong>Need a friendly UI?</strong>
      <span>Search, filter and read every code in DE/EN at obd.signalwelt.de</span>
    </div>
    <a class="btn" href="https://obd.signalwelt.de/" target="_blank" rel="noopener">Open search app →</a>
  </div>

  <h2>Quick search</h2>
  <p class="hint">Look up any code, keyword or PID right here — the full database is loaded into your browser.</p>
  <div class="search">
    <input id="q" type="search" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Loading database…" disabled>
  </div>
  <p class="ex">Try: <code data-q="P0420">P0420</code> · <code data-q="oxygen sensor">oxygen sensor</code> · <code data-q="Lambdasonde">Lambdasonde</code> · <code data-q="0C">0C</code> (PID) · <code data-q="01:0C">01:0C</code> (Mode 01 PID 0C)</p>
  <div id="result"></div>

  <h2>Every code, checked on its own</h2>
  <p class="lead">Between ${fmtDate(reviewFirst)} and ${fmtDate(reviewLast)} each of the ${totalCodes.toLocaleString("en-US")} codes was taken up on its own, researched and rewritten from scratch in English and German. A code counts as reviewed only after five checks:</p>
  <ul class="checks">
    <li><b>1 · Title</b> confirmed against at least two independent code lists.</li>
    <li><b>2 · Sources</b> — at least ${minSources} per code that explain this very code or its monitor, every URL fetched and read.</li>
    <li><b>3 · Text</b> — what the module monitors, when it sets the code, which makers use it and what it means for the driver.</li>
    <li><b>4 · Details</b> — causes with likelihood, symptoms, repair estimate and the MIL, emissions, drive-cycle and limp-mode flags.</li>
    <li><b>5 · Links</b> — related codes exist and belong together: other bank, high/low pair, range/performance.</li>
  </ul>

  <h2>Where the sources come from</h2>
  <p class="hint">${totalSources.toLocaleString("en-US")} source links from ${sourceKinds.domains.toLocaleString("en-US")} sites, chosen per code. Code lists and forums serve only to cross-check titles, never as a source.</p>
  <div class="kinds">
    <div><strong>${sourceKinds.bulletins.toLocaleString("en-US")}</strong><span>manufacturer service bulletins (NHTSA)</span></div>
    <div><strong>${sourceKinds.regulation.toLocaleString("en-US")}</strong><span>references to OBD regulations (mainly CARB 13 CCR § 1968.2)</span></div>
    <div><strong>${sourceKinds.oem.toLocaleString("en-US")}</strong><span>manufacturer OBD and service documents (GM, Ford, Saab, Mitsubishi …)</span></div>
    <div><strong>${sourceKinds.patents.toLocaleString("en-US")}</strong><span>patents describing the monitor</span></div>
  </div>
  <p class="hint">Where no maker documents a code publicly, the entry says so plainly and explains the function from the regulation and comparable codes instead of guessing.</p>

  <h2>Reviewed per family</h2>
  <table class="coverage">
    <thead><tr><th>Family</th><th class="num">Codes</th><th class="bar-h">Reviewed</th></tr></thead>
    <tbody>
${coverageRows}
    </tbody>
    <tfoot><tr><td><strong>All generic</strong></td><td class="num">${totalCodes.toLocaleString("en-US")}</td><td class="bar"><div class="bar-row"><div class="bar-track"><div class="bar-fill" style="width:${Math.floor((totalReviewed / totalCodes) * 100)}%"></div></div><span class="bar-pct">${Math.floor((totalReviewed / totalCodes) * 100)} %</span></div></td></tr></tfoot>
  </table>

  <h2>Use the data</h2>
  <p class="hint">All endpoints are static JSON over GitHub Pages. No auth, no rate limit. Each has a minified <code>.min.json</code> sibling for production.</p>
  <ul>
    <li><a href="all.json"><code>all.json</code></a> <span class="count">codes + PIDs combined</span></li>
    <li><a href="generic.json"><code>generic.json</code></a> <span class="count">${generic.length.toLocaleString("en-US")} codes</span></li>
    <li><a href="meta.json"><code>meta.json</code></a> <span class="count">counts &amp; build time</span></li>
${pidLinks}
  </ul>

  <footer>
    <p>Source on <a href="https://github.com/foerbsnavi/obdex">GitHub</a> · <a href="https://github.com/foerbsnavi/obdex/blob/main/CONTRIBUTING.md">contributing</a> · <a href="https://github.com/foerbsnavi/obdex/issues">report a wrong description</a> · <a href="https://obd.signalwelt.de/">live search</a></p>
    <p>Identifiers follow SAE J2012. Every description is written independently, in English and German, and lists the public sources it rests on.</p>
    <p>Data <a href="https://github.com/foerbsnavi/obdex/blob/main/LICENSE-DATA">CC0-1.0</a> · code <a href="https://github.com/foerbsnavi/obdex/blob/main/LICENSE-CODE">MIT</a> · credit is voluntary, but appreciated: <a href="https://github.com/foerbsnavi/obdex#how-to-credit">how to credit</a></p>
  </footer>
</main>

<script>
(function () {
  const input = document.getElementById('q');
  const result = document.getElementById('result');
  let db = null;

  fetch('all.min.json')
    .then(r => r.json())
    .then(d => {
      const dtcs = (d.generic || []).map(c => Object.assign({ _kind: 'dtc', _key: c.code }, c));
      const pids = [];
      for (const [modeKey, list] of Object.entries(d.pids || {})) {
        const modeNum = modeKey.replace(/^mode/, '').toUpperCase();
        for (const p of list) {
          pids.push(Object.assign({
            _kind: 'pid',
            _key: modeNum + ':' + p.pid,
            _mode: modeNum,
            _label: 'Mode ' + modeNum + ' PID ' + p.pid
          }, p));
        }
      }
      db = [...dtcs, ...pids];
      input.disabled = false;
      input.placeholder = 'Search by code (P0420), keyword (oxygen, Lambda) or PID (0C, 01:0C)…';
      input.focus();
      handleHash();
    })
    .catch(() => { input.placeholder = 'Failed to load database.'; });

  function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
  }

  function fmtRange(arr, suffix) {
    if (!Array.isArray(arr) || arr.length !== 2) return '';
    return arr[0] + '–' + arr[1] + ' ' + suffix;
  }

  function flag(label, on) {
    return '<span class="flag' + (on ? ' on' : '') + '">' + esc(label) + '</span>';
  }

  function renderSources(arr) {
    if (!Array.isArray(arr) || !arr.length) return '';
    return '<h3>Sources (' + arr.length + ')</h3><ul class="sources">' +
      arr.map(s => /^https?:\\/\\//.test(s)
        ? '<li><a href="' + esc(s) + '" target="_blank" rel="noopener">' + esc(s) + '</a></li>'
        : '<li>' + esc(s) + '</li>'
      ).join('') +
      '</ul>';
  }

  function renderDtcCard(c) {
    const cat = c.category ? esc(c.category) : '';
    const titleEn = c.title?.en ? '<p class="card-title">' + esc(c.title.en) + '</p>' : '';
    const titleDe = c.title?.de ? '<p class="card-title-de">' + esc(c.title.de) + '</p>' : '';
    const descEn = c.description?.en ? '<p class="desc">' + esc(c.description.en) + '</p>' : '';
    const descDe = c.description?.de ? '<p class="desc-de">' + esc(c.description.de) + '</p>' : '';

    let causes = '';
    if (Array.isArray(c.common_causes) && c.common_causes.length) {
      causes = '<h3>Common causes</h3><ul class="causes">' +
        c.common_causes.map(x => {
          const lab = x.label?.en || x.id;
          const labDe = x.label?.de ? ' <span style="color:var(--muted)">— ' + esc(x.label.de) + '</span>' : '';
          return '<li><span class="lik lik-' + esc(x.likelihood) + '">' + esc(x.likelihood) + '</span><span>' + esc(lab) + labDe + '</span></li>';
        }).join('') +
        '</ul>';
    }

    let repair = '';
    if (c.repair) {
      const r = c.repair;
      const fields = [];
      if (r.difficulty) fields.push('<div><span class="label">Difficulty</span><span class="value">' + esc(r.difficulty) + '</span></div>');
      if (typeof r.diy_possible === 'boolean') fields.push('<div><span class="label">DIY</span><span class="value">' + (r.diy_possible ? 'possible' : 'shop only') + '</span></div>');
      const cost = fmtRange(r.estimated_cost_eur, '€');
      if (cost) fields.push('<div><span class="label">Cost</span><span class="value">' + cost + '</span></div>');
      const hours = fmtRange(r.estimated_hours, 'h');
      if (hours) fields.push('<div><span class="label">Time</span><span class="value">' + hours + '</span></div>');
      if (fields.length) repair = '<h3>Repair estimate</h3><div class="repair-grid">' + fields.join('') + '</div>';
    }

    let flags = '';
    if (c.flags) {
      const f = c.flags;
      const out = [];
      if (typeof f.mil === 'boolean') out.push(flag('MIL on', f.mil));
      if (typeof f.emissions_relevant === 'boolean') out.push(flag('Emissions', f.emissions_relevant));
      if (typeof f.drive_cycle_required === 'boolean') out.push(flag('Drive cycle', f.drive_cycle_required));
      if (typeof f.limp_mode_possible === 'boolean') out.push(flag('Limp mode', f.limp_mode_possible));
      if (out.length) flags = '<div class="flags">' + out.join('') + '</div>';
    }

    return '<div class="card">' +
      '<div class="card-head"><span class="card-code">' + esc(c.code) + '</span><span class="card-cat">' + cat + '</span>' +
        (c.reviewed ? '<span class="reviewed-pill">reviewed ' + esc(c.reviewed) + '</span>' : '') + '</div>' +
      titleEn + titleDe + descEn + descDe + flags + causes + repair + renderSources(c.sources) +
      '</div>';
  }

  function renderPidCard(p) {
    const nameEn = p.name?.en ? '<p class="card-title">' + esc(p.name.en) + '</p>' : '';
    const nameDe = p.name?.de ? '<p class="card-title-de">' + esc(p.name.de) + '</p>' : '';

    const fields = [];
    fields.push('<div><span class="label">Mode</span><span class="value mono">' + esc(p._mode) + '</span></div>');
    fields.push('<div><span class="label">PID</span><span class="value mono">' + esc(p.pid) + '</span></div>');
    if (typeof p.bytes === 'number') fields.push('<div><span class="label">Bytes</span><span class="value mono">' + p.bytes + '</span></div>');
    if (p.unit) fields.push('<div><span class="label">Unit</span><span class="value mono">' + esc(p.unit) + '</span></div>');
    const range = fmtRange(p.range, p.unit || '');
    if (range) fields.push('<div><span class="label">Range</span><span class="value mono">' + esc(range) + '</span></div>');
    const grid = '<div class="pid-grid">' + fields.join('') + '</div>';

    let formula = '';
    if (p.formula) {
      formula = '<h3>Formula</h3><div class="pid-grid"><div><span class="label">Decoded value</span><span class="value mono">' + esc(p.formula) + '</span></div></div>';
    }

    return '<div class="card">' +
      '<div class="card-head"><span class="card-code">' + esc(p._label) + '</span><span class="card-cat">parameter id</span></div>' +
      nameEn + nameDe + grid + formula + renderSources(p.sources) +
      '</div>';
  }

  function renderCard(item) {
    return item._kind === 'pid' ? renderPidCard(item) : renderDtcCard(item);
  }

  function matchLabel(item) {
    if (item._kind === 'pid') return item.name?.en || '';
    return item.title?.en || '';
  }

  function renderMatchList(items) {
    return '<ul class="matches">' +
      items.map(item => {
        const kind = item._kind === 'pid' ? 'PID' : 'DTC';
        return '<li data-key="' + esc(item._key) + '"><span class="kind">' + kind + '</span><code>' + esc(item._key) + '</code><span>' + esc(matchLabel(item)) + '</span></li>';
      }).join('') +
      '</ul>';
  }

  function renderGroupedMatches(pids, dtcs) {
    let out = '';
    if (pids.length) {
      out += '<h3>' + pids.length + (pids.length === 1 ? ' parameter ID' : ' parameter IDs') + '</h3>' + renderMatchList(pids);
    }
    if (dtcs.length) {
      out += '<h3>' + dtcs.length + (dtcs.length === 1 ? ' trouble code' : ' trouble codes') + '</h3>' + renderMatchList(dtcs);
    }
    return out;
  }

  function findByKey(key) {
    return db.find(item => item._key.toUpperCase() === key.toUpperCase());
  }

  function search(q) {
    if (!db) return;
    q = q.trim();
    if (!q) { result.innerHTML = ''; history.replaceState(null, '', location.pathname); return; }

    const upper = q.toUpperCase();

    // Exact match by composite key (DTC code or "MM:PP")
    const exact = findByKey(upper);
    if (exact) {
      result.innerHTML = renderCard(exact);
      history.replaceState(null, '', '#' + exact._key);
      return;
    }

    // PID-style query with explicit mode prefix "01:0C"
    if (/^[0-9A-F]{2}:[0-9A-F]{2,4}$/.test(upper)) {
      // already handled by exact above; if not found, fall through to fuzzy
    }

    // Bare 2-4 hex digits — match PID exactly, also DTCs that start with these chars
    if (/^[0-9A-F]{2,4}$/.test(upper)) {
      const pidMatches = db.filter(item => item._kind === 'pid' && item.pid.toUpperCase() === upper);
      const dtcStarts = db.filter(item => item._kind === 'dtc' && item.code.toUpperCase().startsWith(upper));
      if (pidMatches.length === 1 && dtcStarts.length === 0) {
        result.innerHTML = renderCard(pidMatches[0]);
        history.replaceState(null, '', '#' + pidMatches[0]._key);
        return;
      }
      if (pidMatches.length || dtcStarts.length) {
        result.innerHTML = renderGroupedMatches(pidMatches, dtcStarts.slice(0, 20));
        return;
      }
    }

    // Code prefix match (P04, U00, etc.)
    const codeMatches = db.filter(item => item._kind === 'dtc' && item.code.toUpperCase().startsWith(upper));

    // Text search across DTC titles and PID names (en + de)
    let pidText = [], dtcText = [];
    if (q.length >= 3) {
      for (const item of db) {
        if (item._kind === 'dtc' && item.code.toUpperCase().startsWith(upper)) continue;
        const blob = item._kind === 'pid'
          ? ((item.name?.en || '') + ' ' + (item.name?.de || ''))
          : ((item.title?.en || '') + ' ' + (item.title?.de || ''));
        if (!blob.toUpperCase().includes(upper)) continue;
        (item._kind === 'pid' ? pidText : dtcText).push(item);
      }
    }

    const totalMatches = pidText.length + codeMatches.length + dtcText.length;
    if (totalMatches === 0) {
      result.innerHTML = '<p class="empty">No code, PID or title matches "' + esc(q) + '".</p>';
      return;
    }
    if (totalMatches === 1) {
      const single = pidText[0] || codeMatches[0] || dtcText[0];
      result.innerHTML = renderCard(single);
      history.replaceState(null, '', '#' + single._key);
      return;
    }
    // Grouped output: PIDs (capped at 15) and DTCs (codeMatches first, then text matches, capped at 25)
    const pids = pidText.slice(0, 15);
    const dtcs = [...codeMatches, ...dtcText].slice(0, 25);
    result.innerHTML = renderGroupedMatches(pids, dtcs);
  }

  input.addEventListener('input', () => search(input.value));

  result.addEventListener('click', e => {
    const li = e.target.closest('li[data-key]');
    if (!li) return;
    input.value = li.dataset.key;
    search(input.value);
  });

  // Klickbare Beispiele
  document.querySelectorAll('.ex code[data-q]').forEach(el => {
    el.addEventListener('click', () => {
      input.value = el.dataset.q;
      input.focus();
      search(input.value);
    });
  });

  function handleHash() {
    const h = decodeURIComponent(location.hash.replace('#', ''));
    if (h) { input.value = h; search(h); }
  }
  window.addEventListener('hashchange', handleHash);
})();
</script>
</body>
</html>
`;

writeFileSync(join(dist, "index.html"), indexHtml);

console.log(JSON.stringify(meta.counts, null, 2));
