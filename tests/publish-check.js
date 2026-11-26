// DB-7 guard (DEC-031): fails if Netlify would publish anything other than the approved app files.
// Netlify publishes ONLY the folder named in netlify.toml; this test checks that setting and the folder's contents.
// Usage: node tests/publish-check.js [root]   (root defaults to the repository; tests/rollback-check.js reuses it)
"use strict";
const fs = require("fs"), path = require("path");
const root = path.resolve(process.argv[2] || path.join(__dirname, ".."));
// Approved published files. Adding a file here is a deliberate decision (e.g. the PWA stage adds manifest, sw.js, icons).
const ALLOWED = ["index.html", "fonts/inter-latin-wght-normal.woff2", "fonts/OFL-Inter.txt"];
const fail = msg => { console.error("FAIL  " + msg); process.exitCode = 1; };
const toml = fs.readFileSync(path.join(root, "netlify.toml"), "utf8");
const publish = (toml.match(/^\s*publish\s*=\s*"([^"]+)"/m) || [])[1];
if (publish !== "app") fail(`netlify.toml must publish "app" (found ${JSON.stringify(publish)})`);
if (/^\s*command\s*=/m.test(toml)) fail("netlify.toml must not define a build command (DEC-002, no build step)");
const walk = (d, base = "") => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name), base + e.name + "/") : [base + e.name]);
const published = walk(path.join(root, "app")).sort();
for (const f of published) if (!ALLOWED.includes(f)) fail(`app/${f} is not an approved published file`);
for (const f of ALLOWED) if (!published.includes(f)) fail(`approved file app/${f} is missing`);
for (const h of ["Content-Security-Policy", "X-Content-Type-Options", "Referrer-Policy", "Permissions-Policy", "X-Frame-Options", "Cross-Origin-Opener-Policy"])
  if (!new RegExp("^\\s*" + h + "\\s*=", "m").test(toml)) fail(`netlify.toml is missing the ${h} header`);
if (/script-src[^;"]*'self'(?![^;"]*'unsafe-inline')/.test(toml)) fail("strict script policy found: it would stop the current single-file app (DB-7 7.3)");
if (!process.exitCode) console.log(`PASS  only approved files are published from app/ (${published.length}: ${published.join(", ")}); netlify.toml publishes "app" with no build command and all 6 headers`);
