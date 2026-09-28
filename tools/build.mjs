import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { build } from "vite";
const pages = process.argv.includes("--pages");
if (pages) process.env.PAGES_BUILD = "1";
await build();
const dir = pages ? "site" : "dist";
const files = [];
function walk(folder) {
  for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
    const file = path.join(folder, entry.name);
    if (entry.isDirectory()) walk(file);
    else files.push(path.relative(dir, file).replaceAll("\\", "/"));
  }
}
walk(dir);
const version = crypto
  .createHash("sha256")
  .update(
    files
      .map((f) => fs.readFileSync(path.join(dir, f)))
      .reduce((a, b) => Buffer.concat([a, b]), Buffer.alloc(0)),
  )
  .digest("hex")
  .slice(0, 12);
let worker = fs
  .readFileSync("src/service-worker.js", "utf8")
  .replace("__VERSION__", version)
  .replace("__FILES__", JSON.stringify(["./", ...files]));
fs.writeFileSync(path.join(dir, "sw.js"), worker);
if (pages) {
  // The existing Pages site publishes main/root. Keep its built entry and assets in sync.
  for (const file of [...files, "sw.js"]) {
    const target = path.resolve(file);
    if (!target.startsWith(process.cwd() + path.sep))
      throw Error("Invalid output path");
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(path.join(dir, file), target);
  }
  fs.writeFileSync(".nojekyll", "");
}
console.log(`Vue ${pages ? "Pages" : "server"} build ${version}`);
