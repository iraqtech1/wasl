import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
const html = fs.readFileSync("dist/index.html", "utf8");
assert.ok(html.includes('id="wasel-root"'));
for (const [, url] of html.matchAll(/(?:href|src)="([^"?#]+)[^"]*"/g)) {
  if (url === "/") continue;
  assert.ok(fs.existsSync(path.join("dist", url)), url);
}
function inspect(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, e.name);
    if (e.isDirectory()) inspect(file);
    else if (/\.(vue|js)$/.test(file)) {
      const text = fs.readFileSync(file, "utf8");
      assert.ok(
        !/innerHTML\s*=|v-html\s*=/.test(text),
        "Unsafe legacy rendering in " + file,
      );
    }
  }
}
inspect("src");
assert.ok(fs.readFileSync("platform.css", "utf8").includes("#00567a"));
assert.ok(fs.readFileSync("platform.css", "utf8").includes("#f47d2f"));
console.log("Vue entry, assets, render pipeline, and brand colors verified.");
