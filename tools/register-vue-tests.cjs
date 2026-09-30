"use strict";
const { registerHooks } = require("node:module");
const { readFileSync } = require("node:fs");
const { fileURLToPath } = require("node:url");
const { createHash } = require("node:crypto");
const { parse, compileScript } = require("vue/compiler-sfc");

// Compile real Vue components for Node's rendering tests, including nested imports.
// Keep normal JavaScript loading and the production build unchanged.
registerHooks({
  load(url, context, nextLoad) {
    if (!url.startsWith("file:") || !url.endsWith(".vue"))
      return nextLoad(url, context);
    const filename = fileURLToPath(url);
    const { descriptor, errors } = parse(readFileSync(filename, "utf8"), {
      filename,
    });
    if (errors.length) throw errors[0];
    const id = createHash("sha256").update(url).digest("hex").slice(0, 8);
    const compiled = compileScript(descriptor, {
      id,
      inlineTemplate: true,
    });
    return { format: "module", source: compiled.content, shortCircuit: true };
  },
});
