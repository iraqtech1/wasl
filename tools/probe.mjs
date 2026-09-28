import { build } from "vite";

const virtual = new Map([
  [
    "node:sqlite",
    `export class DatabaseSync{constructor(){}exec(){}prepare(){return{get:()=>null,all:()=>[],run:()=>({})}}}`,
  ],
  [
    "node:crypto",
    `const b={toString:()=> "00"};
     export function randomBytes(){return b;}
     export function scryptSync(){return b;}
     export function timingSafeEqual(){return true;}
     export function randomInt(){return 0;}`,
  ],
  ["node:fs", `export function mkdirSync(){}`],
  ["node:path", `export function join(...a){return a.join("/");}`],
]);

const probe = {
  name: "probe",
  enforce: "pre",
  resolveId(id) {
    return virtual.has(id) ? "\0" + id : null;
  },
  load(id) {
    return id.startsWith("\0") ? virtual.get(id.slice(1)) : null;
  },
};

try {
  await build({
    configFile: false,
    logLevel: "info",
    plugins: [probe],
    define: {
      __dirname: '"/"',
      "process.env.WASEL_DATA_DIR": '"/tmp/wasel-probe"',
    },
    build: {
      outDir: "tools/.probe",
      emptyOutDir: true,
      minify: false,
      lib: { entry: "domain.cjs", formats: ["es"], fileName: "probe" },
      commonjsOptions: { include: [/domain\.cjs$/, /node_modules/] },
    },
  });
  console.log("PROBE BUILD OK");
} catch (e) {
  console.log("PROBE BUILD FAILED:", e.message);
  process.exitCode = 1;
}
