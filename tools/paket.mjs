// Review packages: the dataset is reviewed in fixed packages of 50 codes
// (family order P0, P2, U0, C0, B0, P3, U3; ascending code within a family).
//
//   node tools/paket.mjs liste                     list all packages
//   node tools/paket.mjs hole <nr> <out.yaml>      extract a package as an editable work file
//   node tools/paket.mjs schreibe <work.yaml>      validate the work file and write it back
//
// Writing back only replaces the blocks of the codes contained in the work
// file; every other line of the family files stays byte-identical.
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { parse, Document, visit, isSeq, isScalar } from "yaml";
import Ajv from "ajv/dist/2020.js";

const root = fileURLToPath(new URL("..", import.meta.url));
const dir = join(root, "data/generic");
const FAMILY_ORDER = ["P0", "P2", "U0", "C0", "B0", "P3", "U3"];
const SIZE = 50;
const KEY_ORDER = [
  "code", "category", "applies_to", "title", "description", "affected_components",
  "common_causes", "symptoms", "repair", "flags", "references", "related_codes",
  "sources", "reviewed",
];

// Split a family file into its header and one raw text block per code.
function readFamily(file) {
  const text = readFileSync(join(dir, file), "utf8");
  const parts = text.split(/^(?=- code: )/m);
  // not every family file has a comment header (C0xxx starts directly with a code)
  const header = parts[0].startsWith("- code: ") ? "" : parts.shift();
  const blocks = new Map();
  for (const p of parts) blocks.set(p.match(/^- code: (\S+)/)[1], p);
  return { file, header, blocks };
}

function loadFamilies() {
  const fams = {};
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".yaml"))) {
    fams[file.slice(0, 2)] = readFamily(file);
  }
  return fams;
}

function packages(fams) {
  const out = [];
  for (const f of FAMILY_ORDER) {
    const codes = [...fams[f].blocks.keys()].sort();
    for (let i = 0; i < codes.length; i += SIZE) {
      out.push({ nr: out.length + 1, family: f, codes: codes.slice(i, i + SIZE) });
    }
  }
  return out;
}

// Serialise like the existing data: short lists inline, review date quoted
// (an unquoted date would be read as a timestamp by YAML 1.1 parsers).
const INLINE = new Set(["estimated_cost_eur", "estimated_hours", "related_codes"]);
function toYaml(entry) {
  const doc = new Document([ordered(entry)]);
  visit(doc, {
    Pair(_, pair) {
      const k = pair.key?.value;
      if (INLINE.has(k) && isSeq(pair.value)) pair.value.flow = true;
      if (k === "reviewed" && isScalar(pair.value)) pair.value.type = "QUOTE_SINGLE";
    },
  });
  return doc.toString({ lineWidth: 0, flowCollectionPadding: false });
}

function ordered(entry) {
  const o = {};
  for (const k of KEY_ORDER) if (entry[k] !== undefined) o[k] = entry[k];
  for (const k of Object.keys(entry)) if (!(k in o)) o[k] = entry[k];
  return o;
}

const [cmd, arg1, arg2] = process.argv.slice(2);
const fams = loadFamilies();
const pkgs = packages(fams);

if (cmd === "liste") {
  for (const p of pkgs) {
    console.log(`${String(p.nr).padStart(3, "0")}  ${p.family}  ${p.codes[0]}–${p.codes.at(-1)}  (${p.codes.length})`);
  }
} else if (cmd === "hole") {
  const p = pkgs[Number(arg1) - 1];
  if (!p || !arg2) {
    console.error("usage: node tools/paket.mjs hole <nr> <out.yaml>");
    process.exit(2);
  }
  const body = p.codes.map((c) => fams[p.family].blocks.get(c)).join("");
  const head = `# Review package ${String(p.nr).padStart(3, "0")}: ${p.codes[0]}–${p.codes.at(-1)} (${p.codes.length} codes)\n\n`;
  writeFileSync(arg2, head + body);
  console.log(`${p.codes.length} codes -> ${arg2}`);
} else if (cmd === "schreibe") {
  if (!arg1) {
    console.error("usage: node tools/paket.mjs schreibe <work.yaml>");
    process.exit(2);
  }
  const entries = parse(readFileSync(arg1, "utf8"));
  if (!Array.isArray(entries) || entries.some((e) => !e || typeof e !== "object")) {
    console.error(`${arg1}: expected a list of code entries, nothing written`);
    process.exit(1);
  }
  const schema = JSON.parse(readFileSync(join(root, "schema/code.schema.json"), "utf8"));
  const validate = new Ajv.default({ allErrors: true, strict: false }).compile(schema);
  const errors = [];
  const seen = new Set();
  for (const e of entries) {
    const fam = fams[e.code?.slice(0, 2)];
    if (!fam || !fam.blocks.has(e.code)) errors.push(`${e.code}: unknown code (new codes are not added by this tool)`);
    if (seen.has(e.code)) errors.push(`${e.code}: listed twice`);
    seen.add(e.code);
    if (!validate(e)) errors.push(`${e.code}: ${validate.errors.map((x) => `${x.instancePath} ${x.message}`).join("; ")}`);
  }
  if (errors.length) {
    for (const e of errors) console.error(e);
    console.error(`\n${errors.length} error(s), nothing written`);
    process.exit(1);
  }
  const touched = new Set();
  for (const e of entries) {
    const fam = fams[e.code.slice(0, 2)];
    const old = parse(fam.blocks.get(e.code))[0];
    const changed = KEY_ORDER.filter((k) => JSON.stringify(old[k]) !== JSON.stringify(e[k]));
    console.log(`${e.code}: ${changed.length ? changed.join(", ") : "unchanged"}`);
    if (!changed.length) continue;
    // keep the original block separator (blank line, or none at end of file)
    const trail = fam.blocks.get(e.code).match(/\s*$/)[0];
    fam.blocks.set(e.code, toYaml(e).trimEnd() + trail);
    touched.add(fam);
  }
  for (const fam of touched) {
    writeFileSync(join(dir, fam.file), fam.header + [...fam.blocks.values()].join(""));
    console.log(`written: data/generic/${fam.file}`);
  }
} else {
  console.error("usage: node tools/paket.mjs liste | hole <nr> <out.yaml> | schreibe <work.yaml>");
  process.exit(2);
}
