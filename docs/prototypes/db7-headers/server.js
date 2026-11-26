// Stand-in for Netlify: serves ONLY ./app (the proposed publish folder) with the proposed DB-7 headers.
const http = require("http"), fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "app");
const CSP = process.env.CSP;
const HEADERS = {
  "Content-Security-Policy": CSP,
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  "X-Frame-Options": "DENY",
  "Cross-Origin-Opener-Policy": "same-origin",
};
const TYPES = { ".html": "text/html; charset=utf-8", ".woff2": "font/woff2", ".js": "text/javascript", ".json": "application/json" };
http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]); if (p === "/") p = "/index.html";
  const file = path.join(ROOT, p);
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404, HEADERS); return res.end("Not found"); }
  res.writeHead(200, { ...HEADERS, "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" }); fs.createReadStream(file).pipe(res);
}).listen(Number(process.env.PORT || 8790), "127.0.0.1");
