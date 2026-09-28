import fs from "node:fs";
const src = fs.readFileSync("domain.cjs", "utf8");
const out = [];
const re = /db\.(prepare|exec)\(/g;
let m;
while ((m = re.exec(src))) {
  const start = re.lastIndex;
  const q = src[start];
  if (q !== "'" && q !== '"' && q !== "`") continue;
  let i = start + 1,
    v = "";
  for (; i < src.length; i++) {
    const c = src[i];
    if (c === "\\") {
      v += src[i + 1];
      i++;
      continue;
    }
    if (c === q) break;
    v += c;
  }
  out.push({ kind: m[1], sql: v.replace(/\s+/g, " ").trim() });
}
const seen = new Set();
for (const { kind, sql } of out) {
  const key = kind + " " + sql;
  if (seen.has(key)) continue;
  seen.add(key);
  console.log(kind.toUpperCase().padEnd(7) + " " + sql);
}
console.log("\nTOTAL call sites: " + out.length + ", distinct: " + seen.size);
