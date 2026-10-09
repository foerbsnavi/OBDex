// Source check for a review work file (see tools/paket.mjs):
// fetches every source URL once (GET, redirects followed), reports the HTTP
// status, and flags codes that still rely on catch-all sources only or have
// fewer than two sources.
//
//   node tools/quellen_check.mjs <work.yaml>
//
// Exit code 1 if any URL fails or any code is below the review minimum.
import { readFileSync } from "node:fs";
import { parse } from "yaml";

// Sources that never explain an individual code; they no longer count as evidence.
const CATCH_ALL = new Set([
  "https://github.com/Wal33D/dtc-database",
  "https://en.wikipedia.org/wiki/On-board_diagnostics",
  "https://en.wikipedia.org/wiki/OBD-II_PIDs",
]);
const UA = "obdex-source-check/1.0 (+https://github.com/foerbsnavi/obdex)";

const file = process.argv[2];
if (!file) {
  console.error("usage: node tools/quellen_check.mjs <work.yaml>");
  process.exit(2);
}
const entries = parse(readFileSync(file, "utf8"));
if (!Array.isArray(entries) || entries.some((e) => !e || typeof e !== "object")) {
  console.error(`${file}: expected a list of code entries`);
  process.exit(2);
}

let problems = 0;
for (const e of entries) {
  const s = e.sources || [];
  const real = s.filter((u) => !CATCH_ALL.has(u));
  if (real.length < 2) {
    console.log(`${e.code}: only ${real.length} specific source(s)${s.length > real.length ? " (catch-all sources do not count)" : ""}`);
    problems++;
  }
}

const urls = [...new Set(entries.flatMap((e) => e.sources || []))];
async function check(url) {
  try {
    const res = await fetch(url, {
      redirect: "follow",
      headers: { "user-agent": UA },
      signal: AbortSignal.timeout(20000),
    });
    await res.body?.cancel();
    return res.status;
  } catch (err) {
    return `error: ${err.cause?.code || err.name}`;
  }
}
const results = await Promise.all(urls.map(async (u) => [u, await check(u)]));
for (const [u, status] of results) {
  const ok = status === 200;
  if (!ok) problems++;
  console.log(`${ok ? "ok " : "!! "} ${status}  ${u}`);
}
console.log(`\n${entries.length} codes, ${urls.length} distinct URLs, ${problems} problem(s)`);
process.exit(problems ? 1 : 0);
